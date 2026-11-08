/* Opt-in bridge from authored animated hand socket to existing forged swords.
 * Art-only: does not change combat cadence, damage or network messages.
 * Only load in the isolated authored-character preview until art is approved.
 */
(()=>{'use strict';
function create(swords,motion){
 if(!swords||typeof swords.draw!=='function'||!motion||typeof motion.angle!=='function')
  throw Error('Forged sword and sword-motion modules are required');
 return function paint(ctx,socket){
  if(!socket||!Number.isFinite(socket.x)||!Number.isFinite(socket.y))
   throw Error('Invalid authored hand socket');
  if(!Number.isFinite(socket.material)||!swords.ready)return false;
  const facing=socket.direction==='left'?-1:1;
  const angle=socket.pose==='attack'?motion.angle(socket.age):motion.angle(-1);
  // Existing forged sword renderer is already anchored at its hilt.
  // No baked-in slash, second sprite or independently moving weapon origin.
  return swords.draw(ctx,socket.material,socket.x,socket.y,facing,angle,.6);
 };
}
window.MyrrenAuthoredSwordBridge=Object.freeze({create});
})();
