#!/usr/bin/env node
// From a checkout of the editor branch: node tools/preview-myrren.mjs myrren-project.json
import { createServer } from 'node:http';
import { readFile, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicFolder = await realpath(fileURLToPath(new URL('../public/', import.meta.url)));
const types = {
  Buildings: ['axe', 'pick', 'arms', 'food', 'fish'],
  Trees: ['tree', 'oak', 'maple', 'elder', 'myrren'],
  Ores: ['copper', 'tin', 'iron', 'coal', 'cobalt', 'aether', 'obsidianite', 'meteorite'],
  Fishing: ['spot1', 'spot2', 'spot3', 'spot4', 'spot5'],
  Enemies: ['slime', 'goblin', 'boar', 'wolf', 'bear', 'cave', 'abear'],
  Props: ['flowers', 'rock', 'fence', 'lamp']
};
const tileTypes = ['grass', 'path', 'plaza', 'water', 'rock', 'flowers'];
const assetFolder = '/assets/myrren-v19f/';
const atlasPaths = ['myrren_idle_4dir_native.png', 'myrren_walk_4x6_native.png', 'myrren_punch_4dir_native.png', 'myrren_punch_stride_4dir_native.png', 'myrren_sword_body_4dir.png'].map(name => assetFolder + name);
const security = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function validate(data) {
  if (data?.format !== 'myrren-editor-1' || !Array.isArray(data.objects) || data.objects.length > 10000 ||
      !data.tiles || typeof data.tiles !== 'object' || Array.isArray(data.tiles) ||
      !Array.isArray(data.sheets) || ![2, 5].includes(data.sheets.length)) {
    throw Error('Use a project JSON exported by Myrren Editor.');
  }
  const bounds = data.bounds ?? { width:1600, height:1600, rx:305, ry:235, spawnX:800, spawnY:844 };
  const limits = [['width',1600,3200,16],['height',1600,3200,16],['rx',180,480,1],['ry',150,400,1],
    ['spawnX',108,bounds.width-109,1],['spawnY',108,bounds.height-109,1]];
  if (!limits.every(([key,min,max,step]) => Number.isInteger(bounds[key]) && bounds[key]>=min &&
      bounds[key]<=max && bounds[key]%step===0)) throw Error('Invalid world or camp size or spawn position.');
  const objects = data.objects.map(item => {
    if (!item || !Object.hasOwn(types, item.layer) || !types[item.layer].includes(item.k) ||
        ![item.x, item.y].every((value,index) => Number.isFinite(value) && value >= 0 && value < (index ? bounds.height : bounds.width))) {
      throw Error('Project contains an invalid map object.');
    }
    return { layer: item.layer, k: item.k, x: item.x, y: item.y };
  });
  for (const kind of types.Buildings) {
    if (objects.filter(item => item.layer === 'Buildings' && item.k === kind).length !== 1) {
      throw Error('The game preview requires exactly one of each service building. Check: ' + kind);
    }
  }
  for (const [key, kind] of Object.entries(data.tiles)) {
    if (!/^(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2})$/.test(key) || !tileTypes.includes(kind) ||
        !key.split(',').every((value,index) => Number(value)*16 < (index ? bounds.height : bounds.width))) {
      throw Error('Project contains an invalid terrain tile.');
    }
  }
  const regions = data.regions ?? {};
  const regionTiles = regions.tiles ?? {};
  const rules = regions.rules ?? [];
  if (typeof regionTiles !== 'object' || Array.isArray(regionTiles) || !Array.isArray(rules) || rules.length > 4)
    throw Error('Invalid region data.');
  for (const rule of rules) {
    if (!rule || typeof rule.name !== 'string' || !rule.name.trim() || rule.name.length > 30 ||
        !Number.isInteger(rule.spacing) || rule.spacing < 48 || rule.spacing > 192 ||
        ![rule.enemyRespawn,rule.resourceRespawn].every(value => Number.isInteger(value) && value >= 3 && value <= 300) ||
        ![['enemy','Enemies'],['tree','Trees'],['ore','Ores']].every(([key,layer]) => rule[key] === '' || types[layer].includes(rule[key])))
      throw Error('Invalid region rule.');
  }
  for (const [key, index] of Object.entries(regionTiles)) {
    if (!/^(0|[1-9]\d{0,2}),(0|[1-9]\d{0,2})$/.test(key) || !Number.isInteger(index) || !rules[index] ||
        !key.split(',').every((value,axis) => Number(value)*16 < (axis ? bounds.height : bounds.width)))
      throw Error('Invalid region tile.');
  }
  const sheets = data.sheets.map((value, index) => {
    const match = typeof value === 'string' && /^data:image\/png;base64,([A-Za-z0-9+/]+=*)$/.exec(value);
    const png = match && Buffer.from(match[1], 'base64');
    const [width, height] = [[96,32],[144,128],[336,144],[384,864],[384,1008]][index];
    if (!png || png.length < 33 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
        png.toString('ascii', 12, 16) !== 'IHDR' || png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) {
      throw Error('Invalid sprite sheet. Expected a ' + width + ' × ' + height + ' PNG.');
    }
    return png;
  });
  return { objects, tiles: data.tiles, sheets, regionTiles, rules, bounds:Object.fromEntries(limits.map(([key])=>[key,bounds[key]])) };
}

