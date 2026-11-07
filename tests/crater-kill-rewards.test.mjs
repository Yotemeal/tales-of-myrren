import test from 'node:test';
import assert from 'node:assert/strict';
import {createCraterKillRewards} from '../src/crater-kill-rewards.mjs';
const table={rat:{guaranteed:[{itemId:'coins',quantity:2}],main:[{itemId:'bread',weight:1}],bonus:[{itemId:'rare',chanceBps:10000}]}};
test('one death awards guaranteed, main and rare exactly once',()=>{
 const inventory=[];const settle=createCraterKillRewards({tables:table,random:()=>0,grant:d=>inventory.push(...d)});
 assert.equal(settle({killId:'rat-1',monsterId:'rat'}).status,'awarded');
 assert.equal(settle({killId:'rat-1',monsterId:'rat'}).status,'already-settled');
 assert.deepEqual(inventory.map(x=>x.itemId),['coins','bread','rare']);
});
test('different kills can farm duplicate rares with no protection',()=>{
 const inventory=[];const settle=createCraterKillRewards({tables:table,random:()=>0,grant:d=>inventory.push(...d)});
 settle({killId:'rat-1',monsterId:'rat'});settle({killId:'rat-2',monsterId:'rat'});
 assert.equal(inventory.filter(x=>x.itemId==='rare').length,2);
});
test('Ironman ownership and eligibility block rewards',()=>{
 let count=0;const settle=createCraterKillRewards({tables:table,grant:()=>count++});
 assert.equal(settle({killId:'1',monsterId:'rat',ironmanOwner:false}).status,'ineligible');
 assert.equal(settle({killId:'2',monsterId:'rat',eligible:false}).status,'ineligible');
 assert.equal(count,0);
});
test('unconfigured monsters do not invent drop rates',()=>{
 const settle=createCraterKillRewards({tables:{},grant:()=>{throw Error('should not grant')}});
 assert.equal(settle({killId:'1',monsterId:'rat'}).status,'unconfigured');
});
test('failed inventory transaction can retry, without a successful partial grant',()=>{
 let attempts=0;const settle=createCraterKillRewards({tables:table,random:()=>0,grant:()=>{if(++attempts===1)throw Error('full inventory')}});
 assert.throws(()=>settle({killId:'1',monsterId:'rat'}),/full inventory/);
 assert.equal(settle({killId:'1',monsterId:'rat'}).status,'awarded');
});
