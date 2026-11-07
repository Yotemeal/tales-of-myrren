// Preview-only reward settlement. The caller supplies the existing inventory adapter.
// Never call this on attack frames: only after a confirmed eligible death.
import {createCraterLootRoller} from './crater-loot.mjs';
export function createCraterKillRewards({tables,grant,random=Math.random}){
 if(!tables||typeof tables!=='object'||typeof grant!=='function')throw new TypeError('Tables and inventory grant callback required');
 const rollers=new Map(Object.entries(tables).map(([id,table])=>[id,createCraterLootRoller(table,random)]));
 const settled=new Set();
 return function settle({killId,monsterId,eligible=true,ironmanOwner=true}){
  if(typeof killId!=='string'||!killId||typeof monsterId!=='string'||!monsterId)throw new TypeError('Stable kill and monster IDs required');
  if(!eligible||!ironmanOwner)return {status:'ineligible',drops:[]};
  if(settled.has(killId))return {status:'already-settled',drops:[]};
  const roller=rollers.get(monsterId);
  if(!roller)return {status:'unconfigured',drops:[]};
  // Lock before grant to avoid reentrant double rolls; caller must surface failures.
  settled.add(killId);
  const drops=roller();
  try {grant(drops,{killId,monsterId});}
  catch(error){settled.delete(killId);throw error;}
  return {status:'awarded',drops};
 };
}
