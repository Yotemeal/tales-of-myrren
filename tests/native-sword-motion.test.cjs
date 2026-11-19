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
