'use strict';
// Real deployable-game proof: native starter terrain, default-on camp props and
// opt-in Bronze equipment on the SAME live frame. QA hooks affect only Chromium.
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
      for(const mode of ['terrain-only','combined','separated-fire','bronze-and-camp']){
        const context=await browser.newContext({
          viewport:{width:device.width,height:device.height},
          deviceScaleFactor:device.dpr,isMobile:device.mobile,hasTouch:device.mobile
        });
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        await page.addInitScript(()=>{
          window.__combinedQa={terrain:0,props:0,bronze:0,terrainSource:new Set(),propSource:new Set(),bronzeSource:new Set()};
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
            if(image?.src?.includes('/assets/armour/bronze_layers_21x27.png')){
              window.__combinedQa.bronze++;
              window.__combinedQa.bronzeSource.add(args[0]+','+args[1]);
            }
            return original.call(this,image,...args);
          };
        });
        if(mode==='bronze-and-camp'){
          await page.route('**/myrren-game.js?*',async route=>{
            const response=await route.fetch(),source=await response.text();
            const end=source.lastIndexOf('})();');
            assert(end>0&&source.includes('function drawKezV2(')&&
              source.includes('equipFromBag('),'Kez gameplay integration signature changed');
            const probe=`
              window.__combinedBronzeQa={
                equip(){
                  const ids=['bronze_helm','bronze_body','bronze_legs',
                    'bronze_boots','bronze_shield','bronze_gloves','bronze_sword'];
                  save.bag=[...new Set([...save.bag,...ids])];
                  for(const slot of SLOTS)unequip(slot);
                  for(const id of ids)equipFromBag(save.bag.indexOf(id));
                  return {equipped:Object.values(save.eq).filter(Boolean).sort(),
                    fire:{x:CAMPFIRE.x,y:CAMPFIRE.y}};
                }
              };
            `;
            await route.fulfill({response,body:source.slice(0,end)+probe+source.slice(end)});
          });
        }
        const flags=mode==='terrain-only'?'?legacy-camp-props':
          mode==='combined'?'?original-campfire-layout-proof':
          mode==='bronze-and-camp'?'?bronze-proof':'';
        await page.goto(base+'/'+flags,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.MyrrenEnvironment?.nativeTerrainReady() &&
          !document.getElementById('go')?.disabled,{timeout:20000});
        if(mode!=='terrain-only')await page.waitForFunction(()=>window.MyrrenCampProps?.ready(),
          null,{timeout:12000});
        if(mode==='bronze-and-camp')
          await page.waitForFunction(()=>window.MyrrenKezV2Equipment?.hasAtlas(2)&&
            window.MyrrenKezV2Atlas?.swordReady&&window.MyrrenKezV2Atlas?.punchReady&&
            window.MyrrenSwords?.ready,null,{timeout:15000});
        if(mode==='bronze-and-camp'){
          // A loaded attack pose alone is insufficient: the held sword must
          // render from the approved forged-sword atlas, not a silent fallback.
          await page.evaluate(()=>{
            const original=window.MyrrenSwords.draw;
            window.__combinedQa.swordDraws=0;
            window.__combinedQa.swordScale=null;
            window.MyrrenSwords.draw=function(...args){
              const rendered=original(...args);
              if(rendered&&args[1]===2){
                window.__combinedQa.swordDraws++;
                window.__combinedQa.swordScale=args[6];
              }
              return rendered;
            };
          });
        }
        const enabled=await page.evaluate(()=>window.MyrrenCampProps?.enabled);
        assert.equal(enabled,mode!=='terrain-only');
        await page.locator('#nick').fill('World QA');
        await page.locator('#go').click();
        await page.waitForFunction(()=>document.getElementById('intro')?.hidden,null,{timeout:8000});
        if(mode==='bronze-and-camp'){
          const proof=await page.evaluate(()=>window.__combinedBronzeQa.equip());
          assert.equal(proof.equipped.length,7,'full Bronze set and sword must equip');
          assert.deepEqual(proof.fire,{x:864,y:850},
            'native Bronze must not move the current courtyard cooking station');
          await page.waitForFunction(()=>window.__combinedQa.bronze>5&&
            window.__combinedQa.swordDraws>0,null,{timeout:9000});
        }
        await page.waitForFunction(()=>window.__combinedQa.terrain>80,null,{timeout:9000});
        if(mode!=='terrain-only')await page.waitForFunction(()=>window.__combinedQa.props>3,
          null,{timeout:9000});
        await page.waitForTimeout(200);
        const counts=await page.evaluate(()=>({
          terrain:window.__combinedQa.terrain,
          props:window.__combinedQa.props,
          bronze:window.__combinedQa.bronze,
          bronzeSwordDraws:window.__combinedQa.swordDraws||0,
          bronzeSwordScale:window.__combinedQa.swordScale,
          bronzeCells:window.__combinedQa.bronzeSource.size,
          terrainCells:window.__combinedQa.terrainSource.size,
          propCells:window.__combinedQa.propSource.size,
          build:window.MyrrenBuild
        }));
        assert.equal(counts.build,96,'integrated game cache/version mismatch');
        assert(counts.terrainCells>=4,'expected multiple real terrain source cells');
        assert.equal(counts.props>0,mode!=='terrain-only',
          'camp atlas must be opt-in while native terrain stays enabled');
        if(mode!=='terrain-only')assert(counts.propCells>=2,
          'several native prop sprite rows should render in camp');
        assert.equal(counts.bronze>0,mode==='bronze-and-camp',
          'Bronze proof must render only when equipped and explicitly enabled');
        if(mode==='bronze-and-camp'){
          assert(counts.bronzeCells>=4,
            'multiple native Bronze equipment cells must render alongside terrain/props');
          assert(counts.bronzeSwordDraws>0,
            'equipped Bronze sword must use the existing forged-sword renderer');
          assert.equal(counts.bronzeSwordScale,0.85,
            'native fitted Bronze blade must be legible without scaling legacy swords');
        }
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
    console.log('PASS: 8 actual desktop/mobile scenes: terrain, native props and fully equipped opt-in Bronze rendered together with fallback intact.');
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
