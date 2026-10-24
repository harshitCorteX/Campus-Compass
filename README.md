<div align="center">

# 🧭 Campus Compass

### Find your way. See the AI.

An interactive campus navigation project that makes graph search visible.

**Python · JavaScript · BFS · DFS · A\* · Interactive Visualization**

[**Explore the Live Demo →**](https://campus-compass-peach.vercel.app/) · [Demo Guide](DEMO_GUIDE.md) · [Getting Started](#-getting-started)

</div>

---

## 🌍 About the Project

Finding a classroom is a navigation problem. Explaining how the route was found is an AI project.

**Campus Compass** models a university as a graph of **16 locations and 25 bidirectional paths**. Choose your starting point, destination and search algorithm, then watch the system explore the campus and build a route.

Built for a **third-year university Artificial Intelligence project**, it demonstrates graph modeling, uninformed search, heuristic search, constraints and replanning through a simple web interface.

> **Two ways to run:** The live website uses the JavaScript engine. Run the local server to demonstrate the Python implementation. Both implement the same search behavior.

## ✨ Features

- **Three search algorithms** — compare BFS, DFS and A* under identical conditions.
- **Interactive campus map** — view locations, connecting paths and highlighted routes.
- **Search playback** — play, pause, step, restart or scrub through the exploration.
- **Explainable results** — inspect OPEN, CLOSED, accumulated cost and expanded states.
- **Four route preferences** — distance, estimated time, accessibility and crowd avoidance.
- **Simulated obstacles** — block or reopen paths and see the route recalculated.
- **Crowd controls** — adjust crowd levels to explore their effect on route costs.
- **Built-in demo support** — use presets and the demonstration guide for presentations.

## 🚀 Getting Started

### Run the Python version

**Requirement:** Python 3.10 or later. No pip dependencies or database are required.

1. Download and extract the repository, or clone it:

   ```bash
   git clone https://github.com/harshitCorteX/Campus-Compass.git
   cd Campus-Compass
   ```

2. Start the server:

   ```bash
   python server.py
   ```

3. Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.
4. Check the **Search powered by Python** label in the “How it works” section.

Keep the terminal open while using the application. Press `Ctrl+C` to stop the server.

**Windows shortcut:** Double-click `START_WEBSITE.bat`.

If port 8000 is occupied:

```bash
python server.py --port 8001
```

Then open [http://127.0.0.1:8001](http://127.0.0.1:8001).

### Run without Python

Open `dist/index.html` in a browser, or visit the [live demo](https://campus-compass-peach.vercel.app/). These use the JavaScript search engine. The local core application has no external map, CDN or paid API dependencies.

## 🧠 Algorithms Explained

| Algorithm | Data structure | How it chooses the next location | What it guarantees |
|---|---|---|---|
| **BFS** | FIFO queue | Earliest discovered location | Fewest path segments |
| **DFS** | LIFO stack | Most recently added location | A feasible route if the goal is reachable |
| **A\*** | Priority frontier | Smallest `f(n) = g(n) + h(n)` | Minimum selected cost with the consistent heuristic |

For A*, **g(n)** is the accumulated route cost and **h(n)** estimates the remaining cost. Python uses `heapq`; the browser version sorts its frontier for readability on the small graph.

The heuristic scales straight-line map distance by the smallest allowed **edge cost / geometric edge length** ratio. This produces a consistent lower bound despite the schematic coordinates. The scale is recalculated for the selected objective and current conditions.

**BFS and DFS respect blocked paths and accessibility restrictions, but do not optimize weighted distance, time or crowd costs.**

## 🛤️ Route Preferences

For an edge of distance `d` metres and crowd level `c` between 0 and 1:

| Preference | Edge cost | Behavior |
|---|---|---|
| **Distance** | `d` | Minimize total distance |
| **Estimated time** | `(d / 80) × (1 + 2c)` minutes | Account for simulated congestion |
| **Accessibility** | `d` after filtering | Exclude paths marked inaccessible |
| **Low crowd** | `d × (1 + 3c)` | Balance distance with crowd avoidance |

A* minimizes the sum of these costs. Time estimates assume a base speed of **80 metres per minute**. Crowd avoidance uses a weighted distance cost, not average crowd percentage.

Blocked edges are excluded from every search. Changed settings trigger a fresh search; if the destination becomes unreachable, the interface displays a no-route result.

## 🎬 Try These Demonstrations

Use **Main Gate → Computer Lab** and reset conditions before each independent scenario.

| Scenario | Settings | Expected distance |
|---|---|---:|
| Shortest route | A*, distance, original conditions | **790 m** |
| Blocked walkway | A*, distance, block Main Gate–Classroom 101 | **850 m** |
| Step-free route | A*, accessibility, original conditions | **990 m** |

For the default distance scenario:

| Algorithm | Distance | Expanded states |
|---|---:|---:|
| BFS | 850 m | 12 |
| DFS | 850 m | 14 |
| A* | 790 m | 6 |

These results depend on the sample graph and neighbor order; they do not imply A* always expands fewer states. Expanded-state counts include the goal.

During playback, the map shows the branch being explored at that step. The final route panel retains the completed answer.

**Suggested presentation:** Run A* → compare BFS and DFS → inspect OPEN/CLOSED → block a path → demonstrate accessibility. See [DEMO_GUIDE.md](DEMO_GUIDE.md) for the full walkthrough.

## ⚙️ How It Works

```text
Select endpoints, algorithm and preference
                    ↓
Filter blocked or inaccessible paths
                    ↓
Calculate costs and run the search
                    ↓
Reconstruct the route and collect search snapshots
                    ↓
Display the map, results and playback
                    ↓
Replan when inputs or conditions change
```

| Execution mode | Request flow |
|---|---|
| **Local Python** | Browser → `POST /api/search` → Python engine → JSON → interface |
| **Static website** | Browser controls → JavaScript engine → interface |

The local browser checks `/api/health` to identify the Python backend. The server binds to loopback for local demonstrations.

### Agent and environment

- **State:** A campus location.
- **Action:** Travel along an allowed connecting path.
- **Initial state:** The user-selected starting point.
- **Goal test:** The current location equals the destination.
- **Path cost:** Sum of edge costs under the selected preference.
- **Environment:** Fully observable within the model, deterministic and sequential. Conditions can change between searches, while each search uses a fixed snapshot.

This is a **search-based AI agent**, with no machine-learning training required.

## 📁 Project Structure

```text
Campus-Compass/
├── search.py             # Graph, algorithms, costs and search snapshots
├── server.py             # Local HTTP server and search API
├── START_WEBSITE.bat      # Windows launcher
├── test_search.py        # Algorithm and optimality tests
├── test_api.py           # HTTP integration tests
├── test_web.py           # Python / JavaScript parity tests
├── README.md
├── DEMO_GUIDE.md
├── .gitignore
└── dist/
    ├── index.html        # Page structure
    ├── style.css         # Responsive styling
    ├── app.js            # Controls, SVG map and playback
    ├── data.js           # Browser campus data
    ├── engine.js         # JavaScript search engine
    └── icon.svg
```

## 🧪 Testing

Run the Python algorithm and API tests:

```bash
python -m unittest test_search -v
python -m unittest test_api -v
```

To compare Python and JavaScript results, install Node.js and run:

```bash
python -m unittest test_web -v
```

Development validation included:

- **2,048 A* / Dijkstra comparisons** across all endpoint pairs, four preferences and two condition sets.
- **6,144 Python / JavaScript comparisons** across the same cases and all three algorithms.
- Checks for identical endpoints, unreachable goals, accessibility, changed conditions, trace consistency and invalid inputs.
- HTTP checks for the local API and static assets.

These checks passed during development. They validate the supplied graph and scenarios, not real-world campus travel accuracy.

## ☁️ Static Hosting

The `dist/` directory contains the complete browser application and can be deployed as a static site. No frontend build step is required.

The existing [Vercel deployment](https://campus-compass-peach.vercel.app/) runs the JavaScript engine. Keep the Python files in the repository for local execution, testing and assessment.

## 🔭 Limitations and Future Scope

The map, distances and crowds are synthetic. Accessibility uses a simple flag, and travel time is an estimate. There is no GPS, indoor positioning or live condition feed. Full search snapshots add memory overhead, and performance on larger maps has not been evaluated.

Possible extensions include verified campus maps, multi-floor navigation, detailed accessibility data, live closures, multi-stop journeys and incremental replanning.

To customize the campus, update `sample_campus()` in `search.py` and keep `dist/data.js` synchronized. Run the parity tests after changes.

---

<div align="center">

**Campus Compass · A university AI project that makes pathfinding understandable.**

[Open the Demo](https://campus-compass-peach.vercel.app/) · [Read the Demo Guide](DEMO_GUIDE.md)

</div>
