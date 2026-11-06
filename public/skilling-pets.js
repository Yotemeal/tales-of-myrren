/* Approved pet movement and exact summoned-only XP. Rendering is independent. */
(()=>{'use strict';
 const definitions=Object.freeze({woodcutting:Object.freeze({id:'timber_glider',name:'Timber Glider',speed:64,glideSpeed:128}),mining:Object.freeze({id:'geode_mole',name:'Geode Mole',speed:52}),fishing:Object.freeze({id:'river_otter',name:'River Otter',speed:42})});
 function normalizeRemainders(source){return Object.fromEntries(Object.keys(definitions).map(skill=>{const value=source?.[skill];return[skill,Number.isInteger(value)&&value>=0&&value<100?value:0]}))}
 function award(skill,base,pets,remainders){
  if(!Number.isSafeInteger(base)||base<0)throw Error('XP awards must be nonnegative safe integers');
  const next=normalizeRemainders(remainders);
  if(!definitions[skill]||pets?.[skill]!==1||base===0)return{amount:base,bonus:0,remainders:next};
  // BigInt keeps the calculation exact even for large valid import balances.
  const hundredths=BigInt(base)*3n+BigInt(next[skill]),bonus=Number(hundredths/100n);next[skill]=Number(hundredths%100n);
  return{amount:Math.min(Number.MAX_SAFE_INTEGER,base+bonus),bonus,remainders:next};
 }
 function setState(p,state,now){if(p.previewState!==state){p.previewState=state;p.stateAt=now}}
 function reset(p,now,{playerMoving=false,dead=false}={}){
  p.trail=[];p.previewState=null;p.stateAt=now;p.lastTrailAt=-Infinity;p.catchUntil=0;p.seenSuccess=null;p.moving=false;p.actionKey=null;
  setState(p,p.sk==='mining'?(playerMoving||dead?'burrow':'surface'):'idle',now);p.underground=p.sk==='mining'&&(playerMoving||dead);
 }
 function update(p,{dt,now,player,anchor,action=null,success=null,activeSkill=null,inWater=()=>false,canMove=()=>true}){
  if(!definitions[p.sk]||!Number.isFinite(dt)||dt<0||!Number.isFinite(now))return;
  dt=Math.min(dt,.1);if(!p.previewState)reset(p,now,{playerMoving:player.moving,dead:player.dead});
  p.trail=p.trail.filter(t=>now-t.t<1300).slice(-24);
  const matching=!player.moving&&!player.dead&&!player.inside&&action?.skill===p.sk;
  const event=success?.skill===p.sk?success:null;
  if(event&&event.key!==p.seenSuccess){
   p.seenSuccess=event.key;
   if(p.sk==='mining'&&matching&&p.previewState==='dig')p.stateAt=now;
   if(p.sk==='fishing'&&!player.moving&&!player.dead&&!player.inside&&inWater(p.x,p.y)&&now-event.at<700)p.catchUntil=now+500;
  }
  if(player.dead){reset(p,now,{dead:true});return}
  if(player.moving||player.inside||(activeSkill&&activeSkill!==p.sk))p.catchUntil=0;
  let target=matching?action.target:anchor;
  if(p.catchUntil>now)target={x:p.x,y:p.y};
  const key=matching?action.key:null;
  if(key!==p.actionKey&&['climb','dig','dive'].includes(p.previewState))setState(p,'idle',now);
  if(key&&p.actionKey&&key!==p.actionKey)p.catchUntil=0;
  p.actionKey=key;
  let dx=target.x-p.x,dy=target.y-p.y,distance=Math.hypot(dx,dy);
  if(distance>150){p.x=anchor.x;p.y=anchor.y;reset(p,now,{playerMoving:player.moving});dx=target.x-p.x;dy=target.y-p.y;distance=Math.hypot(dx,dy)}
  p.moving=false;const arrived=distance<=5;
  if(!arrived){
   const definition=definitions[p.sk],airborne=p.sk==='woodcutting'&&(distance>48||p.previewState==='takeoff'||p.previewState==='glide'),speed=airborne?definition.glideSpeed:definition.speed;
   const step=Math.min(speed*dt,distance-3),vx=dx/(distance||1)*step,vy=dy/(distance||1)*step;
   const clear=(nx,ny)=>{const n=Math.max(1,Math.ceil(Math.hypot(nx-p.x,ny-p.y)/2));for(let i=1;i<=n;i++)if(!canMove(p.sk,p.x+(nx-p.x)*i/n,p.y+(ny-p.y)*i/n))return false;return true};
   for(const [nx,ny] of [[p.x+vx,p.y+vy],[p.x+vx,p.y],[p.x,p.y+vy]]){
    if(Math.hypot(nx-p.x,ny-p.y)>.001&&clear(nx,ny)){if(Math.abs(nx-p.x)>.1)p.face=nx>p.x?1:-1;p.x=nx;p.y=ny;p.moving=true;break}
   }
  }
  if(p.sk==='mining'){
   p.underground=!!player.moving||p.moving||!arrived;
   if(p.underground){
    setState(p,'burrow',now);
    if(p.moving&&now-p.lastTrailAt>=80){p.trail.push({x:p.x,y:p.y,t:now});p.lastTrailAt=now;if(p.trail.length>24)p.trail.shift()}
   }else if(p.previewState==='burrow')setState(p,'surface',now);
   else if(p.previewState==='surface'&&now-p.stateAt<640){} // Finish the supplied surfacing sequence.
   else setState(p,matching?'dig':'idle',now);
  }else if(p.sk==='woodcutting'){
   if(matching&&arrived)setState(p,'climb',now);
   else if(p.moving){
    if(p.previewState==='takeoff'&&now-p.stateAt<160){}
    else if(p.previewState==='takeoff'||p.previewState==='glide')setState(p,'glide',now);
    else if(distance>48)setState(p,'takeoff',now);
    else setState(p,'walk',now);
   }else if(p.previewState==='takeoff'||p.previewState==='glide')setState(p,'land',now);
   else if(p.previewState==='land'&&now-p.stateAt<160){}
   else setState(p,'idle',now);
  }else{
   const wet=!player.inside&&inWater(p.x,p.y);
   if(p.catchUntil>now&&wet)setState(p,'catch',now);
   else if(matching&&arrived&&wet)setState(p,'dive',now);
   else if(wet)setState(p,p.moving?'swim':'water-idle',now);
   else setState(p,p.moving?'walk':'idle',now);
  }
 }
 window.MyrrenSkillingPets={definitions,award,normalizeRemainders,reset,update};
})();
