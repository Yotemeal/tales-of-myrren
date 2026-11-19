/* Authored 32px native weapon silhouettes for the seven existing metal IDs.
 * No resampling: every output pixel is an intentional opaque pixel or empty.
 * The fixed grip at source (16,26) matches the V19F dominant-hand socket.
 * Run: node scripts/pack-distinct-swords-v2.cjs
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createCanvas} = require('@napi-rs/canvas');

const CELL = 32;
const TIERS = [
  {name:'Bronze',mat:2,top:9, widths:[1,2,3,4,5,6,6,6,5,5,4,4,3,3],
    offsets:[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    metal:['#5a3024','#b46c35','#edb47b','#ffe0a3'],guard:'#aa783f',hilt:'#693c22',accent:'#eec27b'},
  {name:'Iron',mat:3,top:5,widths:[1,1,2,2,3,3,4,4,4,4,4,4,4,4,4,4,4,4],
    offsets:Array(18).fill(0),
    metal:['#303848','#687c92','#9eafbd','#e3ebed'],guard:'#83909a',hilt:'#594235',accent:'#bcc7cc'},
  {name:'Steel',mat:4,top:3,widths:[1,1,1,2,2,2,3,3,3,3,3,3,3,3,3,3,3,4,4,4],
    offsets:Array(20).fill(0),
    metal:['#263e56','#7a9bae','#b8d3e3','#f5fcff'],guard:'#9ec6dc',hilt:'#3b4b65',accent:'#edf5fe'},
  {name:'Black Iron',mat:5,top:7,widths:[2,3,4,5,5,6,7,8,8,9,9,9,8,8,7,6],
    offsets:[2,2,2,2,2,2,1,1,1,1,1,1,1,0,0,0],
    metal:['#211d2c','#464258','#646179','#a39eae'],guard:'#6b6178',hilt:'#2d2638',accent:'#9980b0'},
  {name:'Obsidianite',mat:7,top:5,widths:[1,2,3,4,5,5,4,6,6,5,7,7,6,8,7,6,6,5],
    offsets:[-1,-1,-1,0,0,-1,-1,0,0,-1,0,0,-1,0,0,0,0,0],
    metal:['#1b1025','#432044','#7d285f','#e95a9b'],guard:'#722848',hilt:'#291d34',accent:'#f366a8'},
  {name:'Myrrenite',mat:6,top:3,widths:[1,2,2,3,3,4,4,4,4,4,5,5,5,4,4,4,4,4,4,4],
    offsets:[-3,-3,-3,-3,-2,-2,-2,-1,-1,-1,0,0,1,1,1,1,0,0,0,0],
    metal:['#153c49','#137f86','#54c8c5','#c9fff0'],guard:'#ddbd69',hilt:'#22535a',accent:'#f8df9e'},
  {name:'Starsteel',mat:8,top:1,widths:[1,1,2,2,2,3,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5],
    offsets:Array(22).fill(0),
    metal:['#41445f','#a3bdd7','#ecf7ff','#ffffff'],guard:'#e4c16d',hilt:'#4c617d',accent:'#fff2a8'}
];

function paintTier(ctx,t,index){
  const start=index*CELL;
  const px=(x,y,c)=>{if(x>=0&&x<CELL&&y>=0&&y<CELL){ctx.fillStyle=c;ctx.fillRect(start+x,y,1,1)}};
  const rect=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)px(xx,yy,c)};
  const inside=new Set();
  t.widths.forEach((width,i)=>{
    const y=t.top+i,center=16+t.offsets[i],left=center-Math.floor(width/2);
    for(let x=left;x<left+width;x++)inside.add(y*CELL+x);
  });
  // Sword material, edge shade, and a narrow fuller, all at native resolution.
  for(const id of inside){
    const x=id%CELL,y=Math.floor(id/CELL);
    const left=!inside.has(id-1),right=!inside.has(id+1),
      top=!inside.has(id-CELL),bottom=!inside.has(id+CELL);
    const isContour=left||right||top||bottom;
    const center=16+t.offsets[y-t.top];
    let color=isContour?t.metal[0]:x<center?t.metal[1]:t.metal[2];
    if(!isContour&&x>=center&&((y+t.mat)%4!==0))color=t.metal[3];
    px(x,y,color);
  }
  // Unmistakable material/shape details are intentionally distinct, not hue swaps.
  switch(t.mat){
    case 2: // leaf-bladed short sword with a riveted bronze bar guard
      rect(12,23,9,2,t.metal[0]);rect(13,23,7,1,t.guard);
      px(12,22,t.accent);px(20,22,t.accent);break;
    case 3: // iron arming sword, perpendicular quillons and steel fuller
      rect(11,23,11,2,t.metal[0]);rect(12,23,9,1,t.guard);
      px(11,22,t.metal[2]);px(21,22,t.metal[2]);rect(16,10,1,10,t.metal[1]);break;
    case 4: // narrow knightly blade, down-turned swept steel quillons
      rect(10,23,13,1,t.metal[0]);rect(12,23,9,1,t.guard);
      rect(10,22,2,1,t.metal[2]);rect(21,22,2,1,t.metal[2]);
      px(10,21,t.metal[3]);px(22,21,t.metal[3]);rect(16,9,1,11,t.metal[2]);break;
    case 5: // broad, offset black-iron cleaver, notched guard
      px(12,15,t.metal[0]);px(12,16,t.metal[0]);px(12,17,t.metal[1]);
      rect(8,23,16,2,t.metal[0]);rect(10,23,13,1,t.guard);
      rect(9,21,2,2,t.metal[0]);rect(22,21,2,2,t.metal[0]);break;
    case 7: // volcanic jagged sword with barbs and a hot central rune
      px(12,12,t.metal[0]);px(12,13,t.metal[2]);
      px(20,17,t.metal[0]);px(20,18,t.metal[1]);px(21,18,t.metal[2]);
      rect(10,23,13,2,t.metal[0]);
      rect(9,21,2,2,t.metal[1]);rect(22,21,2,2,t.metal[1]);
      for(const y of [10,14,18,21])px(16,y,t.accent);break;
    case 6: // curved Myrrenite sabre, gold crescent hilt and inset rune
      rect(11,24,12,1,t.metal[0]);
      for(const [x,y] of [[10,22],[11,21],[11,22],[12,22],[12,23],[21,23],[22,22],[23,22],[23,21],[22,23]])px(x,y,t.guard);
      rect(15,24,3,1,t.guard);
      for(const y of [10,14,18])px(15+t.offsets[Math.min(t.offsets.length-1,y-t.top)],y,t.accent);
      break;
    case 8: // long starsteel greatsword, split wing guard and luminous spine
      rect(9,23,15,2,t.metal[0]);rect(11,23,11,1,t.guard);
      for(const [x,y] of [[8,20],[8,21],[9,21],[9,22],[10,22],[23,22],[24,22],[24,21],[25,21],[25,20]])px(x,y,t.accent);
      rect(16,6,1,15,t.metal[3]);px(16,7,t.accent);break;
  }
  // Same socket across all tiers; glove can cover the handle without a gap.
  rect(15,23,3,3,t.metal[0]);
  rect(14,25,5,1,t.metal[0]);rect(15,25,3,1,t.guard);
  rect(15,26,3,4,t.metal[0]);rect(16,26,1,4,t.hilt);
  px(15,27,t.accent);px(17,29,t.accent);
  rect(14,30,5,2,t.metal[0]);rect(15,30,3,1,t.guard);
}

const canvas=createCanvas(CELL*TIERS.length,CELL),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
TIERS.forEach((tier,index)=>paintTier(ctx,tier,index));
const outfile=path.join(__dirname,'../public/assets/myrren-v19f/sword_blades_v2.png');
fs.mkdirSync(path.dirname(outfile),{recursive:true});
fs.writeFileSync(outfile,canvas.toBuffer('image/png'));

// Optional QA contact sheet: not shipped as a runtime asset.
if(process.argv.includes('--preview')){
  const scale=4,w=TIERS.length*140,h=190,preview=createCanvas(w,h),c=preview.getContext('2d');
  c.fillStyle='#8e7156';c.fillRect(0,0,w,h);
  c.fillStyle='#272523';c.fillRect(0,0,w,30);
  c.textBaseline='middle';c.textAlign='center';c.font='bold 14px sans-serif';
  for(let i=0;i<TIERS.length;i++){
    c.fillStyle='#f3e5be';c.fillText(TIERS[i].name,i*140+70,15);
    c.fillStyle=i%2?'#9f8062':'#997a5b';c.fillRect(i*140,30,140,h-30);
    c.imageSmoothingEnabled=false;
    c.drawImage(canvas,i*CELL,0,CELL,CELL,i*140+6,38,CELL*scale,CELL*scale);
  }
  fs.writeFileSync(path.join(__dirname,'../sword-v2-contact-sheet.png'),preview.toBuffer('image/png'));
}
console.log('Packed seven native, distinct 32px swords: '+outfile);
