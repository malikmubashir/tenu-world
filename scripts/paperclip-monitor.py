#!/usr/bin/env python3
"""
Paperclip Agent Monitor — Telegram Alert System
Queries Paperclip's embedded Postgres every 5 minutes.
Sends Telegram alerts for: failed runs, stalled runs, budget breaches, pending approvals.

Setup:
  1. Create bot via @BotFather on Telegram → get BOT_TOKEN
  2. Message the bot, then visit https://api.telegram.org/bot<TOKEN>/getUpdates → get CHAT_ID
  3. Set env vars or edit ~/.paperclip-monitor.env
  4. Install as LaunchAgent (see companion .plist file)

Usage:
  python3 paperclip-monitor.py          # one-shot check
  python3 paperclip-monitor.py --loop   # continuous 5-min loop
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# --- Configuration ---
ENV_FILE = Path.home() / ".paperclip-monitor.env"
STATE_FILE = Path.home() / ".paperclip-monitor-state.json"

# Postgres connection (Paperclip embedded)
PG_HOST = "localhost"
PG_PORT = "54329"
PG_USER = "paperclip"
PG_DB = "paperclip"
PG_PASS = "paperclip"
PSQL_BIN = "/opt/homebrew/Cellar/libpq/18.3/bin/psql"

# Thresholds
STALL_MINUTES = 12          # run considered stalled after this
BUDGET_WARN_PERCENT = 80    # alert when agent hits this % of monthly budget
CHECK_INTERVAL_SEC = 300    # 5 minutes

# --- Load environment ---
def load_env():
    """Load TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from env file or environment."""
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        print("ERROR: Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in ~/.paperclip-monitor.env")
        sys.exit(1)
    return token, chat_id


# --- State management (avoid duplicate alerts) ---
def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            return {}
    return {}

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))

def already_alerted(state, key):
    return key in state.get("alerted", {})

def mark_alerted(state, key, message):
    if "alerted" not in state:
        state["alerted"] = {}
    state["alerted"][key] = {
        "at": datetime.now(timezone.utc).isoformat(),
        "msg": message[:100]
    }

def prune_old_alerts(state, max_age_hours=24):
    """Remove alert records older than max_age_hours so they can re-fire."""
    if "alerted" not in state:
        return
    now = datetime.now(timezone.utc)
    to_remove = []
    for key, val in state["alerted"].items():
        try:
            alerted_at = datetime.fromisoformat(val["at"])
            if (now - alerted_at).total_seconds() > max_age_hours * 3600:
                to_remove.append(key)
        except Exception:
            to_remove.append(key)
    for key in to_remove:
        del state["alerted"][key]


# --- Postgres query helper ---
def pg_query(sql):
    """Run SQL against Paperclip's embedded Postgres, return rows as list of dicts."""
    env = os.environ.copy()
    env["PGPASSWORD"] = PG_PASS
    cmd = [
        PSQL_BIN, "-h", PG_HOST, "-p", PG_PORT, "-U", PG_USER, "-d", PG_DB,
        "-t",   # tuples only
        "-A",   # unaligned
        "-F", "\t",  # tab separator
        "-c", sql
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15, env=env)
        if result.returncode != 0:
            print(f"PSQL error: {result.stderr.strip()}")
            return []
        rows = []
        for line in result.stdout.strip().splitlines():
            if line.strip():
                rows.append(line.split("\t"))
        return rows
    except subprocess.TimeoutExpired:
        print("PSQL query timed out")
        return []
    except FileNotFoundError:
        print(f"psql not found at {PSQL_BIN}")
        return []


