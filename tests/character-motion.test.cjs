'use strict';
// Exercise the live Kez V2 renderer with the shipped sprite pixels. Synthetic
// atlas tests cover selection logic; this catches real-asset crop/anchor and
// runtime hand-socket regressions without invoking the retired V31 renderer.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createCanvas,Image}=require('@napi-rs/canvas');
const SIZE=64,X=32,Y=47;

(async()=>{
  let ready,failed;
  const loaded=new Promise((resolve,reject)=>{ready=resolve;failed=reject});
  const window={dispatchEvent(event){
    if(event.type==='myrren-kez-v2-ready')ready();
    if(event.type==='myrren-kez-v2-error')failed(Error('shipped Kez V2 atlas failed to load'));
  }};
  const document={createElement(type){assert.equal(type,'canvas');return createCanvas(1,1)}};
  class AtlasImage extends Image{
    set src(url){super.src=fs.readFileSync('public'+url.split('?')[0])}
  }
  const sandbox={window,document,Image:AtlasImage,Event:class{constructor(type){this.type=type}},console,Math,Uint8ClampedArray};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/kez-v2-atlas.js','utf8'),sandbox);
  const timeout=setTimeout(()=>failed(Error('Kez V2 atlas did not finish loading')),2000);
  await loaded.finally(()=>clearTimeout(timeout));
  vm.runInContext(fs.readFileSync('public/kez-v2-equipment.js','utf8'),sandbox);
  vm.runInContext(fs.readFileSync('public/kez-v2-sword-motion.js','utf8'),sandbox);
  const atlas=window.MyrrenKezV2Atlas;
  assert(atlas.ready,'the actual shipped Kez V2 image must decode');
  const facings=[['front','d',1],['back','u',1],['left','s',-1],['right','s',1]];

  function renderBase(pose,time){
    const canvas=createCanvas(SIZE,SIZE),ctx=canvas.getContext('2d'),calls=[];
    const drawImage=ctx.drawImage.bind(ctx);
    ctx.drawImage=(...args)=>{
      assert.equal(ctx.imageSmoothingEnabled,false,'native pixels must not be smoothed');
      const [,sx,sy,sw,sh,dx,dy,dw,dh]=args;
      assert([sx,sy,sw,sh,dx,dy,dw,dh].every(Number.isInteger),'source/destination rectangles remain on the pixel grid');
      assert.equal(sw,dw,'native source width must not be resized');
      assert.equal(sh,dh,'native source height must not be resized');
      calls.push(args);drawImage(...args);
    };
    assert.equal(atlas.draw(ctx,X+.2,Y+.2,{tool:'fist',...pose},time),true);
    assert.equal(calls.length,1,'one base character per pose');
    const pixels=Buffer.from(ctx.getImageData(0,0,SIZE,SIZE).data);
    let minX=SIZE,minY=SIZE,maxX=-1,maxY=-1;
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(pixels[(y*SIZE+x)*4+3]>16){
      minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
    }
    assert(maxX>=minX,'character must have visible pixels');
    assert.equal(maxY,Y,'every idle/walk frame must meet the same ground pixel');
    assert(maxX-minX+1<=21&&maxY-minY+1<=27,'base art stays within its native cell');
    return pixels;
  }
  const key=pixels=>pixels.toString('base64');
  let poses=0;
  const idleByDirection=[];
  for(const [name,dv,f] of facings){
    const period=dv==='d'?440:650,pose={dv,f,moving:false};
    const idle=[0,1,2,3].map(frame=>renderBase(pose,frame*period));
    assert(new Set(idle.map(key)).size>1,name+' idle must visibly animate real artwork');
    assert.deepEqual(renderBase(pose,period*4),idle[0],name+' idle loops without accumulating drift');
    if(dv!=='d'){
      // Directional breathing changes the torso only. Front idle is authored
      // full-frame animation and is intentionally allowed to change its feet.
      for(const frame of idle){
        assert.deepEqual(frame.subarray(42*SIZE*4),idle[0].subarray(42*SIZE*4),name+' stationary soles/legs remain fixed');
        assert.deepEqual(frame.subarray(0,34*SIZE*4),idle[0].subarray(0,34*SIZE*4),name+' idle does not distort the head');
      }
    }
    const walking={dv,f,moving:true};
    const walk=[0,1,2,3].map(frame=>renderBase(walking,frame*130));
    assert.equal(new Set(walk.map(key)).size,4,name+' walking must use four distinct shipped frames');
    assert.deepEqual(renderBase(walking,520),walk[0],name+' walking loops without drifting');
    // Releasing movement returns to that facing's stationary artwork.
    assert.deepEqual(renderBase(pose,0),idle[0],name+' stops without changing direction');
    idleByDirection.push(key(idle[0]));poses+=11;
  }
  assert.equal(new Set(idleByDirection).size,4,'front/back/left/right keep distinct facing art');

  // Execute the actual game composition function, including fitted equipment.
  // Omit weapon pixels so changing blade angle cannot hide a marching body.
  const runtime=fs.readFileSync('public/myrren-game.js','utf8');
  const start=runtime.indexOf('function drawKezV2('),end=runtime.indexOf('function drawPerson(',start);
  assert(start>=0&&end>start,'the current player composition function must exist');
  let toolCalls=[];
  Object.assign(sandbox,{
    ctx:null,me:{deathAt:null,hurtAt:-99999},shadowE(){},label(){},
    R(x,y,w,h,color){sandbox.ctx.fillStyle=color;sandbox.ctx.fillRect(x,y,w,h)},
    drawTool(...args){toolCalls.push(args)}
  });
  vm.runInContext(runtime.slice(start,end)+'\nthis.drawPlayer=drawKezV2;',sandbox);
  const ages=[0,72,120,192,264,319];
  for(const mat of [0,...window.MyrrenKezV2Equipment.order])for(const [name,dv,f] of facings){
    const weaponMat=mat||2;
    const pose={dv,f,moving:false,tool:'sword',mat:weaponMat,g:[mat,mat,mat,mat,mat,mat],swingAt:0};
    let grounded;
    for(const age of ages){
      const canvas=createCanvas(SIZE,SIZE);sandbox.ctx=canvas.getContext('2d');toolCalls=[];
      assert.equal(sandbox.drawPlayer(X,Y,pose,age),true);
      assert.equal(toolCalls.length,1,'one held blade per '+name+' strike phase');
      const [tool,tier,hx,hy,facing,angle,scale]=toolCalls[0];
      assert.equal(tool,'sword');assert.equal(tier,weaponMat);assert.equal(facing,f);
      assert.equal(hx,X+(dv==='u'?-8:dv==='s'?f*6:5),'sword grip stays on the dominant hand');
      assert.equal(hy,Y-7,'hand socket does not bob while attacking');
      assert.equal(scale,.6,'weapon keeps the compact player scale');
      assert.equal(angle,window.MyrrenKezV2SwordMotion.angle(age),'runtime uses the rigid sword-only motion');
      const pixels=Buffer.from(sandbox.ctx.getImageData(0,0,SIZE,SIZE).data);
      if(grounded)assert.deepEqual(pixels,grounded,name+' sword swing cannot march the body/equipment in place');
      else grounded=pixels;
      poses++;
    }
  }
  console.log('PASS: '+poses+' real Kez V2 motion poses; four-direction idle/walk cycles; native ground anchors; eight armour configurations with grounded sword bodies and fixed hand sockets.');
})().catch(error=>{console.error(error);process.exitCode=1});
