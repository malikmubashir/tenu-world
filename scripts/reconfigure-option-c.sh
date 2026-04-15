#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TENU — Option C Reconfiguration
# Switches CEO + CTO to codex_local (gpt-4o-mini via OpenAI API)
# Requires: ~/.codex/auth.json with auth_mode=apikey and valid OPENAI_API_KEY
# Pauses all other Ollama agents
# Cleans stale issues
# ═══════════════════════════════════════════════════════════════

PSQL="/opt/homebrew/Cellar/libpq/18.3/bin/psql"
export PGPASSWORD=paperclip
DB="-h localhost -p 54329 -U paperclip -d paperclip"

echo "================================================"
echo "  OPTION C RECONFIGURATION"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

# Step 0: Show current state
echo ""
echo "--- BEFORE ---"
$PSQL $DB -c "
SELECT name, adapter_type, adapter_config->>'model' as model,
       CASE WHEN paused_at IS NOT NULL THEN 'PAUSED' ELSE 'ACTIVE' END as state,
       budget_monthly_cents/100 as budget_usd, spent_monthly_cents/100 as spent_usd
FROM agents ORDER BY name;
"

# Step 1: Cancel all queued wakeup requests
echo "Step 1: Cancelling queued wakeup requests..."
$PSQL $DB -c "UPDATE agent_wakeup_requests SET status = 'cancelled' WHERE status = 'queued';"

# Step 2: Kill any running heartbeat runs (they'll fail anyway)
echo "Step 2: Marking orphaned running runs as failed..."
$PSQL $DB -c "
UPDATE heartbeat_runs SET status = 'failed', error = 'Cancelled: Option C reconfiguration', finished_at = NOW()
WHERE status = 'running';
"

# Step 3: Switch CEO to codex_local with gpt-4o-mini
echo "Step 3: Switching CEO to codex_local / gpt-4o-mini..."
$PSQL $DB -c "
UPDATE agents SET
  adapter_type = 'codex_local',
  adapter_config = jsonb_build_object(
    'model', 'gpt-4o-mini',
    'timeoutSec', 900,
    'cwd', '/Users/mmh/Documents/Claude/Projects/Tenu.World',
    'dangerouslyBypassApprovalsAndSandbox', true,
    'extraArgs', jsonb_build_array('--skip-git-repo-check')
  ),
  paused_at = NULL,
  pause_reason = NULL
WHERE name = 'CEO';
"

# Step 4: Switch CTO to codex_local with gpt-4o-mini
echo "Step 4: Switching CTO to codex_local / gpt-4o-mini..."
$PSQL $DB -c "
UPDATE agents SET
  adapter_type = 'codex_local',
  adapter_config = jsonb_build_object(
    'model', 'gpt-4o-mini',
    'timeoutSec', 900,
    'cwd', '/Users/mmh/Documents/Claude/Projects/Tenu.World',
    'dangerouslyBypassApprovalsAndSandbox', true,
    'extraArgs', jsonb_build_array('--skip-git-repo-check')
  ),
  spent_monthly_cents = 0,
  paused_at = NULL,
  pause_reason = NULL
WHERE name = 'CTO';
"

# Step 5: Pause all OTHER agents (the old Ollama ones)
echo "Step 5: Pausing all non-CEO/CTO agents..."
$PSQL $DB -c "
UPDATE agents SET paused_at = NOW(), pause_reason = 'option_c_governance_only'
WHERE name NOT IN ('CEO', 'CTO') AND paused_at IS NULL;
"

# Step 6: Clean stale issues
echo "Step 6: Archiving stale backlog issues..."
$PSQL $DB -c "
-- Close CTO hire directive and operating directive (done)
UPDATE issues SET status = 'done' WHERE title LIKE '%Hire 3 Development%' AND status = 'backlog';
UPDATE issues SET status = 'done' WHERE title LIKE '%OPERATING DIRECTIVE%' AND status = 'backlog';
-- Archive unassigned backlog
UPDATE issues SET status = 'done' WHERE assignee_agent_id IS NULL AND status = 'backlog';
"

# Step 7: Reassign in_progress issues from paused agents to CEO for tracking
echo "Step 7: Moving in_progress issues from paused agents to CEO tracking..."
$PSQL $DB -c "
UPDATE issues SET status = 'todo'
WHERE assignee_agent_id IN (
  SELECT id FROM agents WHERE paused_at IS NOT NULL
) AND status = 'in_progress';
"

echo ""
echo "--- AFTER ---"
$PSQL $DB -c "
SELECT name, adapter_type, adapter_config->>'model' as model,
       CASE WHEN paused_at IS NOT NULL THEN 'PAUSED' ELSE 'ACTIVE' END as state,
       budget_monthly_cents/100 as budget_usd, spent_monthly_cents/100 as spent_usd
FROM agents ORDER BY name;
"

echo ""
echo "--- ISSUE STATUS ---"
$PSQL $DB -c "
SELECT status, COUNT(*) FROM issues GROUP BY status ORDER BY status;
"

echo ""
echo "--- REMAINING ACTIVE ISSUES ---"
$PSQL $DB -c "
SELECT COALESCE(a.name, 'unassigned') as agent, i.status, i.title
FROM issues i
LEFT JOIN agents a ON i.assignee_agent_id = a.id
WHERE i.status NOT IN ('done')
ORDER BY a.name, i.status;
"

echo ""
echo "================================================"
echo "  RECONFIGURATION COMPLETE"
echo "  CEO + CTO now on gpt-4o-mini via OpenAI API"
echo "  Ensure ~/.codex/auth.json has auth_mode=apikey"
echo "================================================"
