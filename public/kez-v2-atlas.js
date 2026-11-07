// Kez V2 sprite atlas — transparent, native-resolution pixel frames.
// Each glyph is one deliberate pixel; animation is frame-based, not scaled rectangles.
(function(){
'use strict';
const pal={'.':null,'K':'#292422','H':'#493732','h':'#69504a','S':'#edbc94','s':'#c98e70','E':'#2d2626','T':'#6d4e3b','t':'#916b4c','P':'#39322f','p':'#514640','B':'#302925','b':'#493a32'};
const front=[
'................',
'......KKK.......',
'....KKHHHKK.....',
'...KHHHHHHHK....',
'..KHHHhHHHHHK...',
'..KHHHHHHHHHK...',
'.KHHHHHHHHHHHK..',
'.KHHHHHHHHHHHK..',
'.KHHHHHHHHHHHK..',
'.KHSSSSSSSSHHK..',
'.KSSSSSSSSSSSK..',
'.KSSSESSSESSSK..',
'..KSSSSSSSSSK...',
'..KSSSSssSSK....',
'...KSSSSSSK.....',
'....KSSSSK......',
'...KTTTTTTK.....',
'..KTTtTTtTTK....',
'.KSTTTTTTTTSK...',
'.KSTTTTTTTTSK...',
'..KTTTTTTTTK....',
'...KPPPPPPK.....',
'...KPPKKPPK.....',
'...KPP..PPK.....',
'...KBB..BBK.....',
'...KBB..BBK.....',
'....KK..KK......',
'................'];
const back=front.map((r,i)=>i>=9&&i<=15?r.replace(/[SsE]/g,'H').replace(/H/g,'H'):r);
const side=front.map((r,i)=>{if(i<9)return r;if(i<16)return '....KHHSSSSSK...'.padEnd(16,'.');return r});
const build=(rows,walk,phase)=>{
 const a=rows.map(r=>r.split(''));
 while(a.length<28)a.push(Array(16).fill('.'));
 if(walk){
  const kick=phase===1?1:phase===3?-1:0;
  for(let y=22;y<=26;y++){
    for(let x=2;x<14;x++)if('KBPp'.includes(a[y][x]))a[y][x]='.';
  }
  const left=4+kick,right=10+kick;
  for(let y=22;y<=25;y++){a[y][left]='K';a[y][left+1]=y>=24?'B':'P';a[y][right]='K';a[y][right+1]=y>=24?'B':'P'}
  a[26][left]='K';a[26][left+1]='K';a[26][right]='K';a[26][right+1]='K';
 }
 return a.map(r=>r.join(''));
};
const atlas=document.createElement('canvas');atlas.width=16*4;atlas.height=28*3;
const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;
const directions=[front,back,side];
directions.forEach((rows,dy)=>{for(let phase=0;phase<4;phase++){
 const frame=build(rows,phase!==0,phase);
 for(let y=0;y<28;y++)for(let x=0;x<16;x++){const color=pal[frame[y][x]];if(color){c.fillStyle=color;c.fillRect(phase*16+x,dy*28+y,1,1)}}
}});
window.MyrrenKezV2Atlas={
 draw(ctx,x,y,o,now){
  const dir=o.dv==='u'?1:o.dv==='s'?2:0;
  const phase=o.moving?1+Math.floor(now/130)%3:0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x),Math.round(y));
  if(o.dv==='s'&&(o.f||1)<0)ctx.scale(-1,1);
  ctx.drawImage(atlas,phase*16,dir*28,16,28,-7,-23,14,23);
  ctx.restore();
 }
};
})();
