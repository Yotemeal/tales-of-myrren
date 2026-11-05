/* Design B chest, legs and boots. Code-authored native pixel layers; no scaling
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
        const center=side?Math.round((span[0]+span[1])/2):(row===4&&frame===1?17:16);
        for(let y=top;y<=31;y++){
          let left=side?(y<29?span[0]:span[2]):center-3;
          let right=side?(y<29?span[1]:span[3]):center+3;
          // Short tapered hem meets the original waist without painting a
          // wide belt across it. It never reaches the approved leg artwork.
          if(y===30&&!side){left++;right--;}
          if(y===31){left++;right--;}
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
          const caps=side?[(dir===1?span[1]-1:span[0])-1]:[center-5,center+3];
          for(const sx of caps)for(let dy=0;dy<2;dy++)for(let dx=0;dx<3;dx++){
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
    function get(legs,boots,dye,body=0) {
      legs=clampTier(legs);boots=clampTier(boots);body=clampTier(body);
      if(!legs&&!boots&&!body)return source;
      const key=body+':'+legs+':'+boots+':'+(dye?[dye.M,dye.H,dye.D].join(','):'');
      if(cache.has(key))return cache.get(key);
      const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
      const c=atlas.getContext('2d');c.drawImage(original,0,0);
      if(boots)c.drawImage(layer(boots,'boots',dye),0,0);
      if(legs)c.drawImage(layer(legs,'legs',dye),0,0);
      if(body)c.drawImage(chestLayer(body,dye),0,0);
      // Bound recolour cache even after many master-dye combinations.
      if(cache.size>=64)cache.delete(cache.keys().next().value);
      cache.set(key,atlas);return atlas;
    }
    return {get};
  }
  return {make,materials};
})();
