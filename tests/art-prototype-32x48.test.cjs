/* Isolated art QA: pixel-space integrity and directional gear interaction. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/art-prototype-32x48.js','utf8');
const page=fs.readFileSync('public/art-prototype-preview.html','utf8');
const live=fs.readFileSync('public/index.html','utf8');
assert(!live.includes('/art-prototype-32x48.js'),
  'experimental renderer must never be loaded by the live game');
assert(page.includes('/art-prototype-32x48.js'),
  'experimental preview must load isolated renderer');
assert(!/localStorage|sessionStorage|indexedDB|fetch\s*\(/.test(source),
  'art-only prototype must not write game state or make network calls');

const window={};
vm.runInNewContext(source,{window,Math});
const renderer=window.MyrrenArtPrototype;
assert.equal(renderer.width,32);
assert.equal(renderer.height,48);
assert.deepEqual(Array.from(renderer.materialIds),[2,6]);

function draw(options) {
  const pixels=new Map(),rects=[];
  let fillStyle='';
  const ctx={
    save(){},restore(){},
    get fillStyle(){return fillStyle;},
    set fillStyle(value){fillStyle=value;},
    set imageSmoothingEnabled(value){assert.equal(value,false);},
    fillRect(x,y,w,h) {
      assert([x,y,w,h].every(Number.isInteger),'source pixel coordinates must be integer');
      assert(w>0&&h>0,'empty pixel rectangle');
      assert(x>=-8&&x<=46&&y>=0&&y<=49,
        'unexpected native sprite offset ('+[x,y,w,h].join(',')+')');
      rects.push([x,y,w,h,fillStyle]);
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)
        pixels.set(xx+','+yy,fillStyle);
    }
  };
  assert.equal(renderer.draw(ctx,16,47,options),true);
  assert(pixels.size>120,'sprite must have useful visible area');
  return {pixels,rects};
}
const tiers=[2,6];
const directions=['front','back','left','right'];
const motions=['idle','walk','fist','sword'];
let cases=0;
for(const tier of tiers)for(const direction of directions)
for(const motion of motions)for(let frame=0;frame<4;frame++){
  const {pixels}=draw({tier,direction,motion,frame});
  const values=new Set(pixels.values());
  assert(values.size>=5,'no meaningful tier shading');
  assert(pixels.has('16,12'),'sprite head must exist');
  cases++;
}
// Mixed materials must compose without changing source gear arrays.
const mixed=[6,2,6,2,6,2],original=JSON.stringify(mixed);
draw({gear:mixed,direction:'front',motion:'walk',frame:3});
assert.equal(JSON.stringify(mixed),original,'render mutated input gear');
const bare=draw({gear:[0,0,0,0,0,0],direction:'front'});
assert(![...bare.pixels.values()].includes('#15989b'),
  'bare character has teal metal contamination');
const bronze=draw({tier:2,direction:'front'}).pixels;
const myrrenite=draw({tier:6,direction:'front'}).pixels;
assert.equal(bronze.get('12,21'),'#30232a',
  'bronze is an open-face helmet and should leave eyes visible');
assert.equal(myrrenite.get('12,21'),'#0c323c',
  'Myrrenite T-visor should fully close over the face');
const rear=draw({tier:6,direction:'back'}).pixels;
assert.notEqual(rear.get('12,21'),myrrenite.get('12,21'),
  'rear helmet must not paint a front T-shaped eye opening');
for(const direction of directions){
  const keyframes=[0,1,2,3].map(frame=>{
    const {pixels}=draw({tier:6,direction,motion:'sword',frame});
    return JSON.stringify([...pixels].sort());
  });
  assert.equal(new Set(keyframes).size,4,
    'sword must have four distinct poses for '+direction);
}
console.log('32x48 armour prototype: PASS '+cases+
  ' animation/direction/tier frame cases, six independent gear slots, isolated live loader');