function replaceOnce(source, marker, replacement) {
  const index = source.indexOf(marker);
  if (index < 0 || source.indexOf(marker, index + marker.length) >= 0) {
    throw Error('The preview adapter needs updating for this game build. Anchor: ' + marker);
  }
  return source.slice(0, index) + replacement + source.slice(index + marker.length);
}

function patchWorld(source, project) {
  const buildings = project.objects.filter(item => item.layer === 'Buildings');
  source = replaceOnce(source, 'const bridges=[];', `
const previewBounds=${JSON.stringify(project.bounds)};
const previewBuildings=${JSON.stringify(buildings)};
const previewTiles=${JSON.stringify(project.tiles)};
const regionTiles=${JSON.stringify(project.regionTiles)};
const corruptedRegions=${JSON.stringify(project.rules.map(rule=>rule.corrupted===true))};
const previewBiome=(x,y)=>corruptedRegions[regionTiles[Math.floor(x/16)+','+Math.floor(y/16)]]?'corrupted':null;
const previewTile=(x,y)=>previewTiles[Math.floor(x/16)+','+Math.floor(y/16)];
const smithy=buildings.find(b=>b.open);
const editedSmithy=previewBuildings.find(b=>b.k===smithy.id);
const smithyShift={x:editedSmithy.x-smithy.x,y:editedSmithy.y-smithy.y};
for(const building of buildings){
 const edited=previewBuildings.find(item=>item.k===building.id);
 building.x=edited.x;
 building.y=edited.y;
}
const bridges=[];`);
  source = replaceOnce(source, 'function inWater(x,y){return waterDistance(x,y)<0||craterWall(x,y)}', `
function inWater(x,y){
 const tile=previewTile(x,y);
 return tile ? tile==='water'||tile==='rock' : waterDistance(x,y)<0||craterWall(x,y);
}`);
  source = replaceOnce(source, 'const paths=buildings.map', `for(const station of stations){station.x+=smithyShift.x;station.y+=smithyShift.y}
const paths=buildings.map`);
  source = replaceOnce(source, 'if(waterDistance(xx,yy)<margin)return false;', 'if(previewTile(xx,yy) ? inWater(xx,yy) : waterDistance(xx,yy)<margin)return false;');
  source = replaceOnce(source, 'const r=Math.hypot((x-CX)/305,(y-CY)/235);', 'const r=Math.hypot((x-CX)/previewBounds.rx,(y-CY)/previewBounds.ry);');
  source = replaceOnce(source, 'y>CY+172;', 'y>CY+previewBounds.ry-63;');
  source = replaceOnce(source, 'Math.hypot((x-CX)/305,(y-CY)/235)<.895', 'Math.hypot((x-CX)/previewBounds.rx,(y-CY)/previewBounds.ry)<.895');
  source = replaceOnce(source, 'nx<1492&&ny>108&&ny<1492', 'nx<previewBounds.width-108&&ny>108&&ny<previewBounds.height-108');
  source = replaceOnce(source, 'return {x:800,y:840};', 'return {x:previewBounds.spawnX,y:previewBounds.spawnY};');
  return replaceOnce(source, 'Object.freeze({lake,buildings,', 'Object.freeze({previewBounds,previewTile,previewBiome,lake,buildings,');
}

