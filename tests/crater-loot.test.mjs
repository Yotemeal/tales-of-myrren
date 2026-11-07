import test from 'node:test';
import assert from 'node:assert/strict';
import {createCraterLootRoller,validateCraterLootTable} from '../src/crater-loot.mjs';
test('guaranteed coins and weighted main plus independent bonuses coexist',()=>{
 const roll=createCraterLootRoller({guaranteed:[{itemId:'coins',quantity:5}],main:[{itemId:'ore',weight:3},{itemId:'nothing',weight:1}],bonus:[{itemId:'rare',chanceBps:10000}]},()=>0);
 assert.deepEqual(roll(),[{itemId:'coins',quantity:5},{itemId:'ore',quantity:1},{itemId:'rare',quantity:1}]);
});
test('rare equipment can drop repeatedly for Ironman farming',()=>{
 const roll=createCraterLootRoller({bonus:[{itemId:'rare_pickaxe',chanceBps:10000}]},()=>0.5);
 assert.deepEqual(roll(),[{itemId:'rare_pickaxe',quantity:1}]);
 assert.deepEqual(roll(),[{itemId:'rare_pickaxe',quantity:1}]);
});
test('weighted nothing outcome and failed bonus do not block guaranteed coins',()=>{
 const roll=createCraterLootRoller({guaranteed:[{itemId:'coins'}],main:[{itemId:'ore',weight:1},{itemId:'nothing',weight:1}],bonus:[{itemId:'rare',chanceBps:1}]},()=>0.999);
 assert.deepEqual(roll(),[{itemId:'coins',quantity:1}]);
});
test('invalid weights, odds, and random values are rejected',()=>{
 assert.throws(()=>validateCraterLootTable({main:[{itemId:'ore',weight:0}]}));
 assert.throws(()=>validateCraterLootTable({bonus:[{itemId:'rare',chanceBps:10001}]}));
 assert.throws(()=>createCraterLootRoller({main:[{itemId:'ore',weight:1}]},()=>1)());
});
