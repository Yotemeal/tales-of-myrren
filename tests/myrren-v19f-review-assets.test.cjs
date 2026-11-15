'use strict';
/**
 * Production V19F native pixel locks.
 *
 * An earlier version of this test treated the historical V19E→V19F *review*
 * generator as the expected production walking atlas. The current, separately
 * approved V19F walking asset was refined later, so that expectation was stale.
 * Compare live files to their own approved production manifest; never mutate
 * the character art to match a superseded review candidate.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {decode,build,SOURCE,OUT,W,H}=require('../scripts/build-v19f-review.cjs');
const root=path.resolve(__dirname,'../public/assets');
const current=path.join(root,'myrren-v19f');
const legacy=path.join(root,'myrren-v19b');
const manifest=JSON.parse(fs.readFileSync(path.join(current,'manifest.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const meta=[
  ['walk_atlas','walk',[144,128]],
  ['idle_atlas','idle',[96,32]],
  ['front_master','master',[24,32]]
];
const image=(key)=>decode(fs.readFileSync(path.join(current,manifest[key].file)));
const rgba=(im,x,y)=>Array.from(im.rgba.subarray((y*im.width+x)*4,(y*im.width+x)*4+4));
function frame(im,row,col){
  const pixels=Buffer.alloc(W*H*4);
  for(let y=0;y<H;y++)im.rgba.copy(pixels,y*W*4,((row*H+y)*im.width+col*W)*4,((row*H+y)*im.width+col*W+W)*4);
  return pixels;
}

test('the approved production V19F atlas, idle and front master match immutable manifest hashes',()=>{
  assert.deepEqual(manifest.native_frame,[24,32]);
  assert.equal(manifest.walk_atlas.milliseconds_per_frame,110);
  assert.deepEqual(manifest.walk_atlas.rows,['front','left','right','back']);
  assert.deepEqual(manifest.idle_atlas.order,['front','left','right','back']);
  for(const [slot,rawKey,dimensions] of meta){
    const p=path.join(current,manifest[slot].file);
    const data=fs.readFileSync(p);
    const decoded=decode(data);
    assert.deepEqual([decoded.width,decoded.height],dimensions,slot+' native dimensions');
    assert.equal(sha(data),manifest[slot].sha256,slot+' byte checksum');
    assert.equal(sha(decoded.rgba),manifest.raw_rgba_sha256[rawKey],slot+' raw pixel checksum');
  }
});

test('approved front master is identical to front idle and retains the intended eye pixels',()=>{
  const idle=image('idle_atlas'),front=image('front_master');
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)
    assert.deepEqual(rgba(idle,x,y),rgba(front,x,y),'front idle/master mismatch at '+x+','+y);
  for(const [x,y] of [[8,13],[9,13],[8,14],[8,15],[14,13],[15,13],[15,14],[15,15]])
    if(!([[9,14],[9,15],[14,14],[14,15]].some(([a,b])=>a===x&&b===y)))
      assert.deepEqual(rgba(front,x,y),[254,254,254,255]);
  for(const [x,y] of [[9,14],[9,15],[14,14],[14,15]])
    assert.deepEqual(rgba(front,x,y),[25,22,16,255]);
});

test('approved walk retains variation, native binary alpha and exact per-frame geometry',()=>{
  const walk=image('walk_atlas'),idle=image('idle_atlas'),front=image('front_master');
  for(const im of [walk,idle,front])
    for(let a=3;a<im.rgba.length;a+=4)
      assert([0,255].includes(im.rgba[a]),'non-binary alpha in approved native art');
  for(let row=0;row<4;row++){
    const poses=new Set();
    for(let col=0;col<6;col++){
      const pixels=frame(walk,row,col);
      assert.equal(pixels.length,W*H*4);
      poses.add(sha(pixels));
    }
    assert(poses.size>=4,'approved walking direction '+row+' lost its animation variation');
  }
});

test('locked V19B originals and historical review generator remain reproducible',t=>{
  const names={walk:'myrren_walk_4x6_native.png',idle:'myrren_idle_4dir_native.png',master:'myrren_front_game_ready_24x32.png'};
  for(const [key,filename] of Object.entries(names))
    assert.equal(sha(fs.readFileSync(path.join(legacy,filename))),SOURCE[key],key+' historical source changed');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-review-lock-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const candidate=build(legacy,dir);
  for(const [key,filename] of Object.entries(names)){
    const output=decode(fs.readFileSync(candidate.paths[key]));
    assert.equal(sha(output.rgba),OUT[key],'historical V19F review generator changed: '+filename);
    assert.ok(output.rgba.equals(candidate[key].rgba),'generator output changed: '+filename);
  }
});
