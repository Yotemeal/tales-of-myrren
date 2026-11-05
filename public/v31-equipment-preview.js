(() => {
  const $=id=>document.getElementById(id),img=new Image(),detail=$('detail'),lineup=$('lineup');
  let source,gear,frame=0,paused=false,last=0;
  $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';};
  $('step').onclick=()=>{paused=true;$('pause').textContent='Play';frame=(frame+1)%4;};
  function scene(canvas){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#829e68';c.fillRect(0,0,canvas.width,canvas.height);return c;}
  function draw(c,sprite,row,fi,x,y,scale){
    c.fillStyle='#354b3299';c.fillRect(x+10*scale,y+39*scale,13*scale,scale);
    c.drawImage(sprite,fi*32,row*40,32,40,x,y,32*scale,40*scale);
  }
  function tick(t){
    if(!paused&&t-last>=140){frame=(frame+1)%4;last=t;}
    const moving=$('motion').value==='walk',fi=moving?frame:0,base=moving?4:0;
    const legs=+$('legs').value,boots=+$('boots').value,atlas=$('original').checked?source:gear.get(legs,boots);
    const c=scene(detail);c.font='17px system-ui';c.textAlign='center';
    for(let d=0;d<4;d++){const x=16+d*192;draw(c,atlas,base+d,fi,x,28,5);c.fillStyle='#20331f';c.fillText(['FRONT','LEFT','RIGHT','BACK'][d],x+80,260);}
    $('status').textContent=($('original').checked?'Original V31':(legs?V31Equipment.materials[legs].name+' legs':'No leg armour')+' · '+(boots?V31Equipment.materials[boots].name+' boots':'Bare feet'))+' · '+(moving?'Walking':'Standing')+' · Frame '+(fi+1)+' of 4 · Native 32×40';
    const l=scene(lineup);l.textAlign='center';l.font='16px system-ui';
    for(let tier=1;tier<=6;tier++){const a=gear.get(tier,tier),x=16+(tier-1)*160;l.fillStyle='#20331f';l.fillText(V31Equipment.materials[tier].name,x+64,28);for(let d=0;d<4;d++)draw(l,a,base+d,fi,x,40+d*198,4);}
    requestAnimationFrame(tick);
  }
  img.onload=()=>{if(img.naturalWidth!==128||img.naturalHeight!==320){$('status').textContent='Unexpected atlas dimensions';return;}source=buildV31FeetAtlas(img);gear=V31Equipment.make(source);requestAnimationFrame(tick);};
  img.onerror=()=>{$('status').textContent='Could not load V31 artwork';};img.src='/hero_32x40_v31.png';
})();
