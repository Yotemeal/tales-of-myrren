/* Preview-only browser loot adapter. No new monster balance or live activation. */
(()=>{'use strict';
 const validCount=n=>Number.isSafeInteger(n)&&n>=1;
 function validate(table){
  if(!table||typeof table!=='object')throw new TypeError('Loot table required');
  const target=e=>e&&((typeof e.itemId==='string'&&e.itemId.trim()&&!e.tableId)||(typeof e.tableId==='string'&&e.tableId.trim()&&!e.itemId));
  const normalize=(e,mode)=>{
   if(!target(e)||!validCount(e.quantity??1))throw new TypeError('Invalid loot entry');
   if(mode==='main'&&!validCount(e.weight))throw new TypeError('Invalid main weight');
   if(mode==='bonus'&&(!Number.isInteger(e.chanceBps)||e.chanceBps<0||e.chanceBps>10000))throw new TypeError('Invalid bonus odds');
   return {...e,quantity:e.quantity??1};
  };
  const guaranteed=(table.guaranteed||[]).map(e=>normalize(e,'guaranteed'));
  const main=(table.main||[]).map(e=>normalize(e,'main'));
  const bonus=(table.bonus||[]).map(e=>normalize(e,'bonus'));
  const total=main.reduce((n,e)=>{if(n>Number.MAX_SAFE_INTEGER-e.weight)throw new RangeError('Weights overflow');return n+e.weight},0);
  return {guaranteed,main,bonus,total};
 }
 function roll(table,random=Math.random,sharedTables={}){
  if(typeof random!=='function')throw new TypeError('Random source required');
  const root=validate(table);
  const shared=Object.fromEntries(Object.entries(sharedTables).map(([id,t])=>[id,validate(t)]));
  function check(t,ancestors=new Set()){
   for(const e of [...t.guaranteed,...t.main,...t.bonus]){
    if(!e.tableId)continue;
    if(!Object.hasOwn(shared,e.tableId))throw new TypeError('Unknown shared loot table');
    if(ancestors.has(e.tableId))throw new TypeError('Circular shared loot table');
    check(shared[e.tableId],new Set([...ancestors,e.tableId]));
   }
  }
  check(root);
  function draw(){const n=random();if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Invalid random draw');return n}
  function visit(t,depth=0){
   if(depth>16)throw new RangeError('Loot nesting too deep');
   const drops=[];
   function add(e){if(e.tableId){for(let i=0;i<e.quantity;i++)drops.push(...visit(shared[e.tableId],depth+1))}else if(e.itemId!=='nothing')drops.push({itemId:e.itemId,quantity:e.quantity})}
   for(const e of t.guaranteed)add(e);
   if(t.total){let pick=Math.floor(draw()*t.total);for(const e of t.main){if(pick<e.weight){add(e);break}pick-=e.weight}}
   for(const e of t.bonus)if(e.chanceBps===10000||(e.chanceBps>0&&Math.floor(draw()*10000)<e.chanceBps))add(e);
   return drops;
  }
  return visit(root);
 }
 function create(){const settled=new WeakMap();return {award(monster,table,grant,random=Math.random,sharedTables={}){
  const death=monster.dieAt;
  if(settled.get(monster)===death)return false;
  const drops=roll(table,random,sharedTables);
  settled.set(monster,death);
  try{grant(drops)}catch(error){settled.delete(monster);throw error}
  return true;
 }}}
 window.MyrrenCraterLoot={roll,create,validate};
})();
