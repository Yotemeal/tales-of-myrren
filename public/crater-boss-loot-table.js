/* Jewelheart loot proposal. Preview data only: no boss rewards are granted.
 * Coins, low-tier ore and merchant-saleable steel gear use existing item IDs.
 * Jewellery targets are exact 1 in 150 per kill; rates remain proposals, not approved for live activation.
 */
(()=>{'use strict';
 const table=Object.freeze({
  bossId:'jewelheart_guardian',status:'balance-proposal',
  guaranteed:Object.freeze([{itemId:'coins',min:120,max:260}]),
  main:Object.freeze([
   {itemId:'copper',quantity:4,weight:30},
   {itemId:'tin',quantity:4,weight:30},
   {itemId:'iron',quantity:3,weight:25},
   {itemId:'coal',quantity:3,weight:15}
  ].map(Object.freeze)),
  bonus:Object.freeze([
   {itemId:'steel_sword',chanceBps:500},
   {itemId:'steel_helm',chanceBps:500},
   {itemId:'steel_body',chanceBps:500},
   {itemId:'steel_legs',chanceBps:500},
   {itemId:'steel_shield',chanceBps:500},
   {itemId:'guardians_necklace',chanceNumerator:1,chanceDenominator:150},
   {itemId:'guardians_ring',chanceNumerator:1,chanceDenominator:150}
  ].map(Object.freeze))
 });
 window.MyrrenJewelheartLootProposal=table;
})();
