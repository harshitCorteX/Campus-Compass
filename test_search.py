"""Run: python -m unittest -v"""
import heapq
import math
import unittest

from search import Campus, Location, Path, MODES, edge_cost, sample_campus, search


def dijkstra(campus, start, goal, mode, blocked, crowds):
    """Independent zero-heuristic reference for weighted optimality."""
    distances = {start: 0.0}
    heap = [(0.0, start)]
    while heap:
        cost, node = heapq.heappop(heap)
        if cost != distances[node]:
            continue
        if node == goal:
            return cost
        for neighbor, path in campus.adj[node]:
            if path.key in blocked or (mode == 'Accessibility' and not path.accessible):
                continue
            candidate = cost + edge_cost(path, mode, crowds.get(path.key, path.crowd))
            if candidate < distances.get(neighbor, math.inf):
                distances[neighbor] = candidate
                heapq.heappush(heap, (candidate, neighbor))
    return math.inf


class SearchTests(unittest.TestCase):
    def setUp(self):
        self.campus = sample_campus()

    def test_astar_all_pairs_matches_dijkstra_with_conditions(self):
        for mode in MODES:
            for blocked, crowds in [(set(), {}),
                ({('C101', 'GATE'), ('CS', 'LIB')}, {('ENG', 'QUAD'): 1, ('ADMIN', 'GATE'): .9})]:
                for start in self.campus.locations:
                    for goal in self.campus.locations:
                        with self.subTest(mode=mode, start=start, goal=goal, blocked=blocked):
                            result = search(self.campus, start, goal, 'A*', mode, blocked, crowds)
                            self.assertAlmostEqual(result.cost, dijkstra(self.campus, start, goal, mode, blocked, crowds))
                            for a, b in zip(result.route, result.route[1:]):
                                key = tuple(sorted((a, b)))
                                self.assertNotIn(key, blocked)
                                if mode == 'Accessibility':
                                    self.assertTrue(self.campus.paths[key].accessible)

    def test_bfs_minimizes_segments_not_weight(self):
        campus = Campus([Location(n, n, '', i, 0) for i, n in enumerate('ABC')],
                        [Path('A', 'B', 100), Path('A', 'C', 1), Path('C', 'B', 1)])
        self.assertEqual(search(campus, 'A', 'B', 'BFS').route, ['A', 'B'])
        self.assertEqual(search(campus, 'A', 'B', 'A*').route, ['A', 'C', 'B'])

    def test_no_route_and_same_state(self):
        blocked = {p.key for _, p in self.campus.adj['GATE']}
        for algorithm in ('A*', 'BFS', 'DFS'):
            result = search(self.campus, 'GATE', 'LAB', algorithm, blocked=blocked)
            self.assertEqual(result.route, [])
            self.assertTrue(math.isinf(result.cost))
            self.assertEqual(result.snapshots[-1].opened, [])
            same = search(self.campus, 'GATE', 'GATE', algorithm, blocked=blocked)
            self.assertEqual(same.route, ['GATE'])
            self.assertEqual(same.cost, 0)

    def test_trace_and_dfs_terminate_without_duplicate_expansion(self):
        for algorithm in ('A*', 'BFS', 'DFS'):
            result = search(self.campus, 'GATE', 'SPORT', algorithm)
            self.assertEqual(result.route[0], 'GATE')
            self.assertEqual(result.route[-1], 'SPORT')
            self.assertEqual(result.snapshots[-1].route, result.route)
            for snap in result.snapshots:
                opened = [n for n, _, _ in snap.opened]
                self.assertEqual(len(opened), len(set(opened)))
                self.assertEqual(len(snap.closed), len(set(snap.closed)))
                self.assertFalse(set(opened) & set(snap.closed))
            self.assertEqual(result, search(self.campus, 'GATE', 'SPORT', algorithm))

    def test_preferences_can_select_different_routes(self):
        campus = Campus([Location(n, n, '', i * 20, 0) for i, n in enumerate('ABCD')], [
            Path('A', 'B', 100, False, 1), Path('B', 'D', 100, False, 1),
            Path('A', 'C', 150, True, 0), Path('C', 'D', 150, True, 0)])
        self.assertEqual(search(campus, 'A', 'D', mode='Distance').route, ['A', 'B', 'D'])
        for mode in ('Time', 'Accessibility', 'Low crowd'):
            self.assertEqual(search(campus, 'A', 'D', mode=mode).route, ['A', 'C', 'D'])

    def test_replanning_and_snapshot_isolation(self):
        original = search(self.campus, 'GATE', 'LAB')
        edge = tuple(sorted(original.route[:2]))
        blocked = {edge}
        changed = search(self.campus, 'GATE', 'LAB', blocked=blocked)
        blocked.clear()
        self.assertNotEqual(original.route, changed.route)
        self.assertNotIn(edge, [tuple(sorted(pair)) for pair in zip(changed.route, changed.route[1:])])
        self.assertEqual(original, search(self.campus, 'GATE', 'LAB'))

    def test_invalid_data(self):
        with self.assertRaises(ValueError):
            search(self.campus, 'MISSING', 'LAB')
        with self.assertRaises(ValueError):
            search(self.campus, 'GATE', 'LAB', crowds={('GATE', 'C101'): 2})
        with self.assertRaises(ValueError):
            Campus([Location('A', 'A', '', 0, 0)], [Path('A', 'A', -1)])


if __name__ == '__main__':
    unittest.main()
