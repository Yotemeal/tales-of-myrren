'use strict';
// Behavioral regression for the mobile hold-to-attack target lock.
// Run: node tests/combat-input.test.cjs
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const {game:g}=await createGame();
  const me=g.me,mons=g.mons;
  mons.length=0;
  me.x=g.CX;me.y=g.CY;me.tgt=null;me.pend=0;
  g.save.eq.weapon=null;
  assert.equal(g.meleeReach(),22,'bare hands use their shorter reach');
  g.save.eq.weapon='bronze_sword';
  assert.equal(g.meleeReach(),30,'swords extend auto-targeting reach');
  g.save.eq.weapon=null;

  const mob=(dx,dy=4)=>({t:'slime',state:'idle',x:me.x+dx,y:me.y+dy,hp:100,prov:false,cd:0,face:1});
  const edge=mob(21,8),closer=mob(8);
  mons.push(edge,closer);
  // Enemy hit centres are four pixels above their foot position.
  assert(g.meleeDistance(edge)<22,'fixture is inside fist reach by hit centre');
  assert(Math.hypot(edge.x-me.x,edge.y-me.y)>22,'fixture is outside old foot-distance reach');
  assert.equal(g.meleeTarget(),closer,'nearest eligible creature is acquired');

  me.tgt=edge;
  assert.equal(g.meleeTarget(),edge,'an in-range locked target takes priority over nearer enemies');
  edge.x=me.x+50;
  assert.equal(g.meleeTarget(),closer,'leaving range transfers focus to the nearest eligible creature');
  closer.state='dead';
  assert.equal(g.meleeTarget(),null,'dead and out-of-reach enemies cannot be selected');
  mons.length=0;me.tgt=null;

  const left=mob(-12),right=mob(9);
  mons.push(left,right);
  me.tgt=left;
  g.beginSwing(1000);
  assert.equal(g.getPendingStrike().target,left,'swing retains its selected enemy');
  assert.equal(me.face,-1,'attack automatically faces the target to the left');
  assert(me.fx<0,'directional vector points toward the target');
  g.resolveSwing(1110);
  assert.equal(left.prov,true,'the chosen enemy registers being attacked');
  assert.equal(right.hp,100,'a locked attack does not splash onto another enemy');
  assert.equal(right.prov,false,'the other enemy remains unprovoked');
  me.pend=0;

  // A hit uses the strike's locked origin and cannot land from arbitrary range
  // when an enemy moves away during the 110ms wind-up.
  me.tgt=right;
  g.beginSwing(2000);
  const hp=right.hp;
  right.x=me.x+70;
  g.resolveSwing(2110);
  assert.equal(right.hp,hp,'a retreating enemy cannot be hit outside the original reach');
  assert.equal(right.prov,false,'the whiff cannot provoke a distant target');

  right.state='dead';left.state='idle';me.tgt=right;me.pend=0;
  assert.equal(g.meleeTarget(),left,'dead target does not block reacquisition');
  g.faceMeleeTarget(left);
  assert.equal(me.face,-1,'enemy-facing helper is stable after retargeting');

  const runtime=await createGame(),input=runtime.game;
  input.adoptSave({v:3,xp:{},inv:{},eq:{},bag:[],x:200,y:200});
  input.start();input.mons.length=0;
  const keyboard=(key,target={tagName:'BODY'})=>{
    let prevented=false;
    runtime.dispatchWindowEvent('keydown',{key,target,repeat:false,preventDefault(){prevented=true}});
    return prevented;
  };
  const nativeTargets=[{id:'nick'},...['INPUT','TEXTAREA','SELECT'].map(tagName=>({tagName})),{tagName:'SPAN',isContentEditable:true}];
  for(const target of nativeTargets){
    assert.equal(keyboard('d',target),false,'native controls retain their character keys');
    assert.equal(keyboard(' ',target),false,'native controls retain spaces and button activation');
    assert(!input.keys.d&&!input.keys[' '],'typing in native controls cannot latch gameplay input');
  }
  const x=input.me.x,y=input.me.y;
  const enterButton=runtime.elements.get('go');enterButton.tagName='BUTTON';
  enterButton.click();
  assert.equal(keyboard(' ',enterButton),false,'focused buttons retain native Space activation');
  assert.equal(keyboard('Enter',enterButton),false,'focused buttons retain native Enter activation');
  assert(!input.keys[' ']&&!input.keys.enter,'native button activation cannot start gameplay attacks');
  keyboard('d',enterButton);input.update(.05,3000);
  assert(input.me.x>x,'keyboard movement works while ENTER remains focused after starting');
  runtime.dispatchDocumentEvent('focusin',{target:{tagName:'BUTTON'}});
  assert(input.keys.d,'clicking an action button does not interrupt held keyboard movement');
  runtime.dispatchDocumentEvent('focusin',{target:{tagName:'INPUT'}});
  const afterFocus=input.me.x;
  input.update(.05,3050);
  assert.equal(input.me.x,afterFocus,'focusing a form releases movement before a missing keyup');
  assert.equal(input.me.y,y);

  const pointer={pointerId:7,clientX:446,clientY:300,preventDefault(){}};
  const attack=runtime.elements.get('aAtk'),pad=runtime.elements.get('pad');
  keyboard('d');keyboard(' ');
  pad.events.pointerdown(pointer);attack.events.pointerdown(pointer);
  const swings=input.me.swings;
  runtime.dispatchWindowEvent('blur');
  input.update(.05,4000);
  assert.equal(input.me.x,afterFocus,'window blur releases both keyboard and joystick movement');
  assert.equal(input.me.swings,swings,'window blur cancels held and queued attack input');
  assert.equal(runtime.elements.get('knob').style.transform,'','blur recentres the visible joystick');

  pad.events.pointerdown(pointer);attack.events.pointerdown(pointer);
  runtime.document.hidden=true;
  runtime.dispatchDocumentEvent('visibilitychange');
  runtime.document.hidden=false;
  input.update(.05,5000);
  assert.equal(input.me.x,afterFocus,'hiding the tab releases joystick movement');
  assert.equal(input.me.swings,swings,'hiding the tab clears queued touch attacks');

  pad.events.pointerdown(pointer);pad.events.lostpointercapture(pointer);
  input.update(.05,6000);
  assert.equal(input.me.x,afterFocus,'losing joystick capture releases movement');
  attack.events.pointerdown(pointer);
  runtime.dispatchDocumentEvent('focusin',{target:{tagName:'BUTTON'}});
  input.update(.05,7000);
  assert.equal(input.me.swings,swings+1,'focusing the attack button preserves its pointer attack');
  attack.events.lostpointercapture(pointer);
  input.update(.05,7200);input.update(.05,8000);
  assert.equal(input.me.swings,swings+1,'losing attack capture prevents repeated swings');
  attack.tagName='BUTTON';
  assert.equal(keyboard(' ',attack),true,'focused attack button uses Space for held gameplay attacks');
  input.update(.05,9000);
  assert.equal(input.me.swings,swings+2,'Space begins an attack from the focused attack button');
  input.update(.05,9210);
  runtime.dispatchWindowEvent('keydown',{key:' ',target:attack,repeat:true,preventDefault(){}});
  input.update(.05,9900);
  assert.equal(input.me.swings,swings+3,'held Space repeats at the shared attack cooldown');
  runtime.dispatchWindowEvent('keyup',{key:' ',target:attack});
  input.update(.05,10100);input.update(.05,10800);
  assert.equal(input.me.swings,swings+3,'releasing Space stops focused attack button repeats');
  assert.equal(keyboard('Enter',attack),false,'attack button keeps native Enter activation');
  attack.events.click({detail:0});
  input.update(.05,11000);
  assert.equal(input.me.swings,swings+4,'native Enter or assistive click queues one attack');
  input.update(.05,11200);input.update(.05,12000);
  assert.equal(input.me.swings,swings+4,'native activation does not latch held attacks');
  attack.events.click({detail:1});input.update(.05,13000);
  assert.equal(input.me.swings,swings+4,'pointer click cannot duplicate its pointerdown attack');
  console.log('PASS: hit-centre selection, sticky lock, switching, facing, single-target damage and range-safe whiffs.');
  console.log('PASS: native form/button keys, focus changes, blur/hidden input release and pointer capture loss.');
})().catch(e=>{console.error(e);process.exitCode=1});
