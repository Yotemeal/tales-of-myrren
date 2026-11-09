'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/myrren-game.js','utf8');
const match=source.match(/function shouldWriteSnapshot\(previous,next\)\{[\s\S]*?\n\}/);
assert(match,'save ordering guard must be present');
const shouldWrite=vm.runInNewContext('('+match[0]+')');
const snapshot=(ts,coins=0)=>({v:3,ts,xp:{melee:0},inv:{coins}});
assert.equal(shouldWrite(null,snapshot(100)),true,'first save must be accepted');
assert.equal(shouldWrite(snapshot(100),snapshot(101)),true,'newer save must be accepted');
assert.equal(shouldWrite(snapshot(100),snapshot(100)),true,'equal timestamp should not block current save');
assert.equal(shouldWrite(snapshot(101,500),snapshot(100,0)),false,
  'delayed older save must not erase earned coins');
assert.equal(shouldWrite(snapshot(1000,500),snapshot(0,0)),false,
  'legacy or zero timestamp cannot replace newer save');
assert.equal(shouldWrite(snapshot(100),null),false,'invalid incoming save must be rejected');
const fn=source.slice(source.indexOf('async function idbPut('),source.indexOf('async function idbGetAll('));
assert(fn.includes('if(!shouldWriteSnapshot(prev,incoming))return;'),
  'IndexedDB write must enforce ordering inside the read/write transaction');
assert(fn.indexOf('if(!shouldWriteSnapshot(prev,incoming))return;')<fn.indexOf("store.put(str,'save')"),
  'ordering guard must run before the database write');
const signatureMatch=source.match(/function saveSignature\(str\)\{[^}]*\}/);
assert(signatureMatch,'cloud save comparison must use a shared timestamp-neutral signature');
const signature=vm.runInNewContext('('+signatureMatch[0]+')');
assert.equal(signature(JSON.stringify(snapshot(100,50))),signature(JSON.stringify(snapshot(200,50))),
  'timestamps alone must not trigger a new cloud write');
assert.notEqual(signature(JSON.stringify(snapshot(100,50))),signature(JSON.stringify(snapshot(100,51))),
  'actual inventory changes must still trigger a cloud write');
assert.equal((source.match(/const sig=saveSignature\(str\)/g)||[]).length,2,
  'both cloud save providers must use the same timestamp-neutral comparison');
const timestampMatch=source.match(/function nextSnapshotTimestamp\(now,stored,issued\)\{[^}]*\}/);
assert(timestampMatch,'save timestamps must be monotonic');
const nextTimestamp=vm.runInNewContext('('+timestampMatch[0]+')');
assert.equal(nextTimestamp(1000,0,0),1000,'use wall clock when it advances');
assert.equal(nextTimestamp(1000,1000,1000),1001,'same-millisecond saves must have unique order');
assert.equal(nextTimestamp(900,1200,1300),1301,'clock rollback must not rewind save timestamps');
assert(source.includes('lastSnapshotTs=nextSnapshotTimestamp(Date.now(),saveTs,lastSnapshotTs)'),
  'every snapshot must use the monotonic timestamp generator');
// A read failure must never trigger an unguarded write. Simulate the
// IndexedDB request callbacks with a newer existing save in the store.
const idbFn=source.slice(source.indexOf('async function idbPut('),source.indexOf('async function idbGetAll('));
assert(idbFn.includes('get.onerror=()=>tx.abort();'),
  'a failed read must abort, not overwrite a potentially newer save');
assert(!idbFn.includes("get.onerror=()=>store.put(str,'save')"),
  'never bypass the timestamp guard after a read error');
console.log('PASS: asynchronous save writes cannot roll progress back');
