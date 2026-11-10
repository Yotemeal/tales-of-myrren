'use strict';
// Rare material availability and realistic Camp-bank walking-route audit.
// Run: node tests/rare-resource-routes.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const createGame=require('./game-runtime.cjs');

function walkingDistances(world,origin){
  // 16px navigation sample of the same water/crater collision used in-game.
  // Diagonal steps are forbidden through an impassable corner.
  const first=112,step=16,width=87,total=width*width;
  const grid=new Uint8Array(total);
  for(let y=0;y<width;y++)for(let x=0;x<width;x++)
    grid[y*width+x]=world.inWater(first+x*step,first+y*step)?0:1;
  const point=(x,y)=>{
    const ix=Math.max(0,Math.min(width-1,Math.round((x-first)/step)));
    const iy=Math.max(0,Math.min(width-1,Math.round((y-first)/step)));
    return iy*width+ix;
  };
  const dist=new Float64Array(total).fill(Infinity);
  const heap=[];
  function push(index,d){
    let i=heap.length;heap.push([d,index]);
    while(i>0){
      const parent=(i-1)>>1;
      if(heap[parent][0]<=d)break;
      heap[i]=heap[parent];i=parent;
    }
    heap[i]=[d,index];
  }
  function pop(){
    const top=heap[0],end=heap.pop();
    if(heap.length){
      let i=0;
      while(i*2+1<heap.length){
        const l=i*2+1,r=l+1,c=r<heap.length&&heap[r][0]<heap[l][0]?r:l;
        if(heap[c][0]>=end[0])break;
        heap[i]=heap[c];i=c;
      }
      heap[i]=end;
    }
    return top;
  }
  const start=point(origin.x,origin.y);
  assert(grid[start],'bank entrance must be on walkable land');
  dist[start]=0;push(start,0);
  const neighbors=[[-1,0,1],[1,0,1],[0,-1,1],[0,1,1],
    [-1,-1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[1,1,Math.SQRT2]];
  while(heap.length){
    const [distance,position]=pop();
    if(distance!==dist[position])continue;
    const x=position%width,y=(position/width)|0;
    for(const [dx,dy,weight] of neighbors){
      const nx=x+dx,ny=y+dy;
      if(nx<0||nx>=width||ny<0||ny>=width)continue;
      const next=ny*width+nx;
      if(!grid[next])continue;
      if(dx&&dy&&(!grid[y*width+nx]||!grid[ny*width+x]))continue;
      const candidate=distance+step*weight;
      if(candidate<dist[next]){dist[next]=candidate;push(next,candidate)}
    }
  }
  return (x,y)=>({distance:dist[point(x,y)],walkable:!!grid[point(x,y)]});
}

(async()=>{
  const {game:g}=await createGame(),world=g.VILLAGE;
  const rare=g.nodes.filter(n=>n.k==='meteorite');
  const wood=g.nodes.filter(n=>n.k==='myrren');
  assert.equal(rare.length,4,'no extra meteorite deposits may enter the economy');
  assert.equal(wood.length,6,'Myrrenwood supply must be unchanged');
  assert.equal(g.nodes.filter(n=>n.k==='coal').length,16,'coal supply unchanged');
  assert.deepEqual(
    [g.NT.meteorite.req,g.NT.meteorite.xp,g.NT.meteorite.base,
      g.NT.meteorite.dep,g.NT.meteorite.vein,Array.from(g.NT.meteorite.rt)],
    [70,900,.08,1,2,[28,42]],'meteorite rarity stays low while deposits contain two ore');

  const west=rare.filter(n=>n.x<800),east=rare.filter(n=>n.x>800);
  assert.equal(west.length,1,'exactly one existing meteorite now serves the western route');
  assert.equal(east.length,3,'three meteorites remain on the eastern side');
  const site=west[0];
  assert.deepEqual([site.x,site.y],[520,1470],'rare-ore spur remains deterministic');
  assert(!world.inWater(site.x,site.y),'new deposit cannot spawn in water or crater wall');
  assert(world.waterDistance(site.x,site.y)>80,'keep water clearance around resource');
  assert(Math.hypot(site.x-800,site.y-800)>=700,'rare material remains outside beginner Camp');
  const spacing=Math.min(...g.nodes.filter(n=>n!==site)
    .map(n=>Math.hypot(n.x-site.x,n.y-site.y)));
  assert(spacing>=40,'avoid overlapping trees or adjacent resource hit boxes');
  const nearestMonster=Math.min(...g.mons.map(m=>Math.hypot(m.x-site.x,m.y-site.y)));
  assert(nearestMonster>=70,'a high-level enemy must not spawn on top of the new rock');

  const nearestCoal=Math.min(...g.nodes.filter(n=>n.k==='coal')
    .map(n=>Math.hypot(n.x-site.x,n.y-site.y)));
  const nearestMyrrenwood=Math.min(...wood.map(n=>Math.hypot(n.x-site.x,n.y-site.y)));
  assert(nearestCoal<=75,'the western route should include an existing coal source');
  assert(nearestMyrrenwood<=80,'the route should serve existing high-tier Forestry');
  assert.equal(world.pathKind(site.x,site.y),'path','the new trail should lead to the rock');
  for(const [x,y] of [[800,1350],[700,1394],[620,1430],[570,1450]])
    assert.equal(world.pathKind(x,y),'path','connected visible trail at '+x+','+y);
  // The central crater wall still only admits passage through its original
  // southern gap. A trail must not add a shortcut through scenery/collision.
  assert(world.inWater(800+90,1010),'the closed crater rim stays impassable');
  assert(!world.inWater(800,1050),'south entrance remains accessible');

  const distance=walkingDistances(world,g.SPOTS.bank);
  const newRoute=distance(site.x,site.y);
  assert(newRoute.walkable&&Number.isFinite(newRoute.distance),'new ore is bank-reachable');
  assert(newRoute.distance<800,'western meteorite gives a viable bank-to-ore route');
  const eastRoutes=east.map(n=>distance(n.x,n.y));
  for(const r of eastRoutes)
    assert(r.walkable&&Number.isFinite(r.distance),'old eastern ore remains reachable');
  const originalClosestBankWalk=839; // before redistribution: southern-east meteorite
  assert(newRoute.distance<originalClosestBankWalk,
    'western trail improves the nearest bank-to-meteorite walking route');

  const snapshot=g.snap();
  assert(!Object.hasOwn(snapshot,'nodes')&&!Object.hasOwn(snapshot,'meteoriteRoute'),
    'world node placement is not serialized into player saves');
  const source=fs.readFileSync('public/myrren-game.js','utf8');
  assert(source.includes('if(best){best.tipAt=now;return}'),'tapping still only inspects');
  assert(!source.includes('tapMineRock'),'no tap-to-harvest introduced');
  console.log('Bank to southwest meteorite: ~'+Math.round(newRoute.distance)+' px ('+
    (newRoute.distance/90).toFixed(1)+'s at walk speed, excluding encounters)');
  console.log('Eastern meteorite bank routes: '+eastRoutes.map(r=>Math.round(r.distance)).join(', ')+' px');
  console.log('PASS: four rare ores, spatial clearance, coal/timber route, southern path connectivity, bank reachability, XP and save safety.');
})().catch(e=>{console.error(e);process.exitCode=1});
