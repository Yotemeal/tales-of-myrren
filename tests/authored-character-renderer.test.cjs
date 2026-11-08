const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const instances=[];
class Image{
 constructor(){this.naturalWidth=128;this.naturalHeight=576;instances.push(this)}
 set src(s){this.url=s;this.onload?.()}
}
const window={};
vm.runInNewContext(fs.readFileSync('public/authored-character-renderer.js','utf8'),{window,Image,Math,Set,Map,Error,Number,Array,Object});
const API=window.MyrrenAuthoredCharacter;
assert.deepEqual(Array.from(API.order),[2,3,4,5,7,6,8]);
const renderer=API.create('/assets/authored-character/');
assert.equal(instances.length,43);
assert.equal(renderer.dimensions.width,32);
assert.equal(renderer.dimensions.height,48);
assert.equal(renderer.dimensions.rows,12);
const gear=[6,6,6,6,6,6],o={g:gear,dv:'d',f:1,moving:false,tool:'sword',swingAt:-9999};
assert(renderer.readyFor(o));
function run(props={},now=0){
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...a){calls.push(a)},imageSmoothingEnabled:true};
 assert.equal(renderer.draw(ctx,100,200,{...o,...props},now),true);
 return calls;
}
const idle=run();
assert.equal(idle.length,7);
assert.equal(idle[0][1],0);
assert.equal(idle[0][2],0);
assert.equal(idle[0][7],24);
assert.equal(idle[0][8],36);
assert.equal(idle[0][5],88);
assert.equal(idle[0][6],164);
assert.equal(idle[6][0].url,'/assets/authored-character/6-shield.png');
const left=run({dv:'s',f:-1});
assert.equal(left[0][0].url,'/assets/authored-character/6-shield.png');
assert.equal(left[0][2],6*48);
const right=run({dv:'s',f:1});
assert.equal(right[0][2],9*48);
const back=run({dv:'u'});
assert.equal(back[0][2],3*48);
assert.equal(back.at(-1)[0].url,'/assets/authored-character/6-shield.png',
 'rear-facing shield must remain visible on the back');
const walk=run({moving:true},130);
assert.equal(walk[0][2],48);
assert.equal(walk[0][1],32);
const attack=run({swingAt:0},160);
assert.equal(attack[0][2],96);
assert.equal(attack[0][1],64);
const mining=run({tool:'pickaxe',swingAt:0,moving:true},160);
assert.equal(mining[0][2],48,'mining cannot borrow sword attack body frames');
const punching=run({tool:'fist',swingAt:0},160);
assert.equal(punching[0][2],0,'unarmed combat cannot borrow sword pose');
assert.equal(run({g:[0,0,0,0,0,0]}).length,1);
const empty=instances.find(i=>i.url.endsWith('6-head.png'));
empty.naturalWidth=12;
assert.equal(renderer.readyFor(o),false,'invalid authored atlas must fail closed');
assert.equal(renderer.draw({save(){},restore(){},drawImage(){}},0,0,o,0),false);
empty.naturalWidth=128;
assert(renderer.readyFor(o));
const unrelated=instances.find(i=>i.url.endsWith('2-head.png'));
unrelated.naturalWidth=0;
assert(renderer.readyFor(o),'missing other metal tiers must not block one authored set');
assert.equal(renderer.draw({save(){},restore(){},drawImage(){}},0,0,{...o,g:[2,6,6,6,6,6]},0),false,
 'an equipped incomplete metal tier must fail closed');
assert.throws(()=>renderer.draw({save(){},restore(){},drawImage(){}},0,0,o,0,{width:-1}),/Invalid/);
assert.throws(()=>API.create('https://outside.example/'),/local assets/);
console.log('PASS: authored 32x48 layers, 4 directions, walk/attack, shield depth, ID stability, invalid atlas gate');
