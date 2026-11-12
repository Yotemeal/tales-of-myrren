'use strict';
// Real public/ browser capture at native game zoom. QA injections are in-memory only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const out=process.env.MYRREN_SCALE_OUT||'/tmp/myrren-world-scale-qa';
fs.mkdirSync(out,{recursive:true});
const resources=[
 ['Bramblewood','tree','tree_bramblewood.png'],
 ['Alder','oak','tree_alder.png'],
 ['Ironbark','maple','tree_ironbark.png'],
 ['Elderthorn','elder','tree_elderthorn.png'],
 ['Starroot','myrren','tree_starroot.png'],
 ['Copper','copper','ore_copper.png'],
 ['Tin','tin','ore_tin.png'],
 ['Iron','iron','ore_iron.png'],
 ['Coal','coal','ore_coal.png'],
 ['Black Iron','cobalt','ore_black_iron.png'],
 ['Obsidianite','obsidianite','ore_obsidianite.png'],
 ['Myrrenite','aether','ore_myrrenite.png'],
 ['Meteorite','meteorite','ore_meteorite.png']
];
const fishSpots=[
 ['Shallow fishing','spot1'],['Deep fishing','spot2'],['Far fishing','spot3'],
 ['Tuna shoal','spot4'],['Aether eel','spot5']
];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{
  if(!fs.statSync(file).isFile())throw Error('not a file');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 }catch(_){res.writeHead(404);res.end()}
});
// Injected into browser response only; none of this code enters shipped JS.
const qaHook=[
 'window.__myrrenScaleQA={',
 ' silence(){for(const m of mons){m.state="dead";m.back=Number.MAX_SAFE_INTEGER}return mons.length},',
 ' select(kind){',
 '  const blocked=(x,y)=>SOLID.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1)',
 '   ||BLD.some(b=>!b.open&&Math.abs(x-b.x)<b.w/2+5&&y>b.y-18&&y<b.y+4);',
 '  const offsets=[[28,20],[-28,20],[26,-20],[-26,-20],[36,0],[-36,0],',
 '   [0,32],[0,-32],[45,18],[-45,18]];',
 '  const candidates=[];',
 '  for(const n of nodes.filter(n=>n.k===kind&&n.back<=performance.now())){',
 '   for(const [ox,oy] of offsets){',
 '    const x=n.x+ox,y=n.y+oy;',
 '    if(x<EDGE+10||x>WW-EDGE-10||y<EDGE+10||y>WH-EDGE-10',
 '     ||VILLAGE.inWater(x,y)||blocked(x,y))continue;',
 '    const nearby=nodes.filter(o=>o!==n&&Math.hypot(o.x-x,o.y-y)<18).length;',
 '    const score=Math.hypot(n.x-CX,n.y-CY)+nearby*125;',
 '    candidates.push({n,x,y,score});',
 '   }',
 '  }',
 '  candidates.sort((a,b)=>a.score-b.score);',
 '  const p=candidates[0];',
 '  if(!p)throw Error("No safe scene for "+kind);',
 '  me.x=p.x;me.y=p.y;me.ox=p.x;me.oy=p.y;me.hp=hpMax();',
 '  me.deathAt=null;me.hurtAt=-99999;me.swing=-99999;me.pend=0;',
 '  me.dv="d";me.face=1;me.moving=false;inside=null;act=null;marker=null;',
 '  snapCam=true;cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;',
 '  return {kind,player:{x:me.x,y:me.y},resource:{x:p.n.x,y:p.n.y},',
 '   distance:Math.hypot(me.x-p.n.x,me.y-p.n.y)};',
 ' },',
 ' world(){return {tileSize:T,width:WW,height:WH,',
 '  nativeCharacter:{width:21,height:27},nodes:nodes.length,started,',
 '  canvas:{width:cv.width,height:cv.height}}}',
 '};'
].join('\n');
const dimensions=file=>{
 const b=fs.readFileSync(path.join(root,'assets/resources',file));
 assert.equal(b.toString('ascii',12,16),'IHDR');
 return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 const rows=[];
 try{
  browser=await chromium.launch({headless:true});
  for(const device of [
   {name:'desktop',width:1100,height:700,dpr:1,mobile:false},
   {name:'mobile',width:390,height:844,dpr:2,mobile:true}
  ]){
   const context=await browser.newContext({viewport:{width:device.width,height:device.height},
    deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.__resourceDraws=Object.create(null);
    const base=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){
     const img=args[0];
     if(img&&typeof img.src==='string'&&img.src.includes('/assets/resources/')){
      const key=img.src.split('/').pop().split('?')[0];
      const w=args.length===9?args[7]:args.length===5?args[3]:img.naturalWidth;
      const h=args.length===9?args[8]:args.length===5?args[4]:img.naturalHeight;
      const t=this.getTransform(),sx=Math.hypot(t.a,t.b),sy=Math.hypot(t.c,t.d);
      if(Number.isFinite(w)&&Number.isFinite(h)){
       const r=window.__resourceDraws[key] ||= {count:0,width:0,height:0,
        sourceWidth:0,sourceHeight:0,transformScale:0};
       r.count++;r.width=Math.max(r.width,w*sx);
       r.height=Math.max(r.height,h*sy);r.transformScale=sx;
       r.sourceWidth=img.naturalWidth;r.sourceHeight=img.naturalHeight;
      }
     }
     return base.apply(this,args);
    };
   });
   await page.route('**/myrren-game.js?*',async route=>{
    const response=await route.fetch();
    const source=await response.text();
    assert(source.includes('const nodes=[]'),'real game node registry not found');
    const end=source.lastIndexOf('})();');
    assert(end>0,'game bootstrap closure missing');
    await route.fulfill({response,body:source.slice(0,end)+qaHook+'\n'+source.slice(end)});
   });
   await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready&&
    !!window.__myrrenScaleQA&&!document.querySelector('#go').disabled,
    null,{timeout:20000});
   await page.locator('#nick').fill('Scale QA');
   await page.locator('#go').click();
   await page.waitForFunction(()=>document.querySelector('#intro').hidden,
    null,{timeout:6000});
   await page.evaluate(()=>window.__myrrenScaleQA.silence());
   await page.waitForTimeout(250);
   await page.screenshot({path:path.join(out,device.name+'-crater-camp-full.png')});
   const baseline=await page.evaluate(()=>window.__myrrenScaleQA.world());
   assert.equal(baseline.tileSize,16);
   assert.deepEqual(baseline.nativeCharacter,{width:21,height:27});
   for(const [label,kind,file] of resources){
    const placed=await page.evaluate(k=>window.__myrrenScaleQA.select(k),kind);
    await page.evaluate(()=>{window.__resourceDraws=Object.create(null)});
    await page.waitForFunction(name=>!!window.__resourceDraws?.[name]?.sourceWidth,
      file,{timeout:10000});
    await page.waitForTimeout(175);
    const observed=await page.evaluate(name=>({
     draw:window.__resourceDraws[name],
     canvas:{width:document.getElementById('cv').width,
             height:document.getElementById('cv').height},
     css:{width:document.getElementById('cv').clientWidth,
          height:document.getElementById('cv').clientHeight},
     ratio:window.devicePixelRatio
    }),file);
    const source=dimensions(file);
    assert.equal(observed.draw.sourceWidth,source.width,'wrong resource image '+file);
    assert.equal(observed.draw.sourceHeight,source.height,'wrong resource height '+file);
    assert(placed.distance<80,'player must be within visible resource proximity');
    assert(observed.draw.width>0,'missing real resource draw');
    const screenshot=device.name+'-'+file.replace('.png','')+'.png';
    await page.locator('#cv').screenshot({path:path.join(out,screenshot)});
    rows.push({device:device.name,resource:label,kind,file,screenshot,
     sourceSize:source,drawWidthGamePixels:+observed.draw.width.toFixed(2),
     drawTransform:+observed.draw.transformScale.toFixed(3),
     widthVsKez:+(observed.draw.width/21).toFixed(2),
     playerDistance:+placed.distance.toFixed(2),player:placed.player,
     resourcePosition:placed.resource,canvas:observed.canvas,
     canvasCss:observed.css,devicePixelRatio:observed.ratio});
   }
   // Fishing spots use procedural shoals/ripples in current production,
   // not PNG resource sprites. Capture the actual water-edge cues for art review.
   for(const [label,kind] of fishSpots){
    const placed=await page.evaluate(k=>window.__myrrenScaleQA.select(k),kind);
    await page.waitForTimeout(240);
    const screenshot=device.name+'-fishing-'+kind+'.png';
    await page.locator('#cv').screenshot({path:path.join(out,screenshot)});
    assert(placed.distance<80,'fishing spot was not positioned beside the player: '+kind);
    rows.push({device:device.name,resource:label,kind,file:null,screenshot,
     sourceSize:null,drawWidthGamePixels:null,drawTransform:null,widthVsKez:null,
     renderMethod:'procedural-MyrrenEnvironment.fishing',
     playerDistance:+placed.distance.toFixed(2),player:placed.player,
     resourcePosition:placed.resource,
     canvas:await page.evaluate(()=>({
      width:document.getElementById('cv').width,
      height:document.getElementById('cv').height
     })),
     canvasCss:await page.evaluate(()=>({
      width:document.getElementById('cv').clientWidth,
      height:document.getElementById('cv').clientHeight
     })),
     devicePixelRatio:device.dpr});
   }
   assert.deepEqual(errors,[],'uncaught browser error in '+device.name);
   await context.close();
  }
  fs.writeFileSync(path.join(out,'world-scale-runtime-measurements.json'),
   JSON.stringify({status:'real-browser-QA-only',doesNotChangeGame:true,
    notes:['Real public game renderer captured in Playwright Chromium.',
    'Temporary browser-only hook moves character beside existing seeded node.',
    'Hostile monsters suppressed for stable reference images, not live gameplay.',
    'Resource widths are measured from real drawImage and its canvas transform.',
    'Fishing areas are code-rendered shoals and ripples, not imported pixel PNGs.',
    'These screenshots are not new game assets or user-approved size changes.'],rows},null,2)+'\n');
  const table=rows.filter(r=>r.device==='desktop'&&r.sourceSize);
  let md='# Myrren actual-game scale audit\n\n';
  md+='Actual Chromium renders of public/index.html, no game scripts modified.\n\n';
  md+='| Resource | Original PNG | Draw width (game px) | Width / 21px Kez |\n';
  md+='|---|---:|---:|---:|\n';
  for(const r of table)md+='| '+r.resource+' | '+r.sourceSize.width+'×'+
   r.sourceSize.height+' | '+r.drawWidthGamePixels+' | '+r.widthVsKez+'× |\n';
  md+='\nCurrent fishing areas (all drawn procedurally; no PNG artwork):\n\n';
  for(const r of rows.filter(x=>x.device==='desktop'&&x.kind.startsWith('spot')))
   md+='- '+r.resource+' ('+r.kind+'): '+r.screenshot+'; Kez distance '+r.playerDistance+' game px\n';
  md+='\nMeasured draw sizes include fractional context transforms. Source resolution and game draw sizes are not equivalent. Visual approval required before edits.\n';
  fs.writeFileSync(path.join(out,'world-scale-current-state.md'),md);
  console.log('PASS: '+rows.length+' real gameplay scene captures, desktop/mobile, 13 image resources and 5 fishing areas.');
  console.log('Desktop widths: '+table.map(r=>r.resource+'='+r.drawWidthGamePixels).join(', '));
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
