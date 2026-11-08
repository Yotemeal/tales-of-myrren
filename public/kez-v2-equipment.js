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
  const shield=(behind)=>{
   const mat=gear[4],p=colorsFor(mat,o.dye);if(!p)return;
   const rear=face==='back',side=face==='side';
   if(behind!==side)return;
   const sx=side?(o.f<0?5:-7):rear?5:-9;
   const sy=-15+bob,w=side?2:rear?4:5,h=side?9:10;
   px(sx,sy,w,h,p[0]);px(sx+1,sy+1,Math.max(1,w-2),h-2,p[1]);
   px(sx+1,sy+1,Math.max(1,w-2),1,p[2]);
   px(sx+1,sy+h-3,Math.max(1,w-2),1,p[3]);
   if(!side){px(sx+Math.floor(w/2),sy+3,1,3,p[3]);px(sx,sy+3,1,3,p[2]);}
  };
  if(phase==='under'){shield(true);return;}
  if(phase!=='over')return;
  // Boots and greaves anchor to the soles; no idle breathing or bob on feet.
  if(gear[3]){
   const mat=gear[3],p=colorsFor(mat,o.dye);
   for(const dx of face==='side'?[-2,1]:[-4,1]){
    px(dx,-3,3,3,p[0]);px(dx+1,-3,2,1,p[2]);px(dx,-1,3,1,p[1]);
    if(mat===6||mat===8)px(dx+1,-2,1,1,p[3]);
   }
  }
  if(gear[2]){
   const p=colorsFor(gear[2],o.dye),delta=walk?(step===1?1:step===3?-1:0):0;
   px(-4+delta,-8,4,5,p[0]);px(0-delta,-8,4,5,p[0]);
   px(-3+delta,-7,2,4,p[1]);px(1-delta,-7,2,4,p[1]);
   px(-3+delta,-7,1,3,p[2]);px(1-delta,-7,1,3,p[3]);
   if(gear[2]===6||gear[2]===8){
    px(-3+delta,-5,3,1,p[3]);px(1-delta,-5,2,1,p[3]);
   }
  }
  if(gear[1]){
   const mat=gear[1],p=colorsFor(mat,o.dye);
   px(-5,-16+bob,10,9,p[0]);px(-4,-15+bob,8,7,p[1]);
   px(-4,-15+bob,8,2,p[2]);px(-4,-9+bob,8,1,p[3]);
   // Paired pauldrons distinguish worn plate from the undershirt.
   px(-6,-15+bob,2,3,p[0]);px(4,-15+bob,2,3,p[0]);
   px(-7,-16+bob,2,2,p[1]);px(5,-16+bob,2,2,p[1]);
   px(-7,-16+bob,2,1,p[2]);px(5,-16+bob,2,1,p[2]);
   if(face==='front'){
    if(mat===2||mat===3){px(-2,-13+bob,4,1,p[3]);px(-1,-12+bob,2,2,p[0]);}
    else if(mat===4||mat===5){px(-2,-14+bob,4,1,p[3]);px(-1,-13+bob,2,3,p[0]);px(-2,-11+bob,4,1,p[2]);}
    else{
     // Obsidianite: amethyst core; Myrrenite/Starsteel: gold V chestplate.
     px(-4,-13+bob,2,1,p[3]);px(2,-13+bob,2,1,p[3]);
     px(-2,-12+bob,4,1,p[3]);px(-1,-11+bob,2,2,mat===7?p[2]:p[0]);
     if(mat===8)px(-1,-11+bob,2,1,p[2]);
    }
   }else if(face==='back')px(-1,-14+bob,2,5,p[3]);
  }
  if(gear[5]){
   const p=colorsFor(gear[5],o.dye);
   px(-7,-12+bob,2,4,p[0]);px(5,-12+bob,2,4,p[0]);
   px(-6,-11+bob,1,3,p[2]);px(6,-11+bob,1,3,p[2]);
   if(gear[5]===6||gear[5]===8){px(-7,-12+bob,2,1,p[3]);px(5,-12+bob,2,1,p[3]);}
  }
  if(gear[0]){
   const mat=gear[0],p=colorsFor(mat,o.dye),closed=CLOSED.has(mat);
   // A narrow crown clears the authored face/eyes. Previously the 5px-high
   // solid helmet cap swallowed the small character's expression.
   px(-5,-24+bob,10,3,p[0]);
   px(-4,-24+bob,8,2,p[1]);
   px(-4,-24+bob,8,1,p[2]);
   px(-5,-21+bob,10,1,p[0]);
   px(-4,-21+bob,8,1,p[3]);
   // Sidepieces are deliberately thin, leaving the centre of the face open.
   if(face==='front'){
    px(-5,-20+bob,2,4,p[0]);px(3,-20+bob,2,4,p[0]);
    px(-4,-19+bob,1,2,p[1]);px(3,-19+bob,1,2,p[1]);
   }else if(face==='side'){
    const near=o.f<0?-5:4,far=o.f<0?4:-5;
    px(far,-19+bob,1,3,p[0]);
    px(near,-20+bob,2,4,p[0]);px(near,-19+bob,1,2,p[1]);
   }else{
    // Backplate is fully enclosed. Avoid two dark patches that looked like
    // eyes on the rear-facing helmet in the last visual QA sheet.
    px(-5,-20+bob,10,5,p[0]);px(-4,-20+bob,8,5,p[1]);
    px(-4,-20+bob,8,1,p[2]);px(-1,-20+bob,2,4,p[3]);
   }
   // Distinct crown profiles follow the seven approved helmet references.
   if(mat===2){px(-3,-25+bob,6,1,p[1]);px(-1,-26+bob,2,1,p[3]);}
   if(mat===3){px(-3,-25+bob,6,1,p[2]);px(-1,-26+bob,2,1,p[1]);}
   if(mat===4){px(-2,-25+bob,4,2,p[2]);px(-1,-26+bob,2,1,p[3]);}
   if(mat===5){px(-3,-25+bob,6,1,p[1]);px(-1,-26+bob,2,2,p[3]);}
   if(closed){
    px(-3,-25+bob,6,2,p[1]);
    px(-1,-26+bob,2,3,p[3]);
    if(mat===6||mat===8){px(-3,-23+bob,6,1,p[3]);px(-1,-26+bob,2,1,p[2]);}
    if(face==='front'){
     // A separate chin/cheek plate retains the underlying eye line, rather
     // than painting the entire face a solid block.
     px(-4,-16+bob,8,2,p[1]);px(-4,-15+bob,8,1,p[0]);
     px(-2,-17+bob,4,1,p[0]);px(-1,-18+bob,2,2,p[3]);
     if(mat===7)px(-3,-16+bob,6,1,p[3]);
     else{px(-4,-16+bob,2,1,p[3]);px(2,-16+bob,2,1,p[3]);}
    }else if(face==='side'){
     const edge=o.f<0?-5:3;
     px(edge,-17+bob,2,2,p[1]);px(edge,-16+bob,2,1,p[3]);
    }else{
     px(-5,-17+bob,10,2,p[1]);
     px(-2,-17+bob,4,1,p[3]);
    }
   }
  }
  shield(false);
 }
 window.MyrrenKezV2Equipment={draw,clean,palette:METALS,colorsFor,order:ORDER};
})();
