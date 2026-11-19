'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {loadImage,createCanvas} = require('@napi-rs/canvas');
const path = require('node:path');

const tierNames = ['Bronze','Iron','Steel','Black Iron','Obsidianite','Myrrenite','Starsteel'];
const asset = path.resolve(__dirname,'../public/assets/myrren-v19f/sword_blades_v2.png');

test('seven sword tiers have distinct native silhouettes and connected, glove-aligned pixel art',async()=>{
  const image = await loadImage(asset);
  assert.equal(image.width,224);
  assert.equal(image.height,32);
  const c=createCanvas(224,32).getContext('2d');
  c.drawImage(image,0,0);
  const data=c.getImageData(0,0,224,32).data;
  const masks=[];
  for(let tier=0;tier<7;tier++){
    const mask=new Set();
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const alpha=data[(y*224+tier*32+x)*4+3];
      assert(alpha===0||alpha===255,`${tierNames[tier]} has partially transparent pixels`);
      if(alpha)mask.add(y*32+x);
    }
    assert(mask.size>90,`${tierNames[tier]} should be a substantial weapon`);
    assert(mask.has(26*32+16),`${tierNames[tier]} grip must sit at (16,26)`);
    assert([...mask].some(id=>id<32*12),`${tierNames[tier]} must have a visible blade`);
    // Diagonal pixels are fine as deliberate accents, but the entire sword
    // should form a connected silhouette without floating dots or matte fringe.
    const seen=new Set(),queue=[26*32+16];
    while(queue.length){
      const id=queue.pop();if(seen.has(id)||!mask.has(id))continue;seen.add(id);
      const x=id%32,y=Math.floor(id/32);
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&nx<32&&ny>=0&&ny<32)queue.push(ny*32+nx);
      }
    }
    assert.equal(seen.size,mask.size,`${tierNames[tier]} has detached pixels at ${[...mask].filter(id=>!seen.has(id)).map(id=>`(${id%32},${Math.floor(id/32)})`).join(', ')}`);
    masks.push(mask);
  }
  for(let i=0;i<7;i++)for(let j=i+1;j<7;j++){
    const a=masks[i],b=masks[j];
    const distance=[...a].filter(id=>!b.has(id)).length+[...b].filter(id=>!a.has(id)).length;
    assert(distance>=14,`${tierNames[i]} and ${tierNames[j]} need meaningfully different silhouettes (${distance})`);
  }
});
