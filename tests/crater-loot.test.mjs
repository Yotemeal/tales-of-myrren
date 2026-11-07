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


test('nested shared rare table can award independent duplicate equipment',()=>{
 const shared={rare:{guaranteed:[{itemId:'rare_ring',quantity:1}]}};
 const table={guaranteed:[{itemId:'coins',quantity:5}],bonus:[{tableId:'rare',chanceBps:10000,quantity:2}]};
 const roll=createCraterLootRoller(table,()=>0,shared);
 assert.deepEqual(roll(),[{itemId:'coins',quantity:5},{itemId:'rare_ring',quantity:1},{itemId:'rare_ring',quantity:1}]);
});
test('unknown and circular nested tables are rejected',()=>{
 assert.throws(()=>createCraterLootRoller({main:[{tableId:'missing',weight:1}]}),/Unknown shared/);
 const shared={a:{guaranteed:[{tableId:'b'}]},b:{guaranteed:[{tableId:'a'}]}};
 assert.throws(()=>createCraterLootRoller({guaranteed:[{tableId:'a'}]},()=>0,shared),/Circular shared/);
});
