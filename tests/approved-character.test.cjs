const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const sb={window:{},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(sb);vm.runInContext(fs.readFileSync('public/approved-character.js','utf8'),sb);
 const H=sb.window.MyrrenHero,image=await loadImage('public/hero-approved-v1.png'),hero=H.create(image);
 assert.equal(image.width,384);assert.equal(image.height,640);assert.throws(()=>H.create({width:1,height:1}));
 const source=createCanvas(384,640),sc=source.getContext('2d');sc.drawImage(image,0,0);const pixels=sc.getImageData(0,0,384,640).data;
 const hash=(row,col)=>{const p=sc.getImageData(col*64,row*64,64,64).data;return crypto.createHash('sha256').update(p).digest('hex')};
 for(let row=0;row<10;row++)for(let col=0;col<6;col++){
  let n=0,minX=64,maxX=0,minY=64,maxY=0;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const a=pixels[(((row*64+y)*384+col*64+x)*4)+3];assert(a===0||a===255,'soft/fringe alpha');if(a){n++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
  assert(n>120,'empty frame');assert(minX>0&&maxX<63&&minY>0&&maxY<=59,'clipped frame / feet bleed');
 }
 for(let row=1;row<10;row++)assert(new Set([...Array(6)].map((_,i)=>hash(row,i))).size>=5,'animation repeats static pose');
 const dirs=[{dv:'d',f:1},{dv:'s',f:-1},{dv:'s',f:1},{dv:'u',f:1}];
 for(let d=0;d<4;d++)for(let i=0;i<6;i++){
  const p=hero.pose({...dirs[d],moving:true},i*75);assert.equal(p.row,d+1);assert.equal(p.col,i);
 }
 const at=[0,55,100,150,220,280];for(let i=0;i<6;i++){assert.equal(hero.pose({swingAt:1000,f:1},1000+at[i]).col,i);assert.equal(hero.pose({swingAt:1000,f:-1},1000+at[i]).row,6)}
 assert.equal(hero.pose({swingAt:1000},1100).col,2,'strike artwork aligns with existing 110ms damage resolve');
 assert.equal(hero.pose({dv:'u',swingAt:1000},1110).row,9,'rear attacks must face away');
 assert.equal(hero.pose({hurtAt:1000,dv:'u'},1050).col,5);assert.equal(hero.pose({deathAt:0},800).col,5,'zero timestamp should work');
 const c=createCanvas(80,72),ctx=c.getContext('2d');
 hero.draw(ctx,40,66,{dv:'d',f:1},0);const idle=Buffer.from(ctx.getImageData(0,0,80,72).data);ctx.clearRect(0,0,80,72);hero.draw(ctx,40,66,{dv:'d',f:1},2000);const breath=Buffer.from(ctx.getImageData(0,0,80,72).data);assert.notDeepEqual(idle,breath);
 for(let y=61;y<72;y++)for(let x=0;x<80;x++)for(let k=0;k<4;k++)assert.equal(idle[(y*80+x)*4+k],breath[(y*80+x)*4+k],'breathing moves feet');
 assert(H.supports([0,0,0,0,0,0]));assert(H.supports());assert(!H.supports([0,3,0,0,0,0]),'preserve equipped armour renderer');
 const sourceCode=fs.readFileSync('public/myrren-game.js','utf8');assert(sourceCode.includes('drawApprovedBase(x,y,o,now)'));assert(sourceCode.includes("MYRREN_APPROVED.src='/hero-approved-v1.png'"));
 // Exercise the real game entry point with the new atlas ready and legacy art unavailable.
 Object.assign(sb,{approvedHero:hero,ctx,URLSearchParams,location:{search:''},myrrenV31Ready:false,me:{},shadowE(){},label(){},drawTool(){},swingAng(){return 0}});
 const a=sourceCode.indexOf('function drawApprovedBase('),b=sourceCode.indexOf('function drawPerson(',a);
 vm.runInContext(sourceCode.slice(a,b)+';this.gameDraw=drawApprovedPlayer;',sb);
 ctx.clearRect(0,0,80,72);assert.equal(sb.gameDraw(40,66,{dv:'d',f:1,g:[0,0,0,0,0,0],tool:'fist'},0),true);
 assert.deepEqual(Buffer.from(ctx.getImageData(0,0,80,72).data),idle,'actual game must draw new character artwork');
 assert.equal(sb.gameDraw(40,66,{g:[3,3,3,3,3,3]},0),false,'equipped gear must retain original renderer path');
 const {game:g}=await require('./game-runtime.cjs')();g.start();g.save.inv.coins=357;g.save.notes.tree=20;g.save.eq.body='iron_body';const before=JSON.stringify(g.snap());g.update(.1,1100);assert.equal(g.save.inv.coins,357);assert.equal(g.save.eq.body,'iron_body');assert.equal(g.save.notes.tree,20);
 console.log('PASS: 60 uncut hard-alpha frames; four-way six-frame run; native attack/hurt/death poses; hit timing; planted idle feet; preserved gear and saves.');
})().catch(e=>{console.error(e);process.exitCode=1});
