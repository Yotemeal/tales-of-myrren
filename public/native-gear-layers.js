/* Myrren native equipment atlas contract — read-only preview module.
 * Matches the current 21x27 Kez V2 renderer's frame selection and foot anchor.
 * No runtime integration, save changes, or sprite generation.
 */
((root) => {
  'use strict';
  const WIDTH=21, HEIGHT=27, FRAMES=4, ROWS=6;
  const SLOTS=Object.freeze(['shield','helmet','body','legs','boots','gloves']);
  const DIRECTIONS=Object.freeze({front:1,back:2,left:3,right:4});
  function facing(state) {
    if(state?.dv==='u')return 'back';
    if(state?.dv==='s')return state.f<0?'left':'right';
    return 'front';
  }
  function pose(state={}, now=0) {
    const direction=facing(state);
    const age=now-(Number.isFinite(state.swingAt)?state.swingAt:-99999);
    const swordHit=age>=0&&age<320&&state.tool==='sword';
    const idleFront=!swordHit&&!state.moving&&direction==='front';
    const useIdle=!!state.animateIdle||idleFront;
    const row=useIdle?0:DIRECTIONS[direction];
    const still=!swordHit&&!state.moving&&!useIdle;
    const frame=useIdle?Math.floor(now/440)%FRAMES:
      swordHit?0:still?0:state.moving?Math.floor(now/130)%FRAMES:0;
    return Object.freeze({
      direction,row,frame,slotRow:row,slotFrame:frame,
      swordHit,walking:!!state.moving&&!swordHit,
      stationary:!state.moving&&!swordHit,
      usesSynthesizedIdle:still,
    });
  }
  function cell(slot,row,frame) {
    const index=typeof slot==='string'?SLOTS.indexOf(slot):slot;
    if(!Number.isInteger(index)||index<0||index>=SLOTS.length||
       !Number.isInteger(row)||row<0||row>=ROWS||
       !Number.isInteger(frame)||frame<0||frame>=FRAMES)
      throw new RangeError('Invalid native equipment atlas cell');
    return Object.freeze({
      sx:frame*WIDTH,sy:(index*ROWS+row)*HEIGHT,
      sw:WIDTH,sh:HEIGHT,
      index,slot:SLOTS[index],row,frame
    });
  }
  function placement(bounds) {
    if(!bounds||![bounds.left,bounds.right,bounds.top,bounds.bottom].every(Number.isInteger))
      throw new TypeError('Expected integer source-frame bounding box');
    const sw=bounds.right-bounds.left+1,sh=bounds.bottom-bounds.top+1;
    if(sw<1||sw>WIDTH||sh<1||sh>HEIGHT)
      throw new RangeError('Source-frame bounds exceed 21x27');
    // Identical source-crop anchoring to Kez V2 atlas.draw.
    const shift=Math.round((bounds.left+bounds.right)/2-10.5);
    return Object.freeze({
      dx:Math.round(-sw/2+shift)-bounds.left,
      dy:1-sh-bounds.top
    });
  }
  function passFor(slot,direction) {
    if(slot==='shield')return direction==='left'||direction==='right'?'under':'over';
    return 'over';
  }
  function draw(ctx, image, options={}) {
    if(!ctx||!image||!options.pose||!options.anchor||
       !Number.isInteger(options.anchor.dx)||!Number.isInteger(options.anchor.dy))
      return false;
    const {pose,anchor,pass='over',visible={}}=options;
    if(pass!=='over'&&pass!=='under')throw new RangeError('Invalid pass');
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    let n=0;
    // Shield first on side views; gloves last, so arms are not buried in chest pixels.
    const order=['shield','legs','boots','body','helmet','gloves'];
    for(const slot of order) {
      if(passFor(slot,pose.direction)!==pass||visible[slot]===false)continue;
      const src=cell(slot,pose.slotRow,pose.slotFrame);
      ctx.drawImage(image,src.sx,src.sy,src.sw,src.sh,
        anchor.dx,anchor.dy,WIDTH,HEIGHT);
      n++;
    }
    ctx.restore();
    return n;
  }
  const api=Object.freeze({
    width:WIDTH,height:HEIGHT,frames:FRAMES,rows:ROWS,
    atlasWidth:WIDTH*FRAMES,atlasHeight:HEIGHT*ROWS*SLOTS.length,
    slots:SLOTS,pose,cell,placement,passFor,draw
  });
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MyrrenNativeGearLayers=api;
})(typeof window!=='undefined'?window:{});
