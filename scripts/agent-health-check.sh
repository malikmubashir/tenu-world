#!/bin/bash
# Agent Health Check — Tasks + Ollama connectivity
# Run: bash ~/Documents/Claude/Projects/Tenu.World/scripts/agent-health-check.sh

PSQL="/opt/homebrew/Cellar/libpq/18.3/bin/psql"
export PGPASSWORD=paperclip
DB="-h localhost -p 54329 -U paperclip -d paperclip"

echo "================================================"
echo "  PAPERCLIP AGENT HEALTH CHECK"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

# 1. Ollama connectivity
echo ""
echo "--- OLLAMA STATUS ---"
OLLAMA_RESP=$(curl -s --max-time 5 http://localhost:11434/api/tags 2>&1)
if echo "$OLLAMA_RESP" | grep -q '"models"'; then
    echo "✅ Ollama is UP"
    echo "$OLLAMA_RESP" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for m in data.get('models',[]):
    print(f\"   Model: {m['name']}  Size: {m.get('size',0)//1024//1024}MB\")
" 2>/dev/null || echo "   (could not parse model list)"

    # Check if model is loaded in VRAM
    RUNNING=$(curl -s --max-time 5 http://localhost:11434/api/ps 2>&1)
    echo ""
    echo "   Loaded in VRAM:"
    echo "$RUNNING" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for m in data.get('models',[]):
    vram = m.get('size_vram',0)//1024//1024
    print(f\"   → {m['name']}  VRAM: {vram}MB\")
if not data.get('models'): print('   → (none currently loaded)')
" 2>/dev/null || echo "   (could not parse)"
else
    echo "❌ Ollama is DOWN or unreachable"
    echo "   Response: $OLLAMA_RESP"
    echo "   Fix: run 'ollama serve' in a separate terminal"
fi

# 2. Agent list with adapter info
echo ""
echo "--- AGENTS & ADAPTERS ---"
$PSQL $DB -t -A -F '|' -c "
SELECT a.name, a.status, a.adapter_type,
       a.adapter_config->>'model' as model,
       a.budget_monthly_cents, a.spent_monthly_cents,
       CASE WHEN a.paused_at IS NOT NULL THEN 'PAUSED' ELSE 'active' END as pause_state
FROM agents a ORDER BY a.name;
" | while IFS='|' read -r name status adapter model budget spent pause; do
    [ -z "$name" ] && continue
    budget_str=""
    if [ "$budget" -gt 0 ] 2>/dev/null; then
        spent_d=$(echo "scale=2; ${spent:-0}/100" | bc)
        budget_d=$(echo "scale=0; $budget/100" | bc)
        budget_str=" [\$${spent_d}/\$${budget_d}]"
    fi
    echo "  $name"
    echo "    Status: $status | Adapter: $adapter | Model: ${model:-n/a} | $pause${budget_str}"
done

# 3. Issues assigned per agent
echo ""
echo "--- TASKS PER AGENT ---"
$PSQL $DB -t -A -F '|' -c "
SELECT COALESCE(a.name, '(unassigned)') as agent, i.status, i.title
FROM issues i
LEFT JOIN agents a ON i.assignee_agent_id = a.id
ORDER BY a.name, i.status, i.created_at;
" | while IFS='|' read -r agent status title; do
    [ -z "$agent" ] && continue
    echo "  [$status] $agent → $title"
done

# 4. Agents with NO tasks
echo ""
echo "--- AGENTS WITH ZERO TASKS ---"
$PSQL $DB -t -A -c "
SELECT a.name
FROM agents a
LEFT JOIN issues i ON i.assignee_agent_id = a.id
WHERE i.id IS NULL
ORDER BY a.name;
" | while read -r name; do
    [ -z "$name" ] && continue
    echo "  ⚠️  $name — no issues assigned"
done

# 5. Current wakeup request status
echo ""
echo "--- WAKEUP REQUESTS (last 20) ---"
$PSQL $DB -t -A -F '|' -c "
SELECT a.name, awr.status, awr.reason, awr.created_at::text
FROM agent_wakeup_requests awr
JOIN agents a ON awr.agent_id = a.id
ORDER BY awr.created_at DESC
LIMIT 20;
" | while IFS='|' read -r name status reason created; do
    [ -z "$name" ] && continue
    echo "  $name | $status | $reason | $created"
done

# 6. Currently running heartbeat runs
echo ""
echo "--- ACTIVE RUNS ---"
$PSQL $DB -t -A -F '|' -c "
SELECT a.name, hr.status, hr.started_at::text,
       EXTRACT(EPOCH FROM (NOW() - hr.started_at))::int as elapsed_sec,
       hr.process_pid
FROM heartbeat_runs hr
JOIN agents a ON hr.agent_id = a.id
WHERE hr.status IN ('running', 'queued')
ORDER BY hr.started_at;
" | while IFS='|' read -r name status started elapsed pid; do
    [ -z "$name" ] && continue
    elapsed_min=$((${elapsed:-0} / 60))
    echo "  $name | $status | ${elapsed_min}m elapsed | PID: ${pid:-n/a} | Started: $started"
done
ACTIVE_COUNT=$($PSQL $DB -t -A -c "SELECT COUNT(*) FROM heartbeat_runs WHERE status IN ('running','queued');")
echo "  Total active: ${ACTIVE_COUNT:-0}"

# 7. Ollama agent reachability test
echo ""
echo "--- OLLAMA INFERENCE TEST ---"
OLLAMA_TEST=$(curl -s --max-time 15 http://localhost:11434/api/generate -d '{"model":"gemma4:e4b","prompt":"Reply with OK","stream":false}' 2>&1)
if echo "$OLLAMA_TEST" | grep -q '"response"'; then
    RESP=$(echo "$OLLAMA_TEST" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response','')[:80])" 2>/dev/null)
    echo "✅ Ollama inference works. Response: $RESP"
else
    echo "❌ Ollama inference FAILED"
    echo "   Response: $(echo "$OLLAMA_TEST" | head -c 200)"
fi

echo ""
echo "================================================"
echo "  CHECK COMPLETE"
echo "================================================"
