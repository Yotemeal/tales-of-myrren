'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),target=path.resolve(root,'.'+u.pathname);
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(!fs.statSync(target).isFile())throw Error('not a file');
 res.setHeader('content-type',target.endsWith('.png')?'image/png':'text/html; charset=utf-8');
 fs.createReadStream(target).pipe(res);}catch(e){res.writeHead(404);res.end('missing');}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/ore-v32-native-review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0),null,{timeout:15000});
  const meta=await page.evaluate(()=>Array.from(document.images).map(i=>({src:i.getAttribute('src'),w:i.naturalWidth,h:i.naturalHeight})));
  assert.equal(meta.length,25,'8 large, 8 depleted, 8 scaled, 1 hero');
  for(const item of meta){if(item.src.includes('myrren_front'))assert.deepEqual([item.w,item.h],[24,32]);else assert.deepEqual([item.w,item.h],[40,28]);}
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/myrren-ore-v32-2x-preview.png',fullPage:true});
  console.log('PASS: all eight V3.2 PNGs loaded, native dimensions preserved at 2×, no browser errors');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});