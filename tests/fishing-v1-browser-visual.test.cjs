'use strict';
// Render actual public/ game using a QA-only Chromium response override.
// No game scripts are committed/changed; captures old and new fishing cues.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const out='/tmp/myrren-native-fishing-browser-qa';fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.png':'image/png','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const f=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{if(!fs.statSync(f).isFile())throw Error('missing');
  res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');
  fs.createReadStream(f).pipe(res);
 }catch(_){res.writeHead(404);res.end('Not found')}
});
const fishProof=[
 'if(window.__fishingQaEnabled&&window.__fishingQaImage?.naturalWidth===128&&now>=n.back){',
 ' const row={spot1:0,spot2:1,spot3:2,spot4:3,spot5:4}[n.k];',
 ' if(row!==undefined){',
 '  const frame=Math.floor(now/220)%4;',
 '  ctx.save();ctx.imageSmoothingEnabled=false;',
 '  ctx.drawImage(window.__fishingQaImage,frame*32,row*24,32,24,',
 '     Math.round(x)-16,Math.round(y)-12,32,24);',
 '  ctx.restore();window.__fishingQaDrawCount++;return;',
 ' }',
 '}'
].join('\n');
const qaHook=[
 'window.__qaFishingPlace=function(kind){',
 ' for(const m of mons){m.state="dead";m.back=Number.MAX_SAFE_INTEGER}',
 ' const offsets=[[28,20],[-28,20],[26,-20],[-26,-20],',
 '  [36,0],[-36,0],[0,32],[0,-32],[45,18],[-45,18]];',
 ' const blocked=(x,y)=>SOLID.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1)',
 '  ||BLD.some(b=>!b.open&&Math.abs(x-b.x)<b.w/2+5&&y>b.y-18&&y<b.y+4);',
 ' const candidates=[];',
 ' for(const n of nodes.filter(n=>n.k===kind&&n.back<=performance.now())){',
 '  for(const [ox,oy] of offsets){',
 '   const x=n.x+ox,y=n.y+oy;',
 '   if(x<EDGE+10||x>WW-EDGE-10||y<EDGE+10||y>WH-EDGE-10',
 '    ||VILLAGE.inWater(x,y)||blocked(x,y))continue;',
 '   const crowd=nodes.filter(o=>o!==n&&Math.hypot(o.x-x,o.y-y)<18).length;',
 '   candidates.push({n,x,y,score:Math.hypot(n.x-CX,n.y-CY)+crowd*125});',
 '  }',
 ' }',
 ' candidates.sort((a,b)=>a.score-b.score);',
 ' const p=candidates[0];if(!p)throw Error("No safe scene for "+kind);',
 ' me.x=p.x;me.y=p.y;me.ox=p.x;me.oy=p.y;me.hp=hpMax();',
 ' me.deathAt=null;me.hurtAt=-99999;me.swing=-99999;me.pend=0;',
 ' me.dv="d";me.face=1;me.moving=false;inside=null;act=null;marker=null;',
 ' snapCam=true;cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;',
 ' return {kind,resource:{x:p.n.x,y:p.n.y},player:{x:me.x,y:me.y}};',
 '};'
].join('\n');
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const device of [
   {name:'desktop',width:1100,height:700,dpr:1,mobile:false},
   {name:'mobile',width:390,height:844,dpr:2,mobile:true}
  ]){
   const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
     deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__fishingQaEnabled=false;window.__fishingQaDrawCount=0;
    window.__fishingQaImage=new Image();
    window.__fishingQaImage.src='/assets/fishing/fishing_spots_v1.png';
   });
   await page.route('**/myrren-environment.js?*',async route=>{
    const response=await route.fetch(),script=await response.text();
    const needle='function fishing(ctx,n,x,y,now){';
    assert(script.includes(needle),'game fishing renderer changed');
    await route.fulfill({response,body:script.replace(needle,needle+'\n'+fishProof+'\n')});
   });
   await page.route('**/myrren-game.js?*',async route=>{
    const response=await route.fetch(),script=await response.text();
    const end=script.lastIndexOf('})();');
    assert(end>0&&script.includes('const nodes=[]'),'game bootstrap changed');
    await route.fulfill({response,body:script.slice(0,end)+qaHook+'\n'+script.slice(end)});
   });
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready&&
     !!window.__qaFishingPlace&&!document.getElementById('go').disabled,
     null,{timeout:20000});
   await page.waitForFunction(()=>window.__fishingQaImage?.naturalWidth===128,
     null,{timeout:12000});
   await page.locator('#nick').fill('Kez QA');
   await page.locator('#go').click();
   await page.waitForFunction(()=>document.getElementById('intro').hidden,null,{timeout:6000});
   for(const kind of ['spot1','spot2','spot3','spot4','spot5']){
    await page.evaluate(k=>window.__qaFishingPlace(k),kind);
    await page.waitForTimeout(250);
    await page.locator('#cv').screenshot({path:path.join(out,device.name+'-'+kind+'-current.png')});
    await page.evaluate(()=>{window.__fishingQaEnabled=true;window.__fishingQaDrawCount=0});
    await page.waitForFunction(()=>window.__fishingQaDrawCount>0,null,{timeout:6000});
    await page.waitForTimeout(170);
    await page.locator('#cv').screenshot({path:path.join(out,device.name+'-'+kind+'-native-png.png')});
    await page.evaluate(()=>{window.__fishingQaEnabled=false});
   }
   assert.deepEqual(errors,[],'browser runtime script errors');
   await ctx.close();
  }
  console.log('PASS: 20 real-game screenshots for 5 fishing spots, desktop/mobile old-versus-PNG proof.');
 }finally{await browser?.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
