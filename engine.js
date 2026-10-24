/* Plain JavaScript version for the hosted/offline demo; server.py uses Python. */
const CampusEngine = (() => {
  const key = (a,b) => [a,b].sort().join('|');
  const minutes = (e,c) => e.distance / 80 * (1 + 2*c);
  const weight = (e,mode,c) => mode === 'Time' ? minutes(e,c) : mode === 'Low crowd' ? e.distance*(1+3*c) : e.distance;
  function search(data, options) {
    const {start, goal, algorithm='A*', mode='Distance', blocked=[], crowds={}} = options;
    const nodes = Object.fromEntries(data.nodes.map(n => [n.id,n]));
    if (!nodes[start] || !nodes[goal]) throw Error('Choose valid locations.');
    if (!['A*','BFS','DFS'].includes(algorithm) || !['Distance','Time','Accessibility','Low crowd'].includes(mode)) throw Error('Invalid search settings.');
    const blockedSet = new Set(blocked.map(p => Array.isArray(p) ? key(...p) : p));
    const crowd = e => crowds[key(e.a,e.b)] ?? e.crowd;
    if (Object.values(crowds).some(c => !Number.isFinite(c) || c < 0 || c > 1)) throw Error('Invalid crowd level.');
    const allowed = e => !blockedSet.has(key(e.a,e.b)) && (mode !== 'Accessibility' || e.accessible);
    const distance = (a,b) => Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y);
    const ratios = data.edges.filter(e => allowed(e) && distance(e.a,e.b)>0).map(e => weight(e,mode,crowd(e))/distance(e.a,e.b));
    const scale = ratios.length ? Math.min(...ratios) : 0;
    const heuristic = n => scale*distance(n,goal);
    const adj = Object.fromEntries(data.nodes.map(n => [n.id,[]]));
    data.edges.forEach(e => {adj[e.a].push([e.b,e]);adj[e.b].push([e.a,e]);});
    Object.values(adj).forEach(a => a.sort((x,y) => x[0]<y[0] ? -1 : x[0]>y[0] ? 1 : 0));
    let open=[start], closed=[], parents={[start]:null}, costs={[start]:0}, snapshots=[], route=[];
    const branch = n => {const p=[];while(n!=null){p.unshift(n);n=parents[n];}return p;};
    const ordered = () => algorithm==='A*' ? [...open].sort((a,b)=>(costs[a]+heuristic(a))-(costs[b]+heuristic(b)) || (a<b?-1:1)) : algorithm==='DFS' ? [...open].reverse() : [...open];
    const record = (current,note) => snapshots.push({current,opened:ordered().map(n=>[n,costs[n],algorithm==='A*'?costs[n]+heuristic(n):costs[n]]),closed:[...closed],route:current?branch(current):[],note});
    record(null,'The start state enters the open list. Ready to explore.');
    while(open.length){
      const current=ordered()[0];open.splice(open.indexOf(current),1);closed.push(current);
      if(current===goal){route=branch(goal);record(current,'Destination reached. The final route is highlighted.');break;}
      const neighbors=algorithm==='DFS'?[...adj[current]].reverse():adj[current];
      for(const [next,e] of neighbors){
        if(!allowed(e)||closed.includes(next))continue;
        const g=costs[current]+weight(e,mode,crowd(e));
        if(algorithm==='A*' ? g<(costs[next]??Infinity) : !(next in parents)){
          parents[next]=current;costs[next]=g;if(!open.includes(next))open.push(next);
        }
      }
      record(current,`Explored ${nodes[current].name}. Eligible neighbors enter the open list.`);
    }
    if(!route.length)record(null,'The open list is empty. No route exists with these conditions.');
    const edges=route.slice(1).map((n,i)=>data.edges.find(e=>key(e.a,e.b)===key(route[i],n)));
    return {route,cost:route.length?costs[goal]:null,distance:edges.reduce((s,e)=>s+e.distance,0),minutes:edges.reduce((s,e)=>s+minutes(e,crowd(e)),0),exposure:edges.reduce((s,e)=>s+e.distance*crowd(e),0),expanded:closed.length,snapshots};
  }
  return {search,key,weight};
})();
if(typeof module!=='undefined')module.exports=CampusEngine;
