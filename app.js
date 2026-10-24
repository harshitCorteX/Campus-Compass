'use strict';
const $ = id => document.getElementById(id);
const nodeById = Object.fromEntries(CAMPUS.nodes.map(n=>[n.id,n]));
const edgeKey = e => CampusEngine.key(e.a,e.b);
const state = {algorithm:'A*',blocked:new Set(),crowds:{},result:null,index:0,timer:null,editing:false,python:false,revision:0};
const hints = {
  'A*':'A little estimation goes a long way. Finds the lowest-cost route.',
  BFS:'Explore level by level. Finds the fewest path segments, not necessarily the shortest distance.',
  DFS:'Follow a branch deeply, then try alternatives. A route, without an optimality guarantee.'
};
const modeHints = {Distance:'Minimize total walking distance in metres.',Time:'Estimate walking time with a delay for crowded paths.',Accessibility:'Exclude stairs and minimize distance on step-free paths.','Low crowd':'Balance distance and crowd exposure: d × (1 + 3c).'};
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unit = mode => mode==='Time'?'min':mode==='Low crowd'?'w.m':'m';
const number = n => Number(n).toLocaleString('en-US',{maximumFractionDigits:1});
const options = () => ({start:$('start').value,goal:$('goal').value,algorithm:state.algorithm,mode:$('preference').value,blocked:[...state.blocked],crowds:{...state.crowds}});
let toastTimer;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function pause(){clearInterval(state.timer);state.timer=null;$('play').textContent='▶';$('play').setAttribute('aria-label','Play search');}
function play(){
  if(!state.result)return;
  if(state.timer){pause();return;}
  if(state.index>=state.result.snapshots.length-1)state.index=0;
  renderFrame();$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pause search');
  state.timer=setInterval(()=>{state.index++;renderFrame();if(state.index>=state.result.snapshots.length-1)pause();},650);
}
async function requestSearch(opts){
  if(!state.python)return CampusEngine.search(CAMPUS,opts);
  const response=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(opts)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Search could not complete.');return result;
}
async function run(animate=false){
  pause();const revision=++state.revision;const opts=options();
  $('findRoute').disabled=true;$('status').textContent='Exploring the campus…';
  try{
    const results=await Promise.all(['A*','BFS','DFS'].map(algorithm=>requestSearch({...opts,algorithm})));
    if(revision!==state.revision)return;
    state.result=results[['A*','BFS','DFS'].indexOf(opts.algorithm)];
    state.index=animate?0:state.result.snapshots.length-1;
    $('timeline').max=state.result.snapshots.length-1;
    renderResult(opts);renderCompare(results,opts);renderFrame();renderEdgeControls();
    $('status').textContent=state.result.route.length?'Route found. Play to see how.':'No route. Try reopening a path.';
    if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)play();
  }catch(error){
    if(revision!==state.revision)return;
    state.result=null;renderMap();$('status').textContent=error.message;toast('Search failed. Please check the local Python server.');
  }finally{if(revision===state.revision)$('findRoute').disabled=false;}
}
function setAlgorithm(value){
  state.algorithm=value;
  document.querySelectorAll('[data-algorithm]').forEach(button=>{const selected=button.dataset.algorithm===value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected);});
  $('algoHint').textContent=hints[value];
}
function renderResult(opts){
  const r=state.result;const found=r.route.length>0;
  $('resultEyebrow').textContent=found?'YOUR ROUTE IS READY':'LET’S FIND ANOTHER WAY';
  $('resultTitle').textContent=found?`${nodeById[opts.start].name} → ${nodeById[opts.goal].name}`:'No reachable route';
  $('resultBadge').textContent=`${opts.algorithm} · ${opts.mode}`;
  document.querySelector('.result-icon').textContent=found?'✓':'!';
  $('routeList').innerHTML=found?r.route.map(n=>`<b>${esc(nodeById[n].name)}</b>`).join('<span class="arrow">→</span>'):'The destination is disconnected under the current conditions.';
  const guarantee=opts.algorithm==='BFS'?'Fewest segments; weighted cost is not optimized.':opts.algorithm==='DFS'?'DFS finds a route, with no shortest-route guarantee.':'Lowest cost for the selected preference.';
  $('resultNote').textContent=found?`${guarantee} Final result shown here; the map follows playback.`:'Reopen a blocked path or change the accessibility preference, then try again.';
  $('distance').innerHTML=found?`${number(r.distance)}<small>m</small>`:'—';
  $('time').innerHTML=found?`${r.minutes.toFixed(1)}<small>min</small>`:'—';
  $('cost').innerHTML=found?`${number(r.cost)}<small>${unit(opts.mode)}</small>`:'∞';
  $('costLabel').textContent=opts.mode==='Low crowd'?'weighted cost (g)':'path cost (g)';
  $('expanded').textContent=r.expanded;
}
function renderCompare(results,opts){
  const descriptions=['Lowest f = g + h','FIFO queue','LIFO stack'];
  const guarantees=['Lowest selected cost','Fewest segments','No optimality guarantee'];
  $('compareMode').textContent=opts.mode;
  $('comparison').innerHTML=results.map((r,i)=>`<tr class="${['A*','BFS','DFS'][i]===opts.algorithm?'is-active':''}"><td>${['A*','BFS','DFS'][i]}</td><td>${descriptions[i]}</td><td>${r.route.length?number(r.distance)+' m':'No route'}</td><td>${r.route.length?number(r.cost)+' '+unit(opts.mode):'∞'}</td><td>${r.expanded}</td><td>${guarantees[i]}</td></tr>`).join('');
}
function renderFrame(){
  if(!state.result)return;
  state.index=Math.max(0,Math.min(state.index,state.result.snapshots.length-1));
  const frame=state.result.snapshots[state.index];
  $('timeline').value=state.index;$('stepCount').textContent=`${state.index+1} / ${state.result.snapshots.length}`;
  $('currentState').textContent=`Current state: ${frame.current||'—'}`;
  $('traceMessage').textContent=frame.note;
  $('openCount').textContent=frame.opened.length;$('closedCount').textContent=frame.closed.length;
  $('openRows').innerHTML=frame.opened.length?frame.opened.map(([n,g,f])=>`<tr><td title="${esc(nodeById[n].name)}">${n}</td><td>${g.toFixed(1)}</td><td>${state.algorithm==='A*'?f.toFixed(1):'—'}</td></tr>`).join(''):'<tr><td colspan="3">The open list is empty.</td></tr>';
  $('closedList').innerHTML=frame.closed.length?frame.closed.map((n,i)=>`<span title="${esc(nodeById[n].name)}"><i>${String(i+1).padStart(2,'0')}</i>${n}</span>`).join(''):'<p>No states explored yet.</p>';
  $('formula').textContent=state.algorithm==='A*'?`A*: f(n) = g(n) + h(n) · costs in ${unit($('preference').value)}`:state.algorithm==='BFS'?'BFS: enqueue neighbors → remove from the front':'DFS: push neighbors → remove from the top';
  renderMap();
}
function scenery(){
  let trees='';
  [[130,85],[130,105],[150,93],[890,170],[870,190],[895,208],[70,435],[90,454],[55,468],[780,595],[800,610],[822,597],[530,590],[551,600],[560,575],[355,560],[370,580],[330,575],[280,735],[300,720]].forEach(([x,y],i)=>{trees+=`<circle cx="${x}" cy="${y}" r="${9+i%4}" fill="${i%2?'#d8e3c7':'#e0e8d1'}"/><circle cx="${x-2}" cy="${y-2}" r="5" fill="#cfddbd" opacity=".6"/>`;});
  return `<defs><pattern id="mapDots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#cbd5be" opacity=".35"/></pattern></defs><rect width="960" height="760" fill="#f1f4e9"/><rect width="960" height="760" fill="url(#mapDots)"/><path d="M330 365Q400 340 500 365L590 425Q630 510 560 555L395 550Q330 500 330 365Z" fill="#e6edda"/><path d="M42 200Q80 215 100 255M930 70L920 360M105 700L205 725" stroke="#e5eadb" stroke-width="30" fill="none" stroke-linecap="round"/><rect x="814" y="575" width="110" height="138" rx="13" fill="#e1ead4"/><rect x="826" y="586" width="86" height="115" rx="3" fill="none" stroke="#d2ddc3"/><path d="M826 644H912" stroke="#d2ddc3"/><circle cx="869" cy="644" r="21" fill="none" stroke="#d2ddc3"/>${trees}<text x="463" y="521" font-size="9" fill="#a0ae91" letter-spacing="3" text-anchor="middle">THE GREEN</text>`;
}
function renderMap(){
  const frame=state.result?.snapshots[state.index];
  const opened=new Set(frame?.opened.map(n=>n[0])||[]),closed=new Set(frame?.closed||[]),route=frame?.route||[];
  const routeEdges=new Set(route.slice(1).map((n,i)=>CampusEngine.key(n,route[i])));
  let paths='',labels='';
  for(const e of CAMPUS.edges){
    const a=nodeById[e.a],b=nodeById[e.b],key=edgeKey(e),blocked=state.blocked.has(key),highlight=routeEdges.has(key);
    const color=blocked?'#cc7765':highlight?'#387d67':e.accessible?'#c6d1b9':'#b6a0b6';
    const dash=blocked?'7 6':!e.accessible&&!highlight?'5 5':'';
    paths+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fcfdf8" stroke-width="13" stroke-linecap="round"/><line class="edge-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${highlight?6:3}" stroke-dasharray="${dash}" stroke-linecap="round"/>`;
    if(state.editing)paths+=`<line class="edge-hit" data-edge="${key}" tabindex="0" role="button" aria-label="${blocked?'Reopen':'Block'} ${esc(a.name)} to ${esc(b.name)}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="transparent" stroke-width="22"><title>${blocked?'Reopen':'Block'} ${esc(a.name)} ↔ ${esc(b.name)}</title></line>`;
    labels+=`<text class="edge-label" x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-6}" text-anchor="middle">${blocked?'×':e.distance}</text>`;
  }
  let nodes='';
  for(const n of CAMPUS.nodes){
    const start=n.id===$('start').value,goal=n.id===$('goal').value;
    let fill='#fdfef9',stroke='#b3c4a4',text='#6c8263';
    if(closed.has(n.id)){fill='#a3b6aa';stroke='#92a79a';text='white';}
    if(opened.has(n.id)){fill='#edcc89';stroke='#dcb775';text='#795d28';}
    if(route.includes(n.id)){fill='#3e826b';stroke='#3e826b';text='white';}
    if(start){fill='#205b4e';stroke='#205b4e';text='white';}
    if(goal){fill='#ca945f';stroke='#ca945f';text='white';}
    const current=frame?.current===n.id;
    const building=n.kind!=='Open space'&&n.kind!=='Entrance';
    nodes+=`<g class="node" data-node="${n.id}" tabindex="0" role="button" aria-label="Set ${esc(n.name)} as destination"><title>${esc(n.name)} · ${n.kind}${start?' · Start':''}${goal?' · Destination':''}</title>${building?`<rect x="${n.x-37}" y="${n.y-27}" width="74" height="49" rx="7" fill="#e5eadd" stroke="#d9e1cf"/><path d="M${n.x-27} ${n.y-18}h15M${n.x+12} ${n.y-18}h15" stroke="#d0dbc5" stroke-width="3"/>`:''}${current?`<circle class="current-ring" cx="${n.x}" cy="${n.y}" r="27"/>`:''}<circle class="node-core" cx="${n.x}" cy="${n.y}" r="19" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text class="node-id" x="${n.x}" y="${n.y+3}" text-anchor="middle" fill="${text}">${n.id}</text><text class="node-label" x="${n.x}" y="${n.y+39}" text-anchor="middle">${esc(n.name)}</text>${start||goal?`<text x="${n.x}" y="${n.y-35}" text-anchor="middle" fill="${start?'#49816d':'#ae8156'}" font-size="7" letter-spacing="1.7">${start&&goal?'START + GOAL':start?'START':'DESTINATION'}</text>`:''}</g>`;
  }
  $('campusMap').innerHTML=scenery()+`<g>${paths}</g><g>${labels}</g><g>${nodes}</g>`;
}
function renderEdgeControls(){
  const key=$('edgeSelect').value;const edge=CAMPUS.edges.find(e=>edgeKey(e)===key);
  if(!edge)return;
  const blocked=state.blocked.has(key);$('blockPath').textContent=blocked?'Reopen this path':'Block this path';$('blockPath').classList.toggle('is-blocked',blocked);
  const crowd=Math.round((state.crowds[key]??edge.crowd)*100);$('crowd').value=crowd;$('crowdValue').textContent=crowd+'%';
  $('edgeDetail').textContent=`${edge.distance} m · ${edge.accessible?'Step-free':'Stairs / non-accessible'} · ${blocked?'Currently blocked':'Open'} · ${state.blocked.size} blocked path${state.blocked.size===1?'':'s'} on campus`;
}
async function toggleEdge(key){state.blocked.has(key)?state.blocked.delete(key):state.blocked.add(key);$('edgeSelect').value=key;await run(false);toast(state.blocked.has(key)?'Path blocked. The route has been recalculated.':'Path reopened. The route has been recalculated.');}
async function scenario(name){
  state.blocked.clear();state.crowds={};$('start').value='GATE';$('goal').value='LAB';setAlgorithm('A*');$('preference').value=name==='accessible'?'Accessibility':'Distance';
  if(name==='blocked'){const key=CampusEngine.key('GATE','C101');state.blocked.add(key);$('edgeSelect').value=key;}
  $('modeHint').textContent=modeHints[$('preference').value];
  await run(true);toast(name==='blocked'?'Main Gate → Classroom 101 is closed. Watch the detour.':name==='accessible'?'Stair paths are excluded. Watch the step-free route.':'A* finds the shortest distance. Follow the search steps.');
  $('explore').scrollIntoView({behavior:'smooth',block:'start'});
}
function init(){
  for(const id of ['start','goal'])$(''+id).innerHTML=CAMPUS.nodes.map(n=>`<option value="${n.id}">${esc(n.name)}</option>`).join('');
  $('start').value='GATE';$('goal').value='LAB';
  $('edgeSelect').innerHTML=CAMPUS.edges.map(e=>`<option value="${edgeKey(e)}">${esc(nodeById[e.a].name)} ↔ ${esc(nodeById[e.b].name)}</option>`).join('');
  ['start','goal'].forEach(id=>$(id).addEventListener('change',()=>run()));
  $('swap').addEventListener('click',()=>{const s=$('start').value;$('start').value=$('goal').value;$('goal').value=s;run();});
  document.querySelectorAll('[data-algorithm]').forEach(b=>b.addEventListener('click',()=>{setAlgorithm(b.dataset.algorithm);run();}));
  $('preference').addEventListener('change',()=>{$('modeHint').textContent=modeHints[$('preference').value];run();});
  $('findRoute').addEventListener('click',()=>run(true));
  $('play').addEventListener('click',play);
  $('rewind').addEventListener('click',()=>{pause();state.index=0;renderFrame();});
  $('next').addEventListener('click',()=>{pause();state.index++;renderFrame();});
  $('finish').addEventListener('click',()=>{pause();if(state.result)state.index=state.result.snapshots.length-1;renderFrame();});
  $('timeline').addEventListener('input',()=>{pause();state.index=Number($('timeline').value);renderFrame();});
  $('editMap').addEventListener('click',()=>{state.editing=!state.editing;$('editMap').setAttribute('aria-pressed',state.editing);$('mapCaption').innerHTML=state.editing?'Click a walkway to block or reopen it':'<i></i> Click a location to set your destination';renderMap();});
  const mapAction=event=>{const edge=event.target.closest('[data-edge]'),node=event.target.closest('[data-node]');if(edge){toggleEdge(edge.dataset.edge);}else if(node){$('goal').value=node.dataset.node;run();}};
  $('campusMap').addEventListener('click',mapAction);
  $('campusMap').addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();mapAction(event);}});
  $('edgeSelect').addEventListener('change',renderEdgeControls);
  $('blockPath').addEventListener('click',()=>toggleEdge($('edgeSelect').value));
  $('crowd').addEventListener('input',()=>$('crowdValue').textContent=$('crowd').value+'%');
  $('crowd').addEventListener('change',()=>{state.crowds[$('edgeSelect').value]=Number($('crowd').value)/100;run();toast('Crowd level updated. Route recalculated.');});
  $('reset').addEventListener('click',()=>{state.blocked.clear();state.crowds={};run();toast('All paths reopened and crowd levels restored.');});
  document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>scenario(b.dataset.scenario)));
  $('guideBtn').addEventListener('click',()=>$('guide').showModal());$('closeGuide').addEventListener('click',()=>$('guide').close());
  $('guide').addEventListener('click',e=>{if(e.target===$('guide')){const r=$('guide').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('guide').close();}});
  $('startDemo').addEventListener('click',()=>{$('guide').close();scenario('shortest');});
  renderMap();renderEdgeControls();run();
  if(location.protocol!=='file:')fetch('/api/health',{signal:AbortSignal.timeout(2000)}).then(r=>r.ok?r.json():null).then(data=>{if(data?.engine==='Python'){state.python=true;$('engineLabel').textContent='Search powered by Python';if(!state.timer)run();}}).catch(()=>{});
}
init();
