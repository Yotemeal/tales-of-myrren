'use strict';
// Pixel-aware regression: a solid-colour mock atlas hides clipped/unchanging
// idle poses. These fixtures deliberately have transparent shoulder margins.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const W=21,H=27,AW=84,AH=162;
const atlasPixels=new Uint8ClampedArray(AW*AH*4);
function pixel(a,w,x,y,r=100,g=160,b=180){const i=(y*w+x)*4;a[i]=r;a[i+1]=g;a[i+2]=b;a[i+3]=255}
for(let row=0;row<6;row++)for(let frame=0;frame<4;frame++){
  const x0=frame*W,y0=row*H;
  for(let y=10;y<=16;y++)for(let x=5;x<=15;x++)pixel(atlasPixels,AW,x0+x,y0+y);
  for(let y=23;y<=26;y++)for(let x=8;x<=12;x++)pixel(atlasPixels,AW,x0+x,y0+y);
  for(let y=3;y<=8;y++)for(let x=8;x<=12;x++)pixel(atlasPixels,AW,x0+x,y0+y);
}
const sheets=[];
function canvas(){
  const c={width:0,height:0,pixels:null};
  const ctx={
    drawImage(image,sx=0,sy=0,sw=image.naturalWidth||image.width,sh=image.naturalHeight||image.height,dx=0,dy=0,dw=sw,dh=sh){
      const source=image.pixels||atlasPixels,sourceWidth=image.naturalWidth||image.width||AW;
      if(!c.pixels)c.pixels=new Uint8ClampedArray(c.width*c.height*4);
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        const si=((sy+y)*sourceWidth+sx+x)*4,di=((dy+y)*c.width+dx+x)*4;
        c.pixels.set(source.subarray(si,si+4),di);
      }
    },
    getImageData(x,y,w,h){
      const data=new Uint8ClampedArray(w*h*4);
      for(let py=0;py<h;py++)for(let px=0;px<w;px++){
        const src=((y+py)*c.width+x+px)*4,dst=(py*w+px)*4;
        data.set(c.pixels.subarray(src,src+4),dst);
      }
      return {data};
    },
    createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},
    putImageData(frame,dx,dy){
      if(!c.pixels)c.pixels=new Uint8ClampedArray(c.width*c.height*4);
      for(let py=0;py<H;py++)for(let px=0;px<W;px++){
        const src=(py*W+px)*4,dst=((dy+py)*c.width+dx+px)*4;
        c.pixels.set(frame.data.subarray(src,src+4),dst);
      }
    }
  };
  c.getContext=()=>ctx;sheets.push(c);return c;
}
class Image{
  constructor(){this.naturalWidth=AW;this.naturalHeight=AH;this.pixels=atlasPixels}
  set src(v){this.onload()}
}
const window={dispatchEvent(){}},document={createElement:()=>canvas()};
vm.runInNewContext(fs.readFileSync('public/kez-v2-atlas.js','utf8'),
  {window,document,Image,Event:class{},Uint8ClampedArray,console,Math});
const renderer=window.MyrrenKezV2Atlas;
assert(renderer.ready);
function draw(dv,f,t){
  const calls=[];
  const ctx={save(){},restore(){},translate(){},drawImage(...args){calls.push(args)}};
  renderer.draw(ctx,40,60,{dv,f,moving:false,tool:'fist'},t);
  assert.equal(calls.length,1);
  return calls[0];
}
for(const [dv,f] of [['u',1],['s',-1],['s',1]]){
  const frames=[0,650,1300,1950].map(t=>draw(dv,f,t));
  const sheet=frames[0][0];
  assert.equal(sheet.width,84);
  assert.equal(sheet.height,27);
  assert.equal(frames[0][3],13,'union crop must include expanded shoulders');
  assert.equal(frames[0][7],13,'native draw width must include breathing pixels');
  assert.equal(frames[0][8],24,'ground anchor height stays stable');
  for(const frame of frames){
    assert.equal(frame[3],frames[0][3],'idle width must not jump');
    assert.equal(frame[4],frames[0][4],'idle height must not jump');
    assert.equal(frame[5],frames[0][5],'idle x anchor must not jump');
    assert.equal(frame[6],frames[0][6],'idle y anchor must not jump');
  }
  const rgba=(pose,x,y)=>sheet.pixels[((y*84)+(pose*21+x))*4+3];
  assert.equal(rgba(0,4,12),0,'neutral pose must not grow left shoulder');
  assert.equal(rgba(1,16,12),255,'breathing pose must expand right shoulder');
  assert.equal(rgba(2,4,12),0,'return to neutral');
  assert.equal(rgba(3,4,12),255,'breathing pose must expand left shoulder');
  for(let pose=0;pose<4;pose++)for(let y=23;y<=26;y++)
    assert.equal(rgba(pose,10,y),255,'feet must stay planted in every idle pose');
}
console.log('PASS: real idle pixel changes visible, four directions anchored, feet fixed');
