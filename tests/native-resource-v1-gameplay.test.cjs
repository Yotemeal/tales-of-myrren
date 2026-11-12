'use strict';
// Render actual public/ game using a QA-only Chromium response override.
// No live game scripts change; compares original and native resource PNGs in Chromium.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const out='/tmp/myrren-native-resources-browser-qa';fs.mkdirSync(out,{recursive:true});
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
const treeProof=["if(window.__nativeProofEnabled&&!ancient&&(n.k===\"tree\"||n.k===\"oak\")){"," const key=n.k===\"tree\"?\"bramblewood\":\"alder\";"," const atlas=window.__nativeProofImages?.[key],stump=window.__nativeProofImages?.[key+\"Stump\"];"," if(atlas?.naturalWidth===288&&stump?.naturalWidth===72){","  ctx.save();ctx.imageSmoothingEnabled=false;","  if(now<n.back){ctx.drawImage(stump,Math.round(x)-36,Math.round(y)-85,72,88);}","  else{let moment=now%1290,frame=0;const dur=[750,180,180,180];","   while(frame<3&&moment>=dur[frame]){moment-=dur[frame];frame++}","   ctx.drawImage(atlas,frame*72,0,72,88,Math.round(x)-36,Math.round(y)-85,72,88);}","  ctx.restore();window.__nativeProofDraws[key]=(window.__nativeProofDraws[key]||0)+1;window.__nativeProofPositions[n.k+':'+n.x+':'+n.y]=true;return;"," }","}"].join('\n');
const rockProof=["if(window.__nativeProofEnabled&&(n.k===\"copper\"||n.k===\"tin\")){"," const key=n.k,atlas=window.__nativeProofImages?.[key];"," if(atlas?.naturalWidth===48){ctx.save();ctx.imageSmoothingEnabled=false;","  ctx.drawImage(atlas,now<n.back?24:0,0,24,22,Math.round(x)-12,Math.round(y)-20,24,22);","  ctx.restore();window.__nativeProofDraws[key]=(window.__nativeProofDraws[key]||0)+1;window.__nativeProofPositions[n.k+':'+n.x+':'+n.y]=true;return;}","}"].join('\n');
const gameRockProof='if(window.__nativeProofEnabled&&(n.k==="copper"||n.k==="tin")){MyrrenEnvironment.rock(ctx,n,x,y,now);return;}';
const qaHook=["window.__qaResourcePlace=function(kind){"," for(const m of mons){m.state=\"dead\";m.back=Number.MAX_SAFE_INTEGER}"," const offsets=[[46,20],[-46,20],[43,-20],[-43,-20],[48,0],[-48,0],[0,37],[0,-37]];"," const blocked=(x,y)=>SOLID.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1)","  ||BLD.some(b=>!b.open&&Math.abs(x-b.x)<b.w/2+5&&y>b.y-18&&y<b.y+4);"," const candidates=[];"," for(const n of nodes.filter(n=>n.k===kind&&n.back<=performance.now())){","  const radial=Math.hypot(n.x-CX,n.y-CY);","  if((kind===\"copper\"||kind===\"tin\")&&radial<540)continue;","  for(const [ox,oy] of offsets){const x=n.x+ox,y=n.y+oy;","   if(x<EDGE+10||x>WW-EDGE-10||y<EDGE+10||y>WH-EDGE-10||VILLAGE.inWater(x,y)||blocked(x,y))continue;","   const crowd=nodes.filter(o=>o!==n&&Math.hypot(o.x-x,o.y-y)<20).length;","   candidates.push({n,x,y,score:Math.abs(radial-650)+crowd*125});","  }"," }"," candidates.sort((a,b)=>a.score-b.score);"," const p=candidates[0];if(!p)throw Error(\"No safe resource scene for \"+kind);"," window.__qaResourceSelected=p.n;"," me.x=p.x;me.y=p.y;me.ox=p.x;me.oy=p.y;me.hp=hpMax();"," me.deathAt=null;me.hurtAt=-99999;me.swing=-99999;me.pend=0;"," me.dv=\"d\";me.face=1;me.moving=false;inside=null;act=null;marker=null;"," snapCam=true;cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;"," return {kind,resource:{x:p.n.x,y:p.n.y},player:{x:me.x,y:me.y}};","};","window.__qaResourceDeplete=function(depleted){"," if(!window.__qaResourceSelected)throw Error(\"Missing selected node\");"," window.__qaResourceSelected.back=depleted?performance.now()+120000:0;","};"].join('\n');
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const proofScenes=[];
  for(const device of [
   {name:'desktop',width:1100,height:700,dpr:1,mobile:false},
   {name:'mobile',width:390,height:844,dpr:2,mobile:true}
  ]){
   const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},
     deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__nativeProofEnabled=false;window.__nativeProofDraws={};window.__nativeProofPositions={};
    window.__nativeProofImages={};
    const files={bramblewood:'tree_bramblewood_v1.png',alder:'tree_alder_v1.png',
      bramblewoodStump:'tree_bramblewood_stump_v1.png',alderStump:'tree_alder_stump_v1.png',
      copper:'ore_copper_v1.png',tin:'ore_tin_v1.png'};
    for(const [key,file] of Object.entries(files)){
      const image=new Image();image.src='/assets/resources/native-v1/'+file;
      window.__nativeProofImages[key]=image;
    }
   });
   await page.route('**/myrren-environment.js?*',async route=>{
    const response=await route.fetch();let script=await response.text();
    const a='function tree(ctx,n,x,y,now,ancient=false){',b='function rock(ctx,n,x,y,now){';
    assert(script.includes(a)&&script.includes(b),'original source renderer signature changed');
    script=script.replace(a,a+'\n'+treeProof+'\n').replace(b,b+'\n'+rockProof+'\n');
    await route.fulfill({response,body:script});
   });
   await page.route('**/myrren-game.js?*',async route=>{
    const response=await route.fetch();let script=await response.text();
    const rock='function drawRock(n,x,y,now){';
    assert(script.includes(rock),'rock renderer signature changed');
    script=script.replace(rock,rock+'\n'+gameRockProof+'\n');
    const end=script.lastIndexOf('})();');
    assert(end>0&&script.includes('const nodes=[]'),'game bootstrap changed');
    await route.fulfill({response,body:script.slice(0,end)+qaHook+'\n'+script.slice(end)});
   });
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready&&
     !!window.__qaResourcePlace&&!document.getElementById('go').disabled,
     null,{timeout:20000});
   await page.waitForFunction(()=>Object.values(window.__nativeProofImages||{}).every(im=>im.complete&&im.naturalWidth>0),
     null,{timeout:12000});
   await page.locator('#nick').fill('Kez QA');
   await page.locator('#go').click();
   await page.waitForFunction(()=>document.getElementById('intro').hidden,null,{timeout:6000});
   for(const kind of ['tree','oak','copper','tin']){
    const key={tree:'bramblewood',oak:'alder'}[kind]||kind;
    const scene=await page.evaluate(k=>window.__qaResourcePlace(k),kind);
    proofScenes.push({device:device.name,kind,...scene});
    await page.waitForTimeout(250);
    await page.locator('#cv').screenshot({path:path.join(out,device.name+'-'+key+'-current.png')});
    await page.evaluate(()=>{window.__nativeProofEnabled=true;window.__nativeProofDraws={};window.__nativeProofPositions={}});
    const expected=kind+':'+scene.resource.x+':'+scene.resource.y;
    await page.waitForFunction(k=>window.__nativeProofPositions[k]===true,expected,{timeout:6000});
    await page.waitForTimeout(180);
    await page.locator('#cv').screenshot({path:path.join(out,device.name+'-'+key+'-native-live.png')});
    await page.evaluate(()=>window.__qaResourceDeplete(true));
    await page.waitForTimeout(190);
    await page.locator('#cv').screenshot({path:path.join(out,device.name+'-'+key+'-native-depleted.png')});
    await page.evaluate(()=>{window.__qaResourceDeplete(false);window.__nativeProofEnabled=false});
   }
   assert.deepEqual(errors,[],'browser runtime script errors');
   await ctx.close();
  }
  fs.writeFileSync(path.join(out,'qa-scenes.json'),JSON.stringify({status:'review-only',gameCodeChanged:false,proofScenes},null,2)+'\n');
  console.log('PASS: 24 real-game screenshots, selected source node confirmed drawn, desktop/mobile current/native/depleted proof.');
 }finally{await browser?.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
