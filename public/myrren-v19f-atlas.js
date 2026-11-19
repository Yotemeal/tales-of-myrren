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
  // The hit resolves at 110 ms. Each moving pose gets at least two 60 Hz refreshes.
  const strideAttackEnds = [35, 75, 110, 145, 190, 230, 275, 320];
  function canDrawPunch() {
    return punchReady;
  }
  const swordBody = new Image();
  const blades = new Image();
  swordBody.src = URL_BASE + 'myrren_sword_body_polished.png?rev=2';
  blades.src = URL_BASE + 'sword_blades.png';
  const bladeColumns = [2, 3, 4, 5, 7, 6, 8];
  const rightSword = [[11,27,38],[20,26,32],[25,26,-38],[25,26,-100],[27,26,-115],[27,26,-94],[20,26,-81],[16,29,-68]];
  const frontSword = [[10,27,15],[12,25,22],[13,27,78],[13,27,151],[13,28,165],[13,28,138],[12,26,76],[10,29,25]];
  const rearSword = [[27,28,-32],[26,25,-65],[25,24,-58],[25,24,-51],[25,22,-44],[25,22,-41],[26,25,-36],[25,29,-32]];
  const swordGuards = [[[11,28,15],[11,28,15],[11,29,15],[11,29,15],[11,28,15],[11,28,15],[11,28,15]],[[17,28,68],[13,29,68],[12,27,68],[12,27,68],[12,27,68],[16,28,68],[14,28,68]],[[16,28,-68],[16,28,-68],[17,28,-68],[17,27,-68],[17,28,-68],[15,28,-68],[17,28,-68]],[[24,28,-32],[24,28,-32],[24,28,-32],[24,28,-32],[24,28,-32],[24,29,-32],[24,29,-32]]];
  function swordLean(row, frame) {
    const side = row === 1 || row === 2;
    return {
      lean: (side ? [-1,-2,0,2,2,1,0,0] : [0,-1,-1,1,1,0,0,0])[frame]
        * (row === 1 || row === 3 ? -1 : 1),
      drop: (row === 3 ? [0,1,0,-1,-1,0,0,0] : [0,-1,-1,1,1,1,0,0])[frame]
    };
  }
  function equipmentPose(o) {
    const age = o.now - o.swingAt;
    if (!canDrawSword(o) || !(age >= 0 && age < 320)) return {lean:0, drop:0, attackFrame:-1};
    const attackFrame = strideAttackEnds.findIndex(end => age < end);
    return {...swordLean(pose(o,o.now).row, attackFrame), attackFrame};
  }
  function canDrawSword(o) {
    return o?.tool === 'sword'
      && bladeColumns.includes(o.mat)
      && swordBody.naturalWidth === 384 && swordBody.naturalHeight === 1008
      && blades.naturalWidth === 224 && blades.naturalHeight === 32;
  }
  function drawSword(ctx, x, y, o, now, age) {
    const {row, frame: step, moving} = pose(o, now);
    const attacking = age >= 0 && age < 320;
    const frame = attacking ? strideAttackEnds.findIndex(end => age < end) : 0;
    const sy = attacking ? (moving ? 4 + row * 6 + step : row) * 36 : moving ? row * 32 : 0;
    const sx = attacking ? frame * 48 : (moving ? step : row) * 24;
    const [gx, gy, angle] = attacking
      ? (row === 0 ? frontSword : row === 3 ? rearSword : rightSword)[frame]
      : swordGuards[row][moving ? step + 1 : 0];
    let hx = attacking && row === 1 ? 35 - gx : gx;
    let hy = gy;
    if (attacking) {
      const shift = swordLean(row, frame);
      hy += Math.round(shift.drop * Math.min(1, (31 - gy) / 7));
      hx += Math.round(shift.lean * Math.min(1, (31 - hy) / 7));
    }
    const bladeAngle = attacking && row === 1 ? -angle : angle;
    const body = attacking ? swordBody : moving ? assets.walk.image : assets.idle.image;
    const insetX = attacking ? 0 : 6;
    const insetY = attacking ? 0 : 4;
    const width = attacking ? 48 : 24;
    const height = attacking ? 36 : 32;
    const bladeX = bladeColumns.indexOf(o.mat) * 32;
    const paintBlade = () => {
      ctx.save();
      ctx.translate(hx, hy);
      // Preview angles use the inverse transform convention.
      ctx.rotate(-bladeAngle * Math.PI / 180);
      // Facing away, the blade points into the scene at contact. Shorten
      // its projection about the grip while retaining its full pixel width.
      const length = row === 3 && attacking ? [32,32,28,23,21,24,29,32][frame] : 32;
      ctx.drawImage(blades, bladeX, 0, 32, 32, -16, -Math.round(26*length/32), 32, length);
      ctx.restore();
    };
    ctx.save();
    ctx.translate(Math.round(x) - 18, Math.round(y) - 34);
    ctx.imageSmoothingEnabled = false;
    if (row === 3) paintBlade();
    ctx.drawImage(body, sx, sy, width, height, insetX, insetY, width, height);
    // Lay the breastplate beneath the blade and the near gripping fingers.
    if (o.g?.[1]) window.MyrrenKezV2Equipment?.nativeLayers(ctx,18,34,{...o,now},'plate');
    if (row === 3 && attacking && frame !== 7) {
      // The rear sleeve occludes the hilt. Show fingertips at its distal edge.
      ctx.fillStyle = '#ce855c';
      ctx.fillRect(hx, hy, 2, 1);
    }
    if (row !== 3) {
      paintBlade();
      ctx.drawImage(body, sx + hx - insetX - 1, sy + hy - insetY - 1, 3, 3, hx - 1, hy - 1, 3, 3);
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
    const phase = Number.isFinite(o.strideMs) ? o.strideMs : Number.isFinite(now) ? now : 0;
    const frame = moving ? ((Math.floor(phase / FRAME_MS) % 6) + 6) % 6 : 0;
    return { direction: name, row, frame, moving };
  }
  function draw(ctx, x, y, o = {}, now = 0) {
    if (status !== 'ready') return false;
    const attackAge = now - (o.swingAt ?? -99999);
    if (canDrawSword(o)) return drawSword(ctx, x, y, o, now, attackAge);
    if ((o.tool === 'fist' || !o.tool) && canDrawPunch(o) && attackAge >= 0 && attackAge < 320) {
      const moving = Boolean(o.moving) && movingPunchReady;
      const frame = moving
        ? strideAttackEnds.findIndex(end => attackAge < end)
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
    version: "V19F",
    get ready() { return status === 'ready'; },
    get failed() { return status === 'error'; },
    get dimensions() { return { cellWidth: CELL_W, cellHeight: CELL_H, frames: 6, directions: 4, millisecondsPerFrame: FRAME_MS, footRow: FOOT_ROW }; },
    pose, draw, equipmentPose, canDrawPunch, canDrawSword,
  });
  for (const entry of Object.values(assets)) {
    entry.image.onload = () => onAssetLoaded(entry);
    entry.image.onerror = () => fail('load failure: ' + entry.path);
    entry.image.src = entry.path;
  }
})();