function patchGame(source, project) {
  source = replaceOnce(source, 'WW=1600,WH=1600', 'WW=MyrrenWorld.previewBounds.width,WH=MyrrenWorld.previewBounds.height');
  source = replaceOnce(source, 'x:CX,y:CY+44};', 'x:MyrrenWorld.previewBounds.spawnX,y:MyrrenWorld.previewBounds.spawnY};');
  source = replaceOnce(source, 'save.x=CX;save.y=CY+44;', 'save.x=MyrrenWorld.previewBounds.spawnX;save.y=MyrrenWorld.previewBounds.spawnY;');
  source = replaceOnce(source, '(wx+8-CX)/305,(wy+8-CY)/235', '(wx+8-CX)/VILLAGE.previewBounds.rx,(wy+8-CY)/VILLAGE.previewBounds.ry');
  source = replaceOnce(source, '(305+wobble),gy=CY+Math.sin(a)*(235+wobble*.7)', '(VILLAGE.previewBounds.rx+wobble),gy=CY+Math.sin(a)*(VILLAGE.previewBounds.ry+wobble*.7)');
  source = replaceOnce(source, 'if(gy>CY+172&&', 'if(gy>CY+VILLAGE.previewBounds.ry-63&&');
  const generated = regionObjects(project);
  const placements = [...project.objects, ...generated];
  const nodes = placements.filter(item => ['Trees','Ores','Fishing'].includes(item.layer));
  const enemies = placements.filter(item => item.layer === 'Enemies');
  source = source.replaceAll('n.back=now+rint(nt.rt[0],nt.rt[1])*1000;',
    'n.back=now+(n.respawn??rint(nt.rt[0],nt.rt[1]))*1000;');
  source = replaceOnce(source, 'm.back=now+12000;', 'm.back=now+(m.respawn??12)*1000;');
  const props = project.objects.filter(item => item.layer === 'Props');
  source = replaceOnce(source, 'establishOuterOreTrail();', `nodes.splice(0,nodes.length,...${JSON.stringify(nodes)}.map(({k,x,y,respawn})=>({k,x,y,respawn,back:0})));
mons.splice(0,mons.length,...${JSON.stringify(enemies)}.map(({k,x,y,respawn})=>({
 t:k,x,y,respawn,hx:x,hy:y,hp:MT[k].hp,state:'idle',back:0,cd:0,w:rnd()*3,wx:x,wy:y,face:1,lunge:-9999
}))); `);
  source = replaceOnce(source, 'const SOLID=DECOR.filter', `
const previewProps=${JSON.stringify(props)};
for(const prop of previewProps)if(prop.k==='fence')DECOR.push(['fence',prop.x,prop.y,24]);
const SOLID=DECOR.filter`);
  source = replaceOnce(source, 'const native=MyrrenEnvironment.terrain(ctx,tx,ty,x,y,d<-18?', `
    const edited=VILLAGE.previewTile(wx+8,wy+8);
    if(edited){
      const tileKind=edited==='rock'||edited==='flowers'?'grass':edited;
      const surface=edited==='rock'?'stone':tileKind==='grass'?VILLAGE.previewBiome(wx+8,wy+8)||tileKind:tileKind;
      const neighbors=[[0,-1,1],[0,1,2],[-1,0,4],[1,0,8]];
      const tileEdges=neighbors.reduce((bits,[dx,dy,bit])=>bits|((VILLAGE.previewTile(wx+8+dx*T,wy+8+dy*T)||pathAt(tx+dx,ty+dy))===edited?0:bit),0);
      const painted=MyrrenEnvironment.terrain(ctx,tx,ty,x,y,tileKind,now,tileEdges,surface);
      if(edited==='rock'&&!painted)R(x,y,16,16,'#6e7167');
      if(edited==='flowers')previewFlower(x+7,y+12);
      continue;
    }
    if(kind==='grass'&&d>24&&VILLAGE.previewBiome(wx+8,wy+8)){
      MyrrenEnvironment.terrain(ctx,tx,ty,x,y,kind,now,0,'corrupted');
      continue;
    }
    const native=MyrrenEnvironment.terrain(ctx,tx,ty,x,y,d<-18?`);
  source = replaceOnce(source, 'function drawOutdoor(cx,cy,now){', `
function previewFlower(x,y){
 R(x,y-4,1,5,'#648540');R(x-1,y-5,3,2,'#d0a3aa');R(x,y-6,1,4,'#d0a3aa');
}
function drawOutdoor(cx,cy,now){`);
  return replaceOnce(source, '  for(const station of VILLAGE.stations)list.push', `
  for(const prop of previewProps){
    if(prop.k==='fence')continue;
    list.push({y:prop.y,f:()=>{
      const x=Math.round(prop.x-cx),y=Math.round(prop.y-cy);
      if(prop.k==='flowers')previewFlower(x,y);
      if(prop.k==='rock'){R(x-5,y-5,10,5,'#6e7167');R(x-3,y-7,6,3,'#999b83')}
      if(prop.k==='lamp'){R(x,y-14,2,14,'#705438');R(x-2,y-17,6,6,'#e9c881')}
    }});
  }
  for(const station of VILLAGE.stations)list.push`);
}

