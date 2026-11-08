/* Native 21×27 Kez V2 equipment, preserving the approved seven-metal silhouette
 * language without enlarging or replacing the base character sheet.
 * This is independently fitted preview artwork, not a crop of the 176×276 reference.
 * Gear order: helmet, body, legs, boots, shield, gloves. No save-data changes.
 */
(()=>{'use strict';
 const ORDER=[2,3,4,5,7,6,8];
 // Outline, material, shine, decorative accent; sampled against the approved
 // smithing_armour_front_atlas.png (Obsidianite violet, Myrrenite teal/gold,
 // Starsteel white/gold). Keep material IDs unchanged for existing saves.
 const METALS={
  2:['#56301d','#aa663b','#f1b37c','#d99556'],
  3:['#343342','#9293a5','#e0e1ed','#b6b4ca'],
  4:['#29394f','#b2c8e6','#f6f9ff','#7cabe0'],
  5:['#261c35','#60496f','#aa8bb4','#81598d'],
  7:['#250f39','#8325be','#e36bff','#c346ec'],
  6:['#0a3540','#198f8d','#91e4db','#efc653'],
  8:['#363d51','#d9e2f2','#ffffff','#efb63a']
 };
 const CLOSED=new Set([7,6,8]);
 // Approved Myrrenite helmet revision: teal plate, a tall gold crest,
 // continuous gold brow, black T-shaped eye slit, and a central nose guard.
 // Authored at native pixel resolution (15 × 17). This is a real fixed
 // pixel-mask for all four directions, not a scaled-down full-body reference.
 // Front is the definitive design; side/back are consistent directional views.
 const MYRRENITE_MASKS={
  front:[
   "......GGG......",
   ".....KGGGK.....",
   "....KTTGTTK....",
   "...KTTTGTTTK...",
   "..KTTTTGTTTTK..",
   ".KTTTTTGTTTTTK.",
   ".KLLLLGGLLLLLK.",
   "KGGGGGGHGGGGGGK",
   "KGHHGGGHGGGHHGK",
   "KTKVVVVVVVKTGTK",
   "KTTKVVVVVKTTTKK",
   "KTTTKVVVKTTTTKK",
   ".KTTTKVKTTTTK..",
   ".KTTTKVKTTTTK..",
   "..KTTKVKTTTK...",
   "...KDKVKDKK....",
   "....KKKKKK....."
  ],
  right:[
   "......GGG......",
   ".....KGGGK.....",
   "....KTTGTTK....",
   "...KTTTGTTTK...",
   "..KTTTTGTTTTK..",
   ".KTTTTTGTTTTTK.",
   ".KLLLLGGLLLLLK.",
   "KGGGGGGHGGGGGGK",
   "KGHHGGGHGGGHHGK",
   "KTTTTKKVVVVVVKK",
   "KTTTTKTVVVVVVKK",
   "KTTTTKTTTVVVKKK",
   ".KTTTTTTTVVKK..",
   ".KTTTTTTTKKK...",
   "..KTTTTTTTK....",
   "...KDTGTDKK....",
   "....KKKKKK....."
  ],
  back:[
   "......GGG......",
   ".....KGGGK.....",
   "....KTTGTTK....",
   "...KTTTGTTTK...",
   "..KTTTTGTTTTK..",
   ".KTTTTTGTTTTTK.",
   ".KLLLLGGLLLLLK.",
   "KGGGGGGHGGGGGGK",
   "KTTTTTTGTTTTTTK",
   "KTTTTTTGTTTTTTK",
   "KTTTTTTGTTTTTTK",
   "KTTTTTLGTTTTTTK",
   ".KTTTTTGTTTTTK.",
   ".KTTTTTGTTTTTK.",
   "..KTTTTGTTTTK..",
   "...KTTTGTTTK...",
   "....KKKKKK....."
  ]
 };
 MYRRENITE_MASKS.left=MYRRENITE_MASKS.right.map(row=>[...row].reverse().join(''));
 const myrreniteRuns={};
 for(const [dir,rows] of Object.entries(MYRRENITE_MASKS)){
  if(rows.length!==17||rows.some(row=>row.length!==15))
   throw new Error('Invalid native Myrrenite helmet mask: '+dir);
  const runs=[];
  rows.forEach((line,y)=>{
   for(let x=0;x<15;){
    const ch=line[x];let end=x+1;
    while(end<15&&line[end]===ch)end++;
    if(ch!=='.')runs.push([x-7,y-26,end-x,ch]);
    x=end;
   }
  });
  myrreniteRuns[dir]=runs;
 }
 function myrreniteHelmet(px,face,f,bob,p){
  const dir=face==='side'?(f<0?'left':'right'):face;
  // Gold must remain gold even with an old save's cosmetic dye selected.
  const shades={K:p[0],T:p[1],L:p[2],D:p[0],
   G:METALS[6][3],H:'#fff3b6',V:'#060f18'};
  for(const [dx,dy,w,ch] of myrreniteRuns[dir])
   px(dx,dy+bob,w,1,shades[ch]);
 }
 // Cosmetic dyes are legacy save indices 0–3. Tint high-tier enamel, not
 // the whole sprite, so each approved metal remains recognisable.
 const DYE_TONES=['#c7414e','#39a86c','#6966ba','#e5ba52'];
 const tintCache=new Map();
 function blend(a,b,amount){
  const channels=[1,3,5].map(i=>{
   const x=parseInt(a.slice(i,i+2),16),y=parseInt(b.slice(i,i+2),16);
   return Math.round(x*(1-amount)+y*amount).toString(16).padStart(2,'0');
  });
  return '#'+channels.join('');
 }
 function colorsFor(mat,dye){
  const p=METALS[mat];
  if(!p||mat<4||!Number.isInteger(dye)||dye<0||dye>=DYE_TONES.length)return p;
  const key=mat+'/'+dye;
  if(!tintCache.has(key)){
   const q=p.slice();
   q[1]=blend(p[1],DYE_TONES[dye],.3);
   q[3]=blend(p[3],DYE_TONES[dye],.65);
   tintCache.set(key,q);
  }
  return tintCache.get(key);
 }
 function clean(gear){
  const g=Array.isArray(gear)?gear:[];
  return Array.from({length:6},(_,i)=>{
   const n=g[i];
   return Number.isInteger(n)&&Object.prototype.hasOwnProperty.call(METALS,n)?n:0;
  });
 }
 function draw(ctx,x,y,o,phase='over'){
  const gear=clean(o.g);
  if(!gear.some(Boolean))return;
  const face=o.dv==='u'?'back':o.dv==='s'?'side':'front';
  const walk=!!o.moving,step=walk?Math.floor((o.now||0)/130)%4:0;
  const bob=walk&&(step===1||step===3)?-1:0;
  const baseX=Math.round(x),baseY=Math.round(y);
  const px=(dx,dy,w,h,c)=>{
   if(!c||w<=0||h<=0)return;
   ctx.fillStyle=c;ctx.fillRect(baseX+dx,baseY+dy,w,h);
  };
  // Shield on the offhand: slim silhouette behind side-facing characters,
  // fuller in front/back, aligned with the torso and never the face.
  const shield=(behind)=>{
   const mat=gear[4],p=colorsFor(mat,o.dye);if(!p)return;
   const rear=face==='back',side=face==='side';
   if(behind!==side)return;
   const sx=side?(o.f<0?5:-7):rear?6:-9;
   const sy=-10+bob,w=side?2:rear?4:5,h=8;
   px(sx,sy,w,h,p[0]);
   px(sx+1,sy+1,Math.max(1,w-2),h-2,p[1]);
   px(sx+1,sy+1,Math.max(1,w-2),1,p[2]);
   px(sx+1,sy+h-2,Math.max(1,w-2),1,p[3]);
   if(!side){px(sx+Math.floor(w/2),sy+2,1,3,p[3]);}
  };
  if(phase==='under'){shield(true);return;}
  if(phase!=='over')return;
  // Kez V2 anatomy, relative to planted soles:
  // hair -24..-19, eyes around -13, torso -10..-4, shins -4..-1.
  // Never paint chest armour across the face as the old 40px gear did.
  if(gear[3]){
   const mat=gear[3],p=colorsFor(mat,o.dye);
   for(const dx of face==='side'?[-2,1]:[-4,1]){
    px(dx,-2,3,3,p[0]);px(dx+1,-2,2,1,p[2]);px(dx,-1,3,1,p[1]);
    if(mat===6||mat===8)px(dx+1,-1,1,1,p[3]);
   }
  }
  if(gear[2]){
   const mat=gear[2],p=colorsFor(mat,o.dye);
   const delta=walk?(step===1?1:step===3?-1:0):0;
   px(-4+delta,-5,4,4,p[0]);px(0-delta,-5,4,4,p[0]);
   px(-3+delta,-4,2,3,p[1]);px(1-delta,-4,2,3,p[1]);
   px(-3+delta,-4,1,2,p[2]);px(1-delta,-4,1,2,p[3]);
   if(mat===6||mat===8){
    px(-3+delta,-3,2,1,p[3]);px(1-delta,-3,2,1,p[3]);
   }
  }
  if(gear[1]){
   const mat=gear[1],p=colorsFor(mat,o.dye);
   px(-5,-10+bob,10,7,p[0]);px(-4,-9+bob,8,5,p[1]);
   px(-4,-9+bob,8,1,p[2]);px(-4,-4+bob,8,1,p[3]);
   // Pauldrons follow the upper arms, not the cheeks.
   px(-6,-10+bob,2,3,p[0]);px(4,-10+bob,2,3,p[0]);
   px(-7,-10+bob,2,2,p[1]);px(5,-10+bob,2,2,p[1]);
   px(-7,-10+bob,2,1,p[2]);px(5,-10+bob,2,1,p[2]);
   if(face==='front'){
    if(mat===2||mat===3){
     px(-2,-7+bob,4,1,p[3]);px(-1,-6+bob,2,2,p[0]);
    }else if(mat===4||mat===5){
     px(-2,-8+bob,4,1,p[3]);px(-1,-7+bob,2,3,p[0]);px(-2,-5+bob,4,1,p[2]);
    }else{
     px(-4,-8+bob,2,1,p[3]);px(2,-8+bob,2,1,p[3]);
     px(-2,-7+bob,4,1,p[3]);px(-1,-6+bob,2,2,mat===7?p[2]:p[0]);
     if(mat===8)px(-1,-6+bob,2,1,p[2]);
    }
   }else if(face==='back'){
    px(-1,-8+bob,2,4,p[3]);
   }
  }
  if(gear[5]){
   const mat=gear[5],p=colorsFor(mat,o.dye);
   px(-7,-8+bob,2,4,p[0]);px(5,-8+bob,2,4,p[0]);
   px(-6,-7+bob,1,3,p[2]);px(6,-7+bob,1,3,p[2]);
   if(mat===6||mat===8){px(-7,-8+bob,2,1,p[3]);px(5,-8+bob,2,1,p[3]);}
  }
  if(gear[0]===6){
   myrreniteHelmet(px,face,o.f,bob,colorsFor(6,o.dye));
  }else if(gear[0]){
   const mat=gear[0],p=colorsFor(mat,o.dye),closed=CLOSED.has(mat);
   // Metal crown sits on the hairline and side guards frame the face.
   // Eyes at y≈-13 must remain visible for both open and closed helmets.
   px(-5,-24+bob,10,3,p[0]);px(-4,-24+bob,8,2,p[1]);
   px(-4,-24+bob,8,1,p[2]);px(-5,-21+bob,10,1,p[3]);
   if(face==='front'){
    px(-6,-20+bob,2,5,p[0]);px(4,-20+bob,2,5,p[0]);
    px(-5,-19+bob,1,3,p[1]);px(4,-19+bob,1,3,p[1]);
   }else if(face==='side'){
    const near=o.f<0?-6:4,far=o.f<0?5:-6;
    px(far,-19+bob,1,3,p[0]);
    px(near,-20+bob,2,5,p[0]);px(near,-19+bob,1,3,p[1]);
   }else{
    px(-5,-20+bob,10,5,p[0]);px(-4,-20+bob,8,5,p[1]);
    px(-4,-20+bob,8,1,p[2]);px(-1,-20+bob,2,4,p[3]);
   }
   // Different crest profiles make the seven tiers legible at one-pixel scale.
   if(mat===2){px(-3,-25+bob,6,1,p[1]);px(-1,-26+bob,2,1,p[3]);}
   if(mat===3){px(-3,-25+bob,6,1,p[2]);px(-1,-26+bob,2,1,p[1]);}
   if(mat===4){px(-2,-25+bob,4,2,p[2]);px(-1,-26+bob,2,1,p[3]);}
   if(mat===5){px(-3,-25+bob,6,1,p[1]);px(-1,-26+bob,2,2,p[3]);}
   if(closed){
    px(-3,-25+bob,6,2,p[1]);px(-1,-26+bob,2,3,p[3]);
    if(mat===6||mat===8){px(-3,-23+bob,6,1,p[3]);px(-1,-26+bob,2,1,p[2]);}
    if(face==='front'){
     // Cheek guards and chin plate, leaving the central face/eyes intact.
     px(-6,-15+bob,2,4,p[1]);px(4,-15+bob,2,4,p[1]);
     px(-3,-10+bob,6,1,p[0]);px(-2,-11+bob,4,1,p[1]);
     px(-1,-10+bob,2,1,p[3]);
     if(mat===7)px(-3,-10+bob,6,1,p[3]);
     else{px(-4,-12+bob,1,2,p[3]);px(3,-12+bob,1,2,p[3]);}
    }else if(face==='side'){
     const edge=o.f<0?-6:4;
     px(edge,-15+bob,2,4,p[1]);px(edge,-12+bob,2,1,p[3]);
    }else{
     px(-5,-16+bob,10,2,p[1]);px(-1,-16+bob,2,1,p[3]);
    }
   }
  }
  shield(false);
 }
 window.MyrrenKezV2Equipment={draw,clean,palette:METALS,colorsFor,order:ORDER};
})();
