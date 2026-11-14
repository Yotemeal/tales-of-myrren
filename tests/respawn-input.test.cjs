'use strict';
const assert=require('node:assert/strict');
const createGame=require('./game-runtime.cjs');

(async()=>{
  const runtime=await createGame(),game=runtime.game;
  game.start();game.mons.length=0;
  const {me,keys}=game;
  const keyboard=key=>runtime.dispatchWindowEvent('keydown',{
    key,target:{tagName:'BODY'},repeat:false,preventDefault(){}
  });
  const pointer={pointerId:11,clientX:446,clientY:300,preventDefault(){}};
  const pad=runtime.elements.get('pad'),attack=runtime.elements.get('aAtk');
  const enemy={t:'slime',state:'chase',x:me.x+10,y:me.y+4,hx:me.x+10,hy:me.y+4,
    hp:5,cd:0,prov:true,face:-1,w:1,wx:me.x+10,wy:me.y+4};
  game.mons.push(enemy);me.tgt=enemy;me.tgtUntil=10000;
  keyboard('d');keyboard(' ');pad.events.pointerdown(pointer);attack.events.pointerdown(pointer);
  game.beginSwing(1000);assert(game.getPendingStrike());
  const swings=me.swings;
  game.die();
  assert.equal(me.hp,0);assert.notEqual(me.deathAt,null);
  assert.deepEqual(Object.keys(keys),[],'death releases held movement and attack keys');
  assert.equal(runtime.elements.get('knob').style.transform,'','death recentres the touch joystick');
  assert.equal(game.getPendingStrike(),null,'a pre-death strike cannot resolve after respawn');
  assert.equal(me.tgt,null,'death releases the former enemy target');
  assert.equal(me.tgtUntil,0,'death clears target HUD expiry');

  // The defeat animation can still receive delayed key/pointer events. They
  // must not turn into movement or a queued attack when the character revives.
  keyboard('d');keyboard(' ');pad.events.pointerdown(pointer);attack.events.pointerdown(pointer);
  game.update(.05,2050);
  assert.equal(me.deathAt,null);assert.equal(me.hp,game.hpMax());
  assert.deepEqual(Object.keys(keys),[],'respawn discards input received while defeated');
  assert.equal(runtime.elements.get('knob').style.transform,'','respawn recentres newly queued touch movement');
  const x=me.x,y=me.y;
  game.update(.05,2100);
  assert.equal(me.x,x,'revived character stays still until fresh movement input');
  assert.equal(me.y,y);
  assert.equal(me.swings,swings,'revived character cannot reuse held or queued attacks');
  assert.equal(enemy.hp,5,'discarded pre-death attack cannot damage an enemy');
  assert.equal(game.getPendingStrike(),null);

  game.mons.length=0;
  keyboard('d');keyboard(' ');game.update(.05,3000);
  assert(me.x>x,'fresh movement still works after revival');
  assert.equal(me.swings,swings+1,'fresh attack still starts after revival');
  console.log('PASS: death/respawn release held and delayed keyboard/touch input, target HUD and pending damage; fresh controls remain responsive.');
})().catch(error=>{console.error(error);process.exitCode=1});
