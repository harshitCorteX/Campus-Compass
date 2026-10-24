# Campus Compass: five-minute demonstration

## Before class

Run `python server.py`, open http://127.0.0.1:8000, and confirm “Search powered by Python” in the learning section. No internet is required. Use the shortest-route demo to restore the default conditions. Keep this guide available for your explanation.

## 0:00–0:45 — Define the agent

“Campus Compass is a search-based navigation agent. This campus is a graph with 16 states and 25 bidirectional paths. Locations are states; moving along a path is an action. The agent's goal is to reach the selected destination while optimizing the selected cost.”

Point to a classroom, a laboratory, an office, and a department on the map. Explain that distances are edge weights and the campus is illustrative.

## 0:45–1:45 — Show A*

Click **01 Find the shortest route**, then use **Final route** to finish the animation if needed.

The default distance route is:

```text
Main Gate → Classroom 101 → Classroom 102 → Central Library → Computer Lab
170 + 180 + 200 + 240 = 790 metres
```

Use restart and **Next search step** to explain:

- OPEN contains discovered states waiting to be explored.
- CLOSED contains expanded states in order.
- `g` is the actual accumulated cost.
- `h` is a lower-bound estimate to the goal.
- A* chooses the smallest `f = g + h`.

“The heuristic is scaled straight-line distance. It cannot overestimate the remaining cost, so A* finds the optimal route for this cost model.”

## 1:45–2:45 — Compare BFS and DFS

Select BFS, then DFS. Use **Find my route** to animate either. Scroll to the comparison table.

“BFS uses FIFO and minimizes the number of segments. DFS uses LIFO and explores deeply. Neither promises minimum total distance when edges have different weights. A* uses the edge costs and a heuristic.”

Do not claim DFS is always slower, or A* always expands fewer nodes: the result depends on the graph and heuristic. Discuss the actual table values.

## 2:45–3:30 — Introduce an obstacle

Click **02 Navigate a blocked path**. The Main Gate ↔ Classroom 101 edge closes. The distance-optimal detour becomes:

```text
Main Gate → Administration → Registrar Office → Central Library → Computer Lab
240 + 180 + 190 + 240 = 850 metres
```

“The environment can change. The agent observes the updated graph and runs the search again.”

Show the red closure and **Edit paths**. Clicking a path closes/reopens it. This is fresh replanning, not an incremental search algorithm.

## 3:30–4:15 — Add accessibility

Click **03 Take a step-free route**. Stair edges are excluded. The route is:

```text
Main Gate → Administration → Registrar Office → Central Library → Computer Science → Computer Lab
240 + 180 + 190 + 190 + 190 = 990 metres
```

“Accessibility changes which actions are allowed. A* then finds the shortest remaining route.”

Optionally select Time or Low crowd and increase a path's crowd level. Explain the visible cost formulas, rather than claiming these are real measured travel times.

## 4:15–5:00 — Classify the environment and conclude

- **Observable:** the full model and conditions are known.
- **Deterministic:** each action has a known endpoint and current cost.
- **Sequential:** each decision changes future choices and accumulated cost.
- **Dynamic:** closures and crowd conditions can change between searches.

“This prototype demonstrates graph modeling, uninformed search, heuristic search, and replanning. A real deployment would need surveyed map data, more detailed accessibility attributes, and live observations.”

## Useful edge cases if asked

- Select identical start and destination: zero distance and cost.
- Block all three paths from Main Gate: no reachable route; OPEN eventually becomes empty.
- Restore conditions with the reset icon above the map.
- During playback, the map shows the current branch; the route panel shows the final answer.
- Hosted or directly opened HTML uses JavaScript; the local server is the Python-based demonstration.
