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
      const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      if(name==='portrait')await page.addInitScript(()=>{
        localStorage.setItem('ember-reach-v2',JSON.stringify({
          v:3,ts:Date.now()-1000,name:'Myrren Save QA',
          xp:{melee:500,woodcutting:200,mining:100,forging:0},
          inv:{coins:777,logs:4},eq:{},bag:[],x:100,y:100
        }));
      });
      await page.goto('http://127.0.0.1:'+serve.address().port,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
      if(name==='portrait')assert.equal(await page.locator('#nick').inputValue(),'Myrren Save QA',
        'existing local player progress must restore before entering the game');
      await page.locator('#nick').fill('Myrren QA');
      await page.locator('#go').click();
      await page.waitForFunction(()=>document.querySelector('#intro').hidden && !document.querySelector('#chat').hidden,{timeout:5000});
      await page.waitForTimeout(250);
      const state=await page.evaluate(()=>{
        const chat=document.getElementById('chat'),hud=document.getElementById('hud');
        const a=chat.getBoundingClientRect(),b=hud.getBoundingClientRect();
        const last=chat.lastElementChild;
        return {chat:{left:a.left,right:a.right,top:a.top,bottom:a.bottom,width:a.width},hud:{left:b.left,right:b.right,top:b.top,bottom:b.bottom,hidden:hud.hidden},
          chatLines:chat.children.length,clamp:getComputedStyle(last).webkitLineClamp,
          activeCamera:document.querySelector('#cv').width,viewport:innerWidth};
      });
      assert.equal(state.hud.hidden,false,'HUD should show after starting the game');
      assert(state.hud.left>=-1&&state.hud.right<=state.viewport+1,`HUD escapes viewport on ${name}: ${JSON.stringify(state)}`);
      assert(state.chat.bottom<=state.hud.top+2||state.chat.top>=state.hud.bottom-2||state.chat.right<=state.hud.left+2||state.chat.left>=state.hud.right-2,`chat overlaps HUD on ${name}: ${JSON.stringify(state)}`);
      assert(state.chat.left>=0&&state.chat.right<=state.viewport,'chat escapes viewport');
      assert(state.chatLines<=2,'old chat entries must not obscure the scene');
      assert.equal(state.clamp,'2','long messages must be clamped');
      assert(state.activeCamera>0,'game canvas must be initialized');
      assert.deepEqual(errors,[],'browser must not have uncaught script errors');
      if(name==='portrait'){
        // A second real tab on the same origin updates shared progress.
        // The running older tab must not overwrite it on pagehide/autosave.
        const second=await page.context().newPage();
        await second.goto('http://127.0.0.1:'+serve.address().port,{waitUntil:'domcontentloaded'});
        const newer=await second.evaluate(()=>{
          const key='ember-reach-v2';
          const previous=JSON.parse(localStorage.getItem(key));
          const snapshot={...previous,ts:Date.now()+60000,inv:{...previous.inv,coins:987654}};
          localStorage.setItem(key,JSON.stringify(snapshot));
          return snapshot;
        });
        await page.waitForFunction(()=>{
          const toast=document.querySelector('#toast');
          return toast?.textContent.includes('updated in another tab')&&toast.classList.contains('on');
        },null,{timeout:5000});
        await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
        const after=await second.evaluate(()=>JSON.parse(localStorage.getItem('ember-reach-v2')));
        assert.equal(after.ts,newer.ts,'older tab must not overwrite the newer save timestamp');
        assert.equal(after.inv.coins,987654,'older tab must not erase newer inventory');
        await page.waitForTimeout(2000);
        assert.equal(await page.locator('#toast').evaluate(el=>getComputedStyle(el).opacity),'1',
          'save conflict warning must remain visible');
        await second.close();
      }
      await page.screenshot({path:`/tmp/myrren-${name}-hud.png`});
      await page.locator('[data-ui-open="gear"]').click();
      await page.waitForFunction(()=>!document.getElementById('modal').hidden,{timeout:5000});
      const rect=await page.locator('.win').boundingBox();
      assert(rect&&rect.x>=-1&&rect.x+rect.width<=width+1,'equipment window must fit viewport');
      await page.screenshot({path:`/tmp/myrren-${name}-equipment.png`});
      await context.close();
    }
    console.log('PASS: canonical game, local save restoration, mobile portrait + landscape HUD and equipment.');
  }finally{await browser?.close();await new Promise(resolve=>serve.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});
