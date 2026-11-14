/* Tales of Myrren V1: opt-in visual pose adapter. No gameplay state mutations. */
(function(global){
  'use strict';
  const FLAG = 'myrren-char-v1';
  const ARMOUR_SLOTS = ['head','body','hands','legs','boots','shield'];
  function enabled(search){
    const params = new URLSearchParams(search == null ? global.location.search : search);
    return params.has(FLAG);
  }
  function direction(o){
    return o.dv === 'u' ? 'back' : o.dv === 's' ? (o.f < 0 ? 'left' : 'right') : 'front';
  }
  function hasLegacyGear(o){
    if (Array.isArray(o.g) && o.g.some(v => Number(v) > 0)) return true;
    if (o.eq && ARMOUR_SLOTS.some(slot => o.eq[slot])) return true;
    return false;
  }
  function pose(o,now){
    const deathAge = Number.isFinite(o.deathAt) ? now-o.deathAt : -1;
    const hurtAge = Number.isFinite(o.hurtAt) ? now-o.hurtAt : -1;
    const swingAge = Number.isFinite(o.swingAt) ? now-o.swingAt : -1;
    let action = 'idle', period = 440;
    if (deathAge >= 0) { action='death'; period=100; }
    else if (hurtAge >= 0 && hurtAge < 220) { action='hurt'; period=90; }
    else if (swingAge >= 0 && swingAge < 320) { action=o.tool==='sword'?'sword':'punch'; period=80; }
    else if (o.moving) { action='walk'; period=130; }
    const elapsed = action==='death'?deathAge:action==='hurt'?hurtAge:
      action==='sword'||action==='punch'?swingAge:now;
    const frame = action==='death' ? Math.min(3,Math.floor(elapsed/period)) :
      Math.floor(Math.max(0,elapsed)/period)%4;
    return {direction:direction(o),action,frame,scale:1};
  }
  function draw(renderer,ctx,x,y,o,now){
    if (!enabled() || !renderer || !renderer.ready || hasLegacyGear(o)) return false;
    return renderer.draw(ctx,x,y,pose(o,now));
  }
  global.MyrrenAdventurerV1Preview={enabled,direction,hasLegacyGear,pose,draw};
})(typeof window!=='undefined'?window:globalThis);
