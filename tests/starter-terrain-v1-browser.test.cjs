'use strict';
// Real browser gameplay proof. Intercepts environment.js in MEMORY ONLY.
// No saved characters, collision data, game renderer source or tiles are altered.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'../public');
const OUT='/tmp/myrren-starter-terrain-gameplay-qa';
fs.mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(ROOT,'.'+(p==='/'?'/index.html':p));
 if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end('Forbidden');return}
 try{
  if(!fs.statSync(file).isFile())throw Error('No file');
  res.setHeader('Content-Type',MIME[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 }catch(e){res.writeHead(404);res.end('Not found')}
});
const terrainProof=[
 'if(window.__terrainQaEnabled && window.__terrainQaAtlas?.naturalWidth===128 &&',
 '   window.__terrainQaAtlas?.naturalHeight===112){',
 ' const n=(hash(tx+31,ty-77)%8);',
 ' let idx=0;',
 ' if(kind==="grass"||kind==="boundary")idx=n;',
 ' else if(kind==="path"){',
 '   const connected=(dx,dy)=>["path","plaza"].includes(',
 '     window.MyrrenWorld.pathKind((tx+dx)*16+8,(ty+dy)*16+8));',
 '   const mask=(connected(0,-1)?1:0)|(connected(1,0)?2:0)|',
 '     (connected(0,1)?4:0)|(connected(-1,0)?8:0);',
 '   idx=24+mask;',
 ' }',
 ' else if(kind==="plaza")idx=12+(n%4);',
 ' else if(kind==="water"){',
 '   const connected=(dx,dy)=>window.MyrrenWorld.waterDistance(',
 '      (tx+dx)*16+8,(ty+dy)*16+8)<-18;',
 '   const mask=(connected(0,-1)?1:0)|(connected(1,0)?2:0)|',
 '     (connected(0,1)?4:0)|(connected(-1,0)?8:0);',
 '   idx=mask===15?16+(n%4):40+mask;',
 ' }',
 ' else if(kind==="shore")idx=40+(n%16);',
 ' else idx=n;',
 ' ctx.save();ctx.imageSmoothingEnabled=false;',
 ' ctx.drawImage(window.__terrainQaAtlas, (idx%8)*16, Math.floor(idx/8)*16,',
 '   16,16,Math.round(x),Math.round(y),16,16);ctx.restore();',
 ' window.__terrainQaDrawCount=(window.__terrainQaDrawCount||0)+1;',
 ' return;',
 '}'
].join('\n');
const qaHook=[
 'window.__terrainQaPlace=function(x,y){',
 '  for(const m of mons){m.state="dead";m.back=Number.MAX_SAFE_INTEGER}',
 '  const p=window.MyrrenWorld.safePosition(x,y);',
 '  me.x=p.x;me.y=p.y;me.ox=p.x;me.oy=p.y;me.hp=hpMax();',
 '  me.deathAt=null;me.hurtAt=-99999;me.swing=-99999;',
 '  me.pend=0;me.dv="d";me.face=1;me.moving=false;',
 '  inside=null;act=null;marker=null;snapCam=true;',
 '  cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;',
 '  return {x:me.x,y:me.y};',
 '};'
].join('\n');
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser;
 const report=[];
 try{
  browser=await chromium.launch({headless:true});
  for(const device of [{name:'desktop',width:1100,height:700,dpr:1,mobile:false},
                       {name:'mobile',width:390,height:844,dpr:2,mobile:true}]){
   const context=await browser.newContext({viewport:{width:device.width,height:device.height},
       deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__terrainQaEnabled=false;window.__terrainQaDrawCount=0;
    window.__terrainQaAtlas=new Image();
    window.__terrainQaAtlas.src='/assets/terrain/starter_terrain_v1.png';
   });
   await page.route('**/myrren-environment.js?*',async route=>{
    const response=await route.fetch();const source=await response.text();
    const needle='function terrain(ctx,tx,ty,x,y,kind,now,edge=0){';
    assert(source.includes(needle),'environment terrain signature changed');
    await route.fulfill({response,body:source.replace(needle,needle+'\n'+terrainProof+'\n')});
   });
   await page.route('**/myrren-game.js?*',async route=>{
    const response=await route.fetch();const source=await response.text();
    const marker='})();';const i=source.lastIndexOf(marker);
    assert(i>0&&source.includes('const nodes=[]'),'real game bootstrap changed');
    await route.fulfill({response,body:source.slice(0,i)+qaHook+'\n'+source.slice(i)});
   });
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready&&
       !!window.__terrainQaPlace&&!document.getElementById('go').disabled,
       null,{timeout:20000});
   await page.waitForFunction(()=>window.__terrainQaAtlas?.naturalWidth===128,
       null,{timeout:12000});
   await page.locator('#nick').fill('Myrren QA');
   await page.locator('#go').click();
   await page.waitForFunction(()=>document.getElementById('intro').hidden,null,{timeout:6000});
   const scenes=[
    ['crater-camp',800,840],
    ['southern-trail',800,1320],
    ['outer-woodland',560,1190],
    ['lake-edge',1170,1060]
   ];
   for(const [name,x,y] of scenes){
    const position=await page.evaluate(({x,y})=>window.__terrainQaPlace(x,y),{x,y});
    await page.waitForTimeout(250);
    const oldShot=device.name+'-'+name+'-current.png';
    await page.locator('#cv').screenshot({path:path.join(OUT,oldShot)});
    await page.evaluate(()=>{window.__terrainQaEnabled=true;window.__terrainQaDrawCount=0});
    await page.waitForFunction(()=>window.__terrainQaDrawCount>100,null,{timeout:7000});
    await page.waitForTimeout(180);
    const newShot=device.name+'-'+name+'-native-png.png';
    await page.locator('#cv').screenshot({path:path.join(OUT,newShot)});
    report.push({device:device.name,scene:name,playerPosition:position,
      before:oldShot,after:newShot,renderMethod:'original 16px PNG tiles via test-browser override',
      gameSourceModified:false});
    await page.evaluate(()=>window.__terrainQaEnabled=false);
   }
   assert.deepEqual(errors,[],'uncaught runtime exceptions on '+device.name);
   await context.close();
  }
  fs.writeFileSync(path.join(OUT,'scene-report.json'),
    JSON.stringify({status:'actual-game-qa-only',productionGameChanged:false,scenes:report},null,2)+'\n');
  console.log('PASS: 16 real game screenshots, 4 scenes x 2 view modes x desktop/mobile; original Kez unchanged.');
 }finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