# --- Telegram sender ---
def send_telegram(token, chat_id, message):
    """Send a message via Telegram Bot API."""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    # Use plain text — Markdown parse_mode breaks on special chars in error messages
    data = json.dumps({
        "chat_id": chat_id,
        "text": message,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except urllib.error.URLError as e:
        print(f"Telegram send failed: {e}")
        return False


# --- Check functions ---
def check_failed_runs(state, token, chat_id):
    """Alert on runs that failed in the last check interval."""
    rows = pg_query(f"""
        SELECT a.name, hr.id, hr.error, hr.error_code, hr.finished_at::text
        FROM heartbeat_runs hr
        JOIN agents a ON hr.agent_id = a.id
        WHERE hr.status IN ('failed', 'timed_out')
        AND hr.finished_at > NOW() - INTERVAL '{CHECK_INTERVAL_SEC + 60} seconds'
        ORDER BY hr.finished_at DESC
        LIMIT 10;
    """)
    for row in rows:
        if len(row) < 5:
            continue
        agent, run_id, error, error_code, finished = row
        alert_key = f"fail:{run_id}"
        if already_alerted(state, alert_key):
            continue
        msg = (
            f"🔴 *Agent Failed*\n"
            f"Agent: {agent}\n"
            f"Error: {error or 'unknown'}\n"
            f"Code: {error_code or 'none'}\n"
            f"Run: `{run_id[:8]}`\n"
            f"At: {finished}"
        )
        if send_telegram(token, chat_id, msg):
            mark_alerted(state, alert_key, msg)


def check_stalled_runs(state, token, chat_id):
    """Alert on runs that have been 'running' for too long."""
    rows = pg_query(f"""
        SELECT a.name, hr.id,
               EXTRACT(EPOCH FROM (NOW() - hr.started_at))::int as elapsed_sec,
               hr.started_at::text
        FROM heartbeat_runs hr
        JOIN agents a ON hr.agent_id = a.id
        WHERE hr.status = 'running'
        AND hr.started_at < NOW() - INTERVAL '{STALL_MINUTES} minutes'
        ORDER BY hr.started_at;
    """)
    for row in rows:
        if len(row) < 4:
            continue
        agent, run_id, elapsed, started = row
        alert_key = f"stall:{run_id}"
        if already_alerted(state, alert_key):
            continue
        elapsed_min = int(elapsed) // 60
        msg = (
            f"⚠️ *Stalled Run*\n"
            f"Agent: {agent}\n"
            f"Running for: {elapsed_min} minutes\n"
            f"Started: {started}\n"
            f"Run: `{run_id[:8]}`\n"
            f"Action needed: check Ollama or kill the run."
        )
        if send_telegram(token, chat_id, msg):
            mark_alerted(state, alert_key, msg)


def check_budget_breaches(state, token, chat_id):
    """Alert when an agent's spend exceeds threshold % of budget."""
    rows = pg_query(f"""
        SELECT name, budget_monthly_cents, spent_monthly_cents
        FROM agents
        WHERE budget_monthly_cents > 0
        AND spent_monthly_cents::float / budget_monthly_cents * 100 >= {BUDGET_WARN_PERCENT};
    """)
    for row in rows:
        if len(row) < 3:
            continue
        agent, budget, spent = row
        alert_key = f"budget:{agent}:{budget}"
        if already_alerted(state, alert_key):
            continue
        pct = round(float(spent) / float(budget) * 100, 1)
        msg = (
            f"💰 *Budget Warning*\n"
            f"Agent: {agent}\n"
            f"Spent: ${float(spent)/100:.2f} / ${float(budget)/100:.2f} ({pct}%)\n"
            f"Action: review spend or increase budget cap."
        )
        if send_telegram(token, chat_id, msg):
            mark_alerted(state, alert_key, msg)


def check_pending_approvals(state, token, chat_id):
    """Alert on approvals waiting for human decision."""
    rows = pg_query("""
        SELECT COALESCE(a.name, 'unknown'), ap.id, ap.created_at::text,
               EXTRACT(EPOCH FROM (NOW() - ap.created_at))::int as wait_sec
        FROM approvals ap
        LEFT JOIN agents a ON ap.requested_by_agent_id = a.id
        WHERE ap.status = 'pending'
        ORDER BY ap.created_at
        LIMIT 5;
    """)
    for row in rows:
        if len(row) < 4:
            continue
        agent, approval_id, created, wait_sec = row
        alert_key = f"approval:{approval_id}"
        if already_alerted(state, alert_key):
            continue
        wait_min = int(wait_sec) // 60
        msg = (
            f"🟡 *Decision Needed*\n"
            f"Agent: {agent}\n"
            f"Waiting: {wait_min} minutes\n"
            f"Approval: `{approval_id[:8]}`\n"
            f"Open Paperclip dashboard to review."
        )
        if send_telegram(token, chat_id, msg):
            mark_alerted(state, alert_key, msg)


def check_ollama_health(state, token, chat_id):
    """Alert if Ollama is unreachable."""
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                # Ollama is up — clear any previous down alert
                if "alerted" in state and "ollama:down" in state["alerted"]:
                    del state["alerted"]["ollama:down"]
                return
    except Exception:
        pass

    alert_key = "ollama:down"
    if already_alerted(state, alert_key):
        return
    msg = (
        f"🔴 *Ollama Down*\n"
        f"Cannot reach Ollama at localhost:11434.\n"
        f"All Ollama agents will fail until this is resolved.\n"
        f"Action: restart Ollama (`ollama serve`)."
    )
    if send_telegram(token, chat_id, msg):
        mark_alerted(state, alert_key, msg)


# --- Main ---
def run_checks():
    token, chat_id = load_env()
    state = load_state()
    prune_old_alerts(state)

    check_ollama_health(state, token, chat_id)
    check_failed_runs(state, token, chat_id)
    check_stalled_runs(state, token, chat_id)
    check_budget_breaches(state, token, chat_id)
    check_pending_approvals(state, token, chat_id)

    state["last_check"] = datetime.now(timezone.utc).isoformat()
    save_state(state)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Check complete.")


if __name__ == "__main__":
    if "--loop" in sys.argv:
        print(f"Paperclip Monitor running (every {CHECK_INTERVAL_SEC}s). Ctrl+C to stop.")
        while True:
            try:
                run_checks()
                time.sleep(CHECK_INTERVAL_SEC)
            except KeyboardInterrupt:
                print("\nStopped.")
                break
    else:
        run_checks()
