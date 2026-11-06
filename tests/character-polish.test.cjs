const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const sb={window:{},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(sb);
 vm.runInContext(fs.readFileSync('public/v31-character.js','utf8')+fs.readFileSync('public/v31-feet.js','utf8')+fs.readFileSync('public/v31-equipment.js','utf8')+';this.E=V31Equipment;',sb);
 const C=sb.window.V31Character,src=sb.buildV31FeetAtlas(C.buildFaceAtlas(await loadImage('public/hero_32x40_v31.png'))),E=sb.E.make(src);
 let count=0;const sheet=createCanvas(1056,560),c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#354636';c.fillRect(0,0,sheet.width,sheet.height);c.font='14px sans-serif';
 const states=[['Idle',{} ,0],['Run', {moving:true},90],['Windup',{swingAt:1000},1040],['Strike',{swingAt:1000},1140],['Recover',{swingAt:1000},1240],['Hurt',{hurtAt:1000},1050],['Kneel',{deathAt:1000},1080],['Fall',{deathAt:1000},1250],['Down',{deathAt:1000},1450]];
 for(let t=0;t<=6;t++){
  const full=E.get(t,t,null,t,t,t,0,t),bareHand=E.get(t,t,null,t,t,t);
  if(t){assert.notDeepEqual(full.toBuffer('image/png'),bareHand.toBuffer('image/png'),'equipped hands must render');assert.equal(full.width,128);assert.equal(full.height,320)}
  c.fillStyle='#eee2b9';c.fillText(t?sb.E.materials[t].name:'Base',8,t*78+25);
  for(let k=0;k<states.length;k++){
    const [name,o,now]=states[k];if(t===0)c.fillText(name,112+k*104,15);
    const pose=C.pose(now,{dv:'d',f:1,...o}),cell=createCanvas(64,48),cc=cell.getContext('2d');C.drawPose(cc,full,32,47,pose);
    const pixels=cc.getImageData(0,0,64,48).data;
    assert(pixels.some((v,i)=>i%4===3&&v),'empty animation');
    for(let y=0;y<48;y++){assert.equal(pixels[(y*64)*4+3],0,'clipped left');assert.equal(pixels[(y*64+63)*4+3],0,'clipped right')}
    if(pose.death>=360)assert([...Array(64)].some((_,x)=>pixels[(46*64+x)*4+3]),'lying body must touch ground');
    c.drawImage(cell,0,0,64,48,100+k*104,t*78+18,96,72);count++;
  }
  for(let d=0;d<4;d++)for(const [_,o,now] of states){const pose=C.pose(now,{dv:d===3?'u':d===0?'d':'s',f:d===1?-1:1,...o});const cell=createCanvas(64,48);C.drawPose(cell.getContext('2d'),full,32,47,pose);count++}
 }
 fs.writeFileSync('/workspace/scratch/myrren-polish-sheet.png',sheet.toBuffer('image/png'));
 const {game:g}=await require('./game-runtime.cjs')();g.start();g.me.x=220;g.me.y=240;
 const before=JSON.stringify({xp:g.save.xp,eq:g.save.eq,inv:g.save.inv,bank:g.save.bank,notes:g.save.notes});
 g.die();assert.equal(g.me.hp,0);assert.equal(g.me.deathAt,1000);g.die();assert.equal(g.me.deathAt,1000);
 assert.equal(g.snap().x,g.CX);assert.equal(g.snap().y,g.CY+40,'reload during fall returns safely to town');
 g.keys.d=true;g.beginSwing(1100);g.update(.1,1500);assert.equal(g.me.x,220);assert.equal(g.me.pend,0);assert.equal(g.me.hp,0);
 g.update(.1,2050);assert.equal(g.me.deathAt,null);assert.equal(g.me.x,g.CX);assert.equal(g.me.y,g.CY+40);assert.equal(g.me.hp,g.hpMax());
 assert.equal(JSON.stringify({xp:g.save.xp,eq:g.save.eq,inv:g.save.inv,bank:g.save.bank,notes:g.save.notes}),before,'animation must preserve progress');
 console.log(`PASS: ${count} native equipped animation states; cuffs; unclipped grounded death; safe respawn/save and unchanged inventory/XP.`);
})().catch(e=>{console.error(e);process.exitCode=1});
