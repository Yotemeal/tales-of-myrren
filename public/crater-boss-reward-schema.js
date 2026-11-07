/* Preview-only boss reward schema validator.
 * This never enables Jewelheart rewards. It validates a future approved
 * configuration before a separate activation implementation is written.
 */
(()=>{'use strict';
 const ids=['guardians_necklace','guardians_ring'];
 function validate(config){
  if(!config||typeof config!=='object')throw new TypeError('Boss reward configuration required');
  if(config.bossId!=='jewelheart_guardian')throw new TypeError('Wrong boss');
  if(!Array.isArray(config.uniques)||config.uniques.length!==2)throw new TypeError('Both unique items required');
  const seen=new Set();
  for(const unique of config.uniques){
   if(!unique||!ids.includes(unique.itemId)||seen.has(unique.itemId))throw new TypeError('Invalid or duplicate unique');
   seen.add(unique.itemId);
   if(!Number.isInteger(unique.chanceBps)||unique.chanceBps<1||unique.chanceBps>10000)throw new TypeError('Approved unique odds required');
   if(!unique.stats||typeof unique.stats!=='object'||Array.isArray(unique.stats)||Object.keys(unique.stats).length===0)throw new TypeError('Approved item stats required');
   for(const value of Object.values(unique.stats))if(!Number.isFinite(value))throw new TypeError('Invalid item stat');
  }
  if(!config.approved)throw new TypeError('Explicit balance approval required');
  return true;
 }
 window.MyrrenBossRewardSchema=Object.freeze({validate});
})();
