'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/index.html','utf8');
const game=fs.readFileSync('public/myrren-game.js','utf8');
test('canonical game entry loads the approved V19F sheet before safe gameplay bridge',()=>{
  const old=html.indexOf('/kez-v2-atlas.js');
  const native=html.indexOf('/myrren-v19f-atlas.js');
  const alias=html.indexOf('window.MyrrenV19BAtlas=window.MyrrenV19FAtlas;');
  const bridge=html.indexOf('/myrren-v19b-optin-game-bridge.js');
  const gameplay=html.indexOf('/myrren-game.js?v=94');
  assert(old>=0&&old<native&&native<alias&&alias<bridge&&bridge<gameplay);
  assert.equal(html.split('/myrren-v19f-atlas.js').length,2);
  assert.equal(html.split('/myrren-v19b-optin-game-bridge.js').length,2);
  assert.equal(html.split('/myrren-game.js?v=94').length,2);
});
test('runtime build and camera remain approved; rollback does not change save code',()=>{
  assert(game.includes('window.MyrrenBuild=94;'));
  assert(game.includes('const GAMEPLAY_SCALE=2;'));
  assert(game.includes('const state={...o,now,deathAt,hurtAt};'));
  assert(!html.includes('id="v19b-preview-tools"'));
});