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
  const nativeName = native.version === 'V19F' ? 'V19F' : 'V19B';
  let enabled = !forcedLegacy;
  let warned = false;

  // Render-path QA counts the *actual* game player, not isolated atlas calls.
  // This never changes gameplay, storage, equipment or network state.
  const local = {
    nativeFrames: 0, legacyFrames: 0, lastRenderer: 'not rendered',
    lastReason: 'not rendered', lastTool: '', lastGear: []
  };
  function ineligibleReason(o, now) {
    if (!o || !Number.isFinite(now)) return 'invalid frame';
    // V19F supplies the body beneath world-space gear and hurt/death effects.
    // Historical V19B preview pages only contain the unarmed walk atlas.
    if (native.version === 'V19F' && Array.isArray(o.g) && o.g.length === 6
        && ['fist', '', 'sword', 'axe', 'pick', 'rod', 'net'].includes(o.tool)) return '';
    // Multiplayer action code 0 means no held tool, represented as ''.
    if (!(o.tool === 'fist' || native.canDrawSword?.(o, now) || (!o.isMe && o.tool === ''))) return 'tool: ' + String(o.tool);
    if (!Array.isArray(o.g) || o.g.length !== 6) return 'unknown equipment state';
    if (o.g.some(v => v !== 0)) return 'equipped armour/shield';
    if (!owns(o, 'deathAt') || !owns(o, 'hurtAt')) return 'unresolved player state';
    if (o.dead || o.deathAt != null) return 'death state';
    if (o.isMe && o.deathAt !== null) return 'local death state missing';
    const attackAge = now - (o.swingAt ?? -99999);
    if (!Number.isFinite(attackAge) || (attackAge >= 0 && attackAge < 320 && !native.canDrawPunch)) return 'attack animation';
    const hurtAge = now - o.hurtAt;
    if (!Number.isFinite(hurtAge) || (hurtAge >= 0 && hurtAge < 220)) return 'hurt animation';
    return '';
  }
  function eligible(o, now) {
    return ineligibleReason(o, now) === '';
  }
  legacy.draw = function (ctx, x, y, o, now) {
    const isLocal = Boolean(o?.isMe);
    let reason = !enabled ? 'legacy requested' : ineligibleReason(o, now);
    if (!reason) {
      if (native.ready) {
        if (native.draw(ctx, x, y, o, now) === true) {
          if (isLocal) {
            local.nativeFrames++;
            local.lastRenderer = nativeName;
            local.lastReason = 'native 24x32';
            local.lastTool = String(o.tool);
            local.lastGear = o.g.slice();
          }
          return true;
        }
        reason = 'V19B draw unsuccessful';
      } else {
        reason = native.failed ? 'V19B sprite load failed' : 'loading V19B sprites';
      }
      if (native.failed && !warned) {
        warned = true;
        console.error('V19B artwork failed to load; retaining original character rendering');
        window.dispatchEvent?.(new Event('myrren-v19b-fallback'));
      }
    }
    if (isLocal) {
      local.legacyFrames++;
      local.lastRenderer = 'Legacy';
      local.lastReason = reason;
      local.lastTool = String(o.tool);
      local.lastGear = Array.isArray(o.g) ? o.g.slice() : [];
    }
    return originalDraw(ctx, x, y, o, now);
  };
  legacy.__myrrenV19BPreviewActive = true;
  window.MyrrenV19BGameplayPreview = Object.freeze({
    get enabled() { return enabled; },
    setEnabled(value) { enabled = !forcedLegacy && Boolean(value); return enabled; },
    eligible,
    drawsSword(o, now) {
      return enabled && native.ready && Boolean(native.canDrawSword?.(o, now)) && eligible(o, now);
    },
    drawsPunch(o, now) {
      const age = now - (o?.swingAt ?? -99999);
      return o?.tool !== 'sword' && enabled && native.ready && age >= 0 && age < 320
        && Boolean(native.canDrawPunch?.(o)) && eligible(o, now);
    },
    get diagnostics() {
      return {
        nativeFrames: local.nativeFrames, legacyFrames: local.legacyFrames,
        lastRenderer: local.lastRenderer, lastReason: local.lastReason,
        lastTool: local.lastTool, lastGear: local.lastGear.slice()
      };
    },
  });

  // An explicitly requested, temporary visual diagnostic for real phones.
  // Example: ?utm_source=chatgpt.com&character_debug=1
  if (/(?:^|[?&])character_debug=1(?:&|$)/.test(window.location?.search || '')
      && typeof document !== 'undefined') {
    const attach = () => {
      if (document.getElementById('myrren-character-diagnostic')) return;
      const box = document.createElement('div');
      box.id = 'myrren-character-diagnostic';
      box.setAttribute('role','status');
      Object.assign(box.style, {
        position:'fixed', top:'7px', left:'7px', zIndex:'99999',
        padding:'5px 7px', borderRadius:'6px', background:'rgba(14,22,25,.90)',
        color:'#fff', font:'11px/1.4 monospace', pointerEvents:'none',
        maxWidth:'75vw', whiteSpace:'pre-wrap'
      });
      document.body.appendChild(box);
      const update = () => {
        const d = window.MyrrenV19BGameplayPreview.diagnostics;
        box.textContent = 'CHARACTER: ' + d.lastRenderer + '  [' + d.lastReason + ']'
          + '\nTool: ' + d.lastTool + '  Gear: ' + d.lastGear.join(',')
          + '\nNative frames: ' + d.nativeFrames + ' / old: ' + d.legacyFrames;
      };
      update();
      window.setInterval(update, 500);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach, {once:true});
    } else attach();
  }
})();