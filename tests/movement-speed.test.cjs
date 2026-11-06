const assert=require('node:assert/strict'),createGame=require('./game-runtime.cjs');
(async()=>{
 const {game:t}=await createGame();const fixture={v:3,name:'Movement QA',xp:{melee:10000000},inv:{coins:4321},bank:{logs:23},notes:{copper:17},eq:{},bag:[],tokens:37,x:200,y:200};
 t.adoptSave(fixture);t.start();t.mons.length=0;
 const x=t.me.x,y=t.me.y;t.keys.arrowright=true;
 for(let i=0;i<20;i++)t.update(.05,1000+i*50);t.keys.arrowright=false;
 assert(Math.abs(t.me.x-x-90)<.001,'cardinal movement should cover 90 pixels per simulation second');assert.equal(t.me.y,y);
 t.adoptSave(fixture);const a=t.me.x,b=t.me.y;t.keys.arrowright=true;t.keys.arrowdown=true;
 for(let i=0;i<20;i++)t.update(.05,3000+i*50);t.keys.arrowright=false;t.keys.arrowdown=false;
 assert(Math.abs(Math.hypot(t.me.x-a,t.me.y-b)-90)<.001,'diagonals must not move faster');
 assert.equal(t.save.inv.coins,4321);assert.equal(t.save.tokens,37);assert.equal(t.save.bank.logs,23);assert.equal(t.save.notes.copper,17);
 console.log('PASS: actual simulation moves at 90px/s cardinally and diagonally; progression, bank and notes retained.');
})().catch(e=>{console.error(e);process.exitCode=1});
