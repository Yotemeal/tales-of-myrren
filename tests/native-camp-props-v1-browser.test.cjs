'use strict';
// Visual QA only: real game before/after original vs PNG images.
// No source edit, map migration, interaction change, or production activation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../public');
const out='/tmp/myrren-camp-props-gameplay-proof';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
  try{
    if(!fs.statSync(filename).isFile())throw Error('Not a file');
    res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
    fs.createReadStream(filename).pipe(res);
  }catch(_){res.writeHead(404);res.end('Not found')}
});
const drawInitializer=()=>{
  window.__campQaEnabled=false;
  window.__campQaSelectedKind=null;
  window.__campQaAtlas=new Image();
  window.__campQaAtlas.src='/assets/camp/camp_props_v1.png';
  window.__campQaCounters={};
  window.__campQaDraw=function(ctx,name,x,y,now){
    const rows={bank_chest:0,jobs_board:1,blacksmith_anvil:2,open_furnace:3,
      campfire:4,lantern:5};
    const frames={bank_chest:1,jobs_board:4,blacksmith_anvil:1,open_furnace:4,
      campfire:4,lantern:4};
    const ms={jobs_board:350,open_furnace:240,campfire:240,lantern:280};
    if(!window.__campQaEnabled||window.__campQaSelectedKind!==name||
      window.__campQaAtlas.naturalWidth!==256)return false;
    const row=rows[name];
    if(row===undefined)throw Error('Unknown artwork '+name);
    const frame=Math.floor(now/(ms[name]||1000))%frames[name];
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(window.__campQaAtlas,frame*64,row*64,64,64,
      Math.round(x)-32,Math.round(y)-56,64,64);
    ctx.restore();
    window.__campQaCounters[name]=(window.__campQaCounters[name]||0)+1;
    return true;
  };
};
const gamePatch={
  'function drawBankChest(x,y){':[
    'if(window.__campQaDraw?.(ctx,"bank_chest",x,y,performance.now())){',
    ' if(Math.hypot(me.x-SPOTS.bank.x,me.y-SPOTS.bank.y)<70)',
    '   label("Storage Chest",x,y-33,"#e8d9ae");',
    ' return;',
    '}'
  ].join('\n'),
  'function drawBoard(x,y){':[
    'if(window.__campQaDraw?.(ctx,"jobs_board",x,y,performance.now())){',
    ' if(Math.hypot(me.x-BOARD.x,me.y-BOARD.y)<65)',
    '   label("Community Board",x,y-49,"#e4dfc3");',
    ' return;',
    '}'
  ].join('\n'),
  'function drawLamp(x,y,now){':[
    'if(window.__campQaDraw?.(ctx,"lantern",x,y,now)){',
    '  const flicker=Math.sin(now/180+x);',
    '  ctx.save();ctx.globalAlpha=.13+flicker*.025;',
    '  ctx.fillStyle="#ffd181";',
    '  ctx.beginPath();ctx.arc(x,y-16,19,0,Math.PI*2);ctx.fill();',
    '  ctx.restore();return;',
    '}'
  ].join('\n')
};
const worldHook=[
 'window.__campQaPlace=function(kind){',
 '  for(const m of mons){m.state="dead";m.back=Number.MAX_SAFE_INTEGER}',
 '  let target;',
 '  if(kind==="bank_chest")target=SPOTS.bank;',
 '  else if(kind==="jobs_board")target=BOARD;',
 '  else if(kind==="blacksmith_anvil")target=VILLAGE.stations.find(s=>s.kind==="anvil");',
 '  else if(kind==="open_furnace")target=VILLAGE.stations.find(s=>s.kind==="furnace");',
 '  else if(kind==="lantern")target={x:LAMPS[0][0],y:LAMPS[0][1]};',
 '  else throw Error("Unknown world prop: "+kind);',
 '  if(!target)throw Error("Missing world location for "+kind);',
 '  const options=[[0,40],[30,29],[-30,29],[44,0],[-44,0]];',
 '  let best=null;',
 '  for(const [ox,oy] of options){',
 '    const x=target.x+ox,y=target.y+oy;',
 '    const position=VILLAGE.safePosition(x,y);',
 '    const dist=Math.hypot(position.x-target.x,position.y-target.y);',
 '    const score=Math.abs(dist-40);',
 '    if(!best||score<best.score)best={...position,score};',
 '  }',
 '  me.x=best.x;me.y=best.y;me.ox=best.x;me.oy=best.y;',
 '  me.hp=hpMax();me.deathAt=null;me.hurtAt=-99999;',
 '  me.swing=-99999;me.pend=0;me.dv="d";me.face=1;me.moving=false;',
 '  inside=null;act=null;marker=null;snapCam=true;',
 '  cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;',
 '  return {kind,target:{x:target.x,y:target.y},player:{x:me.x,y:me.y},',
 '    distance:Math.hypot(me.x-target.x,me.y-target.y)};',
 '};'
].join('\n');

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  const scenes=[];
  try{
    browser=await chromium.launch({headless:true});
    for(const device of [
      {name:'desktop',width:1100,height:700,dpr:1,mobile:false},
      {name:'mobile',width:390,height:844,dpr:2,mobile:true}
    ]){
      const context=await browser.newContext({
        viewport:{width:device.width,height:device.height},
        deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile
      });
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(drawInitializer);
      await page.route('**/myrren-environment.js?*',async route=>{
        const response=await route.fetch();
        const source=await response.text();
        const marker='function smithyPart(ctx,kind,x,y,now=0){';
        assert(source.includes(marker),'smithy renderer signature changed');
        const patch=[
          'if((kind==="anvil"||kind==="furnace")&&',
          '   window.__campQaDraw?.(ctx,kind==="anvil"?"blacksmith_anvil":"open_furnace",',
          '     x,y,now))return;'
        ].join('\n');
        await route.fulfill({response,body:source.replace(marker,marker+'\n'+patch)});
      });
      await page.route('**/myrren-game.js?*',async route=>{
        const response=await route.fetch();
        let source=await response.text();
        for(const [marker,patch] of Object.entries(gamePatch)){
          assert(source.includes(marker),'game renderer signature changed: '+marker);
          source=source.replace(marker,marker+'\n'+patch);
        }
        const close=source.lastIndexOf('})();');
        assert(close>0&&source.includes('const nodes=[]'),'game bootstrap changed');
        source=source.slice(0,close)+worldHook+'\n'+source.slice(close);
        await route.fulfill({response,body:source});
      });
      await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready&&
        window.__campQaPlace&&!document.querySelector('#go')?.disabled,null,{timeout:20000});
      await page.waitForFunction(()=>window.__campQaAtlas?.naturalWidth===256,null,{timeout:12000});
      await page.locator('#nick').fill('Camp Art QA');
      await page.locator('#go').click();
      await page.waitForFunction(()=>document.querySelector('#intro').hidden,
        null,{timeout:8000});
      for(const kind of ['bank_chest','jobs_board','blacksmith_anvil','open_furnace','lantern']){
        const position=await page.evaluate(key=>{
          window.__campQaSelectedKind=key;
          return window.__campQaPlace(key);
        },kind);
        await page.evaluate(()=>{window.__campQaEnabled=false});
        await page.waitForTimeout(240);
        const before=device.name+'-'+kind+'-current.png';
        await page.locator('#cv').screenshot({path:path.join(out,before)});
        await page.evaluate(()=>{window.__campQaCounters={};window.__campQaEnabled=true});
        await page.waitForFunction(name=>(window.__campQaCounters?.[name]||0)>0,
          kind,{timeout:7000});
        await page.waitForTimeout(240);
        const after=device.name+'-'+kind+'-native.png';
        await page.locator('#cv').screenshot({path:path.join(out,after)});
        const counts=await page.evaluate(()=>({...window.__campQaCounters}));
        assert.deepEqual(Object.keys(counts).sort(),[kind],
          'QA preview accidentally replaced unselected camp props');
        scenes.push({device:device.name,kind,before,after,position,
          replacementCount:counts[kind],
          variant:'selected PNG only; nearby camp props remain their current game art'});
      }
      assert.deepEqual(errors,[],'runtime errors in '+device.name);
      await context.close();
    }
    fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify({
      status:'browser-only-preview',productionGameChanged:false,
      source:'real public/ game with test-only sprite substitution',
      notes:[
        'Campfire has no verified current placement and is not shown in live-scene comparisons.',
        'No production app source edits, game state changes, or approved art merging.',
        'Before and after screenshots use the same player position and real game renderer.',
        'Only the selected prop is changed in each screenshot; other existing props are unchanged.',
        'Lantern PNG preview retains the original subtle ambient light halo.'
      ],scenes
    },null,2)+'\n');
    console.log('PASS: 20 actual game screenshots; only selected prop changed; lantern glow preserved.');
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
