// Pure, preview-stage Crater loot roller. No inventory mutation or game activation.
const MAX_WEIGHT = Number.MAX_SAFE_INTEGER;
function validCount(n){return Number.isSafeInteger(n)&&n>=1}
function chance(n){return Number.isInteger(n)&&n>=0&&n<=10000}
function entry(e, weighted=false){
  if(!e||typeof e!=='object'||typeof e.itemId!=='string'||!e.itemId.trim()||!validCount(e.quantity??1)) throw new TypeError('Invalid loot entry');
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
function makeRoller(table, random=Math.random){
  const t=validate(table);
  if(typeof random!=='function')throw new TypeError('Random source required');
  function draw(){const x=random();if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>=1)throw new RangeError('Random source must return [0,1)');return x}
  return function roll(){
    const drops=t.guaranteed.map(({itemId,quantity})=>({itemId,quantity}));
    if(t.total){let pick=Math.floor(draw()*t.total);for(const e of t.main){if(pick<e.weight){if(e.itemId!=='nothing')drops.push({itemId:e.itemId,quantity:e.quantity});break}pick-=e.weight}}
    for(const e of t.bonus){if(e.chanceBps===10000||e.chanceBps>0&&Math.floor(draw()*10000)<e.chanceBps)drops.push({itemId:e.itemId,quantity:e.quantity})}
    return drops;
  };
}
export {validate as validateCraterLootTable,makeRoller as createCraterLootRoller};
