-- ═══════════════════════════════════════════════════════════════
-- RETIRED 2026-04-18. DO NOT INVOKE.
-- OpenAI plans cancelled, API keys revoked, all 10 Paperclip agents paused.
-- Embedded Postgres on :54329 no longer running.
-- Kept as historical reference. See docs/09-Paperclip-Retirement-Handover-2026-04-18.md
-- ═══════════════════════════════════════════════════════════════
SELECT a.name, hr.status,
  EXTRACT(EPOCH FROM (COALESCE(hr.finished_at, NOW()) - hr.started_at))::int AS seconds,
  LEFT(COALESCE(hr.error,''), 150) AS err,
  hr.started_at
FROM heartbeat_runs hr
JOIN agents a ON a.id = hr.agent_id
WHERE hr.started_at > NOW() - INTERVAL '10 minutes'
ORDER BY hr.started_at DESC
LIMIT 10;
