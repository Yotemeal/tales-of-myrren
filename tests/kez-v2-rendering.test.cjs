const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path='public/kez-v2-atlas.js';
const source=fs.readFileSync(path,'utf8');
const armourSource=fs.readFileSync('public/kez-v2-equipment.js','utf8');
const game=fs.readFileSync('public/myrren-game.js','utf8');
const page=fs.readFileSync('public/index.html','utf8');

const events=[];
const window={dispatchEvent:event=>events.push(event.type)};
const imageData=new Uint8ClampedArray(84*162*4);
for(let i=3;i<imageData.length;i+=4)imageData[i]=255;
const document={createElement(type){
  assert.equal(type,'canvas');
  return {width:84,height:162,getContext(){return{
    imageSmoothingEnabled:false,
    drawImage(){},
    getImageData(){return {data:imageData}}
  }}};
}};
class Image{
  constructor(){this.naturalWidth=84;this.naturalHeight=162}
  set src(s){this.url=s;this.onload?.()}
}
class Event{constructor(type){this.type=type}}
const context={window,document,Image,Event,console,Uint8ClampedArray,Math};
vm.createContext(context);
vm.runInContext(source,context);
vm.runInContext(armourSource,context);
const atlas=window.MyrrenKezV2Atlas,equipment=window.MyrrenKezV2Equipment;
assert(atlas.ready);
assert.equal(events.filter(x=>x==='myrren-kez-v2-ready').length,1);
assert.equal(atlas.dimensions.cellWidth,21);
assert.equal(atlas.dimensions.cellHeight,27);
assert.equal(atlas.dimensions.scale,1);

function draw(o,now=0){
  const calls=[];
  const ctx={
    save(){},restore(){},translate(){},scale(){},
    drawImage(...args){calls.push(args)},
    imageSmoothingEnabled:true
  };
  assert.equal(atlas.draw(ctx,20,35,{dv:'d',f:1,moving:false,tool:'fist',...o},now),true);
  assert.equal(calls.length,1);
  return calls[0];
}
for(const [dv,f,row] of [['d',1,1],['s',-1,3],['s',1,4],['u',1,2]]){
  const idle=draw({dv,f},0),run=draw({dv,f,moving:true},130);
  assert.equal(idle[2],row*27,'idle must retain facing');
  assert.equal(run[2],row*27,'run must retain facing');
  assert.equal(idle[7],21,'native width must not be downsampled');
  assert.equal(idle[8],27,'native height must not be downsampled');
}
assert.equal(draw({dv:'s',f:1,tool:'sword',swingAt:0},120)[2],135);
assert.equal(draw({dv:'u',f:1,tool:'sword',swingAt:0},120)[2],54,'rear attacks must not snap sideways');
assert.equal(draw({dv:'d',f:1,animateIdle:true},900)[2],0,'portrait idle uses authored idle row');

