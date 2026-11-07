// Pure, preview-stage Crater loot roller. No inventory mutation or game activation.
const MAX_WEIGHT = Number.MAX_SAFE_INTEGER;
function validCount(n){return Number.isSafeInteger(n)&&n>=1}
function chance(n){return Number.isInteger(n)&&n>=0&&n<=10000}
function entry(e, weighted=false){
  if(!e||typeof e!=='object'||(!e.tableId&&(typeof e.itemId!=='string'||!e.itemId.trim()))||!validCount(e.quantity??1)) throw new TypeError('Invalid loot entry');
  if(weighted?(!validCount(e.weight)||e.weight>MAX_WEIGHT):!chance(e.chanceBps)) throw new TypeError('Invalid loot odds');
  return Object.freeze({...e,quantity:e.quantity??1});
}
function validate(table){
  if(!table||typeof table!=='object')throw new TypeError('Loot table required');
  const guaranteed=(table.guaranteed??[]).map(e=>{if(!e||typeof e.itemId!=='string'||!e.itemId.trim()||!validCount(e.quantity??1))throw new TypeError('Invalid guaranteed drop');return Object.freeze({...e,quantity:e.quantity??1})});
  const main=(table.main??[]).map(e=>entry(e,true));
  const bonus=(table.bonus??[]).map(e=>entry(e,false));
  const total=main.reduce((n,e)=>{if(n>MAX_WEIGHT-e.weight)throw new RangeError('Main weights exceed safe integer');return n+e.weight},0);
  return Object.freeze({guaranteed,main,bonus,total});
}
function makeRoller(table, random=Math.random, sharedTables={}){
  const t=validate(table);
  const shared=new Map(Object.entries(sharedTables).map(([name,definition])=>[name,validate(definition)]));
  function checkReferences(current,active=new Set()){
    for(const e of [...current.guaranteed,...current.main,...current.bonus]){
      if(!e.tableId)continue;
      if(typeof e.tableId!=='string'||!shared.has(e.tableId))throw new TypeError('Unknown shared loot table');
      if(active.has(e.tableId))throw new TypeError('Circular shared loot table');
      const next=new Set(active);next.add(e.tableId);
      checkReferences(shared.get(e.tableId),next);
    }
  }
  checkReferences(t);
  if(typeof random!=='function')throw new TypeError('Random source required');
  function draw(){const x=random();if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>=1)throw new RangeError('Random source must return [0,1)');return x}
  function rollTable(current,depth=0){
    if(depth>16)throw new RangeError('Loot nesting too deep');
    const drops=[];
    function add(e){if(e.tableId){for(let i=0;i<e.quantity;i++)drops.push(...rollTable(shared.get(e.tableId),depth+1));}else if(e.itemId!=='nothing')drops.push({itemId:e.itemId,quantity:e.quantity});}
    current.guaranteed.forEach(add);
    if(current.total){let pick=Math.floor(draw()*current.total);for(const e of current.main){if(pick<e.weight){add(e);break}pick-=e.weight}}
    for(const e of current.bonus){if(e.chanceBps===10000||e.chanceBps>0&&Math.floor(draw()*10000)<e.chanceBps)add(e)}
    return drops;
  }
  return ()=>rollTable(t);
}
export {validate as validateCraterLootTable,makeRoller as createCraterLootRoller};
