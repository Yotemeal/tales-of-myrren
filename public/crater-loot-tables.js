/* Crater monster loot identities and preview-only legacy rate adapter.
 * All rates come from current monster definitions. Boss uniques remain disabled
 * until their actual odds and equipment definitions are approved.
 */
(()=>{'use strict';
 const entries=[
  ['forest_rat','rat'],['goblin_miner','goblin'],['wild_boar','boar'],
  ['dire_wolf','wolf'],['goblin_guard','goblin_guard'],
  ['cave_guardian','guardian'],['forest_troll','troll'],
  ['jewelheart_guardian','jewelheart']
 ];
 const identity=Object.freeze(Object.fromEntries(entries));
 const gameId=Object.freeze(Object.fromEntries(entries.map(([id,key])=>[key,id])));
 const bossUniques=Object.freeze([
  {itemId:'guardians_necklace',status:'pending-rates-and-stats'},
  {itemId:'guardians_ring',status:'pending-rates-and-stats'}
 ]);
 function tableFor(gameMonsterId,mt){
  const id=gameId[gameMonsterId];
  if(!id||!mt)return null;
  if(id==='jewelheart_guardian')return null; // Boss rehearsal never awards progression.
  if(!Array.isArray(mt.coins)||!mt.drop)return null;
  if(!Number.isFinite(mt.bread)||!Number.isFinite(mt.drop.p))return null;
  const breadBps=Math.round(mt.bread*10000);
  const gearBps=Math.round(mt.drop.p*10000);
  if(!Number.isInteger(breadBps)||breadBps<0||breadBps>10000||
     !Number.isInteger(gearBps)||gearBps<0||gearBps>10000)return null;
  // Coins are supplied by the caller using the existing per-monster amount range.
  return {id,guaranteed:[],main:[
   {itemId:'bread',weight:breadBps},
   {itemId:'nothing',weight:10000-breadBps}
  ].filter(e=>e.weight>0),bonus:[
   {tableId:'legacy_equipment',chanceBps:gearBps}
  ]};
 }
 const sharedTables=Object.freeze({legacy_equipment:{guaranteed:[{itemId:'existing_random_gear',quantity:1}]}});
 window.MyrrenCraterLootTables=Object.freeze({identity,gameId,bossUniques,tableFor,sharedTables});
})();
