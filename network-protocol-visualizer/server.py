#!/usr/bin/env python3
"""
NetLab: Network Architecture & Protocol Visualizer - Standalone HTTP Server
Zero-dependency Python 3 server supporting static files and live network inspection APIs.
"""

import http.server
import socketserver
import os
import sys
import json
import time
import urllib.parse
import webbrowser

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class NetLabHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/ping':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            payload = {
                "pong": True,
                "serverTime": int(time.time() * 1000),
                "message": "Pong response from Python NetLab Server"
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        if path == '/api/inspect':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            headers_dict = {k: v for k, v in self.headers.items()}
            payload = {
                "clientAddress": self.client_address[0],
                "clientPort": self.client_address[1],
                "method": self.command,
                "path": self.path,
                "headers": headers_dict,
                "server": "Python http.server (Zero Dependencies)"
            }
            self.wfile.write(json.dumps(payload, indent=2).encode('utf-8'))
            return

        if path.startswith('/api/status/'):
            try:
                code = int(path.split('/')[-1])
            except ValueError:
                code = 200
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            payload = {
                "statusCode": code,
                "timestamp": int(time.time() * 1000),
                "message": f"Simulated status {code}"
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        if path == '/api/delay':
            query = urllib.parse.parse_qs(parsed.query)
            delay_ms = min(max(int(query.get('ms', ['500'])[0]), 0), 5000)
            time.sleep(delay_ms / 1000.0)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            payload = {
                "delayedMs": delay_ms,
                "message": f"Paused for {delay_ms}ms to demonstrate TTFB"
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        # Serve static assets
        super().do_GET()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), NetLabHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"[NetLab Server] Listening at {url}")
        if "--open" in sys.argv:
            try:
                webbrowser.open(url)
            except Exception:
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server.")
            httpd.server_close()

if __name__ == "__main__":
    main()
