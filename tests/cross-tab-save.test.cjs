'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/myrren-game.js','utf8');
const match=source.match(/function isNewerExternalSave\(raw,localTimestamp\)\{[\s\S]*?\n\}/);
assert(match,'cross-tab timestamp comparison must exist');
const parseSavedProgress=raw=>{try{const o=JSON.parse(raw);return o&&o.xp?o:null}catch{return null}};
const isNewer=vm.runInNewContext('('+match[0]+')',{parseSavedProgress});
const save=ts=>JSON.stringify({v:3,ts,xp:{melee:100},inv:{coins:10}});
assert.equal(isNewer(save(101),100),true,'newer tab save must trigger conflict');
assert.equal(isNewer(save(100),100),false,'same timestamp must not trigger conflict');
assert.equal(isNewer(save(99),100),false,'older save must not trigger conflict');
assert.equal(isNewer('{broken',100),false,'malformed storage events must be ignored');
assert.equal(isNewer(null,100),false,'clearing storage must not trigger conflict');
const persist=source.slice(source.indexOf('function persist(force){'),source.indexOf('const eqDef='));
assert(persist.includes('if(saveConflict)return;'),'autosave must stop after conflict');
assert(persist.indexOf('if(isNewerExternalSave(current,saveTs))')<persist.indexOf('const o=snap()'),
  'cross-tab check must happen before creating a newer timestamp');
assert(persist.indexOf('if(isNewerExternalSave(current,saveTs))')<persist.indexOf('localStorage.setItem(KEY,str)'),
  'cross-tab check must happen before overwriting local storage');
assert(source.includes("window.addEventListener('storage',event=>{"),
  'browser storage events must detect newer external saves');
for(const name of ['cloudPush','sbPush']){
  const start=source.indexOf('async function '+name+'(str,force){');
  assert(start>=0,'cloud writer '+name+' must exist');
  assert(source.slice(start,start+120).includes('if(saveConflict)return;'),
    'cloud writer '+name+' must not upload stale character data');
}
const toastStart=source.indexOf('function toast(t){');
const toastEnd=source.indexOf('\nfunction uiQuest()',toastStart);
assert(toastStart>=0&&toastEnd>toastStart,'toast must exist');
const toastSource=source.slice(toastStart,toastEnd);
assert(toastSource.includes("e.textContent=saveConflict?"),
  'a conflict warning must remain visible even if another toast fires');
assert(toastSource.includes('if(!saveConflict)toastT=setTimeout'),
  'a save conflict must not disappear after the normal toast timeout');
console.log('PASS: stale tabs cannot silently replace newer local or cloud saves');
