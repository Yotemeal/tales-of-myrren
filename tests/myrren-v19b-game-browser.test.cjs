'use strict';
// Integration smoke test against a real HTTP-served public/ game in Chromium.
// The page uses a new, isolated test profile; no live account or game save.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
 const filename=path.resolve(root,'.'+pathname);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{
  if(!fs.statSync(filename).isFile())throw Error('not file');
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
  fs.createReadStream(filename).pipe(res);
 }catch(e){res.writeHead(404);res.end('Not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:852,height:393},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'
    ?route.continue():route.abort());
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MyrrenV19BAtlas?.ready&&window.MyrrenKezV2Atlas?.ready,{timeout:15000});
  assert.equal(await page.evaluate(()=>window.MyrrenBuild),94);
  assert.equal(await page.evaluate(()=>window.MyrrenV19BGameplayPreview.enabled),true);
  // Four directions, six frame cadence, native 24x32 geometry and old fallback.
  const renderResult=await page.evaluate(()=>{
    const dirs=[['d',1],['s',-1],['s',1],['u',1]],api=window.MyrrenV19BAtlas;
    const original=window.MyrrenKezV2Atlas;
    const hashes=[];
    const pose={tool:'fist',g:[0,0,0,0,0,0],deathAt:null,hurtAt:-99999,swingAt:-99999,moving:true};
    for(const [dv,f] of dirs){
      const colors=[];
      for(const t of [0,110,220,330,440,550]){
        const c=document.createElement('canvas');c.width=64;c.height=64;
        const g=c.getContext('2d');g.imageSmoothingEnabled=false;
        original.draw(g,32,48,{...pose,dv,f},t);
        colors.push(c.toDataURL());
      }
      if(new Set(colors).size!==6)throw Error('V19B directional walk frames not unique: '+dv+':'+f);
      hashes.push(colors.length);
    }
    window.MyrrenV19BGameplayPreview.setEnabled(false);
    const old=(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;
      original.draw(c.getContext('2d'),32,48,{...pose,dv:'d',f:1},110);return c.toDataURL();})();
    window.MyrrenV19BGameplayPreview.setEnabled(true);
    const newer=(()=>{const c=document.createElement('canvas');c.width=64;c.height=64;
      original.draw(c.getContext('2d'),32,48,{...pose,dv:'d',f:1},110);return c.toDataURL();})();
    return {distinct:hashes,rollbackChangesAppearance:old!==newer,dimensions:api.dimensions};
  });
  assert(renderResult.distinct.every(n=>n===6));
  assert(renderResult.rollbackChangesAppearance,'emergency rollback must select existing art');
  assert.equal(renderResult.dimensions.cellWidth,24);
  assert.equal(renderResult.dimensions.cellHeight,32);
  await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
  await page.locator('#nick').fill('V19B Browser QA');
  await page.locator('#go').click();
  await page.waitForFunction(()=>document.querySelector('#intro').hidden,{timeout:7000});
  await page.waitForTimeout(400);
  // This checks *actual gameplay composition*, not a manually drawn atlas.
  // A past build passed atlas-only tests while the visible player stayed old.
  await page.waitForTimeout(350);
  const localDraws = await page.evaluate(
    () => window.MyrrenV19BGameplayPreview.diagnostics);
  assert(localDraws.nativeFrames>2,
    'fresh, unarmed player must draw V19B in real game: '+JSON.stringify(localDraws));
  assert.equal(localDraws.lastRenderer, 'V19F',
    'unequipped live player must use approved sprite, not Kez V2');
  assert.deepEqual(localDraws.lastGear,[0,0,0,0,0,0]);
  assert.equal(localDraws.lastTool,'fist');
  const scale=await page.locator('#cv').evaluate(c=>c.getBoundingClientRect().width/c.width);
  assert.equal(scale,2,'approved 2x camera not preserved');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(160);
  // Equipment tab must show the same native front/idle pixels when *empty*.
  await page.locator('[data-ui-open="gear"]').click();
  await page.waitForFunction(()=>!!document.querySelector('.character-portrait canvas'));
  await page.waitForTimeout(180);
  const matches = await page.evaluate(()=>{
    const portrait=document.querySelector('.character-portrait canvas');
    const expected=document.createElement('canvas');
    expected.width=portrait.width;expected.height=portrait.height;
    const g=expected.getContext('2d');g.imageSmoothingEnabled=false;
    g.save();g.scale(4,4);
    g.fillStyle='rgba(34,29,25,.18)';g.fillRect(10,38,12,2);
    window.MyrrenV19BAtlas.draw(g,16,38,{dv:'d',f:1,moving:false},0);
    g.restore();
    return portrait.toDataURL()===expected.toDataURL();
  });
  assert(matches,'unequipped portrait must display exact V19B native idle');
  await page.screenshot({path:'/tmp/myrren-v19b-unequipped-portrait.png'});
  await page.locator('#mClose').click();
  await page.screenshot({path:'/tmp/myrren-v19b-landscape-game.png'});
  await page.setViewportSize({width:393,height:852});
  await page.waitForTimeout(450);
  await page.screenshot({path:'/tmp/myrren-v19b-portrait-game.png'});
  assert.deepEqual(errors,[],'game script errors during live playthrough');
  console.log('PASS V19B: canonical game loads; 24 walking poses, fallback, mobile gameplay, camera scale and no JS exceptions');
 } finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
