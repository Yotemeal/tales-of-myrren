'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../public/myrren-game.js'),'utf8');
const start=source.indexOf('const GAMEPLAY_SCALE=');
const end=source.indexOf('function frame(now)',start);
assert(start>=0&&end>start);
const cv={parentElement:{},style:{}};
const window={};
const resize=vm.runInNewContext(source.slice(start,end)+'resizeGameplayCanvas',{cv,window});
for(const dpr of [1,1.25,2,2.625,3]){
  window.devicePixelRatio=dpr;
  for(const [width,height] of [[852,393],[393,852],[1281,721]]){
    Object.assign(cv.parentElement,{clientWidth:width,clientHeight:height});
    resize();
    for(const [axis,extent] of [['width',width],['height',height]]){
      const display=parseFloat(cv.style[axis]);
      const scale=Math.round(2*dpr)/dpr;
      assert.equal(cv[axis],Math.ceil(extent/scale));
      assert.equal(display,cv[axis]*scale);
      assert(display>=extent&&display<extent+scale);
    }
  }
}
console.log('PASS: fixed scale, whole device pixels and viewport coverage');
