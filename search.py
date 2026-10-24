"""Campus graph and deterministic, inspectable search algorithms (standard library)."""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import heapq
import math


@dataclass(frozen=True)
class Location:
    id: str
    name: str
    kind: str
    x: float
    y: float


@dataclass(frozen=True)
class Path:
    a: str
    b: str
    distance: float
    accessible: bool = True
    crowd: float = 0.0

    @property
    def key(self):
        return tuple(sorted((self.a, self.b)))


@dataclass
class Snapshot:
    current: str | None
    opened: list[tuple[str, float, float]]  # state, g, priority (f for A*)
    closed: list[str]
    route: list[str]
    note: str


@dataclass
class Result:
    route: list[str]
    cost: float
    distance: float
    minutes: float
    exposure: float
    snapshots: list[Snapshot]
    expanded: int


MODES = ('Distance', 'Time', 'Accessibility', 'Low crowd')
ALGORITHMS = ('A*', 'BFS', 'DFS')


class Campus:
    def __init__(self, locations: list[Location], paths: list[Path]):
        self.locations = {p.id: p for p in locations}
        if not locations or len(self.locations) != len(locations):
            raise ValueError('Locations must have unique IDs and cannot be empty.')
        if any(not math.isfinite(v) for p in locations for v in (p.x, p.y)):
            raise ValueError('Coordinates must be finite.')
        self.paths: dict[tuple[str, str], Path] = {}
        self.adj: dict[str, list[tuple[str, Path]]] = {p.id: [] for p in locations}
        for p in paths:
            if p.a not in self.locations or p.b not in self.locations or p.a == p.b:
                raise ValueError('Paths must join two distinct known locations.')
            if not math.isfinite(p.distance) or p.distance <= 0:
                raise ValueError('Path distances must be finite and positive.')
            if not math.isfinite(p.crowd) or not 0 <= p.crowd <= 1:
                raise ValueError('Crowd levels must be between 0 and 1.')
            if p.key in self.paths:
                raise ValueError('Duplicate path.')
            self.paths[p.key] = p
            self.adj[p.a].append((p.b, p))
            self.adj[p.b].append((p.a, p))
        for neighbors in self.adj.values():
            neighbors.sort(key=lambda item: item[0])


def sample_campus():
    locations = [
        Location('GATE', 'Main Gate', 'Entrance', 80, 320),
        Location('ADMIN', 'Administration', 'Office', 220, 140),
        Location('REG', 'Registrar Office', 'Office', 380, 80),
        Location('C101', 'Classroom 101', 'Classroom', 240, 300),
        Location('C102', 'Classroom 102', 'Classroom', 410, 270),
        Location('LIB', 'Central Library', 'Library', 550, 140),
        Location('CS', 'Computer Science', 'Department', 730, 100),
        Location('LAB', 'Computer Lab', 'Laboratory', 740, 280),
        Location('QUAD', 'Central Quad', 'Open space', 460, 440),
        Location('CAFE', 'Student Cafe', 'Facility', 240, 500),
        Location('ENG', 'Engineering', 'Department', 640, 490),
        Location('PHYS', 'Physics Lab', 'Laboratory', 850, 450),
        Location('MED', 'Health Centre', 'Office', 80, 630),
        Location('HALL', 'Lecture Hall', 'Classroom', 430, 650),
        Location('HOST', 'Residence Hall', 'Residence', 690, 680),
        Location('SPORT', 'Sports Centre', 'Facility', 880, 650),
    ]
    # Coordinates are schematic; these explicit distances are the route data.
    paths = [
        Path('GATE', 'ADMIN', 240, crowd=.1), Path('GATE', 'C101', 170, crowd=.4),
        Path('GATE', 'MED', 330, crowd=.05), Path('ADMIN', 'REG', 180, crowd=.1),
        Path('ADMIN', 'C101', 180, crowd=.2), Path('REG', 'LIB', 190, crowd=.1),
        Path('C101', 'C102', 180, False, .2), Path('C101', 'CAFE', 210, crowd=.7),
        Path('C102', 'LIB', 200, crowd=.25), Path('C102', 'QUAD', 190, crowd=.65),
        Path('LIB', 'CS', 190, crowd=.15), Path('LIB', 'LAB', 240, False, .1),
        Path('CS', 'LAB', 190, crowd=.15), Path('LAB', 'PHYS', 220, crowd=.3),
        Path('LAB', 'ENG', 250, crowd=.3), Path('QUAD', 'ENG', 200, crowd=.8),
        Path('QUAD', 'CAFE', 240, crowd=.9), Path('QUAD', 'HALL', 220, False, .5),
        Path('CAFE', 'MED', 220, crowd=.3), Path('CAFE', 'HALL', 260, crowd=.4),
        Path('ENG', 'PHYS', 220, crowd=.25), Path('ENG', 'HOST', 210, crowd=.2),
        Path('PHYS', 'SPORT', 220, crowd=.2), Path('HALL', 'HOST', 270, crowd=.1),
        Path('HOST', 'SPORT', 200, crowd=.15),
    ]
    return Campus(locations, paths)


