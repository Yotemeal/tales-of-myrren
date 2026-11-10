/* Pixel-fit experiment: custom 32×48 armour prototype.
 * NOT part of the live character or equipment renderer.
 * Direct native-coordinate pixel painting; no stretched production atlas.
 * Reference art is a style guide, not a cropped sprite source.
 */
(() => {
  'use strict';
  const W=32,H=48;
  const PALETTES=Object.freeze({
    2: {ink:'#45291f',dark:'#75422f',base:'#bb7044',light:'#efb078',accent:'#f0c492'},
    6: {ink:'#0c323c',dark:'#0b5d67',base:'#15989b',light:'#8de6da',accent:'#f0c654'}
  });
  const BODY=Object.freeze({
    ink:'#30232a',skin:'#f4b891',shade:'#c98570',lit:'#ffd2aa',
    hairInk:'#292027',hairDark:'#49353e',hair:'#70545e',hairLit:'#94707b',
    shorts:'#332932',shortLight:'#50424d'
  });
  const names={2:'Bronze',6:'Myrrenite'};
  function normalize(input) {
    const o=input||{},tier=o.tier===6?6:2;
    const gear=Array.isArray(o.gear)?Array.from({length:6},(_,i)=>[2,6].includes(o.gear[i])?o.gear[i]:0):Array(6).fill(tier);
    const dir=['front','back','left','right'].includes(o.direction)?o.direction:'front';
    const motion=['idle','walk','fist','sword'].includes(o.motion)?o.motion:'idle';
    return {gear,dir,motion,frame:((Math.trunc(o.frame)||0)%4+4)%4};
  }
  function painter(ctx,footX,footY) {
    // One integer source pixel is one exact world pixel; all draw calls are snapped.
    const ox=Math.round(footX)-16,oy=Math.round(footY)-47;
    const px=(x,y,w,h,c)=>{
      if(!c||w<1||h<1)return;
      ctx.fillStyle=c;
      ctx.fillRect(ox+Math.round(x),oy+Math.round(y),Math.round(w),Math.round(h));
    };
    // Raster polygon with integer rows; avoids antialiased diagonals.
    const poly=(points,c)=>{
      const lo=Math.floor(Math.min(...points.map(p=>p[1]))),hi=Math.ceil(Math.max(...points.map(p=>p[1])));
      for(let y=lo;y<hi;y++){
        const xs=[];
        for(let i=0;i<points.length;i++){
          const a=points[i],b=points[(i+1)%points.length];
          if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))
            xs.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }
        xs.sort((a,b)=>a-b);
        for(let i=0;i+1<xs.length;i+=2){
          const start=Math.ceil(xs[i]),end=Math.ceil(xs[i+1]);
          if(end>start)px(start,y,end-start,1,c);
        }
      }
    };
    return {px,poly};
  }
  function base(p,o) {
    const {px,poly}=p,B=BODY,front=o.dir==='front',back=o.dir==='back',side=!front&&!back;
    const walk=o.motion==='walk';
    const gait=walk?[0,-2,0,2][o.frame]:0;
    const sway=walk?[0,1,0,-1][o.frame]:0;
    const fighting=o.motion==='fist'||o.motion==='sword';

    // Feet and shadow are model-space only. Equipment uses these same anchors.
    for(let i=0;i<2;i++){
      const lx=i?18:10,dx=i?-gait:gait;
      px(lx+dx,37,5,9,B.ink);
      px(lx+dx+1,38,3,7,B.skin);
      px(lx+dx+1,39,1,5,B.lit);
      px(lx+dx-1,44,7,4,B.ink);
      px(lx+dx,44,6,3,B.skin);
      px(lx+dx,46,6,1,B.shade);
    }
    px(10,31,13,10,B.ink);
    px(11,32,11,8,B.skin);
    px(11,36,11,6,B.shorts);
    px(12,37,9,1,B.shortLight);
    // Arm swing is opposite across the diagonal walk phases.
    const armLeft=walk?sway:0,armRight=walk?-sway:0;
    px(6,28+armLeft,6,12,B.ink);
    px(7,29+armLeft,4,10,B.skin);
    px(7,30+armLeft,1,5,B.lit);
    if(fighting){
      // Dominant arm drives out from the shoulder, not from a fixed waist socket.
      px(21,28,7,5,B.ink);px(22,29,6,3,B.skin);
      px(27,27,4,5,B.ink);px(28,28,3,3,B.skin);
    } else {
      px(22,28+armRight,6,12,B.ink);
      px(23,29+armRight,4,10,B.skin);
      px(24,30+armRight,1,5,B.lit);
    }
    // Neck is deliberately visible below the face.
    px(13,25,7,6,B.ink);px(14,26,5,5,B.skin);px(14,27,5,1,B.shade);

    if(back){
      poly([[8,11],[9,6],[13,4],[16,2],[19,5],[23,4],[25,9],[28,10],[26,14],[27,19],[25,24],[23,28],[10,28],[7,23],[6,16]],B.hairInk);
      poly([[9,13],[12,7],[16,6],[19,8],[24,7],[25,13],[25,22],[21,26],[10,25],[8,19]],B.hairDark);
      poly([[9,11],[13,5],[17,7],[20,5],[24,11],[23,20],[19,23],[15,26],[11,22]],B.hair);
      px(12,10,3,8,B.hairLit);px(19,9,3,10,B.hairLit);
      px(14,22,7,3,B.hairDark);
    } else {
      if(side){
        // Profile is not mirrored front art; it has a proper side fringe and ear.
        const left=o.dir==='left';
        if(left){ctxFlipHint();} // This function is a deliberate no-op: positions are directional below.
        poly(left?[[9,12],[11,7],[15,6],[19,8],[23,12],[22,22],[17,27],[10,24],[8,19]]:
          [[10,12],[14,8],[19,7],[23,11],[25,18],[22,25],[15,27],[10,23]],B.ink);
        poly(left?[[10,13],[12,9],[17,8],[21,12],[21,21],[17,25],[11,23]]:
          [[11,13],[15,10],[20,9],[23,14],[22,22],[16,25],[11,22]],B.skin);
        if(left){px(10,21,2,2,B.ink);px(12,24,5,1,B.shade);px(21,18,2,4,B.shade);}
        else{px(21,21,2,2,B.ink);px(16,24,5,1,B.shade);px(10,18,2,4,B.shade);}
      } else {
        poly([[8,12],[11,8],[15,7],[20,8],[24,12],[25,20],[23,26],[10,27],[7,22]],B.ink);
        poly([[9,13],[12,9],[20,9],[23,13],[23,23],[20,25],[11,25],[9,22]],B.skin);
        px(11,13,2,7,B.lit);px(21,17,1,4,B.shade);
        px(12,21,2,3,B.ink);px(20,21,2,3,B.ink);
        px(14,25,6,1,B.shade);
      }
      // Distinctive Kez V2-style asymmetrical spiky hair with long dark bangs.
      poly([[6,17],[5,12],[9,10],[7,7],[12,8],[14,3],[17,6],[20,2],
           [22,7],[27,6],[25,10],[29,13],[26,16],[26,21],[23,21],
           [22,17],[20,22],[17,19],[14,25],[12,21],[9,22],[8,19]],B.hairInk);
      poly([[8,15],[10,11],[13,9],[12,6],[16,8],[20,5],[22,10],
           [25,9],[25,15],[22,15],[21,19],[18,17],[14,22],[12,18],[9,20]],B.hairDark);
      poly([[8,13],[12,10],[15,7],[16,10],[20,6],[23,11],[25,12],
           [21,13],[19,17],[17,15],[14,20],[12,16],[10,19]],B.hair);
      px(13,8,2,4,B.hairLit);px(19,7,2,5,B.hairLit);px(9,14,2,2,B.hairLit);
      if(side){
        const ey=o.dir==='left'?10:22;
        px(ey,21,2,2,B.ink);px(ey,20,1,1,B.hairDark);
      }else{px(12,21,2,3,B.ink);px(20,21,2,3,B.ink);}
    }
    function ctxFlipHint() {} // Reserved for future flipped-animation validation.
  }
  function legs(p,o) {
    const {px}=p,B=BODY,g=o.gear,m=o.motion==='walk',shift=m?[0,-2,0,2][o.frame]:0;
    for(let i=0;i<2;i++){
      const mat=g[2],p0=PALETTES[mat],x=(i?18:10)+(i?-shift:shift);
      if(p0){
        px(x,36,6,9,p0.ink);px(x+1,37,4,7,p0.base);
        px(x+1,38,1,5,p0.light);px(x+4,40,1,4,p0.dark);
        px(x,43,6,1,p0.accent);
      }
      const b=PALETTES[g[3]];
      if(b){
        px(x-1,43,8,5,b.ink);px(x,44,7,3,b.base);
        px(x,44,6,1,b.light);px(x+1,46,6,1,b.dark);
        if(g[3]===6)px(x+3,44,2,1,b.accent);
      }
    }
  }
  function chest(p,o) {
    const {px,poly}=p,t=PALETTES[o.gear[1]];
    if(!t)return;
    const back=o.dir==='back';
    poly([[11,27],[22,27],[25,31],[23,39],[10,39],[8,31]],t.ink);
    poly([[12,28],[21,28],[23,31],[22,37],[11,37],[10,31]],t.base);
    px(12,29,9,1,t.light);px(12,35,9,1,t.dark);
    // Pauldrons visually belong to the real arm shoulder, not the neck/face.
    for(const x of [5,22]){
      px(x,28,6,5,t.ink);px(x+1,28,4,3,t.base);
      px(x+1,28,4,1,t.light);
      if(o.gear[1]===6)px(x+2,30,2,1,t.accent);
    }
    if(o.gear[1]===6){
      px(14,29,5,1,t.accent);px(16,30,1,5,t.accent);
      px(15,31,3,2,t.light);
      px(14,35,5,1,t.ink);
      if(!back){px(15,32,3,2,t.accent);px(16,32,1,1,'#fff1ba');}
    } else {
      if(!back){px(15,30,3,6,t.dark);px(14,34,5,1,t.accent);}
      else{px(16,29,2,8,t.dark);}
      px(11,37,11,2,t.ink);px(15,37,3,1,t.accent);
    }
  }
  function gloves(p,o) {
    const {px}=p,B=BODY,g=o.gear;
    const mat=PALETTES[g[5]],fighting=o.motion==='sword'||o.motion==='fist';
    if(!mat)return;
    px(6,36,6,5,mat.ink);px(7,37,4,3,mat.base);px(7,37,3,1,mat.light);
    if(fighting){
      px(27,27,5,5,mat.ink);px(28,28,4,3,mat.base);px(28,28,3,1,mat.light);
    }else{
      const off=o.motion==='walk'?[0,-1,0,1][o.frame]:0;
      px(22,36+off,6,5,mat.ink);px(23,37+off,4,3,mat.base);
      px(23,37+off,3,1,mat.light);
    }
    if(g[5]===6){px(8,37,2,1,mat.accent);px(fighting?29:24,fighting?28:37,2,1,mat.accent);}
  }
  function helmet(p,o) {
    const {px,poly}=p,t=PALETTES[o.gear[0]];
    if(!t)return;
    const front=o.dir==='front',back=o.dir==='back',side=!front&&!back;
    if(o.gear[0]===2){
      // Historical open bronze helm: hair/face remain visible.
      poly([[7,14],[8,8],[12,6],[15,4],[19,5],[23,7],[26,11],[26,15],
            [24,18],[8,18]],t.ink);
      poly([[8,13],[10,9],[14,7],[20,7],[24,10],[25,15],[8,15]],t.base);
      px(11,8,8,2,t.light);px(17,5,2,10,t.accent);px(10,15,15,2,t.dark);
      if(back){
        px(8,16,18,8,t.dark);px(10,17,14,6,t.base);
        px(16,17,2,6,t.light);
      }else{
        px(7,16,4,7,t.ink);px(8,17,2,5,t.base);
        if(!side){px(23,16,4,7,t.ink);px(24,17,2,5,t.base);}
        else if(o.dir==='right'){px(23,16,4,7,t.ink);px(24,17,2,5,t.base);}
        px(10,17,14,1,t.light);
      }
    }else{
      // Approved helmet identity: teal crown + gold central crest / brow,
      // a single dark T-shaped visor, teal cheek guards. No exposed face.
      poly([[7,14],[8,9],[12,5],[16,3],[20,5],[24,8],[26,13],
            [27,23],[24,27],[9,27],[6,23]],t.ink);
      poly([[8,13],[10,9],[14,6],[19,6],[24,10],[25,23],[23,25],
            [10,25],[8,22]],t.dark);
      poly([[10,13],[12,8],[16,7],[21,8],[23,12],[24,22],[21,24],
            [11,24],[9,21]],t.base);
      px(11,11,9,2,t.light);px(15,5,3,3,t.accent);
      px(16,4,1,11,t.accent);px(15,9,3,2,'#fff0ac');
      px(9,16,16,2,t.accent);px(10,17,14,1,'#fff0ac');
      if(front){
        px(10,19,14,3,t.ink);px(15,20,4,6,t.ink);
        px(10,23,3,2,t.light);px(21,23,3,2,t.light);
        px(13,25,9,1,t.accent);
      }else if(back){
        px(16,17,2,9,t.accent);px(11,21,12,2,t.dark);
      }else {
        if(o.dir==='right'){px(15,19,10,3,t.ink);px(19,21,3,5,t.ink);px(11,23,3,2,t.light);}
        else{px(9,19,10,3,t.ink);px(13,21,3,5,t.ink);px(20,23,3,2,t.light);}
        px(13,25,8,1,t.accent);
      }
    }
  }
  function shield(p,o,behind) {
    const {px,poly}=p,t=PALETTES[o.gear[4]];
    if(!t)return;
    const side=o.dir==='left'||o.dir==='right';
    // Shield always draws in UNDER phase on side views; face-on otherwise.
    if(behind!==side)return;
    if(side){
      const x=o.dir==='right'?5:25;
      px(x,29,3,14,t.ink);
      px(x+1,31,2,10,t.base);
      px(x+1,31,1,6,t.light);
    }else{
      const x=o.dir==='back'?23:2;
      poly([[x,30],[x+9,30],[x+10,36],[x+7,45],[x+4,47],
            [x+1,43],[x-1,36]],t.ink);
      poly([[x+1,31],[x+8,31],[x+9,36],[x+6,44],[x+4,45],[x+2,42],[x,36]],t.base);
      px(x+2,32,5,1,t.light);
      if(o.gear[4]===6){
        px(x+1,34,8,1,t.accent);px(x+4,32,2,9,t.accent);
        px(x+3,37,4,2,t.light);
      }else{
        px(x+3,35,3,6,t.dark);px(x+2,38,5,1,t.accent);
      }
    }
  }
  function sword(p,o) {
    const {px}=p,t=PALETTES[o.gear[5]]||PALETTES[o.gear[1]]||PALETTES[2];
    if(o.motion!=='sword')return;
    // Pixel staircase diagonal: source-native 1px; no baked-in white slash.
    const x=o.dir==='left'?0:29,sign=o.dir==='left'?-1:1;
    // Grip lies behind the dominant hand at y≈29, not beside it.
    px(x,28,2,6,t.dark);px(x,30,3,2,t.ink);
    for(let i=0;i<11;i++){
      const xx=x+sign*Math.floor(i*.42),yy=27-i;
      px(xx,yy,3,2,t.ink);
      px(xx+1,yy,1,2,t.light);
    }
    px(x+sign*4,15,3,2,t.light);
  }
  function draw(ctx,footX,footY,options={}) {
    if(!ctx||typeof ctx.fillRect!=='function')return false;
    const o=normalize(options),p=painter(ctx,footX,footY);
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    shield(p,o,true);
    base(p,o);
    legs(p,o);
    chest(p,o);
    gloves(p,o);
    helmet(p,o);
    shield(p,o,false);
    sword(p,o);
    ctx.restore();
    return true;
  }
  window.MyrrenArtPrototype=Object.freeze({
    draw,normalize,width:W,height:H,materials:Object.freeze(names),
    materialIds:Object.freeze([2,6]),
    status:'experimental-preview-not-approved'
  });
})();
