'use strict';
// Real browser comparison using the production terrain path and its existing fallback.
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
    window.__terrainQaEnabled=false;window.__terrainQaDrawCount=0;window.__terrainQaCorruptedCount=0;
    const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(image?.src?.includes('starter_terrain_v1.png')){
      window.__terrainQaDrawCount++;
      // Atlas cells 20/21 are corrupted. They must not leak into the starter lake.
      if((args[0]===64||args[0]===80)&&args[1]===32)window.__terrainQaCorruptedCount++;
     }
     return draw.call(this,image,...args);
    };
   });
   await page.route('**/myrren-environment.js?*',async route=>{
    const response=await route.fetch();const source=await response.text();
    const needle='const nativeTerrainReady=()=>';
    assert(source.includes(needle),'environment terrain signature changed');
    await route.fulfill({response,body:source.replace(needle,needle+'window.__terrainQaEnabled && ')});
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
   await page.waitForFunction(()=>(window.__terrainQaEnabled=true,window.MyrrenEnvironment?.nativeTerrainReady()),
       null,{timeout:12000});
   await page.evaluate(()=>{window.__terrainQaEnabled=false});
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
    await page.evaluate(()=>{window.__terrainQaEnabled=true;window.__terrainQaDrawCount=0;window.__terrainQaCorruptedCount=0});
    await page.waitForFunction(()=>window.__terrainQaDrawCount>100,null,{timeout:7000});
    await page.waitForTimeout(180);
    if(name==='lake-edge'){
     const corruptedDraws=await page.evaluate(()=>window.__terrainQaCorruptedCount);
     assert.equal(corruptedDraws,0,'Starter lake must not acquire an abrupt corrupted-grass rectangle');
    }
    const newShot=device.name+'-'+name+'-native-png.png';
    await page.locator('#cv').screenshot({path:path.join(OUT,newShot)});
    report.push({device:device.name,scene:name,playerPosition:position,
      before:oldShot,after:newShot,renderMethod:'production 16px PNG terrain renderer',
      gameSourceModified:true});
    await page.evaluate(()=>window.__terrainQaEnabled=false);
   }
   assert.deepEqual(errors,[],'uncaught runtime exceptions on '+device.name);
   await context.close();
  }
  fs.writeFileSync(path.join(OUT,'scene-report.json'),
    JSON.stringify({status:'actual-game-qa-only',productionGameChanged:true,scenes:report},null,2)+'\n');
  console.log('PASS: 16 real game screenshots, 4 scenes x 2 view modes x desktop/mobile; original Kez unchanged.');
 }finally{
  await browser?.close();
  await new Promise(ok=>server.close(ok));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
