'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/myrren-v19b-atlas.js','utf8');

function loadMock(walkSize=[144,128],idleSize=[96,32]) {
  const images=[];
  const events=[];
  class MockImage {
    constructor() { images.push(this); }
    set src(value) {
      this.url=value;
      const [width,height] = value.includes('walk_') ? walkSize : idleSize;
      this.naturalWidth=width;
      this.naturalHeight=height;
      this.onload();
    }
  }
  const window={dispatchEvent(event){ events.push(event.type); }};
  const sandbox={Image:MockImage,window,Event:class {constructor(type){this.type=type;}},console,Math};
  vm.runInNewContext(source,sandbox);
  return {api:window.MyrrenV19BAtlas,images,events};
}

test('loads exact independent V19B atlases with no fallback',()=>{
  const {api,images,events}=loadMock();
  assert.equal(api.ready,true);assert.equal(api.failed,false);
  assert.deepEqual(events,['myrren-v19b-ready']);
  assert.deepEqual(images.map(x=>x.url),[
    '/assets/myrren-v19b/myrren_walk_4x6_native.png',
    '/assets/myrren-v19b/myrren_idle_4dir_native.png'
  ]);
  assert.equal(api.dimensions.footRow,30);
  assert.equal(api.dimensions.millisecondsPerFrame,110);
});

test('six-frame timing, direction row mapping, and idle remain distinct',()=>{
  const {api}=loadMock();
  const dirs=[['d',1,'front',0],['s',-1,'left',1],['s',1,'right',2],['u',1,'back',3]];
  for(const [dv,f,name,row] of dirs) {
    for(let frame=0;frame<6;frame++) {
      const p=api.pose({dv,f,moving:true},110*frame);
      assert.equal(p.frame,frame);assert.equal(p.row,row);assert.equal(p.direction,name);
    }
    assert.equal(api.pose({dv,f,moving:true},660).frame,0);
    assert.equal(api.pose({dv,f,moving:false},440).frame,0);
  }
});

test('draws one unscaled full cell at fixed integer anchor; no bounds crop',()=>{
  const {api,images}=loadMock();
  const calls=[];
  const ctx={imageSmoothingEnabled:true,save(){},restore(){},drawImage(...args){
    assert.equal(this.imageSmoothingEnabled,false);calls.push(args);
  }};
  assert.equal(api.draw(ctx,30.3,75.8,{dv:'u',f:1,moving:true},220),true);
  assert.deepEqual(calls[0],[images[0],48,96,24,32,18,46,24,32]);
  assert.equal(api.draw(ctx,30.3,75.8,{dv:'s',f:-1,moving:false},999),true);
  assert.deepEqual(calls[1],[images[1],24,0,24,32,18,46,24,32]);
});

test('invalid dimensions fail closed',()=>{
  const {api,events}=loadMock([84,162],[96,32]);
  assert.equal(api.ready,false);assert.equal(api.failed,true);
  assert(events.includes('myrren-v19b-error'));
});
