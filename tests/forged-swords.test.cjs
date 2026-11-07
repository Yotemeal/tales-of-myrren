const assert=require('node:assert/strict'),crypto=require('node:crypto'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{const{game:g}=await require('./game-runtime.cjs')(),names=['bronze','iron','steel','cobalt','obsidianite','aether','starsteel'],levels=[1,10,20,30,40,55,70],attack=[1,3,6,12,17,22,30];for(let i=0;i<7;i++){const id=names[i]+'_sword',d=g.DEFS[id],bar='ing_'+names[i];assert(d);assert.equal(d.req,levels[i]);assert.equal(d.atk,attack[i]);g.adoptSave({v:3,xp:{mining:2e9,melee:2e9},inv:{[bar]:4,coins:789},eq:{},bag:[],bank:{[id]:3},notes:{[id]:9}});g.setForgeMat(d.mat);g.forge('sword');assert.equal(g.save.inv[bar],0);assert.equal(g.save.eq.weapon,id);assert.equal(g.save.inv.coins,789);assert.equal(g.save.bank[id],3);assert.equal(g.save.notes[id],9);const snap=JSON.parse(JSON.stringify(g.snap()));g.adoptSave(snap);assert.equal(g.save.eq.weapon,id)}
const priorSave={v:3,xp:{melee:g.xpTable[29]},eq:{weapon:'cobalt_sword'},bag:['cobalt_sword'],wear:{cobalt_sword:.2}};
g.adoptSave(priorSave);
g.beginSwing(1000);
assert.equal(g.me.tool,'fist');
g.resolveSwing(1110);
assert.equal(g.save.wear.cobalt_sword,.2);
assert.equal(g.snap().eq.weapon,'cobalt_sword');
g.equipFromBag(0);
assert.equal(g.save.bag.length,1);
g.save.xp.melee=g.xpTable[30];
g.me.pend=0;
g.beginSwing(2000);
assert.equal(g.me.tool,'sword');
g.resolveSwing(2110);
assert(g.save.wear.cobalt_sword>.2);
const{S,W,H}=await require('./wardrobe-harness.cjs')();assert(S.ready);const seen=new Set();for(const mat of S.order){const html=S.icon(mat,64),im=await loadImage(html.match(/src="([^"]+)"/)[1]);const c=createCanvas(64,64),x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,64,64).data;seen.add(crypto.createHash('sha256').update(d).digest('hex'));let opaque=0;for(let i=3;i<d.length;i+=4){assert(d[i]===0||d[i]===255);opaque+=!!d[i]}assert(opaque>80);for(const f of[-1,1])for(const angle of[-1.5,-.35,1]){const out=createCanvas(100,100),ctx=out.getContext('2d');assert(S.draw(ctx,mat,50,60,f,angle));const p=ctx.getImageData(0,0,100,100).data;assert(p.some((n,i)=>i%4===3&&n>0))}}assert.equal(seen.size,7);const naked=W.compose(null,[]);assert(naked);assert(H);console.log('PASS:seven forgeable swords at matching tier levels; four-ingot recipes; legacy attack values and save IDs retained; seven distinct icons and mirrored swing rendering.');})().catch(e=>{console.error(e);process.exitCode=1});
