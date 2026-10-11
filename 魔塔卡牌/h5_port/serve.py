import http.server, functools, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()
class S(socketserver.TCPServer):
    address_family = __import__('socket').AF_INET6
    allow_reuse_address = True
    def server_bind(self):
        import socket
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()
S(('::', 8234), functools.partial(H, directory='.')).serve_forever()
