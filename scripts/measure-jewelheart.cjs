// Run from the repo root. Uses the game runtime with an isolated boss and seeded RNG.
const createGame=require('../tests/game-runtime.cjs');

function seededRandom(seed){
 let state=seed;
 return ()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 };
}

async function fight({material,dodge,bossHp,maxHit},seed){
 const {game}=await createGame({}, {search:'?craterPreview=1&craterBossPreview=1'});
 const boss=game.mons.find(m=>m.t==='jewelheart');

 game.save.xp.melee=game.xpTable[30];
 for(const [slot,kind] of Object.entries({weapon:'sword',head:'helm',body:'body',hands:'gloves',legs:'legs',boots:'boots',shield:'shield'})){
  const id=material+'_'+kind;
  if(!game.DEFS[id]||game.DEFS[id].req>30)throw Error('Gear unavailable at level 30: '+id);
  game.save.eq[slot]=id;
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
 const runs=Number(process.argv[2]||40);
 if(!Number.isInteger(runs)||runs<1)throw Error('Run count must be a positive integer.');
 for(const [bossHp,maxHit] of [[42,6],[120,6],[120,18],[200,18]])for(const material of ['iron','steel'])for(const dodge of [false,true]){
  const settings={bossHp,maxHit,material,dodge};
  const results=[];
  for(let seed=1;seed<=runs;seed++)results.push(await fight(settings,seed));
  const wins=results.filter(r=>r.win);
  const seconds=wins.map(r=>r.seconds);
  console.log(JSON.stringify({...settings,wins:wins.length,runs,
   seconds:seconds.length?[Math.min(...seconds),median(seconds),Math.max(...seconds)]:null,
   medianDamage:median(results.map(r=>r.damage)),medianCrushes:median(results.map(r=>r.crushes))}));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
