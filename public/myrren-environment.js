/* Tales of Myrren — Elderwood environment. Native, deterministic pixel art.
 * Rendering only. No world objects, collision, progression or storage access. */
(() => {
  'use strict';
  const P={ink:'#282a30',deep:'#243b38',shade:'#304c42',leaf:'#46674e',lit:'#678563',tip:'#91a178',wood:'#725441',woodL:'#aa8760',woodD:'#463d37',stone:'#68736c',stoneL:'#a0aa92',gold:'#d9af6c',warm:'#f4d28c'};
  const hash=(a,b)=>(Math.imul((a|0)^Math.imul(b|0,19349663),2246822519)>>>0);
  const cache=new Map();
  function sprite(ctx,key,w,h,ax,ay,x,y,paint){
    let c=cache.get(key);
    if(!c){c=document.createElement('canvas');c.width=w;c.height=h;paint(kit(c.getContext('2d')));cache.set(key,c)}
    ctx.drawImage(c,Math.round(x-ax),Math.round(y-ay));
  }
  function kit(c){
    const r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
    const poly=(pts,col)=>{const lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1]));for(let y=lo;y<hi;y++){const xs=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)r(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,col)}};
    const crown=(x,y,w,h,col)=>{const hh=Math.max(2,Math.round(h*.9)),top=Math.round(y-h*.61);for(let j=0;j<hh;j++){const t=(j+.5)/hh*2-1;let half=Math.round(Math.sqrt(Math.max(0,1-t*t))*w/4)*2;const notch=(Math.floor(j/4)%4===1?1:0);r(x-half+notch,top+j,Math.max(1,half*2-notch),1,col)}};
    const shadow=(x,y,w)=>{r(x-w/2,y-1,w,3,'#203631');r(x-w*.35,y+2,w*.7,1,'#263c34')};
    return {r,poly,crown,shadow,c};
  }
  /* Optional approved resource sprites. Missing images safely retain procedural art. */
  const resourceImages=new Map();
  const resourceNames={tree:'bramblewood',oak:'alder',maple:'ironbark',elder:'elderthorn',myrren:'starroot'};
  function resourceSprite(ctx,n,x,y,now,isTree){
    if(now<n.back)return false; // preserve harvested stump / depleted rock visuals
    const name=isTree?(n.previewTree||resourceNames[n.k]):({cobalt:'black_iron',aether:'myrrenite'}[n.k]||n.k);
    if(!name)return false;
    const key=(isTree?'tree_':'ore_')+name;
    let entry=resourceImages.get(key);
    if(!entry){
      const img=new Image();entry={img,ready:false,failed:false};resourceImages.set(key,entry);
      img.onload=()=>{entry.ready=img.naturalWidth>0};
      img.onerror=()=>{entry.failed=true};
      img.src='/assets/resources/'+key+'.png';
    }
    if(!entry.ready)return false;
    // Black Iron uses a 32px native pilot; all other resource footprints are unchanged.
    const w=isTree?144:(name==='black_iron'?32:24);
    const h=isTree?Math.round(entry.img.naturalHeight*w/entry.img.naturalWidth):Math.round(entry.img.naturalHeight*w/entry.img.naturalWidth);
    const dx=Math.round(x-w/2),dy=Math.round(y-h+4);
    if(!isTree){ctx.drawImage(entry.img,dx,dy,w,h);return true;}
    // Short staggered gusts. A gradual bend avoids cutting the trunk in half.
    const seed=hash(n.x,n.y),cycle=10500+(seed%4500),t=(now+seed%9000)%cycle;
    const gust=t<2100?Math.pow(Math.sin(Math.PI*t/2100),2):0;
    const sway=Math.sin(t*.009+seed%19)*gust*2.5;
    // Render in horizontal bands; movement fades smoothly to zero near the roots.
    // A 2px overlap prevents subpixel gaps between adjacent bands.
    const sourceH=entry.img.naturalHeight,sourceW=entry.img.naturalWidth;
    const bands=24;
    for(let i=0;i<bands;i++){
      const top=Math.floor(i*sourceH/bands),bottom=Math.ceil((i+1)*sourceH/bands);
      const y0=Math.round(i*h/bands),y1=Math.round((i+1)*h/bands);
      const bend=Math.pow(Math.max(0,1-i/(bands*.84)),2);
      const shift=Math.round(sway*bend);
      ctx.drawImage(entry.img,0,top,sourceW,bottom-top,dx+shift,dy+y0,w,Math.max(1,y1-y0));
    }
    // Sparse falling leaves, deterministic from tree position and frame time.
    if(gust>.12){
      const leafColors={tree:'#8ba75b',oak:'#9da95c',maple:'#b97843',elder:'#7d9b54',myrren:'#83b9c2'};
      const color=leafColors[n.k]||'#90a75c';
      ctx.fillStyle=color;
      for(let i=0;i<3;i++){
        const delay=(seed%390+i*430)%1250;
        const age=t-delay;
        if(age<0||age>1350)continue;
        const p=age/1350;
        const lx=dx+w*(.24+.22*i)+p*(8+i*3)+Math.sin(p*9+i)*3;
        const ly=dy+h*(.28+.08*i)+p*h*.52;
        ctx.fillRect(Math.round(lx),Math.round(ly),2,2);
      }
    }
    return true;
  }
  function tree(ctx,n,x,y,now,ancient=false){
    if(!ancient&&resourceSprite(ctx,n,x,y,now,true))return;
    const variant=hash(n.x,n.y)%4,k=n.k,stump=now<n.back,tainted=n.x>1130&&n.y>1160;
    const big=ancient,scale=big?1.65:k==='tree'?1:1.18;
    sprite(ctx,`tree:${k}:${variant}:${stump}:${big}:${tainted}`,big?180:100,big?185:108,big?90:50,big?177:101,x,y,({r,poly,crown,shadow})=>{
      const X=big?90:50,Y=big?177:101;
      shadow(X+3,Y,big?91:38);
      if(stump){r(X-7,Y-7,14,8,P.ink);r(X-6,Y-8,12,6,P.woodL);r(X-4,Y-7,8,3,P.wood);r(X-1,Y-6,3,1,P.woodD);r(X-6,Y-1,13,2,P.woodD);return}
      const trunk=big?13:4,ht=big?110:42;
      poly([[X-trunk,Y-ht],[X+trunk-2,Y-ht],[X+trunk,Y-7],[X+trunk*2,Y+1],[X+trunk/2,Y],[X,Y-6],[X-trunk,Y+1],[X-trunk*2,Y+1],[X-trunk,Y-10]],P.ink);
      poly([[X-trunk+2,Y-ht+1],[X+trunk-3,Y-ht+1],[X+trunk-1,Y-6],[X+trunk*1.5,Y],[X+1,Y-3],[X-1,Y-12],[X-trunk+1,Y-1]],P.wood);
      r(X-trunk+2,Y-ht+5,big?5:2,ht-8,P.woodL);r(X+1,Y-ht+8,big?6:2,ht-11,P.woodD);
      if(big){for(let j=0;j<4;j++){const xx=X-10+j*6;poly([[xx,Y-ht+8],[xx+3,Y-ht+7],[xx+2,Y-40],[xx+8,Y-5],[xx+3,Y-4],[xx-1,Y-37]],j%2?P.woodD:P.wood);r(xx,Y-72-j*3,2,8,P.woodL)}}
      for(let j=0;j<(big?10:4);j++){let yy=Y-9-j*(big?9:7),h2=hash(j,variant+15);r(X-trunk+2+(h2%Math.max(2,trunk*2-4)),yy,big?3:2,2+(h2%4),P.shade)}
      if(k==='tree'){r(X-2,Y-38,3,36,'#b3b3a0');r(X+1,Y-38,2,35,'#888d7b');for(let j=0;j<5;j++){r(X-2+j%2,Y-7-j*6,2+j%2,1,P.woodD)}}
      const pal=tainted?['#283b32','#506146','#79815a','#a2a16c']:{maple:['#4c3937','#805748','#a47a55','#c09b69'],elder:['#2b4145','#416b69','#66928a','#9bb5a0'],myrren:['#3b3448','#5e536d','#82778e','#b0a5b2']}[k]||[P.deep,P.leaf,P.lit,P.tip];
      const z=scale,cy=Y-(big?103:45),cw=big?126:57*z;
      // Interlocking angular leaf masses: broad shaded underside, lit upper planes.
      crown(X,cy,cw,big?80:45*z,P.ink);
      const masses=big?[[-.38,-.07,.34,.42],[-.25,-.28,.40,.48],[-.05,-.42,.41,.47],[.19,-.36,.42,.47],[.37,-.17,.33,.42],[-.32,.14,.37,.40],[-.10,-.02,.48,.5],[.17,.02,.48,.50],[.39,.13,.29,.35],[-.19,.29,.40,.36],[.08,.29,.44,.39]]:[[-.29,-.02,.47,.58],[-.12,-.28,.49,.61],[.17,-.22,.51,.65],[.32,.06,.40,.49],[.02,.18,.59,.45],[-.29,.23,.35,.34]];
      masses.forEach(([dx,dy,w,h],i)=>{
        let xx=X+dx*cw,yy=cy+dy*(big?85:45*z),ww=w*cw,hh=h*(big?95:52*z);
        crown(xx,yy,ww+3,hh+3,pal[0]);crown(xx-1,yy-2,ww-2,hh-3,pal[1]);
        crown(xx-ww*.12,yy-hh*.18,ww*.71,hh*.52,pal[2]);
        r(xx-ww*.28,yy-hh*.42,Math.max(3,ww*.24),big?3:2,pal[3]);
        for(let t=0;t<(big?10:5);t++){const h2=hash(variant*43+i+9,t);let lx=xx-ww*.27+h2%(Math.max(1,ww*.5)|0),ly=yy-hh*.24+((h2>>>8)%(Math.max(1,hh*.35)|0));r(lx,ly,big?4:3,1,t%3===0?pal[3]:t%2?pal[0]:pal[2]);if(t%3===0)r(lx+2,ly-1,2,1,pal[2])}
      });
      // Hanging vines and buttress roots stay beneath the canopy silhouette.
      for(let j=0;j<(big?9:3);j++){const xx=X-cw*.39+j*cw/(big?11:4),yy=cy+(big?20:12)+(j%2)*3,len=(big?17:8)+(variant+j*7)%15;r(xx,yy,1,len,pal[0]);r(xx,yy+len-3,2,3,pal[2]);if(big){r(xx-2,yy+len-8,3,2,pal[1]);r(xx+1,yy+len-13,3,2,pal[2])}}
      if(big){r(X-4,Y-48,9,36,P.deep);r(X-1,Y-44,4,27,P.ink);for(const d of [-1,1]){poly([[X+d*7,Y-55],[X+d*14,Y-14],[X+d*36,Y],[X+d*18,Y-3],[X+d*9,Y-12]],P.wood);r(X+d*12,Y-20,3,12,P.lit)}r(X+13,Y-23,8,2,'#589e9b');r(X+14,Y-21,6,1,'#9ccec0')}
      if(tainted){r(X-2,Y-20,1,14,'#8ca66a');r(X-1,Y-7,5,1,'#adc67d');for(let j=0;j<5;j++)r(X-20+j*9,Y+1-(j%2),3,1,'#a19460')}
    });
  }
  function rock(ctx,n,x,y,now){
    if(resourceSprite(ctx,n,x,y,now,false))return;
    const live=now>=n.back;
    sprite(ctx,`rock:${n.k}:${live}:${hash(n.x,n.y)%3}`,42,30,21,26,x,y,({r,poly,shadow})=>{
      shadow(22,27,34);poly([[4,23],[4,15],[9,7],[19,3],[30,7],[37,17],[37,25],[12,27]],P.ink);
      poly([[6,22],[9,13],[18,6],[27,7],[34,16],[35,24],[14,25]],P.stone);
      poly([[9,13],[18,6],[27,7],[22,14],[12,18]],P.stoneL);poly([[22,14],[27,7],[34,16],[35,24],[26,23]],'#495a55');r(18,15,2,7,P.deep);r(20,14,5,2,P.deep);
      r(6,21,9,3,P.leaf);r(8,20,5,2,P.lit);r(29,23,7,2,P.shade);
      if(live){const pal={copper:['#9c694d','#d8aa76'],tin:['#8fa4a2','#c6d0b8'],iron:['#657888','#a3b2b3'],coal:['#30343f','#67717c'],cobalt:['#476b95','#8bb5cc'],aether:['#7958a7','#c2a0f1'],obsidianite:['#642b3f','#f06465'],meteorite:['#6c9abd','#a8efff']}[n.k]||['#657888','#a3b2b3'];for(const [xx,yy] of [[13,13],[25,11],[26,20]]){poly([[xx-2,yy],[xx+2,yy-3],[xx+5,yy],[xx+3,yy+4],[xx-2,yy+3]],P.ink);r(xx-1,yy,5,3,pal[0]);r(xx,yy-1,3,2,pal[1])}}
    });
  }
  function fern(ctx,x,y,seed=0){
    sprite(ctx,'fern:'+seed%4,28,20,14,18,x,y,({r,poly})=>{r(13,7,1,11,P.deep);for(let i=0;i<5;i++)for(const d of [-1,1]){const yy=8+i*2,xx=13+d*(3+i);poly([[13,yy+2],[xx,yy-3],[xx+d*4,yy-2],[xx,yy+1]],i%2?P.leaf:P.lit)}r(13,4,2,6,P.tip)});
  }
  function building(ctx,b,x,y,now){
    if(b.open||b.id==='arms'){smithyFloor(ctx,x,y);smithyPart(ctx,'trade',x+1,y-28,now);smithyPart(ctx,'furnace',x+26,y-5,now);smithyPart(ctx,'anvil',x-25,y+10,now);return}
    const id=b.id,hw=b.w/2,hall=id==='axe',forge=id==='arms';
    sprite(ctx,'house:'+id+':'+b.w,110,126,55,118,x,y,({r,poly,shadow})=>{
      const X=55,Y=118,roofBottom=Y-31,peak=hall?Y-101:forge?Y-87:Y-81;
      shadow(X+3,Y+2,b.w+24);
      // Foundation and vertical beams share the same dimensions as the original footprint.
      r(X-hw-2,Y-25,b.w+4,26,P.ink);r(X-hw,Y-24,b.w,22,'#8b8067');
      for(let row=0;row<3;row++)for(let j=0;j<b.w;j+=9){r(X-hw+j,Y-22+row*7,8,6,row%2?'#817b65':'#929078');r(X-hw+j,Y-22+row*7,7,1,'#aaa48a')}
      r(X-hw,Y-28,b.w,17,P.wood);for(let j=2;j<b.w;j+=5){r(X-hw+j,Y-26,1,13,P.woodD);r(X-hw+j+1,Y-26,1,11,'#8f6e4d')}
      for(const d of [-1,1]){r(X+d*(hw-2)-2,Y-33,4,34,P.ink);r(X+d*(hw-2)-1,Y-32,2,31,P.woodL)}
      // Chimney is behind one deliberate roof, never stacked on a second roof.
      const chimney=X+hw-9;r(chimney-5,peak+3,11,27,P.ink);r(chimney-3,peak+4,7,24,P.stone);for(let j=0;j<5;j++)r(chimney-3,peak+6+j*4,6,1,P.stoneL);r(chimney-6,peak,13,4,P.woodD);
      const left=X-hw-6,right=X+hw+6;
      const roofPal=id==='food'?['#66594b','#7d6b51','#99805c']:id==='fish'?['#3e5b59','#506f68','#738b78']:['#3e4b48','#516157','#728273'];
      const depth=roofBottom-peak;
      const roofWidth=t=>forge?hw+4-(1-t)*9:id==='food'?(t<.36?t/.36*.64:.64+(t-.36)/.64*.36)*(hw+5):id==='fish'?(t<.2?t/.2*.52:.52+(t-.2)/.8*.48)*(hw+5):(hw+5)*t;
      if(forge){poly([[left-1,roofBottom+3],[left+7,peak+3],[right-9,peak-3],[right+1,roofBottom+3]],P.ink);poly([[left+2,roofBottom],[left+9,peak+6],[right-11,peak+1],[right-2,roofBottom]],roofPal[0])}
      else{const outline=[];for(let j=0;j<=depth;j++){outline.push([X-roofWidth(j/depth)-2,peak+j])}for(let j=depth;j>=0;j--)outline.push([X+roofWidth(j/depth)+2,peak+j]);poly(outline,P.ink);const face=[];for(let j=3;j<depth;j++)face.push([X-roofWidth(j/depth),peak+j]);for(let j=depth-1;j>=3;j--)face.push([X+roofWidth(j/depth),peak+j]);poly(face,roofPal[0])}
      for(let yy=peak+7,row=0;yy<roofBottom;yy+=5,row++){
        const t=(yy-peak)/(roofBottom-peak),half=roofWidth(t);
        for(let xx=X-half+1;xx<X+half-3;xx+=7){const sh=hash((xx-X)|0,row);r(xx,yy,Math.min(6,X+half-xx),4,roofPal[sh%2]);r(xx+1,yy,Math.min(4,X+half-xx-1),1,roofPal[2]);if(sh%9===0)r(xx+1,yy+2,4,2,P.leaf)}
      }
      // Heavy carved gable edges and ridge catch the light.
      for(let j=0;j<roofBottom-peak;j++){const xx=roofWidth(j/depth);r(X-xx-2,peak+j,3,1,P.woodD);r(X+xx,peak+j,3,1,P.woodD);if(j%2===0)r(X-xx-1,peak+j,1,1,P.woodL)}
      r(left-1,roofBottom,b.w+14,4,P.woodD);r(left,roofBottom,b.w+12,1,P.woodL);
      // Moss accumulates at the shaded eaves, in broad readable patches.
      for(let j=0;j<4;j++){const xx=left+4+j*13;r(xx,roofBottom-3,7,4,P.shade);r(xx+1,roofBottom-3,5,2,P.lit);r(xx+3,roofBottom+1,2,3+j%2,P.leaf)}
      if(forge){r(X-15,Y-30,30,30,P.ink);r(X-12,Y-27,24,24,'#3d3c38');r(X+3,Y-25,9,22,'#625446');r(X+5,Y-21,5,14,'#bf713e');r(X+6,Y-18,3,10,P.warm);r(X-13,Y-12,15,5,P.ink);r(X-12,Y-13,13,3,'#a4b2ae');r(X-9,Y-8,6,7,P.stone);r(X-13,Y-2,14,2,P.woodD)}
      else{r(X-9,Y-25,18,26,P.ink);r(X-7,Y-23,14,23,P.woodD);r(X-6,Y-22,12,21,'#604b3b');for(let j=-4;j<6;j+=3)r(X+j,Y-21,1,21,'#493c32');r(X+3,Y-11,2,2,P.gold);r(X-8,Y-25,16,2,P.woodL)}
      for(const d of [-1,1]){const wx=X+d*(hw-10)-4;r(wx-2,Y-25,11,13,P.ink);r(wx,Y-23,7,9,P.gold);r(wx+1,Y-22,5,5,P.warm);r(wx+3,Y-23,1,9,P.woodD);r(wx,Y-19,7,1,P.woodD);r(wx-2,Y-12,11,3,P.woodD);r(wx-1,Y-13,5,2,P.leaf)}
      // Shop identity: small pixel trade emblems, never font letters.
      const sx=X-hw+3,sy=Y-39;r(sx-3,sy-4,16,13,P.ink);r(sx-2,sy-3,14,10,P.woodD);r(sx-1,sy-3,12,1,P.woodL);
      if(hall){r(sx+4,sy-1,1,7,P.gold);poly([[sx+4,sy],[sx,sy-1],[sx+1,sy+3],[sx+4,sy+4],[sx+8,sy+1]],P.tip)}
      else if(id==='pick'){r(sx+4,sy,2,7,P.woodL);r(sx,sy-1,9,2,P.stoneL);r(sx+7,sy+1,2,2,P.stoneL)}
      else if(forge){r(sx,sy,9,2,P.stoneL);r(sx+3,sy+2,3,3,P.stone);r(sx+1,sy+5,7,1,P.stoneL)}
      else if(id==='food'){r(sx,sy+1,9,5,P.gold);r(sx+2,sy,5,1,P.warm);r(sx+2,sy+1,1,2,P.wood);r(sx+5,sy+1,1,2,P.wood)}
      else{poly([[sx,sy+3],[sx+5,sy],[sx+9,sy+3],[sx+5,sy+6]],'#8ab0a3');r(sx-2,sy+1,2,5,'#8ab0a3');r(sx+6,sy+2,1,1,P.ink)}
      r(X-11,Y+1,22,3,P.stone);r(X-9,Y+1,18,1,P.stoneL);
      if(hall){r(X-7,peak+29,14,16,P.ink);r(X-5,peak+31,10,12,P.woodD);r(X-2,peak+34,4,6,P.gold)}
      if(id==='food'){r(X+hw-3,Y-7,12,8,P.woodD);r(X+hw-2,Y-8,10,3,P.gold)}
      r(X-hw+1,Y-5,6,4,P.shade);r(X-hw+2,Y-6,3,2,P.lit);
    });
    // Smoke uses quiet square pixels; only its alpha animates.
    const peak=hall?y-101:forge?y-87:y-81,tx=x+hw-9;
    for(let i=0;i<3;i++){const t=(now/2200+i/3)%1;ctx.globalAlpha=(1-t)*.24;ctx.fillStyle='#adb9ac';ctx.fillRect(Math.round(tx+Math.sin(t*5+i)*3),Math.round(peak-4-t*23),3+i,3+i)}ctx.globalAlpha=1;
  }
  const terrainAtlas=new Image();
  terrainAtlas.src='/assets/terrain/starter_terrain_v1.png?v=2';
  const nativeTerrainReady=()=>terrainAtlas.complete&&terrainAtlas.naturalWidth===128&&terrainAtlas.naturalHeight===112;
  function drawTerrainTile(ctx,index,x,y){
    ctx.drawImage(terrainAtlas,(index%8)*16,Math.floor(index/8)*16,16,16,
      Math.round(x),Math.round(y),16,16);
  }
  function terrain(ctx,tx,ty,x,y,kind,now,edge=0,ground=kind){
    const {r}=kit(ctx),h=hash(tx,ty),v=h%97;
    if(nativeTerrainReady()&&kind!=='boundary'){
      // Existing edges are N/S/W/E. Atlas connections are N/E/S/W.
      const connected=15^((edge&1)|((edge&2)<<1)|((edge&4)<<1)|((edge&8)>>2));
      const variant=(h>>>8)%8;
      const index=kind==='water'?16+variant%4
        :kind==='path'?24+connected
        :kind==='plaza'||ground==='dirt'?8+variant%4
        :ground==='gravel'?22+variant%2
        :ground==='stone'?12+variant%4
        // Corrupted tiles are biome data, not a hard coordinate cutoff.
        // A cutoff creates a rectangular purple patch beside the lake.
        :ground==='corrupted'?20+variant%2:variant;
      drawTerrainTile(ctx,index,x,y);
      return true;
    }
    if(kind==='grass'||kind==='boundary'){
      // Large contiguous colour fields, no per-tile colour checkerboard.
      const tainted=tx>71&&ty>72;
      r(x,y,16,16,kind==='boundary'?'#293e37':tainted?'#3f4e3c':'#3e5542');
      const patch=hash(Math.floor(tx/5),Math.floor(ty/5))%7;
      if(patch===0)r(x,y,16,16,'#3b5240');
      if(patch===1)r(x,y,16,16,'#415845');
      if(v%4===0){r(x+4,y+9,1,3,'#587253');r(x+3,y+10,3,1,'#587253')}
      if(v%7===0){r(x+10,y+5,3,1,'#6e805b');r(x+11,y+4,1,2,'#6e805b')}
      if(v%17===0){r(x+7,y+11,3,1,'#a38d65');r(x+9,y+10,2,1,'#7f7756')}
      if(v%31===0){r(x+3,y+4,2,2,'#cdbd8b');r(x+4,y+3,1,1,'#e7d4a2')}
      if(tainted&&v%11===0){r(x+3,y+8,7,1,'#78905c');r(x+9,y+5,1,4,'#78905c');r(x+9,y+5,4,1,'#9bb876')}
    }else if(kind==='path'||kind==='plaza'){
      r(x,y,16,16,kind==='plaza'?'#7c7963':'#81755b');
      if(v%3===0)r(x+3,y+10,4,1,'#9a8a68');
      if(v%7===0)r(x+11,y+5,2,1,'#625e4d');
      if(kind==='plaza'&&v%4===0){r(x+2,y+4,9,5,'#5b6457');r(x+2,y+3,9,4,'#92967c');r(x+3,y+3,6,1,'#b3b198')}
      // Subtle irregular moss at actual path boundaries.
      for(let i=0;i<16;i+=2){const d=1+(hash(i,v)%3);if(edge&1)r(x+i,y,2,d,'#4c6548');if(edge&2)r(x+i,y+16-d,2,d,'#4c6548');if(edge&4)r(x,y+i,d,2,'#4c6548');if(edge&8)r(x+16-d,y+i,d,2,'#4c6548')}
    }else if(kind==='water'){
      r(x,y,16,16,'#315d61');if((v+Math.floor(now/700))%6===0)r(x+3,y+7,7,1,'#65908a');if(v%13===0)r(x+9,y+12,4,1,'#8aafa1');
    }else if(kind==='shore'){
      r(x,y,16,16,'#627366');r(x,y,16,2,'#91a08a');r(x+2+(v%3),y+7,9,3,'#465d54');r(x+4,y+6,6,1,'#809581');if(v%3===0)r(x+1,y+1,4,2,'#637d4f');
    }
  }
  function prop(ctx,kind,x,y,a,b,now=0){
    if(kind==='fence'){
      const {r}=kit(ctx),len=a,vertical=b==='v';
      if(vertical){r(x,y-len-8,2,len+7,P.woodD);r(x,y-len-8,1,len+7,P.woodL)}else{r(x,y-10,len,3,P.woodD);r(x,y-10,len,1,P.woodL);r(x,y-5,len,2,P.wood)}
      for(let i=0;i<=len;i+=16){const xx=x+(vertical?0:i),yy=y-(vertical?i:0);r(xx-2,yy-14,4,15,P.ink);r(xx-1,yy-13,2,12,P.wood);r(xx-1,yy-14,2,2,P.woodL);r(xx,yy-2,3,2,P.leaf)}return;
    }
    if(kind==='bush'){fern(ctx,x,y,a?2:0);return}
    sprite(ctx,`prop:${kind}:${a||''}`,68,66,34,61,x,y,({r,poly,crown,shadow})=>{
      const X=34,Y=61;shadow(X+2,Y,kind==='stall'?40:kind==='board'?31:24);
      const post=(xx,top,bot)=>{r(xx-2,top,4,bot-top,P.ink);r(xx-1,top+1,2,bot-top-1,P.wood);r(xx-1,top+1,1,bot-top-1,P.woodL)};
      if(kind==='lamp'){post(X,Y-29,Y+1);r(X,Y-29,12,3,P.ink);r(X+9,Y-28,1,5,P.woodL);r(X+5,Y-25,9,12,P.ink);r(X+7,Y-23,5,7,P.gold);r(X+8,Y-22,3,4,P.warm);r(X+4,Y-26,11,2,P.woodL);r(X+6,Y-15,7,2,P.woodD)}
      else if(kind==='well'){post(X-12,Y-38,Y);post(X+12,Y-38,Y);r(X-14,Y-14,28,16,P.ink);r(X-12,Y-12,24,12,P.stone);for(let j=0;j<3;j++){r(X-12,Y-11+j*4,24,1,'#4c5d55');r(X-8+j*7,Y-12,1,13,P.ink)}r(X-11,Y-16,22,6,P.stoneL);r(X-8,Y-15,16,4,'#315d61');poly([[X-20,Y-34],[X,Y-47],[X+20,Y-34]],P.ink);poly([[X-17,Y-35],[X,Y-44],[X+17,Y-35]],P.shade);r(X-18,Y-34,36,3,P.wood);r(X,Y-33,1,17,P.woodL);r(X-2,Y-18,6,5,P.woodD);r(X-1,Y-18,4,2,P.woodL);r(X-13,Y-3,7,3,P.leaf)}
      else if(kind==='board'){post(X-13,Y-31,Y);post(X+13,Y-31,Y);r(X-15,Y-34,30,23,P.ink);r(X-13,Y-32,26,19,P.wood);poly([[X-19,Y-34],[X,Y-43],[X+19,Y-34]],P.ink);poly([[X-16,Y-35],[X,Y-40],[X+16,Y-35]],P.shade);for(const [xx,yy,w] of [[-10,-29,7],[0,-28,8],[8,-30,4]]){r(X+xx,Y+yy,w,11,'#d2c29d');r(X+xx+1,Y+yy+3,w-2,1,P.wood);r(X+xx+1,Y+yy+6,w-2,1,P.wood);r(X+xx+2,Y+yy,1,1,'#9a6451')}}
      else if(kind==='stall'){for(const xx of [X-17,X+17])post(xx,Y-35,Y);r(X-17,Y-12,34,13,P.ink);r(X-15,Y-10,30,10,P.wood);r(X-15,Y-11,30,3,P.woodL);for(let j=-11;j<15;j+=7)r(X+j,Y-8,1,8,P.woodD);poly([[X-22,Y-29],[X-18,Y-39],[X+18,Y-39],[X+22,Y-29]],P.ink);for(let j=0;j<7;j++)r(X-20+j*6,Y-36,5,7,j%2?'#b8ad86':a==='#3a7a9a'?'#537e79':'#976953');r(X-21,Y-29,42,3,P.woodD);for(let j=0;j<4;j++){r(X-12+j*7,Y-15,5,4,['#ad7856','#bc9d65','#77905c','#a68e65'][j]);r(X-11+j*7,Y-16,3,1,P.warm)}}
      else if(kind==='barrel'){poly([[X-7,Y-16],[X+6,Y-16],[X+8,Y-12],[X+8,Y-3],[X+5,Y+1],[X-6,Y+1],[X-8,Y-3],[X-8,Y-12]],P.ink);r(X-6,Y-14,12,13,P.wood);r(X-5,Y-14,3,13,P.woodL);r(X+3,Y-14,2,13,P.woodD);r(X-6,Y-12,13,2,P.stone);r(X-6,Y-5,13,2,P.stone);r(X-5,Y-17,10,3,P.woodL);r(X-3,Y-16,6,1,P.woodD)}
      else if(kind==='crate'){r(X-8,Y-16,17,17,P.ink);r(X-6,Y-14,13,13,P.wood);r(X-6,Y-14,13,2,P.woodL);r(X-6,Y-2,13,2,P.woodL);for(let j=0;j<11;j++){r(X-5+j,Y-13+j,2,2,P.woodL);r(X+5-j,Y-13+j,1,1,P.woodD)}}
      else if(kind==='hay'||kind==='sack'){crown(X,Y-6,18,17,P.ink);crown(X-1,Y-8,15,14,kind==='hay'?'#a99b6d':'#a49478');r(X-6,Y-9,3,7,'#c8b58a');r(X-7,Y-5,14,2,P.wood);if(kind==='sack')r(X-3,Y-18,7,4,P.woodD)}
      else{r(X-6,Y-10,12,11,P.ink);r(X-5,Y-9,10,8,'#976b53');r(X-5,Y-9,3,7,'#ba8c67');r(X-7,Y-11,14,3,P.woodD);for(let j=0;j<5;j++){r(X-5+j*2,Y-17+j%2*3,2,7,P.leaf);r(X-6+j*2,Y-16+j%2*3,4,2,P.lit);if(j%2===0)r(X-5+j*2,Y-18+j%2*3,2,2,'#bd9b8d')}}
    });
    if(kind==='lamp'){const {r}=kit(ctx);ctx.globalAlpha=.08;r(x-8,y-35,36,31,'#efbc6a');ctx.globalAlpha=1}
  }
  function square(ctx,x,y,now){
    const {r,poly,shadow}=kit(ctx);shadow(x,y+1,44);
    for(let j=0;j<12;j++){const a=j*Math.PI/6,xx=x+Math.round(Math.cos(a)*23),yy=y+Math.round(Math.sin(a)*10);r(xx-3,yy-2,7,4,P.deep);r(xx-3,yy-3,6,3,P.stone);r(xx-2,yy-3,4,1,P.stoneL)}
    poly([[x-10,y],[x-8,y-28],[x-3,y-39],[x+5,y-36],[x+9,y-27],[x+10,y]],P.ink);poly([[x-7,y-2],[x-6,y-28],[x-1,y-36],[x+4,y-33],[x+6,y-3]],P.stone);r(x-5,y-28,3,23,P.stoneL);r(x+3,y-29,3,25,P.shade);
    r(x-2,y-29,4,2,'#80b7b1');r(x,y-27,2,8,'#80b7b1');r(x-3,y-22,5,2,'#a3d3c2');r(x-2,y-20,2,6,'#80b7b1');r(x+1,y-17,3,2,'#80b7b1');r(x-8,y-5,7,4,P.leaf);r(x-7,y-5,4,2,P.lit);
  }
  function brook(ctx,x,y,now){
    const {r,poly}=kit(ctx);
    // Scenery retains its existing placement and walkable bridge.
    const points=[];for(let i=0;i<17;i++)points.push([x+Math.round(Math.sin(i*.38)*11),y-104+i*15]);
    for(let i=0;i<16;i++){
      const [xx,yy]=points[i],[nx,ny]=points[i+1];
      poly([[xx-18,yy],[xx+18,yy],[nx+18,ny+1],[nx-18,ny+1]],P.deep);
      poly([[xx-12,yy],[xx+12,yy],[nx+12,ny+1],[nx-12,ny+1]],'#315d61');
      r(xx-22,yy,8,5,P.stone);r(xx-21,yy,6,1,P.stoneL);r(xx+16,yy+7,7,5,P.shade);r(xx+16,yy+7,5,2,P.leaf);
      if(i%3===0)r(xx-6+(Math.floor(now/220)+i)%7,yy+4,7,1,'#87aaa0');
    }
    for(const off of [-36,36]){r(x-16,y+off,32,5,P.ink);r(x-13,y+off+1,26,7,'#87aaa0');for(let j=0;j<5;j++)r(x-11+j*5,y+off+2+(j%2),2,4,'#b2c9b4');r(x-18,y+off+8,36,2,'#76988e')}
    const yy=y-63;
    r(x-42,yy-10,84,25,P.ink);r(x-40,yy-8,80,20,P.woodD);
    for(let j=0;j<13;j++){r(x-39+j*6,yy-8,5,18,j%3?'#8d7354':'#9d8059');r(x-39+j*6,yy-8,5,1,'#b59869');r(x-39+j*6,yy+7,5,2,P.wood)}
    for(const d of [-1,1]){r(x-44,yy+d*12,88,3,P.woodD);r(x-44,yy+d*12,88,1,P.woodL);for(let j=0;j<5;j++){r(x-43+j*21,yy+d*12-6,3,10,P.ink);r(x-42+j*21,yy+d*12-5,1,8,P.woodL)}}
    fern(ctx,x-29,y+17,1);fern(ctx,x+33,y+78,3);
  }

  function smithyFloor(ctx,x,y){
    const {r}=kit(ctx);
    r(x-47,y-39,94,53,'#4f594d');
    for(let j=0;j<6;j++)for(let i=0;i<10;i++){const h=hash(i,j);r(x-45+i*9,y-37+j*8,8,7,h%3?'#69705e':'#777c65');r(x-44+i*9,y-37+j*8,6,1,'#92947a')}
    r(x-45,y+10,18,3,P.leaf);r(x+27,y-37,15,3,P.shade);
    // Charcoal soot and iron flecks ground the smithy in the survivor camp.
    for(let i=0;i<18;i++){
      const px=x-39+(hash(i,37)%79),py=y-29+(hash(i,61)%38);
      r(px,py,i%3===0?3:2,1,i%4===0?'#3b3933':i%3===0?'#a19072':'#565c50');
    }
    // The forge has a small neat stack of fuel, not a cluttered shopfront.
    r(x+32,y-27,12,3,'#302c28');r(x+34,y-30,9,3,'#494137');
    r(x+34,y-31,7,1,'#9b7a55');
    r(x-43,y-33,11,2,'#4a4134');r(x-41,y-36,7,3,'#6d543b');
  }
  function smithyPart(ctx,kind,x,y,now=0){
    if(kind==='floor'){smithyFloor(ctx,x,y);return}
    const {r,poly,shadow}=kit(ctx);
    if(kind==='anvil'){
      // Recognisable blacksmith's anvil: long tapered horn, flat steel face,
      // thick waist and a solid stump. World scale matches the furnace.
      shadow(x,y+1,25);
      // Solid timber stump, visible end grain and heavy iron retaining bands.
      r(x-10,y-12,21,13,'#2b2825');
      r(x-8,y-11,17,11,'#75553b');
      r(x-7,y-10,15,2,'#9c7953');
      r(x-8,y-7,17,3,'#3f3e39');
      r(x-7,y-3,15,2,'#a07a50');
      r(x-11,y,23,3,'#302a26');
      // Forged metal body, distinctly narrower than its broad top.
      r(x-6,y-20,14,12,'#303a3c');
      r(x-4,y-18,10,9,'#647577');
      r(x-8,y-11,18,4,'#39464a');
      r(x-10,y-8,22,3,'#252e32');
      // Flat working face, left-facing pointed horn and square heel.
      poly([[x-20,y-23],[x-14,y-25],[x-8,y-27],[x+13,y-27],
            [x+16,y-24],[x+16,y-20],[x-8,y-20],
            [x-14,y-21]],'#283236');
      poly([[x-18,y-24],[x-9,y-26],[x+13,y-26],[x+14,y-23],
            [x-8,y-23],[x-13,y-22]],'#a3b2ae');
      r(x-8,y-26,20,2,'#d1d4c7');
      r(x+12,y-23,5,4,'#526369');
      r(x+15,y-24,2,2,'#b6c1b7');
      // Small hardy hole and crisp metal edge.
      r(x+8,y-25,2,2,'#384446');
      r(x-8,y-21,20,2,'#657b7e');
      // Smith's hammer resting beside the stump, not covering the anvil.
      r(x-19,y-9,3,9,'#735039');
      r(x-22,y-12,10,4,'#333c3e');
      r(x-21,y-12,8,2,'#a7b2ad');
    }else if(kind==='furnace'){
      shadow(x,y+2,31);r(x-17,y-6,34,8,P.ink);r(x-15,y-7,30,7,P.stone);
      r(x+5,y-54,13,28,P.ink);r(x+7,y-53,9,26,'#737764');r(x+5,y-55,13,3,P.stoneL);
      poly([[x-17,y-7],[x-16,y-30],[x-12,y-37],[x+11,y-37],[x+16,y-30],[x+17,y-7]],P.ink);
      poly([[x-14,y-7],[x-13,y-29],[x-9,y-34],[x+10,y-34],[x+13,y-27],[x+14,y-7]],'#7f806b');
      for(let j=0;j<5;j++){r(x-12,y-31+j*5,24,1,'#515c50');for(let i=0;i<3;i++)r(x-11+i*8+(j%2)*3,y-30+j*5,1,4,'#566153')}
      poly([[x-10,y-8],[x-10,y-22],[x-5,y-27],[x+5,y-27],[x+10,y-22],[x+10,y-8]],P.ink);
      // Firebox arch, iron rim and ember bed.
      r(x-11,y-23,22,3,'#3a3430');r(x-9,y-25,18,3,'#a39b80');
      r(x-8,y-21,16,14,'#302a25');
      r(x-7,y-20,14,12,'#8b462f');const f=Math.floor(now/150)%3;
      r(x-6,y-15-f,12,8+f,'#db8245');r(x-3,y-20+f,6,12-f,'#f4c66c');r(x-1,y-16,3,8,'#f6dfa0');
      r(x-14,y-7,28,3,P.stoneL);
      // Glowing coals and reflected heat across the furnace mouth.
      r(x-7,y-9,14,2,'#b55331');r(x-5,y-10,3,2,'#ffbf64');
      r(x+2,y-10,3,2,'#ffe3a0');
      ctx.save();ctx.globalAlpha=.08+Math.sin(now/210)*.025;
      ctx.fillStyle='#ffad55';ctx.beginPath();ctx.arc(x,y-14,27,0,Math.PI*2);ctx.fill();ctx.restore();
      r(x+20,y-4,11,5,P.ink);r(x+21,y-6,8,5,'#35423d');
      for(let i=0;i<3;i++){const t=(now/2100+i/3)%1;ctx.globalAlpha=(1-t)*.25;r(x+10+Math.round(Math.sin(t*4+i)*3),y-58-Math.round(t*19),4,4,'#b9bbae')}ctx.globalAlpha=1;
    }else{
      // Low tools-and-stock rack: the workshop has no walls, door or roof.
      r(x-23,y-23,3,25,P.woodD);r(x+20,y-23,3,25,P.woodD);r(x-23,y-23,46,3,P.woodL);
      for(let i=0;i<4;i++){const xx=x-14+i*9;r(xx,y-19,2,12,P.woodL);r(xx-3,y-18,8,3,i%2?P.stoneL:P.stone)}
      r(x-17,y-2,34,3,P.woodD);r(x+25,y-8,13,9,P.woodD);r(x+26,y-10,11,3,P.stone);r(x+26,y-10,8,1,P.stoneL);
    }
  }
  function bridge(ctx,x,y){
    const {r}=kit(ctx),L=58;
    r(x-L-2,y-13,L*2+4,29,P.ink);r(x-L,y-11,L*2,25,P.woodD);
    for(let i=0;i<19;i++){const xx=x-L+i*6;r(xx,y-11,5,24,i%3?'#8e7453':'#a08760');r(xx,y-11,5,1,'#c0a272');r(xx,y+10,5,3,P.wood)}
    for(const side of [-1,1]){const yy=y+side*14;r(x-L-3,yy,L*2+6,3,P.woodD);r(x-L-3,yy,L*2+6,1,P.woodL);for(let i=0;i<7;i++){const xx=x-L+i*19;r(xx-1,yy-7,4,11,P.ink);r(xx,yy-6,2,9,P.woodL)}}
  }
  function waterTile(ctx,tx,ty,x,y,now,W){
    const native=nativeTerrainReady();
    sprite(ctx,(native?'native-bank:':'bank:')+tx+':'+ty,16,16,0,0,x,y,({r,c})=>{
      if(native){
        c.save();
        c.beginPath();
        for(let yy=0;yy<16;yy++){
          let start=-1;
          for(let xx=0;xx<=16;xx++){
            const wet=xx<16&&W.waterDistance(tx*16+xx+.5,ty*16+yy+.5)<-3;
            if(wet&&start<0)start=xx;
            if(!wet&&start>=0){c.rect(start,yy,xx-start,1);start=-1}
          }
        }
        c.clip();
        drawTerrainTile(c,16+(hash(tx,ty)>>>8)%4,0,0);
        c.restore();
      }
      for(let yy=0;yy<16;yy++){
        let start=0,prev=null;
        for(let xx=0;xx<=16;xx++){
          const d=xx<16?W.waterDistance(tx*16+xx+.5,ty*16+yy+.5):100;
          const col=xx===16?null:d<-3&&native?null:d<-13?'#315d61':d<-3?'#3d6e6a':d<0?'#6b9380':d<2?'#52684b':null;
          if(col!==prev){if(prev)r(start,yy,xx-start,1,prev);prev=col;start=xx}
        }
      }
      const h=hash(tx,ty),wx=tx*16+8,wy=ty*16+8,d=W.waterDistance(wx,wy);
      if(d>0&&d<6&&h%3===0){r(7,3,1,9,P.shade);r(5,5,2,1,P.lit);r(8,7,3,1,P.lit);r(7,2,1,3,P.tip)}
    });
    const h=hash(tx,ty),d=W.waterDistance(tx*16+8,ty*16+8);
    if(d<-4&&(h+Math.floor(now/650))%9===0){const {r}=kit(ctx);r(x+5,y+8,5,1,'#8baea0')}
  }
  function fishing(ctx,n,x,y,now){
    if(now<n.back)return;
    const {r}=kit(ctx),seed=hash(n.x,n.y),phase=now/1000+seed%13;
    // Visible shoal under the surface, followed by small broken surface rings.
    const colors={spot1:'#9ebcb0',spot2:'#b3bfa2',spot3:'#c6b58d',spot4:'#a0bdc2',spot5:'#b7abc3'};
    for(let i=0;i<3;i++){
      const fx=x+Math.round(Math.sin(phase*.7+i*2)*7),fy=y-3+i*3+Math.round(Math.cos(phase*.6+i)*2),dir=i%2?1:-1;
      r(fx-3,fy,6,2,'#244b50');r(fx-2,fy,4,1,colors[n.k]||'#b5c7b6');r(fx-dir*4,fy-1,2,4,'#547f7b');r(fx+dir*2,fy,1,1,'#d0debe');
    }
    for(let ring=0;ring<2;ring++){const t=(phase*.42+ring*.5)%1,rx=5+t*9,ry=2+t*4;ctx.globalAlpha=(1-t)*.65;
      for(let j=0;j<28;j++){if((j+seed)%5===0||j>10&&j<15)continue;const a=j*Math.PI/14;r(x+Math.round(Math.cos(a)*rx),y+Math.round(Math.sin(a)*ry),2,1,'#c0d4bd')}
    }ctx.globalAlpha=1;
    if(Math.sin(phase*1.4)>.88){r(x+2,y-7,3,2,'#c8d7b7');r(x+3,y-8,1,1,'#e0e6c4');r(x-4,y-5,2,1,'#c0d4bd')}
  }

  window.MyrrenEnvironment=Object.freeze({tree,rock,fern,building,terrain,nativeTerrainReady,prop,square,brook,bridge,smithyFloor,smithyPart,waterTile,fishing,cacheSize:()=>cache.size});
})();
