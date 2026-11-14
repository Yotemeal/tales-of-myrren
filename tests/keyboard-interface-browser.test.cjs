'use strict';
// Real keyboard navigation and gameplay input against the deployable game.
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  try{if(!fs.statSync(file).isFile())throw Error('not a file');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)}
  catch(_){res.writeHead(404);res.end()}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1100,height:700}}),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    // Network services are optional for local play; keep the test offline.
    await page.route('https://**/*',route=>route.abort());
    await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!document.getElementById('go').disabled);
    await page.getByRole('textbox',{name:'Your name'}).fill('Keyboard QA');
    await page.getByRole('button',{name:'ENTER',exact:true}).click();
    const position=()=>page.evaluate(()=>{
      window.dispatchEvent(new Event('pagehide'));
      const {x,y}=JSON.parse(localStorage.getItem('ember-reach-v2'));
      return {x,y};
    });
    const before=await position();
    // ENTER remains focused after a mouse click; it must not swallow WASD.
    await page.keyboard.down('d');await page.waitForTimeout(180);await page.keyboard.up('d');
    const moved=await position();
    assert(moved.x>before.x,'WASD must work after clicking ENTER');
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Settings',exact:true});
    await dialog.waitFor({state:'visible'});
    assert.equal(await page.locator('#mClose').evaluate(el=>el===document.activeElement),true,'opening a menu moves focus inside');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.getByRole('button',{name:'Restore code',exact:true}).evaluate(el=>el===document.activeElement),true,'reverse Tab wraps to the last dialog control');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#mClose').evaluate(el=>el===document.activeElement),true,'Tab wraps back to the first dialog control');
    const saveCode=page.getByRole('textbox',{name:'Save code',exact:true});
    await saveCode.focus();await page.keyboard.type('wasd and spaces');
    assert.equal(await saveCode.inputValue(),'wasd and spaces','save codes retain spaces and movement keys');
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Settings',exact:true}).evaluate(el=>el===document.activeElement),true,'closing restores focus to the opener');
    const closed=await position();await page.waitForTimeout(160);
    assert.deepEqual(await position(),closed,'typing in a menu must not leave movement held after closing');
    await page.keyboard.down('d');await page.waitForTimeout(100);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    const blurred=await position();await page.waitForTimeout(160);
    assert.deepEqual(await position(),blurred,'window blur releases held movement without needing keyup');
    await page.keyboard.up('d');
    await page.screenshot({path:'/tmp/myrren-keyboard-interface.png'});
    assert.deepEqual(errors,[],'keyboard/menu flows have no uncaught browser errors');
    console.log('PASS: real-browser WASD after entry, dialog focus/Tab/Escape, native save-code typing and blur input release.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
