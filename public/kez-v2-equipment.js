/* Kez V2 wearable pixel layers. 21x27 native-cell geometry, independent of saves
 * and combat. These are compact fitted representations of the approved metal
 * palettes, not resized full-body reference pictures.
 * Gear order: head, body, legs, boots, shield, gloves.
 */
(()=>{'use strict';
 const METALS={
  2:['#4a281f','#ad633a','#f1b873','#d99547'],
  3:['#34303e','#8e879e','#ddd6e3','#b1acbd'],
  4:['#343244','#aaa7bc','#f4efff','#dddcea'],
  5:['#211c29','#4b3c50','#9d7a7d','#a77967'],
  7:['#201b28','#47303e','#a75c65','#ef535c'],
  6:['#241b3b','#675296','#b99bf0','#a482ed'],
  8:['#343a55','#aac7e3','#f5fcff','#78ddff']
 };
 const PART_COUNT=6;
 function clean(gear){
  const g=Array.isArray(gear)?gear:[];
  return Array.from({length:PART_COUNT},(_,i)=>{
   const n=g[i];return Number.isInteger(n)&&Object.prototype.hasOwnProperty.call(METALS,n)?n:0;
  });
 }
 function draw(ctx,x,y,o,phase='front'){
  const g=clean(o.g);if(!g.some(Boolean))return;
  const face=o.dv==='u'?'back':o.dv==='s'?'side':'front';
  const walk=!!o.moving,step=walk?Math.floor((o.now||0)/130)%4:0;
  const bob=walk&&(step===1||step===3)?-1:0;
  // All coordinates are integer offsets from the planted soles. No scaling.
  const px=(dx,dy,w,h,c)=>{
   if(!c||w<=0||h<=0)return;
   ctx.fillStyle=c;ctx.fillRect(Math.round(x)+dx,Math.round(y)+dy,w,h);
  };
  const shield=(behind)=>{
   const p=METALS[g[4]];if(!p)return;
   const rear=face==='back',side=face==='side';
   if(behind!==side)return;
   const sx=side?(o.f<0?5:-7):rear?5:-9,sy=-15+bob,w=side?2:rear?4:5,h=side?9:10;
   px(sx,sy,w,h,p[0]);px(sx+1,sy+1,Math.max(1,w-2),h-2,p[1]);
   px(sx+1,sy+1,Math.max(1,w-2),1,p[2]);
   px(sx+1,sy+h-3,Math.max(1,w-2),1,p[3]);
   if(!side)px(sx+Math.floor(w/2),sy+3,1,3,p[3]);
  };
  if(phase==='under'){shield(true);return;}
  if(phase!=='over')return;
  if(g[3]){const p=METALS[g[3]];
   for(const dx of face==='side'?[-2,1]:[-4,1]){
    px(dx,-3,3,3,p[0]);px(dx+1,-3,2,1,p[2]);px(dx,-1,3,1,p[1]);
   }
  }
  if(g[2]){const p=METALS[g[2]],delta=walk?(step===1?1:step===3?-1:0):0;
   px(-4+delta,-8,4,5,p[0]);px(0-delta,-8,4,5,p[0]);
   px(-3+delta,-7,2,4,p[1]);px(1-delta,-7,2,4,p[1]);
   px(-3+delta,-7,1,3,p[2]);px(1-delta,-7,1,3,p[3]);
  }
  if(g[1]){const p=METALS[g[1]];
   px(-5,-16+bob,10,9,p[0]);px(-4,-15+bob,8,7,p[1]);
   px(-4,-15+bob,8,2,p[2]);px(-4,-9+bob,8,1,p[3]);
   px(-6,-15+bob,2,3,p[0]);px(4,-15+bob,2,3,p[0]);
   if(face==='front'){px(-2,-13+bob,4,1,p[3]);px(-1,-12+bob,2,2,p[0]);}
   else if(face==='back')px(-1,-14+bob,2,5,p[3]);
  }
  if(g[5]){const p=METALS[g[5]];
   px(-7,-12+bob,2,4,p[0]);px(5,-12+bob,2,4,p[0]);
   px(-6,-11+bob,1,3,p[2]);px(6,-11+bob,1,3,p[2]);
  }
  if(g[0]){const p=METALS[g[0]],high=g[0]>=5;
   px(-5,-23+bob,10,5,p[0]);px(-4,-23+bob,8,2,p[1]);
   px(-4,-22+bob,8,1,p[2]);px(-5,-19+bob,10,1,p[3]);
   if(face==='front'){px(-5,-18+bob,2,3,p[1]);px(3,-18+bob,2,3,p[1]);}
   else if(face==='side'){px(o.f<0?-5:4,-18+bob,1,3,p[1]);}
   if(high){px(-1,-25+bob,2,2,p[3]);px(-2,-24+bob,1,2,p[2]);}
  }
  shield(false);
 }
 window.MyrrenKezV2Equipment={draw,clean,palette:METALS,order:[2,3,4,5,7,6,8]};
})();
