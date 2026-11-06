/* Small simulation-only rock system. No rewards or animation-driven damage. */
(()=>{'use strict';
 const finite=(...values)=>values.every(Number.isFinite);
 // First contact with a circle, not just proximity to the endpoint: fast
 // projectiles cannot skip over the player between simulation frames.
 function circleContact(ax,ay,bx,by,cx,cy,r){
  const dx=bx-ax,dy=by-ay,fx=ax-cx,fy=ay-cy,a=dx*dx+dy*dy,c=fx*fx+fy*fy-r*r;
  if(c<=0)return 0;if(!a)return null;
  const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;if(disc<0)return null;
  const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
 }
 function create({capacity=32,collisionStep=2}={}){
  if(!Number.isInteger(capacity)||capacity<1||capacity>256||!finite(collisionStep)||collisionStep<=0)throw Error('Invalid rock-system limits');
  const rocks=[];
  function launch({x,y,targetX,targetY,speed,maxDistance,owner=null}){
   if(rocks.length>=capacity||!finite(x,y,targetX,targetY,speed,maxDistance)||speed<=0||maxDistance<=0||maxDistance>2000)return false;
   const dx=targetX-x,dy=targetY-y,d=Math.hypot(dx,dy);if(d<.001)return false;
   rocks.push({x,y,vx:dx/d*speed,vy:dy/d*speed,speed,remaining:maxDistance,owner});return true;
  }
  function update(dt,{target,isBlocked=()=>false,onHit=()=>{}}={}){
   if(!finite(dt)||dt<=0)return;
   // Process a snapshot so callbacks can clear the system on death safely.
   for(const rock of rocks.slice()){
    const index=rocks.indexOf(rock);if(index<0)continue;
    const distance=Math.min(rock.remaining,rock.speed*dt),dx=rock.vx/rock.speed*distance,dy=rock.vy/rock.speed*distance,bx=rock.x+dx,by=rock.y+dy;
    let wall=null;const steps=Math.max(1,Math.ceil(distance/collisionStep));
    for(let i=0;i<=steps;i++){const t=i/steps;if(isBlocked(rock.x+dx*t,rock.y+dy*t)){wall=t;break}}
    const hit=target&&finite(target.x,target.y,target.radius)&&target.radius>=0?circleContact(rock.x,rock.y,bx,by,target.x,target.y,target.radius):null;
    if(wall!==null&&(hit===null||wall<=hit)){rocks.splice(index,1);continue}
    if(hit!==null){rocks.splice(index,1);onHit(rock);continue}
    rock.x=bx;rock.y=by;rock.remaining-=distance;
    if(rock.remaining<=.00001)rocks.splice(index,1);
   }
  }
  return {launch,update,clear:()=>{rocks.length=0},get rocks(){return rocks.slice()}};
 }
 window.MyrrenCraterRocks={create,circleContact};
})();
