#!/usr/bin/env python3
"""
SQLi-Lab - Educational SQL Injection Web App Server
Provides an HTTP static server with custom headers and status logging.
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Security headers for local testing
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        super().end_headers()

    def log_message(self, format, *args):
        # Clean formatted console output
        sys.stdout.write(f"[SQLi-Lab HTTP] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 65)
        print("🚀 SQLi-Lab: Interactive SQL Injection Explainer Server")
        print(f"📡 Serving directory: {DIRECTORY}")
        print(f"🔗 Accessible at:    {url}")
        print(f"🛡️ Features:         10 Users, Auth Bypass, UNION Leakage, CTF Missions")
        print("=" * 65)
        print("Press Ctrl+C to stop the server.\n")

        # Automatically open browser if --open flag is passed
        if "--open" in sys.argv:
            try:
                webbrowser.open(url)
            except Exception:
                pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down SQLi-Lab server gracefully.")
            httpd.server_close()

if __name__ == "__main__":
    main()
