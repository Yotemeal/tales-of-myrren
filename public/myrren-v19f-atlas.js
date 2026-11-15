/* Tales of Myrren — V19F isolated, native 24x32 character renderer.
 * Approved V19F walking, idle and unarmed punch renderer.
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
    walk: { image: new Image(), width: 144, height: 128, path: URL_BASE + 'myrren_walk_4x6_native.png?rev=approved3' },
    idle: { image: new Image(), width: 96, height: 32, path: URL_BASE + 'myrren_idle_4dir_native.png?rev=hairclean1' },
  };
  const punch = new Image();
  let punchReady = false;
  punch.onload = () => { punchReady = punch.naturalWidth === 336 && punch.naturalHeight === 144; };
  punch.src = URL_BASE + 'myrren_punch_4dir_native.png';
  const punchEnds = [55, 85, 120, 225, 270, 320];
  const movingPunch = new Image();
  let movingPunchReady = false;
  movingPunch.onload = () => {
    movingPunchReady = movingPunch.naturalWidth === 384 && movingPunch.naturalHeight === 864;
  };
  movingPunch.src = URL_BASE + 'myrren_punch_stride_4dir_native.png?rev=pants1';
  const movingPunchEnds = [55, 85, 110, 120, 220, 225, 270, 320];
  function canDrawPunch() {
    return punchReady;
  }
  const swordBody = new Image();
  const blades = new Image();
  swordBody.src = URL_BASE + 'myrren_sword_body_4dir.png';
  blades.src = '/swords-forged-v1.png';
  const bladeColumns = [2, 3, 4, 5, 7, 6, 8];
  const rightSword = [[11,27,22],[20,26,-62],[25,26,-78],[25,26,-78],
    [27,26,-88],[27,26,-88],[20,26,-70],[17,28,-68]];
  const frontSword = [[10,27,15],[12,25,15],[13,27,165],[13,27,165],
    [13,28,165],[13,28,165],[12,26,165],[10,29,15]];
  const rearSword = [[26,28,-32],[26,24,-36],[25,24,-21],[25,24,-12],
    [25,22,-5],[25,22,-5],[26,24,-17],[26,28,-32]];
  const swordGuards = [[[11,28,15],[11,28,15],[11,29,15],[11,29,15],[11,28,15],[11,28,15],[11,28,15]],[[17,28,68],[13,29,68],[12,27,68],[12,27,68],[12,27,68],[16,28,68],[14,28,68]],[[16,28,-68],[16,28,-68],[17,28,-68],[17,27,-68],[17,28,-68],[15,28,-68],[17,28,-68]],[[24,28,-32],[24,28,-32],[24,28,-32],[24,28,-32],[24,28,-32],[24,29,-32],[24,29,-32]]];
  function canDrawSword(o) {
    return o?.tool === 'sword'
      && bladeColumns.includes(o.mat)
      && swordBody.naturalWidth === 384 && swordBody.naturalHeight === 1008
      && blades.naturalWidth === 224 && blades.naturalHeight === 32;
  }
  function drawSword(ctx, x, y, o, now, age) {
    const {row, frame: step, moving} = pose(o, now);
    const attacking = age >= 0 && age < 320;
    const frame = attacking ? movingPunchEnds.findIndex(end => age < end) : 0;
    const sy = attacking ? (moving ? 4 + row * 6 + step : row) * 36 : moving ? row * 32 : 0;
    const sx = attacking ? frame * 48 : (moving ? step : row) * 24;
    const [gx, gy, angle] = attacking
      ? (row === 0 ? frontSword : row === 3 ? rearSword : rightSword)[frame]
      : swordGuards[row][moving ? step + 1 : 0];
    const hx = attacking && row === 1 ? 35 - gx : gx;
    const bladeAngle = attacking && row === 1 ? -angle : angle;
    const body = attacking ? swordBody : moving ? assets.walk.image : assets.idle.image;
    const insetX = attacking ? 0 : 6;
    const insetY = attacking ? 0 : 4;
    const width = attacking ? 48 : 24;
    const height = attacking ? 36 : 32;
    const bladeX = bladeColumns.indexOf(o.mat) * 32;
    const paintBlade = () => {
      ctx.save();
      ctx.translate(hx, gy);
      ctx.rotate(bladeAngle * Math.PI / 180);
      ctx.drawImage(blades, bladeX, 0, 32, 32, -16, -26, 32, 32);
      ctx.restore();
    };
    ctx.save();
    ctx.translate(Math.round(x) - 18, Math.round(y) - 34);
    ctx.imageSmoothingEnabled = false;
    if (row === 3) paintBlade();
    ctx.drawImage(body, sx, sy, width, height, insetX, insetY, width, height);
    if (row !== 3) {
      paintBlade();
      ctx.drawImage(body, sx + hx - insetX - 1, sy + gy - insetY - 1, 3, 3, hx - 1, gy - 1, 3, 3);
    }
    ctx.restore();
    return true;
  }
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
    const attackAge = now - (o.swingAt ?? -99999);
    if (o.tool === 'sword') return canDrawSword(o, now) && drawSword(ctx, x, y, o, now, attackAge);
    if (canDrawPunch(o) && attackAge >= 0 && attackAge < 320) {
      const moving = Boolean(o.moving) && movingPunchReady;
      const frame = moving
        ? movingPunchEnds.findIndex(end => attackAge < end)
        : punchEnds.findIndex(end => attackAge < end) + 1;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const {row, frame: step} = pose(o, now);
      const sourceRow = moving ? row * 6 + step : row;
      ctx.drawImage(moving ? movingPunch : punch, frame * 48, sourceRow * 36, 48, 36,
        Math.round(x) - 18, Math.round(y) - 34, 48, 36);
      ctx.restore();
      return true;
    }
    const p = pose(attackAge >= 0 && attackAge < 320 ? {...o, moving: false} : o, now);
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
    version: "V19F",
    get ready() { return status === 'ready'; },
    get failed() { return status === 'error'; },
    get dimensions() { return { cellWidth: CELL_W, cellHeight: CELL_H, frames: 6, directions: 4, millisecondsPerFrame: FRAME_MS, footRow: FOOT_ROW }; },
    pose, draw, canDrawPunch, canDrawSword,
  });
  for (const entry of Object.values(assets)) {
    entry.image.onload = () => onAssetLoaded(entry);
    entry.image.onerror = () => fail('load failure: ' + entry.path);
    entry.image.src = entry.path;
  }
})();
