'use strict';
// Current Crater Camp layout: the retired river ring/two-bridge village is
// deliberately absent. Exercise shared geometry and the deployable runtime.
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

function reachableCamp(world,sealGate=false){
  const queue=[[800,840]],seen=new Set(['800:840']);
  let outside=false;
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    if(Math.hypot((x-800)/305,(y-800)/235)>1.1)outside=true;
    for(const [dx,dy] of [[4,0],[-4,0],[0,4],[0,-4]]){
      const nx=x+dx,ny=y+dy,key=nx+':'+ny;
      if(nx<440||nx>1160||ny<520||ny>1136||seen.has(key)||world.inWater(nx,ny))continue;
      if(sealGate&&Math.abs(nx-800)<=56&&ny>=992&&ny<=1060)continue;
      seen.add(key);queue.push([nx,ny]);
    }
  }
  return {outside,points:queue};
}

function testGeometry(world){
  assert.deepEqual(world.bridges,[],'Crater Camp has a dry southern opening, not river bridges');
  assert(!world.inWater(800,840),'arrival point is walkable');
  for(const [x,y] of [[800,565],[1105,800],[495,800]])
    assert(world.craterWall(x,y)&&world.inWater(x,y),'the northern/eastern/western rim blocks movement');
  for(let y=980;y<=1100;y+=4)
    assert(!world.inWater(800,y),'southern entrance stays clear at '+y);

  // The ring has one continuous opening; a sealed entrance must leave no
  // second route through the rockfall. This catches gaps as well as blocked gates.
  const rim=Array.from({length:1440},(_,i)=>{
    const angle=i*Math.PI/720;
    return !world.craterWall(800+305*Math.cos(angle),800+235*Math.sin(angle));
  });
  const transitions=rim.reduce((n,open,i)=>n+(open!==rim[(i+rim.length-1)%rim.length]),0);
  assert(rim.some(Boolean)&&rim.some(open=>!open),'ring contains both solid wall and entrance');
  assert.equal(transitions,2,'the rockfall ring has exactly one contiguous opening');
  const reachable=reachableCamp(world);
  assert(reachable.outside,'camp arrival point connects to the wilderness');
  assert(!reachableCamp(world,true).outside,'sealing the southern entrance blocks every exit');
  for(const spot of [...world.stations,{x:650,y:914},{x:658,y:762},{x:792,y:728}])
    assert(reachable.points.some(([x,y])=>Math.hypot(x-spot.x,y-spot.y)<24),
      'furnace, anvil, trader, bank and board must be reachable from arrival');

  assert(world.waterDistance(world.lake.x,world.lake.y)<0,'lake centre remains water');
  assert(world.inWater(world.lake.x,world.lake.y),'lake collision blocks walking');
  let pathTiles=0;
  for(let y=112;y<1488;y+=16)for(let x=112;x<1488;x+=16){
    if(world.pathKind(x,y)==='grass')continue;
    for(const [dx,dy] of [[-8,-8],[7,-8],[-8,7],[7,7]])
      assert(world.waterDistance(x+dx,y+dy)>4,'path tile crops the lake bank at '+x+','+y);
    pathTiles++;
  }
  assert(pathTiles>100,'camp paths and the southern wilderness trail remain visible');
  for(let i=0;i<16;i++){
    const point=world.fishingPosition(i*Math.PI/8+.3);
    assert(world.waterDistance(point.x,point.y)<0,'fishing spot belongs in the lake');
    assert(Array.from({length:64},(_,j)=>j*Math.PI/32).some(angle=>
      !world.inWater(point.x+Math.cos(angle)*24,point.y+Math.sin(angle)*24)),
      'each fishing spot has a reachable dry bank');
  }
  for(let i=0;i<300;i++){
    const angle=i*Math.PI/150;
    for(const point of [
      {x:800+305*Math.cos(angle),y:800+235*Math.sin(angle)},
      {x:world.lake.x+Math.cos(angle)*world.lake.rx*.8,y:world.lake.y+Math.sin(angle)*world.lake.ry*.8}
    ]){
      const safe=world.safePosition(point.x,point.y);
      assert(Number.isFinite(safe.x)&&Number.isFinite(safe.y));
      assert(!world.inWater(safe.x,safe.y),'saved wall/lake positions recover onto walkable ground');
    }
  }
  console.log('PASS: 1,440 rim samples; one connected southern exit; camp service reachability; '+pathTiles+' dry path tiles; 16 bank-reachable fishing spots; 600 save recovery positions.');
}

