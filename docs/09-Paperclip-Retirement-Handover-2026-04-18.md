# Paperclip retirement — final handover

**Date:** 2026-04-18
**Decision owner:** Dr Mubashir
**Author:** Claude (Cowork)
**Status:** Ready to execute — no residual agent work remains

---

## 1. Do we need Paperclip agents to execute anything?

**No.** Evidence, triangulated:

**a. Empirical failure (documented 2026-04-17).** 14 issues dispatched to CEO + CTO via the canonical checkout endpoint. All 14 woke, replied in chat, produced 0 files, called 0 tools. ~20,700 tokens in, ~100 tokens out per run. gpt-4o-mini treats wakeups as notifications, not as execution commands. Retiring to Cowork already delivered every one of those 14 artifacts (commit `5b3ac8a` drafts, `fb514e9` live legal routes).

**b. Authoritative task list (`TASKS.md`, 2026-04-17).** Every open item is owned by `MH:` (Dr Mubashir) or `CC:` (Claude/Cowork). Zero items are owned by CEO, CTO, or any of the 8 Ollama agents. The human-maintained plan has no dependency on Paperclip.

**c. Paperclip DB state after 2026-04-17 migration.** All 10 agents carry `paused_at IS NOT NULL`. All 14 launch-gate issues moved to `status='done'` with `issue_comments` rows pointing to the Cowork commit that delivered each. `agent_wakeup_requests` table has zero rows in `queued` state for CEO/CTO.

**Conclusion.** The agents are a stranded asset. Keeping them "in case we need them" costs money for zero probability of useful work under the current adapter. If autonomous execution is ever reattempted, it will require a different adapter (claude_code or gpt-4.1 + imperative prompting) and a fresh throwaway test. That decision is post-launch, not now.

---

## 2. What is still alive today

| Component | Purpose | LLM calls? | Kill? |
|---|---|---|---|
| `com.globalapex.governance-sync` LaunchAgent | 30-min Postgres → Excel + Telegram | **None** | Yes (Telegram loss is acceptable; Excel is already canonical on disk) |
| `com.globalapex.paperclip-monitor` LaunchAgent | 5-min Postgres poll → Telegram alerts | **None** | Yes (no agents running → no alerts to raise) |
| Paperclip web server on `:3100` | Read-only dashboard | None | Yes (no reason to keep) |
| Embedded Postgres on `:54329` | Source of truth for agent/issue tables | None | Yes, after export (see §4) |
| `~/.codex/auth.json` | Holds OPENAI_API_KEY for codex_local adapter | Yes, if any agent wakes | **Yes — delete** |
| OpenAI API key (platform-side) | Root credential | Yes, wherever it's used | **Rotate or revoke** |

**Important finding on the €15 charge.** `governance-sync.py` and `paperclip-monitor.py` make **zero** calls to OpenAI or Anthropic. Both only query local Postgres and post to Telegram (free API). So the April charge is **not** coming from these LaunchAgents. Likely sources, ranked:

1. Residual billing for 15-17 April experimentation when agents were briefly running on `codex_local` / gpt-4o-mini. OpenAI bills in arrears.
2. Interactive `codex` CLI usage (if you ran the Codex CLI yourself against `OPENAI_API_KEY` this month).
3. Another tool on the system loading the same key (ChatGPT desktop does NOT charge against API; only pay-as-you-go calls do).

Rotate the key anyway. If bleeding continues after rotation, something else still has the new key.

---

## 3. Where open work lives after shutdown

Nothing is lost by shutting down the DB. Canonical sources of truth after retirement:

1. **`/TASKS.md`** — human-maintained master plan. This is what you and I both follow.
2. **`Tenu-Reste-a-Faire.xlsx`** — workbook already on disk with `Paperclip Status`, `Run History`, `Reste-à-Faire` sheets. Frozen snapshot is preserved before shutdown (see §4 step 2).
3. **GitHub issues** in `malikmubashir/tenu-world` (if used — verify). Git history + commit messages are permanent.
4. **Asana "Tenu — Launch" project** — 42 tasks, original plan from April. Still exists as external backup.

Paperclip's `issues` and `issue_comments` tables carry audit trail for the 14 items closed on 2026-04-17. They are referenced in `project_tenu_paperclip_retired_2026_04_17.md` memory. Export to CSV before shutdown so audit survives DB deletion.

---

## 4. Teardown sequence (Dr Mubashir to execute)

Run these on your Mac terminal, in order. Stop if any step errors and ping me.

### Step 1 — Rotate the OpenAI key immediately

```bash
# Open the dashboard, revoke the current key, do NOT generate a new one.
open https://platform.openai.com/api-keys
```

