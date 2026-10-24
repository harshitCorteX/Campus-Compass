"""Cross-language parity tests. Requires Node.js for the browser engine only."""
import json
import math
from pathlib import Path
import shutil
import subprocess
import unittest
from search import sample_campus, search, MODES, ALGORITHMS

ROOT = Path(__file__).resolve().parent


class BrowserParity(unittest.TestCase):
    @unittest.skipUnless(shutil.which('node'), 'Node.js is needed for browser-engine parity tests')
    def test_all_pairs_preferences_algorithms_and_conditions(self):
        campus = sample_campus()
        cases = []
        for algorithm in ALGORITHMS:
            for mode in MODES:
                for blocked, crowds in [([], {}),
                    (['C101|GATE', 'CS|LIB'], {'ENG|QUAD': 1, 'ADMIN|GATE': .9})]:
                    for start in campus.locations:
                        for goal in campus.locations:
                            cases.append(dict(start=start, goal=goal, algorithm=algorithm,
                                              mode=mode, blocked=blocked, crowds=crowds))
        script = """
const fs=require('fs');
const engine=require('./dist/engine.js');
const campus=require('./dist/data.js');
const cases=JSON.parse(fs.readFileSync(0,'utf8'));
process.stdout.write(JSON.stringify(cases.map(c=>{
  const r=engine.search(campus,c);
  return {route:r.route,cost:r.cost,distance:r.distance,minutes:r.minutes};
})));
"""
        completed = subprocess.run(['node', '-e', script], input=json.dumps(cases),
                                   text=True, capture_output=True, check=True, cwd=ROOT)
        results = json.loads(completed.stdout)
        self.assertEqual(len(results), 6144)
        for case, browser in zip(cases, results):
            blocked = [tuple(k.split('|')) for k in case['blocked']]
            crowds = {tuple(k.split('|')): v for k,v in case['crowds'].items()}
            python = search(campus, case['start'], case['goal'], case['algorithm'], case['mode'], blocked, crowds)
            with self.subTest(case=case):
                self.assertAlmostEqual(browser['cost'] if browser['cost'] is not None else math.inf, python.cost)
                self.assertAlmostEqual(browser['distance'], python.distance)
                self.assertAlmostEqual(browser['minutes'], python.minutes)
                if case['algorithm'] != 'A*':
                    self.assertEqual(browser['route'], python.route)
                for a,b in zip(browser['route'], browser['route'][1:]):
                    key = tuple(sorted((a,b)))
                    self.assertIn(key, campus.paths)
                    self.assertNotIn(key, blocked)
                    if case['mode'] == 'Accessibility':
                        self.assertTrue(campus.paths[key].accessible)


if __name__ == '__main__':
    unittest.main()
