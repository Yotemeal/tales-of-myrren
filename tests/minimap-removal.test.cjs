const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('public/index.html','utf8');
const game=fs.readFileSync('public/myrren-game.js','utf8');
const css=fs.readFileSync('public/myrren-ui.css','utf8');
for(const [name,source] of [['page',page],['game',game],['styles',css]]){
  assert(!/minimap|miniCanvas|miniCtx|drawMini|miniLast|mini-(?:n|s|e|w)/i.test(source),name+' must not contain orphaned minimap references');
}
for(const id of ['hud','hudL','hudBottom','hudR','hpFill','hpTxt','lvlTxt','bBag','bMenu','pad','acts','aAtk','aUse','aEat']){
  assert(page.includes('id="'+id+'"'),'retain essential HUD/control '+id);
}
const stylesVersion=page.match(/myrren-ui[.]css[?]v=([0-9]+)/);
assert(stylesVersion&&Number(stylesVersion[1])>=32,'bust stale cached HUD styles');
console.log('Minimap removed; HUD and mobile controls retained');