This alone stops all future OpenAI billing regardless of what's running. Do this FIRST, before any other step. Everything else is cleanup.

### Step 2 — Export the Paperclip issue audit trail to CSV

```bash
PGPASSWORD=paperclip /opt/homebrew/Cellar/libpq/18.3/bin/psql \
  -h 127.0.0.1 -p 54329 -U paperclip -d paperclip \
  -c "\COPY (SELECT i.id, i.title, i.status, i.created_at, i.completed_at, \
              a.name as assignee, ic.body as audit_comment \
       FROM issues i \
       LEFT JOIN agents a ON i.assignee_agent_id = a.id \
       LEFT JOIN issue_comments ic ON ic.issue_id = i.id \
       ORDER BY i.created_at) \
       TO '/Users/mmh/Documents/Claude/Projects/Tenu.World/docs/paperclip-audit-export-2026-04-18.csv' WITH CSV HEADER;"
```

Verify the file exists and has rows before moving on.

### Step 3 — Unload both LaunchAgents

```bash
launchctl unload ~/Library/LaunchAgents/com.globalapex.governance-sync.plist 2>/dev/null
launchctl unload ~/Library/LaunchAgents/com.globalapex.paperclip-monitor.plist 2>/dev/null

# Verify both gone
launchctl list | grep -E 'governance-sync|paperclip-monitor' || echo "OK — no Paperclip LaunchAgents loaded"
```

### Step 4 — Remove the plist files (optional, cleaner)

```bash
rm -f ~/Library/LaunchAgents/com.globalapex.governance-sync.plist
rm -f ~/Library/LaunchAgents/com.globalapex.paperclip-monitor.plist
```

### Step 5 — Stop the Paperclip server and Postgres

Paperclip and its embedded Postgres run from `~/.paperclip/`. Check how it was started:

```bash
# Check if Paperclip has its own LaunchAgent
launchctl list | grep -i paperclip

# Find the process
ps aux | grep -E 'paperclip|54329' | grep -v grep
```

If there is a Paperclip LaunchAgent, `launchctl unload` it the same way. If it runs in the foreground of a terminal, close that terminal. If it runs as a standalone node/python process, `kill <pid>`.

### Step 6 — Remove the OpenAI auth file

```bash
rm -f ~/.codex/auth.json
```

This prevents any lingering codex CLI invocation from succeeding against the (now-revoked) key.

### Step 7 — Archive the Paperclip data directory

```bash
mv ~/.paperclip ~/.paperclip-archive-2026-04-18
```

Don't delete. Keeps the run logs, NDJSON traces, and Postgres data files for forensic reference if you ever want to review what the agents actually did. You can rm -rf it in six months if nothing has referenced it.

### Step 8 — Sanity sweep

```bash
grep -r "OPENAI_API_KEY" ~/Documents/Claude/Projects/Tenu.World/ 2>/dev/null \
  | grep -v node_modules | grep -v .next

# Check nothing in the repo still reads the key
grep -r "openai\|gpt-4o-mini" ~/Documents/Claude/Projects/Tenu.World/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null \
  | grep -v node_modules | grep -v .next
```

Expected output: both commands return empty (or only match `scripts/reconfigure-option-c.sh` which is a historical shell script, safe). The Tenu Next.js codebase uses Anthropic only.

### Step 9 — Verify bleed-stop after 24h

```bash
open https://platform.openai.com/usage
```

Check spend for 2026-04-19 and 2026-04-20. If it is zero (modulo residual batch settlement), teardown is complete. If any spend appears, something else is still using a key you missed.

---

## 5. What you lose and do not lose

**Lose:**
- Telegram "governance report" every 30 min. You can replicate this with a weekly manual review of TASKS.md or by having me generate it on demand.
- Live Paperclip dashboard view. Unused for execution anyway.
- The option to re-enable gpt-4o-mini agents without re-installing Paperclip. Acceptable — that option has zero expected value.

**Do not lose:**
- Any launch-gate artifact (all 14 delivered by Cowork, committed).
- Any task tracking (TASKS.md + Tenu-Reste-a-Faire.xlsx + GitHub + Asana).
- Audit trail (exported to CSV in step 2).
- Any real code or legal content. Nothing of value lives only in Paperclip.

---

## 6. Decision point

You authorized full retirement. This document is the handover. Execute steps 1-9 on your Mac, paste any error output back to me, and we close the file.

If you want me to also remove the Paperclip-related scripts (`scripts/paperclip-monitor.py`, `scripts/governance-sync.py`, `scripts/reconfigure-option-c.sh`, etc.) from the Tenu repo itself, say so and I'll commit a clean-up PR on `dev`. My recommendation: leave them in `scripts/` as historical artifacts. They don't run unless invoked, and they document a design decision that a future you might want to review.
