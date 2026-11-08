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
const gear=[6,6,6,6,6,6],o={g:gear,dv:'d',f:1,moving:false,tool:'sword',mat:6,swingAt:-9999};
assert(renderer.readyFor(o));
function run(props={},now=0){
 const calls=[];
 const ctx={save(){},restore(){},drawImage(...a){calls.push(a)},imageSmoothingEnabled:true};
 assert.equal(renderer.draw(ctx,100,200,{...o,...props},now),true);
 return calls;
}
const grip0=renderer.gripSocket(o,0);
assert.equal(grip0.direction,'front');
assert.equal(grip0.pose,'idle');
const gripStrike=renderer.gripSocket({...o,swingAt:0},100);
assert.equal(gripStrike.pose,'attack');
assert.notEqual(gripStrike.y,grip0.y,'weapon grip must follow the animated glove');
const gripLeft=renderer.gripSocket({...o,dv:'s',f:-1},0);
const gripRight=renderer.gripSocket({...o,dv:'s',f:1},0);
assert(gripLeft.x<0&&gripRight.x>0,'left/right glove sockets must mirror');
assert.throws(()=>renderer.gripSocket(o,0,{height:0}),/Invalid/);
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
// Weapon must follow the moving hand and draw only once, with gloves over
// its hilt. Back-facing weapon must be behind the body, not over the helmet.
function weaponOrder(props,now){
 const sequence=[],ctx={save(){},restore(){},
  drawImage(img){sequence.push(img.url)}};
 const weapon=(c,socket)=>{assert(Number.isFinite(socket.x)&&Number.isFinite(socket.y));
  sequence.push('WEAPON');};
 assert(renderer.draw(ctx,100,200,{...o,...props},now,{weapon}));
 return sequence;
}
const frontStrike=weaponOrder({swingAt:0,hold:500},120);
assert.equal(frontStrike.filter(x=>x==='WEAPON').length,1);
assert(frontStrike.indexOf('WEAPON')<frontStrike.indexOf('/assets/authored-character/6-gloves.png'));
const rearStrike=weaponOrder({dv:'u',swingAt:0,hold:500},120);
assert.equal(rearStrike.filter(x=>x==='WEAPON').length,1);
assert(rearStrike.indexOf('WEAPON')<rearStrike.indexOf('/assets/authored-character/base.png'));
const idleNoHold=weaponOrder({swingAt:-9999,hold:-1},500);
assert(!idleNoHold.includes('WEAPON'),'unequipped pose must not draw an invisible sword');
const noSwordMaterial=weaponOrder({mat:undefined,swingAt:0,hold:500},120);
assert(!noSwordMaterial.includes('WEAPON'),'missing sword material must not borrow armour material');
const mixedSword=weaponOrder({mat:2,swingAt:0,hold:500},120);
assert.equal(mixedSword.filter(x=>x==='WEAPON').length,1,'different weapon and armour tiers must work');
const miningWithWeapon=weaponOrder({tool:'pickaxe',swingAt:0,hold:500},120);
assert(!miningWithWeapon.includes('WEAPON'),'pickaxe must not invoke sword drawing');
let gripPositions=[];
for(const age of [0,72,120,192,270,310]){
 renderer.draw({save(){},restore(){},drawImage(){}},100,200,
  {...o,swingAt:0,hold:500},age,
  {weapon:(_ctx,socket)=>gripPositions.push(socket.y)});
}
assert(new Set(gripPositions).size>1,'blade must travel with glove over attack');
let saved=0,restored=0;
assert.throws(()=>renderer.draw({save(){saved++},restore(){restored++},drawImage(){}},
  100,200,{...o,swingAt:0},120,{weapon:()=>{throw Error('sprite callback failure')}}),
  /sprite callback failure/);
assert.equal(saved,restored,'canvas state must recover from weapon draw failure');
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
