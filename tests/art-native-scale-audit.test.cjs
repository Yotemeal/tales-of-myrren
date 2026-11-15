'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pngDimensions,scaleAudit,auditDirectory}=require('../scripts/audit-art-native-scale.cjs');

function pngHeader(w,h) {
 const b=Buffer.alloc(24);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(b);
 b.writeUInt32BE(13,8);
 b.write('IHDR',12,'ascii');
 b.writeUInt32BE(w,16);
 b.writeUInt32BE(h,20);
 return b;
}

test('reads PNG dimensions and ignores unrelated PNGs',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-art-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(dir,'tree_alder.png'),pngHeader(96,96));
 fs.writeFileSync(path.join(dir,'ore_copper.png'),pngHeader(167,134));
 fs.writeFileSync(path.join(dir,'icon.png'),pngHeader(8,8));
 assert.deepEqual(pngDimensions(path.join(dir,'ore_copper.png')),{width:167,height:134});
 const rows=auditDirectory(dir);
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(r=>r.pixelAligned),[false,false]);
});

test('reports current world size and flags non-integer stretching/downsampling',()=>{
 const tree=scaleAudit('tree','tree_alder.png',96,96);
 assert.deepEqual([tree.render,tree.reason],['144x144','non-integer enlargement']);
 const ore=scaleAudit('ore','ore_copper.png',167,134);
 assert.deepEqual([ore.render,ore.reason],['24x19','downsampling loses source pixels']);
 assert.equal(scaleAudit('tree','new.png',144,144).pixelAligned,true);
 assert.equal(scaleAudit('ore','new.png',24,20).pixelAligned,true);
});

test('rejects truncated and malformed image headers',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-art-bad-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const p=path.join(dir,'bad.png');
 fs.writeFileSync(p,'not a png');
 assert.throws(()=>pngDimensions(p),/Truncated/);
 fs.writeFileSync(p,Buffer.alloc(24));
 assert.throws(()=>pngDimensions(p),/Invalid PNG/);
});
