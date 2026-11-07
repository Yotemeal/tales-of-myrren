/* Jewelheart boss reward contract, preview-only.
 * Boss rehearsal never grants progression. No unique drop odds are approved.
 */
(()=>{'use strict';
 const BOSS_ID='jewelheart_guardian';
 const UNIQUES=Object.freeze([
  Object.freeze({itemId:'guardians_necklace',approved:false}),
  Object.freeze({itemId:'guardians_ring',approved:false})
 ]);
 function create({enabled=false,table=null,grant=null}={}){
  if(enabled)throw new Error('Jewelheart rewards are not approved for activation');
  return Object.freeze({
   bossId:BOSS_ID,
   uniques:UNIQUES,
   enabled:false,
   settle(){return Object.freeze({status:'preview-only',drops:[]})}
  });
 }
 window.MyrrenJewelheartRewards=Object.freeze({create,bossId:BOSS_ID,uniques:UNIQUES});
})();