(async()=>{
  const runtime=await createGame(),game=runtime.game,world=game.VILLAGE;
  testGeometry(world);
  // Exercise the outdoor scenery before starting: the synthetic logic harness
  // deliberately omits player artwork (covered by the real browser suites).
  const beforeDraw=runtime.rectCount();game.drawOutdoor(430,540,10000);
  assert(runtime.rectCount()>beforeDraw,'current outdoor camp actually renders');
  runtime.elements.get('nick').value='Layout QA';game.start();game.mons.length=0;
  const model={v:3,ts:1,name:'Kez',
    xp:{mining:game.xpTable[60],melee:game.xpTable[25],forging:game.xpTable[10],woodcutting:1200,fishing:700,cooking:600},
    inv:{coins:12345,copper:5,tin:5,ing_bronze:10},
    eq:{body:'steel_body',legs:'steel_legs',boots:'steel_boots'},bag:['iron_pick'],
    bank:{logs:42},notes:{copper:7},jobs:[],tokens:47,perks:{},dye:null,
    pets:{woodcutting:0,fishing:0,mining:0},x:1105,y:800};
  const original=JSON.stringify(model);
  game.adoptSave(model);
  assert.equal(JSON.stringify(model),original,'layout recovery cannot mutate an imported save');
  assert(!world.inWater(game.me.x,game.me.y),'saved crater-wall position relocates to land');
  const snapshot=game.snap();
  for(const field of ['name','xp','bag','bank','notes','tokens'])
    assert.deepEqual(snapshot[field],model[field],field+' survives world-layout save recovery');
  for(const [slot,item] of Object.entries(model.eq))assert.equal(snapshot.eq[slot],item,slot+' equipment is preserved');
  for(const [item,count] of Object.entries(model.inv))assert.equal(snapshot.inv[item],count,item+' is preserved');
  assert.equal(snapshot.x,Math.round(game.me.x));assert.equal(snapshot.y,Math.round(game.me.y));

  const house=game.BLD.find(b=>!b.open);
  game.me.x=house.x;game.me.y=house.y-7;game.relocateSavedPosition();
  assert(!(Math.abs(game.me.x-house.x)<house.w/2+3&&game.me.y>house.y-14&&game.me.y<house.y),
    'old saves inside a legacy building footprint recover outside it');

  // Use the actual movement/collision loop, not only the geometry helper.
  game.adoptSave({...model,x:1050,y:800});
  game.keys.d=true;
  for(let i=0;i<40;i++)game.update(.05,1000+i*50);
  game.keys.d=false;
  assert(game.me.x>1050&&game.me.x<1074,'eastward movement stops at the crater wall');
  assert(!world.inWater(game.me.x,game.me.y),'collision cannot strand the player in the wall');
  game.adoptSave({...model,x:800,y:950});game.keys.s=true;
  for(let i=0;i<40;i++)game.update(.05,4000+i*50);
  game.keys.s=false;
  assert(game.me.y>1100&&!world.inWater(game.me.x,game.me.y),'actual walking exits through the southern gate');

  const realNow=Date.now;let now=realNow();Date.now=()=>now;
  try{
    game.adoptSave({...model,x:800,y:840});
    const furnace=world.stations.find(s=>s.kind==='furnace');
    game.openSmithy('furnace');
    assert.equal(game.getTab(),'','distant players cannot open the furnace');
    game.me.x=furnace.x;game.me.y=furnace.y+20;game.openSmithy('furnace');
    assert.equal(game.getInside(),null);assert.equal(game.getTab(),'smelt');
    assert.equal(game.curShop(),null,'crafting does not silently open a merchant');
    assert(game.smithStation('smelt'),'player is within furnace working reach');
    const beforeBars=game.save.inv.ing_bronze,beforeXp=game.save.xp.forging;
    assert(game.smelt(game.SMELT[0]));
    assert.equal(game.save.inv.ing_bronze,beforeBars+1);
    assert.equal(game.save.inv.copper,4);assert.equal(game.save.inv.tin,4);
    assert.equal(game.save.xp.forging,beforeXp+game.SMELT[0].xp);

    game.closeModal();now+=game.PRODUCTION_MS.smelt;
    const anvil=world.stations.find(s=>s.kind==='anvil');
    game.me.x=anvil.x;game.me.y=anvil.y+20;game.openSmithy('anvil');
    assert.equal(game.getInside(),null);assert.equal(game.getTab(),'forge');
    assert(game.smithStation('forge'));game.setForgeMat(2);
    const bars=game.save.inv.ing_bronze;
    assert(game.forge('sword'));
    assert.equal(game.save.inv.ing_bronze,bars-game.FORGE.sword);
    assert.equal(game.save.eq.weapon,'bronze_sword','first forged weapon auto-equips');
    assert.equal(game.save.inv.coins,model.inv.coins,'crafting does not spend shop currency');
    game.closeModal();

    game.me.x=game.TRADER.x;game.me.y=game.TRADER.y;
    runtime.elements.get('aUse').click();
    assert.equal(game.getInside(),null);assert.equal(game.getTab(),'shop');
    assert.equal(game.curShop().id,'cart','Trader Gus remains the starter-supply merchant');
    const coins=game.save.inv.coins,price=game.DEFS.bronze_axe.price;
    game.buyItem('bronze_axe');
    assert.equal(game.save.inv.coins,coins-price);
    assert(game.save.bag.includes('bronze_axe'),'starter tool goes into the pack while a sword is equipped');
    for(const building of game.BLD.filter(b=>!b.open)){
      game.closeModal();game.enterBuilding(building,8000);
      assert.equal(game.getInside(),null,'retired shop entrances cannot trap the character indoors');
      assert.equal(game.curShop().id,'cart','legacy shops route to the current camp trader');
    }
    game.closeModal();
    const trade=world.stations.find(s=>s.kind==='trade');
    game.me.x=trade.x;game.me.y=trade.y;game.openSmithy('trade');
    assert.equal(game.getInside(),null);assert.equal(game.getTab(),'shop');
    assert.equal(game.curShop().id,'arms','blacksmith trade stays separate from furnace/anvil crafting');
    game.closeModal();
  }finally{Date.now=realNow}

  console.log('PASS: saved progression and blocked-position recovery; runtime wall/gate collision; outdoor smelting/forging; starter purchases and legacy shop routing; camp rendering.');
})().catch(error=>{console.error(error);process.exitCode=1});
