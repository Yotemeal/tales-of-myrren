/* V31 independent helmet, shield, Design B chest, legs and boots. Code-authored native pixel layers; no scaling
 * or reslicing of the approved 32x40 animation. Storage item IDs are not used.
 * A cache holds only the material combinations actually drawn.
 */
const V31Equipment = (() => {
  const materials = [null,
    {name:'Leather',base:'#785136',light:'#ba8753',dark:'#493124',edge:'#d4a465',trim:'#956b42'},
    {name:'Bronze',base:'#ba793b',light:'#ecc087',dark:'#704823',edge:'#ffe0a5',trim:'#e0aa66'},
    {name:'Iron',base:'#85898c',light:'#b9bec0',dark:'#45494f',edge:'#e1dfd3',trim:'#c0c0b7'},
    {name:'Steel',base:'#a9b6bc',light:'#dce5e5',dark:'#596972',edge:'#fcf6df',trim:'#e6e6d8'},
    {name:'Black Iron',base:'#41434b',light:'#72727c',dark:'#292a32',edge:'#a29e9d',trim:'#906552'},
    {name:'Myrrenite',base:'#626e60',light:'#a4b29a',dark:'#354438',edge:'#ded9ae',trim:'#bbb58b'}
  ];
  const knees = [
    [[13,34],[19,34]], [[15,34]], [[16,34]], [[13,34],[19,34]],
    [[[14,34],[18,34]],[[14,33],[18,35]],[[13,34],[17,35]],[[14,34],[18,35]]],
    [[[14,35],[21,35]],[[11,35],[22,35]],[[13,35],[19,35]],[[13,35],[19,35]]],
    [[[10,35],[18,35]],[[9,35],[19,35]],[[10,35],[14,35]],[[10,35],[18,35]]],
    [[[13,35],[18,34]],[[13,34],[17,35]],[[13,35],[17,35]],[[13,34],[17,35]]]
  ];
  const clampTier = n => Number.isInteger(+n) && +n > 0 && +n < 7 ? +n : 0;
  // Toe spans match the corrected bare-foot atlas, while boot shafts follow
  // each pose's ankle. Coordinates are local to a cell; y=39 stays clear.
  const feet=[
    [[11,5],[17,5]],[[11,7]],[[14,7]],[[11,5],[17,5]],
    [[[11,6],[17,4]],[[15,6]],[[15,5]],[[14,7]]],
    [[[10,8]],[[8,6],[21,4]],[[10,6]],[[10,6]]],
    [[[14,8]],[[6,6],[17,5]],[[7,6]],[[8,5],[16,6]]],
    [[[11,6]],[[14,6]],[[11,4],[15,5]],[[11,4],[16,5]]]
  ];
  function make(source) {
    const original = document.createElement('canvas');
    original.width=128; original.height=320;
    const oc=original.getContext('2d');oc.drawImage(source,0,0);
    const pixels=oc.getImageData(0,0,128,320).data;
    const cache=new Map();
    const alpha=(x,y,row,frame)=>x>=0&&x<32&&y>=0&&y<40 ? pixels[((row*40+y)*128+frame*32+x)*4+3] : 0;
    function chestLayer(tier,dye) {
      const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
      const c=atlas.getContext('2d');
      const p=Object.assign({},materials[tier],dye&&tier>=4?{base:dye.M,light:dye.H,dark:dye.D}:{});
      // Per-pose upper/lower torso spans. In profile the near hand crosses
      // the belly on alternating steps, so a fixed rectangle would cover it.
      const profiles={
        1:[[14,18,14,17]],2:[[15,19,16,19]],
        5:[[14,18,14,16],[14,18,17,20],[14,18,14,18],[14,18,14,18]],
        6:[[11,15,12,16],[12,17,13,17],[12,16,11,14],[12,17,14,17]]
      };
      const fill=(x,y,col)=>{c.fillStyle=col;c.fillRect(x,y,1,1);};
      for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++){
        const dir=row%4,back=dir===3,side=dir===1||dir===2;
        const ox=frame*32,oy=row*40,top=back?26:25;
        const span=side?profiles[row][row<4?0:frame]:null;
        // Rear torso anchors follow the approved idle and walking poses.
        const rearCenter=row===7?[15,16,15,16][frame]:15;
        const center=side?Math.round((span[0]+span[1])/2):back?rearCenter:(row===4&&frame===1?17:16);
        for(let y=top;y<=31;y++){
          // Fitted torso: inset collar/arm openings, full rib coverage and a
          // short five-pixel hem. Do not funnel the abdomen to a one-pixel bib.
          const half=(y===top||y>=30)?2:3;
          let left=side?(y<29?span[0]:span[2]):center-half;
          let right=side?(y<29?span[1]:span[3]):center+half;
          if(y===31&&side){left++;right--;}
          for(let x=left;x<=right;x++){
            if(!alpha(x,y,row,frame))continue;
            const dx=x-center,dy=y-top;
            let col=p.base;
            const rim=x===left||x===right;
            if(rim)col=p.dark;
            if(y===top)col=(Math.abs(dx)<1)?'#302c32':p.light;
            if(tier===1){
              if(Math.abs(dx)===Math.max(0,3-dy)||back&&Math.abs(dx)===dy-1)col=p.trim;
              if(dy>=4&&dx===0)col=p.edge;
            }else if(tier===2){
              col=dy%2===1?p.dark:((x+(dy>>1))%2?p.base:p.light);
              if(rim)col=p.dark;
            }else if(tier===3){
              if((dy===1||dy===3)&&(Math.abs(dx)===2||side&&x===left+1))col=p.edge;
              if(dy===4)col=p.dark;
            }else if(tier===4){
              if(dx===0)col=p.light;
              if(dy>1&&Math.abs(dx)===Math.max(0,4-dy))col=p.edge;
              if(rim)col=p.dark;
            }else if(tier===5){
              if(dx+3===dy||back&&3-dx===dy)col=p.light;
              if(dy>=4)col=dx===1?p.trim:p.dark;
            }else if(tier===6){
              if(Math.abs(dx)===Math.max(0,3-dy%4))col=p.edge;
              else if(dx===0)col=p.light;
              if(rim)col=p.dark;
            }
            if(y===31)col=p.dark;
            fill(ox+x,oy+y,col);
          }
        }
        // Compact shoulder caps belong to the chest slot, not gloves. Only
        // the original shoulder skin can be covered; hair/neck are untouched.
        if(tier>1){
          const sy=back?26:25;
          const caps=side?[(dir===1?span[1]-1:span[0])-1]:[center-4,center+3];
          const capHeight=side?2:1,capWidth=side?3:2;
          for(const sx of caps)for(let dy=0;dy<capHeight;dy++)for(let dx=0;dx<capWidth;dx++){
            const x=sx+dx,y=sy+dy;
            if(!alpha(x,y,row,frame))continue;
            const i=((oy+y)*128+ox+x)*4;
            if(Math.max(pixels[i],pixels[i+1],pixels[i+2])<100)continue;
            fill(ox+x,oy+y,dy===0?p.light:dx===0||dx===2?p.dark:p.base);
          }
        }
      }
      return atlas;
    }
    function layer(tier,slot,dye) {
      const result=document.createElement('canvas'); result.width=128; result.height=320;
      if(!tier)return result;
      const p=Object.assign({},materials[tier],dye&&tier>=4?{base:dye.M,light:dye.H,dark:dye.D}:{});
      const c=result.getContext('2d'),put=(x,y,col)=>{c.fillStyle=col;c.fillRect(x,y,1,1)};
      for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++){
        const ox=frame*32,oy=row*40,side=row%4===1||row%4===2;
        const centers=row<4?knees[row]:knees[row][frame];
        // Keep the approved shorts' waist contour. A recoloured straight row
        // at y=30 cuts across the belly and hand outlines, especially in profile.
        const waist=side?33:32;
        for(let y=slot==='legs'?waist:35;y<=(slot==='legs'?35:38);y++)for(let x=4;x<28;x++){
          if(!alpha(x,y,row,frame))continue;
          const i=((oy+y)*128+ox+x)*4;
          // Above the knee, recolour only the original dark shorts. This keeps
          // swinging hands and bare torso in front of the waist armour.
          if(slot==='legs' && y<=33){
            const dark=Math.max(pixels[i],pixels[i+1],pixels[i+2])<100;
            if(!dark||x<11||x>21)continue;
          }
          const outer=!alpha(x-1,y,row,frame)||!alpha(x+1,y,row,frame)||
            (y>34&&!alpha(x,y+1,row,frame));
          let color=outer?'#211e23':p.base;
          if(!outer){
            if(slot==='boots'){
              if(y===35)color=tier===5?p.trim:p.dark;
              else if(y===36)color=p.light;
              else if(y===37)color=p.base;
              else color=p.dark;
              // Leather cuff, bronze cap, iron rivets, steel articulation,
              // Black Iron straps and Myrrenite mineral seam.
              if(tier===1&&y===35)color=p.light;
              if(tier===2&&y===37)color=p.light;
              if(tier===3&&y===36&&x%3===0)color=p.edge;
              if(tier===4&&y===37&&x%3===0)color=p.edge;
              if(tier===5&&y===36&&x%3!==0)color=p.dark;
              if(tier===6&&y===37&&x%4===1)color=p.edge;
            }else{
              // Dark cloth joints keep the small metal plates readable; a
              // whole bright trouser rectangle would lose the Design B shapes.
              color='#302c32';
              const edge=Math.min(...centers.map(([kx])=>Math.abs(x-kx)));
              if(tier===1&&edge===1)color=(y+x)%3===0?p.trim:p.base;
              if(tier===2&&edge<=1&&y>=31&&y<=33)color=y===33?p.dark:(x%3===0?p.light:p.base);
              if(tier===3&&edge<=1&&y>=33)color=y===33?p.light:p.base;
              if(tier===4&&edge===0&&y>=32)color=p.light;
              if(tier===5&&edge<=1&&y>=31&&y<=33)color=(x+y)%3===0?p.light:p.base;
              if(tier===6&&edge<=1&&y>=32)color=(x+y)%4===0?p.edge:p.base;
            }
          }
          put(ox+x,oy+y,color);
        }
        if(slot==='legs'){
          const back=row%4===3;
          // Compact knee motifs are clipped to the original animated leg,
          // so no fixed feet or extra limbs can be introduced by equipment.
          for(const [kx,ky] of centers)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const x=kx+dx,y=ky+dy;
            if(y<33||y>35)continue;
            if(!alpha(x,y,row,frame)&&!alpha(x-1,y,row,frame)&&!alpha(x+1,y,row,frame))continue;
            const motifs=[null,['m.d','dhm','.md'],['hhh','mmm','ddd'],
              ['ehe','mmm','ede'],['.h.','hmd','.d.'],['hdd','mhd','ddm'],['.e.','emh','.d.']];
            const token=motifs[tier][dy+1][dx+1];if(token==='.')continue;
            let col={m:p.base,h:p.light,d:p.dark,e:p.edge}[token];
            if(back)col=dy===0?p.dark:p.base;
            put(ox+x,oy+y,col);
          }
        }else{
          const spans=row<4?feet[row]:feet[row][frame];
          for(const [x,width] of spans){
            // One authored toe cap and one sole, replacing the foot endpoint
            // in place. No copied source rows or extended 42px frames.
            for(let dx=0;dx<width;dx++){
              put(ox+x+dx,oy+37,dx===0||dx===width-1?'#211e23':p.base);
              put(ox+x+dx,oy+38,'#211e23');
              if(dx>0&&dx<width-1)put(ox+x+dx,oy+36,
                tier===1?p.trim:tier===5?p.dark:p.light);
              if((tier===3||tier===4||tier===6)&&dx===Math.floor(width/2))put(ox+x+dx,oy+37,p.edge);
            }
          }
        }
      }
      return result;
    }
    // Helmets replace only the head region. The approved face is copied into
    // open helmets; neck, chest, arms, legs and foot padding are never resliced.
    const headCenters=[[16,16,16,16],[16,16,16,16],[16,16,16,16],[15,15,15,15],
      [15,16,15,15],[16,16,15,15],[15,16,15,16],[15,15,15,15]];
    const shieldAnchors=[[[8,29]],[[10,29]],[[23,29]],[[24,29]],
      [[8,28],[9,30],[8,30],[8,28]],[[10,29],[10,30],[9,29],[10,29]],
      [[22,29],[23,28],[22,29],[23,28]],[[23,28],[24,30],[23,30],[24,28]]];
    function helmetBase(tier,dye){
      const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
      const c=atlas.getContext('2d');c.drawImage(original,0,0);
      const p=Object.assign({},materials[tier],dye&&tier>=4?{base:dye.M,light:dye.H,dark:dye.D}:{});
      if(tier===6)Object.assign(p,{base:'#67806d',light:'#bfd1a2',dark:'#334e43',edge:'#f1e6af'});
      const ink='#24212b',gem=tier===5?'#e9a46b':'#83e3cf',gemD=tier===5?'#985b48':'#418c85';
      for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++){
        const ox=frame*32,oy=row*40,dir=row%4,side=dir===1||dir===2,back=dir===3,cx=headCenters[row][frame],s=dir===1?-1:1;
        // Row 24 is the original neck/under-jaw outline, including dark pixels.
        // Keep it intact: skin-only face reconstruction cannot recover it.
        c.clearRect(ox,oy,32,24);
        const put=(x,y,col)=>{x=Math.round(x);y=Math.round(y);if(x<0||x>31||y<0||y>24)return;c.fillStyle=col;c.fillRect(ox+x,oy+y,1,1)};
        const r=(x,y,w,h,col)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)put(cx+Math.round((x+xx)*(side?.78:1)),y+yy,col)};
        const line=(x0,y0,x1,y1,col,w=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)r(x0+(x1-x0)*i/(n||1),y0+(y1-y0)*i/(n||1),w,w,col)};
        // Preserve the actual face, including eyes between the skin pixels.
        if(!back)for(let y=17;y<24;y++){
          let left=32,right=-1;
          for(let x=0;x<32;x++){const i=((oy+y)*128+ox+x)*4;if(pixels[i+3]&&pixels[i]>110&&pixels[i]>pixels[i+1]*1.1&&pixels[i+1]>pixels[i+2]*1.05){left=Math.min(left,x);right=Math.max(right,x)}}
          if(right>=left){put(left-1,y,ink);put(right+1,y,ink);for(let x=left;x<=right;x++){const i=((oy+y)*128+ox+x)*4;put(x,y,'rgb('+pixels[i]+','+pixels[i+1]+','+pixels[i+2]+')')}}
        }
        const dome=(top,width=9)=>{
          const spans=[3,5,7,width,width,width,width,width,width];
          spans.forEach((half,i)=>r(-half,top+i,half*2+1,1,ink));
          spans.forEach((half,i)=>{if(i>0)r(-half+1,top+i,half*2-1,1,p.base)});
          r(-2,top+2,4,5,p.light);r(2,top+3,3,5,p.base);r(-width+2,top+6,width*2-3,2,p.dark);
          r(-5,top+2,4,2,p.light);r(-6,top+4,2,3,p.light);r(5,top+4,3,4,p.dark);
          r(-width,top+8,width*2+1,2,ink);r(-width+1,top+8,width*2-1,1,p.light);
        };
        const cheek=(x,top=18,h=6)=>{r(x,top,3,h,ink);r(x+1,top,1,h-1,p.base);r(x,top,2,1,p.light)};
        const crestMove=[0,1,0,-1][frame];
        if(tier===1){
          // A pointed, stitched leather cowl with an open face and folded tail.
          dome(8,8);r(-6,8,10,2,p.dark);r(-3,7,5,2,ink);r(-2,8,3,1,p.light);
          if(back){r(-7,17,15,7,ink);r(-6,17,13,6,p.base);r(-1,12,1,11,p.trim);r(-3,21,6,2,p.dark)}
          else if(side){cheek(-s*6,17,7);r(s*3,16,4,2,p.dark);r(-s*6-1,19,2,5,p.light);r(s*6,17,2,1,p.trim)}
          else{cheek(-8,17,7);cheek(6,17,7);r(-5,16,11,1,p.trim);for(let x=-5;x<=5;x+=2)r(x,15,1,1,p.edge)}
          r(-5,11,1,2,p.trim);r(0,9,1,2,p.trim);
        }else if(tier===2){
          // Classical bronze helmet: tall oxblood horsehair crest and cheek leaves.
          if(side){for(let k=0;k<8;k++){r(-s*(6-k)+crestMove,4+k%3,2,6,'#4b2930');r(-s*(6-k)+crestMove,4+k%3,1,2,'#a85348')}r(-1,6,3,7,p.dark)}
          else{r(-1,3,3,10,ink);r(0,4,2,7,'#a85348');r(0,5,1,4,'#d78a63');if(back)r(-2,6,1,6,'#6b3434')}
          dome(9,9);
          if(back){r(-8,18,17,6,ink);r(-7,18,15,5,p.base);r(-6,21,13,2,p.dark);r(-1,11,2,11,p.light)}
          else if(side){cheek(-s*5,18);r(s*6,16,2,5,p.dark);r(s*7,19,1,3,p.edge);r(s*4,17,3,1,p.edge)}
          else{cheek(-8,18);cheek(6,18);r(-1,16,3,7,ink);r(0,17,1,5,p.light);r(-6,16,13,1,p.edge)}
          r(-6,12,2,1,p.edge);
        }else if(tier===3){
          // Broad iron barbute: squared brow, a T visor and riveted temple plates.
          dome(9,10);r(-7,10,15,2,p.base);r(-4,9,8,1,p.light);
          r(-10,15,3,6,ink);r(8,15,3,6,ink);r(-9,16,2,3,p.dark);r(8,16,2,3,p.dark);
          if(back){r(-8,18,17,7,ink);r(-7,18,15,6,p.base);r(-6,21,13,1,p.dark);r(-1,12,2,11,p.light)}
          else if(side){r(-7,18,15,6,ink);r(-6,19,12,4,p.base);r(s*3,17,5,2,ink);r(s*6,18,1,4,ink);r(-s*5,19,2,3,p.light);r(s*2,23,4,1,p.dark)}
          else{r(-8,18,17,6,ink);r(-7,19,15,4,p.base);r(-6,17,13,2,ink);r(-1,18,3,5,ink);r(-7,20,2,3,p.light);r(6,20,2,3,p.dark);r(-6,23,4,1,p.dark);r(3,23,4,1,p.dark)}
          r(-8,14,1,1,p.edge);r(8,14,1,1,p.edge);
        }else if(tier===4){
          // Winged steel armet, ivory plume and a closed articulated visor.
          if(side){for(let k=0;k<7;k++){r(-s*k+crestMove,3+Math.floor(k/2),2,5,'#576b79');r(-s*k+crestMove,3+Math.floor(k/2),1,2,'#d9e7db')}}
          else{r(-1,1,3,9,ink);r(0,2,1,7,'#dfe9de');r(1,4,1,5,'#8da9b2')}
          dome(8,9);
          for(const d of (side?[-s]:[-1,1])){line(d*7,14,d*12,8,ink,2);line(d*8,14,d*12,9,p.light);line(d*8,15,d*10,12,p.edge)}
          r(-8,18,17,6,ink);r(-7,18,15,5,p.base);
          if(back){r(-1,11,2,12,p.edge);r(-6,21,13,2,p.dark)}
          else if(side){r(s*3,17,5,2,ink);r(s*2,20,5,1,p.dark);r(-s*5,19,3,3,p.light);r(s*5,21,1,1,p.edge);r(s*7,18,1,3,p.edge)}
          else{r(-6,17,13,2,ink);r(-6,16,13,1,p.edge);r(0,19,1,4,p.light);r(-4,21,1,2,p.dark);r(4,21,1,2,p.dark);r(-6,23,13,1,p.dark)}
          r(-4+(frame%3),11,2,1,p.edge);
        }else if(tier===5){
          // Black Iron war crown: broken prongs, hooked horns and ember eye slits.
          dome(8,9);
          for(const d of (side?[-s]:[-1,1])){line(d*6,12,d*10,5,ink,3);line(d*10,5,d*11,2,ink,2);line(d*7,11,d*10,5,p.base,2);line(d*10,5,d*11,3,p.light);r(d<0?-7:6,6,2,6,p.trim)}
          r(-2,5,5,5,ink);r(-1,4,3,6,p.base);r(0,3,1,6,p.light);
          r(-9,17,19,7,ink);r(-8,18,17,5,p.base);r(-7,22,15,2,p.dark);
          if(back){r(-1,11,2,12,p.trim);for(let k=0;k<3;k++){r(-6+k*6,19,1,3,p.light)}r(-3,22,7,1,p.trim)}
          else if(side){r(s*2,17,6,3,ink);r(s*3,18,4,1,frame%2?gem:gemD);r(-s*6,19,3,3,p.light);r(s*6,21,2,3,p.trim)}
          else{r(-7,17,15,3,ink);r(-6,18,4,1,frame%2?gem:gemD);r(3,18,4,1,frame%2?gem:gemD);r(-1,18,3,6,p.dark);r(0,18,1,4,p.trim);r(-8,21,3,3,p.light);r(6,21,3,3,p.light)}
          r(-5,12,2,1,p.light);r(5,15,2,1,p.trim);
        }else{
          // Myrrenite's sovereign crown: three mineral blades and sweeping gold leaves.
          dome(8,9);
          for(const [dx,top] of [[-5,3],[0,0],[5,3]]){r(dx,top,1,1,p.edge);r(dx-1,top+1,3,7,ink);r(dx,top+1,1,6,gem);r(dx-1,top+3,1,4,p.light);r(dx+1,top+3,1,5,p.dark);r(dx-2,top+6,5,3,ink);r(dx-1,top+6,3,2,p.light);r(dx,top+6,1,2,p.edge)}
          for(const d of (side?[-s]:[-1,1])){line(d*6,14,d*12,6,ink,2);line(d*7,13,d*12,7,p.edge);line(d*7,15,d*12,11,ink,2);line(d*8,14,d*12,11,p.light);r(d<0?-12:11,5,2,2,p.edge)}
          r(-5,12,11,4,p.base);r(-4,12,2,1,p.edge);r(3,12,2,1,p.edge);r(-3,13,2,1,p.edge);r(2,13,2,1,p.edge);r(-1,14,3,1,p.edge);
          r(-8,17,17,7,ink);r(-7,18,15,5,p.base);r(-5,22,11,2,p.dark);
          if(back){r(-1,11,2,12,p.edge);r(-5,20,11,1,p.light);r(-3,22,7,1,p.edge);r(0,16,1,3,gem)}
          else if(side){r(s*2,17,6,2,ink);r(s*3,18,4,1,gem);r(-s*5,19,3,3,p.light);r(s*5,20,1,3,p.edge)}
          else{r(-6,17,13,2,ink);r(-5,18,3,1,gem);r(3,18,3,1,gem);r(0,18,1,6,p.edge);r(-5,20,2,2,p.light);r(4,20,2,2,p.light);r(-3,22,7,1,p.edge)}
          r(-1,11,3,4,ink);r(0,11,1,3,frame===1||frame===2?'#d0fff0':gem);r(-4+(frame*3)%9,9,1,1,'#f3f9cf');
        }
      }
      return atlas;
    }
    const shieldShapes=[null,
      ['...#####...','..#######..','.#########.','###########','###########','###########','###########','###########','.#########.','..#######..','...#####...'],
      ['##.........##','###.......###','#####...#####','.###########.','.###########.','.###########.','.###########.','..#########..','..#########..','...#######...','....#####....','.....###.....','......#......'],
      ['..#######..','.#########.','###########','###########','###########','###########','###########','.#########.','.#########.','..#######..','..#######..','...#####...','....###....','.....#.....'],
      ['.....#.....','...#####...','..#######..','.#########.','###########','###########','###########','###########','.#########.','.#########.','..#######..','..#######..','...#####...','...#####...','....###....','....###....','.....#.....'],
      ['..#..###..#..','.###########.','#############','.###########.','.###########.','#############','.###########.','.###########.','#############','.###########.','.###########.','#############','..#########..','..#########..','...#######...','....#####....','.....###.....','......#......'],
      ['.......#.......','...#..###..#...','..###########..','.#############.','###############','.#############.','..###########..','..###########..','...#########...','...#########...','....#######....','....#######....','.....#####.....','.....#####.....','......###......','......###......','.......#.......','.......#.......']];
    function shieldLayer(tier,dye,action,far){
      const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;const c=atlas.getContext('2d');
      const p=Object.assign({},materials[tier],dye&&tier>=4?{base:dye.M,light:dye.H,dark:dye.D}:{}),mask=shieldShapes[tier],w=mask[0].length,h=mask.length;
      for(let row=0;row<8;row++)for(let frame=0;frame<4;frame++){
        const dir=row%4,isFar=dir===2;if(isFar!==far)continue;
        const back=dir===3,side=dir===1||dir===2,anchor=shieldAnchors[row][row<4?0:frame],brace=action===1||action===2;
        const ax=anchor[0]+(brace?(dir===0?1:dir===1?-1:dir===2?1:-1):0),ay=anchor[1]-(brace?(action===2?2:1):0);
        const ox=frame*32,oy=row*40,top=ay-Math.floor(h/2),half=Math.floor(w/2),occupied=(x,y)=>y>=0&&y<h&&x>=0&&x<w&&mask[y][x]==='#';
        for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(occupied(xx,yy)){
          const edge=!occupied(xx-1,yy)||!occupied(xx+1,yy)||!occupied(xx,yy-1)||!occupied(xx,yy+1),dx=xx-half;
          let col='#24212b';
          if(!edge){
            col=back?(tier===1?'#6c4935':p.dark):p.base;
            if(back){if(Math.abs(dx-yy/3+h/6)<1||Math.abs(dx+yy/3-h/6)<1)col='#ad865b';if(Math.abs(dx)<=1&&Math.abs(yy-h/2)<2)col=p.light}
            else if(tier===1){col=xx%3===0?'#49372d':'#956c43';if(Math.abs(yy-h/2)<1)col='#b89462';if(dx*dx+(yy-5)**2<6)col=dx<0?p.light:p.dark}
            else if(tier===2){if(Math.abs(dx)===2||yy===5||yy===h-4)col=p.light;if(dx*dx+(yy-6)**2<4)col=p.edge;if(Math.abs(dx)>3&&yy<6)col=p.dark}
            else if(tier===3){if(Math.abs(dx)===3)col=p.light;if((xx===2||xx===w-3)&&yy%4===1)col=p.edge;if(yy>5&&Math.abs(dx)===Math.max(0,4-Math.floor((yy-5)/2)))col=p.dark}
            else if(tier===4){if(dx===0)col=p.edge;else if(Math.abs(dx)===Math.max(1,4-Math.floor(Math.abs(yy-5)/3)))col=p.light;if(yy===5&&Math.abs(dx)<4)col=p.trim}
            else if(tier===5){if(dx+4===Math.floor(yy/2)||dx===1&&yy>3)col=p.trim;if(Math.abs(dx)>3)col=p.dark;if(dx===0&&yy>4&&yy<12)col=frame%2?'#e8a46b':'#ae7057'}
            else{if(Math.abs(dx)===Math.max(1,5-Math.floor(yy/3)))col=p.edge;else if(dx===0)col=p.light;if(Math.abs(dx)<2&&yy>4&&yy<12)col=(frame+yy)%4===0?'#c7fff0':'#6fc9b5'}
          }else if(xx>0&&yy>0&&yy<h-1&&occupied(xx,yy+1)&&!occupied(xx,yy-1))col=p.light;
          const px=side?ax+Math.round((xx-half)*(isFar?.22:.36)):ax+xx-half,py=top+yy;
          if(px<0||px>31||py<16||py>38)continue;c.fillStyle=col;c.fillRect(ox+px,oy+py,1,1);
        }
        if(!isFar){const hx=side?ax+2:back?ax-4:ax+4,hy=ay-1;if(hx>=0&&hx<31){c.fillStyle='#d8a17b';c.fillRect(ox+hx,oy+hy,2,2);c.fillStyle='#6a483b';c.fillRect(ox+hx,oy+hy+2,2,1)}}
      }
      return atlas;
    }

    function get(legs,boots,dye,body=0,head=0,shield=0,action=0) {
      legs=clampTier(legs);boots=clampTier(boots);body=clampTier(body);head=clampTier(head);shield=clampTier(shield);action=Number.isInteger(action)&&action>=0&&action<4?action:0;
      if(!legs&&!boots&&!body&&!head&&!shield)return source;
      const key=head+':'+shield+':'+action+':'+body+':'+legs+':'+boots+':'+(dye?[dye.M,dye.H,dye.D].join(','):'');
      if(cache.has(key))return cache.get(key);
      const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
      const c=atlas.getContext('2d');
      if(shield)c.drawImage(shieldLayer(shield,dye,action,true),0,0);
      c.drawImage(head?helmetBase(head,dye):original,0,0);
      if(boots)c.drawImage(layer(boots,'boots',dye),0,0);
      if(legs)c.drawImage(layer(legs,'legs',dye),0,0);
      if(body)c.drawImage(chestLayer(body,dye),0,0);
      if(shield)c.drawImage(shieldLayer(shield,dye,action,false),0,0);
      // Bound recolour cache even after many master-dye combinations.
      if(cache.size>=64)cache.delete(cache.keys().next().value);
      cache.set(key,atlas);return atlas;
    }
    const icons=new Map();
    function icon(kind,tier,size=32,dye=null){
      tier=clampTier(tier);if(!tier||kind!=='helm'&&kind!=='shield')return '';
      const key=kind+':'+tier+':'+(dye?[dye.M,dye.H,dye.D].join(','):'');
      if(!icons.has(key)){
        const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
        if(kind==='helm')c.drawImage(helmetBase(tier,dye),0,0,32,25,0,3,32,25);
        else c.drawImage(shieldLayer(tier,dye,0,false),0,20,16,19,8,6,16,19);
        if(icons.size>=64)icons.delete(icons.keys().next().value);
        const pixels=c.getImageData(0,0,32,32).data;let left=32,top=32,right=0,bottom=0;
        for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(pixels[(y*32+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
        const result=document.createElement('canvas');result.width=32;result.height=32;const rc=result.getContext('2d');rc.imageSmoothingEnabled=false;
        const w=right-left+1,h=bottom-top+1,scale=Math.min(28/w,28/h),dw=Math.round(w*scale),dh=Math.round(h*scale);
        rc.drawImage(canvas,left,top,w,h,Math.floor((32-dw)/2),Math.floor((32-dh)/2),dw,dh);
        icons.set(key,result.toDataURL('image/png'));
      }
      return '<img width="'+size+'" height="'+size+'" style="image-rendering:pixelated" aria-hidden="true" src="'+icons.get(key)+'">';
    }
    return {get,icon};
  }
  return {make,materials,designs:[null,{helmet:'Trailwarden cowl',shield:'Timber buckler'},{helmet:'Suncrest helm',shield:'Crescent pelta'},{helmet:'Iron Sentinel',shield:'Riveted heater'},{helmet:'Winged armet',shield:'Heraldic kite'},{helmet:'Dreadcrown',shield:'Spiked bulwark'},{helmet:'Sovereign crown',shield:'Prismatic aegis'}]};
})();


