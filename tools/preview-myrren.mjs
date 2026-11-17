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
const atlasPaths = ['myrren_idle_4dir_native.png', 'myrren_walk_4x6_native.png'].map(name => assetFolder + name);
const security = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function validate(data) {
  if (data?.format !== 'myrren-editor-1' || !Array.isArray(data.objects) || data.objects.length > 10000 ||
      !data.tiles || typeof data.tiles !== 'object' || Array.isArray(data.tiles) ||
      !Array.isArray(data.sheets) || data.sheets.length !== 2) {
    throw Error('Use a project JSON exported by Myrren Editor.');
  }
  const objects = data.objects.map(item => {
    if (!item || !Object.hasOwn(types, item.layer) || !types[item.layer].includes(item.k) ||
        ![item.x, item.y].every(value => Number.isFinite(value) && value >= 0 && value < 1600)) {
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
    if (!/^(0|[1-9]\d?),(0|[1-9]\d?)$/.test(key) || !tileTypes.includes(kind)) {
      throw Error('Project contains an invalid terrain tile.');
    }
  }
  const sheets = data.sheets.map((value, index) => {
    const match = typeof value === 'string' && /^data:image\/png;base64,([A-Za-z0-9+/]+=*)$/.exec(value);
    const png = match && Buffer.from(match[1], 'base64');
    const [width, height] = index ? [144, 128] : [96, 32];
    if (!png || png.length < 33 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a' ||
        png.toString('ascii', 12, 16) !== 'IHDR' || png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) {
      throw Error('Invalid sprite sheet. Expected a ' + width + ' × ' + height + ' PNG.');
    }
    return png;
  });
  return { objects, tiles: data.tiles, sheets };
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
const previewBuildings=${JSON.stringify(buildings)};
const previewTiles=${JSON.stringify(project.tiles)};
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
  return replaceOnce(source, 'Object.freeze({lake,buildings,', 'Object.freeze({previewTile,lake,buildings,');
}

function patchGame(source, project) {
  const nodes = project.objects.filter(item => ['Trees','Ores','Fishing'].includes(item.layer));
  const enemies = project.objects.filter(item => item.layer === 'Enemies');
  const props = project.objects.filter(item => item.layer === 'Props');
  source = replaceOnce(source, 'establishOuterOreTrail();', `nodes.splice(0,nodes.length,...${JSON.stringify(nodes)}.map(({k,x,y})=>({k,x,y,back:0})));
mons.splice(0,mons.length,...${JSON.stringify(enemies)}.map(({k,x,y})=>({
 t:k,x,y,hx:x,hy:y,hp:MT[k].hp,state:'idle',back:0,cd:0,w:rnd()*3,wx:x,wy:y,face:1,lunge:-9999
}))); `);
  source = replaceOnce(source, 'const SOLID=DECOR.filter', `
const previewProps=${JSON.stringify(props)};
for(const prop of previewProps)if(prop.k==='fence')DECOR.push(['fence',prop.x,prop.y,24]);
const SOLID=DECOR.filter`);
  source = replaceOnce(source, 'const native=MyrrenEnvironment.terrain(ctx,tx,ty,x,y,d<-18?', `
    const edited=VILLAGE.previewTile(wx+8,wy+8);
    if(edited){
      const tileKind=edited==='rock'||edited==='flowers'?'grass':edited;
      const surface=edited==='rock'?'stone':tileKind;
      const neighbors=[[0,-1,1],[0,1,2],[-1,0,4],[1,0,8]];
      const tileEdges=neighbors.reduce((bits,[dx,dy,bit])=>bits|((VILLAGE.previewTile(wx+8+dx*T,wy+8+dy*T)||pathAt(tx+dx,ty+dy))===edited?0:bit),0);
      const painted=MyrrenEnvironment.terrain(ctx,tx,ty,x,y,tileKind,now,tileEdges,surface);
      if(edited==='rock'&&!painted)R(x,y,16,16,'#6e7167');
      if(edited==='flowers')previewFlower(x+7,y+12);
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
function buildPreview(project) {
  return new Map([
    ['/myrren-environment.js', replaceOnce(environmentSource, "const continuousTrail=world?.pathDistance&&(kind==='path'||kind==='grass');", "const continuousTrail=world?.pathDistance&&!world.previewTile?.(tx*16+8,ty*16+8)&&(kind==='path'||kind==='grass');")],
    ['/myrren-world.js', patchWorld(worldSource, project)],
    ['/myrren-game.js', patchGame(gameSource, project)],
    ['/index.html', replaceOnce(indexSource, '<title>Tales of Myrren</title>', '<title>Myrren Project Preview</title>')],
    ...atlasPaths.map((path, index) => [path, project.sheets[index]])
  ]);
}
let overrides = buildPreview(validate(JSON.parse(projectText)));
let saving = false;

async function saveProject(request, response) {
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
    try { next = buildPreview(validate(JSON.parse(text))); }
    catch (error) {
      response.writeHead(422, security).end(error.message);
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
const server = createServer(async (request, response) => {
  try {
    if (request.headers.host !== '127.0.0.1:' + server.address().port) {
      response.writeHead(403, security).end();
      return;
    }
    const parsed = new URL(request.url, 'http://localhost');
    if (request.method === 'POST' && parsed.pathname === '/editor/project.json') {
      await saveProject(request, response);
      return;
    }
    if (request.method !== 'GET') { response.writeHead(405, security).end(); return; }
    if (parsed.pathname === '/editor') {
      response.writeHead(200, { ...security, 'Content-Type': mime['.html'] }).end(editorSource);
      return;
    }
    if (parsed.pathname === '/editor/project.json') {
      response.writeHead(200, { ...security, 'Content-Type': 'application/json' }).end(projectText);
      return;
    }
    const path = decodeURIComponent(parsed.pathname === '/' ? '/index.html' : parsed.pathname);
    let body = overrides.get(path);
    if (body === undefined) {
      const candidate = await realpath(resolve(publicFolder, '.' + path));
      if (!candidate.startsWith(publicFolder + sep)) { response.writeHead(404, security).end(); return; }
      body = await readFile(candidate);
    }
    response.writeHead(200, { ...security, 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, security).end('File unavailable');
  }
});
server.listen(0, '127.0.0.1', () => {
  console.log('Open http://127.0.0.1:' + server.address().port + '/editor for the editor and local game.');
  console.log('Saves go to ' + projectPath + '. Press Ctrl+C to stop.');
});
