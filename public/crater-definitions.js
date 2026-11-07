/* Approved Crater design record. Missing artwork and balance stay explicit. */
(()=>{'use strict';
 const hostile=(id,name,level,reference,behaviour,attack)=>({id,name,level,reference,behaviour,attack,states:['idle','move','attack','hit','death'],atlas:null,balance:null});
 const hostiles=[
  hostile('forest_rat','Forest Rat',1,'R1','ruin-scavenger','bite'),
  hostile('goblin_miner','Goblin Miner',5,'R3','cautious-throw-and-flee','damaging-rock'),
  hostile('wild_boar','Wild Boar',8,'R1','territorial','charge'),
  hostile('dire_wolf','Dire Wolf',12,'R6','camouflaged-apex-hunter','lunge'),
  hostile('goblin_guard','Goblin Guard',16,'R3','protect-nearby-miners','melee-slash'),
  hostile('cave_guardian','Cave Guardian',18,'R2','roaming-red-eyed-guardian','slam'),
  hostile('forest_troll','Forest Troll',22,'R1','original-forest-stalker','club-slam'),
  hostile('jewelheart_guardian','Jewelheart Guardian',30,'R2','territorial-arena-boss','ground-crush')
 ];
 const wildlife=[
  {id:'forest_deer',name:'Forest Deer',idle:'graze',escape:'run'},
  {id:'rabbit',name:'Rabbit',idle:'alert',escape:'hop'},
  {id:'squirrel',name:'Squirrel',idle:'forage',escape:'scamper-and-climb'},
  {id:'raven',name:'Raven',idle:'peck',escape:'takeoff-and-fly'},
  {id:'fox',name:'Fox',idle:'watch',escape:'run'}
 ].map(c=>({...c,reference:'R4',passive:true,atlas:null}));
 const pets=[
  {id:'timber_glider',name:'Timber Glider',skill:'woodcutting',states:['walk','idle','takeoff','glide','land','climb']},
  {id:'geode_mole',name:'Geode Mole',skill:'mining',states:['burrow','dirt-trail','surface','idle','dig'],surfaceOnlyWhenPlayerStopped:true},
  {id:'river_otter',name:'River Otter',skill:'fishing',states:['walk','idle','swim','dive','catch']}
 ].map(p=>({...p,reference:'R5',bonusPercent:3,bonusRequiresSummoned:true,atlas:null}));
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
 window.MyrrenCrater=freeze({hostiles,wildlife,pets,rockDamageApproved:true,
  previewEnabled:search=>/(?:^|[?&])craterPreview=1(?:&|$)/.test(String(search||''))});
})();
