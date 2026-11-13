/** Approved Tales of Myrren V1 compact character. Opt-in renderer, not wired to live game. */
(function (global) {
  'use strict';
  const DIRECTIONS = ['front', 'right', 'back', 'left'];
  const ACTIONS = ['idle', 'walk', 'punch', 'sword', 'hurt', 'death'];
  class MyrrenAdventurerV1 {
    constructor(url = '/assets/characters/myrren-adventurer-v1/myrren_adventurer_v1_32x40.png') {
      this.image = new Image();
      this.ready = false;
      this.failed = false;
      this.image.onload = () => {
        this.ready = this.image.naturalWidth === 768 && this.image.naturalHeight === 160;
        this.failed = !this.ready;
      };
      this.image.onerror = () => { this.ready = false; this.failed = true; };
      this.image.src = url;
    }
    draw(ctx, feetX, feetY, {direction = 'front', action = 'idle', frame = 0, scale = 1} = {}) {
      if (!this.ready || !ctx || !Number.isFinite(feetX) || !Number.isFinite(feetY)) return false;
      const d = DIRECTIONS.indexOf(direction), a = ACTIONS.indexOf(action);
      if (d < 0 || a < 0 || !Number.isInteger(frame) || frame < 0 || frame > 3 ||
          !Number.isInteger(scale) || scale < 1) return false;
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      try {
        ctx.drawImage(this.image, (a * 4 + frame) * 32, d * 40, 32, 40,
          Math.round(feetX) - 16 * scale, Math.round(feetY) - 39 * scale,
          32 * scale, 40 * scale);
      } finally { ctx.imageSmoothingEnabled = smoothing; }
      return true;
    }
  }
  global.MyrrenAdventurerV1 = MyrrenAdventurerV1;
})(typeof window !== 'undefined' ? window : globalThis);
