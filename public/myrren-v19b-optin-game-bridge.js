/* V19B in-game integration preview. ONLY load on character-v19b-game-preview.html.
 * Unarmed, unequipped walking / standing uses the locked V19B native atlas.
 * All equipped, tool, attack and death states keep the existing Kez V2 pipeline.
 * No game state, saves, movement or camera modifications.
 */
(() => {
  'use strict';
  const legacy=window.MyrrenKezV2Atlas;
  const native=window.MyrrenV19BAtlas;
  if (!legacy||!native||typeof legacy.draw!=='function') {
    console.error('Missing renderer for V19B opt-in gameplay preview');
    return;
  }
  if (legacy.__myrrenV19BPreviewActive) return;
  const drawLegacy=legacy.draw.bind(legacy);
  function eligible(o,now) {
    if (!o || !Number.isFinite(now)) return false;
    if (o.tool && o.tool!=='fist') return false;
    if (o.deathAt!=null || o.dead) return false;
    if (Array.isArray(o.g) && o.g.some(v=>Number(v)>0)) return false;
    const attackAge=now-(o.swingAt??-99999);
    if (attackAge>=0 && attackAge<320) return false;
    return true;
  }
  legacy.draw=function(ctx,x,y,o,now) {
    if (eligible(o,now)) {
      // Intentionally fail visibly rather than silently showing older artwork
      // when the locked V19B sprites are missing or loading incorrectly.
      return native.draw(ctx,x,y,o,now);
    }
    return drawLegacy(ctx,x,y,o,now);
  };
  legacy.__myrrenV19BPreviewActive=true;
  window.MyrrenV19BGameplayPreview=Object.freeze({enabled:true,eligible});
})();
