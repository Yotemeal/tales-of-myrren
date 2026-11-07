/* Jewelheart loot proposal. Preview data only: no boss rewards are granted.
 * Coins, low-tier ore and merchant-saleable steel gear use existing item IDs.
 * Jewellery targets are 1 in 150 per kill (exact odds); the 67 bps entries are rounded display approximations. Rates remain proposals, not approved for live activation.
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
   {itemId:'guardians_necklace',chanceBps:67},
   {itemId:'guardians_ring',chanceBps:67}
  ].map(Object.freeze))
 });
 window.MyrrenJewelheartLootProposal=table;
})();
