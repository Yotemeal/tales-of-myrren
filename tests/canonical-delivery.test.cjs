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
  const old=await context.worker.fetch(new Request('https://example.workers.dev/public/index.html?utm_source=chatgpt.com'),env);
  assert.equal(old.status,308);
  assert.equal(old.headers.get('Location'),'https://example.workers.dev/index.html?utm_source=chatgpt.com');
  console.log('PASS: single canonical game for all query parameters, no stale scripts/styles, old path redirects');
})().catch(e=>{console.error(e);process.exitCode=1});
