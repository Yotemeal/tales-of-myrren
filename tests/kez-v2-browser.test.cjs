'use strict';
// Smoke-test the actual Cloudflare public/ entry point in an independent browser.
// Produces screenshots so native character and armour quality can be reviewed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filename.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  try{const stat=fs.statSync(filename);if(!stat.isFile())throw Error('Not a file');
    response.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
    fs.createReadStream(filename).pipe(response);
  }catch(_){response.writeHead(404);response.end('Not found')}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready,{timeout:15000});
    await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.MyrrenKezV2Atlas.dimensions.scale),1);
    assert(await page.evaluate(()=>!!window.MyrrenKezV2Equipment));
    await page.locator('#nick').fill('Kez QA');
    await page.locator('#go').click();
    await page.waitForFunction(()=>document.querySelector('#intro').hidden,{timeout:5000});
    await page.waitForTimeout(600);
    await page.screenshot({path:'/tmp/myrren-kez-v2-mobile.png'});
    const check=await page.evaluate(()=>{
      const canvas=document.getElementById('cv'),ctx=canvas.getContext('2d');
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let colored=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]||pixels[i+1]||pixels[i+2])colored++;
      return {width:canvas.width,height:canvas.height,colored};
    });
    assert(check.colored>300,'world canvas should contain a painted game world');
    await page.locator('[data-ui-open="gear"]').click();
    await page.waitForFunction(()=>!!document.querySelector('.character-portrait canvas'),{timeout:5000});
    await page.waitForTimeout(200);
    await page.screenshot({path:'/tmp/myrren-kez-v2-equipment.png'});
    await page.evaluate(()=>{
      const tiers=[2,3,4,5,7,6,8];
      const gallery=document.createElement('canvas');gallery.id='qa-gallery';gallery.width=840;gallery.height=220;
      const g=gallery.getContext('2d');g.fillStyle='#222b2e';g.fillRect(0,0,gallery.width,gallery.height);
      g.imageSmoothingEnabled=false;
      tiers.forEach((mat,i)=>{
        const name=['Bronze','Iron','Steel','Black Iron','Obsidianite','Myrrenite','Starsteel'][i];
        const x=i*120+60,y=160,o={dv:'d',f:1,moving:false,now:0,g:[mat,mat,mat,mat,mat,mat]};
        g.fillStyle='#303d3c';g.fillRect(i*120+8,7,104,204);
        g.save();g.translate(x,y);g.scale(4,4);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'under');
        window.MyrrenKezV2Atlas.draw(g,0,0,o,0);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'over');
        g.restore();g.fillStyle='#fff4e0';g.font='12px sans-serif';g.textAlign='center';g.fillText(name,x,200);
      });
      document.body.appendChild(gallery);
    });
    const galleryPng=await page.evaluate(()=>document.getElementById('qa-gallery').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync('/tmp/myrren-kez-v2-seven-metals.png',Buffer.from(galleryPng,'base64'));
    assert.deepEqual(errors,[],'no unhandled browser script exceptions');
    console.log('PASS: real browser loads Kez V2, enters game, paints world, opens equipped portrait and renders all seven metal tiers.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
