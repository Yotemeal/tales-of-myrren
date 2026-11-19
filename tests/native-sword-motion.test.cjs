'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {Image, createCanvas} = require('@napi-rs/canvas');

test('equipped V19F players keep the native body and stride through contact and recovery', async () => {
  const images = [];
  class Asset extends Image {
    set src(url) {
      this.url = url;
      super.src = fs.readFileSync('public' + url.split('?')[0]);
      images.push(this);
    }
  }
  const window = {MyrrenKezV2Atlas: {draw() { assert.fail('unexpected legacy body'); }}};
  const scope = {window, Image: Asset, console};
  const run = file => vm.runInNewContext(fs.readFileSync('public/' + file, 'utf8'), scope);
  run('myrren-v19f-atlas.js');
  await Promise.all(images.map(image => image.decode()));
  window.MyrrenV19BAtlas = window.MyrrenV19FAtlas;
  run('myrren-v19b-optin-game-bridge.js');
  const ctx = createCanvas(80, 80).getContext('2d');
  let body;
  const drawImage = ctx.drawImage.bind(ctx);
  ctx.drawImage = (image, ...args) => {
    if (image.url.includes('sword_body') && args[2] === 48) body = args;
    drawImage(image, ...args);
  };
  const directions = [['d', 1], ['s', -1], ['s', 1], ['u', 1]];
  for (const [row, [dv, f]] of directions.entries()) {
    for (const moving of [false, true]) {
      for (const mat of [2, 3, 4, 5, 7, 6, 8]) {
        const state = {tool:'sword', mat, dv, f, moving, isMe:1,
          g:[2,3,4,5,6,7], hurtAt:1040, deathAt:null, swingAt:1000};
        for (const [frame, age] of [0,35,75,110,145,190,230,275].entries()) {
          body = null;
          window.MyrrenKezV2Atlas.draw(ctx, 40, 50, state, 1000 + age);
          const step = Math.floor((1000 + age) / 110) % 6;
          assert.deepEqual(body.slice(0,4), [frame*48,(moving ? 4+row*6+step : row)*36,48,36]);
        }
        body = null;
        window.MyrrenKezV2Atlas.draw(ctx, 40, 50, state, 1320);
        assert.equal(body, null, 'return to guard at the end of recovery');
      }
    }
  }
});

test('authored sword poses keep the stride pixels and the other six blades intact', async () => {
  const {loadImage} = require('@napi-rs/canvas');
  async function pixels(file) {
    const im = await loadImage('public/' + file);
    const c = createCanvas(im.width, im.height).getContext('2d');
    c.drawImage(im, 0, 0);
    return c;
  }
  const base = 'assets/myrren-v19f/';
  const before = await pixels(base+'myrren_sword_body_4dir.png');
  const after = await pixels(base+'myrren_sword_body_polished.png');
  for (let row = 0; row < 28; row++) {
    assert.deepEqual(after.getImageData(0,row*36+31,384,5).data,
      before.getImageData(0,row*36+31,384,5).data);
  }
  const oldBlades = await pixels('swords-forged-v1.png');
  const newBlades = await pixels(base+'sword_blades.png');
  assert.deepEqual(newBlades.getImageData(32,0,192,32).data, oldBlades.getImageData(32,0,192,32).data);
  const gear = await pixels(base+'chest_shield_native.png');
  for (let band = 0; band < 35; band++) {
    for (let cell = 0; cell < 8; cell++) {
      const data = gear.getImageData(cell*8,band*8,8,8).data;
      const alpha = data.filter((_,index) => index%4 === 3);
      assert(alpha.includes(255) && alpha.includes(0));
      assert(alpha.every(a => a===0 || a===255));
    }
  }
});
