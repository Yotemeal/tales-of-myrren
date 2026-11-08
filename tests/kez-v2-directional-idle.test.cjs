const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Canvas/image stubs let us check the actual sprite-sheet source cells with
// Node alone. Every pixel is opaque so each atlas cell keeps full 21x27 bounds.
const draws=[];
class StubCanvas {
  constructor(){this.width=1;this.height=1}
  getContext(){
    return {
      drawImage(...args){draws.push(args)},
      getImageData(_x,_y,width,height){
        const data=new Uint8ClampedArray(width*height*4);
        for(let i=3;i<data.length;i+=4)data[i]=255;
        return {data};
      },
      putImageData(){},
      save(){},restore(){},translate(){},scale(){},
      set imageSmoothingEnabled(_v){}
    };
  }
}
class StubImage {
  constructor(){this.naturalWidth=84;this.naturalHeight=162}
  set src(value){this._src=value;this.onload?.()}
}
const sandbox={Image:StubImage,document:{createElement:()=>new StubCanvas()},window:{},Uint8ClampedArray};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('public/kez-v2-atlas.js','utf8'),sandbox,{filename:'public/kez-v2-atlas.js'});
const hero=sandbox.window.MyrrenKezV2Atlas;
assert(hero.ready,'valid Kez V2 atlas loads');

function sprite(o,now){
  draws.length=0;
  const ctx={
    drawImage(...args){draws.push(args)},
    save(){},restore(){},translate(){},scale(){},
    set imageSmoothingEnabled(_v){}
  };
  assert.equal(hero.draw(ctx,100,100,o,now),true);
  const sources=draws.filter(args=>args.length===9&&args[0] instanceof StubImage);
  assert.equal(sources.length,1,'one original sprite cell per draw');
  const [,_imageX,imageY,sw,sh]=sources[0];
  assert.equal(sw,21);
  assert.equal(sh,27);
  return [Math.floor(imageY/27),Math.floor(_imageX/21)];
}
const pose=(dv,f,moving)=>({dv,f,moving,tool:'fist'});
assert.deepEqual(sprite(pose('d',1,false),0),[0,0],'front standing uses approved idle');
assert.deepEqual(sprite(pose('d',1,false),440),[0,1],'front breathing still loops');
assert.deepEqual(sprite(pose('u',1,false),440),[2,0],'stopping north must face north');
assert.deepEqual(sprite(pose('s',-1,false),440),[3,0],'stopping left must face left');
assert.deepEqual(sprite(pose('s',1,false),440),[4,0],'stopping right must face right');
assert.deepEqual(sprite(pose('s',-1,false),880),[3,0],'left standing must not march in place');
assert.deepEqual(sprite(pose('s',1,false),880),[4,0],'right standing must not march in place');
assert.deepEqual(sprite(pose('d',1,true),260),[1,2],'front walking cycles normally');
assert.deepEqual(sprite(pose('u',1,true),260),[2,2],'rear walking cycles normally');
assert.deepEqual(sprite(pose('s',-1,true),260),[3,2],'left walking cycles normally');
assert.deepEqual(sprite(pose('s',1,true),260),[4,2],'right walking cycles normally');
assert.deepEqual(sprite({dv:'s',f:1,moving:false,animateIdle:true},440),[0,1],'Equipment portrait keeps breathing');
assert.deepEqual(sprite({...pose('s',1,false),tool:'sword',swingAt:0},110),[5,1],'right sword attack remains intact');
assert.deepEqual(sprite({...pose('s',-1,false),tool:'sword',swingAt:0},110),[5,1],'left sword attack remains intact');
assert.deepEqual(sprite({...pose('u',1,false),tool:'sword',swingAt:0},110),[2,0],'rear sword swing must not face sideways');
assert.deepEqual(sprite({...pose('d',1,false),tool:'sword',swingAt:0},110),[0,0],'front sword swing must not face sideways');
console.log('PASS: Kez V2 directional standing, animated portrait, 4-way walking and sword-swing sprite selection.');
