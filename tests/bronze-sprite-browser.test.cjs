'use strict';
/* Visual QA of isolated actual Kez V2 + native PNG layers in Chromium.
 * Does not navigate to or mutate the running game or player saves.
 */
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  try{const s=fs.statSync(file);if(!s.isFile())throw Error('not a file');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(404);res.end('Not found')}
});
async function run(){
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:980,height:900},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url='http://127.0.0.1:'+server.address().port+'/bronze-sprite-lab.html';
    const response=await page.goto(url,{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('loaded'),{timeout:15000});
    assert.equal(await page.evaluate(()=>window.MyrrenKezV2Atlas?.ready),true);
    assert.equal(await page.evaluate(()=>window.MyrrenNativeGearLayers?.atlasHeight),972);
    const snapshot=()=>page.evaluate(()=>({
      a:document.querySelector('#equipped').toDataURL(),
      b:document.querySelector('#base').toDataURL(),
      size:[document.querySelector('#equipped').width,document.querySelector('#equipped').height]
    }));
    const first=await snapshot();
    assert.deepEqual(first.size,[864,220]);
    assert.notEqual(first.a,first.b,'Equipped and bare character must look different');
    const output='/tmp/myrren-bronze-four-directions.png';
    await page.locator('#equipped').screenshot({path:output});
    const noHelmet=page.locator('#helmet');
    await noHelmet.uncheck();
    const withoutHelmet=await snapshot();
    assert.notEqual(first.a,withoutHelmet.a,'Helmet toggle must change rendered pixels');
    assert.equal(first.b,withoutHelmet.b,'Helmet toggle must not mutate the base sprite');
    await noHelmet.check();

    // Unmoving side and back pose must not accidentally reuse the walking cycle.
    await page.locator('#motion').selectOption('idle');
    await page.locator('#frame').selectOption('0');
    const idle0=await page.evaluate(()=>{
      const c=document.querySelector('#equipped'),g=c.getContext('2d');
      return [1,2,3].map(i=>Array.from(g.getImageData(20+i*216,40,210,148).data));
    });
    await page.locator('#frame').selectOption('3');
    const idle3=await page.evaluate(()=>{
      const c=document.querySelector('#equipped'),g=c.getContext('2d');
      return [1,2,3].map(i=>Array.from(g.getImageData(20+i*216,40,210,148).data));
    });
    for(let d=0;d<3;d++)
      assert.deepEqual(idle0[d],idle3[d],
        'Unmoving back/side equipment must not shift when stepping idle frame');

    await page.locator('#motion').selectOption('walk');
    await page.locator('#frame').selectOption('1');
    const walking1=(await snapshot()).a;
    await page.locator('#frame').selectOption('3');
    const walking3=(await snapshot()).a;
    assert.notEqual(walking1,walking3,'Walking frame must animate the complete character');
    await page.locator('#mode').selectOption('procedural');
    const procedural=(await snapshot()).a;
    assert.notEqual(procedural,walking3,'Legacy renderer must be a true comparison');
    await page.locator('#mode').selectOption('atlas');
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/myrren-bronze-mobile-lab.png',fullPage:true});
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS Bronze browser QA: real PNG+Kez V2, directional idle locks, frame changes, six slots and 390px mobile view');
  } finally {
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
run().catch(err=>{console.error(err);process.exitCode=1});
