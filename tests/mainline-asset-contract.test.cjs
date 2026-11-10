'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const publicDir=path.resolve(__dirname,'../public');
const entry=fs.readFileSync(path.join(publicDir,'index.html'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../wrangler.jsonc'),'utf8'));
// Prevent a future editor from accidentally restoring an old runnable root build.
const retired=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const archive=fs.readFileSync(path.join(__dirname,'../backups/root-index-pre-canonical-2026-11-08.html'),'utf8');
assert(retired.includes('LEGACY_ENTRY_RETIRED')&&retired.includes('public/index.html'),'root entry must direct editors to the deployed game');
assert(retired.length<4096,'root entry must not contain a competing game runtime');
assert(archive.length>100000&&archive.includes('<title>Tales of Myrren</title>'),'historical game copy must remain recoverable');

assert.equal(config.assets.directory,'./public','Cloudflare must serve the canonical public directory');
const scripts=[...entry.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map(m=>m[1]);
assert(scripts.length>=3,'missing game dependency scripts');
assert.equal(scripts.filter(s=>s.startsWith('/myrren-game.js')).length,1,'game must boot exactly once');
assert.equal(scripts.some(s=>s.startsWith('/myrren-world.js')),true,'missing world geometry');
assert.equal(scripts.some(s=>s.startsWith('/myrren-environment.js')),true,'missing environment module');
assert(scripts.indexOf(scripts.find(s=>s.includes('myrren-world.js')))<scripts.indexOf(scripts.find(s=>s.includes('myrren-game.js'))),'world must load before game runtime');
const assetFiles=new Set();
for(const src of [...scripts,...[...entry.matchAll(/<link[^>]+href="([^"]+\.css(?:\?[^"]*)?)"/g)].map(m=>m[1])]){
  if(!src.startsWith('/'))continue;
  const file=path.resolve(publicDir,'.'+src.split('?')[0]);
  assert(file.startsWith(publicDir+path.sep),'asset path escapes public/');
  assert(fs.existsSync(file),'missing deployed script/style '+src);
  assert(!assetFiles.has(src.split('?')[0]),'duplicate asset script '+src);
  assetFiles.add(src.split('?')[0]);
}
const game=fs.readFileSync(path.join(publicDir,'myrren-game.js'),'utf8');
// A new mining build must invalidate the previous script URL; otherwise
// long-lived in-app browser tabs can keep the old one-yield ore logic.
const gameSrc=scripts.find(s=>s.startsWith('/myrren-game.js'));
const buildVersion=/^\/myrren-game\.js\?v=(\d+)$/.exec(gameSrc);
const runtimeVersion=/window\.MyrrenBuild=(\d+);/.exec(game);
assert(buildVersion&&runtimeVersion,'game HTML/runtime require matching build markers');
assert.equal(Number(buildVersion[1]),Number(runtimeVersion[1]),
  'Cloudflare script URL and the loaded game build must match');
assert(Number(runtimeVersion[1])>=84,'multi-ore update must not reuse the old v83 bundle');
assert(game.includes('const veinExhausted=nt.skill===\'mining\'&&consumeOreVein(n,nt,now)'),
  'mining success must use the multi-yield depletion handler');
assert(game.includes('ores left in this vein'),
  'running game must visibly confirm ore durability to the player');
assert(game.includes("chatLines.slice(-2)"),'mobile notification log must show at most two items');
assert(game.includes('Starter tools: Trader Gus.'),'welcome instructions should remain compact');
assert(game.includes("buys:[...new Set([...SHOPS.axe.buys,...SHOPS.pick.buys,...SHOPS.fish.buys])]"),'Crater trader must retain resource buyback');
const css=fs.readFileSync(path.join(publicDir,'myrren-ui.css'),'utf8');
assert(css.includes('-webkit-line-clamp:2'),'chat messages must clamp');
assert(!entry.includes('id="minimap"'),'canonical game must not restore the retired minimap');
assert(!css.includes('#minimap'),'retired minimap CSS must not return');
console.log('PASS: canonical Cloudflare entry, dependency files/order, single runtime registration, mobile HUD and Crater economy contracts.');
