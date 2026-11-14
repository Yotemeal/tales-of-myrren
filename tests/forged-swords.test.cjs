'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');

(async()=>{
  const {game:g}=await require('./game-runtime.cjs')();
  const names=['bronze','iron','steel','cobalt','obsidianite','aether','starsteel'];
  const levels=[1,10,20,30,40,55,70],smithLevels=[5,14,24,34,44,59,73];
  const attack=[1,3,6,12,17,22,30];
  const anvil=g.VILLAGE.stations.find(s=>s.kind==='anvil');
  assert(anvil,'world must retain an anvil');
  const realNow=Date.now,realRandom=Math.random;
  let clock=1_000_000;
  Date.now=()=>clock;
  Math.random=()=>.5; // Keep random pet bonuses out of exact XP assertions.
  try{
    for(let i=0;i<names.length;i++){
      const id=names[i]+'_sword',d=g.DEFS[id],bar='ing_'+names[i];
      const recipe=g.SMELT.find(r=>r.id===names[i]);
      assert(d&&recipe,'sword and recipe must exist for '+names[i]);
      assert.equal(d.req,levels[i],id+' keeps its Combat equip requirement');
      assert.equal(d.atk,attack[i],id+' keeps its attack bonus');
      assert.equal(g.forgeReq(recipe,'sword'),smithLevels[i],id+' has its own Smithing unlock');
      g.adoptSave({v:3,xp:{mining:2e9,melee:g.xpTable[levels[i]],forging:g.xpTable[smithLevels[i]]},
        inv:{[bar]:4,coins:789},eq:{},bag:[],bank:{[id]:3},notes:{[id]:9},x:anvil.x,y:anvil.y});
      g.setForgeMat(d.mat);
      assert(g.smithStation('forge'),'test character must stand at the anvil');
      if(i>0){
        assert.equal(g.forge('sword'),false,'changing metal or restoring a save cannot bypass the shared cooldown');
        assert.equal(g.save.inv[bar],4,'cooldown rejection preserves the next metal\'s ingots');
        clock+=g.PRODUCTION_MS.forge;
      }
      g.save.xp.forging=g.xpTable[smithLevels[i]]-1;
      const lockedXp=g.save.xp.forging;
      assert.equal(g.forge('sword'),false,'recipe stays locked immediately below its Smithing unlock');
      assert.equal(g.save.inv[bar],4,'locked recipe cannot consume ingots');
      assert.equal(g.save.eq.weapon,null,'locked recipe cannot equip a sword');
      assert.equal(g.save.xp.forging,lockedXp,'locked recipe cannot award XP');
      g.save.xp.forging=g.xpTable[smithLevels[i]];
      const beforeXp=g.save.xp.forging;
      assert.equal(g.forge('sword'),true,'sword forges at its exact Smithing unlock');
      assert.equal(g.save.inv[bar],0,'each sword consumes exactly four ingots');
      assert.equal(g.save.eq.weapon,id,'usable sword auto-equips to the empty weapon slot');
      assert.equal(g.save.xp.forging-beforeXp,g.forgeXp(recipe,4),'sword gives the finished-item Smithing XP');
      assert.equal(g.save.inv.coins,789);
      assert.equal(g.save.bank[id],3);
      assert.equal(g.save.notes[id],9);
      const snap=JSON.parse(JSON.stringify(g.snap()));
      g.adoptSave(snap);
      assert.equal(g.save.eq.weapon,id,'stable sword ID survives save round-trip');
      assert.equal(g.save.bank[id],3);assert.equal(g.save.notes[id],9);
    }
  }finally{Date.now=realNow;Math.random=realRandom}

  const {S,W,H}=await require('./wardrobe-harness.cjs')();
  assert(S.ready);
  const seen=new Set();
  for(const mat of S.order){
    const html=S.icon(mat,64),im=await loadImage(html.match(/src="([^"]+)"/)[1]);
    const c=createCanvas(64,64),x=c.getContext('2d');x.drawImage(im,0,0);
    const data=x.getImageData(0,0,64,64).data;
    seen.add(crypto.createHash('sha256').update(data).digest('hex'));
    let opaque=0;
    for(let i=3;i<data.length;i+=4){assert(data[i]===0||data[i]===255,'sword icons must retain hard pixel edges');opaque+=!!data[i]}
    assert(opaque>80,'sword icon must contain visible artwork');
    for(const face of [-1,1])for(const angle of [-1.5,-.35,1]){
      const out=createCanvas(100,100),ctx=out.getContext('2d');
      assert(S.draw(ctx,mat,50,60,face,angle));
      const pixels=ctx.getImageData(0,0,100,100).data;
      assert(pixels.some((value,i)=>i%4===3&&value>0),'sword renders in both facing directions and every swing pose');
    }
  }
  assert.equal(seen.size,7,'all seven metal sword icons must remain distinct');
  assert(W.compose(null,[]));assert(H);
  console.log('PASS: seven swords, exact Combat and Smithing requirements, four-ingot recipes, shared cooldown, XP/save/bank/notes parity, distinct icons and mirrored swings.');
})().catch(error=>{console.error(error);process.exitCode=1});
