/* Read-only prototype gallery — no game state, no persistence, no network. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const directions=['front','left','right','back'];
  const motions=['idle','walk','fist','sword'];
  const LABELS={front:'FRONT',left:'LEFT',right:'RIGHT',back:'BACK',
    idle:'IDLE',walk:'WALK',fist:'BARE FIST',sword:'SWORD'};
  const P=window.MyrrenArtPrototype;
  const K=window.MyrrenKezV2Atlas;
  if(!P){$('status').textContent='Experimental renderer did not load.';return;}
  let paused=false,phase=0,last=0;

  const gearFor=()=>{
    const preset=$('preset').value;
    if(preset==='bronze')return [2,2,2,2,2,2];
    if(preset==='myrrenite')return [6,6,6,6,6,6];
    if(preset==='mixed')return [6,2,6,2,6,2];
    return [0,0,0,0,0,0];
  };
  function bg(ctx,w,h) {
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#304532';ctx.fillRect(0,0,w,h);
    ctx.imageSmoothingEnabled=false;
  }
  function drawGrid(ctx,x,y,w,h,zoom) {
    if(!$('grid').checked)return;
    ctx.save();
    ctx.strokeStyle='rgba(244,224,171,.12)';ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0;i<=w;i++) {const xx=Math.round(x+i*zoom)+.5;ctx.moveTo(xx,y);ctx.lineTo(xx,y+h*zoom);}
    for(let j=0;j<=h;j++) {const yy=Math.round(y+j*zoom)+.5;ctx.moveTo(x,yy);ctx.lineTo(x+w*zoom,yy);}
    ctx.stroke();ctx.restore();
  }
  function text(ctx,word,x,y,size=13) {
    ctx.fillStyle='#efdeba';ctx.font='600 '+size+'px system-ui,sans-serif';
    ctx.textAlign='center';ctx.fillText(word,Math.round(x),Math.round(y));
  }
  function drawPerson(ctx,x,y,options,zoom) {
    ctx.save();ctx.translate(Math.round(x),Math.round(y));
    ctx.scale(zoom,zoom);ctx.imageSmoothingEnabled=false;
    P.draw(ctx,0,0,options);ctx.restore();
  }
  function poses() {
    const cv=$('poses'),ctx=cv.getContext('2d');
    if(!ctx)return;
    bg(ctx,cv.width,cv.height);
    const zoom=Number($('zoom').value),frame=Number($('frame').value);
    const gear=gearFor(),cw=cv.width/4,ch=cv.height/4;
    for(let r=0;r<4;r++)for(let c=0;c<4;c++){
      const left=c*cw,top=r*ch,x=left+cw/2,y=top+ch-25;
      ctx.strokeStyle='rgba(225,225,170,.16)';
      ctx.strokeRect(left+.5,top+.5,cw-1,ch-1);
      text(ctx,r===0?LABELS[directions[c]]:LABELS[motions[r]],left+cw/2,top+17,12);
      ctx.fillStyle='rgba(10,22,16,.24)';
      ctx.beginPath();ctx.ellipse(x,y+1,9*zoom,2*zoom,0,0,Math.PI*2);ctx.fill();
      drawPerson(ctx,x,y,{gear,direction:directions[c],motion:motions[r],frame},zoom);
      drawGrid(ctx,x-16*zoom,y-47*zoom,32,48,zoom);
    }
  }
  function comparison() {
    const cv=$('scale'),ctx=cv.getContext('2d');
    if(!ctx)return;
    bg(ctx,cv.width,cv.height);
    const s=4,til=16*s;
    for(let i=0;i<2;i++){
      const x0=i*480;
      for(let y=0;y<cv.height;y+=til)for(let x=x0;x<x0+480;x+=til){
        ctx.fillStyle=((x/til+y/til)%2<1)?'#354e38':'#3c5540';
        ctx.fillRect(x,y,til,til);
      }
      ctx.fillStyle='#243328';ctx.fillRect(x0,0,480,43);
      text(ctx,i===0?'CURRENT KEZ V2 · 21×27':'CANDIDATE · 32×48',x0+240,25,15);
    }
    const feetY=276;
    const base=K;
    if(base?.ready){
      ctx.save();ctx.translate(235,feetY);ctx.scale(s,s);
      ctx.imageSmoothingEnabled=false;
      base.draw(ctx,0,0,{dv:'d',f:1,moving:false,animateIdle:false,tool:'fist',swingAt:-99999},0);
      ctx.restore();
    } else text(ctx,'Original atlas not loaded',240,145,13);
    drawPerson(ctx,720,feetY,{
      gear:gearFor(),direction:'front',motion:'idle',frame:Number($('frame').value)
    },s);
    text(ctx,'Both sprites at identical world scale: 4 screen px = 1 game px',480,295,12);
    ctx.strokeStyle='rgba(230,218,150,.8)';ctx.beginPath();
    ctx.moveTo(30,feetY+.5);ctx.lineTo(930,feetY+.5);ctx.stroke();
  }
  function render() {
    poses();comparison();
    const p=$('preset').selectedOptions?.[0]?.textContent||$('preset').value;
    $('status').textContent=p+' · all 4 facings · 4 motions · frame '+(Number($('frame').value)+1)+
      '/4 · native 32×48 study, not the live renderer';
  }
  function advance() {
    phase=(phase+1)%4;$('frame').value=String(phase);render();
  }
  for(const id of ['preset','frame','zoom','grid'])
    $(id).addEventListener('change',()=>{phase=Number($('frame').value);render();});
  $('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';});
  $('step').addEventListener('click',()=>{paused=true;$('pause').textContent='Play';advance();});
  function tick(ts) {
    if(!paused&&last&&ts-last>=220){last=ts;advance();}
    else if(!last)last=ts;
    requestAnimationFrame(tick);
  }
  render();
  requestAnimationFrame(tick);
})();