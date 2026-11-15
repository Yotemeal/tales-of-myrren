/* Tales of Myrren — V19F isolated, native 24x32 character renderer.
 * Review-only V19F renderer: production entry remains on V19B.
 * The approved PNGs are loaded unchanged; no bounding-box auto-recentering,
 * pixel editing, old Kez fallback, or game/save mutation.
 */
(function () {
  'use strict';
  const CELL_W = 24;
  const CELL_H = 32;
  const FOOT_ROW = 30;
  const FRAME_MS = 110;
  const DIRECTIONS = ['front', 'left', 'right', 'back'];
  const URL_BASE = '/assets/myrren-v19f/';
  const assets = {
    walk: { image: new Image(), width: 144, height: 128, path: URL_BASE + 'myrren_walk_4x6_native.png?rev=hairclean1' },
    idle: { image: new Image(), width: 96, height: 32, path: URL_BASE + 'myrren_idle_4dir_native.png?rev=hairclean1' },
  };
  let status = 'loading';
  let loaded = 0;
  function dispatch(eventName) {
    if (typeof window.dispatchEvent === 'function' && typeof Event === 'function') {
      window.dispatchEvent(new Event(eventName));
    }
  }
  function fail(message) {
    if (status === 'error') return;
    status = 'error';
    console.error('Myrren V19F sprite error: ' + message);
    dispatch('myrren-v19f-error');
  }
  function onAssetLoaded(entry) {
    if (status === 'error') return;
    const image = entry.image;
    if (image.naturalWidth !== entry.width || image.naturalHeight !== entry.height) {
      fail('wrong dimensions: ' + entry.path);
      return;
    }
    loaded += 1;
    if (loaded === Object.keys(assets).length) {
      status = 'ready';
      dispatch('myrren-v19f-ready');
    }
  }
  function direction(o = {}) {
    if (o.dv === 'u') return 'back';
    if (o.dv === 's') return o.f < 0 ? 'left' : 'right';
    return 'front';
  }
  function pose(o = {}, now = 0) {
    const name = direction(o);
    const row = DIRECTIONS.indexOf(name);
    const moving = Boolean(o.moving);
    const phase = Number.isFinite(now) ? now : 0;
    const frame = moving ? ((Math.floor(phase / FRAME_MS) % 6) + 6) % 6 : 0;
    return { direction: name, row, frame, moving };
  }
  function draw(ctx, x, y, o = {}, now = 0) {
    if (status !== 'ready') return false;
    const p = pose(o, now);
    const sprite = p.moving ? assets.walk.image : assets.idle.image;
    const sx = (p.moving ? p.frame : p.row) * CELL_W;
    const sy = p.moving ? p.row * CELL_H : 0;
    // x and y are world-space centre and shared foot/ground anchor.
    // Do NOT crop visible pixel bounds; one source cell -> one destination cell.
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, sx, sy, CELL_W, CELL_H,
      Math.round(x) - CELL_W / 2, Math.round(y) - FOOT_ROW, CELL_W, CELL_H);
    ctx.restore();
    return true;
  }
  window.MyrrenV19FAtlas = Object.freeze({
    get ready() { return status === 'ready'; },
    get failed() { return status === 'error'; },
    get dimensions() { return { cellWidth: CELL_W, cellHeight: CELL_H, frames: 6, directions: 4, millisecondsPerFrame: FRAME_MS, footRow: FOOT_ROW }; },
    pose, draw,
  });
  for (const entry of Object.values(assets)) {
    entry.image.onload = () => onAssetLoaded(entry);
    entry.image.onerror = () => fail('load failure: ' + entry.path);
    entry.image.src = entry.path;
  }
})();
