/* Tales of Myrren — V19B compatible character bridge.
 * Loaded by the production entry only after gate checks succeed.
 * Keep the existing Kez V2 renderer for gear, combat, death and hurt,
 * and whenever the new approved native sprite assets aren't ready.
 * ?character=legacy is an emergency visual rollback without altering saves.
 */
(() => {
  'use strict';
  const legacy = window.MyrrenKezV2Atlas;
  const native = window.MyrrenV19BAtlas;
  if (!legacy || !native || typeof legacy.draw !== 'function' || typeof native.draw !== 'function') {
    console.error('V19B character bridge unavailable; existing game renderer remains active');
    return;
  }
  if (legacy.__myrrenV19BPreviewActive) return;

  const originalDraw = legacy.draw.bind(legacy);
  const forcedLegacy = /(?:^|[?&])character=legacy(?:&|$)/i.test(window.location?.search || '');
  const owns = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  let enabled = !forcedLegacy;
  let warned = false;

  function eligible(o, now) {
    if (!o || !Number.isFinite(now)) return false;
    if (o.tool !== 'fist') return false;
    if (!Array.isArray(o.g) || o.g.length !== 6 || o.g.some(v => v !== 0)) return false;
    // Local death/hurt timestamps are resolved in drawKezV2 before this bridge.
    // Old portraits and unrelated render calls lack that state, so stay legacy.
    if (!owns(o, 'deathAt') || !owns(o, 'hurtAt')) return false;
    if (o.dead || o.deathAt != null) return false;
    const attackAge = now - (o.swingAt ?? -99999);
    if (!Number.isFinite(attackAge) || (attackAge >= 0 && attackAge < 320)) return false;
    const hurtAge = now - o.hurtAt;
    if (!Number.isFinite(hurtAge) || (hurtAge >= 0 && hurtAge < 220)) return false;
    return true;
  }
  legacy.draw = function (ctx, x, y, o, now) {
    if (enabled && eligible(o, now)) {
      if (native.ready) return native.draw(ctx, x, y, o, now);
      if (native.failed && !warned) {
        warned = true;
        console.error('V19B artwork failed to load; retaining original character rendering');
        window.dispatchEvent?.(new Event('myrren-v19b-fallback'));
      }
    }
    return originalDraw(ctx, x, y, o, now);
  };
  legacy.__myrrenV19BPreviewActive = true;
  window.MyrrenV19BGameplayPreview = Object.freeze({
    get enabled() { return enabled; },
    setEnabled(value) { enabled = !forcedLegacy && Boolean(value); return enabled; },
    eligible,
  });
})();