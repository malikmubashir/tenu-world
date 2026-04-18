#!/usr/bin/env python3
"""
tracker-serve.py

Live mode for the Tenu task dashboard. Re-parses TASKS.md on every
request so Cmd+R in the browser always shows the current state.

Usage:
    python3 scripts/tracker-serve.py            # default port 8765
    python3 scripts/tracker-serve.py 9000       # custom port

Open http://localhost:8765/ in a browser. Keep the tab open.
Leave this script running in a terminal. Ctrl+C to stop.

This does NOT touch dashboard.html or Tenu-Reste-a-Faire.xlsx. It serves
the dashboard purely from memory by reusing render_html() via a temp file.
"""

from __future__ import annotations

import http.server
import importlib.util
import socketserver
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
REFRESH_SCRIPT = REPO / "scripts" / "tracker-refresh.py"
TASKS_MD = REPO / "TASKS.md"


def _load_refresh_module():
    """Import tracker-refresh.py as a module (filename has a dash).

    Must register in sys.modules before exec_module — Python 3.10 dataclass()
    machinery reads the module back from sys.modules while defining @dataclass.
    """
    spec = importlib.util.spec_from_file_location("tracker_refresh", REFRESH_SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["tracker_refresh"] = mod
    spec.loader.exec_module(mod)
    return mod


tr = _load_refresh_module()


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ("/", "/index.html", "/dashboard.html"):
            self.send_response(404)
            self.end_headers()
            self.wfile.write("not found — try /".encode("utf-8"))
            return

        try:
            text = TASKS_MD.read_text(encoding="utf-8")
            tasks, meta = tr.parse_tasks(text)
            # render to a temp file then read it back
            with tempfile.NamedTemporaryFile("w", delete=False, suffix=".html", encoding="utf-8") as tmp:
                tmp_path = Path(tmp.name)
            tr.render_html(tasks, meta, tmp_path)
            html = tmp_path.read_text(encoding="utf-8")
            tmp_path.unlink(missing_ok=True)
        except Exception as exc:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(f"render failed: {exc}".encode())
            return

        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # quieter log format
        sys.stderr.write("[serve] " + (fmt % args) + "\n")


def main():
    port = 8765
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"invalid port: {sys.argv[1]}", file=sys.stderr)
            return 2
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"tenu tracker serving on http://localhost:{port}/")
        print(f"re-parsing {TASKS_MD} on every request")
        print("Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
            return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
