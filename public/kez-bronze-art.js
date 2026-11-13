/* Source-derived Bronze costume. Gameplay and equipment ownership stay with the game. */
(() => {
  'use strict';
  if(!new URLSearchParams(location.search).has('bronze-art'))return;
  const root='/assets/characters/kez-v3-bronze/';
  function load(name,width,height){
    const image=new Image();
    image.src=root+name+'.png';
    return {image,ready:()=>image.complete&&image.naturalWidth===width&&image.naturalHeight===height};
  }
  const body=load('bronze_32x40',512,160);
  const sword=load('bronze_sword',14,14);
  const shield=load('bronze_shield',8,10);
  const readyHands=[[6,-10],[5,-10],[-6,-10],[-5,-10]];
  const swingHands=[
    [[6,-10],[7,-11],[8,-12],[6,-17]],
    [[5,-10],[5,-11],[7,-12],[7,-17]],
    [[-6,-10],[-6,-11],[-7,-12],[7,-19]],
    [[-5,-10],[-5,-11],[-7,-12],[6,-18]]
  ];
  const ready=()=>body.ready()&&sword.ready()&&shield.ready();
  function draw(ctx,x,y,state,now,deathAge=-1,hurtAge=-1){
    const g=state.g;
    if(!ready()||g?.length!==6||g.some((mat,slot)=>slot===4?mat!==0&&mat!==2:mat!==2))return false;
    const armed=state.tool==='sword'&&state.mat===2;
    if(state.tool&&state.tool!=='fist'&&!armed)return false;
    const swing=now-(state.swingAt??-99999);
    const attacking=swing>=0&&swing<320;
    const row=state.dv==='u'?2:state.dv==='s'?(state.f<0?3:1):0;
    const phase=attacking?Math.min(armed?3:2,Math.floor(swing/80)):0;
    const col=deathAge>=0?12+Math.min(3,Math.floor(deathAge/100))
      :attacking?8+phase:state.moving?4+Math.floor(now/130)%4:0;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    if(hurtAge>=0&&hurtAge<220)ctx.globalAlpha*=.65;
    ctx.translate(Math.round(x),Math.round(y));
    const paintShield=()=>{
      if(g[4]!==2||deathAge>=0)return;
      const left=row===0||row===1;
      if(row===1||row===3){
        // Side poses show the rim. The cropped strip uses the supplied shield pixels.
        const edge=left?0:6;
        ctx.drawImage(shield.image,edge,0,2,10,left?-7:5,-14,2,10);
      }else{
        ctx.drawImage(shield.image,left?-12:4,-14);
      }
    };
    const paintSword=()=>{
      if(!armed||deathAge>=0)return;
      ctx.save();
      const [hx,hy]=attacking?swingHands[row][phase]:readyHands[row];
      ctx.translate(hx,hy);
      const mirror=attacking&&phase===3?1:row>=2?-1:1;
      ctx.scale(mirror,1);
      ctx.rotate(attacking?[-.40,-.85,.40,.12][phase]:-.60);
      ctx.drawImage(sword.image,-2,-12);
      ctx.restore();
    };
    if(row!==0)paintShield();
    if(row===2)paintSword();
    ctx.drawImage(body.image,col*32,row*40,32,40,-16,-39,32,40);
    if(row===0)paintShield();
    if(row!==2)paintSword();
    ctx.restore();
    return true;
  }
  window.MyrrenBronzeArt={draw,ready};
})();
