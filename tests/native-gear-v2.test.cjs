'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {loadImage,createCanvas}=require('@napi-rs/canvas');

test('V2 armour is seven distinct, native, dye-safe chest and shield sets',async()=>{
  const file=path.resolve(__dirname,'../public/assets/myrren-v19f/chest_shield_v2.png');
  const im=await loadImage(file);
  assert.deepEqual([im.width,im.height],[128,560]);
  const ctx=createCanvas(128,560).getContext('2d');ctx.drawImage(im,0,0);
  const raw=ctx.getImageData(0,0,128,560).data,masks=[];
  for(let mat=0;mat<7;mat++){
    const material=[];
    for(let dye=0;dye<5;dye++){
      const band=mat*5+dye;
      for(let part=0;part<2;part++)for(let dir=0;dir<4;dir++){
        const mask=new Set(),originX=(part*4+dir)*16,originY=band*16;
        for(let y=0;y<16;y++)for(let x=0;x<16;x++){
          const a=raw[((originY+y)*128+originX+x)*4+3];
          assert(a===0||a===255,'soft alpha in material '+mat+', dye '+dye);
          if(a)mask.add(y*16+x);
        }
        assert(mask.size>=20,'missing armour piece '+mat+'/'+part+'/'+dir);
        const seed=[...mask][0],seen=new Set(),todo=[seed];
        while(todo.length){
          const p=todo.pop();if(seen.has(p)||!mask.has(p))continue;
          seen.add(p);const x=p%16,y=Math.floor(p/16);
          for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
            const xx=x+dx,yy=y+dy;if(xx>=0&&xx<16&&yy>=0&&yy<16)todo.push(yy*16+xx);
          }
        }
        assert.equal(seen.size,mask.size,`detached pixels in material ${mat} dye ${dye} part ${part} dir ${dir}: ${[...mask].filter(x=>!seen.has(x)).map(x=>`(${x%16},${Math.floor(x/16)})`)}`);
        if(dye===0&&dir===0)material[part]=mask;
        if(dye>0&&dir===0)assert.deepEqual([...mask].sort((a,b)=>a-b),[...material[part]].sort((a,b)=>a-b),'dye changed silhouette');
      }
    }
    masks.push(material);
  }
  for(let a=0;a<7;a++)for(let b=a+1;b<7;b++){
    let difference=0;
    for(let part=0;part<2;part++){
      difference += [...masks[a][part]].filter(id=>!masks[b][part].has(id)).length;
      difference += [...masks[b][part]].filter(id=>!masks[a][part].has(id)).length;
    }
    assert(difference>=6,'armour silhouettes too similar: '+a+' and '+b);
  }
});