def travel_minutes(path: Path, crowd: float):
    return path.distance / 80 * (1 + 2 * crowd)


def edge_cost(path: Path, mode: str, crowd: float):
    if mode == 'Time':
        return travel_minutes(path, crowd)
    if mode == 'Low crowd':
        return path.distance * (1 + 3 * crowd)
    return path.distance


def cost_unit(mode):
    return 'min' if mode == 'Time' else 'weighted m' if mode == 'Low crowd' else 'm'


def search(campus: Campus, start: str, goal: str, algorithm='A*', mode='Distance',
           blocked=None, crowds=None) -> Result:
    """Search a frozen snapshot of the currently observed graph.

    BFS minimizes edge count; DFS finds a route without an optimality guarantee.
    A* minimizes the selected additive cost. Accessibility filters edges first.
    """
    if start not in campus.locations or goal not in campus.locations:
        raise ValueError('Select valid start and destination locations.')
    if algorithm not in ALGORITHMS or mode not in MODES:
        raise ValueError('Unknown algorithm or route preference.')
    blocked = {tuple(sorted(key)) for key in (blocked or set())}
    crowds = {tuple(sorted(key)): value for key, value in (crowds or {}).items()}
    if any(not math.isfinite(v) or not 0 <= v <= 1 for v in crowds.values()):
        raise ValueError('Crowd levels must be between 0 and 1.')

    def allowed(path):
        return path.key not in blocked and (mode != 'Accessibility' or path.accessible)

    def crowd(path):
        return crowds.get(path.key, path.crowd)

    def weight(path):
        return edge_cost(path, mode, crowd(path))

    def geometric(a, b):
        p, q = campus.locations[a], campus.locations[b]
        return math.hypot(p.x - q.x, p.y - q.y)

    # Scaling by the minimum cost/geometric-length ratio makes h consistent,
    # even if the schematic coordinates do not match the supplied distances.
    ratios = [weight(p) / geometric(p.a, p.b) for p in campus.paths.values()
              if allowed(p) and geometric(p.a, p.b) > 0]
    scale = min(ratios, default=0)

    def heuristic(node):
        return scale * geometric(node, goal)

    parent = {start: None}
    costs = {start: 0.0}
    closed = []
    closed_set = set()
    queue = deque([start])
    heap = [(heuristic(start), start, 0.0)]
    frontier = {start}
    snapshots = []

    def route_to(node):
        route = []
        while node is not None:
            route.append(node)
            node = parent[node]
        return route[::-1]

    def record(current, note):
        if algorithm == 'A*':
            order = sorted(frontier, key=lambda n: (costs[n] + heuristic(n), n))
        else:
            order = list(queue) if algorithm == 'BFS' else list(reversed(queue))
        snapshots.append(Snapshot(current,
            [(n, costs[n], costs[n] + heuristic(n) if algorithm == 'A*' else costs[n])
             for n in order], closed.copy(), route_to(current) if current else [], note))

    record(None, 'Initial frontier: start state. The next state is listed first.')
    found = []
    while frontier:
        if algorithm == 'A*':
            while heap:
                _, current, queued_g = heapq.heappop(heap)
                if current in frontier and queued_g == costs[current]:
                    break
            else:
                raise RuntimeError('Frontier and priority queue disagree.')
        else:
            current = queue.popleft() if algorithm == 'BFS' else queue.pop()
        frontier.remove(current)
        closed.append(current)
        closed_set.add(current)
        if current == goal:
            found = route_to(goal)
            record(current, 'Destination reached. The highlighted route is final.')
            break
        neighbors = campus.adj[current]
        # Reverse push order lets DFS visit alphabetical IDs first.
        if algorithm == 'DFS':
            neighbors = list(reversed(neighbors))
        for nxt, path in neighbors:
            if not allowed(path) or nxt in closed_set:
                continue
            tentative = costs[current] + weight(path)
            if algorithm == 'A*':
                if tentative >= costs.get(nxt, math.inf):
                    continue
                costs[nxt], parent[nxt] = tentative, current
                frontier.add(nxt)
                heapq.heappush(heap, (tentative + heuristic(nxt), nxt, tentative))
            elif nxt not in parent:
                costs[nxt], parent[nxt] = tentative, current
                frontier.add(nxt)
                queue.append(nxt)
        record(current, f'Expanded {current}; discovered eligible neighboring states.')
    if not found:
        record(None, 'No route: the reachable frontier is exhausted. Change closures or preference.')
    route_paths = [campus.paths[tuple(sorted((a, b)))] for a, b in zip(found, found[1:])]
    return Result(found, costs[goal] if found else math.inf,
                  sum(p.distance for p in route_paths),
                  sum(travel_minutes(p, crowd(p)) for p in route_paths),
                  sum(p.distance * crowd(p) for p in route_paths), snapshots, len(closed))
