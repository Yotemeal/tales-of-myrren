/* Read-only Kez V2 visual QA lab. No writes to game state, save data, or renderer files. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TIERS = [
    ['Bronze',2], ['Iron',3], ['Steel',4], ['Black Iron',5],
    ['Obsidianite',7], ['Myrrenite',6], ['Starsteel',8]
  ];
  const DIRECTIONS = [
    {label:'FRONT',dv:'d',f:1},
    {label:'LEFT',dv:'s',f:-1},
    {label:'RIGHT',dv:'s',f:1},
    {label:'BACK',dv:'u',f:1}
  ];
  const mixed=[2,4,3,8,6,7];
  let elapsed=0,previous=0,rendered=-Infinity,paused=false;

  function background(c,w,h) {
    c.clearRect(0,0,w,h);
    c.fillStyle='#28352d';
    c.fillRect(0,0,w,h);
    c.fillStyle='#314333';
    for(let y=0;y<h;y+=32) for(let x=0;x<w;x+=32) {
      if(((x+y)/32)%3===0)c.fillRect(x,y,32,32);
    }
    c.imageSmoothingEnabled=false;
  }
  function drawCell(c,{left,width,height,now,zoom,label,gear,pose}) {
    const feetX=left+width/2;
    const feetY=height-49;
    c.save();
    c.beginPath(); c.rect(left,0,width,height); c.clip();
    c.strokeStyle='#56604d';
    c.lineWidth=1;c.strokeRect(left+0.5,0.5,width-1,height-1);
    c.fillStyle='rgba(12,23,20,.25)';
    c.beginPath(); c.ellipse(feetX,feetY+2,11*zoom,2*zoom,0,0,2*Math.PI);c.fill();

    const options={
      dv:pose.dv,f:pose.f,moving:$('motion').value==='walk',
      animateIdle:false,now,swingAt:-99999,tool:'fist',g:gear,dye:null
    };
    c.translate(Math.round(feetX),Math.round(feetY));
    c.scale(zoom,zoom);
    // Correct production layering: shield behind side profile, then Kez V2,
    // then worn gear, exactly as drawKezV2/rGear compose the player.
    window.MyrrenKezV2Equipment.draw(c,0,0,options,'under');
    window.MyrrenKezV2Atlas.draw(c,0,0,options,now);
    window.MyrrenKezV2Equipment.draw(c,0,0,options,'over');
    c.restore();

    c.save();
    c.fillStyle='#eddcb6';c.font='600 12px system-ui,sans-serif';c.textAlign='center';
    c.fillText(label,Math.round(feetX),height-18);
    c.restore();
  }
  function paint(canvas,entries,now,zoom) {
    const c=canvas.getContext('2d');
    if(!c)return;
    background(c,canvas.width,canvas.height);
    const width=canvas.width/entries.length;
    entries.forEach((entry,i)=>drawCell(c,{
      ...entry,left:i*width,width,height:canvas.height,now,zoom
    }));
  }
  function render() {
    const atlas=window.MyrrenKezV2Atlas;
    const equipment=window.MyrrenKezV2Equipment;
    if(!atlas || !equipment || !atlas.ready) {
      $('status').textContent=atlas?.failed
        ?'The production Kez V2 atlas failed to load; art cannot be compared.'
        :'Waiting for the production character and equipment renderer…';
      return;
    }
    const tier=Number($('metal').value),zoom=Number($('zoom').value);
    const now=Math.floor(elapsed),chosen=Array(6).fill(tier);
    const status=TIERS.find(([name,id])=>id===tier)?.[0]||'Unknown';
    $('status').textContent='Showing CURRENT '+status+' overlay · '+$('motion').value+
      ' · 21×27 native character, '+zoom+'× QA magnification · no artwork changed';

    paint($('directional'),DIRECTIONS.map(pose=>({
      pose,gear:chosen,label:pose.label
    })),now,zoom);
    paint($('mixed'),DIRECTIONS.map(pose=>({
      pose,gear:mixed,label:pose.label
    })),now,zoom);
    paint($('lineup'),TIERS.map(([name,mat])=>({
      pose:DIRECTIONS[0],gear:Array(6).fill(mat),label:name
    })),now,Math.min(zoom,4));
  }
  $('pause').addEventListener('click',()=>{
    paused=!paused;$('pause').textContent=paused?'Resume':'Pause';render();
  });
  $('step').addEventListener('click',()=>{
    paused=true;$('pause').textContent='Resume';
    elapsed+=$('motion').value==='walk'?130:440;
    render();
  });
  for(const id of ['metal','motion','zoom'])$(id).addEventListener('change',render);
  function tick(ts){
    if(previous) {
      if(!paused)elapsed+=Math.min(80,Math.max(0,ts-previous));
    }
    previous=ts;
    if(ts-rendered>80){rendered=ts;render();}
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
