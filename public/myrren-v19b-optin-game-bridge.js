/* V19B opt-in gameplay preview bridge. Loaded ONLY by character-v19b-game-preview.html.
 * The game's resolved local death/hurt state is passed in renderer options on this
 * feature branch. Gear, combat, damage and death always use the legacy art path;
 * accepted V19B is used only for unarmed, unequipped walking and idle poses.
 * No save, camera, collision, or network state is changed here.
 */
(() => {
  'use strict';
  const legacy = window.MyrrenKezV2Atlas;
  const native = window.MyrrenV19BAtlas;
  if (!legacy || !native || typeof legacy.draw !== 'function' || typeof native.draw !== 'function') {
    console.error('Missing character renderer for V19B opt-in preview');
    return;
  }
  if (legacy.__myrrenV19BPreviewActive) return;
  const oldDraw = legacy.draw.bind(legacy);
  const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let enabled = true;

  function eligible(o, now) {
    if (!o || !Number.isFinite(now)) return false;
    if (o.tool !== 'fist') return false;
    if (!Array.isArray(o.g) || o.g.length !== 6 || o.g.some(v => v !== 0)) return false;
    // With no resolved death timestamp, prefer the working older renderer.
    // This also excludes non-game draws such as the older gear portrait.
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
      // Do not silently replace an approved sprite with legacy character art
      // if the locked new atlas cannot be loaded. The preview displays an error.
      return native.draw(ctx, x, y, o, now);
    }
    return oldDraw(ctx, x, y, o, now);
  };
  legacy.__myrrenV19BPreviewActive = true;
  window.MyrrenV19BGameplayPreview = Object.freeze({
    get enabled() { return enabled; },
    setEnabled(value) { enabled = Boolean(value); return enabled; },
    eligible,
  });
})();
