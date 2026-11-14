'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

// Start the canonical public/ entry point on a local HTTP server before running.
(async()=>{
  const browser=await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH||undefined
  });
  try{
    const page=await browser.newPage({
      viewport:{width:852,height:393},deviceScaleFactor:3,isMobile:true,hasTouch:true
    });
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'
      ?route.continue():route.abort());
    await page.addInitScript(()=>localStorage.setItem('myrren-camera-zoom','{"portrait":4,"landscape":1}'));
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.MYRREN_QA_URL||'http://127.0.0.1:8765');
    await page.locator('#nick').fill('Camera QA');
    await page.locator('#go').click();
    await page.locator('#intro').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>localStorage.getItem('myrren-camera-zoom')),null);
    const session=await page.context().newCDPSession(page);
    const metrics=()=>page.locator('#cv').evaluate(canvas=>{
      const r=canvas.getBoundingClientRect();
      return [canvas.width,canvas.height,r.width/canvas.width,r.height/canvas.height,
        canvas.getContext('2d').imageSmoothingEnabled,visualViewport.scale];
    });
    async function touch(type,points){
      await session.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
    }
    for(const [width,height,label] of [[852,393,'landscape'],[393,852,'portrait']]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(w=>document.querySelector('#cv').width===w,Math.ceil(width/2));
      const expected=[Math.ceil(width/2),Math.ceil(height/2),2,2,false,1];
      assert.deepEqual(await metrics(),expected);
      await touch('touchStart',[[width/2-20,height/2],[width/2+20,height/2]]);
      await touch('touchMove',[[width/2-95,height/2],[width/2+95,height/2]]);
      await touch('touchEnd',[]);
      assert.deepEqual(await metrics(),expected);
      assert(await page.locator('#pad').isVisible());
      assert(await page.locator('#aAtk').isVisible());
      await page.waitForTimeout(800);
      if(process.env.MYRREN_SCREENSHOT_DIR)
        await page.screenshot({path:process.env.MYRREN_SCREENSHOT_DIR+'/fixed-camera-'+label+'.png'});
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: fixed 2× camera, legacy preference cleanup, orientation and touch pinch');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
