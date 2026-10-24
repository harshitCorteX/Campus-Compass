"""Campus Compass: Python web server and search API, without pip dependencies."""
from dataclasses import asdict
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import math
import argparse
from search import sample_campus, search

ROOT = Path(__file__).resolve().parent
CAMPUS = sample_campus()


class Handler(SimpleHTTPRequestHandler):
    def json_response(self, data, status=200):
        body = json.dumps(data, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/health':
            return self.json_response({'engine': 'Python', 'ready': True})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/search':
            return self.json_response({'error': 'Unknown endpoint'}, 404)
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size < 100_000:
                raise ValueError('Invalid request size')
            data = json.loads(self.rfile.read(size))
            crowds = {tuple(k.split('|')): v for k,v in data.get('crowds', {}).items()}
            blocked = [k.split('|') if isinstance(k,str) else k for k in data.get('blocked', [])]
            result = asdict(search(CAMPUS, data['start'], data['goal'], data.get('algorithm','A*'),
                                   data.get('mode','Distance'), blocked, crowds))
            if not math.isfinite(result['cost']):
                result['cost'] = None
            self.json_response(result)
        except (ValueError, KeyError, TypeError, AttributeError) as error:
            self.json_response({'error': str(error)}, 400)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT/'dist')))
    print(f'Campus Compass ready at http://127.0.0.1:{args.port}', flush=True)
    print('Searches run in Python. Press Ctrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
    finally:
        server.server_close()
