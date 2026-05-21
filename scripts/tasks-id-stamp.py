#!/usr/bin/env python3
"""
Idempotent #TNNN stamper for TASKS.md.

Walks every task line; if it lacks a #TNNN ID right after the owner colon,
assigns the next available number from .tasks-id-counter. IDs never reused.

Run after appending new tasks to TASKS.md, then before regenerating the dashboard.
"""
import re, pathlib, sys

REPO = pathlib.Path(__file__).resolve().parent.parent
TASKS = REPO / 'TASKS.md'
COUNTER = REPO / '.tasks-id-counter'

if not COUNTER.exists():
    print("ERROR: .tasks-id-counter missing. Aborting to avoid ID collisions.", file=sys.stderr)
    sys.exit(1)

next_id = int(COUNTER.read_text().strip())
raw = TASKS.read_text()
out = []
stamped = 0
for line in raw.splitlines():
    m = re.match(r'^(\- \[( |>|x|\-)\] (?:MH|CC)(?: \(nights\))?: )(.+)$', line)
    if not m:
        out.append(line); continue
    prefix, _status, body = m.groups()
    if re.match(r'#T\d{3}\s', body):
        out.append(line); continue  # Already stamped
    out.append(prefix + f"#T{next_id:03d} {body}")
    next_id += 1
    stamped += 1

TASKS.write_text('\n'.join(out) + '\n')
COUNTER.write_text(str(next_id) + '\n')
print(f"Stamped {stamped} new task line(s). Next available: #T{next_id:03d}", file=sys.stderr)
