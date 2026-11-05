(() => {
'use strict';
const E=MyrrenEnvironment,W=MyrrenWorld,scene=document.querySelector('#scene'),c=scene.getContext('2d'),atlas=document.querySelector('#atlas'),a=atlas.getContext('2d');
let mode='village',hero=null;
const im=new Image();im.onload=()=>{hero=buildV31FeetAtlas(im)};im.src='/hero_32x40_v31.png';
const caption={village:'Village island · staggered cottages, open blacksmith and one bridge crossing',woodland:'Ancient woodland · buttress roots, hanging vines and resource trees',lakeside:'Lakeside · natural shallow banks and animated fish shoals'};
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(q=>q.setAttribute('aria-pressed',String(q===b)));document.querySelector('#sceneLabel').textContent=caption[mode]}));
const tree=(cc,k,x,y,now,big=false)=>E.tree(cc,{k,x,y,back:0},x,y,now,big);
const text=(cc,t,x,y)=>{cc.font='12px system-ui';cc.fillStyle='#c3cbb0';cc.fillText(t,x,y)};
function person(cc,x,y,now){if(hero){const f=Math.floor(now/280)%4;cc.drawImage(hero,f*32,0,32,40,x-16,y-40,32,40)}}
function paintAtlas(now){
  a.fillStyle='#24372f';a.fillRect(0,0,960,640);
  text(a,'VILLAGE SERVICES',22,26);
  ['axe','pick','arms','food','fish'].forEach((id,i)=>{E.building(a,{id,w:id==='axe'?48:54},84+i*190,152,now);text(a,['Town hall','Delving supplies','Open blacksmith','Hearth bakery','Fishing supplies'][i],40+i*190,177)});
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
 const origins={village:[448,560],woodland:[320,288],lakeside:[960,848]},[cx,cy]=origins[mode],X=x=>Math.round(x-cx),Y=y=>Math.round(y-cy);
 for(let yy=0;yy<28;yy++)for(let xx=0;xx<45;xx++){
  const wx=cx+xx*16,wy=cy+yy*16,tx=wx/16,ty=wy/16,d=W.waterDistance(wx+8,wy+8);
  E.terrain(c,tx,ty,xx*16,yy*16,d<-18?'water':W.pathKind(wx+8,wy+8),now);
  if(d>=-18&&d<18)E.waterTile(c,tx,ty,xx*16,yy*16,now,W);
 }
 E.bridge(c,X(W.bridge.x),Y(W.bridge.y));
 const draw=[];
 W.buildings.forEach(b=>draw.push({y:b.y,f:()=>E.building(c,b,X(b.x),Y(b.y),now)}));
 for(const [kind,x,y,col] of [['stall',650,850,'#976953'],['well',730,854],['board',870,856],['crate',898,858],['stall',950,850,'#537e79']])draw.push({y,f:()=>E.prop(c,kind,X(x),Y(y),col)});
 draw.push({y:857,f:()=>E.square(c,X(800),Y(857),now)});
 for(const [x,y] of [[600,814],[1000,814],[680,870],[920,870],[760,870],[840,870]])draw.push({y,f:()=>E.prop(c,'lamp',X(x),Y(y),null,null,now)});
 const scenic=[['ancient',510,640,true],['ancient',1030,603,true],['oak',475,760],['tree',549,1015],['elder',1085,1125],['ancient',1390,1245,true],['oak',1435,955],['tree',1100,1180],['ancient',430,490,true],['elder',850,470],['oak',615,630],['maple',710,520]];
 for(const [k,x,y,big] of scenic)if(W.waterDistance(x,y)>15)draw.push({y,f:()=>E.tree(c,{k,x,y,back:0},X(x),Y(y),now,big)});
 for(let i=0;i<16;i++){const p=W.fishingPosition(i/16*Math.PI*2+.3),n={...p,k:['spot1','spot2','spot3','spot4','spot5'][i%5],back:0};draw.push({y:p.y,f:()=>E.fishing(c,n,X(p.x),Y(p.y),now)})}
 const hp=mode==='village'?[800,833]:mode==='woodland'?[690,590]:[1083,1040],safe=W.safePosition(...hp);
 draw.push({y:safe.y,f:()=>person(c,X(safe.x),Y(safe.y),now)});
 draw.sort((a,b)=>a.y-b.y).forEach(q=>q.f());
 paintAtlas(now);requestAnimationFrame(render);
}
requestAnimationFrame(render);
})();