assert.deepEqual(Array.from(equipment.order),[2,3,4,5,7,6,8]);
const original=[2,3,4,5,7,8],before=JSON.stringify(original);
assert.equal(JSON.stringify(equipment.clean(original)),JSON.stringify(original));
assert.equal(JSON.stringify(original),before,'gear must not be mutated');
assert.equal(JSON.stringify(equipment.clean([100,-3,null,'3',2,2])),JSON.stringify([0,0,0,0,2,2]));
for(const tier of equipment.order){
  let rects=0;
  const ctx={fillRect(x,y,w,h){assert([x,y,w,h].every(Number.isInteger));assert(w>0&&h>0);rects++},fillStyle:''};
  const pose={dv:'d',f:1,now:0,moving:false,g:[tier,tier,tier,tier,tier,tier]};
  equipment.draw(ctx,25,35,pose,'under');
  equipment.draw(ctx,25,35,pose,'over');
  assert(rects>20,'every metal must draw complete worn armour');
}
// The compact base character has visible eyes around y=-13. Chest and leg
// layers must stay below its face, including during walking bob.
for(const mat of equipment.order)for(const dv of ['d','s','u'])for(const now of [0,130,260,390]){
  const pixels=[];
  const c={fillStyle:'',fillRect(x,y,w,h){
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.push({x:xx,y:yy});
  }};
  const o={dv,f:1,moving:now>0,now,g:[0,mat,0,0,0,0]};
  equipment.draw(c,0,0,o,'over');
  assert(pixels.length>0);
  assert(pixels.every(({y})=>y>=-11),
    'chest/pauldrons must not cover eyes or chin');
}
for(const mat of equipment.order.filter(mat=>mat!==6)){
  // Only Myrrenite's newly approved T-visor deliberately covers the eyes.
  const eyePixels=new Set();
  const c={fillStyle:'',fillRect(x,y,w,h){
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)eyePixels.add(xx+','+yy);
  }};
  equipment.draw(c,0,0,{dv:'d',f:1,g:[mat,0,0,0,0,0],now:0},'over');
  for(const y of [-14,-13,-12])for(const x of [-3,-2,0,1,2]){
    assert(!eyePixels.has(x+','+y),'helmet must not obscure central eye region');
  }
}
// Approved Myrrenite helmet is unique: full teal-and-gold faceplate, a
// near-black horizontal eye slit and a descending T visor. It deliberately
// conceals Kez's face (unlike the six earlier helmets). Test authored pixels.
function helmPixels(dv='d',f=1,dye=null,moving=false,now=0){
  const pixels=new Map();
  const ctx={fillStyle:'',fillRect(x,y,w,h){
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)
      pixels.set(xx+','+yy,this.fillStyle);
  }};
  equipment.draw(ctx,0,0,{dv,f,dye,moving,now,g:[6,0,0,0,0,0]},'over');
  return pixels;
}
const myrrenFront=helmPixels();
assert.equal(myrrenFront.get('0,-26'),'#efc653','helmet crest must be approved gold');
assert.equal(myrrenFront.get('0,-19'),'#fff3b6','brow highlight must be gold');
assert.equal(myrrenFront.get('0,-17'),'#060f18','dark horizontal eye opening required');
assert.equal(myrrenFront.get('-1,-13'),'#060f18','dark vertical T visor required');
assert.equal(myrrenFront.get('-4,-13'),equipment.palette[6][1],
  'cheek guards must remain teal');
const myrrenRear=helmPixels('u');
assert.equal(myrrenRear.get('0,-17'),'#efc653',
  'rear helmet must have the gold spine, not front-facing black eyes');
const myrrenRight=helmPixels('s',1),myrrenLeft=helmPixels('s',-1);
for(const [key,color] of myrrenRight){
  const [x,y]=key.split(',').map(Number);
  assert.equal(myrrenLeft.get((-x)+','+y),color,
    'side helmet must mirror its pixels without changing direction');
}
for(const dye of [0,1,2,3]){
  const p=helmPixels('d',1,dye);
  assert.equal(p.get('0,-26'),'#efc653',
    'cosmetic dye must not change the approved golden Myrrenite crest');
  assert.equal(p.get('0,-17'),'#060f18',
    'cosmetic dye must not change the visor opening');
}
for(const now of [0,130,260,390]){
  const p=helmPixels('d',1,null,now!==0,now);
  assert(p.size>70,'helmet must remain visible on every walking frame');
}
const shieldOnly={dv:'s',f:1,g:[0,0,0,0,8,0]};
let under=0,over=0;
equipment.draw({fillStyle:'',fillRect(){under++}},25,35,shieldOnly,'under');
equipment.draw({fillStyle:'',fillRect(){over++}},25,35,shieldOnly,'over');
assert(under>0&&over===0,'side shield should be behind character');


