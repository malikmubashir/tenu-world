# scripts/security

Security tooling prototypes and audit briefs.

## mcp-audit-prompt-2026-04-21.json

Read-only MCP exposure audit brief authored 2026-04-21 in response to the
April 2026 MCP STDIO transport vulnerability (OX Security disclosure,
CVE-2026-30615 family).

Scope: verify Tenu has no MCP runtime dependency in production, inventory
MCP client configs on the dev workstation, scan for plaintext secrets in
those configs. All tasks are read-only — no modifications, rotations, or
deletions.

Status: audit completed; Tenu production MCP exposure confirmed nil.
