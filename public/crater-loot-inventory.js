/* Atomic planning for Crater rewards: no mutation until the entire plan is valid.
 * Equipment stays separate (duplicates are never silently converted to coins).
 * When a bag is full, coins and existing stacks may still be awarded.
 */
(()=>{'use strict';
 function plan(drops,{inventory,gear=[],canFit,resolveGear}){
  if(!Array.isArray(drops)||!inventory||typeof canFit!=='function'||typeof resolveGear!=='function')throw new TypeError('Invalid reward adapter');
  const stack={};const equipment=[];const rejected=[];
  for(const drop of drops){
   if(!drop||typeof drop.itemId!=='string'||!Number.isSafeInteger(drop.quantity)||drop.quantity<1)throw new TypeError('Invalid reward');
   if(drop.itemId==='existing_random_gear'){
    for(let i=0;i<drop.quantity;i++){
     const id=resolveGear();
     if(typeof id!=='string'||!id)throw new TypeError('Unknown equipment');
     if(canFit(stack,equipment.length+1))equipment.push(id);
     else rejected.push({itemId:id,quantity:1,reason:'full'});
    }
   }else{
    const candidate={...stack,[drop.itemId]:(stack[drop.itemId]||0)+drop.quantity};
    if(!Number.isSafeInteger(candidate[drop.itemId]))throw new RangeError('Stack overflow');
    if(canFit(candidate,equipment.length))Object.assign(stack,candidate);
    else rejected.push({...drop,reason:'full'});
   }
  }
  return {stack,equipment,rejected};
 }
 function commit(plan,inventory,gear){
  if(!plan||!inventory||!Array.isArray(gear))throw new TypeError('Invalid reward commit');
  for(const [id,count] of Object.entries(plan.stack)){
   const value=(inventory[id]||0)+count;
   if(!Number.isSafeInteger(value))throw new RangeError('Inventory overflow');
  }
  for(const [id,count] of Object.entries(plan.stack))inventory[id]=(inventory[id]||0)+count;
  gear.push(...plan.equipment);
  return plan;
 }
 window.MyrrenCraterInventory={plan,commit};
})();
