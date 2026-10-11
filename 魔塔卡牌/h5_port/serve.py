import http.server, functools, socketserver, json, os, socket, urllib.parse

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
    def do_GET(self):
        # 本地图片直读: /local?path=...
        if self.path.startswith('/local?'):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            path = q.get('path', [''])[0]
            ext = os.path.splitext(path)[1].lower()
            mime = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.bmp':'image/bmp','.webp':'image/webp'}.get(ext, 'application/octet-stream')
            try:
                with open(path, 'rb') as f: data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', mime)
                self.send_header('Cache-Control', 'no-store')
                self.end_headers()
                self.wfile.write(data)
            except Exception:
                self.send_response(404); self.end_headers()
            return
        # 本地目录浏览 API: /api/ls?path=...  (仅本机自用工具)
        if self.path.startswith('/api/ls?'):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query, encoding='utf8')
            path = q.get('path', [''])[0]
            try:
                path = os.path.abspath(path)
                entries = []
                for name in sorted(os.listdir(path)):
                    full = os.path.join(path, name)
                    if os.path.isdir(full):
                        entries.append({'name': name, 'dir': True, 'path': full})
                    elif name.lower().endswith(('.jpg','.jpeg','.png','.gif','.bmp','.webp')):
                        entries.append({'name': name, 'dir': False, 'path': full})
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'path': path, 'entries': entries}, ensure_ascii=False).encode('utf8'))
            except Exception as e:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}, ensure_ascii=False).encode('utf8'))
            return
        super().do_GET()

class S(socketserver.ThreadingTCPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    def server_bind(self):
        import socket as sk
        self.socket.setsockopt(sk.IPPROTO_IPV6, sk.IPV6_V6ONLY, 0)
        super().server_bind()

S(('::', 8234), functools.partial(H, directory='.')).serve_forever()
