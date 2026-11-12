'use strict';
// Real deployable-game proof: native starter terrain + opt-in camp props on
// the SAME browser frame. Never rewrites production source or player saves.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const output='/tmp/myrren-combined-world-art-qa';
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json','.css':'text/css; charset=utf-8','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(requestPath==='/'?'/index.html':requestPath));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
  try{
    if(!fs.statSync(file).isFile())throw Error('not a file');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(404);res.end('Not found')}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  let browser;
  const report=[];
  try{
    browser=await chromium.launch({headless:true});
    for(const device of [{name:'desktop',width:1100,height:700,mobile:false,dpr:1},
      {name:'mobile',width:390,height:844,mobile:true,dpr:2}]){
      for(const mode of ['terrain-only','combined','separated-fire']){
        const context=await browser.newContext({
          viewport:{width:device.width,height:device.height},
          deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile
        });
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{
          window.__combinedQa={terrain:0,props:0,terrainSource:new Set(),propSource:new Set()};
          const original=CanvasRenderingContext2D.prototype.drawImage;
          CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
            if(image?.src?.includes('/assets/terrain/starter_terrain_v1.png')){
              window.__combinedQa.terrain++;
              window.__combinedQa.terrainSource.add(args[0]+','+args[1]);
            }
            if(image?.src?.includes('/assets/camp/camp_props_v1.png')){
              window.__combinedQa.props++;
              window.__combinedQa.propSource.add(args[0]+','+args[1]);
            }
            return original.call(this,image,...args);
          };
        });
        const flags=mode==='terrain-only'?'?legacy-camp-props':
          mode==='combined'?'?original-campfire-layout-proof':'';
        await page.goto(base+'/'+flags,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.MyrrenEnvironment?.nativeTerrainReady() &&
          !document.getElementById('go')?.disabled,{timeout:20000});
        if(mode!=='terrain-only')await page.waitForFunction(()=>window.MyrrenCampProps?.ready(),
          null,{timeout:12000});
        const enabled=await page.evaluate(()=>window.MyrrenCampProps?.enabled);
        assert.equal(enabled,mode!=='terrain-only');
        await page.locator('#nick').fill('World QA');
        await page.locator('#go').click();
        await page.waitForFunction(()=>document.getElementById('intro')?.hidden,null,{timeout:8000});
        await page.waitForFunction(()=>window.__combinedQa.terrain>80,null,{timeout:9000});
        if(mode!=='terrain-only')await page.waitForFunction(()=>window.__combinedQa.props>3,
          null,{timeout:9000});
        await page.waitForTimeout(200);
        const counts=await page.evaluate(()=>({
          terrain:window.__combinedQa.terrain,
          props:window.__combinedQa.props,
          terrainCells:window.__combinedQa.terrainSource.size,
          propCells:window.__combinedQa.propSource.size,
          build:window.MyrrenBuild
        }));
        assert.equal(counts.build,95,'integrated game cache/version mismatch');
        assert(counts.terrainCells>=4,'expected multiple real terrain source cells');
        assert.equal(counts.props>0,mode!=='terrain-only',
          'camp atlas must be opt-in while native terrain stays enabled');
        if(mode!=='terrain-only')assert(counts.propCells>=2,
          'several native prop sprite rows should render in camp');
        const name=device.name+'-'+mode+'.png';
        await page.locator('#cv').screenshot({path:path.join(output,name)});
        assert.deepEqual(errors,[],'uncaught browser errors: '+device.name+' '+mode);
        report.push({device:device.name,mode,counts,screenshot:name});
        await context.close();
      }
    }
    fs.writeFileSync(path.join(output,'qa-report.json'),JSON.stringify({
      status:'draft-unmerged-visual-integration-proof',
      mainlineChanged:false,terrainProvenance:'PR #84',
      propProvenance:'PR #85 + #86',campfireLayoutApproval:false,scenes:report
    },null,2)+'\n');
    console.log('PASS: 6 real desktop/mobile scenes: terrain + legacy art, native props at original fire position, and default courtyard; native fallback preserved.');
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
