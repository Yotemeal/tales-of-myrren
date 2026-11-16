'use strict';
// Real Chromium production-renderer smoke: all twelve distinct approved trees
// and their corresponding stumps, at the same fixed 2x CSS presentation.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.html':'text/html'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1');
 const full=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
 if(!full.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{if(!fs.statSync(full).isFile())throw Error('not found');res.setHeader('content-type',mime[path.extname(full)]||'application/octet-stream');fs.createReadStream(full).pipe(res)}
 catch(_){res.writeHead(404);res.end('not found')}
});
(async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:950},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MyrrenEnvironment?.treeBounds,{timeout:18000});
  const assets=await page.evaluate(async()=>{
   const env=window.MyrrenEnvironment,names=['pine','birch','oak','willow','maple','ironbark'];
   const keyByName={pine:'tree',birch:'birch',oak:'oak',willow:'elder',maple:'maple',ironbark:'myrren'};
   const hash=(a,b)=>(Math.imul((a|0)^Math.imul(b|0,19349663),2246822519)>>>0);
   const nodes=[];
   for(let row=0;row<2;row++)for(let i=0;i<names.length;i++){
    const expected=row?'b':'a';let x=100+i*142,y=110+row*130;
    for(let z=0;z<20&&((hash(x,y)%10<3?'b':'a')!==expected);z++)x++;
    if((hash(x,y)%10<3?'b':'a')!==expected)throw Error('variant selection failed');
    nodes.push({k:keyByName[names[i]],x,y,back:0,expected,kind:names[i]});
   }
   const canvas=document.createElement('canvas');canvas.width=980;canvas.height=350;
   canvas.id='approved-trees-qa';canvas.style.cssText='display:block;width:1568px;height:560px;image-rendering:pixelated';
   document.body.replaceChildren(canvas);
   const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
   const draw=stage=>{
    ctx.fillStyle='#5b8d44';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const n of nodes){n.back=stage==='stump'?performance.now()+86400000:0;
     env.tree(ctx,n,n.x+35,n.y+5,performance.now());
    }
   };
   draw('full');
   await new Promise(done=>setTimeout(done,600));draw('full');
   window.__treeQaDraw=draw;
   return nodes.map(n=>({species:n.kind,expected:n.expected,bounds:env.treeBounds(n)}));
  });
  assert.equal(assets.length,12);
  assert(assets.every(x=>x.bounds?.w>50&&x.bounds?.h>70));
  await page.locator('#approved-trees-qa').screenshot({path:'/tmp/myrren-approved-trees-a-b-2x.png'});
  await page.evaluate(async()=>{window.__treeQaDraw('stump');await new Promise(done=>setTimeout(done,600));window.__treeQaDraw('stump')});
  await page.locator('#approved-trees-qa').screenshot({path:'/tmp/myrren-approved-stumps-a-b-2x.png'});
  const urls=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>new URL(e.name).pathname).filter(p=>p.includes('/trees-v1/')));
  const distinct=[...new Set(urls)];
  assert.equal(distinct.length,24,'all twelve trees and matching stumps must load in browser');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: 24 approved native tree/stump PNGs loaded with real renderer, 12 A/B tree screenshot and 12 stump screenshot.');
 }finally{await browser?.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
