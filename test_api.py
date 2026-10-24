"""HTTP integration tests for the local Python website."""
from functools import partial
from http.server import ThreadingHTTPServer
import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from server import Handler, ROOT


class WebsiteAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(ROOT/'dist')))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=3)

    def post(self, values):
        request = Request(self.base+'/api/search', data=json.dumps(values).encode(),
                          headers={'Content-Type': 'application/json'})
        with urlopen(request, timeout=3) as response:
            return json.load(response)

    def test_serves_page_assets_and_health(self):
        for path in ('/', '/style.css', '/data.js', '/engine.js', '/app.js', '/icon.svg'):
            with urlopen(self.base+path, timeout=3) as response:
                self.assertEqual(response.status, 200)
                self.assertGreater(len(response.read()), 0)
        with urlopen(self.base+'/api/health', timeout=3) as response:
            self.assertEqual(json.load(response)['engine'], 'Python')

    def test_scenarios_and_no_route(self):
        default = dict(start='GATE', goal='LAB', algorithm='A*', mode='Distance')
        self.assertEqual(self.post(default)['cost'], 790)
        self.assertEqual(self.post({**default, 'blocked': ['C101|GATE']})['cost'], 850)
        self.assertEqual(self.post({**default, 'mode': 'Accessibility'})['cost'], 990)
        self.assertEqual(self.post({**default, 'goal': 'GATE'})['cost'], 0)
        unreachable = self.post({**default, 'blocked': ['ADMIN|GATE', 'C101|GATE', 'GATE|MED']})
        self.assertEqual(unreachable['route'], [])
        self.assertIsNone(unreachable['cost'])
        self.assertEqual(unreachable['snapshots'][-1]['opened'], [])

    def test_rejects_bad_locations(self):
        with self.assertRaises(HTTPError) as context:
            self.post(dict(start='MISSING', goal='LAB'))
        self.assertEqual(context.exception.code, 400)
        context.exception.close()


if __name__ == '__main__':
    unittest.main()
