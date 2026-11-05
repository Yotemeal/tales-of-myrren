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
    const motion=$('motion').value,moving=motion==='walk',fi=frame,base=moving?4:0,action=motion==='combat'?[0,1,2,3][frame]:0;
    const head=+$('head').value,shield=+$('shield').value,body=+$('body').value,legs=+$('legs').value,boots=+$('boots').value,atlas=$('original').checked?source:gear.get(legs,boots,null,body,head,shield,action);
    const c=scene(detail);c.font='17px system-ui';c.textAlign='center';
    for(let d=0;d<4;d++){const x=16+d*192;draw(c,atlas,base+d,fi,x,28,5);c.fillStyle='#20331f';c.fillText(['FRONT','LEFT','RIGHT','BACK'][d],x+80,260);}
    $('status').textContent=($('original').checked?'Original V31':(head?V31Equipment.materials[head].name+' '+V31Equipment.designs[head].helmet:'No helmet')+' · '+(shield?V31Equipment.designs[shield].shield:'No shield')+' · '+(body?V31Equipment.materials[body].name+' chest':'No chest armour')+' · '+(legs?V31Equipment.materials[legs].name+' legs':'No leg armour')+' · '+(boots?V31Equipment.materials[boots].name+' boots':'Bare feet'))+' · '+(moving?'Walking':motion==='combat'?'Combat brace':'Standing')+' · Frame '+(fi+1)+' of 4 · Native 32×40';
    const l=scene(lineup);l.textAlign='center';l.font='16px system-ui';
    for(let tier=1;tier<=6;tier++){const a=gear.get(tier,tier,null,tier,tier,tier,action),x=16+(tier-1)*160;l.fillStyle='#20331f';l.fillText(V31Equipment.materials[tier].name+' · Lv '+[0,1,1,15,25,45,75][tier],x+64,28);for(let d=0;d<4;d++)draw(l,a,base+d,fi,x,40+d*198,4);}
    requestAnimationFrame(tick);
  }
  img.onload=()=>{if(img.naturalWidth!==128||img.naturalHeight!==320){$('status').textContent='Unexpected atlas dimensions';return;}source=buildV31FeetAtlas(img);gear=V31Equipment.make(source);requestAnimationFrame(tick);};
  img.onerror=()=>{$('status').textContent='Could not load V31 artwork';};img.src='/hero_32x40_v31.png';
})();

