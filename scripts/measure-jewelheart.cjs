// Run from the repo root. Uses the game runtime with an isolated boss and seeded RNG.
const createGame=require('../tests/game-runtime.cjs');

function seededRandom(seed){
 let state=seed;
 return ()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 };
}

async function createFighter(material){
 const {game}=await createGame({}, {search:'?craterPreview=1&craterBossPreview=1'});
 game.save.xp.melee=game.xpTable[30];
 for(const [slot,kind] of Object.entries({weapon:'sword',head:'helm',body:'body',hands:'gloves',legs:'legs',boots:'boots',shield:'shield'})){
  const id=material+'_'+kind;
  if(!game.DEFS[id]||game.DEFS[id].req>30)throw Error('Gear unavailable at level 30: '+id);
  game.save.eq[slot]=id;
 }
 return game;
}

async function fight({material,dodge,bossHp,maxHit,partySize=1},seed){
 const game=await createFighter(material);
 const boss=game.mons.find(m=>m.t==='jewelheart');
 const allies=[];
 for(let i=1;i<partySize;i++){
  const ally=await createFighter(material);
  ally.mons.splice(0,ally.mons.length,boss);
  allies.push({game:ally,side:i===1?-1:1,nextSwing:1000+i*300});
 }
 game.start();
 game.mons.splice(0,game.mons.length,boss);
 const {me,keys}=game;
 Object.assign(boss,{x:1380,y:800,hx:1380,hy:800,hp:bossHp,state:'chase',cd:0,prov:true});
 Object.assign(me,{x:1400,y:800,hp:game.hpMax(),fx:-1,fy:0});
 game.MT.jewelheart.hp=bossHp;
 game.MT.jewelheart.max=maxHit;
 const rng=Math.random;
 let damage=0,crushes=0,lastRelease=boss.lunge;
 try{
  Math.random=seededRandom(seed);
  for(let elapsed=50;elapsed<=120000;elapsed+=50){
   const now=1000+elapsed;
   const dx=boss.x-me.x,dy=boss.y-me.y,dist=Math.hypot(dx,dy);
   // Supply facing directly so this measures combat rather than input accuracy.
   if(dist){me.fx=dx/dist;me.fy=dy/dist}
   const escaping=dodge&&boss.dashAttack&&now-boss.dashAttack.at>=250;
   keys.w=!!escaping&&me.y>boss.dashAttack.y-24;
   keys.s=!escaping&&dist>23&&dy>4;
   keys.a=!escaping&&dist>23&&dx<-4;
   keys.d=!escaping&&dist>23&&dx>4;
   keys[' ']=dist<=27;
   const hp=me.hp;
   game.update(.05,now);
   damage+=Math.max(0,hp-me.hp);
   // Idealised flankers share the boss HP and use the real damage roll.
   // Only the lead fighter runs movement and boss targeting in this benchmark.
   if(me.deathAt==null)for(const ally of allies){
    if(boss.state==='dead'||now<ally.nextSwing)continue;
    const y=boss.y+ally.side*20;
    const aim=boss.dashAttack;
    if(aim&&Math.hypot(boss.x-aim.x,y-aim.y)<=19)continue;
    Object.assign(ally.game.me,{x:boss.x,y,fx:0,fy:-ally.side});
    ally.game.resolveSwing(now);
    ally.nextSwing=now+900;
   }
   if(boss.lunge!==lastRelease){lastRelease=boss.lunge;crushes++}
   if(boss.state==='dead'||me.deathAt!=null)return {seconds:elapsed/1000,damage,crushes,win:boss.state==='dead'};
  }
  return {seconds:120,damage,crushes,win:false};
 }finally{Math.random=rng}
}

function median(values){
 const sorted=values.slice().sort((a,b)=>a-b);
 const middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}

(async()=>{
 const args=process.argv.slice(2);
 const party=args.includes('--party');
 const runs=Number(args.find(arg=>arg!=='--party')||40);
 if(!Number.isInteger(runs)||runs<1)throw Error('Run count must be a positive integer.');
 const scenarios=[];
 if(party){
  for(const material of ['steel','cobalt'])for(const partySize of [1,2,3]){
   scenarios.push({bossHp:450,maxHit:18,material,dodge:true,partySize});
  }
 }else{
  for(const [bossHp,maxHit] of [[42,6],[120,6],[120,18],[200,18],[450,18]]){
   for(const material of ['iron','steel','cobalt'])for(const dodge of [false,true]){
    scenarios.push({bossHp,maxHit,material,dodge});
   }
  }
 }
 for(const settings of scenarios){
  const results=[];
  for(let seed=1;seed<=runs;seed++)results.push(await fight(settings,seed));
  const wins=results.filter(r=>r.win);
  const seconds=wins.map(r=>r.seconds);
  console.log(JSON.stringify({...settings,wins:wins.length,runs,
   seconds:seconds.length?[Math.min(...seconds),median(seconds),Math.max(...seconds)]:null,
   medianDamage:median(results.map(r=>r.damage)),medianCrushes:median(results.map(r=>r.crushes))}));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
