'use strict';
// Production Crater Camp browser captures for isolated Kez scale research.
// These screenshots are NOT new authored character artwork.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  try{
    if(!fs.statSync(file).isFile())throw Error('not a file');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
   browser=await chromium.launch({headless:true});
   const base='http://127.0.0.1:'+server.address().port;
   for(const {tag,width,height,mobile} of [
     {tag:'desktop',width:1100,height:700,mobile:false},
     {tag:'mobile',width:390,height:844,mobile:true}
   ])for(const isProof of [false,true]){
     const page=await browser.newPage({viewport:{width,height},
       deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.goto(base+(isProof?'/?kez-scale-proof':'/'),{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready,{timeout:15000});
     await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
     const proof=await page.evaluate(()=>({
       enabled:window.MyrrenKezV2Atlas.scaleProof,
       proposal:window.MyrrenKezV2Atlas.previewDimensions,
       native:window.MyrrenKezV2Atlas.dimensions,
       build:window.MyrrenBuild
     }));
     assert.equal(proof.enabled,isProof);
     assert.equal(proof.build,89);
     assert.equal(proof.native.cellWidth,21,'do not swap source atlas');
     if(isProof){
       assert.equal(proof.proposal.cellWidth,32);
       assert.equal(proof.proposal.cellHeight,40);
     }else assert.equal(proof.proposal,null);
     await page.locator('#nick').fill('Kez QA');
     await page.locator('#go').click();
     await page.waitForFunction(()=>document.querySelector('#intro').hidden,{timeout:5000});
     await page.waitForTimeout(400);
     await page.screenshot({path:'/tmp/myrren-kez-scale-'+tag+(isProof?'-32x40-proof':'-21x27-live')+'.png'});
     assert.deepEqual(errors,[],'no browser exceptions at '+tag+' '+isProof);
     await page.close();
   }
   console.log('PASS: real desktop/mobile game captures baseline and opt-in Kez scale, with original atlas and gameplay preserved.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
