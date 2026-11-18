#!/usr/bin/env node
// From a checkout of the editor branch: node tools/preview-myrren.mjs myrren-project.json
import { spawn } from 'node:child_process';
import { appUpdatesEnabled,checkAppUpdate,installAppUpdate } from './app-updates.mjs';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve, extname, sep, basename, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
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
const defaultBounds={width:1600,height:1600,rx:305,ry:235,spawnX:800,spawnY:844};
const tileTypes = ['grass', 'path', 'plaza', 'water', 'rock', 'flowers'];
const treeSpecies=['pine','birch','oak','willow','maple','ironbark'];
const assetFolder = '/assets/myrren-v19f/';
const atlasPaths = ['myrren_idle_4dir_native.png', 'myrren_walk_4x6_native.png', 'myrren_punch_4dir_native.png', 'myrren_punch_stride_4dir_native.png', 'myrren_sword_body_4dir.png'].map(name => assetFolder + name);
const security = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function validate(data,{allowIncomplete=false}={}) {
  if (data?.format !== 'myrren-editor-1' || !Array.isArray(data.objects) || data.objects.length > 10000 ||
      !data.tiles || typeof data.tiles !== 'object' || Array.isArray(data.tiles) ||
      !Array.isArray(data.sheets) || ![2, 5].includes(data.sheets.length)) {
    throw Error('Use a project JSON exported by Myrren Editor.');
  }
  const bounds = data.bounds ?? defaultBounds;
  const limits = [['width',1600,6400,16],['height',1600,6400,16],['rx',180,480,1],['ry',150,400,1],
    ['spawnX',108,bounds.width-109,1],['spawnY',108,bounds.height-109,1]];
  if (!limits.every(([key,min,max,step]) => Number.isInteger(bounds[key]) && bounds[key]>=min &&
      bounds[key]<=max && bounds[key]%step===0)) throw Error('Invalid world or camp size or spawn position.');
  const objects = data.objects.map(item => {
    if (!item || !Object.hasOwn(types, item.layer) || !types[item.layer].includes(item.k) ||
        ![item.x, item.y].every((value,index) => Number.isFinite(value) && value >= 0 && value < (index ? bounds.height : bounds.width))) {
      throw Error('Project contains an invalid map object.');
    }
    const {layer,k,x,y,previewTree,previewVariant}=item;
    if((previewTree!==undefined&&(layer!=='Trees'||!treeSpecies.includes(previewTree)))||
       (previewVariant!==undefined&&(layer!=='Trees'||!['a','b'].includes(previewVariant))))throw Error('Invalid tree artwork selection.');
    return {layer,k,x,y,previewTree,previewVariant};
  });
  for (const kind of allowIncomplete?[]:types.Buildings) {
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

const projectPath = resolve(process.argv[2] || 'myrren-project.json');
const recoveryFolder=join(dirname(projectPath),'recovery');
const recoveryPath=join(recoveryFolder,basename(projectPath));
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
const bladeAtlas='/swords-forged-v1.png';
const assetRoots=['assets/resources/v32','assets/resources/v34','assets/terrain','assets/myrren-v19f'];
async function gameAssets(){
 const assets=[];
 for(const folder of assetRoots){
  const entries=await readdir(resolve(publicFolder,folder),{withFileTypes:true}).catch(error=>{
   if(error.code==='ENOENT')return [];
   throw error;
  });
  for(const file of entries){
   if(!file.isFile()||!/^[a-z0-9_-]+\.png$/i.test(file.name))continue;
   const path='/'+folder+'/'+file.name;
   const bytes=await readFile(resolve(publicFolder,folder,file.name));
   if(bytes.length<33||bytes.toString('hex',0,8)!=='89504e470d0a1a0a')continue;
   assets.push({path,hash:createHash('sha256').update(bytes).digest('hex'),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)});
  }
 }
 const blades=await readFile(resolve(publicFolder,bladeAtlas.slice(1))).catch(()=>null);
 if(blades?.length>=33&&blades.toString('hex',0,8)==='89504e470d0a1a0a')
  assets.push({path:bladeAtlas,hash:createHash('sha256').update(blades).digest('hex'),width:blades.readUInt32BE(16),height:blades.readUInt32BE(20)});
 const [entry,version]=await Promise.all([source('index.html'),source('myrren-preview-config.js').catch(()=>null)]);
 const issues=[];
 if(!version?.includes('MyrrenPlaytest API v1')||!entry.includes('src="/myrren-preview-config.js"'))
  issues.push('This checkout is missing the Myrren Playtest API v1 entry point.');
 for(const [index,path] of atlasPaths.entries()){
  const item=assets.find(asset=>asset.path===path);
  const [width,height]=[[96,32],[144,128],[336,144],[384,864],[384,1008]][index];
  if(!item||item.width!==width||item.height!==height)issues.push(path.split('/').pop()+' needs a '+width+' × '+height+' PNG.');
 }
 return {version:1,issues,assets:assets.sort((a,b)=>a.path.localeCompare(b.path))};
}

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
const kits={
 fresh:{levels:{},bag:['bronze_sword','bronze_pick','bronze_axe'],weapon:null,food:0},
 miner:{levels:{mining:80},bag:['bronze_sword','bronze_axe'],weapon:'bronze_pick',food:6},
 fighter:{levels:{melee:70},bag:['bronze_pick','bronze_axe'],weapon:'starsteel_sword',food:18}
};
function buildPreview(project,editorOrigin=null,kit='fresh',mapRender=false) {
 const {spawnX:x,spawnY:y}=project.bounds;
 if(!mapRender&&!walkable(project,x,y))throw Error('Choose a walkable player spawn.');
 if(!Object.hasOwn(kits,kit))throw Error('Unknown playtest loadout.');
 const placements=[...project.objects,...regionObjects(project)];
 const rules=project.rules;
 const config={version:1,editorOrigin,mapRender,kit:kits[kit],bounds:project.bounds,tiles:project.tiles,
  corrupted:Object.keys(project.regionTiles).filter(key=>rules[project.regionTiles[key]].corrupted===true),
  buildings:placements.filter(item=>item.layer==='Buildings'),
  nodes:placements.filter(item=>['Trees','Ores','Fishing'].includes(item.layer)),
  enemies:placements.filter(item=>item.layer==='Enemies'),
  props:placements.filter(item=>item.layer==='Props')};
 return new Map([
  ['/myrren-preview-config.js','window.MyrrenPlaytest='+JSON.stringify(config)+';'],
  ...project.sheets.map((sheet,index)=>[atlasPaths[index],sheet])
 ]);
}
let overrides = buildPreview(validate(JSON.parse(projectText)));
let saving = false;
let recovering=false;
let renderConfig=null;

async function saveProject(request, response, mode) {
  const playtest=mode==='playtest',render=mode==='render',recovery=mode==='recovery';
  if (request.headers.origin !== 'http://' + request.headers.host ||
      request.headers['content-type'] !== 'application/json') {
    response.writeHead(403, security).end('Open the local editor to save.');
    return;
  }
  if (recovery?recovering:saving) {
    response.writeHead(409, security).end('A save is already in progress.');
    return;
  }
  if(recovery)recovering=true;else saving=true;
  const destination=recovery?recoveryPath:projectPath;
  const temporary=destination+'.'+process.pid+'.tmp';
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
      if(recovery){
        validate(data,{allowIncomplete:true});
      }else{
        if(playtest||render){
          const {issues}=await gameAssets();
          if(issues.length)throw Error(issues.join(' '));
        }
        if(playtest)data.bounds={...(data.bounds??defaultBounds),spawnX:data.playtestX,spawnY:data.playtestY};
        next=buildPreview(validate(data),playtest||render?request.headers.origin:null,playtest?data.playtestKit??'fresh':'fresh',render);
      }
    }
    catch (error) {
      response.writeHead(422, security).end(error.message);
      return;
    }
    if(render){
      renderConfig=next.get('/myrren-preview-config.js');
      response.writeHead(204,security).end();
      return;
    }
    if(playtest){
      draftOverrides=next;
      response.writeHead(200,{...security,'Content-Type':'text/plain'}).end('http://127.0.0.1:'+draftServer.address().port+'/');
      return;
    }
    if(recovery)await mkdir(recoveryFolder,{recursive:true});
    await writeFile(temporary, text, { flag: 'wx' });
    created = true;
    await rename(temporary,destination);
    created=false;
    if(!recovery){
      projectText=text;
      overrides=next;
    }
    response.writeHead(204, security).end();
  } catch (error) {
    console.error(error.message);
    response.writeHead(500, security).end(recovery?'Could not write the recovery draft.':'Could not write the local project file.');
  } finally {
    if (created) await unlink(temporary).catch(() => {});
    if(recovery)recovering=false;else saving=false;
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
  if (request.method === 'POST' && ['/editor/project.json','/editor/playtest','/editor/render','/editor/recovery'].includes(parsed.pathname)) {
    await saveProject(request,response,parsed.pathname.split('/').pop());
    return;
  }
  if(request.method==='POST'&&['/editor/app-update/check','/editor/app-update/install'].includes(parsed.pathname)){
    if(request.headers.origin!=='http://'+request.headers.host||!appUpdatesEnabled){
      response.writeHead(403,security).end();return;
    }
    try{
      const state=await (parsed.pathname.endsWith('/install')?installAppUpdate():checkAppUpdate());
      response.writeHead(200,{...security,'Content-Type':'application/json'}).end(JSON.stringify(state));
    }catch(error){response.writeHead(503,security).end(error.message)}
    return;
  }
  if (request.method !== 'GET') { response.writeHead(405, security).end(); return; }
  if (parsed.pathname === '/editor') {
    const frame='http://127.0.0.1:'+draftServer.address().port;
    const policy=security['Content-Security-Policy']+"; frame-src 'self' "+frame;
    response.writeHead(200, { ...security, 'Content-Security-Policy':policy, 'Content-Type': mime['.html'] }).end(appUpdatesEnabled?editorSource.replace('id="checkAppUpdate" hidden','id="checkAppUpdate"'):editorSource);
    return;
  }
  if(parsed.pathname==='/editor/render-view'){
    if(!renderConfig){response.writeHead(404,security).end();return}
    const html=(await source('index.html')).replace('/myrren-preview-config.js','/editor/render-config.js');
    const policy=security['Content-Security-Policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'");
    response.writeHead(200,{...security,'Content-Security-Policy':policy,'Content-Type':mime['.html']}).end(html);
    return;
  }
  if(parsed.pathname==='/editor/render-config.js'){
    if(!renderConfig){response.writeHead(404,security).end();return}
    response.writeHead(200,{...security,'Content-Type':mime['.js']}).end(renderConfig);
    return;
  }
  if(parsed.pathname==='/editor/recovery'){
    try{
      const draft=await readFile(recoveryPath,'utf8');
      if(draft===projectText){response.writeHead(204,security).end();return}
      response.writeHead(200,{...security,'Content-Type':'application/json'}).end(draft);
    }catch(error){
      if(error.code==='ENOENT')response.writeHead(204,security).end();
      else response.writeHead(500,security).end('Could not read the recovery draft.');
    }
    return;
  }
  if (parsed.pathname === '/editor/project.json') {
    response.writeHead(200, { ...security, 'Content-Type': 'application/json' }).end(projectText);
    return;
  }
  if(parsed.pathname==='/editor/game-assets'){
    try{
      const manifest=await gameAssets();
      response.writeHead(200,{...security,'Content-Type':'application/json'}).end(JSON.stringify(manifest));
    }catch(error){
      if(!response.headersSent)response.writeHead(503,security);
      response.end('Could not read game assets: '+error.message);
    }
    return;
  }
  if(parsed.pathname.startsWith('/editor/asset-file/')){
    const path=parsed.pathname.slice('/editor/asset-file'.length);
    if((path!==bladeAtlas&&!assetRoots.some(folder=>path.startsWith('/'+folder+'/')))||!/^\/[a-z0-9/_-]+\.png$/i.test(path)){
      response.writeHead(404,security).end();return;
    }
    await serveGame(new URL(path,parsed.origin),response,new Map());
    return;
  }
  await serveGame(parsed,response,overrides);
});
await new Promise(resolve=>draftServer.listen(0,'127.0.0.1',resolve));
server.listen(0, '127.0.0.1', () => {
  const url='http://127.0.0.1:'+server.address().port+'/editor';
  console.log('Open '+url+' for the editor and local game.');
  if(process.env.MYRREN_OPEN_BROWSER==='1'){
    const browser=spawn('xdg-open',[url],{stdio:'ignore'});
    browser.on('error',()=>console.log('Open the editor address above in your browser.'));
  }
  console.log('Saves go to ' + projectPath + '. Press Ctrl+C to stop.');
});
