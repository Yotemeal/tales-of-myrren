/* Jewelheart boss reward contract, preview-only.
 * Boss rehearsal never grants progression. No unique drop odds are approved.
 */
(()=>{'use strict';
 const BOSS_ID='jewelheart_guardian';
 const UNIQUES=Object.freeze([
  Object.freeze({itemId:'guardians_necklace',approved:false}),
  Object.freeze({itemId:'guardians_ring',approved:false})
 ]);
 function create({enabled=false}={}){
  if(enabled)throw new Error('Jewelheart rewards are not approved for activation');
  function evaluate({killId,bossId=BOSS_ID,eligible=false,ironmanOwner=false,contributor=false}={}){
   if(typeof killId!=='string'||!killId.trim())throw new TypeError('Stable boss kill ID required');
   if(bossId!==BOSS_ID)return Object.freeze({status:'wrong-boss',drops:[]});
   if(!eligible||!ironmanOwner||!contributor)return Object.freeze({status:'ineligible',drops:[]});
   // A preview rehearsal is not a real reward settlement: do not lock the kill.
   return Object.freeze({status:'preview-only',drops:[]});
  }
  return Object.freeze({bossId:BOSS_ID,uniques:UNIQUES,enabled:false,evaluate,settle:evaluate});
 }
 window.MyrrenJewelheartRewards=Object.freeze({create,bossId:BOSS_ID,uniques:UNIQUES});
})();
