(()=>{
// Keep this build number in sync with the public/index.html script URL.
window.MyrrenBuild=86;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const lerp=(a,b,t)=>a+(b-a)*t;
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}

/* ---------- pixel art for icons ---------- */
const ART={
  skill_combat:{m:["............","........HH..",".......HLLH.","......HLLH..",".....HLLH...","..GG.HLLH...","...GGLLH....","....DD......","...DMD......","..DMD.......",".DDD........","............"],p:{H:'#55616a',L:'#d9e5df',G:'#e3b65d',D:'#463224',M:'#94623a'}},
  skill_forestry:{m:["............",".......DDDD.","......DHHHD","......DHHLD",".....DHHLD.","....DHHLD..","...DMMMD...","..DMMMD.....",".DMMMD......","DMMMD.......","DDD.........","............"],p:{D:'#4d3426',H:'#8e9da0',L:'#dbe1d4',M:'#a87543'}},
  skill_delving:{m:["............","...DDDDDD...","..DHHLLHDD..","...DHHLLHDD.","......M..DD.",".....M......","....M.......","...M........","..M.........",".M..........","D...........","............"],p:{D:'#455057',H:'#9eabb0',L:'#dce2d7',M:'#98633e'}},
  skill_fishing:{m:["............","...DDDDDD...","..DHLHLHDD..",".DHLHLHLHDD.","..DHLHLHDD..","...DDDDDD...","......M.....",".....M......","....M.......","...M........","..M.........","............"],p:{D:'#536e73',H:'#c2d4c6',L:'#789a9c',M:'#9a7045'}},
  skill_cooking:{m:["............","............","...DDDDDD...","..DHHHHHHD..",".DHHLLHHHHD.","DHHHLLHHHHHD","DHHHHHHHHHHD",".DMMMMMMMMD.","..DDDDDDDD..","............","............","............"],p:{D:'#6d3d2c',H:'#d58c4b',L:'#f2b96a',M:'#a85c39'}},
  skill_forging:{m:["............","............","...LLLLLL...","..LHHHHHHL..",".LHHHHHHHHL.","DMMMMMMMMMDD","DDMMMMMMMDD.","..DDDDDDDD..","............","............","............","............"],p:{D:'#65402c',H:'#e4a55c',L:'#f5d18a',M:'#b8753c'}},
  sword:{m:[".......S","......S.",".....S..","..G.S...","...S....","..H.G...",".H......","P......."],p:{S:'#d7e0e4',G:'#ffd24a',H:'#7a5230',P:'#ffd24a'}},
  axe:{m:["........","....SSS.",".....HSS","....H.S.","...H....","..H.....",".H......","H......."],p:{S:'#c8d2d6',H:'#8a5a30'}},
  pick:{m:["...S....","....S...",".....S..","....H.S.","...H...S","..H.....",".H......","H......."],p:{S:'#c8d2d6',H:'#8a5a30'}},
  helm:{m:["........","..DDDD..",".DMHHMD.","DMHMMMMD","DMMMMMMD","DMDDDDMD","DM....MD",".D....D."],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  body:{m:["DD....DD","DMD..DMD","DMMDDMMD","DMHMMHMD",".DMMMMD.",".DMHMMD.",".DMMMMD.",".DDDDDD."],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  legs:{m:["DDDDDDDD","DMMMMMMD","DMHMMHMD","DMMDDMMD","DMM..MMD","DMM..MMD","DMM..MMD","DDD..DDD"],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  boots:{m:["........","........",".DD..DD.",".DM..MD.",".DM..MD.","DDMD.DMD","DMMD.DMD","DDDD.DDD"],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  shield:{m:[".DDDDDD.","DMMMMMMD","DMHMMMMD","DMHMMMMD","DMMMMMMD",".DMMMMD.","..DMMD..","...DD..."],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  log:{m:["........","..bbbb..",".bBBBBb.","bBBdBBBb","bBBBBdBb",".bBBBBb.","..bbbb..","........"],p:{b:'#5a3a1f',B:'#9a6a38',d:'#5a3a1f'}},
  ore:{m:["........","..rrrr..",".rRRRRr.","rRRoRRRr","rRRRRoRr","rRoRRRRr",".rrrrrr.","........"],p:{r:'#4b5560',R:'#7c8a93',o:'#e0803a'}},
  coins:{m:["........","..yyyy..",".yYYYYy.","yYYyyYYy","yYYyyYYy",".yYYYYy.","..yyyy..","........"],p:{y:'#b88a10',Y:'#ffd24a'}},
  bread:{m:["........","..bbbb..",".bBBBBb.","bBBBBBBb","bBBBBBBb",".bbbbbb.","........","........"],p:{b:'#a8742a',B:'#e0b060'}},
  pet_glider:{m:["..B..B..",".BBBBBB.","GBEBBEBG","GGBCCBGG",".GBCCBG.","..BBBBTT","..B..B.T","........"],p:{B:'#a8743c',E:'#101010',G:'#6ab04a',C:'#f0dcb0',T:'#c28a52'}},
  pet_terrapin:{m:["........","..DDDD..",".DMGMMD.","DMMMGMDH","SSSSSSSH",".S.S.S..","........","........"],p:{D:'#2a4a2a',M:'#4a7a3a',G:'#7ab04a',S:'#8a8e96',H:'#7a9a5a'}},
  pet_mole:{m:["........","..DDDD..",".DBBBBD.","DBEBBEBD","DBBNNBBD",".DBBBBD.","..C.C.C.","DDDDDDDD"],p:{D:'#4a2f18',B:'#7a6a80',E:'#101010',N:'#e8a0a0',C:'#6ad8d8'}},
  net:{m:["...SSSS.","..SxSxSS","..SSxSxS","..SxSxSS","...SSSH.","...H....","..H.....",".H......"],p:{S:'#c8d2d6',x:'#e8e0c8',H:'#8a5a30'}},
  fish:{m:["........","..FFF...",".FFFFF.T","FEFFFFTT",".FFFFF.T","..FFF...","........","........"],p:{F:'#7ab0d8',E:'#101010',T:'#5a90b8'}},
  pie:{m:["........",".bbbbbb.","bBBBBBBb","bBpBBpBb","bBBBpBBb",".bbbbbb.","........","........"],p:{b:'#8a5a30',B:'#d49a52',p:'#c43a2c'}},
  bowl:{m:["........","........",".DDDDDD.","DSGSSRSD","DSSRSSGD",".DSSSSD.","..DDDD..","........"],p:{D:'#4a2f18',S:'#e0904a',R:'#c43a2c',G:'#6ab04a'}},
  compass:{m:["...WW...","..DWWD..",".DMMMMD.","WWMDDMWW","WWMDDMWW",".DMMMMD.","..DWWD..","...WW..."],p:{W:'#f4ecd4',D:'#4a2f18',M:'#c9803a'}},
  bag:{m:["..DDDD..","..DMMD..",".DDMMDD.","DMMMMMMD","DMHMMMMD","DMHMMMMD","DMMMMMMD",".DDDDDD."],p:{M:'#a8742a',H:'#d6a050',D:'#4a2f18'}},
  cog:{m:["..D..D..",".DMDDMD.","DMMHHMMD","DDH..HDD","DDH..HDD","DMMHHMMD",".DMDDMD.","..D..D.."],p:{M:'#c9a050',H:'#ecd080',D:'#4a2f18'}},
  scroll:{m:["........",".DDDDDD.","DPPPPPPD","DPLLLLPD","DPPPPPPD","DPLLLPPD","DPPPPPPD",".DDDDDD."],p:{D:'#6a4a22',P:'#efe6c8',L:'#6a5a3a'}},
  ring:{m:["........","...DD...","..DMMD..",".DM..MD.",".DM..MD.","..DMMD..","...DD...","........"],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  amulet:{m:["..D..D..",".D....D.","D......D",".D....D.","..D..D..","...DD...","..DGGD..","...DD..."],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16',G:'#e84a30'}},
  ingot:{m:["........","........","..hhhhh.",".hMMMMMd","hMMMMMdd",".dddddd.","........","........"],p:{M:'#c9803a',h:'#ecb070',d:'#6a3e16'}},
  bait:{m:["........","........","..ww....","..wWww..","....wWw.",".....ww.","........","........"],p:{w:'#b05a5a',W:'#e89a9a'}},
  rod:{m:[".......S","......S.",".....S..","....S...","...H....","..H.....",".H......","H......."],p:{S:'#d8d0b8',H:'#8a5a30'}},
  gloves:{m:["........","D.D.D.D.","DMDMDMD.","DMMMMMMD","DMHMMMMD",".DMMMMD.",".DDDDDD.","........"],p:{M:'#c9803a',H:'#ecb070',D:'#6a3e16'}},
  fist:{m:["........",".DDDDD..","DSSSSSD.","DSDSDSD.","DSSSSSSD","DSSSSSSD",".DSSSSD.","..DDDD.."],p:{S:'#e8b890',D:'#8a5a30'}}
};
const ITEMS={
  coins:{art:'coins',name:'Coins'},
  logs:{art:'log',name:'Logs'},
  oak:{art:'log',pal:{B:'#c19a5b',b:'#7a5230',d:'#7a5230'},name:'Oak logs'},
  maple:{art:'log',pal:{B:'#c4642c',b:'#7a2a14',d:'#7a2a14'},name:'Maple logs'},
  elder:{art:'log',pal:{B:'#3a9aa0',b:'#1a4a52',d:'#1a4a52'},name:'Elderwood logs'},
  myrren:{art:'log',pal:{B:'#8a5ad0',b:'#3a1a6a',d:'#3a1a6a'},name:'Myrrenwood logs'},
  copper:{art:'ore',pal:{o:'#e0803a'},name:'Copper Chunk'},
  tin:{art:'ore',pal:{o:'#d4dce4'},name:'Tin Chunk'},
  iron:{art:'ore',pal:{o:'#8c4a2a'},name:'Iron Chunk'},
  cobalt:{art:'ore',pal:{o:'#72727c',R:'#41434b'},name:'Black Iron Chunk'},
  aether:{art:'ore',pal:{o:'#b99bf0',R:'#675296',r:'#241b3b'},name:'Myrrenite Chunk'},
  coal:{art:'ore',pal:{o:'#2a2a2e',R:'#4a4a50',r:'#1a1a1e'},name:'Coal Flakes'},
  ing_bronze:{art:'ingot',pal:{M:'#c9803a',h:'#ecb070',d:'#6a3e16'},name:'Bronze Ingot'},
  ing_iron:{art:'ingot',pal:{M:'#9fb0b8',h:'#d6e2e8',d:'#4a5860'},name:'Iron Ingot'},
  ing_steel:{art:'ingot',pal:{M:'#b5cadb',h:'#f4fbff',d:'#40586e'},name:'Steel Ingot'},
  ing_cobalt:{art:'ingot',pal:{M:'#41434b',h:'#72727c',d:'#292a32'},name:'Black Iron Ingot'},
  ing_aether:{art:'ingot',pal:{M:'#675296',h:'#b99bf0',d:'#241b3b'},name:'Myrrenite Ingot'},
  bait:{art:'bait',name:'Bait'},
  coal_pouch:{art:'bag',pal:{M:'#4a4a52',H:'#7a7a86',D:'#1a1a1e'},name:'Coal Pouch'},
  bread:{art:'bread',name:'Bread'},
  pie:{art:'pie',name:'Meat pie'},
  stew:{art:'bowl',name:'Hearty stew'},
  rshrimp:{art:'fish',pal:{F:'#e8a0a0',T:'#c87878'},name:'Raw shrimp'},
  rtrout:{art:'fish',pal:{F:'#8ab07a',T:'#5a8a52'},name:'Raw trout'},
  rsalmon:{art:'fish',pal:{F:'#e87a6a',T:'#b85848'},name:'Raw salmon'},
  rtuna:{art:'fish',pal:{F:'#5a7ab0',T:'#3a5a88'},name:'Raw tuna'},
  reel:{art:'fish',pal:{F:'#b080e8',T:'#7a50b0'},name:'Raw aether eel'},
  tuna:{art:'fish',pal:{F:'#b8784a',T:'#8a5030'},name:'Cooked tuna'},
  eel:{art:'fish',pal:{F:'#9a6ad0',T:'#6a3a98'},name:'Cooked aether eel'},
  shrimp:{art:'fish',pal:{F:'#d89a58',T:'#a8703a'},name:'Cooked shrimp'},
  trout:{art:'fish',pal:{F:'#c89a5a',T:'#8a6a38'},name:'Cooked trout'},
  salmon:{art:'fish',pal:{F:'#d8744a',T:'#a84a2a'},name:'Cooked salmon'}
};
Object.assign(ITEMS,{obsidianite:{art:'ore',pal:{o:'#df5356',R:'#442b3c'},name:'Obsidianite Chunk'},meteorite:{art:'ore',pal:{o:'#83e6ff',R:'#46516e'},name:'Meteorite Fragment'},ing_obsidianite:{art:'ingot',pal:{M:'#442b3c',h:'#e65456',d:'#201c29'},name:'Obsidianite Ingot'},ing_starsteel:{art:'ingot',pal:{M:'#a2c9e2',h:'#f0f8ff',d:'#41485f'},name:'Starsteel Ingot'}});
const SELL={obsidianite:90,meteorite:500,ing_obsidianite:265,ing_starsteel:1300,logs:4,oak:8,maple:20,elder:60,myrren:180,copper:6,tin:6,iron:14,coal:12,cobalt:45,aether:170,ing_bronze:10,ing_iron:24,ing_steel:34,ing_cobalt:135,ing_aether:608,rshrimp:3,rtrout:9,rsalmon:20,rtuna:40,reel:110,shrimp:6,trout:16,salmon:34,tuna:70,eel:200};
const FOOD={bread:{heal:5,price:6},pie:{heal:10,price:18},stew:{heal:20,price:45},shrimp:{heal:4},trout:{heal:9},salmon:{heal:15},tuna:{heal:28},eel:{heal:45}};
// Cooking XP follows the value of the catch. Burn chance and food healing are unchanged.
const COOK={rshrimp:{to:'shrimp',req:1,xp:35},rtrout:{to:'trout',req:12,xp:90},rsalmon:{to:'salmon',req:25,xp:165},rtuna:{to:'tuna',req:40,xp:360},reel:{to:'eel',req:70,xp:1300}};
const SHOPS={
  axe:{name:'Woodland Town Hall',sign:'Town Hall',keeper:'Brann',wall:'#b8a888',roof:'#3f7a3a',hue:110,hair:'#8a5a30',cats:{Hatchets:['axe']},kinds:['axe'],buys:['logs','oak','maple','elder','myrren'],greet:'Brann: Welcome to town hall. I buy timber for the village. Dorn at the open forge sells axes.'},
  pick:{name:'Deepdig Picks',sign:'Picks',keeper:'Hilda',wall:'#a8a8a0',roof:'#5a6270',hue:210,hair:'#c8c0b0',cats:{Pickaxes:['pick']},kinds:['pick'],buys:['copper','tin','iron','coal','cobalt','aether','obsidianite','meteorite'],greet:'Hilda: Pickaxes for every rock. I pay well for raw chunks and coal.'},
  food:{name:'Hearth Bakery',sign:'Bakery',keeper:'Mara',wall:'#d4b890',roof:'#d8863a',hue:30,hair:'#4a2a18',food:true,cats:{},kinds:[],buys:[],greet:'Mara: Fresh bread, pies and stew. Eat up before you fight.'},
  fish:{name:'Tidewater Rods',sign:'Fishing',keeper:'Odo',wall:'#9ab0c0',roof:'#3a6a9a',hue:200,hair:'#d8d8c8',bait:true,cats:{Nets:['net'],Rods:['rod']},kinds:['net','rod'],buys:['rshrimp','rtrout','rsalmon','rtuna','reel','shrimp','trout','salmon','tuna','eel'],greet:'Odo: A net for the shallows, a rod and bait for the deep. I buy your catch, raw or cooked.'},
  arms:{name:'Elderwood Blacksmith',sign:'Forge',keeper:'Dorn',wall:'#a89c9c',roof:'#a8422a',hue:0,hair:'#2a2a30',cats:{Axes:['axe'],Weapons:['sword'],Armour:['helm','body','gloves','legs','boots','shield']},kinds:['axe','sword','helm','body','gloves','legs','boots','shield','ring','amulet'],buys:['ing_bronze','ing_iron','ing_steel','ing_cobalt','ing_aether','ing_obsidianite','ing_starsteel'],greet:'Dorn: Axes, blades and armour for sale. Use the furnace and anvil to train Forging.'}
};
SHOPS.cart={name:'Wandering Trader',sign:'Traveller',keeper:'Trader Gus',cats:{Gathering:['axe','pick','net','rod'],Combat:['sword','shield']},kinds:['axe','pick','net','rod','sword','shield'],buys:[...new Set([...SHOPS.axe.buys,...SHOPS.pick.buys,...SHOPS.fish.buys])],greet:'Trader Gus: Starter supplies for sale. I also buy your timber, minerals and fish.'};
for(const k in SHOPS)SHOPS[k].id=k;
const SHOPMAX={rod:4,net:1,helm:8,body:8,gloves:8,legs:8,boots:8,shield:8};
function svg(key,size,pal2){
  const a=ART[key],pal=Object.assign({},a.p,pal2||{});let r='';
  a.m.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=row[x];if(c!=='.'&&pal[c])r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+pal[c]+'"/>'}});
  return '<svg viewBox="0 0 '+a.m[0].length+' '+a.m.length+'" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
}
const itemSvg=(k,s)=>svg(ITEMS[k].art,s,ITEMS[k].pal);

/* ---------- gear ---------- */
const MATS=[null,
  {k:'leather',n:'Leather',M:'#8a5a30',H:'#b8844c',D:'#4a2f18',req:1},
  {k:'bronze',n:'Bronze',M:'#c9803a',H:'#ecb070',D:'#6a3e16',req:1},
  {k:'iron',n:'Iron',M:'#9fb0b8',H:'#d6e2e8',D:'#4a5860',req:15},
  {k:'steel',n:'Steel',M:'#b5cadb',H:'#f4fbff',D:'#40586e',req:25},
  {k:'cobalt',n:'Black Iron',M:'#60496f',H:'#aa8bb4',D:'#261c35',req:45},
  {k:'aether',n:'Myrrenite',M:'#198f8d',H:'#91e4db',D:'#0a3540',req:75},
  {k:'obsidianite',n:'Obsidianite',M:'#8325be',H:'#e36bff',D:'#250f39',req:40},
  {k:'starsteel',n:'Starsteel',M:'#d9e2f2',H:'#ffffff',D:'#363d51',req:70}];
const KINDS={
  sword:{slot:'weapon',art:'sword',skill:'melee',mats:[2,3,4,5,7,6,8],reqs:[1,10,20,30,40,55,70],price:[25,150,700,3500,9000,18000,40000],atk:[1,3,6,12,17,22,30],nm:{d:'sword'}},
  axe:{slot:'weapon',art:'axe',skill:'woodcutting',mats:[2,3,4,5,6],price:[20,120,600,3000,15000],nm:{d:'hatchet'}},
  pick:{slot:'weapon',art:'pick',skill:'mining',mats:[2,3,4,5,6],price:[20,120,600,3000,15000],nm:{d:'pickaxe'}},
  net:{slot:'weapon',art:'net',skill:'fishing',mats:[1,3,4],price:[12,110,550],full:true,nm:{1:'Small net',3:'Iron-hoop net',4:'Steel-hoop net'}},
  rod:{slot:'weapon',art:'rod',skill:'fishing',mats:[2,3,4,5,6],price:[30,160,800,4000,20000],reqs:[5,20,35,55,80],full:true,nm:{2:'Willow rod',3:'Ironwood rod',4:'Steel-tip rod',5:'Black Iron-line rod',6:'Myrrenite rod'}},
  ring:{slot:'ring',art:'ring',skill:'melee',mats:[2,3,4],price:[40,200,900],atk:[1,2,3],def:[0,1,2],nm:{d:'ring'}},
  amulet:{slot:'neck',art:'amulet',skill:'melee',mats:[2,3,4],price:[50,240,1000],def:[2,3,5],nm:{d:'amulet'}},
  helm:{slot:'head',art:'helm',skill:'melee',mats:[1,2,3,4,5,6],price:[10,45,220,900,3600,14000],def:[1,2,4,7,11,16],nm:{1:'cap',d:'helm'}},
  body:{slot:'body',art:'body',skill:'melee',mats:[1,2,3,4,5,6],price:[18,80,380,1500,6000,24000],def:[2,4,8,14,22,32],nm:{1:'tunic',d:'platebody'}},
  gloves:{slot:'hands',art:'gloves',skill:'melee',mats:[1,2,3,4,5,6],price:[8,30,140,550,2200,9000],def:[1,1,2,4,6,9],nm:{1:'gloves',d:'gauntlets'}},
  legs:{slot:'legs',art:'legs',skill:'melee',mats:[1,2,3,4,5,6],price:[14,60,300,1200,4800,19000],def:[1,3,6,10,16,24],nm:{1:'chaps',d:'platelegs'}},
  boots:{slot:'boots',art:'boots',skill:'melee',mats:[1,2,3,4,5,6],price:[8,35,160,650,2600,10000],def:[1,1,2,4,7,10],nm:{1:'boots',d:'boots'}},
  shield:{slot:'shield',art:'shield',skill:'melee',mats:[1,2,3,4,5,6],price:[12,50,240,950,3800,15000],def:[1,2,4,8,13,19],nm:{1:'shield',d:'shield'}}
};
const DEFS={};
for(const kind in KINDS){
  const K=KINDS[kind];
  K.mats.forEach((m,i)=>{
    const id=MATS[m].k+'_'+kind;
    const name=K.full?K.nm[m]:(m===1&&kind==='shield')?'Wooden shield':MATS[m].n+' '+(K.nm[m]||K.nm.d);
    DEFS[id]={id,kind,slot:K.slot,art:K.art,mat:m,name,req:K.reqs?K.reqs[i]:MATS[m].req,skill:K.skill,price:K.price[i],atk:K.atk?K.atk[i]:0,def:K.def?K.def[i]:0,tool:kind==='axe'||kind==='pick'||kind==='net'||kind==='rod'};
  });
}
// Stable material IDs keep existing equipment and saves compatible.
const ARMOUR_ORDER=[2,3,4,5,7,6,8],ARMOUR_LEVELS=[1,10,20,30,40,55,70];
// Myrrenite's full six-piece defence was only marginally stronger than
// Obsidianite for its substantially greater rare-ore cost. Distribute an
// eight-point defensive improvement across all six pieces. Starsteel and
// lower tiers remain unchanged; the existing diminishing-return curve stays.
const ARMOUR_DEF={helm:[2,4,7,11,14,17,21],body:[4,8,14,22,27,34,42],gloves:[1,2,4,6,8,10,12],legs:[3,6,10,16,20,26,31],boots:[1,2,4,7,9,11,14],shield:[2,4,8,13,16,20,25]};
for(const kind in ARMOUR_DEF){
 const K=KINDS[kind];K.mats=ARMOUR_ORDER.slice();delete DEFS['leather_'+kind];
 ARMOUR_ORDER.forEach((mat,i)=>{const id=MATS[mat].k+'_'+kind;DEFS[id]={id,kind,slot:K.slot,art:K.art,mat,name:MATS[mat].n+' '+K.nm.d,req:ARMOUR_LEVELS[i],skill:K.skill,price:0,atk:0,def:ARMOUR_DEF[kind][i],tool:false}});
}
const SLOTS=['head','body','hands','legs','boots','weapon','shield','ring','neck'];
const SLOTNAME={head:'Head',body:'Body',hands:'Hands',legs:'Legs',boots:'Boots',weapon:'Weapon',shield:'Shield',ring:'Ring',neck:'Amulet'};
/* smelting + forging (ingot costs from the design doc) */
// Ore processing is modest XP; finishing equipment at the anvil awards the
// bulk of Smithing XP. Per-bar forging values are tuned by metal tier rather
// than multiplying smelting XP: this prevents cheap batch smelting from
// outpacing finished-item crafting, and keeps uncommon late metals rewarding.
const SMELT=[
  {id:'bronze',mat:2,req:1,xp:4,forgeXpPerBar:7,in:{copper:1,tin:1}},
  {id:'iron',mat:3,req:10,xp:10,forgeXpPerBar:19,in:{iron:2}},
  {id:'steel',mat:4,req:20,xp:18,forgeXpPerBar:35,in:{iron:2,coal:1}},
  {id:'cobalt',mat:5,req:30,xp:35,forgeXpPerBar:120,in:{cobalt:3,coal:2}},
  {id:'obsidianite',mat:7,req:40,xp:60,forgeXpPerBar:225,in:{obsidianite:3,coal:2}},
  {id:'aether',mat:6,req:55,xp:100,forgeXpPerBar:550,in:{aether:4,coal:3}},
  {id:'starsteel',mat:8,req:70,xp:240,forgeXpPerBar:1500,in:{meteorite:3,coal:4}}];
const FORGE={axe:3,pick:3,sword:4,shield:5,helm:4,gloves:4,boots:4,legs:5,body:6};
const FORGE_UNLOCK={pick:0,axe:1,helm:2,boots:3,gloves:3,sword:4,shield:5,legs:7,body:8};
// The XP curve steepens sharply beyond 40/55/70. Compress only the extra
// recipe-unlock spacing at those tiers: getting from Starsteel bars (70) to a
// full set (formerly 78) cost over 7m XP. Ingredient counts, item equip
// requirements, XP rewards and existing player levels are unchanged.
const forgeUnlockCap=r=>r.req>=70?3:r.req>=55?4:r.req>=40?6:8;
const forgeReq=(r,kind)=>r.req+Math.min(FORGE_UNLOCK[kind],forgeUnlockCap(r));
const forgeXp=(r,cost)=>cost*r.forgeXpPerBar;
/* economy: shop price of forgeable gear = 2x its ingot value, so smelting+forging always beats buying and coins are a sink */
for(const id in DEFS){const d=DEFS[id];if(FORGE[d.kind]&&d.mat>=2){const ik='ing_'+MATS[d.mat].k;if(SELL[ik])d.price=Math.round(2*FORGE[d.kind]*SELL[ik])}}
const gearSvg=(d,s)=>{if(d.kind==='sword'&&window.MyrrenSwords?.ready)return window.MyrrenSwords.icon(d.mat,s);if(window.MyrrenArmour?.ready&&ARMOUR_DEF[d.kind])return window.MyrrenArmour.icon(d.kind,d.mat,s);const m=MATS[d.mat];return svg(d.art,s,{M:m.M,H:m.H,D:m.D,S:m.H})};

/* ---------- rules ---------- */
const NAMES={melee:'Combat',woodcutting:'Forestry',mining:'Delving',fishing:'Fishing',cooking:'Cooking',forging:'Smithing'};
const SK=['melee','woodcutting','mining','fishing','cooking','forging'];
const SKILL_ART={melee:'skill_combat',woodcutting:'skill_forestry',mining:'skill_delving',fishing:'skill_fishing',cooking:'skill_cooking',forging:'skill_forging'};
const MAXL=100,XPK=24;
const hpAt=L=>10+Math.round(L*1.5+L*L/40);
const xpTable=[0,0];
(()=>{let pts=0;for(let L=1;L<MAXL;L++){pts+=Math.floor(L+300*Math.pow(2,L/7))*(1+XPK*Math.pow(L/100,4));xpTable[L+1]=Math.floor(pts/4)}})();
const lvlFor=xp=>{let L=1;while(L<MAXL&&xp>=xpTable[L+1])L++;return L};
const oldXp=[0,0];(()=>{let pts=0;for(let L=1;L<99;L++){pts+=Math.floor(L+300*Math.pow(2,L/7));oldXp[L+1]=Math.floor(pts/4)}})();
const CODE_KIND=['','axe','pick','sword','fist','net','rod'];
// Gathering XP rewards now keep Forestry, Delving and Fishing in a
// comparable training band at milestone levels; rare resources still differ
// in success chance and value, and XP is awarded only on successful gathers.
const NT={
  // Small cuts to tree regrowth downtime; rarity, logs per gather, XP and
  // depletion odds remain unchanged. Mature and rare trees stay slower.
  tree:{name:'Tree',skill:'woodcutting',tool:'axe',req:1,xp:25,item:'logs',base:.34,dep:.5,rt:[10,16],verb:'cut'},
  oak:{name:'Oak tree',skill:'woodcutting',tool:'axe',req:10,xp:55,item:'oak',base:.22,dep:.65,rt:[14,22],verb:'cut'},
  maple:{name:'Maple tree',skill:'woodcutting',tool:'axe',req:30,xp:120,item:'maple',base:.2,dep:.7,rt:[18,27],verb:'cut'},
  elder:{name:'Elderwood tree',skill:'woodcutting',tool:'axe',req:60,xp:520,item:'elder',base:.15,dep:.75,rt:[22,34],verb:'cut'},
  myrren:{name:'Myrrenwood tree',skill:'woodcutting',tool:'axe',req:85,xp:1900,item:'myrren',base:.1,dep:.8,rt:[28,42],verb:'cut'},
  // Ore veins hold several successful gathers before depletion. Early Delving
  // also has a gentler success chance so starter mining is not mostly misses.
  // Every success still awards exactly one ore and the original XP amount.
  copper:{name:'Copper rock',skill:'mining',tool:'pick',req:1,xp:18,item:'copper',base:.42,dep:1,vein:6,rt:[6,10],verb:'mine'},
  tin:{name:'Tin rock',skill:'mining',tool:'pick',req:1,xp:18,item:'tin',base:.42,dep:1,vein:6,rt:[6,10],verb:'mine'},
  iron:{name:'Iron rock',skill:'mining',tool:'pick',req:10,xp:45,item:'iron',base:.26,dep:1,vein:5,rt:[9,14],verb:'mine'},
  coal:{name:'Coal seam',skill:'mining',tool:'pick',req:20,xp:75,item:'coal',base:.26,dep:1,vein:5,rt:[11,17],verb:'mine'},
  cobalt:{name:'Black Iron rock',skill:'mining',tool:'pick',req:30,xp:190,item:'cobalt',base:.15,dep:1,vein:4,rt:[16,24],verb:'mine'},
  aether:{name:'Myrrenite rock',skill:'mining',tool:'pick',req:55,xp:650,item:'aether',base:.1,dep:1,vein:3,rt:[22,33],verb:'mine'}
};
Object.assign(NT,{obsidianite:{name:'Obsidianite rock',skill:'mining',tool:'pick',req:40,xp:300,item:'obsidianite',base:.12,dep:1,vein:3,rt:[19,29],verb:'mine',msg:'You swing your pickaxe at the rock.'},meteorite:{name:'Meteorite deposit',skill:'mining',tool:'pick',req:70,xp:900,item:'meteorite',base:.08,dep:1,vein:2,rt:[28,42],verb:'mine',msg:'You swing your pickaxe at the meteorite.'}});
const TREEK=['tree','oak','maple','elder','myrren'];
const TOOLNAME={axe:'a hatchet',pick:'a pickaxe',net:'a net',rod:'a fishing rod'};
Object.assign(NT,{
  spot1:{name:'Shallow fishing spot',skill:'fishing',tool:'net',req:1,xp:28,item:'rshrimp',base:.38,dep:.2,rt:[8,14],verb:'fish',reach:22},
  spot2:{name:'Deep fishing spot',skill:'fishing',tool:'rod',req:12,xp:68,item:'rtrout',base:.26,dep:.2,rt:[10,16],verb:'fish',reach:22},
  spot3:{name:'Far fishing spot',skill:'fishing',tool:'rod',req:25,xp:150,item:'rsalmon',base:.18,dep:.2,rt:[12,18],verb:'fish',reach:22},
  spot4:{name:'Tuna shoal',skill:'fishing',tool:'rod',req:40,xp:400,item:'rtuna',base:.14,dep:.2,rt:[14,20],verb:'fish',reach:22},
  spot5:{name:'Aether eel pool',skill:'fishing',tool:'rod',req:70,xp:1550,item:'reel',base:.1,dep:.2,rt:[16,24],verb:'fish',reach:22}
});
for(const k of ['tree','oak','maple','elder','myrren'])NT[k].msg='You swing your hatchet at the '+NT[k].name.toLowerCase()+'.';
for(const k of ['copper','tin','iron','coal','cobalt','aether'])NT[k].msg='You swing your pickaxe at the rock.';
for(const k of ['spot1','spot2','spot3','spot4','spot5'])NT[k].msg='You cast your line into the water.';
// Large-monster rewards reflect fight difficulty without letting one
// elite kill skip entire skill brackets; coins and loot remain untouched.
const MT={
  slime:{name:'Pink slime',lv:1,hp:5,def:1,max:1,iv:2.4,sp:26,ag:30,xpm:1,coins:[2,6],bread:.1,drop:{p:.04,mats:[1]}},
  goblin:{name:'Goblin',lv:5,hp:10,def:4,max:2,iv:2.4,sp:28,ag:40,xpm:1.2,coins:[5,12],bread:.25,drop:{p:.07,mats:[1,2]}},
  wolf:{name:'Dire wolf',lv:12,hp:20,def:10,max:4,iv:2.4,sp:34,ag:50,xpm:2.2,coins:[10,24],bread:.2,drop:{p:.08,mats:[2,3]}},
  boar:{name:'Wild boar',lv:8,hp:14,def:6,max:3,iv:2.4,sp:30,ag:36,xpm:1.6,coins:[8,18],bread:.3,drop:{p:.07,mats:[1,2]}},
  bear:{name:'Brown bear',lv:22,hp:42,def:18,max:6,iv:2.6,sp:30,ag:44,xpm:4,coins:[24,52],bread:.1,drop:{p:.1,mats:[3,4]}},
  cave:{name:'Cave bear',boss:true,lv:40,hp:150,def:38,max:14,iv:2.4,sp:32,ag:50,xpm:7,coins:[30,70],bread:0,telegraph:{ms:700,radius:16},drop:{p:.12,mats:[4,5]}},
  abear:{name:'Aether bear',boss:true,lv:70,hp:520,def:68,max:28,iv:2.2,sp:34,ag:56,xpm:6,coins:[120,260],bread:0,telegraph:{ms:850,radius:18},drop:{p:.14,mats:[5,6]}}
};

// Attack warnings are opt-in. Future bosses default to a readable dodge
// marker; ordinary mobs remain untelegraphed unless their entry specifies
// `telegraph:{ms,radius}`. `telegraph:false` also lets a boss opt out.
const DEFAULT_BOSS_TELEGRAPH=Object.freeze({ms:900,radius:18});
function monsterWarningConfig(mt){
  const cfg=mt.telegraph===false?null:mt.telegraph||(mt.boss?DEFAULT_BOSS_TELEGRAPH:null);
  return cfg&&Number.isFinite(cfg.ms)&&cfg.ms>=250&&cfg.ms<mt.iv*1000
    &&Number.isFinite(cfg.radius)&&cfg.radius>=8&&cfg.radius<=40?cfg:null;
}
/* monster max hit = share of the HP a player of that level has (bosses use r of .15 to .20) */
const MR={slime:.09,goblin:.10,boar:.12,wolf:.13,bear:.11,cave:.12,abear:.12};
for(const k in MT)MT[k].max=Math.max(1,Math.round(hpAt(MT[k].lv)*(MR[k]||.12)));
/* ---------- world ---------- */
const T=16,WW=1600,WH=1600,CX=800,CY=800,SPD=90,EDGE=100;
const VILLAGE=MyrrenWorld;
const BLD=VILLAGE.buildings.map(b=>({...b}));
const LAMPS=[[CX-116,CY+12],[CX+116,CY+12],[CX-82,CY+108],[CX+82,CY+108]];
// Additional opt-in layout study only; normal gameplay keeps the original fire.
// Keep this as the single source of truth for both rendering and cooking reach.
// The study anchor is dry ground and clear of the blacksmith and lamp sprites.
const CAMPFIRE=Object.freeze(window.MyrrenCampProps?.enabled&&
  new URLSearchParams(window.location.search).has('campfire-layout-proof')
  ?{x:CX+64,y:CY+50}:{x:CX+176,y:CY-90});
// A maintained camp: keep only essential community fixtures.
const DECOR=[['board',CX-8,CY-72],['provisions',CX-185,CY-111],['provisions',CX+175,CY-112]];
const SOLID=DECOR.filter(d=>d[0]==='fence').map(d=>d[4]==='v'?{x0:d[1]-3,x1:d[1]+3,y0:d[2]-d[3]-2,y1:d[2]+1}:{x0:d[1]-2,x1:d[1]+d[3]+2,y0:d[2]-3,y1:d[2]+2});
const BOARD={x:CX-8,y:CY-72};
const TRADER={x:CX-142,y:CY-38,id:'cart'};
const RX=176,RY=128;
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=rng(2024);
const LAKE=VILLAGE.lake;
function lakeF(a){return VILLAGE.lakeF(a)}
function lakeR(x,y){return VILLAGE.lakeR(x,y)}
function inWater(x,y){return VILLAGE.inWater(x,y)}
const placed=[];
function spot(minCamp,minGap,x0,y0,x1,y1){
  for(let tries=0;tries<80;tries++){
    const x=x0+rnd()*(x1-x0),y=y0+rnd()*(y1-y0);
    if(Math.hypot(x-CX,y-CY)<minCamp)continue;
    if(VILLAGE.inVillage(x,y)||VILLAGE.waterDistance(x,y)<80)continue;
    {const o=lakeR(x,y);if(o.r<o.f+.4)continue}
    if(placed.some(p=>Math.abs(p[0]-x)<minGap&&Math.abs(p[1]-y)<minGap))continue;
    placed.push([x,y]);return [x,y];
  }
  return null;
}
const nodes=[],mons=[],BOX=[EDGE+30,EDGE+30,WW-EDGE-30,WH-EDGE-30];
function addNodes(k,n,minCamp){for(let i=0;i<n;i++){
  // Keep all harvestable trees in the outer woodland, away from the crater
  // and its Camp, so the impact cliffs remain fully visible.
  let s=null;
  if(TREEK.includes(k)){
    for(let attempt=0;attempt<240;attempt++){
      const x=BOX[0]+rnd()*(BOX[2]-BOX[0]),y=BOX[1]+rnd()*(BOX[3]-BOX[1]);
      const border=Math.min(x-EDGE,y-EDGE,WW-EDGE-x,WH-EDGE-y);
      if(border>205||Math.hypot((x-CX)/540,(y-CY)/445)<1.15)continue;
      if(VILLAGE.waterDistance(x,y)<85||placed.some(p=>Math.abs(p[0]-x)<24&&Math.abs(p[1]-y)<24))continue;
      placed.push([x,y]);s=[x,y];break;
    }
  }else s=spot(minCamp,24,BOX[0],BOX[1],BOX[2],BOX[3]);
  if(s)nodes.push({k,x:s[0],y:s[1],back:0});
}}
addNodes('tree',90,90);addNodes('oak',26,260);addNodes('copper',22,120);addNodes('iron',15,330);
(function(){const ks=['spot1','spot1','spot2','spot1','spot3','spot2','spot1','spot4','spot2','spot3','spot1','spot5','spot2','spot3','spot4','spot5'];ks.forEach((k,i)=>{const a=i/ks.length*6.2832+.3,p=VILLAGE.fishingPosition(a);nodes.push({k,x:p.x,y:p.y,back:0})})})();
function addMons(k,n,minCamp){for(let i=0;i<n;i++){const s=spot(minCamp,30,BOX[0],BOX[1],BOX[2],BOX[3]);if(s)mons.push({t:k,x:s[0],y:s[1],hx:s[0],hy:s[1],hp:MT[k].hp,state:'idle',back:0,cd:0,w:rnd()*3,wx:s[0],wy:s[1],face:1,lunge:-9999})}}
addMons('slime',16,110);addMons('goblin',12,260);addMons('boar',10,190);addMons('wolf',9,460);addMons('bear',5,560);
addNodes('tin',20,120);addNodes('maple',22,300);addNodes('coal',16,260);addNodes('cobalt',12,430);addNodes('elder',12,480);addNodes('aether',7,600);addNodes('myrren',6,640);
addMons('cave',6,620);addMons('abear',4,720);
addNodes('obsidianite',8,530);addNodes('meteorite',4,700);
// Keep the *same four* rare deposits, but redistribute the most remote
// northern meteorite to a reachable southwest mining trail. That area already
// has coal and high-tier timber; no new ore, XP or depletion supply is created.
// Validate the site against the same world constraints used by random spawns.
function establishOuterOreTrail(){
  const rare=nodes.filter(n=>n.k==='meteorite');
  if(rare.length!==4)return false;
  const moved=rare.reduce((a,b)=>a.y<b.y?a:b);
  const old=placed.find(p=>p[0]===moved.x&&p[1]===moved.y);
  const x=520,y=1470;
  if(!old||x<BOX[0]||x>BOX[2]||y<BOX[1]||y>BOX[3]||
     Math.hypot(x-CX,y-CY)<700||VILLAGE.inWater(x,y)||
     VILLAGE.waterDistance(x,y)<80||
     placed.some(p=>p!==old&&Math.abs(p[0]-x)<24&&Math.abs(p[1]-y)<24)||
     mons.some(m=>Math.hypot(m.x-x,m.y-y)<70))return false;
  old[0]=x;old[1]=y;
  moved.x=x;moved.y=y;
  return true;
}
establishOuterOreTrail();


/* ---------- save ---------- */
const KEY='ember-reach-v2';
const emptyEq=()=>({head:null,body:null,hands:null,legs:null,boots:null,weapon:null,shield:null,ring:null,neck:null});
const PACK_CAPACITY=36;
const nonNegativeCount=value=>Number.isFinite(+value)?Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.floor(+value))):0;
function parseSavedProgress(raw){
  try{
    const o=typeof raw==='string'?JSON.parse(raw):raw;
    return o&&typeof o==='object'&&!Array.isArray(o)&&o.xp&&typeof o.xp==='object'&&!Array.isArray(o.xp)?o:null;
  }catch(e){return null}
}
let save={notes:{},bank:{},packOrder:[],bankOrder:[],jobs:[],tokens:0,perks:{},dye:null,name:'',xp:{melee:0,woodcutting:0,mining:0,forging:0},inv:{coins:0,logs:0,oak:0,copper:0,iron:0,bread:0,pie:0,stew:0},eq:emptyEq(),bag:[],pets:{woodcutting:0,fishing:0,mining:0,forging:0},x:CX,y:CY+44};
let fresh=true,saveTs=0;
function migrateArmourSave(source){
 const id=k=>typeof k==='string'&&/^leather_(helm|body|gloves|legs|boots|shield)$/.test(k)?k.replace('leather_','bronze_'):k;
 const o={...source,eq:{...source.eq},bag:(Array.isArray(source.bag)?source.bag:[]).map(id)};
 for(const slot in o.eq)o.eq[slot]=id(o.eq[slot]);
 for(const field of ['notes','bank']){o[field]={};for(const [k,v] of Object.entries(source[field]||{})){const key=id(k);o[field][key]=(o[field][key]||0)+(+v||0)}}
 for(const field of ['packOrder','bankOrder']){const count={};o[field]=(Array.isArray(source[field])?source[field]:[]).map(token=>{if(typeof token!=='string')return null;const [type,k]=token.split(':');if(type==='g'){const key=id(k),n=count[key]||0;count[key]=n+1;return 'g:'+key+':'+n}return token.replace(k,id(k))})}
 return o;
}
function applySave(o){
  o=migrateArmourSave(o);
  save.jobs=[];save.tokens=0;save.perks={};save.dye=null;save.xp={};save.inv={};save.eq=emptyEq();save.bag=[];save.pets={woodcutting:0,fishing:0,mining:0,forging:0};save.name='';save.x=CX;save.y=CY+44;
  {
    if(o.xp)Object.assign(save.xp,o.xp);
    if((+o.v||0)<3){
      for(const k of Object.keys(save.xp)){
        const x=+save.xp[k]||0;let L=1;while(L<99&&x>=oldXp[L+1])L++;
        const lo=oldXp[L],hi=L>=99?lo+1:oldXp[L+1],fr=L>=99?0:(x-lo)/(hi-lo);
        save.xp[k]=Math.floor(xpTable[L]+fr*(xpTable[L+1]-xpTable[L]));
      }
    }
    if(o.inv)Object.assign(save.inv,o.inv);
    if(o.name)save.name=String(o.name).slice(0,14);
    if(+o.x)save.x=+o.x;if(+o.y)save.y=+o.y;
    if(o.eq)Object.assign(save.eq,o.eq);
    if(Array.isArray(o.jobs))save.jobs=o.jobs.slice(0,3).filter(j=>j&&Array.isArray(j.objs)&&j.objs.length).map(j=>({id:String(j.id||''),bracket:String(j.bracket||'early'),tokens:+j.tokens|0,xp:(j.xp&&typeof j.xp==='object')?j.xp:{},done:!!j.done,objs:j.objs.filter(x=>x&&((x.type==='deliver'&&ITEMS[x.item])||(x.type==='slay'&&MT[x.mon]))).map(x=>({type:x.type,skill:x.skill,item:x.item,mon:x.mon,need:+x.need|0,have:Math.min(+x.have|0,+x.need|0)}))})).filter(j=>j.objs.length);
    save.tokens=nonNegativeCount(o.tokens);if(o.perks&&typeof o.perks==='object')save.perks=Object.assign({},o.perks);save.dye=Number.isInteger(o.dye)?o.dye:null;
    if(o.pets)Object.assign(save.pets,o.pets);
    if(Array.isArray(o.bag))save.bag=o.bag.filter(id=>DEFS[id]);
    if(o.tools){
      for(const k of ['axe','pick','sword']){
        const n=+o.tools[k]||0;
        if(n>0){const id=['','bronze','iron','steel'][Math.min(3,n)]+'_'+k;if(DEFS[id]&&!save.eq[DEFS[id].slot])save.eq[DEFS[id].slot]=id}
      }
    }
    for(const old of ['axe','pick','net','rod']){const id=save.eq[old];delete save.eq[old];if(id&&DEFS[id])save.bag.push(id)}
    for(const s of SLOTS)if(save.eq[s]&&!DEFS[save.eq[s]])save.eq[s]=null;
  }
  save.notes=storedCounts(o.notes);save.bank=storedCounts(o.bank);
  save.packOrder=Array.isArray(o.packOrder)?o.packOrder.slice(0,10000):[];save.bankOrder=Array.isArray(o.bankOrder)?o.bankOrder.slice(0,10000):[];
  finalizeSave();saveTs=nonNegativeCount(o.ts);fresh=false;
}
function finalizeSave(){
  for(const k in ITEMS)save.inv[k]=nonNegativeCount(save.inv[k]);
  for(const k of SK)save.xp[k]=nonNegativeCount(save.xp[k]);
}
function loadLocalProgress(){
  let best=null;
  for(const key of [KEY,KEY+'-bak',KEY+'-bak2']){
    try{
      const o=parseSavedProgress(localStorage.getItem(key));
      if(o&&(!best||(+o.ts||0)>(+best.ts||0)))best=o;
    }catch(e){}
  }
  if(best){applySave(best);return true}
  return false;
}
if(!loadLocalProgress()){finalizeSave();save.inv.coins=30}
let lastSnapshotTs=0;
function nextSnapshotTimestamp(now,stored,issued){return Math.max(now,stored+1,issued+1)}
function snap(){const px=me.deathAt!=null?CX:inside?me.ox:me.x,py=me.deathAt!=null?CY+40:inside?me.oy:me.y;save.x=Math.round(px);save.y=Math.round(py);lastSnapshotTs=nextSnapshotTimestamp(Date.now(),saveTs,lastSnapshotTs);return{v:3,ts:lastSnapshotTs,name:save.name,xp:save.xp,inv:save.inv,eq:save.eq,bag:save.bag,pets:save.pets,notes:save.notes,bank:save.bank,packOrder:save.packOrder,bankOrder:save.bankOrder,jobs:save.jobs,tokens:save.tokens,perks:save.perks,dye:save.dye,x:save.x,y:save.y}}
function idbOpen(){return new Promise((res,rej)=>{try{const r=indexedDB.open('ember-reach',1);r.onupgradeneeded=()=>r.result.createObjectStore('s');r.onsuccess=()=>res(r.result);r.onerror=()=>rej()}catch(e){rej()}})}
// IndexedDB opens asynchronously: an older save may reach the database after
// a newer one. Never let a delayed write roll back the player's progress.
function shouldWriteSnapshot(previous,next){
  if(!next)return false;
  return !previous||(+next.ts||0)>=(+previous.ts||0);
}
async function idbPut(str){
  try{
    const incoming=parseSavedProgress(str);
    if(!incoming)return false;
    const d=await idbOpen();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction('s','readwrite'),store=tx.objectStore('s');
      const get=store.get('save');
      get.onsuccess=()=>{
        const prev=parseSavedProgress(get.result);
        if(!shouldWriteSnapshot(prev,incoming))return;
        if(prev&&(+prev.ts||0)<(+incoming.ts||0))store.put(get.result,'backup');
        store.put(str,'save');
      };
      // A failed read cannot establish which snapshot is newer. Abort instead
      // of overwriting potentially newer progress with an unverified write.
      get.onerror=()=>tx.abort();
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
      tx.onabort=()=>reject(tx.error);
    });
    d.close();
    return true;
  }catch(e){return false}
}
async function idbGetAll(){
  try{
    const d=await idbOpen();
    const values=await new Promise(resolve=>{
      const tx=d.transaction('s','readonly'),store=tx.objectStore('s'),result=[];
      for(const key of ['save','backup']){
        const q=store.get(key);
        q.onsuccess=()=>result.push(q.result||null);
      }
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>resolve(result);
    });
    d.close();
    return values;
  }catch(e){return []}
}
async function idbGet(){try{const d=await idbOpen();const v=await new Promise(res=>{const q=d.transaction('s').objectStore('s').get('save');q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)});d.close();return v}catch(e){return null}}
let cdoc=null,cloudState='checking',cloudSig='',cloudAt=0,cloudBusy=false,bakAt=0,lastSavedAt=0;
// Save timestamps change every autosave; ignore them when comparing content.
function saveSignature(str){return str.replace(/"ts":\d+,?/,'')}
async function cloudPush(str,force){
  if(saveConflict)return;
  if(!cdoc||cloudBusy)return;const sig=saveSignature(str);if(sig===cloudSig)return;
  if(!force&&Date.now()-cloudAt<20000)return;
  cloudBusy=true;try{await cdoc.set({json:str,ts:saveTs});cloudSig=sig;cloudAt=Date.now();cloudState='on'}catch(e){cloudState='error'}cloudBusy=false;
}
/* Standalone/PWA Supabase account saves. Publishable key only; RLS protects rows. */
const SB_URL='https://mwhpgxyluezkfulqpaiy.supabase.co';
const SB_KEY='sb_publishable_VQBJbObZObBq6dR3hAPkdg_ASiHeXph';
const SB_SESSION_KEY='myrren-supabase-session';
let sbSession=null,sbStatus='Sign in to enable cloud saves',sbReady=false,sbRemote=null,sbBusy=false,sbLastSig='',sbLastAt=0;
try{sbSession=JSON.parse(localStorage.getItem(SB_SESSION_KEY)||'null')}catch(e){}
async function sbRequest(path,method='GET',body=null,token=null){
  const headers={'apikey':SB_KEY,'Content-Type':'application/json'};
  if(token)headers.Authorization='Bearer '+token;
  if(path.includes('on_conflict='))headers.Prefer='resolution=merge-duplicates,return=minimal';
  const response=await fetch(SB_URL+path,{method,headers,body:body==null?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw Error((data&&(data.msg||data.error_description||data.message||data.error))||'Cloud request failed ('+response.status+')');
  return data;
}
function sbStoreSession(session){
  sbSession=session;
  try{if(session)localStorage.setItem(SB_SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SB_SESSION_KEY)}catch(e){}
}
async function sbToken(){
  if(!sbSession)return null;
  if(Date.now()/1000<(sbSession.expires_at||0)-90)return sbSession.access_token;
  try{
    const data=await sbRequest('/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:sbSession.refresh_token});
    sbStoreSession({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});
    return data.access_token;
  }catch(e){sbReady=false;sbStatus='Session expired. Sign in again.';sbStoreSession(null);return null}
}
async function sbLoad(){
  const token=await sbToken();if(!token)return;
  const rows=await sbRequest('/rest/v1/player_saves?select=save_data,updated_at&limit=1','GET',null,token);
  sbRemote=Array.isArray(rows)&&rows[0]?parseSavedProgress(rows[0].save_data):null;
  sbReady=!sbRemote;
  sbStatus=sbRemote?'Cloud character found — choose which save to keep.':'Cloud connected — autosaving';
  if(!sbRemote&&!fresh)await sbPush(JSON.stringify(snap()),true);
}
async function sbPush(str,force){
  if(saveConflict)return;
  if(!sbSession||!sbReady||sbBusy)return;
  const sig=saveSignature(str);
  if(sig===sbLastSig||(!force&&Date.now()-sbLastAt<20000))return;
  sbBusy=true;
  try{
    const token=await sbToken();if(!token)return;
    await sbRequest('/rest/v1/player_saves?on_conflict=user_id','POST',{user_id:sbSession.user.id,save_data:JSON.parse(str),updated_at:new Date().toISOString()},token);
    sbLastSig=sig;sbLastAt=Date.now();sbStatus='Cloud connected — autosaving';
  }catch(e){sbStatus='Cloud save error: '+e.message}
  finally{sbBusy=false}
}
async function sbLogin(email,password,signup){
  const data=await sbRequest(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password','POST',{email,password});
  if(!data.access_token){
    sbStatus='Check your email to confirm your account, then sign in.';
    return;
  }
  sbStoreSession({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});
  sbRemote=null;sbReady=false;sbStatus='Checking cloud character...';
  await sbLoad();
}
function sbLogout(){sbStoreSession(null);sbReady=false;sbRemote=null;sbStatus='Signed out — local saves still work'}
// A second tab may load newer character progress. Never let an older tab
// silently replace that save with its own stale inventory or equipment.
let saveConflict=false;
function isNewerExternalSave(raw,localTimestamp){
  const other=parseSavedProgress(raw);
  return !!other&&(+other.ts||0)>localTimestamp;
}
function markSaveConflict(){
  if(saveConflict)return;
  saveConflict=true;
  toast('Character updated in another tab. Reload this tab to continue safely.');
}
function persist(force){
  if(saveConflict)return;
  try{
    // Compare with the latest shared save BEFORE issuing a new timestamp.
    // A newer external save must not be overwritten by this stale session.
    let current=null;
    try{current=localStorage.getItem(KEY)}catch(e){}
    if(isNewerExternalSave(current,saveTs)){markSaveConflict();return}
    const o=snap(),str=JSON.stringify(o);saveTs=o.ts;
    try{
      const prev=localStorage.getItem(KEY);
      if(parseSavedProgress(prev)&&Date.now()-bakAt>300000){
        const backup=localStorage.getItem(KEY+'-bak');
        if(parseSavedProgress(backup))localStorage.setItem(KEY+'-bak2',backup);
        localStorage.setItem(KEY+'-bak',prev);
        bakAt=Date.now();
      }
      localStorage.setItem(KEY,str);
    }catch(e){}
    idbPut(str);cloudPush(str,force);sbPush(str,force);lastSavedAt=Date.now();
  }catch(e){}
}
const eqDef=slot=>save.eq[slot]?DEFS[save.eq[slot]]:null;
const usable=d=>lvlFor(save.xp[d.skill])>=d.req;
// Equipment is permanent: no durability, breakage, or repair costs.
const activeDef=slot=>{const d=eqDef(slot);return d&&usable(d)?d:null};
const sellVal=id=>Math.floor(DEFS[id].price*.25);
function toolFor(kind){const w=activeDef('weapon');return w&&(w.kind===kind||(kind==='net'&&w.kind==='rod'))?w:null}
// Mining upgrades are earned through the existing pickaxe equipment tiers.
// Keep the original 1.8s Bronze pace while rewarding every better pickaxe.
const PICK_INTERVAL=Object.freeze({2:1.8,3:1.65,4:1.5,5:1.35,6:1.2});
const miningInterval=pick=>PICK_INTERVAL[pick?.mat]??1.8;
const atkBonus=()=>SLOTS.reduce((s,k)=>{const d=activeDef(k);return s+(d?d.atk:0)},0);
const defRed=()=>{const D=defTotal();return Math.min(.45,.5*D/(D+70))};
const defTotal=()=>SLOTS.reduce((s,k)=>{const d=activeDef(k);return s+(d?d.def:0)},0);
const hpMax=()=>hpAt(lvlFor(save.xp.melee));
const foodPrice=k=>Math.max(FOOD[k].price,Math.round(FOOD[k].price*Math.sqrt(Math.max(1,hpMax()/40))));
const healOf=k=>Math.round(FOOD[k].heal*Math.max(1,hpMax()/40));
const totalLevel=()=>SK.reduce((t,k)=>t+lvlFor(save.xp[k]),0);
const pouchHides=(inv=save.inv)=>inv.coal_pouch>0&&inv.coal<=100;
const stackKinds=(inv=save.inv)=>Object.keys(ITEMS).filter(k=>k!=='coins'&&inv[k]>0&&!(k==='coal'&&pouchHides(inv)));
const slotsUsed=(inv=save.inv,bag=save.bag)=>stackKinds(inv).length+bag.length+noteKinds().length;
function canFitInventory(changes={},extraGear=0,noteChanges={}){
  const inv=Object.assign({},save.inv);
  for(const [key,delta] of Object.entries(changes))inv[key]=(inv[key]||0)+delta;
  // Older saves may already overflow. Keep their items and allow stacking or
  // consuming them, while refusing operations that add another occupied slot.
  const notes=Object.assign({},save.notes||{});
  for(const [id,delta] of Object.entries(noteChanges))notes[id]=(notes[id]||0)+delta;
  return slotsUsed(inv)-noteKinds().length+noteKinds(notes).length+extraGear<=Math.max(PACK_CAPACITY,slotsUsed());
}
function refreshHeld(){const w=activeDef('weapon');me.tool=w?w.kind:'fist';me.mat=w?w.mat:2;if(w)me.hold=1e12;else if(me.hold>1e11)me.hold=0}
const gearArr=()=>['head','body','legs','boots','shield','hands'].map(s=>{const d=eqDef(s);return d?d.mat:0});
const me={x:clamp(save.x,EDGE+8,WW-EDGE-8),y:clamp(save.y,EDGE+8,WH-EDGE-8),face:1,hue:Math.floor(Math.random()*360),hp:0,moving:false,swing:-9999,swings:0,hold:0,tool:'',mat:2,wave:0};
me.hp=hpMax();me.fx=0;me.fy=1;me.pend=0;me.tgt=null;me.tgtUntil=0;me.catchFx=null;
me.ox=me.x;me.oy=me.y;
const cam={x:me.x-100,y:me.y-100};
let started=false,act=null,regen=0,waveN=0,marker=null,idleT=0,lastSkill='melee',inside=null,exitCD=0,fade=0,snapCam=false;
const blocked=new Set(),splats=[],fx=[],decals=[];
// Short-lived, capped contact flashes are visual-only and never enter saves.
const combatImpacts=[];

/* ---------- hud + chat ---------- */
const chat=$('chat'),chatLines=[];
const stamp=()=>{const d=new Date();return '['+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+'] '};
function say(t,c){
  chatLines.push({t:stamp()+t,c:c||''});if(chatLines.length>40)chatLines.shift();
  chat.textContent='';chatLines.slice(-2).forEach(l=>{const li=document.createElement('li');li.textContent=l.t;if(l.c)li.className=l.c;chat.append(li)});
}
let toastT=0;
function toast(t){const e=$('toast');e.textContent=saveConflict?'Character updated in another tab. Reload this tab to continue safely.':t;e.classList.add('on');clearTimeout(toastT);if(!saveConflict)toastT=setTimeout(()=>e.classList.remove('on'),1800)}
function uiQuest(){
  const q=$('qline');if(!q)return;const n=save.jobs.length;
  if(!n){q.hidden=true;return}
  const r=save.jobs.filter(j=>j.done).length;
  q.hidden=false;q.textContent='Odd jobs: '+n+(r?' ('+r+' ready)':'');
}
function uiCurrencies(){
  $('mCoins').textContent=save.inv.coins.toLocaleString();$('mTokens').textContent=save.tokens.toLocaleString();
}
function uiHud(){
  uiQuest();
  const m=hpMax();
  $('hpFill').style.width='calc('+clamp(me.hp/m,0,1)*100+'% - 8px)';
  $('hpTxt').textContent=Math.max(0,me.hp)+' / '+m;
  $('lvlTxt').textContent=lvlFor(save.xp.melee);
  $('eatN').textContent=foodCount()||'';
  // Player name is kept in save data for chat; it is not shown in the HUD.
  uiCurrencies();
}
document.querySelectorAll('[data-i]').forEach(e=>{const k=e.dataset.i;e.innerHTML=ITEMS[k]?itemSvg(k,22):svg(k,22)});
// Minimal Crater menu icons: single-weight gold outlines matching approved UI.
// These affect HUD navigation only, never equipment or inventory item sprites.
const HUD_LINE_ICONS={
  helm:'<path d="M12 3 4.5 6.5V13c0 5 3.2 7.7 7.5 9 4.3-1.3 7.5-4 7.5-9V6.5L12 3Z"/>',
  pick:'<path d="M5 20v-5M12 20V9M19 20V4"/>',
  scroll:'<path d="M7 3h11a2 2 0 0 1 2 2v13H8a3 3 0 0 1-3-3V6a3 3 0 0 0-3-3h5Z"/><path d="M2 3a3 3 0 0 1 3 3v2h5V6a3 3 0 0 0-3-3M8 18v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2H8ZM10 8h7M10 12h7M10 16h4"/>',
  cog:'<path d="M10 2h4l.7 2.3 1.8.8 2.1-1.1 2.8 2.8-1.1 2.1.8 1.8L23 11v4l-2.3.7-.8 1.8 1.1 2.1-2.8 2.8-2.1-1.1-1.8.8L14 23h-4l-.7-2.3-1.8-.8-2.1 1.1-2.8-2.8 1.1-2.1-.8-1.8L1 15v-4l2.3-.7.8-1.8L3 6.4l2.8-2.8 2.1 1.1 1.8-.8L10 2Z"/><circle cx="12" cy="13" r="3"/>',
  bag:'<rect x="4" y="7" width="16" height="15" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2M8 13h8v6H8zM10 16h4"/>'
};
document.querySelectorAll('#hudR [data-i]').forEach(e=>{
  const art=HUD_LINE_ICONS[e.dataset.i];
  if(art)e.innerHTML='<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="#dfbc86" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+art+'</svg>';
});

/* ---------- gear actions ---------- */
let tab='',sel=null,shopCat='weapons',lastTab='gear';
let outdoorShop=null;
const curShop=()=>inside?SHOPS[inside.id]:outdoorShop&&Math.hypot(me.x-outdoorShop.x,me.y-outdoorShop.y)<110?SHOPS[outdoorShop.id]:null;
function onGearChange(){if(act?.kind==='node')act=null;blocked.clear();try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur()}catch(e){}refreshHeld();persist();renderModal();uiHud();refreshActionButtons();sendPresence()}
function equipFromBag(idx){
  const id=save.bag[idx],d=DEFS[id];if(!d)return;
  if(!usable(d)){say('You need '+NAMES[d.skill]+' '+d.req+' to use that.','warn');return}
  const old=save.eq[d.slot];save.eq[d.slot]=id;save.bag.splice(idx,1);if(old)save.bag.push(old);
  sel={src:'eq',key:d.slot};say('You equip the '+d.name.toLowerCase()+'.');onGearChange();
}
function unequip(slot){
  if(!save.eq[slot])return;
  if(!canFitInventory({},1)){say('Your pack is full.','warn');return}
  save.bag.push(save.eq[slot]);save.eq[slot]=null;sel={src:'eq',key:slot};onGearChange();
}
function sellGear(idx){
  const d=DEFS[save.bag[idx]];if(!d)return;
  const v=sellVal(d.id);save.inv.coins+=v;save.bag.splice(idx,1);sel=null;
  say('The shopkeeper pays you '+v+' coins for the '+d.name.toLowerCase()+'.','gold');persist();renderModal();uiHud();
}
function sellStack(k){
  const v=save.inv[k]*SELL[k];if(!v)return;
  save.inv.coins+=v;save.inv[k]=0;sel=null;say('The shopkeeper pays you '+v+' coins.','gold');persist();renderModal();uiHud();
}
const foodCount=()=>Object.keys(FOOD).reduce((t,k)=>t+(save.inv[k]||0),0);
function eat(k){if(me.deathAt!=null)return;
  if(!foodCount())return;
  if(me.hp>=hpMax()){say('You are already at full health.');return}
  if(!k||!(save.inv[k]>0)){
    const have=Object.keys(FOOD).filter(f=>save.inv[f]>0).sort((a,b)=>FOOD[a].heal-FOOD[b].heal),miss=hpMax()-me.hp;
    k=have.filter(f=>healOf(f)<=miss).pop()||have[0];
  }
  save.inv[k]--;me.hp=Math.min(hpMax(),me.hp+healOf(k));say('You eat the '+ITEMS[k].name.toLowerCase()+'. It heals '+healOf(k)+' health.');uiHud();persist();if(tab)renderModal();
}
const owned=id=>save.bag.includes(id)||SLOTS.some(s=>save.eq[s]===id);
function buyItem(id){
  const d=DEFS[id];
  if(owned(id)){say('You already have that.','warn');return}
  if(save.inv.coins<d.price){say('You cannot afford that.','warn');return}
  if((save.eq[d.slot]||!usable(d))&&!canFitInventory({},1)){say('Your pack is full.','warn');return}
  save.inv.coins-=d.price;
  if(!save.eq[d.slot]&&usable(d)){save.eq[d.slot]=id;say('You buy and equip the '+d.name.toLowerCase()+'.','gold')}
  else{save.bag.push(id);say('You buy the '+d.name.toLowerCase()+'.','gold')}
  onGearChange();
}
function giveGear(id){
  if(!canFitInventory({},1)){say('You find a '+DEFS[id].name.toLowerCase()+' but your pack is full.','warn');return}
  save.bag.push(id);say('Rare drop: '+DEFS[id].name+'!','gold');
}
// OSRS-style XP drops are transient UI only; they never enter the save file.
// All six skills and monster-kill rewards pass through addXp.
const XP_DROP_MS=1200,XP_DROP_CAP=5,XP_DROP_COALESCE_MS=125;
const xpPopups=[],xpDropLayer=$('xpDrops');
function queueXpDrop(skill,amount,now=performance.now()){
  if(!SKILL_ART[skill]||!Number.isFinite(amount)||amount<=0)return null;
  // Multiple XP grants of the same skill in one instant become one readable tick.
  const latest=xpPopups[0];
  if(latest&&latest.skill===skill&&now>=latest.at&&now-latest.at<XP_DROP_COALESCE_MS){
    latest.amount+=amount;
    latest.label.textContent='+'+latest.amount.toLocaleString('en-AU');
    return latest;
  }
  const node=document.createElement('div'),icon=document.createElement('span'),labelNode=document.createElement('span');
  node.className='xp-drop';icon.className='xp-drop-icon';labelNode.className='xp-drop-amount';
  node.setAttribute('title',NAMES[skill]+' XP');
  icon.innerHTML=svg(SKILL_ART[skill],15);
  labelNode.textContent='+'+amount.toLocaleString('en-AU');
  node.append(icon,labelNode);
  xpDropLayer.prepend(node);
  const drop={skill,amount,at:now,element:node,label:labelNode};
  xpPopups.unshift(drop);
  if(xpPopups.length>XP_DROP_CAP){const old=xpPopups.pop();old.element.remove()}
  setTimeout(()=>{
    const index=xpPopups.indexOf(drop);
    if(index!==-1)xpPopups.splice(index,1);
    node.remove();
  },XP_DROP_MS);
  return drop;
}
function addXp(skill,amt){
  const before=lvlFor(save.xp[skill]),pm=hpMax();
  // Skill-pet bonus applies only while its owner has called the pet (state 1).
  const awarded=skill==='forging'&&save.pets.forging===1?Math.floor(amt*1.03):amt;
  save.xp[skill]+=awarded;lastSkill=skill;
  queueXpDrop(skill,awarded);
  if(skill==='forging'&&save.pets.forging===1)reactForgingPet(awarded-amt);const after=lvlFor(save.xp[skill]);
  if(after>before){say('Congratulations, you just advanced a '+NAMES[skill]+' level. You are now level '+after+'.','gold');toast(NAMES[skill].toUpperCase()+'\nLEVEL '+after);if(skill==='melee')me.hp=Math.min(hpMax(),me.hp+Math.max(1,hpMax()-pm));blocked.clear()}
  if(after>before)sfx('level');else if(skill!=='melee')sfx('gather');
  uiHud();if(tab==='skills')renderModal();
}

/* ---------- modal ---------- */
const modal=$('modal'),mBody=$('mBody');
const TITLES={gear:'Equipment',pack:'Inventory',skills:'Skills',players:'Party',shop:'Shop',smelt:'Furnace · Smelting',forge:'Anvil · Forging',cook:'Campfire · Cooking',settings:'Settings',board:'Community Board',jobs:'Odd Jobs',odd:'Odd Shop',bank:'Storage Chest'};
function openModal(t){if(me.deathAt!=null)return;if(smithJob&&t!==(smithJob.type==='smelt'?'smelt':'forge'))stopSmithing('',false);if(cookJob&&t!=='cook')stopCooking('',false);closeItemMenu();if(!tab)gpIdx=-1;tab=t;if(t!=='shop'&&t!=='smelt'&&t!=='forge'&&t!=='cook'&&t!=='settings'&&t!=='board'&&t!=='odd')lastTab=t;sel=null;renderModal()}
function closeModal(){stopSmithing('',false);stopCooking('',false);closeItemMenu();tab='';sel=null;outdoorShop=null;renderModal()}
function renderModal(){
  modal.dataset.screen=tab;
  modal.hidden=!tab;
  document.querySelectorAll('#hudR button').forEach(b=>{const screen=b.dataset.uiOpen||(b.id==='bBag'?'pack':'settings');b.setAttribute('aria-pressed',String(tab===screen))});
  const noteToggle=$('bBanknotes');
  noteToggle.hidden=tab!=='bank';
  noteToggle.setAttribute('aria-pressed',String(withdrawNoted));
  noteToggle.title=withdrawNoted?'Withdraw banknotes · selected':'Withdraw normal items · select for banknotes';
  if(!tab)return;
  uiCurrencies();
  const st=mBody.scrollTop;
  $('mTitle').textContent=tab==='shop'&&curShop()?curShop().name:TITLES[tab];
  mBody.textContent='';
  ({gear:rGear,pack:rPack,skills:rSkills,players:rPlayers,shop:rShop,smelt:rSmelt,forge:rForge,cook:rCook,settings:rSettings,board:rBoard,jobs:rJobs,odd:rOdd,bank:rBank})[tab]();
  mBody.scrollTop=st;
  gpAfterRender();
}
function statLine(d){
  const p=[];
  if(d.atk)p.push('+'+d.atk+' attack');
  if(d.def)p.push('+'+d.def+' defence');
  if(d.tool)p.push('+'+Math.max(0,(d.mat-2)*6)+'% gather chance');
  return p.join(', ')||'Basic gear';
}
function detail(){
  const box=el('div','detail');
  if(!sel){box.innerHTML='<small>Tap an item to see what it does.</small>';return box}
  let name='',info='',btns=[];
  if(sel.src==='bag'&&sel.kind==='note'){
    const entry=selectedInventoryEntry();if(!entry){sel=null;return detail()}
    name=itemName(entry.id)+' banknotes x'+entry.count.toLocaleString();info='Stackable banknotes. Deposit at the bank, then withdraw as items to use them.';
  }else if(sel.src==='bag'&&sel.kind==='stack'){
    const k=sel.key;if(!(save.inv[k]>0)){sel=null;return detail()}
    name=ITEMS[k].name+' x'+save.inv[k].toLocaleString();
    info=k==='coal_pouch'?'Holds up to 100 coal flakes without using pack slots. Untradeable.':FOOD[k]?'Heals '+healOf(k)+' health.':SELL[k]?'Sells for '+SELL[k]+' coins each at the matching shop.':'Spend them in the shops.';
    if(FOOD[k])btns.push(['Eat',()=>eat(k)]);
    if(SELL[k]&&curShop()&&curShop().buys.includes(k))btns.push(['Sell all',()=>sellStack(k)]);
  }else{
    const id=sel.src==='bag'?save.bag[sel.idx]:save.eq[sel.key];
    if(!id){if(sel.src==='eq'){box.innerHTML='<b>'+SLOTNAME[sel.key]+' slot</b><small>Empty. Pick something from your pack below.</small>';return box}sel=null;return detail()}
    const d=DEFS[id],ok=usable(d);
    name=d.name;
    info='<span>'+statLine(d)+'</span><br><span class="'+(ok?'ok':'bad')+'">Needs '+NAMES[d.skill]+' '+d.req+' (you have '+lvlFor(save.xp[d.skill])+')</span>';
    if(sel.src==='bag'){btns.push(['Equip',()=>equipFromBag(sel.idx)]);if(curShop()&&curShop().kinds.includes(d.kind))btns.push(['Sell '+sellVal(d.id),()=>sellGear(sel.idx)])}
    else btns.push(['Unequip',()=>unequip(sel.key)]);
  }
  const more=selectedInventoryEntry();if(more)btns.push(['More…',()=>openItemMenu(more,'pack')]);
  box.innerHTML='<b>'+name+'</b><small>'+info+'</small>';
  if(btns.length){const row=el('div','row');btns.forEach(([t,fn])=>{const b=el('button','btn grow',t);b.type='button';b.addEventListener('click',fn);row.append(b)});box.append(row)}
  return box;
}
/* ---------- personal bank, banknotes and persistent slot order ---------- */
function storedItem(id){return id!=='coins'&&(Object.hasOwn(ITEMS,id)||Object.hasOwn(DEFS,id))}
function storedCounts(value){
  const counts={};
  if(value&&typeof value==='object'&&!Array.isArray(value))for(const [id,n] of Object.entries(value))if(storedItem(id)&&nonNegativeCount(n))counts[id]=nonNegativeCount(n);
  return counts;
}
const noteKinds=(notes=save.notes||{})=>Object.keys(notes).filter(id=>storedItem(id)&&notes[id]>0);
function inventoryEntries(source='pack'){
  if(source==='bank')return Object.entries(save.bank).filter(([,n])=>n>0).map(([id,count])=>({key:'b:'+id,id,count,kind:'bank'}));
  const entries=stackKinds().map(id=>({key:'s:'+id,id,count:save.inv[id],kind:'stack'})),occurrences={};
  save.bag.forEach((id,idx)=>{const n=occurrences[id]||0;occurrences[id]=n+1;entries.push({key:'g:'+id+':'+n,id,count:1,kind:'gear',idx})});
  for(const id of noteKinds())entries.push({key:'n:'+id,id,count:save.notes[id],kind:'note'});
  return entries;
}
function reconcileSlots(entries,order=[],minimum=PACK_CAPACITY){
  const pending=new Set(entries.map(e=>e.key)),result=[];
  for(const key of Array.isArray(order)?order.slice(0,10000):[]){
    result.push(pending.has(key)?key:null);pending.delete(key);
  }
  while(result.length<minimum)result.push(null);
  for(const key of pending){const empty=result.indexOf(null);if(empty<0)result.push(key);else result[empty]=key}
  while(result.length>minimum&&result[result.length-1]===null)result.pop();
  return result;
}
function inventorySlots(source='pack'){
  const entries=inventoryEntries(source),field=source==='bank'?'bankOrder':'packOrder';
  save[field]=reconcileSlots(entries,save[field]);
  const byKey=new Map(entries.map(e=>[e.key,e]));
  return save[field].map(key=>byKey.get(key)||null);
}
function moveInventorySlot(source,from,to){
  const slots=inventorySlots(source),field=source==='bank'?'bankOrder':'packOrder';
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=slots.length||to>=slots.length||!slots[from]||from===to)return false;
  [save[field][from],save[field][to]]=[save[field][to],save[field][from]];
  persist();renderModal();return true;
}
const bankAccess=()=>!inside&&Math.hypot(me.x-SPOTS.bank.x,me.y-SPOTS.bank.y)<42;
const itemName=id=>DEFS[id]?DEFS[id].name:ITEMS[id].name;
const requestedAmount=(n,available)=>n==='all'?available:Math.min(available,Math.max(1,Math.floor(+n)||1));
function availableItem(entry){
  if(entry.kind==='bank')return save.bank[entry.id]||0;
  if(entry.kind==='note')return (save.notes||{})[entry.id]||0;
  if(entry.kind==='gear')return save.bag.filter(id=>id===entry.id).length;
  return save.inv[entry.id]||0;
}
function removeCarried(entry,n){
  if(entry.kind==='note'){save.notes[entry.id]-=n;if(!save.notes[entry.id])delete save.notes[entry.id]}
  else if(entry.kind==='gear'){let left=n;save.bag=save.bag.filter(id=>id===entry.id&&left>0?(left--,false):true)}
  else save.inv[entry.id]-=n;
}
function finishItemTransfer(message){
  closeItemMenu();sel=null;persist(true);uiHud();renderModal();say(message);
}
function depositItem(entry,quantity){
  if(!bankAccess()||entry.kind==='bank')return false;
  const n=requestedAmount(quantity,availableItem(entry));if(!n)return false;
  // Banking the coal pouch can expose a coal stack, so check before removing it.
  if(entry.kind==='stack'&&!canFitInventory({[entry.id]:-n}))return false;
  removeCarried(entry,n);save.bank[entry.id]=(save.bank[entry.id]||0)+n;
  finishItemTransfer('You deposit '+n+' '+itemName(entry.id)+'.');return true;
}
function withdrawItem(id,quantity,noted=false){
  if(!bankAccess()||!storedItem(id))return false;
  const have=save.bank[id]||0;let n=requestedAmount(quantity,have);if(!n)return false;
  if(noted&&id==='coal_pouch'){say('The coal pouch cannot be noted.','warn');return false}
  if(noted){if(!canFitInventory({},0,{[id]:n})){say('Your pack is full.','warn');return false}}
  else if(DEFS[id]){n=Math.min(n,Math.max(0,PACK_CAPACITY-slotsUsed()));if(!n){say('Your pack is full.','warn');return false}}
  else if(!canFitInventory({[id]:n})){say('Your pack is full.','warn');return false}
  save.bank[id]-=n;if(!save.bank[id])delete save.bank[id];
  if(noted)save.notes[id]=(save.notes[id]||0)+n;
  else if(DEFS[id])for(let i=0;i<n;i++)save.bag.push(id);
  else save.inv[id]+=n;
  finishItemTransfer('You withdraw '+n+' '+itemName(id)+(noted?' as banknotes.':'.'));return true;
}
function canSellEntry(entry){
  const shop=curShop();return !!shop&&(DEFS[entry.id]?shop.kinds.includes(DEFS[entry.id].kind):!!SELL[entry.id]&&shop.buys.includes(entry.id));
}
function sellItemQuantity(entry,quantity){
  if(entry.kind==='bank'||!canSellEntry(entry)){say('Visit a shop that buys this item.','warn');return false}
  const n=requestedAmount(quantity,availableItem(entry));if(!n)return false;
  const price=DEFS[entry.id]?sellVal(entry.id):SELL[entry.id];
  removeCarried(entry,n);save.inv.coins+=n*price;
  finishItemTransfer('You sell '+n+' '+itemName(entry.id)+' for '+(n*price).toLocaleString()+' gold.');return true;
}

let withdrawNoted=false,bankMobilePane='bank',itemMenu=null,inventoryDrag=null;
function entryIcon(entry,size=44){
  const art=DEFS[entry.id]?gearSvg(DEFS[entry.id],size):itemSvg(entry.id,size);
  return (entry.kind==='note'?'<span class="note-paper">'+art+'</span>':art)+(entry.count>1||entry.kind!=='gear'?'<em>'+entry.count.toLocaleString()+'</em>':'');
}
function inventoryGrid(source='pack'){
  const grid=el('div','pack inventory-grid');grid.dataset.inventory=source;
  inventorySlots(source).forEach((entry,index)=>{
    const b=el('button','slot');b.type='button';b.dataset.slotIndex=index;b.dataset.inventory=source;
    if(entry){
      b.dataset.itemKey=entry.key;b.innerHTML=entryIcon(entry);b.title=itemName(entry.id);b.setAttribute('aria-label',itemName(entry.id)+(entry.kind==='note'?' banknote':'')+' x'+entry.count);
      if(entry.kind==='gear'&&!usable(DEFS[entry.id]))b.classList.add('dim');
      b.addEventListener('click',()=>{
        if(b.dataset.suppressClick){delete b.dataset.suppressClick;return}
        if(source==='bank'){openItemMenu(entry,source,b);return}
        sel=entry.kind==='gear'?{src:'bag',kind:'gear',idx:entry.idx}:{src:'bag',kind:entry.kind,key:entry.id};renderModal();
      });
      b.addEventListener('contextmenu',e=>{e.preventDefault();openItemMenu(entry,source,b)});
    }else{b.disabled=true;b.setAttribute('aria-label','Empty '+(source==='bank'?'bank':'backpack')+' slot')}
    grid.append(b);
  });return grid;
}
function closeItemMenu(){if(itemMenu){itemMenu.remove();itemMenu=null}}
function openItemMenu(entry,source,anchor){
  closeItemMenu();
  const menu=el('div','item-action-menu');menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Item actions');
  const head=el('div','item-menu-heading'),title=el('strong');title.textContent=itemName(entry.id)+(entry.kind==='note'?' · Banknote':'');
  const close=el('button','btn','×');close.type='button';close.setAttribute('aria-label','Close item actions');close.addEventListener('click',closeItemMenu);head.append(title,close);menu.append(head);
  let quantity=1;const quantities=el('div','item-quantities');
  for(const amount of [1,5,10,'all']){const b=el('button','btn',amount==='all'?'All':String(amount));b.type='button';b.setAttribute('aria-pressed',String(amount===quantity));b.addEventListener('click',()=>{quantity=amount;for(const other of quantities.children)other.setAttribute('aria-pressed',String(other===b))});quantities.append(b)}menu.append(quantities);
  const actions=el('div','item-menu-actions');
  const action=(label,fn,enabled=true)=>{const b=el('button','btn',label);b.type='button';b.disabled=!enabled;b.addEventListener('click',fn);actions.append(b)};
  if(source==='bank')action(withdrawNoted?'Get banknotes':'Get items',()=>withdrawItem(entry.id,quantity,withdrawNoted));
  else{action(bankAccess()?'Deposit':'Deposit · at bank',()=>depositItem(entry,quantity),bankAccess());action(canSellEntry(entry)?'Sell':'Sell · at shop',()=>sellItemQuantity(entry,quantity),canSellEntry(entry))}
  menu.append(actions);document.body.append(menu);itemMenu=menu;
  const r=anchor?.getBoundingClientRect(),width=menu.offsetWidth||280,height=menu.offsetHeight||180;
  menu.style.left=Math.max(8,Math.min(innerWidth-width-8,r?r.left:innerWidth/2-width/2))+'px';
  menu.style.top=Math.max(8,Math.min(innerHeight-height-8,r?r.bottom+5:innerHeight/2-height/2))+'px';
  close.focus();
}
function selectedInventoryEntry(){
  if(!sel||sel.src!=='bag')return null;
  return inventoryEntries().find(e=>sel.kind==='gear'?e.kind==='gear'&&e.idx===sel.idx:e.kind===sel.kind&&e.id===sel.key)||null;
}
function rBank(){
  const paneTabs=el('div','bank-pane-tabs');
  for(const pane of ['bank','pack']){const b=el('button','btn',pane==='bank'?'Chest':'Backpack');b.type='button';b.setAttribute('aria-pressed',String(bankMobilePane===pane));b.addEventListener('click',()=>{bankMobilePane=pane;closeItemMenu();renderModal()});paneTabs.append(b)}
  mBody.append(paneTabs,el('p','note','Drag items to rearrange. Hold an item or right-click for 1, 5, 10 or all. Banknotes stack, and must be deposited before withdrawing usable items.'));
  const layout=el('div','bank-layout'),bank=el('section','bank-pane'),pack=el('section','carried-pane');layout.dataset.activePane=bankMobilePane;
  bank.append(inventoryHeading('BANK CHEST',Object.keys(save.bank).length+' types'),inventoryGrid('bank'));
  pack.append(inventoryHeading('BACKPACK',slotsUsed()+' / '+PACK_CAPACITY),inventoryGrid('pack'));
  layout.append(bank,pack);mBody.append(layout);
}
function finishInventoryPointer(e,cancelled=false){
  const drag=inventoryDrag;if(!drag||e.pointerId!==drag.pointerId)return;
  clearTimeout(drag.timer);inventoryDrag=null;
  if(drag.ghost)drag.ghost.remove();
  if(drag.dragging&&!cancelled){
    const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot-index]');
    if(target&&target.dataset.inventory===drag.source)moveInventorySlot(drag.source,drag.index,+target.dataset.slotIndex);
  }
}
mBody.addEventListener('pointerdown',e=>{
  const b=e.target.closest('button[data-item-key]');if(!b||e.button!==0)return;
  closeItemMenu();const source=b.dataset.inventory,entry=inventorySlots(source)[+b.dataset.slotIndex];
  const drag={pointerId:e.pointerId,source,index:+b.dataset.slotIndex,x:e.clientX,y:e.clientY,button:b,entry,dragging:false,ghost:null};inventoryDrag=drag;
  drag.timer=setTimeout(()=>{if(inventoryDrag!==drag||drag.dragging)return;b.dataset.suppressClick='1';openItemMenu(entry,source,b)},450);
  b.setPointerCapture(e.pointerId);
});
mBody.addEventListener('pointermove',e=>{
  const drag=inventoryDrag;if(!drag||drag.pointerId!==e.pointerId)return;
  if(!drag.dragging&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){
    clearTimeout(drag.timer);closeItemMenu();drag.dragging=true;drag.button.dataset.suppressClick='1';
    drag.ghost=el('div','inventory-drag-ghost',entryIcon(drag.entry));document.body.append(drag.ghost);
  }
  if(drag.dragging){e.preventDefault();const r=mBody.getBoundingClientRect();if(e.clientY>r.bottom-24)mBody.scrollTop+=8;else if(e.clientY<r.top+24)mBody.scrollTop-=8;drag.ghost.style.left=e.clientX-28+'px';drag.ghost.style.top=e.clientY-28+'px'}
});
mBody.addEventListener('pointerup',e=>finishInventoryPointer(e));
mBody.addEventListener('pointercancel',e=>finishInventoryPointer(e,true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&itemMenu){e.preventDefault();closeItemMenu()}});
document.addEventListener('pointerdown',e=>{if(itemMenu&&!itemMenu.contains(e.target)&&!e.target.closest('[data-item-key]'))closeItemMenu()});

function equipmentPaper(){
  const g=el('div','paper'),icons={neck:'amulet',head:'helm',ring:'ring',weapon:'sword',body:'body',shield:'shield',hands:'gloves',legs:'legs',boots:'boots'};
  [['neck','head','ring'],['weapon','body','shield'],['hands','legs',null],[null,'boots',null]].flat().forEach(sl=>{
    if(!sl){g.append(el('span'));return}
    const id=save.eq[sl],b=el('button','slot');b.type='button';b.title=SLOTNAME[sl];
    if(id){b.innerHTML=gearSvg(DEFS[id],44);b.setAttribute('aria-label',SLOTNAME[sl]+': '+DEFS[id].name)}
    else{b.innerHTML='<span class="ghost">'+svg(icons[sl],36)+'</span><small>'+SLOTNAME[sl]+'</small>';b.setAttribute('aria-label',SLOTNAME[sl]+' slot, empty')}
    if(sel&&sel.src==='eq'&&sel.key===sl)b.classList.add('sel');
    b.addEventListener('click',()=>{sel={src:'eq',key:sl};renderModal()});g.append(b);
  });return g;
}
function equipmentStats(cls='eqside'){
 const box=el('div',cls);
 for(const [name,value] of [['Attack','+'+atkBonus()],['Defence','+'+defTotal()],['Combat',lvlFor(save.xp.melee)],['Reduction',Math.round(defRed()*100)+'%']])box.append(el('div','eqtot','<span>'+name+'</span><b>'+value+'</b>'));
 return box;
}
function backpackGrid(){return inventoryGrid('pack')}
function inventoryHeading(title,value=''){
 const h=el('div','pane-heading'),b=el('strong','',title),v=el('span');v.textContent=value;h.append(b,v);return h;
}

function rGear(){
 mBody.append(inventoryHeading('EQUIPPED',save.name||'Wanderer'));
 const sheet=el('div','character-sheet'),portrait=el('div','character-portrait'),canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;canvas.setAttribute('aria-label','Your equipped character');portrait.append(canvas);
 const v2Portrait=!!window.MyrrenKezV2Atlas?.ready;
 if(v2Portrait){
   const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
   // Keep the portrait consistent with the actual in-world preview.
   // Kez V2 equipment previews share world-scale sprite anchors.
   const scale=4;
   const portraitPose={dv:'d',f:1,moving:false,animateIdle:true,swingAt:-99999};
   let lastFrame=-1;
   function paintPortrait(now){
     if(tab!=='gear')return;
     if(!canvas.isConnected)return; // Stop obsolete portrait loops after modal refresh.
     const frame=Math.floor(now/440)%4;
     if(frame!==lastFrame){
       lastFrame=frame;
       c.clearRect(0,0,canvas.width,canvas.height);
       c.save();c.scale(scale,scale);
       c.fillStyle='rgba(34,29,25,.18)';c.fillRect(10,38,12,2);
       const equipped={...portraitPose,g:gearArr(),dye:save.dye,now};
       window.MyrrenKezV2Equipment?.draw(c,16,39,equipped,'under');
       window.MyrrenKezV2Atlas.draw(c,16,39,equipped,now);
       window.MyrrenKezV2Equipment?.draw(c,16,39,equipped,'over');
       c.restore();
     }
     requestAnimationFrame(paintPortrait);
   }
   requestAnimationFrame(paintPortrait);
   // The portrait itself is the preview; no caption overlay obscuring the sprite.
 }
 else{portrait.append(el('div','v2-portrait-caption','Loading Kez V2 artwork…'))}
 sheet.append(equipmentPaper(),portrait,equipmentStats('character-stats'));mBody.append(sheet);
 if(sel&&sel.src==='eq'){
   const pop=el('div','gear-info-popover'),close=el('button','gear-info-close','×');
   close.type='button';close.setAttribute('aria-label','Close equipment information');
   close.addEventListener('click',()=>{sel=null;renderModal()});
   pop.append(close,detail());sheet.append(pop);
 }else if(sel&&sel.src==='bag'){
   const pop=el('div','gear-info-popover'),close=el('button','gear-info-close','×');
   close.type='button';close.setAttribute('aria-label','Close item information');
   close.addEventListener('click',()=>{sel=null;renderModal()});
   pop.append(close,detail());sheet.append(pop);
 }
 const candidates=save.bag.map((id,i)=>({id,i,d:DEFS[id]})).filter(o=>o.d&&(!(sel&&sel.src==='eq')||o.d.slot===sel.key));
 if(sel&&sel.src==='eq')mBody.append(el('h3','sub','IN YOUR PACK · '+SLOTNAME[sel.key]));
 if(sel&&sel.src==='eq'&&!candidates.length)mBody.append(el('p','note','No spare equipment fits this slot.'));
 const grid=el('div','owned-gear');candidates.forEach(o=>{const b=el('button','slot'+(!usable(o.d)?' dim':''));b.type='button';b.innerHTML=gearSvg(o.d,44);b.title=o.d.name;b.setAttribute('aria-label',o.d.name);b.addEventListener('click',()=>{sel={src:'bag',kind:'gear',idx:o.i};renderModal()});grid.append(b)});if(sel&&sel.src==='eq'&&candidates.length)mBody.append(grid);
}
function rPack(){
 const layout=el('div','inventory-layout'),pack=el('section','pack-pane');
 pack.append(inventoryHeading('BACKPACK',slotsUsed()+' / '+PACK_CAPACITY),backpackGrid());
 if(sel&&sel.src==='bag'){
   const pop=el('div','pack-info-popover'),close=el('button','pack-info-close','×');
   close.type='button';close.setAttribute('aria-label','Close item information');
   close.addEventListener('click',()=>{sel=null;renderModal()});
   pop.append(close,detail());pack.append(pop);
 }
 layout.append(pack);mBody.append(layout);
}
let skillFocus=null;
function rSkills(){
 const descriptions={
  melee:['Combat','Train by defeating creatures with your equipped weapon. Combat experience is awarded only when you get the kill, never for individual hits.','Stronger equipment needs a higher Combat level. Keep an eye on your health and eat when you need to recover.'],
  woodcutting:['Forestry','Equip a hatchet, stand beside a tree and face it. Use the tool button or E to gather timber.','Higher levels unlock tougher trees. Timber can be sold in town, and rare gathering pets can follow you.'],
  mining:['Delving','Equip a pickaxe and face an ore rock to gather metal. Higher levels unlock richer ores.','Ore is used at the furnace and anvil, where production trains the separate Forging skill.'],
  fishing:['Fishing','Use a net at shallow fishing spots, or a rod for deeper shoals. Rod casts use bait from the fishing shop.','Face the ripples from the bank and use your tool. Better fishing spots need a higher Fishing level.'],
  cooking:['Cooking','Cook raw fish at the village fire or bakery oven. Cooked food restores health when eaten.','Higher levels unlock more catches to cook and improve your chance of preparing a meal successfully.'],
  forging:['Forging','Smelt ore into ingots at the furnace for modest XP, then forge weapons and armour at the anvil for much higher XP.','Buying ingots is fast but expensive; mining your own ore takes longer. Equipment recipes unlock gradually within each metal tier.']
 };
 const k=skillFocus,layout=el('div','skills-layout');
 const grid=el('div','grid2 skill-grid');
 for(const skill of SK){const xp=save.xp[skill],level=lvlFor(xp),lo=xpTable[level],hi=level>=MAXL?xpTable[MAXL]:xpTable[level+1],pct=level>=MAXL?100:(xp-lo)/(hi-lo)*100,b=el('button','skill');b.type='button';b.setAttribute('aria-label',NAMES[skill]+' level '+level);b.setAttribute('aria-pressed',String(k===skill));b.innerHTML='<span class="skill-top"><span class="ic">'+svg(SKILL_ART[skill],34)+'</span><span class="level">'+level+'</span></span><b>'+NAMES[skill]+'</b><span class="bar" aria-hidden="true"><i style="width:'+pct+'%"></i></span>';b.addEventListener('click',()=>{skillFocus=skillFocus===skill?null:skill;renderModal()});grid.append(b)}
 grid.append(el('div','skill total','<span class="skill-top"><span class="level">'+totalLevel()+'</span></span><b>Total level</b>'));
 layout.append(grid);
 if(k&&descriptions[k]){
   const info=descriptions[k],L=lvlFor(save.xp[k]),pop=el('section','skill-info-popover'),close=el('button','skill-info-close','×');
   close.type='button';close.setAttribute('aria-label','Close skill information');close.addEventListener('click',()=>{skillFocus=null;renderModal()});
   pop.append(close,el('h3','',info[0].toUpperCase()),el('p','',info[1]),el('p','',info[2]),el('p','skill-xp','Level '+L+' · '+Math.floor(save.xp[k]).toLocaleString()+' experience'));
   layout.append(pop);
 }
 mBody.append(layout);

}
const peers=new Map();
function rPlayers(){
  const ol=el('ol','plist');ol.id='plist';mBody.append(ol);
  const w=el('button','btn',"Wave");w.type='button';w.style.cssText='width:100%;margin-top:8px;height:40px';
  w.addEventListener('click',()=>{waveN++;me.wave=performance.now()+2200;sendPresence()});
  mBody.append(w);refreshPlayers();
}

const GAME_VER='0.5.0',DISCORD_URL='';
let cfg={sfx:true,vol:.6,pad:true};
try{Object.assign(cfg,JSON.parse(localStorage.getItem('myrren-settings')||'{}'))}catch(e){}
const saveCfg=()=>{try{localStorage.setItem('myrren-settings',JSON.stringify(cfg))}catch(e){}};
let AC=null;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
addEventListener('pointerdown',()=>{if(cfg.sfx)audio()},{passive:true});
function tone(f0,f1,dur,type,vol,delay){
  const a=AC;if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(vol*cfg.vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);
}
function sfx(k){
  if(!cfg.sfx||cfg.vol<=0||!AC)return;
  try{
    if(k==='swing')tone(500,160,.12,'triangle',.12);
    else if(k==='hit'){tone(180,60,.14,'square',.16);tone(700,300,.05,'sawtooth',.06)}
    else if(k==='miss')tone(300,200,.08,'sine',.06);
    else if(k==='gather')tone(900,500,.07,'square',.07);
    else if(k==='level')[523,659,784,1047].forEach((f,i)=>tone(f,f*1.01,.18,'triangle',.14,i*.09));
  }catch(e){}
}

/* ---------- controller (Gamepad API: Xbox / PlayStation / MFi over Bluetooth or USB) ---------- */
let gpName='',gpPrev=[];
let gpFocus=null,gpIdx=-1,gpHold=0,gpCD=0;
const gpList=()=>[...document.querySelectorAll('#hudR button,#mClose,#mBody button:not([disabled]),#mBody input[type=range],.window-footer button:not([disabled])')].filter(e=>e.offsetParent!==null);
function gpSet(e){
  if(gpFocus)gpFocus.classList.remove('gpf');
  gpFocus=e;if(e){e.classList.add('gpf');gpIdx=gpList().indexOf(e);try{e.scrollIntoView({block:'nearest'})}catch(_){}}
}
function gpAfterRender(){
  gpFocus=null;
  if(!tab||!gpName||!cfg.pad)return;
  const L=gpList();if(!L.length)return;
  if(gpIdx<0){const f=L.find(e=>mBody.contains(e));gpSet(f||L[0])}
  else gpSet(L[Math.min(gpIdx,L.length-1)]);
}
function gpNav(dx,dy){
  const L=gpList();if(!L.length)return;
  if(!gpFocus||!L.includes(gpFocus)){gpSet(L[Math.min(Math.max(gpIdx,0),L.length-1)]);return}
  if(gpFocus.type==='range'&&dx){gpFocus.value=clamp(+gpFocus.value+dx*10,0,100);gpFocus.dispatchEvent(new Event('input'));gpFocus.dispatchEvent(new Event('change'));return}
  const r=gpFocus.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bs=1e9;
  for(const e of L){
    if(e===gpFocus)continue;const q=e.getBoundingClientRect(),vx=q.left+q.width/2-cx,vy=q.top+q.height/2-cy;
    const along=vx*dx+vy*dy;if(along<=2)continue;
    const sc=along+Math.abs(vx*dy-vy*dx)*2.5;if(sc<bs){bs=sc;best=e}
  }
  if(best)gpSet(best);else if(dy)mBody.scrollTop+=dy*60;
}

const gpNone={x:0,y:0,atk:false};
function activePad(){
  try{const l=navigator.getGamepads?navigator.getGamepads():[];for(const g of l)if(g&&g.connected&&g.buttons&&g.buttons.length>=8)return g}catch(e){}
  return null;
}
function pollPad(now){
  const g=activePad();
  if(!g){if(gpName){gpName='';if(tab==='settings')renderModal()}return gpNone}
  const nm=(g.id||'Controller').replace(/\s*\(.*$/,'').slice(0,40)||'Controller';
  if(nm!==gpName){gpName=nm;if(tab==='settings')renderModal()}
  if(!cfg.pad)return gpNone;
  const B=i=>!!(g.buttons[i]&&g.buttons[i].pressed),edge=i=>B(i)&&!gpPrev[i];
  const out={x:0,y:0,atk:false};
  const dz=v=>Math.abs(v)<.2?0:v;
  let ax=dz(g.axes[0]||0),ay=dz(g.axes[1]||0);
  if(B(14))ax=-1;if(B(15))ax=1;if(B(12))ay=-1;if(B(13))ay=1;
  if(started&&edge(9)){tab==='settings'?closeModal():openModal('settings')}
  else if(started&&edge(8)){tab==='pack'?closeModal():openModal('pack')}
  else if(started&&edge(1)&&tab)closeModal();
  if(started&&tab){
    const tabs=['gear','pack','skills','jobs','players'];
    if(tabs.includes(tab)){
      const i=tabs.indexOf(tab);
      if(edge(4)){gpIdx=-1;openModal(tabs[(i+4)%5])}
      if(edge(5)){gpIdx=-1;openModal(tabs[(i+1)%5])}
    }
    let dx=0,dy=0;
    if(Math.abs(ax)>=Math.abs(ay))dx=Math.abs(ax)>.6?Math.sign(ax):0;else dy=Math.abs(ay)>.6?Math.sign(ay):0;
    if(dx||dy){
      if(!gpHold||now>=gpCD){gpCD=now+(gpHold?140:320);gpHold=1;gpNav(dx,dy)}
    }else gpHold=0;
    if(edge(0)){if(gpFocus&&document.body.contains(gpFocus)){if(gpFocus.type!=='range')gpFocus.click()}else gpNav(0,1)}
  }else if(started){
    out.x=ax;out.y=ay;
    out.atk=B(2)||B(7)||B(5)||B(6);
    if(edge(0))useAction();
    if(edge(3))eat();
  }
  gpPrev=g.buttons.map(b=>!!b.pressed);
  return out;
}
addEventListener('gamepadconnected',()=>{if(tab==='settings')renderModal();toast('Controller connected')});
addEventListener('gamepaddisconnected',()=>{if(tab==='settings')renderModal()});
function rSettings(){
  const top=el('div','');
  const row=(label,node)=>{const r=el('div','shoprow');r.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px';const l=el('span','',label);r.append(l,node);return r};
  const tg=el('button','btn',cfg.sfx?'On':'Off');tg.type='button';tg.style.minWidth='70px';
  tg.addEventListener('click',()=>{cfg.sfx=!cfg.sfx;saveCfg();if(cfg.sfx){audio();sfx('level')}renderModal()});
  top.append(row('Game sounds',tg));
  const vol=document.createElement('input');vol.type='range';vol.min=0;vol.max=100;vol.value=Math.round(cfg.vol*100);vol.style.cssText='flex:1;max-width:150px';vol.setAttribute('aria-label','Volume');
  vol.addEventListener('input',()=>{cfg.vol=vol.value/100;saveCfg()});vol.addEventListener('change',()=>{audio();sfx('hit')});
  top.append(row('Volume',vol));
  const pt=el('button','btn',cfg.pad?'On':'Off');pt.type='button';pt.style.minWidth='70px';
  pt.addEventListener('click',()=>{cfg.pad=!cfg.pad;saveCfg();renderModal()});
  top.append(row('Controller support',pt));
  const party=el('button','btn','Open party');party.type='button';party.addEventListener('click',()=>openModal('players'));
  top.append(row('Players',party));
  mBody.append(top);
  mBody.append(el('p','note',gpName?'Controller connected: '+gpName+'.':'No controller found. Pair it in your device Bluetooth settings (hold the pair button on an Xbox controller), then press any button on it.'));
  mBody.append(el('p','note','Left stick or D-pad: move. A: gather or talk. X, RT or RB: attack (hold to keep swinging). Y: eat. Menu: this screen. View: backpack. LB and RB: switch tabs. B: close menus.'));
  mBody.append(el('h3','sub','Save'));
  const sv=el('div','');sv.style.cssText='margin-top:6px';
  const st=el('div','',(cloudState==='on'?'Cloud save: ON (survives cleared browser data). ':cloudState==='error'?'Cloud save: ERROR, using this device only. ':'Cloud save: OFF, saving on this device only. ')+(lastSavedAt?'Last saved '+Math.round((Date.now()-lastSavedAt)/1000)+'s ago.':''));
  st.style.cssText='font:18px VT323,monospace;line-height:1.1;margin-bottom:6px';sv.append(st);
  const box=document.createElement('textarea');box.rows=3;box.placeholder='Save code appears here. Paste a code to restore.';box.style.cssText='width:100%;font:14px monospace;background:#1d120a;color:#ffe9a8;border:2px solid #6a4422;box-sizing:border-box';
  const mk=(t,fn)=>{const b=el('button','btn',t);b.type='button';b.style.cssText='width:49%;height:38px;margin:6px 1% 0 0';b.addEventListener('click',fn);return b};
  const bExp=mk('Export code',()=>{persist(true);box.value='ER1.'+btoa(unescape(encodeURIComponent(JSON.stringify(snap()))));box.select();try{navigator.clipboard.writeText(box.value).then(()=>toast('Save code copied'),()=>toast('Code ready: copy it from the box'))}catch(e){toast('Code ready: copy it from the box')}});
  const bImp=mk('Restore code',()=>{try{const c=box.value.trim().replace(/^ER1\./,'');const o=JSON.parse(decodeURIComponent(escape(atob(c))));if(!o||!o.xp)throw 0;o.ts=Date.now();adoptSave(o);persist(true);toast('Save restored');renderModal()}catch(e){toast('That code is not valid')}});
  const auth=el('div','');auth.style.cssText='margin:8px 0;padding:7px;border:1px solid #73502c';
  const authStatus=el('p','note','Account cloud save: '+sbStatus);auth.append(authStatus);
  const action=(label,fn)=>{const b=el('button','btn',label);b.type='button';b.style.cssText='margin:3px;min-height:35px';b.onclick=async()=>{b.disabled=true;try{await fn();renderModal()}catch(e){toast(e.message);authStatus.textContent='Account cloud save: '+e.message}finally{b.disabled=false}};return b};
  if(!sbSession){
    const email=el('input',''),password=el('input','');
    email.type='email';email.placeholder='Email address';email.autocomplete='email';
    password.type='password';password.placeholder='Password (6+ characters)';password.autocomplete='current-password';
    for(const field of [email,password])field.style.cssText='display:block;width:100%;box-sizing:border-box;margin:4px 0;padding:7px;background:#21160e;color:#fff0c5;border:1px solid #89643d;font-size:16px';
    auth.append(email,password,action('Sign in',()=>sbLogin(email.value.trim(),password.value,false)),action('Create account',()=>sbLogin(email.value.trim(),password.value,true)));
  }else{
    auth.append(el('p','note','Signed in: '+(sbSession.user&&sbSession.user.email||'Account')));
    if(sbRemote){
      auth.append(el('p','note','A cloud character exists. Select carefully: restoring replaces this device progress; keeping local replaces the cloud character.'));
      auth.append(action('Restore cloud',async()=>{adoptSave(sbRemote);persist(false);sbRemote=null;sbReady=true;sbLastSig='';await sbPush(JSON.stringify(snap()),true);toast('Cloud character restored')}));
      auth.append(action('Keep this device',async()=>{sbRemote=null;sbReady=true;sbLastSig='';await sbPush(JSON.stringify(snap()),true);toast('Device progress uploaded')}));
    }else{
      auth.append(action('Save to cloud now',async()=>{persist(true);await sbPush(JSON.stringify(snap()),true);toast(sbStatus)}));
    }
    auth.append(action('Sign out',async()=>sbLogout()));
  }
  sv.append(auth,box,bExp,bImp);mBody.append(sv);

  rSettingsTail();
}
function rSettingsTail(){
  mBody.append(el('h3','sub','About'));
  mBody.append(el('p','note','Tales of Myrren version '+GAME_VER+'.'));
  if(DISCORD_URL){const a=el('a','btn','Join the Discord');a.href=DISCORD_URL;a.target='_blank';a.rel='noopener';a.style.cssText='display:block;text-align:center;text-decoration:none;margin-top:6px';mBody.append(a)}
  else mBody.append(el('p','note','Discord: the community link has not been set up yet.'));
}

/* ---------- odd jobs ---------- */
const JOB_SKILLS=['melee','woodcutting','mining','fishing','cooking'];
const JOB_POOL={
  mining:[['copper',1],['tin',1],['iron',10],['coal',20],['cobalt',30],['obsidianite',40],['aether',55],['meteorite',70]],
  woodcutting:[['logs',1],['oak',10],['maple',30],['elder',60],['myrren',85]],
  fishing:[['rshrimp',1],['rtrout',12],['rsalmon',25],['rtuna',40],['reel',70]],
  cooking:[['shrimp',1],['trout',12],['salmon',25],['tuna',40],['eel',70]]};
const ITEMXP={};for(const k in NT)ITEMXP[NT[k].item]=NT[k].xp;for(const r in COOK)ITEMXP[COOK[r].to]=COOK[r].xp;
const BR=L=>L>=70?'end':L>=30?'mid':'early';
const BRNAME={early:'Early',mid:'Mid',end:'End-game'};
const QTY={early:[15,40],mid:[30,60],end:[50,100]},SLAYQ={early:[8,20],mid:[20,40],end:[30,60]};
const jobDone=j=>j.objs.every(o=>o.have>=o.need);
let boardOffers=null,boardLv=0;
function mkObj(sk){
  const L=lvlFor(save.xp[sk]),br=BR(L);
  if(sk==='melee'){
    let pool=Object.keys(MT).filter(k=>MT[k].lv<=L+15);if(!pool.length)pool=['slime'];
    const good=pool.filter(k=>MT[k].lv>=L*.4);if(good.length)pool=good;
    return {type:'slay',skill:sk,mon:pool[rint(0,pool.length-1)],need:rint(SLAYQ[br][0],SLAYQ[br][1]),have:0};
  }
  let el=JOB_POOL[sk].filter(x=>x[1]<=L);if(!el.length)el=[JOB_POOL[sk][0]];
  const top=el.slice(-3);
  return {type:'deliver',skill:sk,item:top[rint(0,top.length-1)][0],need:rint(QTY[br][0],QTY[br][1]),have:0};
}
const objXp=o=>o.type==='slay'?Math.round(o.need*MT[o.mon].hp*2*MT[o.mon].xpm):Math.round(o.need*(ITEMXP[o.item]||10)*1.5);
function genOffers(){
  boardLv=totalLevel();
  boardOffers=[0,1,2].map(()=>{
    const sks=JOB_SKILLS.slice().sort(()=>Math.random()-.5),br=BR(lvlFor(save.xp[sks[0]]));
    const cnt=br==='end'?3:br==='mid'?2:1,objs=[];
    for(let i=0;i<cnt;i++)objs.push(mkObj(sks[i]));
    const xp={};objs.forEach(o=>{xp[o.skill]=(xp[o.skill]||0)+objXp(o)});
    return {id:Date.now().toString(36)+rint(0,9999),bracket:br,objs,xp,tokens:br==='end'?rint(25,40):br==='mid'?rint(8,14):rint(2,4),done:false};
  });
}
const objTxt=o=>o.type==='slay'?'Slay '+o.need+' '+MT[o.mon].name.toLowerCase()+'s':'Deliver '+o.need+' '+ITEMS[o.item].name.toLowerCase();
const rewTxt=j=>Object.keys(j.xp).map(k=>NAMES[k]+' '+j.xp[k].toLocaleString()+' xp').join(', ')+' + '+j.tokens+' tokens';
function acceptJob(j){
  if(save.jobs.length>=3){say('Your job log is full. Drop a job first.','warn');return}
  save.jobs.push(JSON.parse(JSON.stringify(j)));boardOffers=boardOffers.filter(x=>x.id!==j.id);
  say('You take an odd job slip.','gold');persist();uiHud();renderModal();
}
function dropJob(id){
  save.jobs=save.jobs.filter(j=>j.id!==id);say('You drop the job slip.');persist();uiHud();renderModal();
}
function claimJob(id){
  const j=save.jobs.find(x=>x.id===id);if(!j||!j.done)return;  save.jobs=save.jobs.filter(x=>x.id!==id);save.tokens+=j.tokens;
  for(const k in j.xp)addXp(k,j.xp[k]);
  say('Odd job paid: '+rewTxt(j)+'.','gold');persist(true);uiHud();renderModal();
}
let supplyBusy=false;
function supplyDeposit(){
  if(supplyBusy)return;supplyBusy=true;
  try{
    if(!save.jobs.length){say('The crate is empty. Take odd jobs from the board first.','warn');return}
    let moved=0;
    for(const j of save.jobs)for(const o of j.objs){
      if(o.type!=='deliver')continue;const need=o.need-o.have;if(need<=0)continue;
      const take=Math.min(need,save.inv[o.item]||0);if(take>0){save.inv[o.item]-=take;o.have+=take;moved+=take}
    }
    for(const j of save.jobs){const was=j.done;j.done=jobDone(j);if(j.done&&!was)say('An odd job is complete. Claim it in your Jobs tab.','gold')}
    say(moved?'You place '+moved+' items in the supply crate.':'You have nothing the jobs need.',moved?'':'warn');
    persist(true);uiHud();openModal('jobs');
  }finally{supplyBusy=false}
}
function objRows(j,parent){
  j.objs.forEach(o=>{
    const full=o.have>=o.need;
    parent.append(el('div','',(full?'[x] ':'[ ] ')+objTxt(o)+' ('+Math.min(o.have,o.need)+'/'+o.need+')'));
  });
}
function rBoard(){
  mBody.append(el('p','note','Take up to three odd jobs. They are scaled to your skill levels and tracked in the Jobs tab, not your pack. Hand in deliveries at the supply crate. Drop a job any time.'));
  mBody.append(el('p','note','Job log: '+save.jobs.length+' / 3'));
  if(!boardOffers||boardLv!==totalLevel())genOffers();
  boardOffers.forEach(j=>{
    const row=el('div','detail');row.append(el('b','',BRNAME[j.bracket]+' job'));
    const lines=el('small');objRows(j,lines);lines.querySelectorAll('div').forEach(d=>{d.textContent=d.textContent.replace(/^\[.\] /,'').replace(/ \(\d+\/(\d+)\)$/,'')});row.append(lines);
    row.append(el('small','','Reward: '+rewTxt(j)));
    const r=el('div','row'),b=el('button','btn grow','Accept');b.type='button';b.disabled=save.jobs.length>=3;b.addEventListener('click',()=>acceptJob(j));r.append(b);row.append(r);mBody.append(row);
  });
  const nb=el('button','btn','New slips');nb.type='button';nb.style.cssText='width:100%;min-height:40px;margin-top:6px';
  nb.addEventListener('click',()=>{genOffers();renderModal()});mBody.append(nb);
}
function rJobs(){
  mBody.append(el('div','shophead','<span>Job tokens</span><span>'+save.tokens.toLocaleString()+'</span>'));
  if(!save.jobs.length)mBody.append(el('p','note','No odd jobs. Visit the job board in town. Deliveries go in the supply crate beside it.'));
  save.jobs.forEach(j=>{
    const row=el('div','detail');row.append(el('b','',BRNAME[j.bracket]+' job'+(j.done?' - ready':'')));
    const lines=el('small');objRows(j,lines);row.append(lines);row.append(el('small','','Reward: '+rewTxt(j)));
    const r=el('div','row');
    if(j.done){const c=el('button','btn grow','Claim');c.type='button';c.addEventListener('click',()=>claimJob(j.id));r.append(c)}
    const d=el('button','btn grow','Drop');d.type='button';d.addEventListener('click',()=>dropJob(j.id));r.append(d);row.append(r);mBody.append(row);
  });
  mBody.append(el('p','note','Slay jobs count automatically. Gathered goods are handed in at the supply crate, and partial deliveries are kept.'));
}
/* ---------- odd shop ---------- */
const ODD=[
  {id:'coal_pouch',name:'Coal Pouch',sk:'mining',lv:25,cost:25,desc:'Holds up to 100 coal flakes without using pack slots.',item:true},
  {id:'secateurs',name:'Sharpened Secateurs',sk:'woodcutting',lv:45,cost:120,desc:'Chop trees 20% faster.'},
  {id:'spiked',name:'Spiked Hilt Attachment',sk:'melee',lv:45,cost:150,desc:'Sword swings knock monsters back and stagger them.'},
  {id:'magnet',name:'Aether Magnet',sk:'mining',lv:75,cost:400,desc:'5% chance to double aether shards.'}];
const DYES=[
  {n:'Crimson',M:'#b02a2a',H:'#ee7a64',D:'#5a1414'},
  {n:'Emerald',M:'#2a8a4a',H:'#7ae09a',D:'#124a24'},
  {n:'Midnight',M:'#2a2e6a',H:'#7a84d8',D:'#10123a'},
  {n:'Royal gold',M:'#c8a02a',H:'#fff0a0',D:'#6a4c10'}];
const maxSkill=()=>Math.max(...SK.map(k=>lvlFor(save.xp[k])));
function oddBuy(it){
  if(save.tokens<it.cost){say('You need '+it.cost+' job tokens.','warn');return}
  if(lvlFor(save.xp[it.sk])<it.lv){say('You need '+NAMES[it.sk]+' '+it.lv+'.','warn');return}
  if(it.item){if(save.inv[it.id]>0)return;if(!canFitInventory({[it.id]:1})){say('Your pack is full.','warn');return}save.inv[it.id]=1}
  else save.perks[it.id]=true;
  save.tokens-=it.cost;say('You buy the '+it.name.toLowerCase()+'.','gold');persist(true);renderModal();uiHud();
}
function rOdd(){
  mBody.append(el('div','shophead','<span>Odd Shop</span><span>'+save.tokens.toLocaleString()+' tokens</span>'));
  mBody.append(el('p','note','Utility items and prestige goods, paid for with job tokens and unlocked by skill level.'));
  ODD.forEach(it=>{
    const owned=it.item?save.inv[it.id]>0:!!save.perks[it.id],ok=lvlFor(save.xp[it.sk])>=it.lv,row=el('div','shoprow');
    row.innerHTML=(it.item?itemSvg(it.id,32):svg(it.id==='magnet'?'ore':it.id==='spiked'?'sword':'axe',32,it.id==='magnet'?{o:'#c07aff'}:null))+'<span>'+it.name+'<small>'+it.desc+'</small><small class="'+(ok?'':'bad')+'">Needs '+NAMES[it.sk]+' '+it.lv+'</small></span>';
    const b=el('button','btn',owned?'Owned':it.cost+' tokens');b.type='button';b.disabled=owned||!ok||save.tokens<it.cost;b.addEventListener('click',()=>oddBuy(it));row.append(b);mBody.append(row);
  });
  mBody.append(el('h3','sub','Master armour dyes'));
  const ok=maxSkill()>=85;
  mBody.append(el('p','note',ok?'Recolours steel, Black Iron and Myrrenite armour you wear.':'Needs level 85 in any skill. Recolours steel, Black Iron and Myrrenite armour you wear.'));
  DYES.forEach((d,i)=>{
    const owned=!!save.perks['dye'+i],row=el('div','shoprow');
    row.innerHTML='<span style="width:32px;height:32px;flex:none;background:'+d.M+';box-shadow:inset 0 0 0 3px '+d.H+',0 0 0 1px #000"></span><span>'+d.n+' dye<small>'+(owned?(save.dye===i?'Applied':'Owned'):'800 tokens')+'</small></span>';
    const b=el('button','btn',owned?(save.dye===i?'Remove':'Apply'):'800 tokens');b.type='button';
    b.disabled=!owned&&(!ok||save.tokens<800);
    b.addEventListener('click',()=>{
      if(owned){save.dye=save.dye===i?null:i;persist(true);renderModal();sendPresence();return}
      if(save.tokens<800||!ok)return;save.tokens-=800;save.perks['dye'+i]=true;save.dye=i;say('You buy '+d.n.toLowerCase()+' dye.','gold');persist(true);renderModal();sendPresence();
    });
    row.append(b);mBody.append(row);
  });
}
function refreshPlayers(){
  const ol=$('plist');if(!ol)return;
  const rows=[{n:save.name||'Wanderer',tl:lvlFor(save.xp.melee),me:true}];
  peers.forEach(o=>rows.push({n:o.n,tl:o.tl,me:false}));
  rows.sort((a,b)=>b.tl-a.tl);ol.textContent='';
  rows.slice(0,12).forEach(r=>{const li=el('li',r.me?'me':'');const a=el('span');a.textContent=r.n;const b=el('span');b.textContent='Combat '+r.tl;li.append(a,b);ol.append(li)});
}
function openShop(){const S=curShop();if(!S)return;shopCat=Object.keys(S.cats)[0]||'';openModal('shop');say(S.greet)}
function buyFood(k){
  const f=FOOD[k];
  if(save.inv.coins<foodPrice(k)){say('You cannot afford that.','warn');return}
  if(!canFitInventory({[k]:1})){say('Your pack is full.','warn');return}
  save.inv.coins-=foodPrice(k);save.inv[k]++;say('You buy some '+ITEMS[k].name.toLowerCase()+'.');persist();renderModal();uiHud();
}
const ingName=id=>ITEMS['ing_'+id].name;
/* Smithing uses the same ore, ingot, XP and item tables as before.
   The new furnace/anvil queue only automates deliberate repeated actions.
   Never craft while away from the station, after closing the menu or offline. */
const PRODUCTION_MS={smelt:1500,forge:2500};
let productionReadyAt=0,forgeMat=2,smithJob=null,smithQuantity=1;
const smithSelected={smelt:'bronze',forge:'sword'};
function productionReady(action,quiet=false){
  if(Date.now()>=productionReadyAt)return true;
  if(!quiet)say('The '+(action==='smelt'?'furnace':'anvil')+' is still working.','warn');
  return false;
}
function markProduction(action){productionReadyAt=Date.now()+PRODUCTION_MS[action]}
function smithRecipe(type,id){
  if(type==='smelt')return SMELT.find(r=>r.id===id)||null;
  if(type==='forge')return SMELT.find(r=>r.mat===forgeMat)&&FORGE[id]&&DEFS[MATS[forgeMat].k+'_'+id]?id:null;
  return null;
}
function smithMaterials(type,id){
  if(type==='smelt'){
    const r=smithRecipe(type,id);
    if(!r)return 0;
    return Math.max(0,Math.min(...Object.entries(r.in).map(([k,n])=>Math.floor((save.inv[k]||0)/n))));
  }
  const r=SMELT.find(x=>x.mat===forgeMat),kind=smithRecipe(type,id);
  return r&&kind?Math.max(0,Math.floor((save.inv['ing_'+r.id]||0)/FORGE[kind])):0;
}
function smithMaximum(type,id){
  const r=type==='smelt'?smithRecipe(type,id):SMELT.find(x=>x.mat===forgeMat);
  if(!r||!smithRecipe(type,id)||lvlFor(save.xp.forging)<(type==='smelt'?r.req:forgeReq(r,id)))return 0;
  const limit=smithMaterials(type,id);
  if(type==='smelt'){
    const changes={['ing_'+r.id]:1};
    for(const [k,n] of Object.entries(r.in))changes[k]=-n;
    return limit&&canFitInventory(changes)?limit:0;
  }
  // Each forged piece occupies a bag slot. Never assume a stacked bar can
  // produce unlimited gear when the player's inventory is almost full.
  const key='ing_'+r.id,cost=FORGE[id];
  let count=0;
  for(let n=1;n<=Math.min(limit,PACK_CAPACITY+1);n++){
    if(!canFitInventory({[key]:-cost*n},n))break;
    count=n;
  }
  return count;
}
function smithStation(type){
  const kind=type==='smelt'?'furnace':'anvil',station=VILLAGE.stations.find(s=>s.kind===kind);
  return station&&!inside&&Math.hypot(me.x-station.x,me.y-station.y)<=38?station:null;
}
function smithCanContinue(job){
  return me.deathAt==null&&tab===(job.type==='smelt'?'smelt':'forge')
    &&!!smithStation(job.type)&&smithMaximum(job.type,job.id)>0;
}
function stopSmithing(message='',refresh=true){
  const old=smithJob;smithJob=null;
  if(!old)return;
  if(message)say(message,'gold');
  if(refresh&&(tab==='forge'||tab==='smelt'))renderModal();
}
function smithingTick(now=Date.now()){
  const job=smithJob;
  if(!job)return;
  if(!smithCanContinue(job)){stopSmithing('Smithing stopped: move closer or check your materials.');return}
  if(now<job.nextAt)return;
  const made=job.type==='smelt'?smelt(smithRecipe('smelt',job.id),true):forge(job.id,true);
  if(!made){stopSmithing('Smithing stopped: check your supplies or pack space.');return}
  job.remaining--;job.done++;
  if(job.remaining<=0){stopSmithing('Finished '+job.done+' '+(job.type==='smelt'?'ingot':'equipment')+(job.done===1?'':'s')+'.',false)}
  else job.nextAt=Math.max(now,productionReadyAt);
  if(tab==='forge'||tab==='smelt')renderModal();
}
function smithingProgress(now=Date.now()){
  const job=smithJob;
  if(!job)return;
  const fill=$('smithingFill'),labelNode=$('smithingStatus');
  if(fill)fill.style.width=(100*clamp(1-(job.nextAt-now)/PRODUCTION_MS[job.type],0,1))+'%';
  if(labelNode)labelNode.textContent=(job.type==='smelt'?'Smelting':'Forging')+' · '+job.done+'/'+job.total+' made';
}
function startSmithing(type,id){
  const recipe=smithRecipe(type,id);
  if(!recipe||!smithStation(type)||tab!==(type==='smelt'?'smelt':'forge')){
    say('Use the '+(type==='smelt'?'furnace':'anvil')+' to make this.','warn');return false;
  }
  const maximum=smithMaximum(type,id),count=smithQuantity==='all'?maximum:Math.min(smithQuantity,maximum);
  if(count<=0){say('You need more materials, skill levels or bag space.','warn');return false}
  if(smithJob)stopSmithing('',false);
  const now=Date.now();
  smithJob={type,id,total:count,remaining:count,done:0,nextAt:Math.max(now+PRODUCTION_MS[type],productionReadyAt)};
  renderModal();return true;
}
function smelt(r,batch=false){
  if(!r||!productionReady('smelt',batch))return false;
  if(lvlFor(save.xp.forging)<r.req){if(!batch)say('You need '+NAMES.forging+' '+r.req+' to smelt that.','warn');return false}
  for(const k in r.in)if((save.inv[k]||0)<r.in[k]){if(!batch)say('You do not have enough materials.','warn');return false}
  const key='ing_'+r.id,changes={[key]:1};
  for(const k in r.in)changes[k]=-r.in[k];
  if(!canFitInventory(changes)){if(!batch)say('Your pack is full.','warn');return false}
  markProduction('smelt');
  for(const k in r.in)save.inv[k]-=r.in[k];save.inv[key]=(save.inv[key]||0)+1;
  if(!batch)say('You smelt a '+ITEMS[key].name.toLowerCase()+'.');
  burst(inside?88:me.x,inside?60:me.y-8,['#ff7b3a','#ffd24a','#fff2b0'],8,22);
  addXp('forging',r.xp);rollPet('forging');persist();
  if(!batch){renderModal();uiHud()}
  return true;
}
function forge(kind,batch=false){
  if(!productionReady('forge',batch))return false;
  const r=SMELT.find(x=>x.mat===forgeMat),id=MATS[forgeMat]?.k+'_'+kind,d=DEFS[id],cost=FORGE[kind];
  if(!r||!d||!cost)return false;
  const key='ing_'+r.id;
  if(lvlFor(save.xp.forging)<forgeReq(r,kind)){if(!batch)say('You need '+NAMES.forging+' '+forgeReq(r,kind)+' to forge with that.','warn');return false}
  if((save.inv[key]||0)<cost){if(!batch)say('You need '+cost+' '+ITEMS[key].name.toLowerCase()+'s.','warn');return false}
  const equip=!batch&&!save.eq[d.slot]&&usable(d);
  if(!canFitInventory({[key]:-cost},equip?0:1)){if(!batch)say('Your pack is full.','warn');return false}
  markProduction('forge');save.inv[key]-=cost;
  if(equip){save.eq[d.slot]=id;say('You forge and equip a '+d.name.toLowerCase()+'.','gold')}
  else {save.bag.push(id);if(!batch)say('You forge a '+d.name.toLowerCase()+'.','gold')}
  burst(inside?88:me.x,inside?60:me.y-8,['#ff7b3a','#ffd24a','#fff2b0'],8,22);
  addXp('forging',forgeXp(r,cost));rollPet('forging');
  if(batch)persist();else if(equip)onGearChange();else{persist();renderModal();uiHud()}
  return true;
}
function smithQuantityPicker(){
  const wrap=el('div','smith-qty');
  wrap.append(el('span','smith-label','Make'));
  for(const [value,text] of [[1,'1'],[5,'5'],[10,'10'],['all','All']]){
    const b=el('button','chip',text);b.type='button';b.disabled=!!smithJob;
    b.setAttribute('aria-pressed',String(smithQuantity===value));
    b.addEventListener('click',()=>{smithQuantity=value;renderModal()});wrap.append(b);
  }
  mBody.append(wrap);
}
function smithingPanel(type){
  const id=smithSelected[type],r=type==='smelt'?smithRecipe(type,id):SMELT.find(x=>x.mat===forgeMat);
  if(!r||!smithRecipe(type,id))return;
  const count=smithMaximum(type,id),selected=smithQuantity==='all'?count:Math.min(count,smithQuantity);
  const name=type==='smelt'?ITEMS['ing_'+r.id].name:DEFS[MATS[forgeMat].k+'_'+id].name;
  const xp=type==='smelt'?r.xp:forgeXp(r,FORGE[id]);
  const status=el('div','smith-work');
  if(smithJob){
    status.append(el('b','smith-work-title','Working: '+name));
    status.append(el('p','note','Production continues until the chosen quantity is done, your materials run out, or you leave.'));
    const progress=el('div','smith-progress'),fill=el('i','');fill.id='smithingFill';progress.append(fill);status.append(progress);
    const detail=el('small','smith-work-status','');detail.id='smithingStatus';status.append(detail);
    const stop=el('button','btn smith-primary','Stop smithing');stop.type='button';stop.addEventListener('click',()=>stopSmithing());status.append(stop);
  }else{
    status.append(el('b','smith-work-title',name));
    status.append(el('p','note',(type==='smelt'?'Smelt':'Forge')+' '+(selected||0)+' · '+xp.toLocaleString()+' XP each · '+count+' possible now'));
    const go=el('button','btn smith-primary',type==='smelt'?'Smelt '+selected:'Forge '+selected);
    go.type='button';go.disabled=!selected;go.addEventListener('click',()=>startSmithing(type,id));status.append(go);
  }
  mBody.append(status);
  smithingProgress();
}
function rSmelt(){
  mBody.append(el('p','note','Furnace · select a metal, choose an amount, then smelt automatically.'));
  smithQuantityPicker();
  smithingPanel('smelt');
  for(const r of SMELT){
    const key='ing_'+r.id,lv=lvlFor(save.xp.forging),row=el('div','shoprow smith-recipe');
    const selected=smithSelected.smelt===r.id;
    row.setAttribute('aria-selected',String(selected));
    const need=Object.entries(r.in).map(([k,n])=>n+' '+ITEMS[k].name+' ('+(save.inv[k]||0)+')').join(' + ');
    row.innerHTML=itemSvg(key,32)+'<span>'+ITEMS[key].name+
      '<small>'+need+'</small><small class="'+(lv<r.req?'bad':'')+'">Level '+r.req+' · '+r.xp+' XP · '+(save.inv[key]||0)+' owned</small></span>';
    const b=el('button','btn',selected?'Selected':'Choose');b.type='button';b.disabled=!!smithJob;
    b.addEventListener('click',()=>{smithSelected.smelt=r.id;renderModal()});row.append(b);mBody.append(row);
  }
}
// Full-set planning is informational. The actual smelting/forging actions,
// XP and material deductions still use the existing one-recipe queue.
const ARMOUR_SET_KINDS=['helm','body','gloves','legs','boots','shield'];
let forgePlanWithSword=false,forgePlanExpanded=false;
function equipmentSetPlan(mat,includeSword=false){
  const recipe=SMELT.find(r=>r.mat===mat),material=MATS[mat];
  if(!recipe||!material)return null;
  const kinds=includeSword?[...ARMOUR_SET_KINDS,'sword']:ARMOUR_SET_KINDS;
  const pieces=kinds.map(kind=>{
    const id=material.k+'_'+kind,def=DEFS[id];
    if(!def||!FORGE[kind])return null;
    const owned=save.eq[def.slot]===id||save.bag.includes(id)||(save.bank[id]||0)>0||(save.notes[id]||0)>0;
    return {kind,id,owned,bars:FORGE[kind],level:forgeReq(recipe,kind)};
  });
  if(pieces.some(p=>!p))return null;
  const missing=pieces.filter(p=>!p.owned);
  const totalBars=pieces.reduce((sum,p)=>sum+p.bars,0);
  const barsNeeded=missing.reduce((sum,p)=>sum+p.bars,0);
  const barKey='ing_'+recipe.id;
  const heldBars=save.inv[barKey]||0,bankBars=save.bank[barKey]||0;
  const barsToSmelt=Math.max(0,barsNeeded-heldBars-bankBars);
  const ores=Object.entries(recipe.in).map(([id,perBar])=>{
    const needed=barsToSmelt*perBar;
    const carried=save.inv[id]||0,banked=save.bank[id]||0,noted=save.notes[id]||0;
    return {id,perBar,needed,available:carried+banked+noted,
      missing:Math.max(0,needed-carried-banked-noted)};
  });
  return {recipe,material,pieces,missing,totalBars,barsNeeded,heldBars,bankBars,
    barsToSmelt,ores,levelRequired:Math.max(...pieces.map(p=>p.level)),
    remainingLevel:missing.length?Math.max(...missing.map(p=>p.level)):0,
    totalSmeltXp:totalBars*recipe.xp,
    totalForgeXp:totalBars*recipe.forgeXpPerBar};
}
function rForgeSetPlan(){
  const plan=equipmentSetPlan(forgeMat,forgePlanWithSword);
  if(!plan)return;
  const panel=el('details','forge-set-plan');
  panel.open=forgePlanExpanded;
  const title=el('summary','forge-set-summary',
    'Set materials · '+(plan.pieces.length-plan.missing.length)+'/'+plan.pieces.length+
    ' owned · '+plan.barsNeeded+' ingots needed');
  panel.append(title);
  const content=el('div','forge-set-content');
  const toggles=el('div','chips');
  for(const [withSword,name] of [[false,'Armour + shield'],[true,'Add sword']]){
    const btn=el('button','chip',name);btn.type='button';
    btn.setAttribute('aria-pressed',String(forgePlanWithSword===withSword));
    btn.addEventListener('click',()=>{forgePlanWithSword=withSword;forgePlanExpanded=true;renderModal()});
    toggles.append(btn);
  }
  content.append(toggles);
  content.append(el('p','note',
    'Complete set: '+plan.totalBars+' ingots · Smithing '+plan.levelRequired+
    ' to forge every piece · '+plan.totalSmeltXp.toLocaleString()+' smelting XP + '+
    plan.totalForgeXp.toLocaleString()+' forging XP if crafted from scratch.'));
  if(!plan.missing.length){
    content.append(el('p','note','You already own this entire set across equipment, backpack, bank and notes.'));
  }else{
    for(const p of plan.pieces){
      content.append(el('div','forge-set-line',
        '<span>'+DEFS[p.id].name+'</span><strong class="'+(p.owned?'forge-set-owned':'')+'">'+
        (p.owned?'Owned':p.bars+' bars · Lv '+p.level)+'</strong>'));
    }
    content.append(el('p','note',
      'Still needed: '+plan.barsNeeded+' ingots for missing pieces · '+
      (plan.heldBars+plan.bankBars)+' ingots carried/banked · '+
      plan.barsToSmelt+' more to smelt.'));
    for(const ore of plan.ores){
      content.append(el('div','forge-set-line',
        '<span>'+ITEMS[ore.id].name+'</span><strong>'+
        ore.missing+' to gather · '+ore.available+' held/stored</strong>'));
    }
  }
  content.append(el('p','note','Banked or noted supplies must be withdrawn before crafting. Each finished piece uses a backpack slot.'));
  panel.append(content);
  panel.addEventListener('toggle',()=>{forgePlanExpanded=!!panel.open});
  mBody.append(panel);
}
function rForge(){
  const chips=el('div','chips');
  SMELT.forEach(r=>{const b=el('button','chip',MATS[r.mat].n);b.type='button';b.disabled=!!smithJob;
    b.setAttribute('aria-pressed',String(forgeMat===r.mat));
    b.addEventListener('click',()=>{forgeMat=r.mat;renderModal()});chips.append(b)});
  mBody.append(chips);
  smithQuantityPicker();
  const r=SMELT.find(x=>x.mat===forgeMat),key='ing_'+r.id,lv=lvlFor(save.xp.forging);
  mBody.append(el('p','note','Anvil · '+(save.inv[key]||0)+' '+ITEMS[key].name+' available. Forged gear goes into your pack during batch crafting.'));
  smithingPanel('forge');
  rForgeSetPlan();
  Object.keys(FORGE).forEach(kind=>{
    const id=MATS[forgeMat].k+'_'+kind,d=DEFS[id];if(!d)return;
    const cost=FORGE[kind],row=el('div','shoprow smith-recipe'),selected=smithSelected.forge===kind;
    row.setAttribute('aria-selected',String(selected));
    row.innerHTML=gearSvg(d,32)+'<span>'+d.name+
      '<small>'+statLine(d)+'</small><small class="'+(lv<forgeReq(r,kind)?'bad':'')+'">'+cost+' ingots · Smithing '+forgeReq(r,kind)+' · '+forgeXp(r,cost)+' XP</small></span>';
    const b=el('button','btn',selected?'Selected':'Choose');b.type='button';b.disabled=!!smithJob;
    b.addEventListener('click',()=>{smithSelected.forge=kind;renderModal()});row.append(b);mBody.append(row);
  });
}
function rShop(){
  const S=curShop();if(!S){closeModal();return}
  mBody.append(el('div','shophead','<span>'+S.keeper+'</span><span>'+save.inv.coins.toLocaleString()+' coins</span>'));
  if(S.bait){
    const row=el('div','shoprow');
    row.innerHTML=itemSvg('bait',32)+'<span>Bait<small>Every rod cast uses one</small><small>You have '+save.inv.bait+'</small></span>';
    const b=el('button','btn','Buy 10 for 20');b.type='button';b.disabled=save.inv.coins<20;b.addEventListener('click',()=>{
      if(save.inv.coins<20)return;if(!canFitInventory({bait:10})){say('Your pack is full.','warn');return}
      save.inv.coins-=20;save.inv.bait+=10;say('You buy some bait.');persist();renderModal();uiHud()});
    row.append(b);mBody.append(row);
  }
  if(S.food){
    Object.keys(FOOD).filter(k=>FOOD[k].price).forEach(k=>{
      const row=el('div','shoprow');
      row.innerHTML=itemSvg(k,32)+'<span>'+ITEMS[k].name+'<small>Heals '+healOf(k)+' health</small><small>You have '+save.inv[k]+'</small></span>';
      const b=el('button','btn','Buy '+foodPrice(k));b.type='button';b.disabled=save.inv.coins<foodPrice(k);b.addEventListener('click',()=>buyFood(k));row.append(b);mBody.append(row);
    });
  }else{
    const names=Object.keys(S.cats);
    if(!S.cats[shopCat])shopCat=names[0];
    if(names.length>1){
      const chips=el('div','chips');
      names.forEach(c=>{const b=el('button','chip',c);b.type='button';b.setAttribute('aria-pressed',String(shopCat===c));b.addEventListener('click',()=>{shopCat=c;renderModal()});chips.append(b)});
      mBody.append(chips);
    }
    const list=Object.values(DEFS).filter(d=>S.cats[shopCat].includes(d.kind)&&!owned(d.id)&&(S.id==='cart'?d.mat===KINDS[d.kind].mats[0]:d.mat<=(SHOPMAX[d.kind]||3))).sort((a,b)=>a.price-b.price);
    if(!list.length)mBody.append(el('p','note','You own everything in this section.'));
    list.forEach(d=>{
      const ok=usable(d),row=el('div','shoprow');
      row.innerHTML=gearSvg(d,32)+'<span>'+d.name+'<small>'+statLine(d)+'</small><small class="'+(ok?'':'bad')+'">Needs '+NAMES[d.skill]+' '+d.req+'</small></span>';
      const b=el('button','btn','Buy '+d.price);b.type='button';b.disabled=save.inv.coins<d.price;b.addEventListener('click',()=>buyItem(d.id));row.append(b);
      mBody.append(row);
    });
  }
  if(S.buys.length){
    let total=0;S.buys.forEach(k=>{total+=(save.inv[k]+(save.notes[k]||0))*SELL[k]});
    const b=el('button','btn',total?'Sell all goods (+'+total+')':'Nothing here to sell');b.type='button';b.style.cssText='width:100%;min-height:40px;margin-top:6px';b.disabled=!total;
    b.addEventListener('click',()=>{let t=0;S.buys.forEach(k=>{t+=(save.inv[k]+(save.notes[k]||0))*SELL[k];save.inv[k]=0;delete save.notes[k]});save.inv.coins+=t;say('The shopkeeper pays you '+t+' coins.','gold');persist();renderModal();uiHud()});
    mBody.append(b);
  }
  if(S.kinds.length)mBody.append(el('p','note','Open the Pack tab to sell spare gear here.'));
}
document.querySelectorAll('[data-ui-open]').forEach(b=>b.addEventListener('click',()=>{tab===b.dataset.uiOpen?closeModal():openModal(b.dataset.uiOpen)}));
$('mClose').addEventListener('click',closeModal);
$('bMenu').addEventListener('click',()=>tab==='settings'?closeModal():openModal('settings'));
$('bBag').addEventListener('click',()=>tab==='pack'?closeModal():openModal('pack'));
$('bBanknotes').addEventListener('click',()=>{if(tab!=='bank')return;withdrawNoted=!withdrawNoted;closeItemMenu();renderModal()});
$('aEat').addEventListener('click',()=>eat());

/* ---------- action buttons ---------- */
function meleeDistance(m,x=me.x,y=me.y){return Math.hypot(m.x-x,m.y-4-y)}
function meleeReach(){return activeDef('weapon')?30:22}
function nearestMon(r){let best=null,bd=r;for(const m of mons){if(m.state==='dead')continue;const d=meleeDistance(m);if(d<=bd){if(d<bd||!best){bd=d;best=m}}}return best}
// Hold a living target while it remains hittable, then acquire the nearest
// replacement. Both selection and hit checks use the same enemy centre.
function meleeTarget(reach=meleeReach()){
  const t=me.tgt;
  return t&&t.state!=='dead'&&meleeDistance(t)<=reach?t:nearestMon(reach);
}
function faceMeleeTarget(m){
  const dx=m.x-me.x,dy=m.y-4-me.y,d=Math.hypot(dx,dy)||1;
  me.fx=dx/d;me.fy=dy/d;me.face=dx>=0?1:-1;
  me.dv=Math.abs(dy)>Math.abs(dx)*1.1?(dy>0?'d':'u'):'s';
}
function nearestNode(r,now){let best=null,bd=r;for(const n of nodes){if(now<n.back)continue;const d=Math.hypot(n.x-me.x,n.y-me.y);if(d<bd){bd=d;best=n}}return best}
const SWING_IV=900,COS_ARC=Math.cos(Math.PI*50/180);
let atkHeld=false,gpAtk=false,wantSwing=false,nextSwing=0;const atkPtrs=new Set();
const aAtk=$('aAtk');aAtk.style.touchAction='none';
aAtk.addEventListener('pointerdown',e=>{e.preventDefault();if(inside){say('No fighting indoors.');return}atkPtrs.add(e.pointerId);atkHeld=true;wantSwing=true;try{aAtk.setPointerCapture(e.pointerId)}catch(_){}});
['pointerup','pointercancel'].forEach(t=>aAtk.addEventListener(t,e=>{atkPtrs.delete(e.pointerId);atkHeld=atkPtrs.size>0}));
addEventListener('blur',()=>{atkPtrs.clear();atkHeld=false});
aAtk.addEventListener('contextmenu',e=>e.preventDefault());
// Lock the strike's position and facing at input time. Players can retreat
// immediately without the 110ms animation delay changing an already-aimed hit.
let pendingStrike=null;
function strikeHitsTarget(strike,m){
  const tx=m.x-strike.x,ty=(m.y-4)-strike.y,d=Math.hypot(tx,ty);
  return d<=strike.reach&&(d<=7||(tx*strike.fx+ty*strike.fy)/d>=COS_ARC);
}
function beginSwing(now){
  if(me.deathAt!=null)return;
  if(me.pend)return;
  if(act&&act.kind!=='cook')act=null;
  refreshHeld();
  const w=activeDef('weapon');
  // Attack-button combat automatically faces the closest enemy in weapon reach.
  // Movement remains player-controlled; no narrow directional hit-cone required.
  const reach=w?30:22,target=meleeTarget(reach);
  if(target){faceMeleeTarget(target);me.tgt=target;me.tgtUntil=now+4000}
  pendingStrike={x:me.x,y:me.y,fx:me.fx,fy:me.fy,reach,target};
  startSwing(now);me.pend=now+110;
}
function resolveSwing(now){
  const strike=pendingStrike;
  pendingStrike=null;
  if(me.deathAt!=null||inside||!strike)return;
  const w=activeDef('weapon'),L=lvlFor(save.xp.melee),atk=atkBonus();
  for(const m of mons){
    if(m.state==='dead')continue;
    const mt=MT[m.t];
    if(strike.target?m!==strike.target:!strikeHitsTarget(strike,m))continue;
    if(strike.target&&meleeDistance(m,strike.x,strike.y)>strike.reach)continue;
    const tx=m.x-strike.x,ty=(m.y-4)-strike.y,d=Math.hypot(tx,ty);
    m.prov=true;if(m.state==='idle'||m.state==='return')m.state='chase';
    const hit=Math.random()<clamp(.55+(L-mt.def)*.03+atk*.01,.25,.95);
    const dmg=hit?rint(1,2+Math.floor(L/4)+atk):0;
    recordBossContribution(m,'local',dmg);
    m.hp-=dmg;splat(m.x,m.y-16,dmg);sfx(dmg>0?'hit':'miss');
    if(dmg>0)recordCombatHit(m,now,strike.x,strike.y,w?.kind==='sword');
    burst(m.x,m.y-8,dmg>0?['#d83a2a','#ffffff','#ffd24a']:['#ffffff','#b5c8d8'],dmg>0?7:3,20);
    me.tgt=m;me.tgtUntil=now+4000;
    if(m.hp>0&&save.perks.spiked&&w&&w.kind==='sword'){const dd=d||1;m.x+=tx/dd*8;m.y+=ty/dd*8;m.cd=-.5;m.warn=null}
    if(m.hp<=0)killMon(m,now);
  }
}
function nearFire(){return Math.hypot(me.x-CAMPFIRE.x,me.y-CAMPFIRE.y)<36}
function nearestDoor(r){let best=null,bd=r;for(const b of BLD){if(!b.open)continue;const d=Math.hypot(b.x-me.x,b.y-me.y);if(d<bd){bd=d;best=b}}return best}
const SPOTS={bank:{x:CX-150,y:CY+114},board:{x:BOARD.x,y:BOARD.y}};
function nearSpot(){let best=null,bd=36;for(const k in SPOTS){const d=Math.hypot(me.x-SPOTS[k].x,me.y-SPOTS[k].y);if(d<bd){bd=d;best=k}}return best}
function nodeOK(n){
  const tx=n.x-me.x,ty=(n.y-(n.k.startsWith('spot')?0:2))-me.y,d=Math.hypot(tx,ty);
  if(d>(NT[n.k].reach?30:22))return false;
  return d<6||(tx*me.fx+ty*me.fy)/d>=.5;
}
// A crowded resource area can put an unusable ore, tree or fishing spot
// closer than a node the player can actually gather. Prefer a currently
// harvestable target; keep the nearest unusable node as a fallback so the
// existing level/tool/bait/full-pack explanations are still shown.
function readyToGather(n){
  const nt=NT[n.k],tool=toolFor(nt.tool);
  if(!tool||lvlFor(save.xp[nt.skill])<nt.req)return false;
  if(nt.skill==='fishing'&&tool.kind==='rod'&&!(save.inv.bait>0))return false;
  const changes={[nt.item]:1};
  if(nt.skill==='fishing'&&tool.kind==='rod')changes.bait=-1;
  return canFitInventory(changes);
}
function facingNode(now){
  let nearest=null,nearestDist=Infinity,ready=null,readyDist=Infinity;
  for(const n of nodes){
    if(now<n.back||!nodeOK(n))continue;
    const d=Math.hypot(n.x-me.x,n.y-me.y);
    if(d<nearestDist){nearestDist=d;nearest=n}
    if(d<readyDist&&readyToGather(n)){readyDist=d;ready=n}
  }
  return ready||nearest;
}
function nodeNear(now){for(const n of nodes){if(now>=n.back&&Math.hypot(n.x-me.x,n.y-me.y)<=(NT[n.k].reach?34:26))return n}return null}

function nearSmithy(x=me.x,y=me.y,reach=33){
 if(inside)return null;
 let best=null,bd=reach;
 for(const station of VILLAGE.stations){const d=Math.hypot(x-station.x,y-station.y);if(d<bd){bd=d;best=station}}
 return best;
}
function openSmithy(kind){
 const station=VILLAGE.stations.find(s=>s.kind===kind);
 if(!station||Math.hypot(me.x-station.x,me.y-station.y)>38){say('Walk closer to the '+(kind==='anvil'?'anvil':kind==='furnace'?'furnace':'tool rack')+'.');return}
 act=null;
 if(kind==='furnace'||kind==='anvil'){
   // Workstations open crafting-only windows. The indoor blacksmith and
   // trade rack remain separate places to buy or sell equipment.
   outdoorShop=null;
   openModal(kind==='furnace'?'smelt':'forge');
   say(kind==='furnace'?'Select an ingot recipe and quantity to start smelting.':'Select a metal, equipment recipe and quantity to start forging.');
   return;
 }
 outdoorShop=BLD.find(b=>b.id==='arms');
 shopCat='Axes';openModal('shop');say(SHOPS.arms.greet);
}
function relocateSavedPosition(){
 const blockedAt=(x,y)=>BLD.some(b=>!b.open&&Math.abs(x-b.x)<b.w/2+3&&y>b.y-14&&y<b.y)||SOLID.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1);
 const p=VILLAGE.safePosition(me.x,me.y,blockedAt);me.x=p.x;me.y=p.y;me.ox=p.x;me.oy=p.y;
}

function useAction(){if(me.deathAt!=null)return;
  const now=performance.now();
  if(inside){
    if(Math.hypot(me.x-88,me.y-62)<44){act=null;openShop();return}
    if(inside.id==='food'&&Math.hypot(me.x-24,me.y-74)<30){openCooking('oven');return}
    say('Walk up to the counter, then press the button.');return;
  }
  if(Math.hypot(me.x-TRADER.x,me.y-TRADER.y)<47){outdoorShop=TRADER;openShop();return}
  const station=nearSmithy();if(station){openSmithy(station.kind);return}
  const n=facingNode(now);
  if(n){beginAct('node',n);return}
  {const sp=nearSpot();if(sp){act=null;if(sp==='board')openModal('board');else if(sp==='crate')supplyDeposit();else if(sp==='bank')openModal('bank');else openModal('odd');return}}
  if(nearFire()){openCooking('fire');return}
  const f=nodeNear(now);
  if(f)say('Face the '+NT[f.k].name.toLowerCase()+' to work on it.','warn');
  else say('Nothing to gather right in front of you.');
}
$('aUse').addEventListener('click',useAction);
let lastAtkKey='',lastUseKey='';
function refreshActionButtons(){
  const w=activeDef('weapon');
  const ak=w?w.id:'fist';
  if(ak!==lastAtkKey){
    lastAtkKey=ak;
    // iOS treats image-based sword icons as saveable pictures on long press.
    // Use the inline vector icon on the hold-to-attack control instead.
    const icon=w?svg(w.art,40,{M:MATS[w.mat].M,H:MATS[w.mat].H,D:MATS[w.mat].D,S:MATS[w.mat].H}):svg('fist',40);
    $('aAtk').innerHTML=icon;
  }
  const now=performance.now();
  let uk='axe';
  if(inside)uk='coins';
  else{const station=nearSmithy(),n=facingNode(now);if(station)uk=station.kind==='furnace'?'ore':station.kind==='anvil'?'sword':'coins';else if(n){uk=NT[n.k].tool;}else if(nearSpot())uk={bank:'bag',board:'scroll',crate:'bag',odd:'coins'}[nearSpot()];else if(nearFire())uk='bowl'}
  const ukey=uk+'|'+(w?w.id:'');
  if(ukey!==lastUseKey){
    lastUseKey=ukey;
    if(uk==='coins'||uk==='bowl'||uk==='scroll'||uk==='bag'||uk==='ore'||uk==='sword')$('aUse').innerHTML=svg(uk,40);
    else{const d=toolFor(uk);$('aUse').innerHTML=d?gearSvg(d,40):svg(uk,40,{S:'#7a7a7a'})}
  }
}

/* ---------- multiplayer ---------- */
let room=null,lastSent='';
function ingest(change){
  const seen=new Set(),now=performance.now();
  for(const p of change.peers){
    if(p.isMe||p.kind!=='viewer')continue;
    const pr=p.presence||{};
    if(typeof pr.x!=='number'||typeof pr.y!=='number')continue;
    seen.add(p.peer);
    let o=peers.get(p.peer);
    const x=clamp(pr.x,0,WW),y=clamp(pr.y,0,WH);
    if(!o){o={x,y,tx:x,ty:y,n:'',tl:3,h:200,e:null,until:0,face:1,tool:'',mat:2,hold:0,swingAt:-9999,s:null,g:[0,0,0,0,0]};peers.set(p.peer,o)}
    if(x!==o.tx)o.face=x>o.tx?1:-1;
    o.tx=x;o.ty=y;
    o.n=String(pr.n||'Wanderer').replace(/[^\w .-]/g,'').slice(0,14)||'Wanderer';
    o.tl=clamp(pr.tl|0,1,100);o.dye=(Number.isInteger(pr.dy)&&pr.dy>=0&&pr.dy<4)?pr.dy:null;
    o.h=((+pr.h||0)%360+360)%360;
    const a=clamp(pr.a|0,0,6);o.tool=CODE_KIND[a];o.mat=clamp(pr.tt|0,1,8);
    o.hold=a>0?now+1e9:0;
    if(Array.isArray(pr.g))o.g=[0,1,2,3,4,5].map(i=>clamp(pr.g[i]|0,0,8));
    if(typeof pr.s==='number'){if(o.s!==null&&pr.s!==o.s)o.swingAt=now;o.s=pr.s}
    if(typeof pr.e==='number'){if(o.e!==null&&pr.e!==o.e)o.until=now+2200;o.e=pr.e}
  }
  for(const k of [...peers.keys()])if(!seen.has(k))peers.delete(k);
}
(async()=>{
  try{
    if(!window.claude||!window.claude.use)throw 0;
    room=await window.claude.use('room');if(!room)throw 0;
    room.onPeers(ingest);
    room.onConnection(c=>{$('net').textContent=c?'Online with other players':'Reconnecting...'});
    $('net').textContent=room.connected()?'Online with other players':'Connecting...';
  }catch(e){room=null;$('net').textContent='Playing solo. Open from a shared link to meet others.'}
})();
function sendPresence(){
  if(!room||!started)return;
  const now=performance.now(),holding=now<me.hold&&me.tool;
  const p={x:Math.round(inside?me.ox:me.x),y:Math.round(inside?me.oy:me.y),n:save.name,tl:lvlFor(save.xp.melee),h:me.hue,e:waveN,s:me.swings,a:holding?CODE_KIND.indexOf(me.tool):0,tt:me.mat,g:gearArr(),dy:save.dye};
  const s=JSON.stringify(p);if(s===lastSent)return;lastSent=s;
  room.presence(p).catch(()=>{});
}

/* ---------- start ---------- */
function start(){
  // Never start with an invisible player or silently select an old sprite.
  if(!window.MyrrenKezV2Atlas?.ready){$('net').textContent=window.MyrrenKezV2Atlas?.failed?'Character artwork failed. Reload to retry.':'Loading character artwork…';return}
  relocateSavedPosition();
  save.name=$('nick').value.trim().slice(0,14)||save.name||'Wanderer';
  $('intro').hidden=true;
  $('modal').hidden=true;
  $('hud').hidden=false;$('chat').hidden=false;$('pad').hidden=false;$('acts').hidden=false;
  started=true;uiHud();refreshActionButtons();
  say('Welcome to Myrren, '+save.name+'.');
  if(!(eqDef('weapon')&&eqDef('weapon').tool)&&!save.bag.some(id=>DEFS[id].tool))say('Starter tools: Trader Gus. Gather with the tool button.','gold');
  persist();sendPresence();
}
$('go').addEventListener('click',start);
$('nick').addEventListener('keydown',e=>{if(e.key==='Enter')start()});
$('nick').value=save.name||'';

/* ---------- input ---------- */
const keys={};
const stick={on:false,id:null,dx:0,dy:0};
addEventListener('keydown',e=>{if(e.target.id==='nick')return;const kk=e.key.toLowerCase();keys[kk]=true;if(started&&!tab&&!e.repeat&&(kk==='e'||kk==='f'))useAction();if(kk===' ')e.preventDefault()});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
const pad=$('pad'),knob=$('knob'),PR=46;
function moveStick(e){
  const r=pad.getBoundingClientRect();
  let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  const d=Math.hypot(dx,dy);if(d>PR){dx=dx/d*PR;dy=dy/d*PR}
  stick.dx=dx/PR;stick.dy=dy/PR;knob.style.transform='translate('+dx+'px,'+dy+'px)';
}
pad.addEventListener('pointerdown',e=>{if(stick.on)return;stick.on=true;stick.id=e.pointerId;try{pad.setPointerCapture(e.pointerId)}catch(_){}moveStick(e)});
pad.addEventListener('pointermove',e=>{if(stick.on&&e.pointerId===stick.id)moveStick(e)});
function endStick(e){if(e.pointerId!==stick.id)return;stick.on=false;stick.dx=0;stick.dy=0;knob.style.transform=''}
pad.addEventListener('pointerup',endStick);pad.addEventListener('pointercancel',endStick);
// Two-finger pinch zoom. Separate saved preferences for portrait and landscape.
const cameraZoom={portrait:null,landscape:null};
try{const z=JSON.parse(localStorage.getItem('myrren-camera-zoom')||'{}');for(const k of ['portrait','landscape'])if(Number.isFinite(z[k]))cameraZoom[k]=clamp(z[k],1,4)}catch(_){}
const zoomTouches=new Map();let pinch=null,blockCanvasTap=false;
const pinchDistance=()=>{const a=[...zoomTouches.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  zoomTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(zoomTouches.size===2){
    const landscape=cv.clientWidth>cv.clientHeight*1.15,key=landscape?'landscape':'portrait';
    const base=landscape?1:clamp(Math.round(Math.min(cv.clientWidth,cv.clientHeight)/330),1,4);
    pinch={key,distance:Math.max(1,pinchDistance()),scale:cameraZoom[key]??base};
    blockCanvasTap=true;
  }
},true);
cv.addEventListener('pointermove',e=>{
  if(!zoomTouches.has(e.pointerId))return;
  zoomTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&zoomTouches.size>=2){
    cameraZoom[pinch.key]=clamp(pinch.scale*pinchDistance()/pinch.distance,1,4);
    e.preventDefault();
  }
},{capture:true,passive:false});
function endZoomTouch(e){
  if(!zoomTouches.delete(e.pointerId))return;
  if(pinch){
    try{localStorage.setItem('myrren-camera-zoom',JSON.stringify(cameraZoom))}catch(_){}
    pinch=null;blockCanvasTap=true;
  }
  if(zoomTouches.size===0)requestAnimationFrame(()=>{blockCanvasTap=false});
}
cv.addEventListener('pointerup',endZoomTouch,true);
cv.addEventListener('pointercancel',endZoomTouch,true);
function toWorld(cx,cy){const r=cv.getBoundingClientRect();return [(cx-r.left)/(r.width/cv.width)+cam.x,(cy-r.top)/(r.height/cv.height)+cam.y]}
cv.addEventListener('pointerdown',e=>{
  if(!started||blockCanvasTap||zoomTouches.size>=2)return;
  const [wx,wy]=toWorld(e.clientX,e.clientY),now=performance.now();
  if(inside){
    if(Math.hypot(wx-88,wy-44)<22||(wx>30&&wx<146&&wy>40&&wy<68)){if(Math.hypot(me.x-88,me.y-62)<44)useAction();else say('Walk up to the counter first.')}
    return;
  }
  for(const station of VILLAGE.stations){if(Math.abs(wx-station.x)<20&&wy>station.y-(station.kind==='furnace'?57:25)&&wy<station.y+5){openSmithy(station.kind);return}}
  for(const k in SPOTS){const sp=SPOTS[k];if(Math.abs(wx-sp.x)<20&&wy>sp.y-42&&wy<sp.y+5){if(nearSpot()===k)useAction();else say('Walk closer first.');return}}
  let best=null;
  for(const n of nodes){
    const sp=n.k.startsWith('spot'),big=TREEK.includes(n.k)&&n.k!=='tree';
    const hw=(sp?16:TREEK.includes(n.k)?(big?27:21):15),top=sp?18:TREEK.includes(n.k)?(big?60:50):17,bot=sp?10:6;
    if(wx>=n.x-hw&&wx<=n.x+hw&&wy>=n.y-top&&wy<=n.y+bot&&(!best||n.y>best.y))best=n;
  }
  if(best){best.tipAt=now;return}
  if(Math.hypot(wx-CX,wy-(CY+16))<16&&nearFire())useAction();
});
function beginAct(kind,ref){
  blocked.delete(ref);
  act={kind,ref,t:.9,checked:false,swung:false,casted:false};
  marker={x:ref.x,y:ref.y-6,t:performance.now(),c:'#ffe14a'};
}
/* ---------- simulation ---------- */
// Limit short-lived damage numbers and rotate their starting lanes when attacks
// land close together. These are presentation events, never combat state.
const DAMAGE_POPUP_MS=850,DAMAGE_POPUP_CAP=40;
function splat(x,y,v){
  const now=performance.now();
  let nearby=0;
  for(let i=splats.length-1;i>=0;i--){
    const p=splats[i];if(now-p.t>DAMAGE_POPUP_MS)break;
    if(Math.abs(p.x-x)<24&&Math.abs(p.y-y)<24)nearby++;
  }
  if(splats.length>=DAMAGE_POPUP_CAP)splats.shift();
  splats.push({x,y,v,t:now,lane:nearby%5,c:v>0?'#d83a2a':'#3a6ac4'});
}
function burst(x,y,cols,n,power){for(let i=0;i<n;i++)fx.push({x,y,vx:(Math.random()-.5)*power*2,vy:-Math.random()*power-8,t:performance.now(),c:cols[i%cols.length]})}
// Tiny colour-matched fragments only at the point of pickaxe contact.
// All mining hit state is short-lived presentation data on the existing node.
const ORE_HIT_PALETTE={
  copper:['#d8a272','#f5cf96'],tin:['#91aaa7','#e1ecdf'],
  iron:['#8295a1','#d0dfe0'],coal:['#535767','#929bab'],
  cobalt:['#5d77a8','#bad7ed'],obsidianite:['#9e5d80','#ff8d98'],
  aether:['#936dc2','#ddbdff'],meteorite:['#7eb4d6','#d2f9ff']
};
// Transient visual feedback is stored only on a resource node, never saved.
// A failed chop gets bark chips; successful logs shed a few canopy leaves.
// When a tree falls, the leaves continue briefly over the visible stump.
function recordForestryHit(n,now,success){
  n.chopHitAt=now;
  n.chopSucceeded=!!success;
}
const FORESTRY_PALETTES={
  tree:{bark:['#8e6d51','#d5a17c'],leaf:['#8ba75b','#c9d88c']},
  oak:{bark:['#735841','#ac8960'],leaf:['#9da95c','#d5cd78']},
  maple:{bark:['#795247','#ce9060'],leaf:['#b97843','#e5b46e']},
  elder:{bark:['#4c6261','#89a79d'],leaf:['#7d9b54','#abc7a0']},
  myrren:{bark:['#655a74','#ac8cb1'],leaf:['#83b9c2','#b2e0dc']}
};
function forestryHitPalette(n){return FORESTRY_PALETTES[n.k]||FORESTRY_PALETTES.tree}
function recordMiningHit(n,now,success){
  n.mineHitAt=now;
  n.mineSucceeded=!!success;
}
// Vein durability only decreases on a successful ore gather. Depletion
// restarts the existing per-tier respawn timer; new veins refill on their
// first successful gather after the cooldown. Node charges are world-local,
// not player-save progress and never award extra XP/items themselves.
function consumeOreVein(n,nt,now){
  if(nt.skill!=='mining'||!Number.isInteger(nt.vein)||nt.vein<1) return false;
  if(now<n.back) return false;
  if(!Number.isInteger(n.oreLeft)||n.oreLeft<1||n.oreLeft>nt.vein)
    n.oreLeft=nt.vein;
  n.oreLeft--;
  if(n.oreLeft>0)return false;
  n.back=now+rint(nt.rt[0],nt.rt[1])*1000;
  return true;
}

function miningDustColors(n){
  const ore=ORE_HIT_PALETTE[n.k]||ORE_HIT_PALETTE.iron;
  return n.mineSucceeded?[ore[0],ore[1],'#ffffff']:['#808b8c','#aab1a8'];
}
// Combat contact is purely presentation: never alter world position, HP,
// collision or attack intervals. Use the original attacker position so
// strafing after the strike cannot change the recoil direction.
function recordCombatHit(m,now,fromX,fromY,sword){
  const dx=m.x-fromX,dy=m.y-4-fromY,d=Math.hypot(dx,dy);
  const nx=d>.01?dx/d:(me.fx||1),ny=d>.01?dy/d:(me.fy||0);
  m.hitAt=now;m.hitPushX=nx;m.hitPushY=ny;
  if(combatImpacts.length>=24)combatImpacts.shift();
  combatImpacts.push({x:m.x,y:m.y-10,nx,ny,t:now,sword:!!sword});
}
function startSwing(now){sfx('swing');me.swing=now;me.swings++;me.hold=now+3500;sendPresence()}
const PETS={
  woodcutting:{name:'Timber Glider',art:'pet_glider',what:'log'},
  fishing:{name:'Mossback Terrapin',art:'pet_terrapin',what:'catch'},
  mining:{name:'Geode Mole',art:'pet_mole',what:'ore'},
  forging:{name:'Living Anvil',art:'ingot',what:'forge'}
};
const pets=[],petObjs={};
function syncPets(){
  pets.length=0;
  for(const sk of Object.keys(PETS)){
    if(save.pets[sk]!==1)continue;
    let o=petObjs[sk];
    if(!o)o=petObjs[sk]={sk,x:me.x-me.face*10,y:me.y+4,face:1,moving:false,scamper:false,ph:Math.random()*6,wt:0,sx:me.x,sy:me.y,fxT:0,trail:[]};
    pets.push(o);
  }
}
function petAnchor(i){return {x:me.x+[-18,18,0][i%3],y:me.y+[7,7,17][i%3]}}
function petsTeleport(){pets.forEach((p,i)=>{const a=petAnchor(i);p.x=a.x;p.y=a.y;p.sx=a.x;p.sy=a.y;p.trail.length=0})}
const petOdds=sk=>Math.max(150,500-3*lvlFor(save.xp[sk]));
function rollPet(sk){
  if(!PETS[sk]||save.pets[sk])return;
  if(Math.random()*petOdds(sk)<1){
    save.pets[sk]=1;syncPets();petsTeleport();
    say('You have a funny feeling like you are being followed.','gold');say('You found a pet: '+PETS[sk].name+'!','gold');toast('NEW PET\n'+PETS[sk].name);
  }
}
function reactForgingPet(bonusXp){
  const p=petObjs.forging;
  if(!p||save.pets.forging!==1)return;
  p.forgeReactUntil=performance.now()+850;
  p.forgeBonusXp=bonusXp;
  burst(p.x,p.y-15,['#fff0a0','#ffb340','#ff642e'],9,17);
}
function petsUpdate(dt,now){
  pets.forEach((p,i)=>{
    const an=petAnchor(i),ax=an.x,ay=an.y;
    let dx=ax-p.x,dy=ay-p.y,d=Math.hypot(dx,dy);
    if(d>150){p.x=ax;p.y=ay;dx=dy=d=0;p.trail.length=0}
    const sp=p.sk==='woodcutting'?64:p.sk==='fishing'?42:52;
    p.moving=false;p.scamper=false;
    if(d>(me.moving?5:6)){
      const st=Math.min(sp*dt,d),nx=p.x+dx/d*st,ny=p.y+dy/d*st;
      if(!(p.sk==='mining'&&!inside&&inWater(nx,ny))){p.x=nx;p.y=ny}
      p.moving=true;if(Math.abs(dx)>.5)p.face=dx>0?1:-1;
    }else if(p.sk==='woodcutting'){
      p.wt-=dt;if(p.wt<=0){p.wt=.7+Math.random()*1.5;p.sx=ax+rint(-10,10);p.sy=ay+rint(-6,6)}
      const sx=p.sx-p.x,sy=p.sy-p.y,sd=Math.hypot(sx,sy);
      if(sd>1.5){const st=Math.min(30*dt,sd);p.x+=sx/sd*st;p.y+=sy/sd*st;p.scamper=true;if(Math.abs(sx)>.4)p.face=sx>0?1:-1}
    }
    if(inside){p.x=clamp(p.x,10,166);p.y=clamp(p.y,70,121)}
    p.fxT-=dt;
    if(p.fxT<=0){
      if(p.sk==='fishing'&&p.moving){burst(p.x,p.y-1,['#8cc0f4','#cfe8ff','#3f7fcc'],2,10);p.fxT=.1}
      else if(p.sk==='mining'&&p.moving){burst(p.x,p.y-2,['#6a4a2a','#8a6a3a','#4a2f18'],2,14);p.trail.push({x:p.x,y:p.y,t:now});p.fxT=.08}
      else if(p.sk==='woodcutting'&&p.moving){burst(p.x,p.y-9,['#6ab04a','#4a8a3a'],1,6);p.fxT=.2}
      else p.fxT=.1;
    }
    while(p.trail.length&&now-p.trail[0].t>1300)p.trail.shift();
  });
}
/* Cooking has a dedicated workstation menu, matching the furnace and
   anvil. The raw fish, burn probabilities and XP rewards are unchanged.
   Attempts are real-time only: no queue completion when the app is hidden. */
const COOK_MS=1500;
let cookJob=null,cookSelected='rshrimp',cookQuantity=1;
function cookingStation(where){
  if(where==='oven')return !!inside&&inside.id==='food'&&Math.hypot(me.x-24,me.y-74)<30;
  if(where==='fire')return !inside&&nearFire();
  return false;
}
function cookingChance(raw){
  const recipe=COOK[raw];
  if(!recipe)return 0;
  return clamp(.5+(lvlFor(save.xp.cooking)-recipe.req)*.04,.4,.97);
}
function stopCooking(message='',refresh=true){
  const old=cookJob;cookJob=null;
  if(!old)return;
  if(message)say(message,'gold');
  if(refresh&&tab==='cook')renderModal();
}
function openCooking(where){
  if(!cookingStation(where)){say('Stand beside the cooking fire first.','warn');return false}
  act=null;
  openModal('cook');
  return true;
}
function startCooking(raw){
  const recipe=COOK[raw];
  if(!recipe||tab!=='cook'||!cookingStation(inside?'oven':'fire')){
    say('Use the campfire to cook your catch.','warn');return false
  }
  if(lvlFor(save.xp.cooking)<recipe.req){say('You need Cooking '+recipe.req+' for that.','warn');return false}
  const available=save.inv[raw]||0;
  const total=cookQuantity==='all'?available:Math.min(available,cookQuantity);
  if(total<=0){say('You do not have any '+ITEMS[raw].name.toLowerCase()+'.','warn');return false}
  if(!canFitInventory({[raw]:-1,[recipe.to]:1})){say('Your pack is full.','warn');return false}
  if(cookJob)stopCooking('',false);
  cookJob={raw,where:inside?'oven':'fire',total,remaining:total,done:0,cooked:0,burned:0,nextAt:Date.now()+COOK_MS};
  renderModal();return true;
}
function cookTick(now=Date.now()){
  const job=cookJob;
  if(!job)return;
  const recipe=COOK[job.raw];
  if(tab!=='cook'||!cookingStation(job.where)||me.deathAt!=null){
    stopCooking('Cooking stopped: return to the fire.');return
  }
  if(now<job.nextAt)return;
  if(lvlFor(save.xp.cooking)<recipe.req||!(save.inv[job.raw]>0)){
    stopCooking('Cooking stopped: no usable raw fish remain.');return
  }
  if(!canFitInventory({[job.raw]:-1,[recipe.to]:1})){
    stopCooking('Cooking stopped: your pack is full.');return
  }
  // Every attempt consumes exactly one raw fish. Only successful cooking
  // yields food and XP; the original burn formula is shared with old saves.
  save.inv[job.raw]--;
  burst(job.where==='oven'?17:CX,job.where==='oven'?44:CY+14,['#ff7b3a','#ffd24a','#8a8a8a'],7,22);
  if(Math.random()<cookingChance(job.raw)){
    save.inv[recipe.to]=(save.inv[recipe.to]||0)+1;
    addXp('cooking',recipe.xp);job.cooked++;
  }else job.burned++;
  job.done++;job.remaining--;
  persist();uiHud();
  if(job.remaining<=0){
    stopCooking('Finished cooking: '+job.cooked+' cooked, '+job.burned+' burnt.',false);
  }else job.nextAt=now+COOK_MS;
  if(tab==='cook')renderModal();
}
function cookingProgress(now=Date.now()){
  const job=cookJob;if(!job)return;
  const fill=$('cookingFill'),labelNode=$('cookingStatus');
  if(fill)fill.style.width=(100*clamp(1-(job.nextAt-now)/COOK_MS,0,1))+'%';
  if(labelNode)labelNode.textContent=job.done+'/'+job.total+' prepared · '+job.cooked+' cooked · '+job.burned+' burnt';
}
function rCook(){
  mBody.append(el('p','note','Choose a fish to cook. Burnt fish is lost; only successful food earns XP.'));
  const qty=el('div','smith-qty');
  qty.append(el('span','smith-label','Make'));
  for(const [value,caption] of [[1,'1'],[5,'5'],[10,'10'],['all','All']]){
    const b=el('button','chip',caption);b.type='button';b.disabled=!!cookJob;
    b.setAttribute('aria-pressed',String(cookQuantity===value));
    b.addEventListener('click',()=>{cookQuantity=value;renderModal()});qty.append(b);
  }
  mBody.append(qty);
  const recipe=COOK[cookSelected];
  const available=save.inv[cookSelected]||0;
  const count=cookQuantity==='all'?available:Math.min(available,cookQuantity);
  const canMake=lvlFor(save.xp.cooking)>=recipe.req&&count>0&&canFitInventory({[cookSelected]:-1,[recipe.to]:1});
  const work=el('div','smith-work');
  if(cookJob){
    work.append(el('b','smith-work-title','Cooking '+ITEMS[cookJob.raw].name.replace('Raw ','').toLowerCase()));
    const progress=el('div','smith-progress'),fill=el('i','');fill.id='cookingFill';progress.append(fill);work.append(progress);
    const status=el('small','smith-work-status','');status.id='cookingStatus';work.append(status);
    const stop=el('button','btn smith-primary','Stop cooking');stop.type='button';
    stop.addEventListener('click',()=>stopCooking());work.append(stop);
  }else{
    work.append(el('b','smith-work-title',ITEMS[recipe.to].name));
    work.append(el('p','note',count+' selected · '+recipe.xp+' XP on success · '+Math.round(cookingChance(cookSelected)*100)+'% success chance'));
    const go=el('button','btn smith-primary','Cook '+count);go.type='button';go.disabled=!canMake;
    go.addEventListener('click',()=>startCooking(cookSelected));work.append(go);
  }
  mBody.append(work);
  for(const [raw,r] of Object.entries(COOK)){
    const row=el('div','shoprow smith-recipe');
    const selected=cookSelected===raw,level=lvlFor(save.xp.cooking);
    row.setAttribute('aria-selected',String(selected));
    row.innerHTML=itemSvg(r.to,32)+'<span>'+ITEMS[r.to].name+
      '<small>'+ITEMS[raw].name+' · '+(save.inv[raw]||0)+' available · heals '+FOOD[r.to].heal+'</small>'+
      '<small class="'+(level<r.req?'bad':'')+'">Cooking '+r.req+' · '+r.xp+' XP · '+Math.round(cookingChance(raw)*100)+'% success</small></span>';
    const b=el('button','btn',selected?'Selected':'Choose');b.type='button';b.disabled=!!cookJob;
    b.addEventListener('click',()=>{cookSelected=raw;renderModal()});row.append(b);mBody.append(row);
  }
  cookingProgress();
}
function enterBuilding(b,now){
  stopCooking('',false);
  if(b.open){openSmithy('trade');return}
  if(b.id!=='arms'){outdoorShop=TRADER;openShop();return}
  inside=b;me.ox=b.x;me.oy=b.y+6;me.x=88;me.y=112;me.face=1;act=null;marker=null;petsTeleport();
  for(const m of mons){if(m.state==='chase')m.state='return';m.warn=null}
  fade=0;snapCam=true;exitCD=now+700;
  say('You enter '+SHOPS[b.id].name+'.');sendPresence();
}
function leaveBuilding(now){
  stopCooking('',false);
  const b=inside;inside=null;
  me.x=b.x;me.y=b.y+9;act=null;fade=0;me.fx=0;me.fy=1;me.dv='d';snapCam=true;exitCD=now+700;petsTeleport();
  if(tab==='shop'||tab==='cook')closeModal();
  sendPresence();
}
function die(){
  if(me.deathAt!=null)return;
  stopSmithing('',false);stopCooking('',false);
  me.deathAt=performance.now();me.hp=0;me.moving=false;me.pend=0;pendingStrike=null;me.swing=-99999;
  act=null;marker=null;wantSwing=false;closeModal();
  say('Oh dear, you are dead!','red');toast('YOU DIED');uiHud();
  for(const m of mons){if(m.state==='chase')m.state='return';m.warn=null}
}
function respawnPlayer(){
  me.deathAt=null;inside=null;me.x=CX;me.y=CY+40;me.hp=hpMax();me.hurtAt=-99999;
  me.dv='d';me.face=1;me.moving=false;regen=0;snapCam=true;exitCD=performance.now()+700;
  uiHud();petsTeleport();sendPresence();
}
// The current multiplayer room shares presence only, not authoritative monster
// health. Live clients record ONLY their own effective damage. A future shared
// boss service must send a verified ledger to this pure reward resolver.
function recordBossContribution(m,id,damage){
  const mt=MT[m.t];
  if(!mt?.boss||typeof id!=='string'||!id.trim()||!Number.isFinite(damage)||damage<=0)return 0;
  const effective=Math.min(Math.max(0,m.hp),damage);
  if(effective<=0)return 0;
  if(!m.bossDamage)m.bossDamage=new Map();
  m.bossDamage.set(id,(m.bossDamage.get(id)||0)+effective);
  return effective;
}
// All eligible players share ONE guaranteed coin pool. Their independent
// rare-gear rolls together retain the original expected item yield per boss:
// sum(individual chances) == mt.drop.p. Higher real damage means a greater
// roll chance, but a participant cannot claim the entire pool by last-hitting.
// Inputs MUST be server-verified; never trust peer presence or self-reporting.
function resolveBossRewards(mt,entries,coinPool,random=Math.random){
  if(!mt?.boss)return [];
  const credit=new Map();
  for(const row of entries||[]){
    const id=row?.id,damage=row?.damage;
    if(typeof id!=='string'||!id.trim()||id.length>96||
       !Number.isFinite(damage)||damage<=0)continue;
    credit.set(id,(credit.get(id)||0)+damage);
  }
  const all=[...credit].map(([id,damage])=>({id,damage}))
    .sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id));
  const minimum=Math.max(1,Math.ceil(mt.hp*.05));
  const eligible=all.length===1?all:all.filter(r=>r.damage>=minimum);
  if(!eligible.length)return [];
  const pool=Math.max(0,Math.floor(Number.isFinite(coinPool)?coinPool:0));
  const damageSum=eligible.reduce((n,r)=>n+r.damage,0);
  const weights=eligible.map(r=>Math.sqrt(r.damage));
  const weightSum=weights.reduce((a,b)=>a+b,0);
  const baseCoins=pool>=eligible.length?1:0;
  const remaining=pool-baseCoins*eligible.length;
  const payouts=eligible.map((r,i)=>{
    const exactCoins=remaining*r.damage/damageSum;
    return {...r,share:r.damage/damageSum,
      dropChance:eligible.length===1?clamp(mt.drop?.p||0,0,1):
        clamp((mt.drop?.p||0)*weights[i]/weightSum,0,1),
      coins:baseCoins+Math.floor(exactCoins),fraction:exactCoins-Math.floor(exactCoins)};
  });
  let unpaid=pool-payouts.reduce((n,r)=>n+r.coins,0);
  const order=payouts.map((r,i)=>i).sort((a,b)=>
    payouts[b].fraction-payouts[a].fraction||payouts[b].damage-payouts[a].damage||
    payouts[a].id.localeCompare(payouts[b].id));
  for(let i=0;i<unpaid;i++)payouts[order[i]].coins++;
  return payouts.map(({fraction,...r})=>({...r,rare:random()<r.dropChance}));
}
// One fixed reward per defeated creature. This is one quarter of the old
// full-health damage reward, and never includes overkill or regenerated health.
function combatKillXp(mt){return Math.max(1,Math.round(mt.hp*mt.xpm))}
function killMon(m,now){
  if(m.state==='dead')return;
  const mt=MT[m.t];m.state='dead';m.warn=null;m.back=now+12000;m.dieAt=now;
  decals.push({x:m.x,y:m.y,t:now,c:m.t==='slime'?'#e86a86':'#a82418'});
  const c=rint(mt.coins[0],mt.coins[1]);
  const group=mt.boss?resolveBossRewards(mt,
    m.bossDamage?.size?[...m.bossDamage].map(([id,damage])=>({id,damage})):
      [{id:'local',damage:mt.hp}],c):null;
  const mine=!mt.boss||group.find(r=>r.id==='local');
  if(mine){
    say('You have defeated the '+mt.name.toLowerCase()+'.','gold');
    addXp('melee',combatKillXp(mt));
    const coins=mt.boss?mine.coins:c;
    save.inv.coins+=coins;say('You find '+coins+' coins.');
  }
  if(mine){
    let hit=false;
    for(const j of save.jobs)for(const o of j.objs)if(o.type==='slay'&&o.mon===m.t&&o.have<o.need){o.have++;hit=true}
    if(hit)for(const j of save.jobs){const was=j.done;j.done=jobDone(j);if(j.done&&!was){say('Odd job complete! Claim it in your Jobs tab.','gold');toast('ODD JOB DONE\nOpen your Jobs tab')}}
  }
  if(mine&&Math.random()<mt.bread){if(canFitInventory({bread:1})){save.inv.bread++;say('It dropped some bread.')}else say('It dropped bread, but your pack is full.','warn')}
  if(mine&&(mt.boss?mine.rare:Math.random()<mt.drop.p)){
    const mat=Math.max(2,mt.drop.mats[rint(0,mt.drop.mats.length-1)]);
    const kinds=Object.keys(KINDS).filter(k=>KINDS[k].mats.includes(mat));
    giveGear(MATS[mat].k+'_'+kinds[rint(0,kinds.length-1)]);
  }
  if(act&&act.ref===m)act=null;
  uiHud();persist();if(tab)renderModal();
}
function doAction(dt,now){
  const a=act;
  if(a.kind==='node'){
    const n=a.ref,nt=NT[n.k],L=lvlFor(save.xp[nt.skill]),fishing=nt.skill==='fishing';
    if(now<n.back||!nodeOK(n)){act=null;return}
    const slot=toolFor(nt.tool)?toolFor(nt.tool).kind:nt.tool;
    if(!a.checked){
      a.checked=true;a.slot=slot;a.iv=fishing?2.4:nt.skill==='mining'?miningInterval(toolFor(nt.tool)):(nt.skill==='woodcutting'&&save.perks.secateurs?1.44:1.8);if(fishing)a.t=-.2;
      if(L<nt.req){say('You need '+NAMES[nt.skill]+' level '+nt.req+' for this.','warn');blocked.add(n);act=null;return}
      const d0=toolFor(nt.tool);
      if(!d0){
        const have=eqDef('weapon');
        if(have&&!usable(have))say('You need '+NAMES[have.skill]+' '+have.req+' to use your '+have.name.toLowerCase()+'.','warn');
        else say('You need '+TOOLNAME[nt.tool]+' equipped in your weapon slot. Buy or forge one, then equip it.','warn');
        blocked.add(n);act=null;return;
      }
      if(slot==='rod'&&!(save.inv.bait>0)){say('You need bait for your rod. Buy some at the fishing shop.','warn');blocked.add(n);act=null;return}
      say(slot==='rod'?'You ready your rod.':nt.msg);
    }
    const d=toolFor(nt.tool);
    if(!d){act=null;return}
    a.slot=d.kind;
    const gains={[nt.item]:1};
    if(fishing&&!a.casted&&slot==='rod')gains.bait=-1;
    if(!canFitInventory(gains)){say('Your pack is full.','warn');blocked.add(n);act=null;return}
    a.t+=dt;
    if(fishing){
      if(!a.casted&&a.t>=0){
        if(slot==='rod'){if(!(save.inv.bait>0)){say('You are out of bait. Buy more at the fishing shop.','warn');act=null;return}save.inv.bait--;if(tab)renderModal()}
        a.casted=true;a.cast0=now;n.fishCastAt=now;startSwing(now);
      }
    }else if(!a.swung&&a.t>=a.iv-.2){a.swung=true;startSwing(now)}
    if(a.t>=a.iv){
          a.t-=a.iv;a.swung=false;
      if(fishing){a.casted=false;a.t=-.9}
      const success=Math.random()<clamp(nt.base+(L-nt.req)*.025+Math.max(0,d.mat-2)*.06,.05,.92);
      if(nt.skill==='mining')recordMiningHit(n,now,success);
      if(nt.skill==='woodcutting')recordForestryHit(n,now,success);
      if(fishing){n.fishHitAt=now;n.fishSucceeded=success;}
      burst(n.x,n.y-10,nt.tool==='axe'?[...forestryHitPalette(n).bark,forestryHitPalette(n).leaf[0]]:fishing?['#8cc0f4','#ffffff','#3f7fcc']:nt.skill==='mining'?miningDustColors(n):['#ffe14a','#ffffff','#c8d2d6'],!success&&(nt.skill==='mining'||nt.skill==='woodcutting')?3:6,22);
      if(success){
        save.inv[nt.item]++;
        if(n.k==='aether'&&save.perks.magnet&&Math.random()<.05){save.inv.aether++;say('The aether magnet doubles your yield!','gold')}
        // A visible charge count also makes it obvious that the running game
        // has the multi-ore mining update, rather than an old cached bundle.
        const veinExhausted=nt.skill==='mining'&&consumeOreVein(n,nt,now);
        say(fishing?'You catch some '+ITEMS[nt.item].name.toLowerCase().replace('raw ','raw ')+'.':
          'You get some '+ITEMS[nt.item].name.toLowerCase()+'.'+
          (nt.skill==='mining'&&!veinExhausted?' ('+n.oreLeft+' ores left in this vein)':''));
        if(fishing){me.catchFx={t:now,item:nt.item};startSwing(now)}
        addXp(nt.skill,nt.xp);rollPet(nt.skill);persist();if(tab)renderModal();
        if(nt.skill==='mining'){
          if(veinExhausted){
            say('This ore vein is exhausted. It will replenish soon.','warn');
            act=null;
          }
        }else if(Math.random()<nt.dep){
          n.back=now+rint(nt.rt[0],nt.rt[1])*1000;
          if(nt.skill==='woodcutting')n.fellAt=now;
          act=null;
        }
      }else if(fishing)say('The fish gets away.');
    }
  }else{
    const m=a.ref,mt=MT[m.t],L=lvlFor(save.xp.melee);
    if(m.state==='idle'||m.state==='return')m.state='chase';
    if(!a.checked){a.checked=true}
    const w=activeDef('weapon');
    me.tool=w?'sword':'fist';me.mat=w?w.mat:2;
    const iv=SWING_IV/1000;a.t+=dt;
    if(!a.swung&&a.t>=iv-.2&&now>=nextSwing-200){a.swung=true;startSwing(now)}
    if(a.t>=iv&&now>=nextSwing){
      // Manual and targeted attacks consume the same per-character cooldown.
      // Discard accumulated action time to prevent burst attacks on mode switch.
      nextSwing=now+SWING_IV;
      a.t=0;a.swung=false;
          const atk=atkBonus();
      const hit=Math.random()<clamp(.55+(L-mt.def)*.03+atk*.01,.25,.95);
      const dmg=hit?rint(1,2+Math.floor(L/4)+atk):0;
      recordBossContribution(m,'local',dmg);
      m.hp-=dmg;splat(m.x,m.y-16,dmg);sfx(dmg>0?'hit':'miss');
      if(dmg>0)recordCombatHit(m,now,me.x,me.y,w?.kind==='sword');
      burst(m.x,m.y-8,dmg>0?['#d83a2a','#ffffff','#ffd24a']:['#ffffff','#b5c8d8'],dmg>0?7:3,20);
      if(m.hp<=0)killMon(m,now);
    }
  }
}
// The marker is locked to the player's position at wind-up start. It never
// homes in during the countdown, so dodging the indicated ground really
// avoids the hit. Unconfigured mobs still use their original instant strike.
function beginMonsterWarning(m,mt,now){
  const cfg=monsterWarningConfig(mt);
  if(!cfg||m.warn)return false;
  m.warn={x:Math.round(me.x),y:Math.round(me.y),start:now,until:now+cfg.ms,radius:cfg.radius};
  m.face=me.x>=m.x?1:-1;
  return true;
}
function damagePlayerFromMonster(m,mt,now){
  m.lunge=now;
  const L=lvlFor(save.xp.melee),D=defTotal();
  let dmg=Math.random()<clamp(.75+(mt.lv-L)*.008-D*.0012,.35,.9)?rint(1,mt.max):0;
  if(dmg>0)dmg=Math.max(1,Math.round(dmg*(1-defRed())));
  me.hp-=dmg;if(dmg>0)me.hurtAt=performance.now();splat(me.x,me.y-18,dmg);uiHud();
  if(dmg>0&&me.hp>0&&me.hp<=hpMax()*.25&&foodCount()>0)say('You are low on health. Tap the food button to eat.','warn');
  if(me.hp<=0)die();
}
function completeMonsterWarning(m,mt,now){
  const warn=m.warn;
  if(!warn||now<warn.until)return false;
  m.warn=null;m.cd=0;
  // Missed ground-zone attacks still play their attack animation but do not
  // roll damage, consume health or spawn a misleading damage number.
  if(Math.hypot(me.x-warn.x,me.y-warn.y)<=warn.radius)damagePlayerFromMonster(m,mt,now);
  else m.lunge=now;
  return true;
}
function update(dt,now){
  if(me.deathAt!=null){me.moving=false;if(now-me.deathAt>=1050)respawnPlayer();return}
  regen+=dt;if(regen>6){regen=0;if(me.hp<hpMax()){me.hp=Math.min(hpMax(),me.hp+Math.max(1,Math.floor(hpMax()/40)));uiHud()}}
  const pxv=me.x,pyv=me.y;
  refreshHeld();
  if(!started){const g=activePad();if(g){if(g.buttons[0]&&g.buttons[0].pressed&&!gpPrev[0])$('go').click();gpPrev=g.buttons.map(b=>!!b.pressed)}}
  if(me.pend&&now>=me.pend){me.pend=0;resolveSwing(now)}
  let mx=0,my=0;
  if(started){
    const gp=pollPad(now);mx=stick.dx+gp.x;my=stick.dy+gp.y;gpAtk=gp.atk;
    if(keys['arrowleft']||keys['a'])mx-=1;if(keys['arrowright']||keys['d'])mx+=1;
    if(keys['arrowup']||keys['w'])my-=1;if(keys['arrowdown']||keys['s'])my+=1;
  }
  let mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;mag=1}
  const manual=mag>.18;
  me.moving=false;let inRange=false;
  if(manual){
    stopSmithing('',false);stopCooking('',false);act=null;blocked.clear();idleT=0;
    const sp=SPD*mag;
    me.x+=mx/mag*sp*dt;me.y+=my/mag*sp*dt;me.moving=true;
  }else if(started){
    if(act){inRange=true;idleT=0}else idleT+=dt;
  }
  if(inside){
    me.x=clamp(me.x,10,166);me.y=clamp(me.y,70,120);
    if(me.y>=119&&Math.abs(me.x-88)<=18&&now>exitCD)leaveBuilding(now);
  }else{
    me.x=clamp(me.x,EDGE+8,WW-EDGE-8);me.y=clamp(me.y,EDGE+8,WH-EDGE-8);
    if(inWater(me.x,me.y)){if(!inWater(me.x,pyv))me.y=pyv;else if(!inWater(pxv,me.y))me.x=pxv;else{me.x=pxv;me.y=pyv}}
    for(const q of SOLID){
      if(me.x>q.x0&&me.x<q.x1&&me.y>q.y0&&me.y<q.y1){
        const l=me.x-q.x0,r=q.x1-me.x,t=me.y-q.y0,bt=q.y1-me.y,m=Math.min(l,r,t,bt);
        if(m===l)me.x=q.x0;else if(m===r)me.x=q.x1;else if(m===t)me.y=q.y0;else me.y=q.y1;
      }
    }
    for(const b of BLD){
      if(!b.open)continue;
      const hw=b.w/2+3;
      if(Math.abs(me.x-b.x)<=7&&me.y<=b.y+1&&me.y>=b.y-4&&now>exitCD){enterBuilding(b,now);break}
      if(me.x>b.x-hw&&me.x<b.x+hw&&me.y>b.y-14&&me.y<b.y){
        const l=me.x-(b.x-hw),r=(b.x+hw)-me.x,t=me.y-(b.y-14),bt=b.y-me.y,m=Math.min(l,r,t,bt);
        if(m===bt)me.y=b.y+3;else if(m===t)me.y=b.y-14.5;else if(m===l)me.x=b.x-hw-.5;else me.x=b.x+hw+.5;
      }
    }
  }
  smithingTick();smithingProgress();cookTick();cookingProgress();
  // Evaluate attack after gamepad input, joystick movement and collision
  // resolution. The first pressed frame now uses the correct controller state
  // and the strike begins from the player's actual post-movement position.
  const combatHeld=atkHeld||gpAtk||keys[' '];
  const lockedEnemy=started&&!inside&&combatHeld?meleeTarget():null;
  if(lockedEnemy){
    faceMeleeTarget(lockedEnemy);me.tgt=lockedEnemy;me.tgtUntil=now+4000;
  }else if(manual){
    const i8=Math.round(Math.atan2(my,mx)/(Math.PI/4));
    me.fx=+Math.cos(i8*Math.PI/4).toFixed(3);me.fy=+Math.sin(i8*Math.PI/4).toFixed(3);
    if(Math.abs(me.fx)>.3)me.face=me.fx>0?1:-1;
    me.dv=Math.abs(me.fy)>Math.abs(me.fx)*1.1?(me.fy>0?'d':'u'):'s';
  }
  if(started&&!inside&&!me.pend&&(combatHeld||wantSwing)&&now>=nextSwing){
    nextSwing=now+SWING_IV;wantSwing=false;beginSwing(now);
  }
  if(act&&inRange){
    if(act.kind==='npc'){act=null;openShop()}
    else if(act.kind==='door'){const b=act.ref;act=null;if(!inside&&b.open)enterBuilding(b,now)}
    else doAction(dt,now);
  }

  if(!inside)critUpdate(dt,now);
  if(!inside)for(const m of mons){
    const mt=MT[m.t];
    if(m.state==='dead'){m.warn=null;if(now>=m.back){m.state='idle';m.prov=false;m.hp=mt.hp;m.bossDamage=null;m.x=m.hx;m.y=m.hy;m.cd=0}continue}
    const dxp=me.x-m.x,dyp=me.y-m.y,dp=Math.hypot(dxp,dyp);
    if(m.state==='chase'){
      if(!m.prov&&lvlFor(save.xp.melee)>=2*mt.lv){m.state='return';m.warn=null}else
      if(Math.hypot(m.x-m.hx,m.y-m.hy)>170||dp>130){m.state='return';m.warn=null}
      else if(m.warn){
        // Freeze the enemy and its telegraph origin until the warning resolves.
        completeMonsterWarning(m,mt,now);
      }else if(dp>11){const st=mt.sp*dt;m.x+=dxp/dp*st;m.y+=dyp/dp*st;if(Math.abs(dxp)>.6)m.face=dxp>0?1:-1}
      else{
        m.cd+=dt;
        const warning=monsterWarningConfig(mt);
        if(warning&&m.cd>=mt.iv-warning.ms/1000)beginMonsterWarning(m,mt,now);
        else if(!warning&&m.cd>=mt.iv){m.cd=0;damagePlayerFromMonster(m,mt,now)}
      }
    }else if(m.state==='return'){
      m.warn=null;
      const dx=m.hx-m.x,dy=m.hy-m.y,d=Math.hypot(dx,dy);
      if(d<3){m.state='idle';m.hp=mt.hp;m.bossDamage=null;m.prov=false}else{m.x+=dx/d*mt.sp*dt;m.y+=dy/d*mt.sp*dt}
    }else if(started&&dp<(mt.ag||40)&&lvlFor(save.xp.melee)<2*mt.lv){m.state='chase';m.cd=mt.iv*.5}else{
      m.w-=dt;if(m.w<=0){m.w=2+Math.random()*5;m.wx=m.hx+rint(-18,18);m.wy=m.hy+rint(-18,18)}
      const dx=m.wx-m.x,dy=m.wy-m.y,d=Math.hypot(dx,dy);
      if(d>1){m.x+=dx/d*10*dt;m.y+=dy/d*10*dt;if(Math.abs(dx)>.4)m.face=dx>0?1:-1}
    }
  }
  peers.forEach(o=>{const k=Math.min(1,dt*9);o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k});
  petsUpdate(dt,now);
  for(let i=fx.length-1;i>=0;i--){const p=fx[i];if(now-p.t>520){fx.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=70*dt}
  for(let i=decals.length-1;i>=0;i--)if(now-decals[i].t>25000)decals.splice(i,1);

  const tg=$('tgt'),tm=me.tgt;
  if(tm&&tm.state!=='dead'&&now<me.tgtUntil){tg.hidden=false;const mt=MT[tm.t];$('tgtName').textContent=mt.name+' (Lv '+mt.lv+')';$('tgtFill').style.width=clamp(tm.hp/mt.hp,0,1)*100+'%'}
  else tg.hidden=true;
}

/* ---------- drawing ---------- */
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
// Compact pixel sparks exist only at the contact point of successful hits.
// No blur, extra sprite sheets or unbounded allocations on mobile.
// A modest native-pixel warning painted on the ground, underneath characters.
// The outer amber ring is the actual hit radius; red pixels fill as
// impact approaches. Only explicitly configured enemies produce these markers.
function drawMonsterWarning(m,cx,cy,now){
  const warn=m.warn;
  if(!warn||m.state!=='chase'||now>=warn.until)return;
  const phase=clamp((now-warn.start)/(warn.until-warn.start),0,1);
  const x=Math.round(warn.x-cx),y=Math.round(warn.y-cy),r=warn.radius;
  ctx.save();ctx.globalAlpha=.55+.3*phase;
  for(let i=0;i<24;i++){
    const a=i*Math.PI/12,px=x+Math.round(Math.cos(a)*r),py=y+Math.round(Math.sin(a)*r);
    R(px,py,2,2,i/24<=phase?'#ff6543':'#e4ae57');
  }
  // Interior hint without a solid overlay that would hide grass or loot.
  ctx.globalAlpha=.28+.2*phase;
  R(x-2,y-1,5,2,phase>.65?'#e86a47':'#e9ae62');
  R(x-1,y-3,2,6,phase>.65?'#e86a47':'#e9ae62');
  ctx.restore();
}
function drawCombatImpacts(now,cx,cy){
  for(let i=combatImpacts.length-1;i>=0;i--){
    const p=combatImpacts[i],age=now-p.t;
    if(age<0||age>=180){combatImpacts.splice(i,1);continue}
    const x=Math.round(p.x-cx),y=Math.round(p.y-cy);
    const sx=p.nx>=0?1:-1,sy=p.ny>=0?1:-1;
    if(age<52){
      R(x-1,y-1,3,3,'#fff9da');
      R(x-4,y,2,1,'#ffd27e');R(x+3,y,2,1,'#ffd27e');
      R(x,y-4,1,2,'#ffffff');
      if(p.sword){R(x+sx*4,y+sy*2,2,1,'#fff1ba');R(x-sx*4,y-sy*2,1,2,'#f6b847')}
    }else if(age<105){
      R(x-2,y-1,2,1,'#f5c768');R(x+2,y,2,1,'#f5c768');
      if(p.sword)R(x+sx*5,y+sy*3,2,1,'#ffffff');
    }else if(p.sword){
      R(x+sx*6,y+sy*4,1,1,'#dda54b');
    }
  }
}
function label(t,x,y,col){ctx.font='12px VT323, monospace';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(t,x+1,y);ctx.fillText(t,x-1,y);ctx.fillText(t,x,y+1);ctx.fillText(t,x,y-1);ctx.fillStyle=col;ctx.fillText(t,x,y)}
function bar(x,y,p){R(x-9,y-1,18,5,'#1d120a');R(x-8,y,16,3,'#4a1410');R(x-8,y,Math.round(16*clamp(p,0,1)),3,'#e84a30');R(x-8,y,Math.round(16*clamp(p,0,1)),1,'#ff9a70');R(x-12,y-1,3,5,'#c9803a');R(x+9,y-1,3,5,'#c9803a')}
// Reserve overhead screen-space once per frame. The locked target takes first
// place; secondary health bars move upward or disappear when densely packed.
// They never change monster positions, hitboxes, save data, or target selection.
function combatRectOverlaps(a,b,gap=2){
  return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
}
function layoutMonsterOverlays(cx,cy,now){
  const visible=mons.filter(m=>m.state!=='dead'&&m.x>=cx-30&&m.x<=cx+cv.width+30&&m.y>=cy-40&&m.y<=cy+cv.height+15);
  const focus=me.tgt&&now<me.tgtUntil&&visible.includes(me.tgt)?me.tgt:null;
  const nearby=visible.filter(m=>Math.hypot(m.x-me.x,m.y-me.y)<70).length;
  const ordered=focus?[focus,...visible.filter(m=>m!==focus)]:visible.slice();
  if(ordered.length>1)ordered.splice(focus?1:0,ordered.length-(focus?1:0),...ordered.slice(focus?1:0).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y)));
  const placed=[];
  for(const m of ordered){
    if(placed.length>=10)break;
    const mt=MT[m.t],selected=m===focus,near=Math.hypot(m.x-me.x,m.y-me.y)<70;
    const showBar=selected||m.hp<mt.hp,showName=selected||(near&&nearby<=2);
    if(!showBar&&!showName)continue;
    const name=showName?mt.name+' (Lv '+mt.lv+')':'';
    const w=Math.min(Math.max(showName?Math.ceil(name.length*6.5)+8:24,24),Math.max(24,cv.width-6));
    const x=clamp(Math.round(m.x-cx),Math.ceil(w/2)+2,Math.floor(cv.width-w/2)-2);
    const top=m.y-cy-({goblin:27,wolf:20,boar:18,bear:30,cave:30,abear:30}[m.t]||15);
    for(const lift of [0,12,24,36,48]){
      const y=Math.round(top-lift);
      const rect={x:Math.round(x-w/2),y:y-(showName?17:2),w,h:showName?(showBar?24:17):8};
      if(rect.y<2||rect.y+rect.h>cv.height-2)continue;
      if(placed.some(p=>combatRectOverlaps(rect,p.rect)))continue;
      placed.push({m,x,y,name,showBar,rect});break;
    }
  }
  return placed;
}
function drawMonsterOverlays(overlays){
  for(const p of overlays){
    if(p.showBar)bar(p.x,p.y,p.m.hp/MT[p.m.t].hp);
    if(p.name)label(p.name,p.x,p.y-5,'#ffffff');
  }
}
// Keep new hits legible even when several monsters or damage numbers overlap.
// Reposition labels in screen space only; draw calls never affect simulation.
function layoutDamagePopups(now,cx,cy,overlays=[]){
  const occupied=overlays.map(p=>p.rect||p),out=[];
  const shifts=[0,16,-16,32,-32];
  for(let i=splats.length-1;i>=0;i--){
    const s=splats[i],age=now-s.t;
    if(age>=DAMAGE_POPUP_MS){splats.splice(i,1);continue}
    if(age<0)continue;
    if(out.length>=24)continue;
    const value=s.v===0?'MISS':String(s.v);
    const w=Math.max(17,value.length*6+6),baseX=Math.round(s.x-cx),baseY=Math.round(s.y-cy-age/110);
    const lane=s.lane||0;
    let spot=null;
    for(const dy of [0,-14,-28,14,28]){
      for(let j=0;j<shifts.length;j++){
        const x=baseX+shifts[(j+lane)%shifts.length],y=baseY+dy;
        const rect={x:Math.round(x-w/2),y:y-11,w,h:14};
        if(rect.x<2||rect.x+rect.w>cv.width-2||rect.y<2||rect.y+rect.h>cv.height-2)continue;
        if(occupied.some(b=>combatRectOverlaps(rect,b)))continue;
        spot={x,y,value,s,age,rect};break;
      }
      if(spot)break;
    }
    if(spot){out.push(spot);occupied.push(spot.rect)}
  }
  return out;
}
function drawDamagePopups(now,cx,cy,overlays){
  for(const p of layoutDamagePopups(now,cx,cy,overlays)){
    const fade=clamp((DAMAGE_POPUP_MS-p.age)/220,0,1);
    ctx.save();ctx.globalAlpha=fade;
    R(p.rect.x,p.rect.y,p.rect.w,p.rect.h,p.s.v===0?'#1c2830':'#321d19');
    R(p.rect.x+1,p.rect.y+1,p.rect.w-2,p.rect.h-2,p.s.v===0?'#4a6171':'#75412e');
    ctx.font='12px VT323, monospace';ctx.textAlign='center';
    ctx.fillStyle='#ffffff';ctx.fillText(p.value,p.x,p.y);
    ctx.restore();
  }
}
function swingAng(age){
  if(age<90)return lerp(-.35,-1.5,age/90);
  if(age<200)return lerp(-1.5,1.0,(age-90)/110);
  return lerp(1.0,-.35,(age-200)/120);
}
function drawTool(kind,mat,hx,hy,f,ang,size=1){
  if(kind==='sword'&&window.MyrrenSwords?.draw(ctx,mat,hx,hy,f,ang,size))return;
  const a=ART[kind],pal=Object.assign({},a.p,{S:MATS[mat].H}),s=1.7*size,ca=Math.cos(ang),sa=Math.sin(ang);
  for(let j=0;j<8;j++)for(let i=0;i<8;i++){
    const c=a.m[j][i];if(c==='.'||!pal[c])continue;
    const vx=(i-1)*s,vy=(j-6)*s;
    let rx=vx*ca-vy*sa;const ry=vx*sa+vy*ca;
    if(f<0)rx=-rx;
    R(Math.round(hx+rx),Math.round(hy+ry),Math.max(1,Math.round(2*size)),Math.max(1,Math.round(2*size)),pal[c]);
  }
}
const OUT='#4a3a1c';
const H2=(a,b)=>(Math.imul((a|0)*73856093^(b|0)*19349663,2246822519)>>>0);
function RA(x,y,w,h,a,c){ctx.globalAlpha=a;ctx.fillStyle=c||'#1c2606';ctx.fillRect(x,y,w,h);ctx.globalAlpha=1}
function blob(x,y,r,c){for(let j=-r;j<=r;j++){const w=Math.round(Math.sqrt(r*r-j*j+r*.5));R(x-w,y+j,w*2+1,1,c)}}
function shadowE(x,y,w,h,a){ctx.globalAlpha=a||.22;ctx.fillStyle='#1c2606';for(let j=-h;j<=h;j++){const ww=Math.round(w*Math.sqrt(Math.max(0,1-(j*j)/(h*h+.01))));ctx.fillRect(x-ww,y+j,ww*2,1)}ctx.globalAlpha=1}
function treeTile(px,py,v){
  R(px,py,T,T,'#6b8420');
  R(px+(v&3),py+1,7,6,'#8aa02a');R(px+8-(v&1)*2,py+6,7,7,'#8aa02a');R(px+1,py+8,6,6,'#7a9424');
  R(px+2+(v&3),py+2,3,2,'#bccd50');R(px+9,py+8,3,2,'#bccd50');
  R(px,py+14,T,2,'#566c18');
  if(v%5===0)R(px+11,py+2,2,2,'#d6b240');
}
function drawBush(x,y,gold){MyrrenEnvironment.fern(ctx,x,y,gold?2:0)}
function nodeTip(n,x,y,now){
  if(!n.tipAt)return;const age=now-n.tipAt;if(age>2600){n.tipAt=0;return}
  const nt=NT[n.k];ctx.globalAlpha=age<1800?1:1-(age-1800)/800;
  // Tapping any tree, fishing spot or ore deposit ONLY identifies the
  // resource and required level, even while a vein is depleted.
  label(nt.name+' (Lv '+nt.req+')',x,y-(TREEK.includes(n.k)?(n.k==='tree'?42:52):n.k.startsWith('spot')?12:20),'#ffffff');
  ctx.globalAlpha=1;
}
// Monumental, non-harvestable ancient rainforest trees. Native-pixel art, not scaled resource trees.
// Cathedral-canopy strangler figs: distinct scenic art, not harvestable trees.
function drawAncientTree(n,x,y,now){MyrrenEnvironment.tree(ctx,n,x,y,now,true)}
// The tree silhouette stays anchored on its existing tile. Contact nudges the
// entire sprite by only 1px (no slicing/clipping), and a bounded handful of
// trunk chips / leaves plays over the stump when a depleted tree falls.
function drawForestryImpact(n,x,y,now){
  const age=now-(n.chopHitAt??-99999),fellAge=now-(n.fellAt??-99999);
  const impact=age>=0&&age<380,leaves=n.chopSucceeded&&age>=0&&age<780;
  const felled=fellAge>=0&&fellAge<960;
  const colors=forestryHitPalette(n);
  if(impact){
    const p=age/380;
    for(let i=0;i<(n.chopSucceeded?4:2);i++){
      const side=i%2?1:-1;
      const dx=side*(3+i*2+Math.round(6*p));
      const dy=-13-(i%2)*3-Math.round(Math.sin(Math.PI*p)*(4+i%3));
      R(x+dx,y+dy,p<.5?2:1,2,colors.bark[i%2]);
    }
  }
  if(leaves||felled){
    const t=felled?fellAge/960:age/780;
    const count=felled?9:5;
    for(let i=0;i<count;i++){
      // Deterministic trajectories: smooth despite frame-rate variation.
      const dx=(i*13%53)-26+Math.round((5+i%4*3)*t);
      const dy=-43-(i*11%40)+Math.round((35+i%3*9)*t);
      R(x+dx,y+dy,t<.65?2:1,t<.85?2:1,colors.leaf[i%2]);
    }
  }
  if(n.back>0&&now>=n.back&&now-n.back<600){
    const p=(now-n.back)/600;
    R(x-5,y-16-Math.round(p*7),2,2,colors.leaf[1]);
    R(x+6,y-20-Math.round(p*5),2,1,colors.leaf[0]);
  }
}
function drawTree(n,x,y,now){
  ctx.save();
  if(Math.abs(me.x-n.x)<31&&me.y<n.y&&me.y>n.y-90)ctx.globalAlpha=.48;
  const age=now-(n.chopHitAt??-99999);
  const recoil=now>=n.back&&age>=0&&age<145?(Math.floor(age/40)%2===0?-1:1):0;
  MyrrenEnvironment.tree(ctx,n,x+recoil,y,now);
  drawForestryImpact(n,x,y,now);
  ctx.restore();
}
// Ore nodes sit below character height; preserve their ground anchor and mining reach.
// Short 1px recoil and tiny fragments make contact feel tangible, with no hitbox,
// mining timer, reward or saved-position changes.
function drawRock(n,x,y,now){
  const age=now-(n.mineHitAt??-99999),recent=age>=0&&age<360;
  const recoil=recent&&age<120?(Math.floor(age/35)%2?1:-1):0;
  ctx.save();ctx.translate(x+recoil,y);ctx.scale(.72,.72);
  MyrrenEnvironment.rock(ctx,n,0,0,now);ctx.restore();
  if(recent){
    const colors=miningDustColors(n),p=age/360,fragments=n.mineSucceeded?5:3;
    for(let i=0;i<fragments;i++){
      const dir=i%2?1:-1;
      const px=Math.round(x+(i-2)*2+dir*(3+i%3)*p);
      const py=Math.round(y-8-(i%3)*2-Math.sin(Math.PI*p)*(4+i%2*2));
      R(px,py,p<.4?2:1,1,colors[i%colors.length]);
    }
  }
  // A small, bounded glint tells players when a depleted vein has returned.
  if(n.back>0&&now>=n.back&&now-n.back<480){
    const h=Math.round(2*(1-(now-n.back)/480));
    R(x-2,y-12-h,4,2,'#e5dbac');
  }
}
function parts(list,O){
  for(const p of list)R(p[0]-1,p[1]-1,p[2]+2,p[3]+2,O);
  for(const p of list)R(p[0],p[1],p[2],p[3],p[4]);
}
function sprWolf(mode,ph,age,fl){
  const O='#262a36',A=fl?'#fff':'#7a8ea8',B=fl?'#fff':'#a6bad0',C=fl?'#dfe4ee':'#566882',W='#f4f8ff';
  if(mode==='dead'){
    const k=age<250?0:age<500?1:2;
    const L=[];
    L.push([-8,-6+k,14,5,A],[-8,-6+k,14,2,B],[5,-6+k,7,5,A],[11,-4+k,3,3,B],[7,-8+k,2,2,C],[-12,-5+k,4,3,C]);
    L.push([-6,-1+k,2,1+(k?0:1),C],[-2,-1+k,2,1,C],[2,-1+k,2,1,C]);
    if(k<2){L[0][1]-=2*(1-k);L[2][1]-=2*(1-k)}
    parts(L,O);R(9,-5+k,2,1,O);R(10,-6+k,1,1,O);return;
  }
  let by=0,hx=0,hy=0,open=0,tail=0,lA=[0,0,0,0],lx=[0,0,0,0],st=0;
  if(mode==='idle'){by=[0,1,1,0][ph];hy=[0,0,1,0][ph];tail=[0,1,0,-1][ph]}
  else if(mode==='walk'){by=[0,1,0,1][ph];tail=[0,1,0,-1][ph];if(ph===1){lA=[2,0,0,2];lx=[1,0,0,1]}else if(ph===3){lA=[0,2,2,0];lx=[0,1,1,0]}else lx=[ph?0:-1,0,0,ph?0:1]}
  else if(mode==='windup'){by=2;hx=-1;hy=2;lx=[-1,0,0,0]}
  else if(mode==='lunge'){by=-1;hx=3;hy=-1;open=1;st=2;lx=[-3,-2,2,3];lA=[0,1,1,0]}
  else if(mode==='recover'){by=1;hx=1;lx=[-1,0,0,1]}
  else if(mode==='hit'){hx=-2;hy=1;by=1;tail=-1}
  const ty=-4+by,L=[];
  const lx0=[-7,-4,0,3];
  for(let i=0;i<4;i++){const top=ty,bot=-lA[i];L.push([lx0[i]+lx[i],top,2,Math.max(1,bot-top),(i&1)?A:C])}
  L.push([-8,ty-6,13+st,6,A],[-7,ty-6,10+st,2,B],[-7,ty-1,11+st,1,C]);
  L.push([-11,ty-7+tail,3,4,A],[-13,ty-8+tail,2,3,B]);
  L.push([3+hx+st,ty-8+hy,7,6,A],[9+hx+st,ty-5+hy-open,3,3,B],[4+hx+st,ty-11+hy,2,3,A],[8+hx+st,ty-11+hy,2,3,C]);
  if(open)L.push([9+hx+st,ty-2+hy,3,2,C]);
  parts(L,O);
  for(let i=0;i<4;i++)if(lA[i]===0)R(lx0[i]+lx[i],-1,2,1,W);
  R(11+hx+st,ty-5+hy-open,1,1,'#14161e');
  if(open)R(10+hx+st,ty-3+hy,2,1,'#b02838');
  R(8+hx+st,ty-7+hy,1,1,fl||mode==='hit'?O:'#ffe36a');
}
function sprSlime(mode,ph,age,fl){
  const O='#7a2c44',A=fl?'#fff':'#f08fa4',B=fl?'#fff':'#ffd0da',C=fl?'#fde':'#cc6480';
  let w=14,h=10,dx=0,dy=0;
  if(mode==='idle'){h=[10,9,10,11][ph];w=[14,15,14,13][ph]}
  else if(mode==='walk'){const t=(performance.now()/420)%1;if(t<.5){dy=-Math.round(Math.sin(t*2*Math.PI)*4);h=11;w=13}else{h=8;w=16}}
  else if(mode==='windup'){w=17;h=7}
  else if(mode==='lunge'){w=12;h=13;dx=3;dy=-3}
  else if(mode==='recover'){w=16;h=8;dx=1}
  else if(mode==='hit'){w=15;h=8;dx=-2}
  else if(mode==='dead'){const k=Math.min(1,age/450);w=14+Math.round(k*8);h=Math.max(2,10-Math.round(k*8))}
  const half=j=>Math.round(w/2*Math.sqrt(1-Math.pow(1-(j+1)/h,2)));
  for(let j=-1;j<h;j++){const hw=j<0?half(0)-1:half(j)+1;R(dx-hw-1,dy-h+j,hw*2+2,1,O)}
  for(let j=0;j<h;j++){const hw=half(j);R(dx-hw,dy-h+j,hw*2,1,j>h-3?C:A)}
  R(dx-w/2,dy,w,1,O);
  if(mode==='dead'){R(dx-3,dy-h+1,3,1,B);return}
  R(dx-w/2+2,dy-h+2,3,2,B);R(dx-w/2+2,dy-h+4,1,1,B);
  const ey=dy-h+Math.max(3,h>>1);
  if(mode==='hit'){R(dx-3,ey,2,1,O);R(dx+2,ey,2,1,O)}
  else{R(dx-3,ey,2,3,O);R(dx+2,ey,2,3,O);R(dx-3,ey,1,1,'#fff');R(dx+2,ey,1,1,'#fff')}
  if(mode==='lunge'||mode==='windup')R(dx-1,ey+3,3,2,O);
}
function sprGoblin(mode,ph,age,fl){
  const O='#1f2d1a',A=fl?'#fff':'#6fae4e',B=fl?'#fff':'#9ad46a',C=fl?'#dfe':'#477a34',T=fl?'#eee':'#7a5230',TD='#5a3a1c',WD='#a8743a';
  if(mode==='dead'){
    const k=age<250?0:age<500?1:2;const L=[];
    L.push([-8,-5+k,13,5,T],[-8,-5+k,13,1,'#9a6a40'],[5,-6+k,7,6,A],[4,-8+k,3,2,A],[10,-8+k,3,2,A],[-12,-4+k,4,2,C],[-1,-1,2,1,C]);
    parts(L,O);R(9,-4+k,2,1,O);R(7,-4+k,1,1,O);R(-4,-9+k,2,5,WD);return;
  }
  let by=0,hy=0,hx=0,la=[0,0],lx=[0,0],club='rest';
  if(mode==='idle'){by=[0,1,1,0][ph];hy=[0,0,1,0][ph]}
  else if(mode==='walk'){by=[0,1,0,1][ph];if(ph===1){la=[2,0];lx=[1,0]}else if(ph===3){la=[0,2];lx=[0,1]}}
  else if(mode==='windup'){by=2;hy=1;club='up';hx=-1}
  else if(mode==='lunge'){by=-1;hx=2;club='swing';lx=[-1,2]}
  else if(mode==='recover'){by=1;club='swing'}
  else if(mode==='hit'){hx=-2;hy=1;by=1;club='rest'}
  const ty=-9+by,L=[];
  L.push([-3+lx[0],-4,2,4-la[0],'#4a3a28'],[1+lx[1],-4,2,4-la[1],'#4a3a28']);
  L.push([-3,ty-1,8,7,T],[-3,ty-1,8,1,'#9a6a40'],[-3,ty+4,8,1,TD]);
  L.push([-5,ty,2,5,A],[5,ty+(club==='up'?-3:0),2,5,A]);
  L.push([-3+hx,ty-8+hy,8,8,A],[-3+hx,ty-8+hy,8,2,B],[-6+hx,ty-6+hy,3,2,A],[5+hx,ty-6+hy,3,2,A],[-7+hx,ty-7+hy,2,1,B],[7+hx,ty-7+hy,2,1,B]);
  parts(L,O);
  R(2+hx,ty-5+hy,2,2,mode==='hit'?O:'#ffd23a');R(-2+hx,ty-5+hy,1,1,'#ffd23a');R(3+hx,ty-2+hy,2,1,'#fff');R(5+hx,ty-3+hy,1,2,C);
  const cx=club==='up'?[-2,-24,2,10]:club==='swing'?[6,-10,11,3]:[6,-13,2,10];
  parts([[cx[0],cx[1]+(club==='swing'?by:0),cx[2],cx[3],WD]],O);
  if(club==='up')R(-3,-25,4,3,TD);else if(club==='swing')R(14,-11,3,5,TD);else R(5,-15,4,4,TD);
}
function sprQuad(c,mode,ph,age,fl){
  const O=c.O,A=fl?'#fff':c.A,B=fl?'#fff':c.B,C=fl?'#e6e6ee':c.C,tw=c.tw,th=c.th,lh=c.lh,x0=-(tw>>1),lw=c.lw||2;
  if(mode==='dead'){
    const k=age<250?0:age<500?1:2,dh=Math.max(4,th-2-(k?1:0)),L=[];
    L.push([x0,-dh+k,tw,dh,A],[x0+1,-dh+k,tw-3,2,B],[x0+tw-1,-dh+k+1,c.hw,Math.max(3,c.hh-2),A],[x0+1,-1+k,3,1,C],[x0+6,-1+k,3,1,C]);
    parts(L,O);R(x0+tw+1,-dh+k+2,2,1,O);return;
  }
  let by=0,hx=0,hy=0,open=0,tail=0,lA=[0,0,0,0],lx=[0,0,0,0],st=0;
  const lf=c.lift||2;
  if(mode==='idle'){by=[0,1,1,0][ph];hy=[0,0,1,0][ph];tail=[0,1,0,-1][ph]}
  else if(mode==='walk'||mode==='flee'){by=mode==='flee'?[0,-1,0,-1][ph]:[0,1,0,1][ph];tail=[0,1,0,-1][ph];if(ph===1){lA=[lf,0,0,lf];lx=[1,0,0,1]}else if(ph===3){lA=[0,lf,lf,0];lx=[0,1,1,0]}else lx=[ph?0:-1,0,0,ph?0:1]}
  else if(mode==='windup'){by=2;hx=-1;hy=2;lx=[-1,0,0,0]}
  else if(mode==='lunge'){by=-1;hx=3;hy=-1;open=1;st=2;lx=[-3,-2,2,3];lA=[0,1,1,0]}
  else if(mode==='recover'){by=1;hx=1;lx=[-1,0,0,1]}
  else if(mode==='hit'){hx=-2;hy=1;by=1;tail=-1}
  const ty=-lh+by,L=[],lx0=[x0+1,x0+4,x0+tw-5,x0+tw-2],hdy=c.hdy||0;
  for(let i=0;i<4;i++){const top=ty,bot=-lA[i];L.push([lx0[i]+lx[i],top,lw,Math.max(1,bot-top),(i&1)?A:C])}
  L.push([x0,ty-th,tw+st,th,A],[x0+1,ty-th,tw-3+st,2,B],[x0+1,ty-1,tw-2+st,1,C]);
  const hxp=x0+tw-2+hx+st,hyp=ty-th-1+hy+hdy,g={x0,ty,th,hxp,hyp,t:tail,st,open};
  if(c.swipe){if(mode==='windup')L.push([x0+tw-5+hx,ty-th-5,3,8,A]);else if(mode==='lunge')L.push([hxp+c.hw-3,ty-th+3,7,3,A])}
  if(c.neck)L.push([x0+tw-3+st+hx,ty-th-6,3,7,A]);
  if(c.tail)c.tail(L,g,A,B,C);
  L.push([hxp,hyp,c.hw,c.hh,A],[hxp+c.hw-1,hyp+(c.hh>>1)-open,c.sw,c.sh,B]);
  if(c.ears)c.ears(L,g,A,B,C);
  if(open)L.push([hxp+c.hw-1,hyp+(c.hh>>1)+c.sh-1,c.sw,2,C]);
  parts(L,O);
  if(c.claw)for(let i=0;i<4;i++)if(lA[i]===0)R(lx0[i]+lx[i],-1,lw,1,'#f4f4f8');
  if(c.swipe){
    if(mode==='windup'){R(x0+tw-5+hx,ty-th-6,3,1,'#fff')}
    else if(mode==='lunge'){const px=hxp+c.hw+4,py=ty-th+3;R(px,py-1,1,1,'#fff');R(px,py+1,1,1,'#fff');R(px+1,py,1,1,'#fff');
      ctx.globalAlpha=.8;R(px+3,py-6,1,2,'#fff');R(px+4,py-4,1,3,'#fff');R(px+4,py,1,3,'#fff');R(px+3,py+3,1,2,'#fff');ctx.globalAlpha=1}
  }
  R(hxp+c.hw+c.sw-2,hyp+(c.hh>>1)-open,1,1,'#14100e');
  if(open)R(hxp+c.hw,hyp+(c.hh>>1)+c.sh-1,2,1,'#b02838');
  R(hxp+c.hw-3,hyp+2,1,1,(fl||mode==='hit')?O:(c.eye||'#ffe36a'));
  if(c.post)c.post(g,fl);
}
const Q_BOAR={O:'#2a1c16',A:'#7a5238',B:'#9a6c48',C:'#52382a',tw:14,th:8,lh:3,hw:7,hh:6,sw:3,sh:3,claw:1,eye:'#f4d27a',
  tail:(L,g,A,B,C)=>{L.push([g.x0-2,g.ty-g.th+g.t,2,2,C])},ears:(L,g,A,B,C)=>{L.push([g.hxp+1,g.hyp-2,2,3,C])},
  post:(g)=>{R(g.x0+1,g.ty-g.th-1,12,1,'#3a261c');R(g.hxp+10,g.hyp+4,1,2,'#f4f0e0')}};
const Q_BEAR={swipe:1,O:'#2a1a12',A:'#7a4a2c',B:'#9a6840',C:'#4e2e1c',tw:16,th:10,lh:4,hw:8,hh:7,sw:3,sh:3,lw:3,claw:1,eye:'#ffd060',
  tail:(L,g,A,B,C)=>{L.push([g.x0-2,g.ty-g.th+1,2,2,C])},ears:(L,g,A,B,C)=>{L.push([g.hxp+1,g.hyp-2,3,3,C],[g.hxp+5,g.hyp-2,3,3,C])},
  post:(g)=>{R(g.hxp+8,g.hyp+3,3,2,'#c49a6c')}};
const Q_FOX={O:'#3a2218',A:'#d8742c',B:'#f0a458',C:'#a0481c',tw:10,th:5,lh:3,hw:5,hh:4,sw:3,sh:2,eye:'#2a1a10',
  tail:(L,g,A,B,C)=>{L.push([g.x0-5,g.ty-g.th-1+g.t,5,4,A],[g.x0-7,g.ty-g.th+g.t,2,3,'#f4f0e8'])},ears:(L,g,A,B,C)=>{L.push([g.hxp+1,g.hyp-3,2,3,A],[g.hxp+3,g.hyp-3,2,3,C])},
  post:(g)=>{R(g.hxp+2,g.hyp+3,3,1,'#f4f0e8')}};
const Q_DEER={O:'#3a2818',A:'#b0763e',B:'#d09a5c',C:'#7a4e26',tw:11,th:5,lh:6,hw:5,hh:4,sw:3,sh:2,lw:1,lift:3,hdy:-5,neck:1,eye:'#1a1008',
  tail:(L,g,A,B,C)=>{L.push([g.x0-2,g.ty-g.th,2,3,'#f4f0e8'])},ears:(L,g,A,B,C)=>{L.push([g.hxp,g.hyp-2,2,2,A],[g.hxp+4,g.hyp-2,2,2,C])},
  post:(g)=>{const ax=g.hxp+2,ay=g.hyp-3;R(ax,ay-4,1,5,'#e8dcc0');R(ax-2,ay-3,2,1,'#e8dcc0');R(ax+1,ay-6,1,2,'#e8dcc0');R(ax+3,ay-3,1,4,'#e8dcc0');R(ax+4,ay-5,1,2,'#e8dcc0');
    R(g.x0+2,g.ty-g.th+1,1,1,'#f4ecd8');R(g.x0+5,g.ty-g.th+2,1,1,'#f4ecd8')}};
function sprBearUp(mode,fl,age){
  const O='#2a1a12',A=fl?'#fff':'#7a4a2c',B=fl?'#fff':'#9a6840',C=fl?'#e6e6ee':'#4e2e1c',L=[];
  const sw=mode==='lunge',lift=mode==='windup'?1:0;
  L.push([-4,-5,3,5,C],[1,-5,3,5,C],[-5,-16,11,12,A],[-3,-14,6,8,B],[-4,-24,9,8,A],[-5,-26,3,3,C],[3,-26,3,3,C],[-1,-20,4,3,'#c49a6c']);
  if(lift)L.push([-9,-23,3,9,A],[6,-23,3,9,A]);else if(sw)L.push([4,-15,9,3,A],[-8,-14,3,6,A]);else L.push([-8,-15,3,8,A],[6,-15,3,8,A]);
  parts(L,O);R(-1,-23,1,1,'#ffd060');R(3,-23,1,1,'#ffd060');R(1,-19,1,1,'#14100e');
  R(-2,-17,5,2,'#b02838');
  if(lift){R(-9,-24,3,1,'#fff');R(6,-24,3,1,'#fff')}else if(sw){R(11,-16,3,1,'#fff');R(11,-14,3,1,'#fff')}
}
function sprBoar(mode,ph,age,fl){sprQuad(Q_BOAR,mode,ph,age,fl)}
function sprBear(mode,ph,age,fl){sprQuad(Q_BEAR,mode,ph,age,fl)}
const Q_CAVE=Object.assign({},Q_BEAR,{A:'#5a5a62',B:'#7a7a86',C:'#34343c',O:'#1a1a20',eye:'#ff6a3a'});
const Q_ABEAR=Object.assign({},Q_BEAR,{A:'#5a3a9a',B:'#8a6ad0',C:'#34205e',O:'#1a1030',eye:'#80f0ff'});
function sprBunny(mode,ph){
  const O='#4a3a38',A='#d8c8b0',B='#f2e8d8',C='#a8967c';
  let by=0,hp=0,ear=0;
  if(mode==='idle'){by=[0,0,1,0][ph];ear=[0,1,0,-1][ph]}
  else{const t=(performance.now()/(mode==='flee'?160:300))%1;by=t<.55?-Math.round(Math.sin(t/.55*Math.PI)*(mode==='flee'?5:3)):1;hp=t<.55?-1:0;ear=t<.55?2:0}
  const y=by,L=[[-4,y-5,8,5,A],[-4,y-5,6,1,B],[3,y-8+hp,5,5,A],[3,y-12+hp-(ear>0?0:0),2,5,A],[6,y-12+hp+(ear>1?1:0),2,5,C],[-6,y-4,3,3,B],[-3,y-1,3,1,C],[2,y-1,3,1,C]];
  parts(L,O);R(6,y-6+hp,1,1,'#1a1010');R(8,y-5+hp,1,1,'#d88a8a');
}
function sprBird(mode,ph,t){
  const O='#3a2a1c',A='#8a5a34',B='#c8924e',C='#5a3a22';
  if(mode==='fly'){const w=[0,-4,0,3][ph];parts([[-3,-5,7,4,A],[-3,-5,5,1,B],[3,-6,3,3,A],[-6,-5+w,4,2,C],[2,-5+w,4,2,C],[-8,-4,3,1,C]],O);R(5,-5,1,1,'#101010');R(6,-4,2,1,'#e8a838');return}
  const peck=mode==='idle'&&ph===2?2:0;
  parts([[-3,-5,6,4,A],[-3,-5,5,1,B],[2,-8+peck,3,3,A],[-6,-4,3,1,C],[-2,-1,1,1,'#c8844a'],[1,-1,1,1,'#c8844a']],O);R(4,-7+peck,1,1,'#101010');R(5,-6+peck,2,1,'#e8a838');
}
function critMode(c,now){return c.mode}
function drawCritter(c,x,y,now){
  const f=c.face||1,fast=c.mode==='flee'||c.mode==='fly',ph=Math.floor(now/(fast?90:c.mode==='walk'?150:300))%4;
  shadowE(x+1,y,c.t==='bird'?3:c.t==='deer'?8:c.t==='fox'?6:4,2,c.t==='bird'&&c.z>2?.12:.24);
  ctx.save();ctx.translate(x,y-(c.z||0));ctx.scale(f,1);
  if(c.t==='bunny')sprBunny(c.mode,ph);else if(c.t==='bird')sprBird(c.mode==='fly'?'fly':'idle',c.mode==='fly'?ph:Math.floor(now/320+c.x)%4);
  else if(c.t==='deer')sprQuad(Q_DEER,c.mode,ph,0,false);else sprQuad(Q_FOX,c.mode,ph,0,false);
  ctx.restore();
}
const crits=[];
function addCrit(t,n,minCamp){for(let i=0;i<n;i++){const s=spot(minCamp,22,BOX[0],BOX[1],BOX[2],BOX[3]);if(s)crits.push({t,x:s[0],y:s[1],hx:s[0],hy:s[1],face:rnd()<.5?-1:1,mode:'idle',w:rnd()*3,wx:s[0],wy:s[1],z:0,fleeT:0,fdx:1,fdy:0})}}
const CR={bunny:{al:46,sp:20,fs:58,r:30},bird:{al:40,sp:14,fs:56,r:36},deer:{al:78,sp:16,fs:62,r:44},fox:{al:70,sp:22,fs:68,r:40}};
function critUpdate(dt,now){
  for(const c of crits){
    const P=CR[c.t],dx=me.x-c.x,dy=me.y-c.y,dp=Math.hypot(dx,dy);
    let vx=0,vy=0,mode='idle';
    if(dp<P.al){c.fleeT=now+1400;c.fdx=-dx/(dp||1);c.fdy=-dy/(dp||1)}
    if(now<c.fleeT){vx=c.fdx*P.fs;vy=c.fdy*P.fs;mode=c.t==='bird'?'fly':'flee';if(c.t==='bird')c.z=Math.min(16,c.z+50*dt)}
    else{
      if(c.t==='bird'&&c.z>0)c.z=Math.max(0,c.z-30*dt);
      c.w-=dt;if(c.w<=0){c.w=1.5+Math.random()*5;if(Math.hypot(c.x-c.hx,c.y-c.hy)>P.r)(c.wx=c.hx,c.wy=c.hy);else{c.wx=c.hx+rint(-P.r,P.r);c.wy=c.hy+rint(-P.r,P.r)}if(Math.random()<.4){c.wx=c.x;c.wy=c.y}}
      const ex=c.wx-c.x,ey=c.wy-c.y,d=Math.hypot(ex,ey);
      if(d>1.5){vx=ex/d*P.sp;vy=ey/d*P.sp;mode=c.t==='bird'&&c.z>0?'fly':'walk'}
    }
    if(c.t==='fox'&&Math.hypot(c.x-CX,c.y-CY)<485){
      // Existing foxes from earlier sessions can walk out instead of becoming
      // trapped beside the forge or returning to the crater on their patrol.
      const away=Math.atan2(c.y-CY,c.x-CX);
      c.wx=c.hx=c.x+Math.cos(away)*100;
      c.wy=c.hy=c.y+Math.sin(away)*100;
      vx=Math.cos(away)*P.fs;vy=Math.sin(away)*P.fs;mode='flee';
    }
    if(vx||vy){const nx=c.x+vx*dt,ny=c.y+vy*dt;
      if(!inWater(nx,ny)&&nx>EDGE+10&&nx<WW-EDGE-10&&ny>EDGE+10&&ny<WH-EDGE-10){c.x=nx;c.y=ny}else if(now<c.fleeT){c.fdx=-c.fdx;c.fdy=-c.fdy}
      if(Math.abs(vx)>.5)c.face=vx>0?1:-1}
    c.mode=mode;
  }
}
// Defeat presentation is evaluated from dieAt, not a separate particle list.
// This keeps repeated kills and mobile frame rates deterministic and bounded.
const DEFEAT_DUST={
  slime:['#ffd0da','#db7f99'],
  goblin:['#afce84','#587f43'],
  wolf:['#d6dbe3','#8292a6'],
  boar:['#d6b393','#826950'],
  bear:['#c3a77c','#78674f'],
  cave:['#d0ba92','#80745f'],
  abear:['#c5e8f7','#87bad8']
};
function defeatCollapse(age){
  const t=clamp((age-90)/410,0,1);
  return t*t*(3-2*t);
}
function drawDefeatDust(m,x,y,age){
  if(age<90||age>=570)return;
  const t=(age-90)/480,colors=DEFEAT_DUST[m.t]||DEFEAT_DUST.bear;
  for(let i=0;i<5;i++){
    if(t>.67&&i%2)continue;
    const side=i%2?1:-1;
    const px=Math.round(x+(i-2)*2+side*(4+(i%3)*3)*t);
    const py=Math.round(y-3-(i%3)*2-Math.sin(t*Math.PI)*(3+(i%2)*3));
    R(px,py,t<.25?2:1,1,colors[i%2]);
  }
}
function drawMon(m,x,y,now){
  const f=m.face||1,dead=m.state==='dead',mt=MT[m.t];
  if(m.lx===undefined){m.lx=m.x;m.ly=m.y;m.mvT=0}
  if(Math.hypot(m.x-m.lx,m.y-m.ly)>.03)m.mvT=now;m.lx=m.x;m.ly=m.y;
  const moving=now-m.mvT<160,la=now-m.lunge,ha=now-(m.hitAt||-99999);
  let mode='idle',age=0;
  if(dead){age=Math.max(0,now-(m.dieAt??now));mode=age<90?'hit':'dead'}
  else if(ha>=0&&ha<190)mode='hit'; // Confirmed hits interrupt the visual windup, not the actual AI attack timer.
  else if(m.warn)mode='windup';
  else if(m.state==='chase'&&m.cd>mt.iv-.3&&Math.hypot(m.x-me.x,m.y-me.y)<=14)mode='windup';
  else if(la>=0&&la<130)mode='lunge';
  else if(la>=130&&la<300)mode='recover';
  else if(moving)mode='walk';
  const flash=(mode==='hit'&&ha<90)||(dead&&age<90);
  const ph=Math.floor(now/(mode==='walk'?110:230))%4;
  let al=1;if(dead&&age>1000)al=Math.max(0,1-(age-1000)/600);
  if(al<=0)return;
  shadowE(x+1,y,dead?10:8,2,.28*al);
  if(dead)drawDefeatDust(m,x,y,age);
  // Two-pixel sprite-only flinch. Shadow, collision, AI and health bar stay anchored.
  const kick=!dead&&ha>=0&&ha<150?(ha<55?2:ha<105?1:0):0;
  const kickX=Math.round((m.hitPushX||0)*kick),kickY=Math.round((m.hitPushY||0)*kick*.5);
  ctx.save();ctx.globalAlpha=al;ctx.translate(x+kickX,y+kickY);
  if(dead){const fall=defeatCollapse(age);ctx.scale(f*(1+fall*.09),1-fall*.34)}
  else ctx.scale(f,1);
  if(m.t==='slime')sprSlime(mode,ph,age,flash);else if(m.t==='goblin')sprGoblin(mode,ph,age,flash);else if(m.t==='boar')sprBoar(mode,ph,age,flash);else if(m.t==='bear')sprBear(mode,ph,age,flash);else if(m.t==='cave')sprQuad(Q_CAVE,mode,ph,age,flash);else if(m.t==='abear')sprQuad(Q_ABEAR,mode,ph,age,flash);else sprWolf(mode,ph,age,flash);
  // Native-pixel creature finishing pass: fur, eyes, tusks and equipment.
  // Applied after existing animation so movement and combat timing remain intact.
  if(!dead&&!flash){
    const bob=mode==='walk'?(ph%2):0;
    if(m.t==='goblin'){
      R(-5,-15+bob,10,2,'#293a25');R(-3,-18+bob,6,3,'#66513a');
      R(-7,-12+bob,3,2,'#a1b96c');R(5,-12+bob,3,2,'#a1b96c');
      R(-2,-12+bob,1,1,'#e5bc63');R(3,-12+bob,1,1,'#e5bc63');
      R(-5,-7+bob,3,2,'#6d5540');
    }else if(m.t==='slime'){
      R(-4,-10+bob,6,2,'#a9c0a0');R(-3,-11+bob,2,1,'#d3e0c0');
      R(4,-5+bob,3,1,'#5a765b');
    }else if(m.t==='wolf'){
      R(-5,-11+bob,8,2,'#c2c2aa');R(-9,-8+bob,4,2,'#535e55');
      R(8,-9+bob,2,1,'#f1d183');
    }else if(m.t==='boar'){
      R(5,-5+bob,5,2,'#e6d5b3');R(8,-7+bob,2,3,'#f1e2c8');
      R(-7,-9+bob,5,2,'#7d6952');
    }else if(m.t==='bear'||m.t==='abear'){
      R(-5,-10+bob,8,3,'#726955');R(7,-7+bob,2,2,'#e5cfa6');
    }
  }
  ctx.restore();ctx.globalAlpha=1;
  // Name and health bar are drawn in the uncluttered screen-space overlay pass.
}
function rrect(x,y,w,h,c,ol){if(ol){R(x,y-1,w,h+2,ol);R(x-1,y,w+2,h,ol)}R(x+1,y,w-2,h,c);R(x,y+1,w,h-2,c)}
const HAIRS=['#7a4a2a','#d8b45a','#2e2a34','#a8502e','#c8c2c8'];
// Kez V2 is the sole active player and peer art pipeline.
window.addEventListener('myrren-armour-ready',()=>{if(tab)renderModal()});
window.addEventListener('myrren-weapons-ready',()=>{if(tab)renderModal()});
window.addEventListener('myrren-sword-actions-ready',()=>{if(tab)renderModal()});
window.addEventListener('myrren-kez-v2-ready',()=>{if(tab==='gear')renderModal()});
// Kez V2 is the authoritative player and remote-player render path.
// Legacy renderers remain isolated for historical QA, never for live players.
let missingKezLogged=false;
function drawKezV2(x,y,o,now){
  const atlas=window.MyrrenKezV2Atlas;
  if(!atlas?.ready){
    if(!missingKezLogged){console.error('Kez V2 renderer unavailable: check atlas load');missingKezLogged=true}
    return false;
  }
  const gear=window.MyrrenKezV2Equipment;
  const state={...o,now},deathAt=o.isMe?me.deathAt:o.deathAt;
  const deathAge=deathAt==null?-1:now-deathAt;
  const age=now-(o.swingAt??-99999),attacking=age>=0&&age<320;
  const hurtAge=now-(o.isMe?(me.hurtAt??-99999):(o.hurtAt??-99999));
  const holding=o.tool&&o.tool!=='fist'&&(attacking||now<o.hold);
  const direction=o.dv==='u'?'back':o.dv==='s'?'side':'front';
  const facing=o.f<0?-1:1;
  // Weapon in the dominant hand; shield stays on the opposite side.
  // Rear-facing weapons belong behind the base sprite, not across the torso.
  const hx=Math.round(x+(direction==='back'?-8:direction==='side'?facing*6:5));
  // Dominant-hand socket matches gloves at y=-8..-4, below the face.
  const hy=Math.round(y-7);
  const glove=o.g?.[5];
  const handColor=glove&&gear?.colorsFor?.(glove,o.dye)?.[2]||'#edbc94';
  const heldAngle=attacking
    ?(o.tool==='sword'?window.MyrrenKezV2SwordMotion.angle(age):swingAng(age))
    :-.35;
  const paintHeld=()=>{
    if(!holding||deathAge>=0)return;
    drawTool(o.tool,o.mat,hx,hy,facing,heldAngle,.6);
    // Two-pixel fingers cover the sword grip without showing a floating hilt.
    if(direction!=='back')R(hx-1,hy-1,2,2,handColor);
  };
  const paintPunch=()=>{
    if(o.tool!=='fist'||!attacking||deathAge>=0)return;
    const px=direction==='back'?x-4:direction==='side'?x+facing*6:x+4;
    R(Math.round(px)-1,Math.round(y-11),2,2,handColor);
  };
  shadowE(x,y+1,5,2,.28);
  ctx.save();
  if(deathAge>=0){
    // Collapse around the planted feet without moving the game entity.
    const k=Math.min(1,Math.max(0,deathAge/260));
    ctx.translate(Math.round(x),Math.round(y));ctx.rotate(k*1.35);ctx.translate(-Math.round(x),-Math.round(y));
  }
  if(hurtAge>=0&&hurtAge<220)ctx.globalAlpha*=.65;
  if(direction==='back'){paintHeld();paintPunch()}
  gear?.draw(ctx,x,y,state,'under');
  atlas.draw(ctx,x,y,state,now);
  gear?.draw(ctx,x,y,state,'over');
  if(direction!=='back'){paintHeld();paintPunch()}
  ctx.restore();
  if(deathAge>=0)return true;
  label(o.name,x,y-32,o.col||'#ffffff');
  if(o.waving)label('*waves*',x,y-43,'#ffffff');
  return true;
}
function drawPerson(x,y,o,now){
  // Player and peers always use Kez V2. Procedural drawing below is NPC-only.
  if(!o.apron){drawKezV2(x,y,o,now);return;}
  const f=o.f,mv=!!o.moving,ph=Math.floor(now/90)%4,g=o.g||[0,0,0,0,0],dv=o.dv||'d';
  let gh=MATS[g[0]],gb=MATS[g[1]],gl=MATS[g[2]],gt=MATS[g[3]],gs=MATS[g[4]];
  if(o.dye!=null&&DYES[o.dye]){const dp=DYES[o.dye],dz=(m,t)=>(m&&t>=4)?dp:m;gh=dz(gh,g[0]);gb=dz(gb,g[1]);gl=dz(gl,g[2]);gt=dz(gt,g[3]);gs=dz(gs,g[4])}
  const OL='#2a1c18',skin='#f0c49c',skD='#cf9a74',eye='#2a1c18';
  const hurtAge=o.isMe?now-(me.hurtAt||-99999):9999,hurt=hurtAge>=0&&hurtAge<260;
  const hair=o.isMe?'#292631':(o.hair||HAIRS[Math.floor((o.hue||0)/72)%5]),hue=o.hue||0;
  const bob=mv?[0,-1,0,-1][ph]:0,hb=(!mv&&Math.floor(now/520)%2)?1:0,hy0=bob+hb;
  const tn=gb?gb.M:skin,tl=gb?gb.H:'#ffd8b1',td=gb?gb.D:skD;
  const pc=gl?gl.M:'#29242e',pH=gl?gl.H:'#39313e',pD=gl?gl.D:'#1d1923',bc=gt?gt.M:skin,bD=gt?gt.D:skD;
  const sw=mv?[0,1,0,-1][ph]:0,lA=mv&&ph===1?2:0,lB=mv&&ph===3?2:0;
  shadowE(x+1,y,7,2,.3);
  ctx.save();ctx.translate(x-(hurt?f:0),y);ctx.scale(f,1);
  const boots=(lx,ly,len)=>{if(!gt){R(lx,ly+len-2,3,2,skin);R(lx,ly+len-1,3,1,skD);return}R(lx,ly+len-2,3,2,bc);R(lx,ly+len-1,3,1,bD);R(lx,ly+len-2,3,1,gt.H)};
  if(dv==='s'){
    const st=mv?[0,2,0,-2][ph]:0;
    parts([[-2-sw,-12+bob,2,6,tn]],OL);
    parts([[-2-st,-5,3,5-lB,gl?pD:skin]],OL);boots(-2-st,-5,5-lB);
    parts([[-1+st,-5,3,5-lA,gl?pc:skin]],OL);if(gl)R(-1+st,-5,1,3-lA,pH);boots(-1+st,-5,5-lA);
    parts([[-3,-13+bob,6,8,tn]],OL);R(-3,-13+bob,6,2,tl);if(gb)R(-3,-7+bob,6,2,td);
    if(gb){R(-3,-13+bob,6,1,gb.H)}
    if(!gl){R(-3,-6+bob,6,3,'#29242e');R(-3,-6+bob,6,1,'#413846');R(-2,-3+bob,2,1,'#1d1923');R(1,-3+bob,2,1,'#1d1923')}
    if(gb){R(-3,-7+bob,6,2,'#3a2522');R(-1,-7+bob,2,2,'#c0c5c8')}
    if(o.apron){R(-2,-9+bob,6,5,'#f2ead2');R(-2,-9+bob,6,1,'#fff')}
    parts([[-4,-22+hy0,9,9,skin]],OL);R(-4,-14+hy0,9,1,skD);R(5,-18+hy0,1,2,skin);
    if(!gh){
      parts([[-5,-24+hy0,10,5,hair],[-6,-22+hy0,4,7,hair],[-1,-26+hy0,4,3,hair],[3,-24+hy0,3,4,hair]],OL);R(0,-20+hy0,4,2,hair);R(-4,-24+hy0,3,1,'#544858');R(0,-25+hy0,2,1,'#544858');R(-5,-17+hy0,1,3,'rgba(0,0,0,.2)');
    }
    R(2,-17+hy0,1,2,eye);R(4,-16+hy0,1,1,'#b0705c');R(3,-14+hy0,2,1,'#b0705c');
    if(gh)helm(-1,hy0,gh,g[0],true);
    if(gs){parts([[0,-12+bob,5,8,gs.M]],OL);R(0,-12+bob,5,1,gs.H);R(1,-11+bob,1,5,gs.H);R(0,-5+bob,5,1,gs.D)}
  }else{
    const back=dv==='u';
    parts([[-7,-12+bob+sw,3,6,tn],[4,-12+bob-sw,3,6,tn]],OL);
    parts([[-3,-5,3,5-lA,gl?pc:skin],[0,-5,3,5-lB,gl?pc:skin]],OL);if(gl){R(-3,-5,1,3-lA,pH);R(0,-5,1,3-lB,pH)}boots(-3,-5,5-lA);boots(0,-5,5-lB);
    parts([[-4,-13+bob,8,8,tn]],OL);R(-4,-13+bob,8,2,tl);if(gb){R(-4,-7+bob,8,2,td);R(-4,-6+bob,8,1,'#5a3a1c');R(-1,-6+bob,2,1,'#e8c860')}
    if(!gl){R(-4,-6+bob,8,3,'#29242e');R(-4,-6+bob,8,1,'#413846');R(-3,-3+bob,3,1,'#1d1923');R(1,-3+bob,3,1,'#1d1923')}
    if(gb){R(-4,-13+bob,8,1,gb.H);R(-6,-12+bob+sw,2,2,gb.H);R(4,-12+bob-sw,2,2,gb.H)}
    if(gb){R(-3,-12+bob,2,5,'#493027');R(-3,-12+bob,1,4,'#9a7044');R(-4,-7+bob,8,2,'#3a2522');R(-1,-7+bob,2,2,'#c0c5c8')}
    if(!back)R(-1,-13+bob,2,1,skD);
    R(-7,-7+bob+sw,3,2,skin);R(4,-7+bob-sw,3,2,skin);
    if(o.apron&&!back){R(-3,-9+bob,6,5,'#f2ead2');R(-3,-9+bob,6,1,'#fff')}
    if(gs){parts([[-11,-13+bob,6,9,gs.M]],OL);R(-11,-13+bob,6,1,gs.H);R(-10,-12+bob,1,5,gs.H);R(-11,-5+bob,6,1,gs.D);R(-9,-10+bob,2,2,gs.D)}
    parts([[-5,-22+hy0,10,9,back?hair:skin]],OL);
    if(back){R(-5,-14+hy0,10,1,'rgba(0,0,0,.22)');R(-3,-23+hy0,3,1,'#544858');R(-1,-17+hy0,1,3,'rgba(0,0,0,.18)')}
    else{
      R(-5,-14+hy0,10,1,skD);
      if(!gh){parts([[-6,-24+hy0,12,5,hair],[-6,-20+hy0,3,5,hair],[4,-20+hy0,2,5,hair],[-5,-26+hy0,3,3,hair],[-2,-27+hy0,4,4,hair],[2,-26+hy0,3,3,hair]],OL);R(-4,-19+hy0,3,2,hair);R(2,-20+hy0,3,2,hair);R(0,-20+hy0,1,2,hair);R(-4,-25+hy0,3,1,'#514958');R(1,-25+hy0,3,1,'#514958');R(-3,-24+hy0,3,1,'#625467')}
      R(-2,-17+hy0,1,2,eye);R(1,-17+hy0,1,2,eye);R(-1,-14+hy0,2,1,'#b0705c');
    }
    if(back&&!gh){parts([[-6,-24+hy0,12,5,hair],[-5,-26+hy0,3,3,hair],[2,-26+hy0,3,3,hair]],OL);R(-3,-25+hy0,3,1,'#514958')}
    if(gh)helm(0,hy0,gh,g[0],!back);
  }
  const age=now-o.swingAt,swinging=age>=0&&age<320,holding=o.tool&&o.tool!=='fist'&&(swinging||now<o.hold);
  const hxo=dv==='s'?3:5;
  if(o.waving)rrect(hxo,-21+bob,2,3,skin,OL);
  else if(dv==='s'&&!(swinging&&o.tool==='fist')&&!holding){parts([[-1+sw,-12+bob,2,6,tn]],OL);R(-1+sw,-7+bob,2,2,skin)}
  ctx.restore();
  const hx=x+f*hxo,hy=y-8+bob;
  if(o.tool==='fist'&&swinging){const d=Math.round(Math.sin(age/320*Math.PI)*6);ctx.save();ctx.translate(hx+f*d,hy);rrect(-1,-2,3,3,skin,OL);ctx.restore()}
  else if(holding){drawTool(o.tool,o.mat,hx,hy,f,swinging?swingAng(age):-.35);ctx.save();ctx.translate(hx,hy);rrect(-1,-1,3,3,skin,OL);ctx.restore()}
  else if(!o.waving&&dv!=='s'&&0){}
  if(hurt){ctx.globalAlpha=.5;R(x-4,y-22+bob,8,9,'#fff');R(x-4,y-13+bob,8,8,'#fff');ctx.globalAlpha=1}
  label(o.name,x,y-(gh&&g[0]>=3?35:32),o.col||'#ffffff');
  if(o.waving)label('*waves*',x,y-44,'#ffffff');
}
function drawFishFx(cx,cy,now){
  const cf=me.catchFx;
  const hx=Math.round(me.x-cx+me.face*12),hy=Math.round(me.y-cy-22);  if(cf&&now-cf.t<750&&act&&act.kind==='node'){
    const p=(now-cf.t)/750,n=act.ref,tx=n.x-cx,ty=n.y-cy;
    artPx(ITEMS[cf.item].art,Math.round(lerp(tx,hx,p))-4,Math.round(lerp(ty,hy,p)-Math.sin(p*Math.PI)*24)-4,1,ITEMS[cf.item].pal);
    if(p<.25)R(Math.round(tx)-3,Math.round(ty)+1,6,1,'rgba(255,255,255,.8)');
  }
  if(!act||act.kind!=='node'||!act.casted)return;
  const a=act,n=a.ref,tx=Math.round(n.x-cx),ty=Math.round(n.y-cy),age=now-a.cast0;
  if(a.slot==='net'){
    const grow=clamp(age/450,0,1),pull=clamp((a.t-(a.iv-.7))/.7,0,1),r=Math.max(1,Math.round((2+5*grow)*(1-pull*.65)));
    for(let i=0;i<14;i++){const an=i/14*6.283;R(tx+Math.round(Math.cos(an)*r),ty+Math.round(Math.sin(an)*r*.55),1,1,'#efe8cc')}
    R(tx-r+1,ty,r*2-1,1,'rgba(239,232,204,.6)');R(tx,ty-Math.round(r*.5),1,Math.round(r)+1,'rgba(239,232,204,.6)');
    const k=pull>0?1-pull*.4:grow;
    for(let i=0;i<=10;i++){const t=i/10;R(Math.round(lerp(hx,tx,t*k)),Math.round(lerp(hy,ty,t*k)+Math.sin(t*3.1416)*2),1,1,'rgba(239,232,204,.85)')}
    return;
  }
  const fl=clamp(age/450,0,1),bx=lerp(hx,tx,fl),by=lerp(hy,ty,fl)-Math.sin(fl*Math.PI)*18;
  for(let i=0;i<=16;i++){const t=i/16;R(Math.round(lerp(hx,bx,t)),Math.round(lerp(hy,by,t)+Math.sin(t*Math.PI)*(fl<1?2:4)),1,1,'rgba(240,236,220,.9)')}
  let bob=fl<1?0:Math.round(Math.sin(now/260));
  if(a.t>a.iv-.8&&a.t<a.iv-.1)bob+=(Math.floor(now/80)%2)*2;
  const X=Math.round(bx),Y=Math.round(by)+bob;
  R(X-1,Y-2,3,1,'#e83a2a');R(X-1,Y-1,3,1,'#f4f4f4');R(X,Y,1,1,'#2a2a2a');
  if(fl>=1){const ph=Math.floor(now/300)%3;R(tx-2-ph,ty+1,4+ph*2,1,'rgba(255,255,255,.35)')}
}
function helm(ox,hy0,gh,tier,face){
  parts([[ox-5,-24+hy0,10,6,gh.M]],'#2a1c18');
  R(ox-5,-19+hy0,10,2,gh.H);R(ox-5,-17+hy0,10,1,gh.D);R(ox-4,-24+hy0,4,1,gh.H);
  if(tier>=2)for(let i=-4;i<=3;i+=3)R(ox+i,-19+hy0,1,1,gh.D);
  if(face){R(ox-5,-17+hy0,1,3,gh.M);R(ox+4,-17+hy0,1,3,gh.M)}
  if(tier>=3){parts([[ox-1,-27+hy0,2,3,'#e8b838']],'#2a1c18')}
}
function artPx(key,x,y,sz,pal2){const a=ART[key],pal=Object.assign({},a.p,pal2||{});for(let j=0;j<8;j++)for(let i=0;i<8;i++){const c=a.m[j][i];if(c!=='.'&&pal[c])R(x+i*sz,y+j*sz,sz,sz,pal[c])}}
const matPal=m=>({M:MATS[m].M,H:MATS[m].H,D:MATS[m].D,S:MATS[m].H});
function shelfSpecs(id){
  const g=(kind,m)=>({key:KINDS[kind].art,pal:matPal(m)});
  if(id==='axe')return [{key:'log'},{key:'log',pal:ITEMS.oak.pal},{key:'log'},{key:'log'},{key:'log'},{key:'log'}];
  if(id==='pick')return [g('pick',2),g('pick',3),g('pick',4),{key:'ore',pal:ITEMS.copper.pal},{key:'ore',pal:ITEMS.iron.pal},{key:'ore',pal:ITEMS.copper.pal}];
  if(id==='fish')return [g('net',1),g('net',3),g('net',4),{key:'fish',pal:ITEMS.rshrimp.pal},{key:'fish',pal:ITEMS.rtrout.pal},{key:'fish',pal:ITEMS.rsalmon.pal}];
  if(id==='food')return [{key:'bread'},{key:'pie'},{key:'bowl'},{key:'bread'},{key:'pie'},{key:'bowl'}];
  return [g('axe',2),g('axe',4),g('sword',2),g('helm',3),g('body',3),g('boots',4)];
}
function leaf(x,y,s,fl){
  const m=(a,w)=>s>0?x+a:x-a-w;
  R(m(1,8),y-2+fl,8,4,'#4a8a3a');R(m(3,3),y-4+fl,3,2,'#4a8a3a');R(m(7,3),y-3+fl,3,2,'#4a8a3a');R(m(4,3),y+2+fl,3,2,'#4a8a3a');R(m(8,2),y+1+fl,2,2,'#4a8a3a');
  R(m(2,3),y-2+fl,3,1,'#7ab648');R(m(1,8),y+fl,8,1,'#2a5a22');
}
function drawGlider(p,x,y,now){
  const f=p.face;
  if(p.moving){
    const bob=Math.round(Math.sin(now/170+p.ph)*1.5),fl=Math.round(Math.sin(now/110+p.ph)),gy=y-9+bob;
    R(x-4,y-1,8,2,'rgba(0,0,0,.2)');
    leaf(x-2,gy,-1,fl);leaf(x+2,gy,1,fl);
    R(f>0?x-8:x+3,gy-2,5,5,'#c28a52');R(f>0?x-9:x+7,gy,2,3,'#e0b078');
    R(x-3,gy-3,6,6,'#a8743c');R(x-2,gy-1,4,3,'#f0dcb0');
    R(f>0?x+1:x-5,gy-6,4,4,'#a8743c');R(f>0?x+2:x-4,gy-8,1,2,'#8a5a30');R(f>0?x+1:x-2,gy-8,1,2,'#8a5a30');R(f>0?x+3:x-4,gy-5,1,1,'#101010');
  }else{
    const hop=p.scamper?-Math.abs(Math.round(Math.sin(now/70)*2)):0,gy=y+hop,fk=Math.round(Math.sin(now/400+p.ph));
    R(x-4,y-1,8,2,'rgba(0,0,0,.22)');
    R(f>0?x-7+fk:x+3-fk,gy-9,4,8,'#c28a52');R(f>0?x-6+fk:x+3-fk,gy-11,3,3,'#e0b078');
    R(x-3,gy-6,6,6,'#a8743c');R(x-2,gy-4,4,3,'#f0dcb0');
    R(x-5,gy-5,2,4,'#4a8a3a');R(x+3,gy-5,2,4,'#4a8a3a');R(x-5,gy-5,1,2,'#7ab648');R(x+4,gy-5,1,2,'#7ab648');
    R(f>0?x+1:x-5,gy-9,4,4,'#a8743c');R(f>0?x+2:x-4,gy-11,1,2,'#8a5a30');R(f>0?x+1:x-2,gy-11,1,2,'#8a5a30');R(f>0?x+3:x-4,gy-8,1,1,'#101010');
    if(p.scamper){const k=Math.floor(now/80)%2;R(x-3,gy,2,1+k,'#6a4a2a');R(x+1,gy,2,2-k,'#6a4a2a')}
  }
}
function drawTerrapin(p,x,y,now){
  const f=p.face,t=now/1000+p.ph;
  const idle=!p.moving,hb=idle?Math.round(Math.sin(now/650+p.ph)):0,blink=idle&&(t%3.4)<.16,wob=idle&&(t%5)<.35?Math.round(Math.sin(now/60)):0;
  R(x-9,y-1,18,2,'rgba(0,0,0,.25)');
  if(p.moving){const sh=Math.floor(now/110)%2;ctx.globalAlpha=.65;R(x-8+sh,y,16,1,'#8cc0f4');R(x-5-sh,y+1,10,1,'#cfe8ff');ctx.globalAlpha=1}
  R(x-6+wob,y-10,12,2,'#2a4a2a');R(x-8+wob,y-8,16,4,'#2a4a2a');
  R(x-5+wob,y-9,10,1,'#4a7a3a');R(x-7+wob,y-7,14,2,'#4a7a3a');
  R(x-4+wob,y-9,3,1,'#7ab04a');R(x+1+wob,y-7,4,1,'#7ab04a');R(x-6+wob,y-6,3,1,'#7ab04a');
  R(x-1+wob,y-9,1,4,'#2a4a2a');R(x+wob+(f>0?3:-4),y-9,1,4,'#2a4a2a');
  R(x-8,y-4,16,2,'#8a8e96');R(x-8,y-4,16,1,'#b4b8c0');R(x-7,y-2,14,1,'#5a5e66');
  const hx=f>0?x+8:x-11;
  R(hx,y-8+hb,4,4,'#7a9a5a');R(hx+(f>0?3:0),y-7+hb,1,2,'#5a7a4a');
  R(hx+(f>0?2:1),y-7+hb,1,1,blink?'#4a7a3a':'#101010');
  if(idle){R(x-6,y-1,2,1,'#5a7a4a');R(x+4,y-1,2,1,'#5a7a4a');const bp=(t%2.6);if(bp<1.2){ctx.globalAlpha=1-bp/1.2;R(hx+(f>0?3:0),y-12-Math.round(bp*8),2,2,'#cfe8ff');ctx.globalAlpha=1}}
}
function drawMole(p,x,y,now){
  for(const t of p.trail){
    const a=1-(now-t.t)/1300;if(a<=0)continue;
    const tx=Math.round(x+(t.x-p.x)),ty=Math.round(y+(t.y-p.y));
    ctx.globalAlpha=Math.min(1,a*1.3);R(tx-4,ty-1,8,2,'#6a4a2a');R(tx-3,ty-2,6,1,'#8a6a42');R(tx-2,ty,4,1,'#4a2f18');ctx.globalAlpha=1;
  }
  const f=p.face;
  if(p.moving){
    const wob=Math.round(Math.sin(now/90));
    R(x-6,y-1,12,2,'rgba(0,0,0,.2)');
    R(x-5,y-3+wob,10,3,'#6a4a2a');R(x-4,y-5+wob,8,2,'#7a5a3a');R(x-2,y-6+wob,4,1,'#8a6a42');R(x-4,y-3+wob,2,1,'#4a2f18');
    R(x-1,y-9+wob,2,3,'#6ad8d8');if(Math.floor(now/150)%3===0)R(x,y-9+wob,1,1,'#ffffff');
  }else{
    const ph=(now/1000+p.ph)%4.4;
    let h=0;
    if(ph>=1.2&&ph<1.7)h=(ph-1.2)/.5;else if(ph>=1.7&&ph<3.6)h=1;else if(ph>=3.6&&ph<4.1)h=1-(ph-3.6)/.5;
    const jig=ph<1.2?Math.round(Math.sin(now/70)):0;
    R(x-8,y-1,16,2,'#4a2f18');R(x-9,y-3,18,2,'#6a4a2a');R(x-7,y-4,14,1,'#7a5a3a');R(x-6,y-3,12,3,'#1a100a');
    if(jig)R(x-7,y-5,2,1,'#8a6a42');
    const hh=Math.round(7*h);
    if(hh>0){
      const look=Math.floor(now/900)%2?1:-1,top=y-3-hh;
      R(x-4,top,8,hh+1,'#7a6a80');R(x-3,top-1,6,1,'#7a6a80');R(x-4,top,8,1,'#9a8aa0');
      if(hh>=4){
        R(x-3+(look>0?1:0),top+2,1,1,(now%2400)<130?'#7a6a80':'#101010');R(x+2-(look<0?1:0),top+2,1,1,(now%2400)<130?'#7a6a80':'#101010');
        R(x-1+look,top+3,3,2,'#e8a0a0');
      }
      R(x-8,y-5,2,2,'#6ad8d8');R(x+6,y-5,2,2,'#6ad8d8');R(x-7,y-6,1,1,'#ffffff');
    }
  }
}
/* Living Anvil: native pixel-art follower; idle glow, alternating steel feet, rare forge sparks. */
function drawLivingAnvil(p,x,y,now){
  const reacting=(p.forgeReactUntil||0)>now;
  const walking=p.moving&&!reacting;
  const step=walking?Math.floor(now/135)%2:0;
  const bob=walking?(step?1:0):Math.round(Math.sin(now/340+p.ph)*.7);
  const cy=y-5+bob;
  const glow=reacting?'#fff6bc':Math.floor(now/220)%4===0?'#fff1a3':'#ff9d38';
  // Feet and shadow (each leg alternates when following).
  R(x-8,y-1,16,2,'rgba(0,0,0,.22)');
  R(x-6,y-5+(walking?step:0),5,4,'#27232e');
  R(x+2,y-5+(walking?1-step:0),5,4,'#27232e');
  R(x-6,y-3+(walking?step:0),5,2,'#c96b30');
  R(x+2,y-3+(walking?1-step:0),5,2,'#c96b30');
  // Face housing and orange eyes.
  R(x-5,cy-3,10,6,'#171a24');R(x-4,cy-2,8,4,'#42424d');
  R(x-3,cy,2,2,glow);R(x+2,cy,2,2,glow);
  // Broad anvil silhouette: horn to the left, heel to the right.
  R(x-10,cy-12,19,4,'#171923');
  R(x-11,cy-11,20,2,'#656573');
  R(x-9,cy-13,16,2,'#a3a3ad');
  R(x-11,cy-10,5,2,'#34333e');
  R(x+7,cy-11,4,3,'#555361');
  R(x-6,cy-8,13,6,'#242631');
  R(x-5,cy-8,11,2,'#646370');
  R(x-4,cy-6,9,3,'#3c3b47');
  // Forged rune and seams brighten and dim with idle breathing.
  R(x,cy-6,2,1,glow);R(x-1,cy-5,1,1,'#ed742b');R(x+2,cy-5,1,1,'#ed742b');
  R(x-5,cy-3,2,1,'#b65b2d');R(x+4,cy-3,2,1,'#b65b2d');
  // React immediately to a successful craft while the +3% bonus is active.
  if(reacting){
    R(x-8,cy-9,2,2,'#ffb74c');R(x+8,cy-8,2,2,'#ffb74c');
    R(x-2,cy-14,4,2,'#ffe3a0');
    if(Math.floor(now/95)%2===0){R(x-6,cy-17,1,2,'#ffeb8b');R(x+5,cy-19,1,2,'#ff8c36')}
    if(p.forgeBonusXp>0)label('+'+p.forgeBonusXp+' XP',x,cy-24,'#ffe49a');
  }
  // A brief spark burst every few seconds; never affects gameplay.
  const spark=(now+Math.floor(p.ph*1000))%4200;
  if(spark<460){
    const rise=Math.floor(spark/85);
    R(x+2,cy-14-rise,1,2,'#ffd46a');
    if(spark<300)R(x-5,cy-13-Math.floor(spark/100),1,1,'#ff8c37');
    if(spark<180)R(x+6,cy-15,1,1,'#fff1b2');
  }
}
function drawPet(p,x,y,now){
  if(p.sk==='woodcutting')drawGlider(p,x,y,now);
  else if(p.sk==='fishing')drawTerrapin(p,x,y,now);
  else if(p.sk==='forging')drawLivingAnvil(p,x,y,now);
  else drawMole(p,x,y,now);
}
function drawLamp(x,y,now){
  const native=window.MyrrenCampProps?.draw(ctx,'lantern',x,y,now);
  if(!native)MyrrenEnvironment.prop(ctx,'lamp',x,y,null,null,now);
  const sway=Math.round(Math.sin(now/900+x*.13)*2),flicker=Math.sin(now/180+x);
  ctx.save();ctx.globalAlpha=.13+flicker*.025;ctx.fillStyle='#ffd181';
  ctx.beginPath();ctx.arc(x+sway,y-16,19,0,Math.PI*2);ctx.fill();ctx.restore();
  if(!native){R(x+sway-3,y-19,7,8,'#e6ad56');R(x+sway-1,y-17,3,5,'#ffe6a0')}
}
function drawBankChest(x,y){
  if(window.MyrrenCampProps?.draw(ctx,'bank_chest',x,y)){
    if(Math.hypot(me.x-SPOTS.bank.x,me.y-SPOTS.bank.y)<70)label('Storage Chest',x,y-40,'#e8d9ae');
    return;
  }
  // Hand-worn survivor's trunk: layered oak lid, riveted iron bands and brass lock.
  // Preserve the existing bank interaction and proximity label.
  R(x-20,y-3,40,5,'#252522');
  R(x-18,y-20,36,18,'#302b25');R(x-16,y-18,32,14,'#705139');
  for(let i=0;i<4;i++)R(x-14+i*9,y-17,1,12,'#8e6745');
  R(x-20,y-24,40,9,'#2c2a26');R(x-18,y-25,36,8,'#715238');
  R(x-16,y-27,32,4,'#9d7650');R(x-14,y-26,28,2,'#bb9060');
  R(x-18,y-19,36,3,'#3c322a');
  for(const dx of [-13,12]){
    R(x+dx-2,y-25,4,21,'#434641');R(x+dx-1,y-23,2,16,'#8b8b77');
    R(x+dx-1,y-23,1,1,'#d1c5a1');R(x+dx-1,y-7,1,1,'#d1c5a1');
  }
  R(x-6,y-18,12,11,'#322f2b');R(x-5,y-17,10,9,'#ab8554');
  R(x-3,y-15,6,5,'#3b352b');R(x-1,y-14,2,3,'#e6c477');
  R(x-16,y-4,6,3,'#292a27');R(x+10,y-4,6,3,'#292a27');
  if(Math.hypot(me.x-SPOTS.bank.x,me.y-SPOTS.bank.y)<70)label('Storage Chest',x,y-33,'#e8d9ae');
}
function drawSupply(x,y){
  drawCrate(x-6,y);drawCrate(x+7,y);drawCrate(x,y-11);
  R(x-5,y-26,10,5,OUT);R(x-4,y-25,8,3,'#d8c890');R(x-2,y-24,4,1,'#6a5a3a');
  if(Math.hypot(me.x-SPOTS.crate.x,me.y-SPOTS.crate.y)<64)label('Supply Crate',x,y-30,'#ffffff');
}
function drawBoard(x,y,now){
  if(window.MyrrenCampProps?.draw(ctx,'jobs_board',x,y,now)){
    if(save.jobs.some(j=>j.done))R(x+19,y-26,3,4,'#f3d477');
    if(Math.hypot(me.x-BOARD.x,me.y-BOARD.y)<65)label('Community Board',x,y-58,'#e4dfc3');
    return;
  }
  // Low weathered community board with three separate pinned parchment notices.
  R(x-22,y-5,5,13,'#382c25');R(x+17,y-5,5,13,'#382c25');
  R(x-25,y-34,50,30,'#292923');R(x-23,y-31,46,25,'#795638');
  R(x-20,y-28,40,19,'#b49a70');
  R(x-29,y-36,58,6,'#343b37');R(x-26,y-40,52,5,'#53615b');
  R(x-19,y-43,38,4,'#78857b');R(x-22,y-31,44,2,'#a78258');
  for(let i=0;i<3;i++){
    const px=x-17+i*13,py=y-25+(i%2)*2;
    R(px+1,py+2,11,13,'#69533b');
    R(px,py,11,13,i===1?'#ead8b1':'#d8c49d');
    R(px+1,py+1,9,1,'#f4e5c2');
    R(px+2,py+4,7,1,'#806b51');R(px+2,py+7,6,1,'#927b5c');
    R(px+2,py+10,5,1,'#927b5c');
    R(px+5,py+1,2,2,'#ab6845');
  }
  R(x-25,y-5,50,3,'#3c3229');
  if(save.jobs.some(j=>j.done))R(x+19,y-26,3,4,'#f3d477');
  if(Math.hypot(me.x-BOARD.x,me.y-BOARD.y)<65)label('Community Board',x,y-49,'#e4dfc3');
}
function drawWell(x,y){MyrrenEnvironment.prop(ctx,'well',x,y)}
function drawStall(x,y,col){MyrrenEnvironment.prop(ctx,'stall',x,y,col)}
function drawBarrel(x,y){MyrrenEnvironment.prop(ctx,'barrel',x,y)}
function drawCrate(x,y){MyrrenEnvironment.prop(ctx,'crate',x,y)}
function drawHay(x,y){MyrrenEnvironment.prop(ctx,'hay',x,y)}
function drawPot(x,y){MyrrenEnvironment.prop(ctx,'pot',x,y)}
function drawFbox(x,y){MyrrenEnvironment.prop(ctx,'fbox',x,y)}
function drawSack(x,y){MyrrenEnvironment.prop(ctx,'sack',x,y)}
function drawFence(x,y,len,dir){MyrrenEnvironment.prop(ctx,'fence',x,y,len,dir)}
function drawProvisions(x,y){
  // Small orderly emergency supply cache, deliberately sparse.
  R(x-27,y-3,57,5,'#4b3a2c');R(x-23,y-7,48,4,'#9b7954');
  for(const bx of [x-19,x+4]){
    R(bx-8,y-22,22,15,'#3f352b');R(bx-6,y-20,18,12,'#96734c');
    R(bx-6,y-17,18,2,'#c49b67');R(bx-2,y-21,3,14,'#66523b');
  }
  R(x-15,y-28,16,7,'#526c4b');R(x-13,y-31,12,4,'#8ea16a');
  R(x+12,y-28,13,7,'#a16b3f');R(x+15,y-31,7,4,'#e1b66a');
  R(x+24,y-17,10,13,'#7d6446');R(x+26,y-20,6,5,'#b6a078');
}
function drawDecor(kind,x,y,a,b,now){
  if(kind==='supply')drawSupply(x,y);else if(kind==='board')drawBoard(x,y,now);else if(kind==='well')drawWell(x,y);else if(kind==='stall')drawStall(x,y,a);else if(kind==='barrel')drawBarrel(x,y);else if(kind==='crate')drawCrate(x,y);
  else if(kind==='hay')drawHay(x,y);else if(kind==='pot')drawPot(x,y);else if(kind==='fbox')drawFbox(x,y);else if(kind==='sack')drawSack(x,y);else if(kind==='fence')drawFence(x,y,a,b);else if(kind==='bush')drawBush(x,y,a);else if(kind==='provisions')drawProvisions(x,y);
  if(kind==='stall'&&a==='#3a7a9a'&&Math.hypot(me.x-SPOTS.odd.x,me.y-SPOTS.odd.y)<64)label('Odd Shop',x,y-34,'#ffffff');
}
// Fishing ripples are read-only pixel feedback. Taps continue to identify
// the fishing spot and its skill requirement, never to cast automatically.
function drawSpot(n,x,y,now){
  MyrrenEnvironment.fishing(ctx,n,x,y,now);
  const cast=now-(n.fishCastAt??-99999);
  if(cast>=0&&cast<380){
    const d=Math.floor(cast/95);
    R(x-3-d,y-1,3,1,'#c6e8f4');R(x+1+d,y-1,3,1,'#c6e8f4');
  }
  const age=now-(n.fishHitAt??-99999);
  if(age>=0&&age<440){
    const p=age/440,col=n.fishSucceeded?'#f4f8d9':'#86bed6';
    for(let i=0;i<(n.fishSucceeded?4:2);i++){
      const dx=(i%2?1:-1)*(2+Math.round(5*p)+i);
      const dy=Math.round(-2-Math.sin(Math.PI*p)*(2+i%2));
      R(x+dx,y+dy,2,1,col);
    }
  }
}
const SLATE=['#7a7874','#8c8a86','#9a9894','#b4b2ac'],SLATE_D=['#55535a','#66646c','#767480','#8e8c98'],SLATE_B=['#5e7488','#6e869a','#7e96aa','#a0b8c8'],TERRA=['#9a5a40','#ac6a4c','#bc7a58','#d4986e'];
function slateRoof(x,top,w,H,tone,seed,moss){
  const x0=x-(w>>1),rn=Math.ceil(H/4);
  R(x0-1,top-1,w+2,H+2,'#3a2c24');
  for(let r=0;r<rn;r++){
    const ry=top+H-(r+1)*4,off=(r&1)?4:0;
    for(let sx=-8+off;sx<w;sx+=8){
      const a=Math.max(0,sx),b2=Math.min(w,sx+8);if(b2<=a)continue;
      const hs=H2(seed+r*13,sx+17)%100,c=hs<30?tone[0]:hs<70?tone[1]:tone[2];
      const yy=Math.max(ry,top),hh=ry<top?4-(top-ry):4;
      R(x0+a,yy,b2-a,hh,c);R(x0+a,yy,b2-a,1,tone[3]);R(x0+a,yy+hh-1,b2-a,1,'#4a3a30');R(x0+a,yy,1,hh,'#4a3a30');
      if(hs%9===0)R(x0+a+2,yy+1,2,1,'#b9733c');
      if(moss&&hs%7===0)R(x0+a+1,yy,3,1,moss);
    }
  }
  R(x0-1,top-1,w+2,3,'#3a2c24');R(x0,top,w,1,tone[3]);
}
function plank(x0,y0,w,h,base,line,hi){R(x0,y0,w,h,base);for(let i=3;i<w;i+=4)R(x0+i,y0,1,h,line);R(x0,y0,w,1,hi)}
function brick(x0,y0,w,h,base,mortar,hi){R(x0,y0,w,h,base);for(let r=0;r*4<h;r++){R(x0,y0+r*4+3,w,1,mortar);for(let c=(r&1)?3:0;c<w;c+=7)R(x0+c,y0+r*4,1,4,mortar)}R(x0,y0,w,1,hi)}
function bDoor(x,y,c1,c2){R(x-8,y-17,16,17,'#3a2818');R(x-7,y-16,14,16,c1);R(x-7,y-16,14,2,c2);for(let k=-4;k<=4;k+=3)R(x+k,y-14,1,14,'#6a4422');R(x+3,y-8,2,2,'#e0c070');R(x-8,y-17,1,17,'#c89a5c');R(x+7,y-17,1,17,'#c89a5c')}
function bWin(x,y){R(x-1,y-1,9,9,'#5a3e22');R(x,y,7,7,'#3e5668');R(x,y,7,1,'#6a8aa0');R(x+3,y,1,7,'#a07a50');R(x,y+3,7,1,'#a07a50');R(x+1,y+1,1,1,'#bcd6e4')}
function logPile(x,y){for(let r=0;r<3;r++)for(let c=0;c<(r===2?2:3);c++){const lx=x+c*6+(r===2?3:0),ly=y-r*4-4;R(lx,ly,6,4,OUT);R(lx+1,ly+1,4,2,'#c89a5c');R(lx,ly+1,2,2,'#e4c488');R(lx+1,ly+2,1,1,'#8a6a3a')}}
function smoke(x,y,now,col){const t=now/800;for(let i=0;i<3;i++){const k=(t+i*.33)%1;ctx.globalAlpha=.5*(1-k);R(x+Math.round(Math.sin(t*3+i)*2),y-Math.round(k*16),4,4,col||'#e8e4dc');ctx.globalAlpha=1}}
function flagAt(x,y,col,now){const f=Math.floor(now/250)%2;R(x,y-9,1,10,'#3a2410');R(x+1,y-9,5+f,3,col);R(x+1,y-6,3+f,1,col)}
// Ancient village-side trees are scenery only: no resource or collision changes.
const VILLAGE_GROVE=[[-610,-480],[610,-480],[-610,480],[610,480],[-460,-610],[460,-610]].map(([dx,dy])=>({x:CX+dx,y:CY+dy,k:'ancient',back:0}));
function drawWoodlandShrub(x,y,seed){MyrrenEnvironment.fern(ctx,x,y,seed)}
// Decorative brook, falls and timber footbridge, placed east of the town services.
// Water is scenery in this pass; no new impassable collision or save-coordinate changes.
function drawVillageFalls(cx,cy,now){for(const bridge of VILLAGE.bridges)MyrrenEnvironment.bridge(ctx,Math.round(bridge.x-cx),Math.round(bridge.y-cy))}
// Woodland architecture additions: silhouettes are tailored to each service.
function drawVillageArchitecture(b,x,y,now){/* Architecture is composed once in the environment atlas. */}
function drawVillageSquare(cx,cy,now){/* Centre kept clear for foot traffic and gatherings. */}
function drawBuilding(b,x,y,now){MyrrenEnvironment.building(ctx,b,x,y,now)}
// Low, improvised stalls keep the original shop triggers without a row of houses.
function drawTraderCart(x,y,now){
  // Gus's canvas-covered travelling market wagon, with sacks and produce.
  const bob=Math.round(Math.sin(now/950)*.7);
  R(x-15,y-7,55,8,'#332b27');R(x-12,y-26,51,20,'#825432');
  R(x-10,y-24,47,5,'#c18a51');R(x-9,y-14,44,3,'#4f382b');
  R(x-15,y-38,55,13,'#3b332c');R(x-12,y-42,49,8,'#e2bd83');
  for(let i=0;i<5;i++)R(x-10+i*10,y-41,5,11,'#b67f51');
  R(x-12,y-44,49,3,'#f3d49c');
  R(x-6,y-35,15,10,'#657d47');R(x+10,y-35,12,10,'#b97b42');
  R(x+24,y-36,10,12,'#a58b62');R(x+26,y-39,6,4,'#dfc79a');
  R(x-5,y-34,5,4,'#b7c16d');R(x+14,y-32,5,4,'#d8a15b');
  for(const wx of [x-4,x+31]){
    R(wx-9,y-11,18,17,'#292929');R(wx-7,y-9,14,13,'#aa7948');
    R(wx-4,y-6,8,7,'#40382f');R(wx-2,y-4,4,3,'#d6b67b');
  }
  // Chestnut draught horse, cream mane, harness and white socks.
  R(x+43,y-28+bob,28,19,'#392b28');R(x+45,y-26+bob,25,15,'#b7794c');
  R(x+63,y-36+bob,11,17,'#9b613f');R(x+68,y-39+bob,11,12,'#b7794c');
  R(x+70,y-42+bob,5,6,'#e6c18b');R(x+76,y-42+bob,4,7,'#a06d4b');
  R(x+76,y-30+bob,6,5,'#dfb789');R(x+76,y-36+bob,2,2,'#242526');
  R(x+65,y-36+bob,4,11,'#f0d29d');R(x+61,y-32+bob,4,9,'#e1bf87');
  R(x+49,y-12,5,18,'#815137');R(x+64,y-12,5,18,'#815137');
  R(x+48,y+1,7,5,'#e7d4ae');R(x+63,y+1,7,5,'#e7d4ae');
  R(x+47,y+5,9,3,'#332f2d');R(x+62,y+5,9,3,'#332f2d');
  R(x+44,y-25,5,11,'#4e443a');R(x+39,y-19,11,2,'#d8b889');
  R(x+67,y-28+bob,3,9,'#46665c');
  // Trader Gus lounges on a travel crate with one leg crossed over the other.
  const rx=x-35,ry=y-9+Math.round(Math.sin(now/1000)*.5);
  R(rx-13,ry-2,27,13,'#503829');R(rx-10,ry-5,21,7,'#a5774b');
  R(rx-11,ry+3,23,3,'#d0a16a');
  // Seated body, rolled sleeves and blue denim bib.
  R(rx-10,ry-25,20,16,'#e4c59d');
  R(rx-13,ry-22,5,13,'#e4c59d');R(rx+9,ry-22,5,11,'#e4c59d');
  R(rx-9,ry-20,18,12,'#416c85');R(rx-5,ry-24,10,8,'#416c85');
  R(rx-9,ry-23,3,11,'#31546d');R(rx+6,ry-23,3,11,'#31546d');
  R(rx-3,ry-15,6,2,'#a5b9b4');
  // One thigh rests horizontally across the other knee, boots visible.
  R(rx-7,ry-9,14,6,'#35586f');R(rx+3,ry-8,13,5,'#35586f');
  R(rx+13,ry-7,8,5,'#45352e');
  R(rx-6,ry-5,6,8,'#35586f');R(rx-7,ry+1,9,4,'#45352e');
  // Face, straw hat and a stalk of straw between his teeth.
  R(rx-7,ry-35,14,13,'#c98f65');R(rx-8,ry-36,16,5,'#654331');
  R(rx-5,ry-29,2,2,'#2d2928');R(rx+3,ry-29,2,2,'#2d2928');
  R(rx-15,ry-39,30,5,'#9c713c');R(rx-13,ry-42,26,4,'#e1b96c');
  R(rx-9,ry-49,18,8,'#d5ae64');R(rx-7,ry-51,14,3,'#f0d38b');
  R(rx-9,ry-42,18,2,'#76543a');
  R(rx+5,ry-25,10,1,'#e9cb75');R(rx+13,ry-27,2,3,'#b99c50');
  if(Math.hypot(me.x-TRADER.x,me.y-TRADER.y)<75)label('Trader Gus · Starter Gear',x,y-63,'#e9d5a1');
}
function drawCampPitch(b,x,y,now){
  R(x-27,y-4,54,5,'#443b2e');R(x-23,y-13,46,10,'#826c4e');
  R(x-25,y-29,3,25,'#66513a');R(x+22,y-29,3,25,'#66513a');
  R(x-29,y-34,58,6,'#4b5d4e');R(x-25,y-39,50,6,'#788069');
  R(x-20,y-43,40,5,'#9b9573');
  R(x-18,y-16,36,4,'#b19870');R(x-13,y-12,26,3,'#65513b');
  const icon=b.id==='pick'?'#9da7a0':b.id==='food'?'#b77b48':'#6c99a1';
  R(x-6,y-23,12,6,icon);R(x-3,y-26,6,3,'#d4c29b');
}


function drawInterior(cx,cy,now){
  const S=SHOPS[inside.id],X=v=>Math.round(v-cx),Y=v=>Math.round(v-cy);
  R(X(-6),Y(-6),RX+12,RY+12,'#282a30');
  R(X(0),Y(0),RX,44,'#7f806b');
  for(let r=0;r<4;r++)for(let c=-1;c<12;c++){const bx=c*16+((r&1)?8:0);R(X(bx),Y(r*11+10),15,1,'rgba(0,0,0,.14)');R(X(bx+15),Y(r*11),1,11,'rgba(0,0,0,.1)')}
  R(X(0),Y(0),RX,5,'rgba(0,0,0,.25)');R(X(0),Y(42),RX,3,'#463d37');
  for(let y=45,r=0;y<RY;y+=8,r++){const h=Math.min(8,RY-y);R(X(0),Y(y),RX,h,(r&1)?'#79634c':'#816b51');R(X(0),Y(y),RX,1,'#574a3d');for(let x=((r*37)%44);x<RX;x+=44)R(X(x),Y(y),1,h,'#574a3d')}
  R(X(0),Y(0),3,RY,'rgba(0,0,0,.3)');R(X(RX-3),Y(0),3,RY,'rgba(0,0,0,.3)');
  R(X(76),Y(114),24,14,'#3d514b');R(X(78),Y(116),20,10,'#557568');R(X(80),Y(118),16,1,'#a4aa7d');
  R(X(78),Y(RY-1),20,7,'#ffe9a8');
  R(X(50),Y(1),76,11,'#302f32');R(X(51),Y(2),74,9,'#64523f');label(S.name,X(88),Y(10),'#ffe14a');
  R(X(30),Y(24),116,3,'#463d37');R(X(30),Y(27),116,1,'rgba(0,0,0,.3)');
  shelfSpecs(inside.id).forEach((it,i)=>artPx(it.key,X(36+i*18),Y(8),2,it.pal));
  if(inside.id==='axe'){for(let i=0;i<3;i++){R(X(6+i*8),Y(34),8,8,'#463d37');R(X(7+i*8),Y(35),6,6,'#9a6a38');R(X(9+i*8),Y(37),2,2,'#463d37')}R(X(10),Y(27),8,8,'#463d37');R(X(11),Y(28),6,6,'#9a6a38')}
  else if(inside.id==='pick'){R(X(5),Y(32),24,10,'#4b5560');R(X(7),Y(29),20,4,'#7c8a93');R(X(8),Y(25),4,4,'#e0803a');R(X(16),Y(26),4,3,'#8c4a2a');R(X(9),Y(42),5,3,'#222');R(X(21),Y(42),5,3,'#222')}
  else if(inside.id==='food'){const f=Math.floor(now/140)%3;R(X(3),Y(12),28,32,'#6a5a4a');R(X(3),Y(12),28,3,'#8a7a68');R(X(8),Y(24),18,16,'#2a1810');R(X(11),Y(31-f),12,9+f,'#ff7b3a');R(X(14),Y(28-f),6,8+f,'#ffd24a')}
  else if(inside.id==='fish'){R(X(4),Y(10),26,34,'#5a4a30');R(X(5),Y(11),24,32,'#c8b888');for(let i=0;i<8;i++)for(let j=0;j<8;j++)if((i+j)&1)R(X(6+i*3),Y(12+j*4),2,3,'#8a7a58');R(X(5),Y(11),24,2,'#64523f');for(let i=0;i<4;i++)R(X(8+i*6),Y(40),3,3,'#e8e0d0')}
  else{
    const flame=Math.floor(now/160)%3;
    R(X(5),Y(14),29,31,'#49372b');R(X(8),Y(19),23,23,'#28211c');
    R(X(11),Y(26),17,15,'#9c3f1e');R(X(13),Y(29-flame),13,12+flame,'#f58230');
    R(X(17),Y(31-flame),6,10+flame,'#ffcf55');
    R(X(42),Y(33),24,6,'#343c47');R(X(47),Y(27),15,6,'#8797a4');
    R(X(50),Y(39),8,8,'#525d68');R(X(44),Y(46),20,3,'#33343a');
  }
  R(X(148),Y(26),20,18,'#302f32');R(X(149),Y(27),18,16,'#725c45');R(X(149),Y(31),18,2,'#302f32');R(X(149),Y(38),18,2,'#302f32');R(X(152),Y(27),2,16,'rgba(255,255,255,.18)');
  const list=[];
  list.push({y:54,f:()=>drawPerson(X(88),Y(54),{f:1,moving:false,hue:S.hue,name:S.keeper,col:'#7ad7ff',apron:true,hair:S.hair,tool:'',mat:2,hold:0,swingAt:-9999,waving:false,g:[0,0,0,0,0]},now)});
  list.push({y:66,f:()=>{
    R(X(30),Y(50),116,18,'#302f32');R(X(31),Y(51),114,4,'#b4966b');R(X(31),Y(55),114,12,'#725c45');R(X(31),Y(60),114,1,'#463d37');
    shelfSpecs(inside.id).slice(0,3).forEach((it,i)=>artPx(it.key,X(46+i*34),Y(43),1,it.pal));
  }});
  for(const pt of pets)list.push({y:pt.y,f:()=>drawPet(pt,X(pt.x),Y(pt.y),now)});
  list.push({y:me.y,f:()=>{
    const sx=X(me.x),sy=Y(me.y);
    drawPerson(sx,sy,{dv:me.dv,f:me.face,moving:me.moving,hue:me.hue,isMe:1,name:save.name||'Wanderer',col:'#ffe14a',tool:me.tool,mat:me.mat,hold:me.hold,swingAt:me.swing,waving:performance.now()<me.wave,g:gearArr(),dye:save.dye},now);
  }});
  list.sort((a,b)=>a.y-b.y);
  for(const e of list)e.f();
  label('Exit',X(88),Y(112),'#ffe14a');
}
function drawOutdoor(cx,cy,now){
  const t0=Math.max(0,Math.floor(cx/T)),t1=Math.min(WW/T-1,Math.floor((cx+cv.width)/T)),u0=Math.max(0,Math.floor(cy/T)),u1=Math.min(WH/T-1,Math.floor((cy+cv.height)/T));
  const pathAt=(tx,ty)=>VILLAGE.pathKind(tx*T+8,ty*T+8);
  for(let ty=u0;ty<=u1;ty++)for(let tx=t0;tx<=t1;tx++){
    const wx=tx*T,wy=ty*T,x=Math.round(wx-cx),y=Math.round(wy-cy);
    const boundary=tx<EDGE/T||ty<EDGE/T||tx>=WW/T-EDGE/T||ty>=WH/T-EDGE/T;
    const d=VILLAGE.waterDistance(wx+8,wy+8),kind=boundary?'boundary':pathAt(tx,ty);
    const edge=kind==='path'||kind==='plaza'?(pathAt(tx,ty-1)==='grass'?1:0)|(pathAt(tx,ty+1)==='grass'?2:0)|(pathAt(tx-1,ty)==='grass'?4:0)|(pathAt(tx+1,ty)==='grass'?8:0):0;
    MyrrenEnvironment.terrain(ctx,tx,ty,x,y,d<-18?'water':kind,now,edge);
    // Cleared, lived-in crater floor: compacted earth, ash, and recovering growth.
    // Townsfolk maintain the basin; no uninterrupted dark-green lawn.
    const basin=Math.hypot((wx+8-CX)/305,(wy+8-CY)/235);
    if(basin<.84&&kind==='grass'){
      const grain=H2(tx+93,ty-71)%13;
      R(x,y,16,16,grain<3?'#74634c':grain<7?'#796b53':grain<10?'#807158':'#6c614e');
      if(grain%3===0){R(x+2,y+5,5,2,'#948369');R(x+10,y+12,4,2,'#5d5647')}
      if(grain===1||grain===8){
        R(x+8,y+11,2,4,'#668258');R(x+5,y+12,3,2,'#789663');
        R(x+10,y+13,2,2,'#4b704b');
      }
    }
    // The Camp lies inside the overgrown impact crater of the lost trading city.
    // Subtle rocky terraces, not a solid wall: all existing routes stay open.
    const craterR=Math.hypot((wx+8-CX)/305,(wy+8-CY)/235);
    if(d>25&&kind==='grass'&&craterR>.70&&craterR<1.35){
      const grit=H2(tx+731,ty-391)%17;
      // Two softly staggered rock shelves form the crater's visible inner wall.
      const shelf=craterR>.83&&craterR<1.18;
      if(shelf&&grit<12){
        R(x,y+11,16,5,'#46544b');
        R(x,y+8,16,4,'#697465');
        R(x+2,y+7,11,2,'#999b83');
        if(grit<5){R(x+2,y+5,5,2,'#818b72');R(x+10,y+12,4,2,'#4e7251')}
      }else if(grit<5){
        R(x+3,y+12,10,2,'#65715b');
        R(x+5,y+10,6,2,'#8b9076');
      }
    }
    if(d>=-18&&d<18)MyrrenEnvironment.waterTile(ctx,tx,ty,x,y,now,VILLAGE);
    if(kind==='grass'&&d>24&&VILLAGE.dryFootprint(wx+8,wy+15,14,19,2,4)&&H2(tx,ty)%113===0)MyrrenEnvironment.fern(ctx,x+8,y+15,H2(tx,ty)%4);
  }
  const smithy=BLD.find(b=>b.open);
  // The smithy is a reclaimed stone workshop: charcoal-stained ground,
  // a shelter over the workbench, stacked fuel and warm furnace spill.
  const sx=Math.round(smithy.x-cx),sy=Math.round(smithy.y-cy);
  R(sx-67,sy-38,135,62,'#514b40');
  for(let j=0;j<7;j++)for(let i=0;i<14;i++){
    const px=sx-64+i*9,py=sy-34+j*8,h=H2(i+83,j+27)%5;
    R(px,py,8,7,h<2?'#6d6758':h<4?'#7e7764':'#5c5b50');
    R(px+1,py,6,1,'#98917b');
  }
  R(sx-70,sy+23,140,5,'#3b4039');
  // Timber roof on the rear side, leaving furnace and anvil accessible.
  R(sx-61,sy-62,5,28,'#4d382b');R(sx+52,sy-62,5,28,'#4d382b');
  R(sx-66,sy-69,124,8,'#403b32');R(sx-61,sy-75,114,7,'#74634b');
  R(sx-54,sy-79,102,5,'#a18c67');
  for(let i=0;i<6;i++){
    R(sx-52+i*19,sy-74,2,9,'#524838');
  }
  // Fuel pile, quench barrel and ember light.
  for(let i=0;i<5;i++){
    R(sx-60+i*7,sy+9-(i%2)*4,12,5,'#453629');
    R(sx-59+i*7,sy+8-(i%2)*4,9,2,'#8c6846');
  }
  R(sx+48,sy+3,17,17,'#373a36');R(sx+50,sy+1,13,7,'#6b5540');
  R(sx+52,sy+4,9,3,'#6b8a86');
  ctx.save();ctx.globalAlpha=.11+Math.sin(now/240)*.025;
  ctx.fillStyle='#ff9a42';ctx.beginPath();ctx.arc(sx+26,sy-8,42,0,Math.PI*2);ctx.fill();ctx.restore();
  for(const d of decals){const a=1-(now-d.t)/25000;ctx.globalAlpha=Math.max(0,a);const x=Math.round(d.x-cx),y=Math.round(d.y-cy);R(x-5,y-1,10,3,d.c);R(x-2,y-3,5,2,d.c);R(x+3,y+2,3,2,d.c);R(x-7,y+1,2,2,d.c);ctx.globalAlpha=1}

  const list=[];
  const vis=(x,y)=>x>cx-92&&x<cx+cv.width+92&&y>cy-24&&y<cy+cv.height+190;
  // The level 1–30 woodland is enclosed by an ancient, impassable
  // rainforest. Keep the existing world-edge collision and saved coordinates;
  // these are scenery only, not harvestable resource nodes.
  const forestEdge=[];
  const forestStep=27;
  for(let side=0;side<4;side++){
    for(let i=0;i<=Math.ceil(WW/forestStep);i++){
      const t=i*forestStep;
      for(let layer=0;layer<3;layer++){
        const wobble=((i*37+side*19+layer*13)%13)-6;
        const inset=22+layer*28+wobble;
        let fx,fy;
        if(side===0){fx=t+((layer%2)*13);fy=inset}
        else if(side===1){fx=t+((layer%2)*13);fy=WH-inset}
        else if(side===2){fx=inset;fy=t+((layer%2)*13)}
        else{fx=WW-inset;fy=t+((layer%2)*13)}
        if(fx<0||fy<0||fx>WW||fy>WH||!vis(fx,fy))continue;
        forestEdge.push({x:fx,y:fy,k:'forest',back:0});
      }
    }
  }
  // Uneven forest crown on the crater's outer shoulder. Keep entrances and
  // the central settlement unobstructed; these trees are purely visual.
  const rimKinds=['bramblewood','alder','ironbark','redleaf','duskwillow','elderthorn','starroot'];
  for(let i=0;i<24;i++){
    const a=(i+.32)*Math.PI*2/24;
    const radius=725+((i*37)%40);
    const gx=CX+Math.cos(a)*radius,gy=CY+Math.sin(a)*radius*.79;
    if(gx<EDGE+65||gy<EDGE+65||gx>WW-EDGE-65||gy>WH-EDGE-65)continue;
    if(Math.abs(gy-CY)<65)continue; // leave the east/west approach clear
    if(!vis(gx,gy)||!VILLAGE.dryFootprint(gx,gy,70,140,4,12))continue;
    const n={x:gx,y:gy,k:'tree',previewTree:rimKinds[i%rimKinds.length],back:0};
    list.push({y:gy,f:()=>drawTree(n,Math.round(gx-cx),Math.round(gy-cy),now)});
  }
  // Impact crater escarpment: a continuous, high, fractured cliff rather
  // than a row of pebble-sized sprites. All geometry stays scenery-only;
  // collision is shared with MyrrenWorld.craterWall.
  for(let i=0;i<112;i++){
    const a=i*Math.PI*2/112;
    const wobble=Math.sin(i*2.31)*7+Math.cos(i*.71)*5;
    const gx=CX+Math.cos(a)*(305+wobble),gy=CY+Math.sin(a)*(235+wobble*.7);
    if(gy>CY+172&&Math.abs(gx-CX)<65)continue; // collapsed southern breach
    if(!vis(gx,gy))continue;
    list.push({y:gy,f:()=>{
      const x=Math.round(gx-cx),y=Math.round(gy-cy),k=(i*17)%13;
      const h=57+k*3,top=y-h;
      // Ground shadow and rubble apron anchor the cliff to the terrain.
      R(x-30,y-9,60,18,'#263630');
      R(x-33,y-15,66,10,'#394b42');
      R(x-28,y-27,56,20,'#4c5b50');
      // Tall strata with broken, stepped edges and alternating stone faces.
      R(x-28,top+13,56,h-26,'#47534c');
      R(x-25,top+15,13,h-31,'#667066');
      R(x-10,top+21,18,h-37,'#59665c');
      R(x+12,top+17,12,h-33,'#384941');
      R(x-31,top+12,18,16,'#778176');
      R(x-14,top+5,24,18,'#929587');
      R(x+9,top+10,23,16,'#747f74');
      R(x-10,top+2,18,6,'#b1ad97');
      R(x-25,top+14,7,3,'#aaa994');
      // Vertical impact fractures and angled-looking split edges.
      R(x-15,top+29,3,h-50,'#303e38');
      R(x+10,top+25,3,h-48,'#303e38');
      R(x-14,top+31,2,12,'#8c9383');
      R(x+12,top+38,2,9,'#858c7b');
      // Moss and roots slowly reclaim the shattered stone.
      if(i%3===0){R(x-26,top+18,11,4,'#52794e');R(x+16,top+28,8,3,'#648659')}
      // Defensive spikes are human additions, not the crater itself.
      if(i%7===0){R(x+19,y-29,5,23,'#4c372c');R(x+20,y-35,3,8,'#a68a62')}
      // Fractured foot: fallen blocks larger than the old rock sprites.
      R(x-26,y-15,20,13,'#677168');R(x-23,y-17,15,4,'#999b89');
      R(x+7,y-13,24,12,'#515e55');R(x+10,y-15,17,4,'#7f897b');
    }});
  }
  // Ejecta scattered away from the impact, increasingly sparse at distance.
  for(let i=0;i<78;i++){
    const a=i*2.3999632297,r=350+(i%7)*22;
    const gx=CX+Math.cos(a)*r,gy=CY+Math.sin(a)*r*.76;
    if(gy>CY+170&&Math.abs(gx-CX)<85)continue;
    if(!vis(gx,gy)||VILLAGE.waterDistance(gx,gy)<20)continue;
    list.push({y:gy,f:()=>{
      const x=Math.round(gx-cx),y=Math.round(gy-cy),w=8+(i%4)*4;
      R(x-w/2,y-3,w,5,'#424c45');R(x-w/2+2,y-7,w-4,5,'#747c70');
      R(x-w/2+4,y-9,Math.max(3,w-9),2,'#a19e89');
    }});
  }
  // Water and bridge sit below actors and trees in the world depth list.
  // No bridges or encircling water remain in the Camp.
  for(const tree of VILLAGE_GROVE)if(VILLAGE.dryFootprint(tree.x,tree.y,88,174,3,10)&&tree.x>cx-100&&tree.x<cx+cv.width+100&&tree.y>cy-25&&tree.y<cy+cv.height+160)list.push({y:tree.y,f:()=>drawAncientTree(tree,Math.round(tree.x-cx),Math.round(tree.y-cy),now)});
  // Keep the camp centre readable: vegetation belongs on the crater slopes.
  for(let i=0;i<12;i++){
    const a=i*2.3999632297,r=295+(i%5)*28;
    const gx=CX+Math.cos(a)*r,gy=CY+Math.sin(a)*r*.72;
    if(Math.abs(gx-CX)<240&&gy>CY-95&&gy<CY+95)continue;
    if(vis(gx,gy)&&VILLAGE.dryFootprint(gx,gy,14,19,2,5))list.push({y:gy,f:()=>drawWoodlandShrub(Math.round(gx-cx),Math.round(gy-cy),i)});
  }
  // Small mossy remnants of the lost city, scattered beyond the safe camp.
  // Decorative only; no new collision or interactions.
  for(let i=0;i<11;i++){
    const a=i*2.3999632297+.4,r=435+(i%3)*35;
    const gx=CX+Math.cos(a)*r,gy=CY+Math.sin(a)*r*.86;
    if(!vis(gx,gy)||!VILLAGE.dryFootprint(gx,gy,22,20,3,15))continue;
    list.push({y:gy,f:()=>{
      const x=Math.round(gx-cx),y=Math.round(gy-cy);
      R(x-14,y-4,28,5,'#424c43');R(x-12,y-8,24,5,'#777c6e');
      R(x-9,y-11,7,4,'#9b9b87');R(x+3,y-12,7,5,'#8c917d');
      R(x-12,y-9,4,2,'#6d8b5c');R(x+5,y-13,5,2,'#66865b');
    }});
  }
  // Decorative showcase: all seven tree appearances around the village outskirts.
  // Scenery only: no new gatherable nodes, collision, XP or save changes.
  const showcaseTrees=['bramblewood','alder','ironbark','redleaf','duskwillow','elderthorn','starroot'];
  for(let i=0;i<showcaseTrees.length;i++){
    const a=(i/7)*Math.PI*2+.36,rad=690+(i%2)*45;
    const gx=CX+Math.cos(a)*rad,gy=CY+Math.sin(a)*rad*.82;
    if(!vis(gx,gy)||!VILLAGE.dryFootprint(gx,gy,72,110,3,10))continue;
    const tree={x:gx,y:gy,k:'tree',previewTree:showcaseTrees[i],back:0};
    list.push({y:gy,f:()=>drawTree(tree,Math.round(gx-cx),Math.round(gy-cy),now)});
  }
  for(const tree of forestEdge)list.push({y:tree.y,f:()=>drawTree(tree,Math.round(tree.x-cx),Math.round(tree.y-cy),now)});
  for(const n of nodes)if(vis(n.x,n.y))list.push({y:n.y,f:()=>{const sx=Math.round(n.x-cx),sy=Math.round(n.y-cy);n.k.startsWith('spot')?drawSpot(n,sx,sy,now):TREEK.includes(n.k)?drawTree(n,sx,sy,now):drawRock(n,sx,sy,now);nodeTip(n,sx,sy,now)}});
  for(const m of mons)if(m.warn&&m.state==='chase'&&vis(m.warn.x,m.warn.y))list.push({y:m.warn.y-.5,f:()=>drawMonsterWarning(m,cx,cy,now)});
  for(const m of mons)if((m.state!=='dead'||now-(m.dieAt||-99999)<1600)&&vis(m.x,m.y))list.push({y:m.y,f:()=>drawMon(m,Math.round(m.x-cx),Math.round(m.y-cy),now)});
  for(const c of crits)if(vis(c.x,c.y))list.push({y:c.y,f:()=>drawCritter(c,Math.round(c.x-cx),Math.round(c.y-cy),now)});
  list.push({y:CY+57,f:()=>drawVillageSquare(cx,cy,now)});
  if(vis(SPOTS.bank.x,SPOTS.bank.y))list.push({y:SPOTS.bank.y,f:()=>drawBankChest(Math.round(SPOTS.bank.x-cx),Math.round(SPOTS.bank.y-cy))});
  // Only the general store is a permanent building. Other existing shops
  // remain usable as small canvas trade pitches instead of extra houses.
  // The travelling merchant replaces all permanent starter shops.
  if(vis(TRADER.x,TRADER.y))list.push({y:TRADER.y,f:()=>drawTraderCart(Math.round(TRADER.x-cx),Math.round(TRADER.y-cy),now)});
  for(const station of VILLAGE.stations)list.push({y:station.y,f:()=>{
    const x=Math.round(station.x-cx),y=Math.round(station.y-cy);
    const art=station.kind==='furnace'?'open_furnace':station.kind==='anvil'?'blacksmith_anvil':null;
    if(!art||!window.MyrrenCampProps?.draw(ctx,art,x,y,now))
      MyrrenEnvironment.smithyPart(ctx,station.kind,x,y,now);
    if(Math.hypot(me.x-station.x,me.y-station.y)<43)label(station.kind==='furnace'?'Smelt ingots':station.kind==='anvil'?'Forge equipment':'Blacksmith supplies',x,y-(station.kind==='furnace'?59:29),'#e5d9af');
  }});
  for(const [lx,ly] of LAMPS)if(vis(lx,ly))list.push({y:ly,f:()=>drawLamp(Math.round(lx-cx),Math.round(ly-cy),now)});
  for(const [kind,dx,dy,a,b2] of DECOR)if(vis(dx,dy)&&VILLAGE.dryFootprint(dx+(kind==='fence'&&b2!=='v'?a/2:0),dy,kind==='fence'?(b2==='v'?4:a/2+3):kind==='stall'?23:19,kind==='fence'&&b2==='v'?a+16:kind==='fence'?17:53,5,10))list.push({y:dy,f:()=>drawDecor(kind,Math.round(dx-cx),Math.round(dy-cy),a,b2,now)});
  // Small cooking fire kept with the provisions, not in the central circle.
  list.push({y:CAMPFIRE.y,f:()=>{
    const fx2=Math.round(CAMPFIRE.x-cx),fy=Math.round(CAMPFIRE.y-cy),fl=Math.floor(now/120)%3;
    if(!window.MyrrenCampProps?.draw(ctx,'campfire',fx2,fy,now)){
      shadowE(fx2+2,fy+1,7,2,.2);
      for(let k=0;k<6;k++){const a2=k/6*6.283;R(fx2+Math.round(Math.cos(a2)*6)-2,fy+Math.round(Math.sin(a2)*3)-1,4,3,'#68675b')}
      R(fx2-4,fy-6-fl,8,7+fl,'#df733a');R(fx2-2,fy-9-fl,4,7+fl,'#ffd15d');
    }
  }});
  peers.forEach(o=>{if(vis(o.x,o.y))list.push({y:o.y,f:()=>drawPerson(Math.round(o.x-cx),Math.round(o.y-cy),{dv:(()=>{const dx=o.tx-o.x,dy=o.ty-o.y;if(Math.hypot(dx,dy)>1)o.dv=Math.abs(dy)>Math.abs(dx)*1.1?(dy>0?'d':'u'):'s';return o.dv||'d'})(),f:o.face,moving:Math.hypot(o.tx-o.x,o.ty-o.y)>1,hue:o.h,name:o.n,col:'#ffffff',tool:o.tool,mat:o.mat,hold:o.hold,swingAt:o.swingAt,waving:now<o.until,g:o.g,dye:o.dye},now)})});
  for(const pt of pets)list.push({y:pt.y,f:()=>drawPet(pt,Math.round(pt.x-cx),Math.round(pt.y-cy),now)});
  if(started)list.push({y:me.y,f:()=>{
    const sx=Math.round(me.x-cx),sy=Math.round(me.y-cy);
    drawPerson(sx,sy,{dv:me.dv,f:me.face,moving:me.moving,hue:me.hue,isMe:1,name:save.name||'Wanderer',col:'#ffe14a',tool:me.tool,mat:me.mat,hold:me.hold,swingAt:me.swing,waving:now<me.wave,g:gearArr(),dye:save.dye},now);
    if(me.hp<hpMax())bar(sx,sy-39,me.hp/hpMax());
    drawFishFx(cx,cy,now);
  }});
  list.sort((a,b)=>a.y-b.y);
  for(const e of list)e.f();
}
const GRASS=['#263d31','#344d39','#3b5840'];
// A CanvasGradient is immutable for a given viewport. Reuse it rather than
// allocating a new radial gradient on every mobile animation frame.
let outdoorVignette=null,vignetteWidth=0,vignetteHeight=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  const cssW=cv.clientWidth,cssH=cv.clientHeight;
  const landscape=cssW>cssH*1.15;
  const zoomKey=landscape?'landscape':'portrait';
  const sc=cameraZoom[zoomKey]??(landscape?1:clamp(Math.round(Math.min(cssW,cssH)/330),1,4));
  const w=Math.ceil(cssW/sc),h=Math.ceil(cssH/sc);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
  ctx.imageSmoothingEnabled=false;
  update(dt,now);

  const tx=inside?RX/2-cv.width/2:me.x-cv.width/2,ty=inside?RY/2-cv.height*.36:me.y-cv.height*.47;
  const k=snapCam?1:Math.min(1,dt*7);snapCam=false;cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;
  const cx=Math.round(cam.x),cy=Math.round(cam.y);

  ctx.fillStyle='#0d0b08';ctx.fillRect(0,0,cv.width,cv.height);
  const combatOverlays=inside?[]:layoutMonsterOverlays(cx,cy,now);
  if(inside)drawInterior(cx,cy,now);else{
    drawOutdoor(cx,cy,now);
    const gw=cv.width,gh=cv.height;
    if(!outdoorVignette||vignetteWidth!==gw||vignetteHeight!==gh){
      outdoorVignette=ctx.createRadialGradient(gw/2,gh/2,Math.min(gw,gh)*.38,gw/2,gh/2,Math.max(gw,gh)*.78);
      outdoorVignette.addColorStop(0,'rgba(40,50,0,0)');
      outdoorVignette.addColorStop(1,'rgba(30,36,6,.34)');
      vignetteWidth=gw;vignetteHeight=gh;
    }
    ctx.fillStyle=outdoorVignette;ctx.fillRect(0,0,gw,gh);
  }

  if(marker){
    const age=now-marker.t;
    if(age<600){const x=Math.round(marker.x-cx),y=Math.round(marker.y-cy),s=age<200?3:2;R(x-s,y-1,s*2+1,2,marker.c);R(x-1,y-s,2,s*2+1,marker.c)}else marker=null;
  }
  for(const p of fx){const a=1-(now-p.t)/520;R(Math.round(p.x-cx),Math.round(p.y-cy),a>.5?2:1,a>.5?2:1,p.c)}
  drawCombatImpacts(now,cx,cy);
  drawDamagePopups(now,cx,cy,combatOverlays);
  if(!inside)drawMonsterOverlays(combatOverlays);
  if(fade){const a=1-(now-fade)/280;if(a>0){ctx.fillStyle='rgba(0,0,0,'+a.toFixed(2)+')';ctx.fillRect(0,0,cv.width,cv.height)}else fade=0}
  if(started&&now-sendAt>100){sendAt=now;sendPresence()}
  if(now-slowAt>300){slowAt=now;if(started){refreshActionButtons();if(tab==='players')refreshPlayers()}}
  if(now-saveAt>5000){saveAt=now;if(started)persist()}
  requestAnimationFrame(frame);
}
let last=performance.now(),sendAt=0,slowAt=0,saveAt=0;
addCrit('bunny',22,60);addCrit('bird',16,70);addCrit('deer',9,180);addCrit('fox',7,520); // foxes roam the outer woodland, well clear of the busy crater forge
syncPets();petsTeleport();uiHud();
let loadDone=false;
window.addEventListener('myrren-kez-v2-ready',()=>{if(loadDone&&!started){const g=$('go');g.disabled=false;g.textContent='ENTER'}});
window.addEventListener('myrren-kez-v2-error',()=>{const g=$('go');g.disabled=true;g.textContent='ART LOAD ERROR';$('net').textContent='Character artwork failed. Reload to retry.';if(started)toast('CHARACTER ART ERROR')});
function finishLoad(){
  if(loadDone)return;loadDone=true;
  const g=$('go');const art=window.MyrrenKezV2Atlas;
  g.disabled=!art?.ready;
  g.textContent=art?.ready?'ENTER':art?.failed?'ART LOAD ERROR':'LOADING ART…';
  if(art?.failed)$('net').textContent='Character artwork failed. Reload to retry.';
  if(save.name&&!$('nick').value)$('nick').value=save.name;
}
function adoptSave(o,why){
  applySave(o);me.x=clamp(save.x,EDGE+8,WW-EDGE-8);me.y=clamp(save.y,EDGE+8,WH-EDGE-8);relocateSavedPosition();
  syncPets();petsTeleport();uiHud();
  try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}
}
async function bootLoad(){
  const g=$('go');g.disabled=true;g.textContent='LOADING SAVE...';
  const guard=setTimeout(finishLoad,4000);
  const cands=[];
  try{for(const raw of await idbGetAll()){const o=parseSavedProgress(raw);if(o)cands.push(o)}}catch(e){}
  try{
    if(window.claude&&window.claude.use){
      const [user,db]=await Promise.all([window.claude.use('user'),window.claude.use('db')]);
      const id=user&&db?await user.id():null;
      if(id){
        cdoc=db.collection('data/users/'+id).doc('ember');
        const snapd=await cdoc.get();
        if(snapd.exists){const d=snapd.data();if(d&&d.json){const o=parseSavedProgress(d.json);if(o){cands.push(o);cloudSig=String(d.json).replace(/"ts":\d+,?/,'')}}}
        cloudState='on';
      }else cloudState='off';
    }else cloudState='off';
  }catch(e){cloudState=cdoc?'error':'off'}
  clearTimeout(guard);
  let best=null;for(const o of cands)if(o&&o.xp&&(!best||(+o.ts||0)>(+best.ts||0)))best=o;
  if(best&&!started&&(fresh||(+best.ts||0)>saveTs))adoptSave(best);
  finishLoad();
  if(!fresh&&cdoc&&cloudState==='on')cloudPush(JSON.stringify(snap()),true);
  if(sbSession)sbLoad().then(()=>{if(tab==='settings')renderModal()}).catch(e=>{sbStatus='Cloud unavailable: '+e.message;if(tab==='settings')renderModal()});
}
window.addEventListener('storage',event=>{
  if(event.key!==KEY||!started||saveConflict)return;
  if(isNewerExternalSave(event.newValue,saveTs))markSaveConflict();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSmithing('',false);stopCooking('',false);if(started)persist(true)}});
window.addEventListener('pagehide',()=>{stopSmithing('',false);stopCooking('',false);if(started)persist(true)});
bootLoad();
requestAnimationFrame(frame);
})();
