#!/usr/bin/env python3
"""
tracker-refresh.py

Regenerates Tenu-Reste-a-Faire.xlsx from TASKS.md.

TASKS.md is the master. This xlsx is the human-readable mirror.
Run at the end of any session that mutated TASKS.md.

Usage:
    python3 scripts/tracker-refresh.py

Exit codes:
    0 success
    1 TASKS.md not found or unparseable
    2 openpyxl missing
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Optional

try:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
except ImportError:
    print("ERROR: openpyxl not installed. pip install openpyxl", file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent
TASKS_MD = REPO / "TASKS.md"
XLSX = REPO / "Tenu-Reste-a-Faire.xlsx"

STATUS_MAP = {
    " ": "Open",
    "x": "Done",
    "X": "Done",
    ">": "In Progress",
    "-": "Dropped",
}

PRIORITY_MAP = {
    "0": "P0 Blocker",
    "1": "P1 Important",
    "2": "P2 Post-launch",
}

# line like: - [ ] MH: Title body (p:0, due 2026-04-18) — trailing note
TASK_LINE = re.compile(
    r"^-\s+\[([ xX>\-])\]\s+(.*)$"
)
OWNER_PREFIX = re.compile(
    r"^(MH|CC)(?:\s*\([^)]+\))?:\s*(.*)$"
)
META_BLOCK = re.compile(
    r"\(([^)]*p:[012][^)]*)\)"
)
PRIORITY_RE = re.compile(r"p:([012])")
DUE_RE = re.compile(r"due\s+(\d{4}-\d{2}-\d{2})")


@dataclass
class Task:
    line_no: int
    section: str
    status: str
    owner: str
    title: str
    priority: Optional[str]
    due: Optional[date]
    note: str

    def task_id(self, idx: int) -> str:
        return f"T-{idx:03d}"


def parse_tasks(text: str) -> tuple[list[Task], dict]:
    tasks: list[Task] = []
    meta: dict = {}
    section = "(unsectioned)"
    for line_no, raw in enumerate(text.splitlines(), start=1):
        line = raw.rstrip()
        if line.startswith("# "):
            meta.setdefault("title", line[2:].strip())
            continue
        if line.startswith("## "):
            section = line[3:].strip()
            continue
        m = TASK_LINE.match(line)
        if not m:
            continue
        state_char, body = m.group(1), m.group(2).strip()
        status = STATUS_MAP.get(state_char, "Unknown")
        owner_match = OWNER_PREFIX.match(body)
        if not owner_match:
            continue
        owner = owner_match.group(1)
        rest = owner_match.group(2).strip()

        # First: extract the (p:X, due YYYY-MM-DD) block from anywhere in the body.
        # The metadata parenthesis can sit before or after the em dash separator.
        priority = None
        due: Optional[date] = None
        meta_match = META_BLOCK.search(rest)
        if meta_match:
            inner = meta_match.group(1)
            p = PRIORITY_RE.search(inner)
            d = DUE_RE.search(inner)
            if p:
                priority = PRIORITY_MAP.get(p.group(1))
            if d:
                try:
                    due = datetime.strptime(d.group(1), "%Y-%m-%d").date()
                except ValueError:
                    due = None
            # Remove the meta block from the body so it doesn't leak into title/note.
            rest = (rest[: meta_match.start()] + rest[meta_match.end():]).strip()
            # Tidy stray whitespace/punctuation left where the block used to sit.
            rest = re.sub(r"\s{2,}", " ", rest).strip(" ,")

        # Then: split trailing note on " — " (em dash with spaces). First occurrence
        # separates title from status note. Em dash is reserved for notes per
        # TASKS.md convention, so later em dashes inside notes are fine.
        if " — " in rest:
            title, _, note = rest.partition(" — ")
        else:
            title, note = rest, ""
        title = title.strip().rstrip(", ")
        note = note.strip()

        tasks.append(Task(
            line_no=line_no,
            section=section,
            status=status,
            owner=owner,
            title=title,
            priority=priority,
            due=due,
            note=note,
        ))
    return tasks, meta


# ---------- xlsx rendering ----------

PALETTE = {
    "navy": "FF0B1F3A",
    "paper": "FFF4F1EA",
    "emerald": "FF059669",
    "ink": "FF1D1D1F",
    "mute": "FFE5E7EB",
    "red": "FFB91C1C",
    "amber": "FFB45309",
    "green": "FF047857",
    "gray": "FF6B7280",
}

HEADER_FILL = PatternFill("solid", fgColor=PALETTE["navy"])
HEADER_FONT = Font(bold=True, color="FFFFFFFF", name="Inter", size=11)
CELL_FONT = Font(name="Inter", size=10, color=PALETTE["ink"])
SECTION_FONT = Font(bold=True, name="Inter", size=11, color=PALETTE["navy"])
TITLE_FONT = Font(bold=True, name="Inter", size=14, color=PALETTE["navy"])
SUBTITLE_FONT = Font(italic=True, name="Inter", size=10, color=PALETTE["gray"])

STATUS_FONT = {
    "Open": Font(name="Inter", size=10, color=PALETTE["ink"]),
    "In Progress": Font(bold=True, name="Inter", size=10, color=PALETTE["amber"]),
    "Done": Font(name="Inter", size=10, color=PALETTE["green"]),
    "Dropped": Font(italic=True, name="Inter", size=10, color=PALETTE["gray"]),
}


def set_col_widths(ws, widths: list[tuple[int, int]]):
    for col, width in widths:
        ws.column_dimensions[get_column_letter(col)].width = width


def render_summary(ws, tasks: list[Task], meta: dict):
    ws.title = "Priority Summary"
    ws["A1"] = "TENU.WORLD — TASK TRACKER"
    ws["A1"].font = TITLE_FONT
    today = date.today().isoformat()
    ws["A2"] = f"Regenerated {today} from TASKS.md. Master = TASKS.md. Do not edit xlsx directly."
    ws["A2"].font = SUBTITLE_FONT

    # counts
    open_tasks = [t for t in tasks if t.status in ("Open", "In Progress")]
    done_tasks = [t for t in tasks if t.status == "Done"]
    dropped = [t for t in tasks if t.status == "Dropped"]

    def count(predicate):
        return sum(1 for t in open_tasks if predicate(t))

    row = 4
    ws.cell(row=row, column=1, value="BY STATUS").font = SECTION_FONT
    row += 1
    for header in ["Status", "Count"]:
        c = ws.cell(row=row, column=["Status", "Count"].index(header) + 1, value=header)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
    row += 1
    for label, n in [
        ("Open", count(lambda t: t.status == "Open")),
        ("In Progress", count(lambda t: t.status == "In Progress")),
        ("Done", len(done_tasks)),
        ("Dropped", len(dropped)),
    ]:
        ws.cell(row=row, column=1, value=label).font = CELL_FONT
        ws.cell(row=row, column=2, value=n).font = CELL_FONT
        row += 1

    row += 1
    ws.cell(row=row, column=1, value="BY PRIORITY (open only)").font = SECTION_FONT
    row += 1
    for header in ["Priority", "Count", "Note"]:
        c = ws.cell(row=row, column=["Priority", "Count", "Note"].index(header) + 1, value=header)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
    row += 1
    notes = {
        "P0 Blocker": "Must clear before soft launch 11 May 2026",
        "P1 Important": "Nice to have at launch, not blocking",
        "P2 Post-launch": "After 11 May",
    }
    for label in ["P0 Blocker", "P1 Important", "P2 Post-launch"]:
        ws.cell(row=row, column=1, value=label).font = CELL_FONT
        ws.cell(row=row, column=2, value=count(lambda t, l=label: t.priority == l)).font = CELL_FONT
        ws.cell(row=row, column=3, value=notes[label]).font = CELL_FONT
        row += 1
    # priority None
    nless = count(lambda t: t.priority is None)
    if nless:
        ws.cell(row=row, column=1, value="No priority").font = CELL_FONT
        ws.cell(row=row, column=2, value=nless).font = CELL_FONT
        ws.cell(row=row, column=3, value="Tag with p:0, p:1 or p:2 in TASKS.md").font = CELL_FONT
        row += 1

    row += 1
    ws.cell(row=row, column=1, value="BY OWNER (open only)").font = SECTION_FONT
    row += 1
    for header in ["Owner", "Count"]:
        c = ws.cell(row=row, column=["Owner", "Count"].index(header) + 1, value=header)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
    row += 1
    for label in ["MH", "CC"]:
        ws.cell(row=row, column=1, value=label).font = CELL_FONT
        ws.cell(row=row, column=2, value=count(lambda t, l=label: t.owner == l)).font = CELL_FONT
        row += 1

    row += 1
    ws.cell(row=row, column=1, value="NEXT 7 DAYS (open + due within 7 days)").font = SECTION_FONT
    row += 1
    for header in ["Due", "Owner", "Priority", "Title"]:
        c = ws.cell(row=row, column=["Due", "Owner", "Priority", "Title"].index(header) + 1, value=header)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
    row += 1
    horizon = date.today().toordinal() + 7
    due_soon = [t for t in open_tasks if t.due and t.due.toordinal() <= horizon]
    due_soon.sort(key=lambda t: (t.due or date.max, t.priority or "ZZ"))
    if not due_soon:
        ws.cell(row=row, column=1, value="(nothing due in next 7 days)").font = CELL_FONT
        row += 1
    for t in due_soon:
        ws.cell(row=row, column=1, value=t.due.isoformat() if t.due else "").font = CELL_FONT
        ws.cell(row=row, column=2, value=t.owner).font = CELL_FONT
        ws.cell(row=row, column=3, value=t.priority or "").font = CELL_FONT
        ws.cell(row=row, column=4, value=t.title).font = CELL_FONT
        row += 1

    set_col_widths(ws, [(1, 22), (2, 14), (3, 18), (4, 90)])
    ws.freeze_panes = "A4"


def render_tasks_sheet(ws, tasks: list[Task], title: str, filter_fn):
    ws.title = title
    headers = ["ID", "Section", "Status", "Owner", "Priority", "Due", "Title", "Note"]
    for i, h in enumerate(headers, start=1):
        c = ws.cell(row=1, column=i, value=h)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
    filtered = [t for t in tasks if filter_fn(t)]
    for idx, t in enumerate(filtered, start=1):
        r = idx + 1
        ws.cell(row=r, column=1, value=t.task_id(idx)).font = CELL_FONT
        ws.cell(row=r, column=2, value=t.section).font = CELL_FONT
        sc = ws.cell(row=r, column=3, value=t.status)
        sc.font = STATUS_FONT.get(t.status, CELL_FONT)
        ws.cell(row=r, column=4, value=t.owner).font = CELL_FONT
        ws.cell(row=r, column=5, value=t.priority or "").font = CELL_FONT
        due_val = t.due.isoformat() if t.due else ""
        ws.cell(row=r, column=6, value=due_val).font = CELL_FONT
        title_cell = ws.cell(row=r, column=7, value=t.title)
        title_cell.font = CELL_FONT
        title_cell.alignment = Alignment(wrap_text=True, vertical="top")
        note_cell = ws.cell(row=r, column=8, value=t.note)
        note_cell.font = CELL_FONT
        note_cell.alignment = Alignment(wrap_text=True, vertical="top")
    set_col_widths(ws, [(1, 8), (2, 28), (3, 14), (4, 8), (5, 16), (6, 12), (7, 80), (8, 80)])
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{max(2, len(filtered) + 1)}"


def render(tasks: list[Task], meta: dict, path: Path):
    wb = Workbook()
    render_summary(wb.active, tasks, meta)
    render_tasks_sheet(wb.create_sheet(), tasks, "Open",
                        lambda t: t.status in ("Open", "In Progress"))
    render_tasks_sheet(wb.create_sheet(), tasks, "Done",
                        lambda t: t.status == "Done")
    render_tasks_sheet(wb.create_sheet(), tasks, "Dropped",
                        lambda t: t.status == "Dropped")
    wb.save(path)


def main() -> int:
    if not TASKS_MD.exists():
        print(f"ERROR: {TASKS_MD} not found", file=sys.stderr)
        return 1
    text = TASKS_MD.read_text(encoding="utf-8")
    tasks, meta = parse_tasks(text)
    if not tasks:
        print("WARNING: no tasks parsed from TASKS.md", file=sys.stderr)
    render(tasks, meta, XLSX)
    open_n = sum(1 for t in tasks if t.status in ("Open", "In Progress"))
    done_n = sum(1 for t in tasks if t.status == "Done")
    dropped_n = sum(1 for t in tasks if t.status == "Dropped")
    print(f"OK  {XLSX.name}  open={open_n}  done={done_n}  dropped={dropped_n}  total={len(tasks)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
