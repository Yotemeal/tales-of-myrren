'use strict';
/**
 * Read-only resource-art scale audit. Does not change gameplay or sprites.
 * Run: node scripts/audit-art-native-scale.cjs [--json] [--strict]
 * World draw widths match resourceSprite() in public/myrren-environment.js.
 */
const fs = require('node:fs');
const path = require('node:path');

const RENDER_WIDTH = Object.freeze({tree:144, ore:24});
const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);

function pngDimensions(file) {
  const fd = fs.openSync(file, 'r');
  let header;
  try {
    header = Buffer.alloc(24);
    if (fs.readSync(fd, header, 0, 24, 0) !== 24) throw new Error('Truncated PNG: '+file);
  } finally { fs.closeSync(fd); }
  if (!header.subarray(0,8).equals(PNG_SIGNATURE) || header.toString('ascii',12,16)!=='IHDR')
    throw new Error('Invalid PNG signature/IHDR: '+file);
  const width = header.readUInt32BE(16), height=header.readUInt32BE(20);
  if (!width || !height) throw new Error('Invalid PNG dimensions: '+file);
  return {width,height};
}

function scaleAudit(type, name, width, height) {
  if (!RENDER_WIDTH[type]) throw new Error('Unknown resource type: '+type);
  const renderWidth = RENDER_WIDTH[type], scale=renderWidth/width;
  return {
    type, name, source:width+'x'+height,
    render:renderWidth+'x'+Math.round(height*scale),
    scale:Number(scale.toFixed(5)),
    pixelAligned:scale>=1 && Number.isInteger(scale),
    reason:scale<1?'downsampling loses source pixels':!Number.isInteger(scale)?'non-integer enlargement':'integer enlargement'
  };
}

function auditDirectory(dir) {
  return fs.readdirSync(dir).filter(n=>/^(tree|ore)_[\w-]+\.png$/.test(n)).sort().map(name=>{
    const type=name.startsWith('tree_')?'tree':'ore';
    const dimensions=pngDimensions(path.join(dir,name));
    return scaleAudit(type,name,dimensions.width,dimensions.height);
  });
}

function main(args=process.argv.slice(2)) {
  const rows=auditDirectory(path.resolve(__dirname,'../public/assets/resources'));
  if (args.includes('--json')) console.log(JSON.stringify({playerNative:'24x32',rows},null,2));
  else {
    console.log('Resource scale audit (world pixels before fixed 2x CSS camera scaling)');
    console.log('Asset                          Source    World     Scale    Result');
    rows.forEach(r=>console.log(r.name.padEnd(30)+' '+r.source.padEnd(9)+' '+r.render.padEnd(9)+' '+String(r.scale).padEnd(8)+' '+r.reason));
    console.log(rows.filter(r=>!r.pixelAligned).length+'/'+rows.length+' sprites require native-pixel art review; files unchanged.');
  }
  return args.includes('--strict') && rows.some(r=>!r.pixelAligned)?1:0;
}
if (require.main===module) process.exitCode=main();
module.exports={RENDER_WIDTH,pngDimensions,scaleAudit,auditDirectory,main};
