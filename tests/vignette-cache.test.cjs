'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/myrren-game.js','utf8');
const start=source.indexOf('    const gw=cv.width,gh=cv.height;');
const endLine='    ctx.fillStyle=outdoorVignette;ctx.fillRect(0,0,gw,gh);';
const end=source.indexOf(endLine,start);
assert(start>=0&&end>start,'outdoor vignette cache must exist');
const block=source.slice(start,end+endLine.length);
let allocations=0,draws=0;
const cv={width:320,height:240};
const ctx={
  createRadialGradient(){allocations++;return {addColorStop(){}}},
  fillRect(){draws++},
  fillStyle:null
};
const sandbox={cv,ctx,Math};
vm.createContext(sandbox);
vm.runInContext('let outdoorVignette=null,vignetteWidth=0,vignetteHeight=0;function render(){'+block+'}',sandbox);
vm.runInContext('render();render();',sandbox);
assert.equal(allocations,1,'repeated frames at the same size must reuse the gradient');
cv.width=480;
vm.runInContext('render();',sandbox);
assert.equal(allocations,2,'viewport width change must rebuild the gradient');
cv.height=320;
vm.runInContext('render();',sandbox);
assert.equal(allocations,3,'viewport height change must rebuild the gradient');
assert.equal(draws,4,'cached gradient must still draw every frame');
console.log('PASS: outdoor vignette cached and invalidated only on viewport resize');
