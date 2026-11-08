'use strict';
// Runs the deployable /public game in Chromium, not the historical root index.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png','.json':'application/json'};
const serve=http.createServer((req,res)=>{
  const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(requestPath==='/'?'/index.html':requestPath));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{
    if(!fs.statSync(file).isFile())throw Error('not a file');
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }catch(e){res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(resolve=>serve.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    for(const [name,width,height] of [['portrait',390,844],['landscape',844,390]]){
      const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await page.goto('http://127.0.0.1:'+serve.address().port,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
      await page.locator('#nick').fill('Myrren QA');
      await page.locator('#go').click();
      await page.waitForFunction(()=>document.querySelector('#intro').hidden && !document.querySelector('#chat').hidden,{timeout:5000});
      await page.waitForTimeout(250);
      const state=await page.evaluate(()=>{
        const chat=document.getElementById('chat'),mini=document.getElementById('minimap');
        const a=chat.getBoundingClientRect(),b=mini.getBoundingClientRect();
        const last=chat.lastElementChild;
        return {chat:{left:a.left,right:a.right,top:a.top,bottom:a.bottom,width:a.width},mini:{left:b.left,right:b.right,hidden:mini.hidden},
          chatLines:chat.children.length,clamp:getComputedStyle(last).webkitLineClamp,
          activeCamera:document.querySelector('#cv').width,viewport:innerWidth};
      });
      assert.equal(state.mini.hidden,false,'compass should show after starting the game');
      assert(state.chat.right<=state.mini.left-4,`chat overlaps compass on ${name}: ${JSON.stringify(state)}`);
      assert(state.chat.left>=0&&state.chat.right<=state.viewport,'chat escapes viewport');
      assert(state.chatLines<=2,'old chat entries must not obscure the scene');
      assert.equal(state.clamp,'2','long messages must be clamped');
      assert(state.activeCamera>0,'game canvas must be initialized');
      assert.deepEqual(errors,[],'browser must not have uncaught script errors');
      await page.screenshot({path:`/tmp/myrren-${name}-hud.png`});
      await page.locator('[data-ui-open="gear"]').click();
      await page.waitForFunction(()=>!document.getElementById('modal').hidden,{timeout:5000});
      const rect=await page.locator('.win').boundingBox();
      assert(rect&&rect.x>=-1&&rect.x+rect.width<=width+1,'equipment window must fit viewport');
      await page.screenshot({path:`/tmp/myrren-${name}-equipment.png`});
      await page.close();
    }
    console.log('PASS: real production game, mobile portrait + landscape chat/compass separation, UI overflow and equipment window.');
  }finally{await browser?.close();await new Promise(resolve=>serve.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});
