'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/worker.js','utf8').replace('export default','globalThis.worker =');
const context={URL,Headers,Response,Request};
vm.runInNewContext(source,context);
(async()=>{
  const env={ASSETS:{fetch:async()=>new Response('canonical game',{headers:{'Content-Type':'text/html'}})}};
  for(const query of ['', '?utm_source=chatgpt.com','?v=36']){
    const res=await context.worker.fetch(new Request('https://example.workers.dev/'+query),env);
    assert.equal(await res.text(),'canonical game');
    assert.equal(res.headers.get('X-Myrren-Entry'),'canonical-public');
    assert.match(res.headers.get('Cache-Control'),/no-store/);
  }
  for(const path of ['/myrren-game.js','/myrren-ui.css','/manifest.json']){
    const res=await context.worker.fetch(new Request('https://example.workers.dev'+path),env);
    assert.match(res.headers.get('Cache-Control'),/no-store/,path+' must not cache stale game files');
  }
  for(const [path,location] of [
    ['/public','/'],
    ['/public/','/'],
    ['/public/index.html?utm_source=chatgpt.com','/index.html?utm_source=chatgpt.com'],
    ['/public//evil.com?next=https://elsewhere.example','//evil.com?next=https://elsewhere.example'],
    ['/public/\\evil.com','//evil.com'],
    ['/public/\\\\evil.com','///evil.com'],
    ['/public/%5C%5Cevil.com','/%5C%5Cevil.com']
  ]){
    const old=await context.worker.fetch(new Request('https://example.workers.dev'+path),env);
    assert.equal(old.status,308,path);
    assert.equal(old.headers.get('Location'),'https://example.workers.dev'+location,path);
    assert.equal(new URL(old.headers.get('Location')).origin,'https://example.workers.dev',path+' must stay on the game origin');
  }
  console.log('PASS: single canonical game for all query parameters, no stale scripts/styles, same-origin old path redirects including slash/backslash inputs');
})().catch(e=>{console.error(e);process.exitCode=1});
