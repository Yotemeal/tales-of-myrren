'use strict';
// Opt-in production PNG compositor smoke test. Uses real public/index.html,
// real game draw paths, and the real sprite atlas. A test-only layout hook verifies
// the cooking hotspot against the painted fire; it is never committed to the app.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const out='/tmp/myrren-camp-runtime-proof';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png'};
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
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const host='http://127.0.0.1:'+server.address().port;
  let browser;
  const report=[],proofFirePositions={};
  try{
    browser=await chromium.launch({headless:true});
    for(const device of [
      {name:'desktop',width:1100,height:700,mobile:false,dpr:1},
      {name:'mobile',width:390,height:844,mobile:true,dpr:2}
    ]){
      for(const mode of ['fallback','proof','layout-proof','missing-png']){
        const context=await browser.newContext({
          viewport:{width:device.width,height:device.height},
          deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile
        });
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{
          window.__campProductionDraws=[];
          const original=CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
            if(image?.src?.includes('/assets/camp/camp_props_v1.png'))
              window.__campProductionDraws.push(args.slice(0,8));
            return original.call(this,image,...args);
          };
        });
        if(mode==='missing-png')
          await page.route('**/assets/camp/camp_props_v1.png*',route=>route.abort());
        if(mode==='layout-proof'){
          await page.route('**/myrren-game.js?*',async route=>{
            const response=await route.fetch();
            const source=await response.text(),end=source.lastIndexOf('})();');
            assert(end>0&&source.includes('function nearFire()'),
              'live cooking reach implementation changed');
            const hook=`
              window.__campLayoutQa={
                position:()=>({...CAMPFIRE}),
                put(x,y){me.x=x;me.y=y;me.ox=x;me.oy=y;me.tx=x;me.ty=y;},
                nearFire:()=>nearFire(),
                openCooking:()=>{openCooking('fire');return tab},
                close:()=>closeModal()
              };
            `;
            await route.fulfill({response,body:source.slice(0,end)+hook+source.slice(end)});
          });
        }
        const usingArt=mode==='proof'||mode==='layout-proof';
        const url=host+(mode==='fallback'?'/':'/?camp-props-proof'+
          (mode==='layout-proof'?'&campfire-layout-proof':''));
        await page.goto(url,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>!document.getElementById('go')?.disabled &&
          !!window.MyrrenCampProps,null,{timeout:20000});
        assert.equal(await page.evaluate(()=>window.MyrrenCampProps.enabled),mode!=='fallback');
        if(usingArt){
          await page.waitForFunction(()=>window.MyrrenCampProps.ready(),null,{timeout:10000});
          const atlas=await page.evaluate(()=>{
            const keys=['bank_chest','jobs_board','blacksmith_anvil',
              'open_furnace','campfire','lantern'];
            const canvas=document.createElement('canvas');
            canvas.width=96;canvas.height=96;
            const c=canvas.getContext('2d');
            const before=window.__campProductionDraws.length;
            for(const key of keys){
              if(!window.MyrrenCampProps.draw(c,key,32,56,700))
                throw Error('Missing native sprite '+key);
            }
            return window.__campProductionDraws.slice(before);
          });
          assert.deepEqual(atlas.map(a=>a[1]),[0,64,128,192,256,320],
            'all six images must use correct source rows');
          assert(atlas.every(a=>a[2]===64&&a[3]===64),
            'all native source rectangles must remain exactly 64x64');
        }else if(mode==='missing-png'){
          await page.waitForFunction(()=>window.MyrrenCampProps?.ready()===false,
            null,{timeout:5000});
        }
        await page.locator('#nick').fill('Camp Proof QA');
        await page.locator('#go').click();
        await page.waitForFunction(()=>document.getElementById('intro')?.hidden,
          null,{timeout:8000});
        await page.waitForTimeout(350);
        if(mode==='layout-proof'){
          const cooking=await page.evaluate(()=>{
            const qa=window.__campLayoutQa;
            if(!qa)throw Error('Missing test-only cooking probe');
            const position=qa.position();
            qa.put(976,710);
            const oldSpotActive=qa.nearFire();
            qa.put(position.x,position.y);
            const newSpotActive=qa.nearFire();
            const menu=qa.openCooking();
            qa.close();
            return {position,oldSpotActive,newSpotActive,menu};
          });
          assert.deepEqual(cooking,{
            position:{x:864,y:850},oldSpotActive:false,
            newSpotActive:true,menu:'cook'
          },'moved cooking hotspot must open the existing cooking UI only at its new position');
        }
        const drawCount=await page.evaluate(()=>window.__campProductionDraws.length);
        if(usingArt)assert(drawCount>6,
          'real gameplay must draw the actual new camp atlas');
        else assert.equal(drawCount,0,'fallback must not use the missing or opt-out PNG');
        if(usingArt){
          const fireDraws=await page.evaluate(()=>
            window.__campProductionDraws.filter(args=>args[1]===256&&args[2]===64));
          assert(fireDraws.length>0,'native campfire must draw in actual outdoor world');
          const last=fireDraws.at(-1);
          const dest={x:last[4],y:last[5]};
          assert(Number.isFinite(dest.x)&&Number.isFinite(dest.y));
          if(mode==='layout-proof'){
            const previous=proofFirePositions[device.name];
            assert(previous,'regular sprite proof must precede layout study');
            assert(Math.hypot(dest.x-previous.x,dest.y-previous.y)>80,
              'layout preview must visibly separate the campfire from the furnace');
          }else proofFirePositions[device.name]=dest;
        }
        const shot=path.join(out,device.name+'-'+mode+'.png');
        await page.screenshot({path:shot});
        assert.deepEqual(errors,[],'browser errors in '+device.name+' '+mode);
        report.push({device:device.name,mode,screenshot:path.basename(shot),drawCount});
        await context.close();
      }
    }
    fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify({
      status:'preview-only-no-production-main-change',
      urlFlag:'?camp-props-proof',
      independentPlacementFlag:'?camp-props-proof&campfire-layout-proof',
      art:'NOT APPROVED; anvil specifically flagged for redesign',
      report
    },null,2)+'\n');
    console.log('PASS: six real game screenshots, six native atlas rows, opt-out and missing PNG fallback.');
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