// Layering and silhouette rules that would otherwise be easy to regress on
// a 21x27 character. All test coordinates are in unscaled source pixels.
for(const mat of equipment.order){
  const painted=new Set();
  const ctx={fillStyle:'',fillRect(x,y,w,h){
    assert(Number.isInteger(x)&&Number.isInteger(y)&&w>0&&h>0);
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
      assert(xx>=-10&&xx<=10&&yy>=-27&&yy<=1,
        'worn armour must fit the native 21×27 silhouette');
      painted.add(xx+','+yy);
    }
  }};
  equipment.draw(ctx,0,0,{dv:'d',f:1,g:[mat,0,0,0,0,0],now:0},'over');
  assert(painted.size>0);
  if(mat===6){
    assert(painted.has('0,-17'),
      'Myrrenite alone must use its approved opaque black T visor');
  }else if(mat===7||mat===8){
    // Other closed helmets continue to preserve their previous eye clearance.
    assert(!painted.has('-3,-18')&&!painted.has('2,-18'),
      'full-face masks must leave clear sight lines');
  }else assert(!painted.has('0,-18'),
    'open-face helmets must not paint across Kez V2 eyes');
}
for(const dv of ['s','u','d']){
  let behind=0,front=0;
  const o={dv,f:1,g:[0,0,0,0,6,0],now:0};
  const ctx={fillStyle:'',fillRect(){behind++}};
  equipment.draw(ctx,0,0,o,'under');
  const ctx2={fillStyle:'',fillRect(){front++}};
  equipment.draw(ctx2,0,0,o,'over');
  assert.equal(behind>0,dv==='s','side shield belongs behind character');
  assert.equal(front>0,dv!=='s','front/rear shield must remain on visible offhand');
}
// Equipment hands must remain opposite each other. The old game could draw
// shield and sword in the same hand, including when facing left/back.
for(const [dv,f,swordX,phase] of [
  ['d',1,5,'over'],['s',1,6,'under'],['s',-1,-6,'under'],['u',1,-8,'over']
]){
  const pixels=[];
  const ctx={fillStyle:'',fillRect(x,y,w,h){for(let xx=x;xx<x+w;xx++)pixels.push(xx)}};
  equipment.draw(ctx,0,0,{dv,f,now:0,g:[0,0,0,0,4,0]},phase);
  assert(pixels.length>0,'visible shield required in '+dv+' direction');
  assert(pixels.every(xx=>swordX>=0?xx<swordX:xx>swordX),
    'shield must stay in the opposite hand from the sword: '+dv+' f='+f);
}
assert.equal(equipment.palette[7][1],'#8325be');
assert.equal(equipment.palette[6][3],'#efc653');
assert.equal(equipment.palette[8][2],'#ffffff');
for(const mat of [4,5,7,6,8])for(const dye of [0,1,2,3]){
  const p=equipment.colorsFor(mat,dye);
  assert.equal(p.length,4);
  assert.notEqual(p[3],equipment.palette[mat][3],'high-tier dye changes enamel accent');
  assert.equal(p[0],equipment.palette[mat][0],'dye preserves the metal outline');
  assert.equal(p,equipment.colorsFor(mat,dye),'dye palette must be cached for mobile frames');
}
assert.strictEqual(equipment.colorsFor(3,1),equipment.palette[3],'low-tier armour keeps original colours');
assert.strictEqual(equipment.colorsFor(8,null),equipment.palette[8],'undyed Starsteel remains white and gold');
assert(game.includes('g:gearArr(),dye:save.dye,now'),'equipment portrait must preserve dyes');

const drawKez=game.slice(game.indexOf('function drawKezV2('),game.indexOf('function drawPerson('));
assert(drawKez.indexOf("if(direction==='back'){paintHeld();paintPunch()}")<
       drawKez.indexOf('atlas.draw(ctx,x,y,state,now)'),
       'rear-facing sword must be painted before the body');
assert(drawKez.includes("direction==='back'?-8"),'rear sword must clear torso');
assert(drawKez.indexOf('atlas.draw(ctx,x,y,state,now)')<
       drawKez.indexOf("if(direction!=='back'){paintHeld();paintPunch()}"),
       'front and side swords must be held over the body');
assert(drawKez.includes("const handColor=glove&&gear?.colorsFor?.(glove,o.dye)?.[2]"),
       'sword grip should use equipped dyed glove colour, not bare skin');
assert(game.includes('if(!o.apron){drawKezV2(x,y,o,now);return;}'));
assert(!game.includes("get('kezV2')"),'Kez V2 must not be opt-in');
assert(!game.includes('drawLightweightKez'),'preview character entry must be removed');
assert(!game.includes('function drawApprovedPlayer('),'do not ship a dormant old player renderer');
assert(!game.includes('MYRREN_V31'),'do not create hidden old character sprite loading paths');
assert(game.includes('if(!canvas.isConnected)return;'),'portrait animations must stop when detached');
assert(drawKez.includes('drawTool(o.tool,o.mat,hx,hy,facing,heldAngle,.6)'),
       'weapons must retain the small Kez V2 grip scale');
const scripts=[...page.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
assert(scripts.findIndex(s=>s.includes('kez-v2-atlas'))<scripts.findIndex(s=>s.includes('kez-v2-equipment')));
assert(scripts.findIndex(s=>s.includes('kez-v2-equipment'))<scripts.findIndex(s=>s.includes('myrren-game')));
console.log('PASS: Kez V2 native dimensions, four directional idle/run poses, attacks, seven-metal six-slot overlays, preview cleanup, and script registration.');
