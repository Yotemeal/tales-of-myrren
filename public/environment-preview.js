(() => {
 'use strict';
 const E=MyrrenEnvironment,scene=document.querySelector('#scene'),c=scene.getContext('2d'),atlas=document.querySelector('#atlas'),a=atlas.getContext('2d');
 let mode='village',hero=null;
 const im=new Image();im.onload=()=>{hero=buildV31FeetAtlas(im)};im.src='/hero_32x40_v31.png';
 const caption={village:'Village · five services, market, well and waystone',woodland:'Ancient woodland · buttress roots, hanging vines and resource trees',lakeside:'Lakeside · weathered timber bridge, slate banks and flowing water'};
 document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));document.querySelector('#sceneLabel').textContent=caption[mode]}));
 const tree=(cc,k,x,y,now,big=false)=>E.tree(cc,{k,x,y,back:0},x,y,now,big);
 const text=(cc,t,x,y)=>{cc.font='12px system-ui';cc.fillStyle='#c3cbb0';cc.fillText(t,x,y)};
 function person(cc,x,y,now){if(hero){const f=Math.floor(now/280)%4;cc.drawImage(hero,f*32,0,32,40,x-16,y-40,32,40)}}
 function paintAtlas(now){
  a.fillStyle='#24372f';a.fillRect(0,0,960,640);
  text(a,'VILLAGE SERVICES',22,26);
  ['axe','pick','arms','food','fish'].forEach((id,i)=>{E.building(a,{id,w:id==='axe'?48:54},84+i*190,152,now);text(a,['Town hall','Delving supplies','Open forge','Hearth bakery','Fishing supplies'][i],40+i*190,177)});
  text(a,'WOODLAND & GATHERING',22,210);
  ['tree','oak','maple','elder','myrren'].forEach((k,i)=>{tree(a,k,62+i*112,310,now);text(a,['Timber','Oak','Maple','Elderwood','Myrrenwood'][i],30+i*112,335)});
  tree(a,'ancient',690,363,now,true);text(a,'Ancient strangler fig',628,387);person(a,821,341,now);text(a,'V31 scale reference',779,365);
  ['copper','tin','iron','coal','cobalt','aether'].forEach((k,i)=>{E.rock(a,{k,x:0,y:0,back:0},50+i*91,403,now);text(a,['Copper','Tin','Iron','Coal','Black Iron','Myrrenite'][i],24+i*91,426)});
  text(a,'TOWN PROPS',22,466);
  ['well','board','stall','lamp','barrel','crate','sack','pot','hay'].forEach((k,i)=>{E.prop(a,k,52+i*106,536,'#976953');text(a,k[0].toUpperCase()+k.slice(1),26+i*106,561)});
  text(a,'GROUND & WATER',22,596);
  ['grass','path','plaza','water','shore'].forEach((k,i)=>{for(let yy=0;yy<2;yy++)for(let xx=0;xx<4;xx++)E.terrain(a,xx+i*8,yy,170+i*151+xx*16,591+yy*16,k,now);text(a,k,170+i*151,638)});
 }
 function render(now){
  c.imageSmoothingEnabled=false;a.imageSmoothingEnabled=false;
  for(let yy=0;yy<23;yy++)for(let xx=0;xx<40;xx++){
    let kind='grass';if(mode==='village'&&yy>=11&&yy<=18&&xx>4&&xx<36)kind='plaza';
    if(mode==='village'&&xx>18&&xx<22)kind='path';
    if(mode==='woodland'&&Math.abs(xx-20-Math.round(Math.sin(yy*.3)*3))<2)kind='path';
    if(mode==='lakeside'&&xx>25)kind=xx===26?'shore':'water';
    E.terrain(c,xx+30,yy+30,xx*16,yy*16,kind,now);
  }
  if(mode==='village'){
    tree(c,'ancient',45,192,now,true);tree(c,'ancient',604,187,now,true);
    ['axe','pick','arms','food','fish'].forEach((id,i)=>E.building(c,{id,w:id==='axe'?48:54},160+i*80,196,now));
    E.prop(c,'stall',154,278,'#976953');E.prop(c,'well',234,281);E.square(c,321,288,now);E.prop(c,'board',394,282);E.prop(c,'crate',425,282);E.prop(c,'stall',483,278,'#537e79');
    for(const x of [111,276,365,531])E.prop(c,'lamp',x,284,null,null,now);
    tree(c,'oak',59,328,now);tree(c,'tree',579,334,now);person(c,326,246,now);
  }else if(mode==='woodland'){
    tree(c,'ancient',125,215,now,true);tree(c,'ancient',501,229,now,true);tree(c,'oak',232,172,now);tree(c,'elder',405,160,now);E.rock(c,{k:'copper',x:4,y:0,back:0},221,276,now);tree(c,'tree',443,310,now);tree(c,'maple',97,331,now);E.fern(c,286,251,1);E.fern(c,370,293,2);person(c,325,259,now);
  }else{
    E.brook(c,402,174,now);tree(c,'ancient',141,190,now,true);E.building(c,{id:'fish',w:52},264,193,now);E.prop(c,'barrel',218,207);E.prop(c,'crate',291,212);E.prop(c,'lamp',327,211,null,null,now);tree(c,'oak',181,330,now);E.fern(c,342,283);person(c,357,226,now);
  }
  paintAtlas(now);requestAnimationFrame(render);
 }
 requestAnimationFrame(render);
})();
