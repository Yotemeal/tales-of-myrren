/* Native Kez V2 asset-atlas mapping contract, no Canvas/native dependencies. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const gear=require('../public/native-gear-layers.js');
const path='public/bronze-sprite-lab.js';
const entry=fs.readFileSync('public/bronze-sprite-lab.html','utf8');
const preview=fs.readFileSync(path,'utf8');
const main=fs.readFileSync('public/index.html','utf8');
assert(!main.includes('native-gear-layers.js'),'Prototype must not load in production');
assert(!main.includes('bronze-sprite-lab'),'Lab must remain separated from live game');
assert(entry.includes('/native-gear-layers.js'),'Preview must load native layer contract');
assert(entry.indexOf('/native-gear-layers.js')<entry.indexOf('/bronze-sprite-lab.js'));
assert(!/localStorage|indexedDB|sessionStorage|document\.cookie|fetch\s*\(/.test(preview));
assert.deepEqual(gear.slots,['shield','helmet','body','legs','boots','gloves']);
assert.equal(gear.atlasWidth,84);assert.equal(gear.atlasHeight,972);
assert.equal(gear.width,21);assert.equal(gear.height,27);
let cells=0;
for(let s=0;s<6;s++)for(let r=0;r<6;r++)for(let f=0;f<4;f++){
 const p=gear.cell(s,r,f);
 assert.equal(p.sx,f*21);
 assert.equal(p.sy,(s*6+r)*27);
 assert(p.sx>=0&&p.sx+p.sw<=84);
 assert(p.sy>=0&&p.sy+p.sh<=972);
 cells++;
}
assert.throws(()=>gear.cell('not-a-slot',1,2),RangeError);
assert.throws(()=>gear.cell('helmet',6,1),RangeError);
assert.throws(()=>gear.cell('helmet',0,-1),RangeError);
function pose(dv,f,moving,now,extras={}) {
 return gear.pose({dv,f,moving,swingAt:-99999,...extras},now);
}
assert.equal(pose('d',1,false,0).row,0);
assert.equal(pose('d',1,false,440).frame,1);
assert.equal(pose('d',1,false,1320).frame,3);
assert.equal(pose('d',1,false,1760).frame,0);
for(const [dv,f,row] of [['u',1,2],['s',-1,3],['s',1,4]]){
 const a=pose(dv,f,false,1320);
 assert.equal(a.row,row);
 assert.equal(a.frame,0,'Stationary directional equipment must not walk');
 assert.equal(a.usesSynthesizedIdle,true);
}
assert.equal(pose('d',1,true,390).frame,3);
assert.equal(pose('s',-1,true,260).row,3);
assert.equal(pose('s',1,true,260).row,4);
assert.equal(pose('u',1,true,130).row,2);
const hit=pose('s',-1,true,1100,{tool:'sword',swingAt:1000});
assert.equal(hit.swordHit,true);assert.equal(hit.frame,0);
const b=gear.placement({left:3,right:17,top:2,bottom:26});
assert.equal(b.dx,-10);assert.equal(b.dy,-26);
assert.throws(()=>gear.placement({left:0,right:25,top:0,bottom:26}),RangeError);
function render(state,pass,visible){
 const calls=[],ctx={save(){},restore(){},set imageSmoothingEnabled(v){assert.equal(v,false)},
 drawImage(...args){calls.push(args)}};
 const image={};
 const result=gear.draw(ctx,image,{pose:state,anchor:b,pass,visible});
 assert.equal(result,calls.length);
 for(const [im,sx,sy,sw,sh,dx,dy,dw,dh] of calls){
  assert.equal(im,image);assert.equal(sw,21);assert.equal(sh,27);
  assert.equal(dx,-10);assert.equal(dy,-26);assert.equal(dw,21);assert.equal(dh,27);
 }
 return calls;
}
let left=pose('s',-1,false,900);
assert.equal(render(left,'under').length,1,'Side shields belong behind Kez');
assert.equal(render(left,'over').length,5);
const front=pose('d',1,false,0);
assert.equal(render(front,'under').length,0);
assert.equal(render(front,'over').length,6);
assert.equal(render(front,'over',{helmet:false,shield:false}).length,4);
const back=pose('u',1,false,0);
assert.equal(render(back,'over').length,6);
assert.equal(gear.draw(null,null,{}),false);
console.log('PASS native Bronze atlas: '+cells+' cells, correct live Kez idle/walk/sword pose selection, six independent slots and shield depth');
