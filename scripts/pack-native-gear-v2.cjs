/* Tales of Myrren — hand-pixelled V2 chest and shield overlays.
 * Four facings, seven saved material IDs and four cosmetic dyes, all at
 * native 16x16 cells. Full alpha; no downsampling of concept illustrations.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const ORDER=[2,3,4,5,7,6,8];
const METALS={
  2:['#56301d','#aa663b','#f1b37c','#d99556'],
  3:['#343342','#9293a5','#e0e1ed','#b6b4ca'],
  4:['#29394f','#b2c8e6','#f6f9ff','#7cabe0'],
  5:['#261c35','#60496f','#aa8bb4','#81598d'],
  7:['#250f39','#8325be','#e36bff','#c346ec'],
  6:['#0a3540','#198f8d','#91e4db','#efc653'],
  8:['#363d51','#d9e2f2','#ffffff','#efb63a']
};
const DYES=['#c7414e','#39a86c','#6966ba','#e5ba52'];
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const blend=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('');
const palette=(mat,dye)=>{
  const p=METALS[mat].slice();
  if(dye>=0&&mat>=4){p[1]=blend(p[1],DYES[dye],.3);p[3]=blend(p[3],DYES[dye],.65)}
  return p;
};
const SIZE=16,canvas=createCanvas(8*SIZE,35*SIZE),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
function cell(ox,oy,mat,part,dir,dye){
  const p=palette(mat,dye),color={K:p[0],M:p[1],H:p[2],A:p[3],S:'#fff6d6'};
  const mirror=dir===1;
  const pix=(x,y,k)=>{
    if(x<0||x>=SIZE||y<0||y>=SIZE)return;
    ctx.fillStyle=color[k]||k;
    ctx.fillRect(ox+(mirror?15-x:x),oy+y,1,1);
  };
  const box=(x,y,w,h,k)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pix(xx,yy,k)};
  const isSide=dir===1||dir===2,back=dir===3;
  if(part===0){
    // The transparent top keeps the canonical hair and eyes unobstructed.
    // Body lives only at y=4..13 (character y=-11..-2).
    const left=isSide?5:4,right=isSide?11:12;
    box(left,5,right-left,8,'K');box(left+1,5,right-left-2,7,'M');
    box(left+1,5,right-left-2,1,'H');
    box(left+1,11,right-left-2,1,'K');
    const shoulders=mat===2?1:mat===3?2:mat===4?3:mat===5?3:mat===7?4:mat===6?3:4;
    box(Math.max(1,left-shoulders),5,shoulders+1,3,'K');
    box(Math.max(1,left-shoulders)+1,5,Math.max(1,shoulders),2,'M');
    box(right-1,5,shoulders+1,3,'K');
    box(right,5,Math.min(shoulders,15-right),2,'M');
    if(mat===2){ // bronze: leather brigandine, low shoulder caps
      box(6,7,1,4,'K');box(9,7,1,4,'K');
      box(7,7,2,1,'A');pix(7,10,'H');pix(8,10,'H');
    }else if(mat===3){ // iron: riveted plate strips
      box(5,8,7,1,'K');box(5,10,7,1,'H');
      pix(6,7,'A');pix(10,7,'A');pix(6,11,'H');pix(10,11,'H');
    }else if(mat===4){ // steel: polished breast ridge, swept shoulders
      box(6,6,4,1,'H');box(7,7,2,5,'H');
      pix(5,8,'A');pix(10,8,'A');pix(3,5,'H');pix(12,5,'H');
    }else if(mat===5){ // black iron: massive angular pauldrons and riveted belt
      pix(1,4,'K');pix(14,4,'K');pix(1,5,'K');pix(14,5,'K');box(5,6,6,2,'K');
      box(6,7,4,1,'A');box(5,10,7,2,'K');pix(8,9,'H');
    }else if(mat===7){ // obsidianite: thorned collar and molten gem
      pix(1,3,'K');pix(14,3,'K');pix(1,4,'K');pix(14,4,'K');pix(2,4,'H');pix(13,4,'H');
      box(7,6,2,5,'K');box(7,7,2,2,'A');
      pix(6,10,'H');pix(9,10,'H');
    }else if(mat===6){ // Myrrenite: royal teal armour and gold V collar
      pix(2,4,'A');pix(13,4,'A');pix(2,5,'A');pix(13,5,'A');
      pix(5,6,'A');pix(10,6,'A');pix(6,7,'A');pix(9,7,'A');
      box(7,8,2,2,'A');box(7,10,2,1,'H');
    }else{ // Starsteel: white-gold winged collar and central star
      pix(1,3,'A');pix(14,3,'A');pix(1,4,'A');pix(14,4,'A');pix(2,4,'H');pix(13,4,'H');
      pix(6,6,'H');pix(9,6,'H');box(7,7,2,3,'A');
      pix(6,8,'A');pix(9,8,'A');box(6,11,4,1,'H');
    }
    if(back){ // Back plate seam: no front-facing emblem on rear-facing art.
      box(7,6,2,5,'K');box(8,7,1,3,'A');
    }
    if(isSide){ // Shorter near-side shoulder; always clear of the glove.
      box(4,6,1,3,'K');pix(5,6,'H');
    }
  }else{
    // Shields have materially different shapes, not a single 8x8 recolour.
    let widths;
    if(mat===2)widths=[2,4,6,8,8,8,8,6,4]; // round buckler
    else if(mat===3)widths=[8,9,9,9,8,8,6,4,2]; // iron kite
    else if(mat===4)widths=[10,10,10,9,9,8,6,4,2]; // steel heater
    else if(mat===5)widths=[10,11,11,11,10,9,9,7,4]; // black tower
    else if(mat===7)widths=[10,12,11,12,10,9,8,6,2]; // obsidian barbed
    else if(mat===6)widths=[9,10,10,9,9,8,7,4,2]; // Myrrenite ward
    else widths=[12,12,11,10,10,9,7,5,2]; // starsteel great shield
    for(let i=0;i<widths.length;i++){
      const w=widths[i],x=Math.floor((16-w)/2);
      box(x,i+4,w,1,'K');if(w>2)box(x+1,i+4,w-2,1,'M');
      if(w>4)pix(x+1,i+4,'H');
    }
    if(mat===5||mat===7){pix(1,4,'K');pix(2,4,'K');pix(13,4,'K');pix(14,4,'K')}
    if(mat===6){
      // Crescent horn terminals distinguish the Myrrenite ward silhouette.
      pix(2,3,'A');pix(2,4,'A');pix(12,4,'A');pix(13,4,'A');pix(13,3,'A');
    }
    if(mat===6||mat===8){
      pix(3,4,'A');pix(12,4,'A');
      box(7,6,2,4,'A');pix(6,8,'H');pix(9,8,'H');
    }else if(mat===7){
      pix(7,6,'A');pix(8,7,'A');pix(7,8,'A');pix(8,9,'A');
    }else if(mat===4){
      box(7,6,2,5,'H');box(5,8,6,1,'A');
    }else if(mat===3){box(7,6,2,6,'K');pix(6,7,'H');pix(9,7,'H')}
    else if(mat===2){box(7,7,2,3,'A');box(6,8,4,1,'H')}
    else if(mat===5){box(7,6,2,6,'K');box(5,9,6,1,'A')}
    if(isSide){box(6,6,1,5,'K');pix(7,7,'A')}
    if(back){box(7,6,2,5,'K')}
  }
}
for(let ti=0;ti<7;ti++)for(let dye=-1;dye<4;dye++)for(let dir=0;dir<4;dir++)for(let part=0;part<2;part++){
  const band=ti*5+(dye+1),ox=(dir+part*4)*SIZE,oy=band*SIZE;
  cell(ox,oy,ORDER[ti],part,dir,dye);
}
const output=path.join(__dirname,'../public/assets/myrren-v19f/chest_shield_v2.png');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,canvas.toBuffer('image/png'));
console.log('Packed native 16px seven-tier chest and shield sprite atlas');
