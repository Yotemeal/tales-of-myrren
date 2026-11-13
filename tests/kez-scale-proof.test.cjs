// Opt-in Kez native-size budget study. Never changes ordinary players or gear.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/kez-v2-atlas.js','utf8');
const game=fs.readFileSync('public/myrren-game.js','utf8');
const page=fs.readFileSync('public/index.html','utf8');

function makeAtlas(search){
  const events=[];
  const window={location:{search},dispatchEvent:e=>events.push(e.type)};
  const imageData=new Uint8ClampedArray(84*162*4);
  for(let i=3;i<imageData.length;i+=4)imageData[i]=255;
  const document={createElement(tag){
    assert.equal(tag,'canvas');
    return {width:84,height:162,getContext(){
      return {drawImage(){},putImageData(){},imageSmoothingEnabled:false,
        createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},
        getImageData(x,y,w,h){return {data:w===21&&h===27?
          new Uint8ClampedArray(21*27*4).fill(255):imageData}}};
    }};
  }};
  class Image {constructor(){this.naturalWidth=84;this.naturalHeight=162}
    set src(value){this.url=value;this.onload?.();}}
  class Event {constructor(type){this.type=type}}
  const sandbox={window,document,Image,Event,console,Uint8ClampedArray,Math};
  vm.createContext(sandbox);vm.runInContext(source,sandbox);
  const atlas=window.MyrrenKezV2Atlas;
  assert(atlas.ready);
  assert.deepEqual(events,['myrren-kez-v2-ready']);
  function draw(change={}){
    const events=[];
    const ctx={imageSmoothingEnabled:true,
      save(){events.push(['save'])},restore(){events.push(['restore'])},
      translate(...args){events.push(['translate',...args])},
      scale(...args){events.push(['scale',...args])},
      drawImage(...args){events.push(['drawImage',...args])}};
    const state={dv:'d',f:1,moving:false,tool:'fist',g:[0,0,0,0,0,0],...change};
    assert.equal(atlas.draw(ctx,100,120,state,440),true);
    const call=events.find(e=>e[0]==='drawImage');
    assert(call);
    assert.equal(ctx.imageSmoothingEnabled,false,'never blur pixel-art pixels');
    return {call,events};
  }
  return {atlas,draw};
}
const defaultGame=makeAtlas('');
assert.equal(defaultGame.atlas.scaleProof,false);
assert.equal(defaultGame.atlas.previewDimensions,null);
assert.equal(defaultGame.atlas.dimensions.cellWidth,21);
assert.equal(defaultGame.atlas.dimensions.cellHeight,27);
const original=defaultGame.draw().call;
assert.equal(original[8],21);assert.equal(original[9],27);
const proof=makeAtlas('?kez-scale-proof');
assert.equal(proof.atlas.scaleProof,true);
assert.equal(proof.atlas.previewDimensions.cellWidth,32);
assert.equal(proof.atlas.previewDimensions.cellHeight,40);
assert.equal(proof.atlas.previewDimensions.opaqueHeight,36);
// The source atlas itself must never be replaced/reinterpreted as new artwork.
assert.equal(proof.atlas.dimensions.cellWidth,21);
assert.equal(proof.atlas.dimensions.cellHeight,27);
for(const [dv,face] of [['d',1],['u',1],['s',-1],['s',1]]){
  const {call}=proof.draw({dv,f:face});
  assert.equal(call[9],36,'all four facing directions share the 36-pixel visible-height budget');
  assert(call[8]>=18&&call[8]<=29,'avoid giant player silhouettes');
  assert.equal(call[7],1-call[9],'foot baseline must stay at actor origin');
}
for(const extra of [{g:[2,0,0,0,0,0]},{tool:'sword'},{tool:'pick'}]){
  const {call}=proof.draw(extra);
  assert.equal(call[8],21,'existing equipment/tools use the unchanged native-width renderer');
  assert.equal(call[9],27,'existing equipment/tools use the unchanged native-height renderer');
}
// Asset and HUD cache versions must match; existing save IDs stay untouched.
assert(game.includes('window.MyrrenBuild=89;'));
assert(page.includes('/myrren-game.js?v=89'));
assert(page.includes('/kez-v2-atlas.js?v=13'));
assert(game.includes('atlas.scaleProof&&!o.g?.some(Boolean)'));
assert(game.includes('scaledBare?46:32'));
assert(!game.includes('kez_v3_atlas.png'),'no invisible alternative character assets');
console.log('PASS: optional 32x40 Kez scale study, directional grounding, crisp pixels, equipment fallback, and original build safety.');
