/* Approved seven-metal armour. Composites onto the locked hero poses; never cuts
 * pixels out of the body. Material IDs 1–6 remain compatible with existing saves. */
(()=>{'use strict';
 const order=[2,3,4,5,7,6,8],frames=[{"row":0,"col":0,"x":6,"y":6,"w":52,"h":51},{"row":0,"col":1,"x":70,"y":6,"w":51,"h":52},{"row":0,"col":2,"x":134,"y":11,"w":52,"h":42},{"row":0,"col":3,"x":198,"y":6,"w":51,"h":52},{"row":0,"col":4,"x":262,"y":6,"w":51,"h":52},{"row":0,"col":5,"x":326,"y":6,"w":51,"h":52},{"row":0,"col":6,"x":390,"y":6,"w":51,"h":52},{"row":1,"col":0,"x":6,"y":70,"w":52,"h":51},{"row":1,"col":1,"x":71,"y":70,"w":50,"h":52},{"row":1,"col":2,"x":135,"y":70,"w":50,"h":52},{"row":1,"col":3,"x":200,"y":70,"w":48,"h":52},{"row":1,"col":4,"x":263,"y":70,"w":50,"h":52},{"row":1,"col":5,"x":327,"y":70,"w":50,"h":52},{"row":1,"col":6,"x":392,"y":70,"w":48,"h":52},{"row":2,"col":0,"x":6,"y":135,"w":52,"h":50},{"row":2,"col":1,"x":70,"y":134,"w":52,"h":51},{"row":2,"col":2,"x":134,"y":135,"w":52,"h":49},{"row":2,"col":3,"x":198,"y":134,"w":52,"h":51},{"row":2,"col":4,"x":262,"y":136,"w":52,"h":48},{"row":2,"col":5,"x":326,"y":134,"w":52,"h":51},{"row":2,"col":6,"x":390,"y":134,"w":52,"h":51},{"row":3,"col":0,"x":6,"y":204,"w":52,"h":39},{"row":3,"col":1,"x":70,"y":206,"w":52,"h":35},{"row":3,"col":2,"x":134,"y":206,"w":52,"h":35},{"row":3,"col":3,"x":198,"y":206,"w":52,"h":36},{"row":3,"col":4,"x":262,"y":203,"w":52,"h":41},{"row":3,"col":5,"x":326,"y":203,"w":52,"h":41},{"row":3,"col":6,"x":390,"y":203,"w":52,"h":41},{"row":4,"col":0,"x":10,"y":262,"w":44,"h":52},{"row":4,"col":1,"x":74,"y":262,"w":43,"h":52},{"row":4,"col":2,"x":138,"y":262,"w":43,"h":52},{"row":4,"col":3,"x":203,"y":262,"w":41,"h":52},{"row":4,"col":4,"x":267,"y":262,"w":42,"h":52},{"row":4,"col":5,"x":331,"y":262,"w":42,"h":52},{"row":4,"col":6,"x":394,"y":262,"w":43,"h":52},{"row":5,"col":0,"x":6,"y":330,"w":52,"h":43},{"row":5,"col":1,"x":70,"y":333,"w":52,"h":38},{"row":5,"col":2,"x":134,"y":333,"w":52,"h":38},{"row":5,"col":3,"x":198,"y":329,"w":52,"h":45},{"row":5,"col":4,"x":262,"y":329,"w":52,"h":45},{"row":5,"col":5,"x":326,"y":329,"w":52,"h":45},{"row":5,"col":6,"x":390,"y":330,"w":52,"h":44}];
 const limbFrames=[{"row":0,"col":0,"x":5,"y":6,"w":54,"h":52},{"row":0,"col":1,"x":69,"y":16,"w":54,"h":31},{"row":0,"col":2,"x":133,"y":15,"w":54,"h":33},{"row":0,"col":3,"x":197,"y":9,"w":54,"h":46},{"row":0,"col":4,"x":261,"y":9,"w":54,"h":46},{"row":0,"col":5,"x":325,"y":15,"w":54,"h":33},{"row":0,"col":6,"x":389,"y":8,"w":54,"h":48},{"row":1,"col":0,"x":11,"y":69,"w":41,"h":54},{"row":1,"col":1,"x":76,"y":69,"w":39,"h":54},{"row":1,"col":2,"x":140,"y":69,"w":40,"h":54},{"row":1,"col":3,"x":204,"y":69,"w":40,"h":54},{"row":1,"col":4,"x":268,"y":69,"w":40,"h":54},{"row":1,"col":5,"x":332,"y":69,"w":39,"h":54},{"row":1,"col":6,"x":395,"y":69,"w":41,"h":54},{"row":2,"col":0,"x":5,"y":135,"w":54,"h":50},{"row":2,"col":1,"x":69,"y":145,"w":54,"h":30},{"row":2,"col":2,"x":133,"y":144,"w":54,"h":31},{"row":2,"col":3,"x":197,"y":138,"w":54,"h":44},{"row":2,"col":4,"x":261,"y":138,"w":54,"h":44},{"row":2,"col":5,"x":325,"y":144,"w":54,"h":31},{"row":2,"col":6,"x":389,"y":137,"w":54,"h":45},{"row":3,"col":0,"x":20,"y":197,"w":24,"h":54},{"row":3,"col":1,"x":84,"y":197,"w":24,"h":54},{"row":3,"col":2,"x":148,"y":197,"w":24,"h":54},{"row":3,"col":3,"x":212,"y":197,"w":24,"h":54},{"row":3,"col":4,"x":276,"y":197,"w":24,"h":54},{"row":3,"col":5,"x":340,"y":197,"w":24,"h":54},{"row":3,"col":6,"x":404,"y":197,"w":24,"h":54},{"row":4,"col":0,"x":5,"y":268,"w":54,"h":40},{"row":4,"col":1,"x":69,"y":276,"w":54,"h":23},{"row":4,"col":2,"x":133,"y":268,"w":54,"h":39},{"row":4,"col":3,"x":197,"y":268,"w":54,"h":39},{"row":4,"col":4,"x":261,"y":268,"w":54,"h":39},{"row":4,"col":5,"x":325,"y":268,"w":54,"h":39},{"row":4,"col":6,"x":389,"y":269,"w":54,"h":38},{"row":5,"col":0,"x":13,"y":325,"w":38,"h":54},{"row":5,"col":1,"x":77,"y":325,"w":37,"h":54},{"row":5,"col":2,"x":141,"y":325,"w":38,"h":54},{"row":5,"col":3,"x":205,"y":325,"w":38,"h":54},{"row":5,"col":4,"x":268,"y":325,"w":39,"h":54},{"row":5,"col":5,"x":333,"y":325,"w":38,"h":54},{"row":5,"col":6,"x":396,"y":325,"w":39,"h":54}];
 const colors={2:['#4a281f','#ad633a','#f1b873','#d99547'],3:['#34303e','#8e879e','#ddd6e3','#b1acbd'],4:['#343244','#aaa7bc','#f4efff','#dddcea'],5:['#211c29','#4b3c50','#9d7a7d','#a77967'],7:['#201b28','#47303e','#a75c65','#ef535c'],6:['#241b3b','#675296','#b99bf0','#a482ed'],8:['#343a55','#aac7e3','#f5fcff','#78ddff']};
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 let ready=false,parts=null,limbArt=null;const caches=new WeakMap(),icons=new Map(),pieceCache=new Map();
 const image=new Image();image.onload=()=>{if((image.naturalWidth||image.width)!==448||(image.naturalHeight||image.height)!==384)return;parts=image;ready=!!limbArt;window.dispatchEvent?.(new Event('myrren-armour-ready'))};image.src='/armour-parts-v1.png';
 const limbs=new Image();limbs.onload=()=>{if((limbs.naturalWidth||limbs.width)!==448||(limbs.naturalHeight||limbs.height)!==384)return;limbArt=limbs;ready=!!parts};limbs.src='/armour-limbs-v2.png';
 function palette(mat,dye){const p=colors[mat===1?2:mat]||colors[2];return dye&&mat>=4?[dye.D,dye.M,dye.H,p[3]]:p}
 function part(row,mat,dye){
  mat=mat===1?2:mat;const key=[row,mat,dye?.M].join('/');if(pieceCache.has(key))return pieceCache.get(key);
  const f=(row>=6?limbFrames:frames)[(row>=6?row-6:row)*7+order.indexOf(mat)];if(!f)return null;
  const c=canvas(f.w,f.h),ctx=c.getContext('2d');ctx.drawImage(row>=6?limbArt:parts,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  if(dye&&mat>=4){const d=ctx.getImageData(0,0,c.width,c.height),p=palette(mat,dye).slice(0,3).map(h=>h.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)));for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];if(!d.data[i+3]||Math.max(r,g,b)-Math.min(r,g,b)>65)continue;const shade=p[Math.max(r,g,b)<65?0:Math.max(r,g,b)>155?2:1];d.data[i]=shade[0];d.data[i+1]=shade[1];d.data[i+2]=shade[2]}ctx.putImageData(d,0,0)}
  pieceCache.set(key,c);return c;
 }
 function shield(mat,dye){const c=canvas(13,17),x=c.getContext('2d'),p=palette(mat,dye);x.imageSmoothingEnabled=false;
  const shapes={2:[[6,1],[10,3],[12,7],[10,12],[6,15],[2,12],[0,7],[2,3]],3:[[1,1],[11,1],[11,9],[9,13],[6,16],[3,13],[1,9]],4:[[6,0],[12,4],[10,11],[6,17],[2,11],[0,4]],5:[[2,0],[10,0],[12,3],[12,13],[9,16],[3,16],[0,13],[0,3]],7:[[6,0],[9,3],[12,2],[11,10],[8,13],[6,17],[4,13],[1,10],[0,2],[3,3]],6:[[6,0],[12,6],[9,13],[6,17],[3,13],[0,6]],8:[[6,0],[8,4],[12,3],[11,9],[8,13],[6,17],[4,13],[1,9],[0,3],[4,4]]};
  const points=shapes[mat===1?2:mat]||shapes[2];x.beginPath();points.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.closePath();x.fillStyle=p[0];x.fill();x.save();x.translate(6,8);x.scale(.72,.76);x.translate(-6,-8);x.fillStyle=p[1];x.fill();x.restore();x.fillStyle=p[2];x.fillRect(3,4,1,6);x.fillStyle=p[3];if(mat===2)x.fillRect(5,6,3,4);else if(mat===3){x.fillRect(5,3,2,10);x.fillRect(2,6,8,2)}else if(mat===4){x.fillRect(5,3,2,10);x.fillRect(3,5,6,2)}else if(mat===5){x.fillRect(2,5,9,2);x.fillRect(5,3,3,9)}else {x.beginPath();x.moveTo(6,4);x.lineTo(9,8);x.lineTo(6,13);x.lineTo(3,8);x.fill()}const d=x.getImageData(0,0,13,17);for(let i=3;i<d.data.length;i+=4)d.data[i]=d.data[i]>=128?255:0;x.putImageData(d,0,0);return c;
 }
 function drawPart(ctx,row,mat,x,y,w,h,mirror,dye,rotation=0){const a=part(row,mat,dye);if(!a)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(rotation)ctx.rotate(rotation);if(mirror)ctx.scale(-1,1);ctx.drawImage(a,Math.round(-w/2),0,w,h);ctx.restore()}
 function compose(base,gear=[],dye=null){
  if(!ready||!gear?.some(Boolean))return base;
  let cache=caches.get(base);if(!cache)caches.set(base,cache=new Map());const key=gear.join(',')+'/'+(dye?.M||'');if(cache.has(key))return cache.get(key);
  const out=canvas(384,640),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0);
  const bctx=base.getContext?base.getContext('2d'):null,tmp=bctx?base:canvas(384,640);if(!bctx)tmp.getContext('2d').drawImage(base,0,0);
  const source=tmp.getContext('2d').getImageData(0,0,384,640).data;
  const [helm,body,legs,boots,sh,gloves]=gear;
  for(let row=0;row<10;row++)for(let col=0;col<6;col++){
   const ox=col*64,oy=row*64,fallen=(row===7||row===8)&&col>=3,left=row===2||row===6||row===8||row===0&&col===1,rear=row===4||row===9||row===0&&(col===3||col===5),side=row===2||row===3||row===0&&(col===1||col===2);
   const pixel=(x,y)=>{const i=((oy+y)*384+ox+x)*4;return [source[i],source[i+1],source[i+2],source[i+3]]};
   let top=64,minX=64,maxX=-1;
   for(let y=15;y<(fallen?60:45);y++)for(let x=14;x<50;x++){const [r,g,b,a]=pixel(x,y);if(a&&r>18&&r<135&&g<110&&b>g+1){top=Math.min(top,y)}}
   if(top===64)top=24;
   for(let y=top;y<Math.min(60,top+14);y++)for(let x=14;x<50;x++){const [r,g,b,a]=pixel(x,y);if(a&&r<135&&g<110&&b>g+1){minX=Math.min(minX,x);maxX=Math.max(maxX,x)}}
   let head=(minX+maxX)/2;if(maxX<0)head=32;
   if(fallen){head=left?40:24;top=col===3?40:col===4?42:45}
   // The approved head is unchanged pixel-for-pixel. A platebody adds torso
   // height above the fixed feet so full armour has the approved proportions.
   const headLift=body&&!fallen&&!((row===7||row===8)&&col===2)?7:0;
   if(headLift){
    const cuts=[[43,44,44,43,48,46],[43,44,44,43,44,43],[44,44,44,44,44,44],[44,44,44,44,44,44],[42,43,44,43,42,43]],cut=cuts[row]?.[col]??(row===9?42:44);
    const cap=ctx.getImageData(ox,oy,64,64),d=cap.data,moved=new Uint8ClampedArray(d),mask=[];
    const jaw=(xx,yy)=>{if(row===0&&col===4)return yy>=48&&yy<=49&&xx>=29&&xx<=36;
     if(row===2||row===3){const y=[45,46,45,46,45,45][col],offset=[-2,-1,-1,-2,-1,-1][col],leftX=27+offset,rightX=34+offset,x=row===3?63-xx:xx;return yy>=y-1&&yy<=y&&x>=leftX&&x<=rightX}
     if(row===5||row===6)return yy>=44&&yy<=45&&xx>=(row===6?27:29)&&xx<=(row===6?34:36);
     return false};
    for(let yy=Math.max(1,top-3);yy<51;yy++)for(let xx=Math.max(1,Math.floor(head-16));xx<Math.min(63,head+17);xx++){
     const i=(yy*64+xx)*4,[r,g,b,a]=pixel(xx,yy);if(!a||yy>=cut&&!jaw(xx,yy))continue;
     const skin=r>110&&r>g*1.12&&g>b*1.06;if(skin&&Math.abs(xx-head)>11)continue;
     mask.push([xx,yy]);moved[i+3]=0;
    }
    for(const [xx,yy] of mask){const i=(yy*64+xx)*4,to=((yy-headLift)*64+xx)*4;for(let k=0;k<4;k++)moved[to+k]=d[i+k]}
    cap.data.set(moved);ctx.putImageData(cap,ox,oy);
   }
   // Recolour only occupied limb pixels. No alpha changes and no rectangle feet.
   const data=ctx.getImageData(ox,oy,64,64),d=data.data;let waist=64,waistMin=64,waistMax=-1;
   if(!fallen)for(let y=top+23;y<58;y++)for(let x=20;x<45;x++){const [r,g,b,a]=pixel(x,y);if(a&&r<105&&b>g+1){waist=Math.min(waist,y);waistMin=Math.min(waistMin,x);waistMax=Math.max(waistMax,x)}}
   if(waist===64){waist=Math.min(53,top+25);waistMin=27;waistMax=37}
   const core=(waistMin+waistMax)/2,limb=new Set(),queue=[];
   if(!fallen){for(let y=waist;y<60;y++)for(let x=14;x<50;x++){const [r,g,b,a]=pixel(x,y);if(a&&r<105&&b>g+1){const key=y*64+x;limb.add(key);queue.push(key)}}
   for(let i=0;i<queue.length;i++){const key=queue[i],x=key%64,y=Math.floor(key/64);for(const [xx,yy] of [[x-1,y],[x+1,y],[x,y+1]]){const n=yy*64+xx;if(xx<12||xx>51||yy<waist||yy>59||limb.has(n)||!pixel(xx,yy)[3])continue;limb.add(n);queue.push(n)}}}
   for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4,[r,g,b,a]=pixel(x,y);if(!a||Math.max(r,g,b)<15)continue;
    const skin=r>110&&r>g*1.12&&g>b*1.06;
    let mat=0;
    if(!fallen){
     if(body&&skin&&y>=top+19&&y<waist)mat=body;
     if(legs&&limb.has(y*64+x))mat=legs;
     if(boots&&limb.has(y*64+x)&&y>=waist+4)mat=boots;
     if(gloves&&skin&&y>=waist-3&&y<=waist+1&&Math.abs(x-core)>6)mat=gloves;
    }else{
     const foot=left?x<23:x>41,headRegion=left?x>=31:x<=34;
     if(!headRegion&&legs&&y>=49&&y<=59)mat=legs;
     if(foot&&boots&&y>=50)mat=boots;
    }
    if(!mat)continue;const p=palette(mat,dye),light=skin?(r+g+b)/3:Math.max(r,g,b)*2.8;const color=p[light>170?2:light>88?1:0].match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));d[i]=color[0];d[i+1]=color[1];d[i+2]=color[2];
   }
   ctx.putImageData(data,ox,oy);ctx.save();ctx.beginPath();ctx.rect(ox+1,oy+1,62,61);ctx.clip();ctx.translate(ox,oy);
   // Articulated equipment: complete shaped pieces follow the original pose.
   // The approved base pixels remain underneath, sealing necks and limb joins.
   if(!fallen){
    const footPoints=[];
    for(const sign of [-1,1]){
     let bottom=-1,fx=0,n=0;
     for(let yy=waist+3;yy<60;yy++)for(let xx=13;xx<51;xx++)if(limb.has(yy*64+xx)&&(sign<0?xx<core:xx>=core))bottom=Math.max(bottom,yy);
     if(bottom<0)continue;
     for(let yy=Math.max(waist+3,bottom-1);yy<=bottom;yy++)for(let xx=13;xx<51;xx++)if(limb.has(yy*64+xx)&&(sign<0?xx<core:xx>=core)){fx+=xx;n++}
     if(!n)continue;fx/=n;const hipX=core+sign*3,hipY=waist+1;
     if(legs){const endY=Math.max(hipY+4,bottom-3),angle=-Math.atan2(fx-hipX,endY-hipY),length=Math.min(12,Math.max(6,Math.round(Math.hypot(fx-hipX,endY-hipY))))+2;
      ctx.save();ctx.translate(Math.round(hipX),hipY);ctx.rotate(angle);drawPart(ctx,9,legs,0,-1,7,length,sign<0,dye);ctx.restore()}
     if(boots)drawPart(ctx,10,boots,fx,bottom-4,side?9:8,5,left,dye);
     footPoints.push([fx,bottom]);
    }
    if(body){const neck=top+19-headLift,height=16;drawPart(ctx,rear?8:side?7:6,body,(head+core)/2,neck,side?16:24,height,left&&side,dye)}
    if(gloves){
     const groups=[[],[]];
     for(let yy=Math.max(15,top+12);yy<=Math.min(59,waist+3);yy++)for(let xx=12;xx<53;xx++){
      const [r,g,b,a]=pixel(xx,yy);if(!a||!(r>110&&r>g*1.12&&g>b*1.06))continue;
      if(yy<top+23&&Math.abs(xx-head)<12)continue;
      if(Math.abs(xx-core)<7&&yy>=top+22)continue;
      groups[xx<core?0:1].push([xx,yy]);
     }
     groups.forEach((g,i)=>{if(!g.length)return;const bottom=Math.max(...g.map(p=>p[1])),end=g.filter(p=>p[1]>=bottom-2),gx=end.reduce((n,p)=>n+p[0],0)/end.length;drawPart(ctx,11,gloves,gx,bottom-9,7,11,i===0,dye)});
    }
   }else{
    if(legs){drawPart(ctx,9,legs,left?24:40,51,8,8,left,dye)}
    if(boots)drawPart(ctx,10,boots,left?19:45,54,9,6,left,dye);
    if(body)drawPart(ctx,8,body,left?29:35,48,16,11,left,dye);
    if(gloves)drawPart(ctx,11,gloves,left?26:38,54,6,6,left,dye);
   }
   if(helm){if(fallen){ctx.save();ctx.translate(head,49);ctx.rotate(left?-Math.PI/2:Math.PI/2);drawPart(ctx,2,helm,0,-11,22,22,false,dye);ctx.restore()}else{drawPart(ctx,rear?2:side?1:0,helm,head,Math.max(2,top-3-headLift),side?26:29,rear?23:24,left&&side,dye)}}
   if(sh){const a=shield(sh,dye);if(fallen){ctx.save();ctx.translate(left?20:43,56);ctx.rotate(left?-Math.PI/2:Math.PI/2);ctx.drawImage(a,-5,-6,10,12);ctx.restore()}else{const x=side?core-7:rear?core+7:core-13,y=waist-7;ctx.drawImage(a,Math.round(x),y,side?5:10,13)}}
   ctx.restore();
  }
  const sealed=ctx.getImageData(0,0,384,640);for(let i=3;i<sealed.data.length;i+=4)sealed.data[i]=sealed.data[i]>=128?255:0;ctx.putImageData(sealed,0,0);
  if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(key,out);return out;
 }
 function icon(kind,mat,size){const key=kind+'/'+mat;if(!icons.has(key)){const c=canvas(64,64),ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;if(kind==='helm'||kind==='body'){const a=part(kind==='helm'?0:6,mat);ctx.drawImage(a,Math.floor((64-a.width)/2),Math.floor((64-a.height)/2))}else if(kind==='shield'){ctx.drawImage(shield(mat),12,6,39,51)}else{const row=kind==='legs'?9:kind==='boots'?10:11,a=part(row,mat);for(const mirror of [false,true]){ctx.save();ctx.translate(mirror?47:17,10);if(mirror)ctx.scale(-1,1);ctx.drawImage(a,-12,0,24,44);ctx.restore()}}icons.set(key,c.toDataURL())}return '<img class="gear-icon" alt="" width="'+size+'" height="'+size+'" src="'+icons.get(key)+'" style="image-rendering:pixelated;object-fit:contain">'}
 window.MyrrenArmour={get ready(){return ready},compose,icon,order,colors};
})();
