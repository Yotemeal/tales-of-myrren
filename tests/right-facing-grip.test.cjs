const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
(async()=>{
 const {W,H,A,S}=await require('./wardrobe-harness.cjs')(),hero=H.create(W.base,{rawFrames:true});
 // Measured centres of the glove bulbs, rather than arbitrary opaque body pixels.
 const fists={0:[[41,44],[19,28],[48,45],[42,49],[41,42],[42,44]],2:[[42,44],[19,29],[50,45],[41,50],[41,42],[42,44]],3:[[41,44],[19,29],[50,45],[41,50],[41,42],[43,44]],4:[[41,44],[18,29],[50,45],[41,49],[41,42],[42,44]],5:[[41,44],[19,29],[50,46],[41,50],[40,42],[42,44]],7:[[41,44],[19,28],[47,45],[39,49],[40,42],[42,44]],6:[[41,44],[18,30],[51,45],[42,50],[41,42],[42,44]],8:[[42,44],[18,29],[50,44],[41,50],[39,42],[42,44]]};
 for(const glove of [0,...S.order])for(const weapon of S.order){
  for(const shield of [0,weapon])for(const moving of [false,true])for(let frame=0;frame<6;frame++){
   const o={dv:'s',f:1,g:[weapon,weapon,weapon,weapon,shield,glove],weaponMat:weapon,moving,nativeScale:true},p=hero.pose(o,frame*75),socket=A.attachments(p,o),near=W.geometry[p.row*6+p.col].hands[0];
   const expected=moving?(glove?[[35,39],[27,43],[37,40],[35,39],[30,43],[36,40]]:[[35,40],[28,43],[36,40],[35,40],[31,43],[35,40]])[p.col]:(glove?[28,44]:[32,44]);
   assert.deepEqual(Array.from(socket.sword),[expected[0],expected[1]-p.lift],'right-facing locomotion uses the visible fist');
  }
  for(let frame=0;frame<6;frame++){
   const o={dv:'s',f:1,g:[weapon,weapon,weapon,weapon,0,glove],weaponMat:weapon,swingAt:0,nativeScale:true},time=[0,60,110,160,220,280][frame],p=hero.pose(o,time),socket=A.attachments(p,o);
   assert.deepEqual(Array.from(socket.sword),fists[glove][frame],'slash grip must follow the glove material, independently of the sword');
   const c=createCanvas(160,140);hero.drawEquipped(c.getContext('2d'),80,110,o,time);
   const image=c.getContext('2d').getImageData(0,0,160,140).data;
   const x=80+socket.sword[0]-32,y=110+socket.sword[1]-60;
   assert.equal(image[(y*160+x)*4+3],255,'grip centre must remain covered by the fist');
  }
 }
 console.log('PASS: right-facing ready/run use the visible fist; 336 sword/glove attack combinations use measured glove centres.');
})().catch(e=>{console.error(e);process.exitCode=1});
