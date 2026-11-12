/* Tales of Myrren — opt-in native Crater Camp sprite proof.
 * Original atlas from draft art PR #85. No save/world/collision modifications.
 * The live game retains its existing procedural fallback when this proof is off
 * or the image fails to load; never use canvas-generated art as replacement.
 */
(()=>{'use strict';
  const enabled=new URLSearchParams(window.location.search).has('camp-props-proof');
  const CELL=64,WIDTH=256,HEIGHT=384,ANCHOR_X=32,ANCHOR_Y=56;
  const props=Object.freeze({
    bank_chest:{row:0,frames:1,ms:0},
    jobs_board:{row:1,frames:4,ms:350},
    blacksmith_anvil:{row:2,frames:1,ms:0},
    open_furnace:{row:3,frames:4,ms:240},
    campfire:{row:4,frames:4,ms:240},
    lantern:{row:5,frames:4,ms:280}
  });
  let atlas=null;
  if(enabled){
    atlas=new Image();
    atlas.decoding='async';
    atlas.onerror=()=>console.warn('Crater Camp native art unavailable; using existing fallback');
    atlas.src='/assets/camp/camp_props_v1.png?v=1';
  }
  function ready(){return !!atlas&&atlas.complete&&atlas.naturalWidth===WIDTH&&atlas.naturalHeight===HEIGHT}
  function draw(ctx,kind,x,y,now=0){
    const entry=props[kind];
    if(!ready()||!entry||!Number.isFinite(x)||!Number.isFinite(y))return false;
    const frame=entry.frames===1?0:Math.floor(Math.max(0,now)/entry.ms)%entry.frames;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(atlas,frame*CELL,entry.row*CELL,CELL,CELL,
      Math.round(x)-ANCHOR_X,Math.round(y)-ANCHOR_Y,CELL,CELL);
    ctx.restore();
    return true;
  }
  window.MyrrenCampProps=Object.freeze({enabled,ready,draw});
})();
