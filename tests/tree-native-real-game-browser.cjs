'use strict';
// Browser proof: uses real game canvas and depth sorter, with QA-only native tree atlas.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public'),out='/tmp/myrren-tree-real-game-review';
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.png':'image/png','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return;}
 try{if(!fs.statSync(file).isFile())throw Error('missing');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}
 catch{res.writeHead(404);res.end('missing')}
});
const qaHook="window.__treeQaSetup=function(){\n for(const m of mons){m.state=\"dead\";m.back=Number.MAX_SAFE_INTEGER}\n for(const n of nodes)if(TREEK.includes(n.k))n.x=-999999;\n const species=[\"pine\",\"birch\",\"oak\",\"willow\",\"maple\",\"ironbark\"];\n window.__treeQaNodes=[];\n for(let row=0;row<2;row++)for(let col=0;col<6;col++){\n  const n={k:\"tree\",x:470+col*132,y:1250+row*170,back:0,previewNativeType:species[col],previewVariant:row===0?\"a\":\"b\",previewStump:false};\n  nodes.push(n);window.__treeQaNodes.push(n);\n }\n me.x=800;me.y=1365;me.ox=me.x;me.oy=me.y;\n me.hp=hpMax();me.deathAt=null;me.swing=-99999;me.hurtAt=-99999;\n me.moving=false;me.pend=0;me.dv=\"d\";me.face=1;\n cam.x=me.x-cv.width/2;cam.y=me.y-cv.height*.47;\n inside=null;act=null;marker=null;snapCam=true;\n return {nodes:window.__treeQaNodes.length,cameraScale:GAMEPLAY_SCALE};\n};\nwindow.__treeQaStumps=function(cut){\n const now=performance.now();\n for(const n of window.__treeQaNodes||[]){n.previewStump=cut;n.back=cut?now+999999:0;}\n};";
(async()=>{
 let browser;
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1680,height:1160},deviceScaleFactor:1,isMobile:false});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__treeActualDraws=[];
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(typeof image?.src==='string'&&image.src.includes('approved_tree_atlas.png')){
      if(window.__treeActualDraws.length<8000)window.__treeActualDraws.push(args.slice(0,4));
    }
    return draw.call(this,image,...args);
   };
  });
  await page.route('**/myrren-game.js?*',async route=>{
   const res=await route.fetch(),src=await res.text(),i=src.lastIndexOf('})();');
   assert(i>0&&src.includes('const nodes=[]')&&src.includes('GAMEPLAY_SCALE=2'),
     'Production renderer / bootstrap changed');
   await route.fulfill({response:res,body:src.slice(0,i)+qaHook+'\n'+src.slice(i)});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/tree-native-review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MyrrenTreeNativeReview?.ready&&window.MyrrenKezV2Atlas?.ready&&!!window.__treeQaSetup&&
    !document.getElementById('go').disabled,null,{timeout:25000});
  await page.locator('#nick').fill('Tree QA');
  await page.locator('#go').click();
  await page.waitForFunction(()=>document.getElementById('intro').hidden,null,{timeout:8000});
  const result=await page.evaluate(()=>window.__treeQaSetup());
  assert.equal(result.nodes,12);assert.equal(result.cameraScale,2);
  await page.waitForTimeout(500);
  const fullMeta=await page.evaluate(()=>({
    canvas:[document.getElementById('cv').width,document.getElementById('cv').height],
    css:[document.getElementById('cv').getBoundingClientRect().width,document.getElementById('cv').getBoundingClientRect().height],
    fullCount:window.MyrrenTreeNativeReview.fullDraws,
    draws:window.__treeActualDraws.slice(-1500)
  }));
  assert(fullMeta.fullCount>=12,'12 trees must render through actual game engine');
  const has=(draws,col,row,stump)=>draws.some(([sx,sy])=>
    sy===row*138+(stump?104:2)&&sx>=col*100&&sx<col*100+100);
  for(let col=0;col<6;col++)for(let row=0;row<2;row++)
    assert(has(fullMeta.draws,col,row,false),'missing tree '+col+':'+row);
  await page.locator('#cv').screenshot({path:path.join(out,'actual-game-12-full-2x.png')});
  await page.screenshot({path:path.join(out,'actual-game-full-with-ui.png')});
  await page.evaluate(()=>{window.__treeActualDraws=[];window.__treeQaStumps(true)});
  await page.waitForTimeout(300);
  const stumpMeta=await page.evaluate(()=>({
    drawn:window.MyrrenTreeNativeReview.stumpDraws,rects:window.__treeActualDraws.slice(-1500)
  }));
  assert(stumpMeta.drawn>=12,'12 matching stumps must render in real game');
  for(let col=0;col<6;col++)for(let row=0;row<2;row++)
    assert(has(stumpMeta.rects,col,row,true),'missing stump '+col+':'+row);
  await page.locator('#cv').screenshot({path:path.join(out,'actual-game-12-stumps-2x.png')});
  assert.deepEqual(errors,[],'uncaught runtime errors');
  fs.writeFileSync(path.join(out,'render-proof.json'),JSON.stringify({
    kind:'actual production game renderer / staging only',cameraScale:result.cameraScale,
    canvas:fullMeta.canvas,css:fullMeta.css,fullTreeDraws:fullMeta.fullCount,
    stumpDraws:stumpMeta.drawn,qaOnlyScene:true,liveGameChanged:false
  },null,2)+'\n');
  console.log('PASS: 12 A/B tree variants and 12 exact stumps rendered in real game at 2x; source game unchanged.');
 }finally{await browser?.close();await new Promise(ok=>server.close(ok))}
})().catch(e=>{console.error(e);process.exitCode=1});