const projectPath = resolve(process.argv[2] || 'myrren-project.json');
const editorSource = await readFile(new URL('./myrren-editor.html', import.meta.url), 'utf8');
function editorDefaults() {
  const extract = name => {
    const match = editorSource.match(new RegExp('^const ' + name + '=(.*);$', 'm'));
    if (!match) throw Error('Embedded editor defaults are missing: ' + name);
    return JSON.parse(match[1]);
  };
  return { format: 'myrren-editor-1', objects: extract('initialObjects'), tiles: {}, sheets: extract('initialSheets') };
}
let projectText;
try {
  projectText = await readFile(projectPath, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  projectText = JSON.stringify(editorDefaults());
}
const source = name => readFile(resolve(publicFolder, name), 'utf8');
const [worldSource, gameSource, indexSource, environmentSource] = await Promise.all([
  source('myrren-world.js'), source('myrren-game.js'), source('index.html'), source('myrren-environment.js')
]);
function walkable(project, x, y) {
  const {width,height,rx,ry}=project.bounds;
  if(x<108||y<108||x>width-109||y>height-109)return false;
  const tile=project.tiles[Math.floor(x/16)+','+Math.floor(y/16)];
  const nx=(x-1250)/161,ny=(y-1055)/108;
  const angle=Math.atan2(ny,nx);
  const lakeEdge=1+.12*Math.sin(2*angle+.65)+.065*Math.sin(3*angle-1.1)+.035*Math.cos(5*angle+.4);
  const campRadius=Math.hypot((x-800)/rx,(y-800)/ry);
  const wall=campRadius>.895&&campRadius<1.085&&!(Math.abs(x-800)<55&&y>800+ry-63);
  const blocked=project.objects.some(o=>o.layer==='Buildings'&&o.k!=='arms'&&Math.abs(x-o.x)<({axe:56,pick:56,food:56,fish:54}[o.k])/2+3&&y>o.y-14&&y<o.y||
    o.layer==='Props'&&o.k==='fence'&&x>o.x-2&&x<o.x+26&&y>o.y-3&&y<o.y+2);
  return !blocked && !(tile ? tile==='water'||tile==='rock' : Math.hypot(nx,ny)<lakeEdge||wall);
}
function regionObjects(project) {
  const placements=[];
  for(const key of Object.keys(project.regionTiles).sort()){
    const rule=project.rules[project.regionTiles[key]];
    const [tx,ty]=key.split(',').map(Number);
    // A stable lattice keeps placements fixed as you expand the painted area.
    const step=Math.ceil(rule.spacing/16);
    if(tx%step!==Math.floor(step/2)||ty%step!==Math.floor(step/2))continue;
    const kinds=[['Enemies',rule.enemy,rule.enemyRespawn],['Trees',rule.tree,rule.resourceRespawn],['Ores',rule.ore,rule.resourceRespawn]].filter(([,kind])=>kind);
    if(!kinds.length)continue;
    const [layer,k,respawn]=kinds[(Math.floor(tx/step)+Math.floor(ty/step))%kinds.length];
    const x=tx*16+8,y=ty*16+8;
    if(!walkable(project,x,y)||Math.hypot(x-project.bounds.spawnX,y-project.bounds.spawnY)<32||
        project.objects.some(o=>Math.hypot(x-o.x,y-o.y)<24))continue;
    placements.push({layer,k,respawn,x,y});
  }
  return placements;
}
function buildPreview(project, playtest=false) {
  const world = patchWorld(worldSource, project);
  const {spawnX:x,spawnY:y}=project.bounds;
  if(!walkable(project,x,y))throw Error('Choose a walkable player spawn.');
  let game=patchGame(gameSource, project);
  if(playtest){
    game=replaceOnce(game,'function persist(force){','function persist(force){return;');
    game=replaceOnce(game,'if(!loadLocalProgress()){finalizeSave();save.inv.coins=30}',
      "finalizeSave();save.inv.coins=30;save.bag.push('bronze_sword','bronze_pick','bronze_axe');");
    game=replaceOnce(game,'bootLoad();','finishLoad(); if(window.MyrrenKezV2Atlas?.ready)start(); else window.addEventListener("myrren-kez-v2-ready",start,{once:true});');
  }
  return new Map([
    ['/myrren-environment.js', replaceOnce(environmentSource, "const continuousTrail=world?.pathDistance&&(kind==='path'||kind==='grass');", "const continuousTrail=world?.pathDistance&&!world.previewTile?.(tx*16+8,ty*16+8)&&(kind==='path'||kind==='grass');")],
    ['/myrren-world.js', world],
    ['/myrren-game.js', game],
    ['/index.html', replaceOnce(indexSource, '<title>Tales of Myrren</title>', '<title>Myrren Project Preview</title>')],
    ...project.sheets.map((sheet,index) => [atlasPaths[index],sheet])
  ]);
}
let overrides = buildPreview(validate(JSON.parse(projectText)));
let saving = false;

async function saveProject(request, response, playtest) {
  if (request.headers.origin !== 'http://' + request.headers.host ||
      request.headers['content-type'] !== 'application/json') {
    response.writeHead(403, security).end('Open the local editor to save.');
    return;
  }
  if (saving) {
    response.writeHead(409, security).end('A save is already in progress.');
    return;
  }
  saving = true;
  const temporary = projectPath + '.' + process.pid + '.tmp';
  let created = false;
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) {
        response.writeHead(413, security).end('Project exceeds 4 MB.');
        return;
      }
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    let next;
    try {
      const data=JSON.parse(text);
      if(playtest)data.bounds={...data.bounds,spawnX:data.playtestX,spawnY:data.playtestY};
      next=buildPreview(validate(data),playtest);
    }
    catch (error) {
      response.writeHead(422, security).end(error.message);
      return;
    }
    if(playtest){
      draftOverrides=next;
      response.writeHead(200,{...security,'Content-Type':'text/plain'}).end('http://127.0.0.1:'+draftServer.address().port+'/');
      return;
    }
    await writeFile(temporary, text, { flag: 'wx' });
    created = true;
    await rename(temporary, projectPath);
    created = false;
    projectText = text;
    overrides = next;
    response.writeHead(204, security).end();
  } catch (error) {
    console.error(error.message);
    response.writeHead(500, security).end('Could not write the local project file.');
  } finally {
    if (created) await unlink(temporary).catch(() => {});
    saving = false;
  }
}

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
async function serveGame(parsed,response,files,headers=security) {
  try {
    const path = decodeURIComponent(parsed.pathname === '/' ? '/index.html' : parsed.pathname);
    let body = files.get(path);
    if (body === undefined) {
      const candidate = await realpath(resolve(publicFolder, '.' + path));
      if (!candidate.startsWith(publicFolder + sep)) { response.writeHead(404, headers).end(); return; }
      body = await readFile(candidate);
    }
    response.writeHead(200, { ...headers, 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, headers).end('File unavailable');
  }
}

let draftOverrides;
const draftServer=createServer((request,response)=>{
  if(request.headers.host!=='127.0.0.1:'+draftServer.address().port||request.method!=='GET'||!draftOverrides){
    response.writeHead(404,security).end();return;
  }
  const parent='http://127.0.0.1:'+server.address().port;
  const headers={...security,'Content-Security-Policy':security['Content-Security-Policy'].replace("frame-ancestors 'none'",'frame-ancestors '+parent)};
  return serveGame(new URL(request.url,'http://localhost'),response,draftOverrides,headers);
});
const server = createServer(async (request, response) => {
  if (request.headers.host !== '127.0.0.1:' + server.address().port) {
    response.writeHead(403, security).end();
    return;
  }
  const parsed = new URL(request.url, 'http://localhost');
  if (request.method === 'POST' && ['/editor/project.json','/editor/playtest'].includes(parsed.pathname)) {
    await saveProject(request, response, parsed.pathname==='/editor/playtest');
    return;
  }
  if (request.method !== 'GET') { response.writeHead(405, security).end(); return; }
  if (parsed.pathname === '/editor') {
    const frame='http://127.0.0.1:'+draftServer.address().port;
    const policy=security['Content-Security-Policy']+'; frame-src '+frame;
    response.writeHead(200, { ...security, 'Content-Security-Policy':policy, 'Content-Type': mime['.html'] }).end(editorSource);
    return;
  }
  if (parsed.pathname === '/editor/project.json') {
    response.writeHead(200, { ...security, 'Content-Type': 'application/json' }).end(projectText);
    return;
  }
  await serveGame(parsed,response,overrides);
});
await new Promise(resolve=>draftServer.listen(0,'127.0.0.1',resolve));
server.listen(0, '127.0.0.1', () => {
  console.log('Open http://127.0.0.1:' + server.address().port + '/editor for the editor and local game.');
  console.log('Saves go to ' + projectPath + '. Press Ctrl+C to stop.');
});
