"""
Minimal dev server that mimics the production nginx configuration:
serves the built frontend from dist/ and proxies /api/* to the backend.
"""

import http.server
import mimetypes
import os
import socket
import socketserver
import urllib.error
import urllib.request
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
BACKEND_URL = "http://127.0.0.1:8000"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIST), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.proxy()
            return
        # SPA fallback
        candidate = FRONTEND_DIST / self.path.lstrip("/")
        if not candidate.exists() or candidate.is_dir():
            self.path = "/"
        super().do_GET()

    def do_POST(self):
        self.proxy()

    def proxy(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        req = urllib.request.Request(
            BACKEND_URL + self.path,
            data=body,
            method=self.command,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    def log_message(self, format, *args):
        print(f"[dev-server] {self.address_string()} - {format % args}")


if __name__ == "__main__":
    PORT = 3000
    class DualStackServer(socketserver.TCPServer):
        address_family = socket.AF_INET6

        def server_bind(self):
            """Enable IPv4-mapped addresses so both ::1 and 127.0.0.1 work."""
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
            super().server_bind()

    httpd = DualStackServer(("::", PORT), Handler)
    try:
        print(f"MRPL dev server running at http://127.0.0.1:{PORT}")
        print(f"Serving: {FRONTEND_DIST}")
        print(f"Proxying /api/* -> {BACKEND_URL}")
        httpd.serve_forever()
    finally:
        httpd.server_close()