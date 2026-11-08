/* Kez V2 equipped sword: rigid angular motion about the dominant-hand grip.
 * Visual-only: does not modify attack cadence, hit detection, saves or item IDs.
 * 0-72 ms anticipation; 72-192 ms contact; 192-264 ms follow-through hold;
 * 264-320 ms controlled return to neutral, never a second reverse strike. */
(()=>{'use strict';
 const DURATION=320,NEUTRAL=-0.35,WINDUP=-0.90,CONTACT=0.70;
 const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
 const mix=(a,b,t)=>a+(b-a)*ease(t);
 function angle(age){
  if(!Number.isFinite(age)||age<0||age>=DURATION)return NEUTRAL;
  if(age<72)return mix(NEUTRAL,WINDUP,age/72);
  if(age<192)return mix(WINDUP,CONTACT,(age-72)/120);
  if(age<264)return CONTACT;
  return mix(CONTACT,NEUTRAL,(age-264)/56);
 }
 // The caller owns the fixed physical glove socket. Only a sword's rotation
 // changes, so the grip remains planted and the metal blade stays rigid.
 window.MyrrenKezV2SwordMotion=Object.freeze({angle,duration:DURATION});
})();
