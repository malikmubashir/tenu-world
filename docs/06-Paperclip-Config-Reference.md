# Paperclip Configuration Reference

## Connection
- Dashboard: http://127.0.0.1:3100
- Postgres: localhost:54329 (user: paperclip, pass: paperclip, db: paperclip)
- Company prefix: GLO
- Company ID: 3b681ab8-f2a6-4889-b09f-19dac62027d1

## psql shortcut
```bash
PGPASSWORD=paperclip /opt/homebrew/Cellar/libpq/18.3/bin/psql -h localhost -p 54329 -U paperclip -d paperclip
```

## Active agents (Option C)
| Agent | Adapter | Model | Status |
|-------|---------|-------|--------|
| CEO | codex_local | gpt-4o-mini | ACTIVE |
| CTO | codex_local | gpt-4o-mini | ACTIVE |
| Head of Product | ollama | gemma4:e4b | PAUSED |
| Head of Marketing | ollama | gemma4:e4b | PAUSED |
| Head of Finance | ollama | gemma4:e4b | PAUSED |
| Head of Governance | ollama | gemma4:e4b | PAUSED |
| Head of HR | ollama | gemma4:e4b | PAUSED |
| Senior Web Dev | ollama | gemma4:e4b | PAUSED |
| Senior iOS Dev | ollama | gemma4:e4b | PAUSED |
| Senior Android Dev | ollama | gemma4:e4b | PAUSED |

## codex_local adapter_config fields
| Field | Type | Notes |
|-------|------|-------|
| model | string | OpenAI model name (e.g. gpt-4o-mini) |
| timeoutSec | number | NOT `timeout` |
| cwd | string | Working directory path |
| dangerouslyBypassApprovalsAndSandbox | boolean | Bypasses approval prompts |
| extraArgs | string[] | CLI flags (e.g. --skip-git-repo-check) |
| env | object | Env vars injected into Codex process |
| graceSec | number | Grace period before kill |

## Codex CLI auth
File: `~/.codex/auth.json`

Valid `auth_mode` values: `apikey`, `chatgpt`, `chatgptAuthTokens`

For API key mode:
```json
{
  "auth_mode": "apikey",
  "OPENAI_API_KEY": "sk-proj-..."
}
```

## Wakeup mechanism
Agents need rows in `agent_wakeup_requests` with status='queued'.
Must include `company_id` (NOT NULL constraint).
Heartbeat scheduler ticks every 30 seconds.

### Manual wakeup SQL
```sql
INSERT INTO agent_wakeup_requests (agent_id, company_id, source, status, created_at)
SELECT a.id, a.company_id, 'manual_test', 'queued', NOW()
FROM agents a WHERE a.name = 'CEO';
```

### Check run status
```sql
SELECT status, started_at, finished_at,
       EXTRACT(EPOCH FROM (COALESCE(finished_at, NOW()) - started_at))::int as seconds,
       LEFT(error, 150) as error
FROM heartbeat_runs
WHERE agent_id = (SELECT id FROM agents WHERE name = 'CEO')
ORDER BY started_at DESC LIMIT 5;
```

## API routes
- Heartbeat invoke: `/api/agents/{id}/heartbeat/invoke` (returns 202)
- Agent listing: `/api/companies/{cid}/agents`
