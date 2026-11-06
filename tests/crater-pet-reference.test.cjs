const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const events=[],sb={window:{dispatchEvent:e=>events.push(e.type)},Event:class{constructor(type){this.type=type}},fetch:async url=>{assert.equal(url,'/crater-reference-frames.json?v=1');return{ok:true,json:async()=>JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'))}},document:{createElement:()=>createCanvas(1,1)},Image:class{constructor(){const c=createCanvas(1,1);Object.defineProperty(c,'src',{set(url){assert(url.includes('crater-reference-r5.png'));loadImage('public/'+url.split('/').pop().split('?')[0]).then(im=>{c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);c.onload?.()}).catch(e=>c.onerror?.(e))}});return c}}};
 vm.createContext(sb);for(const file of ['skilling-pets.js','crater-animation.js','crater-pet-reference.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),sb);
 const renderer=sb.window.MyrrenPetReference.create();assert(!renderer.ready);assert(await renderer.load());assert(renderer.ready);assert(events.includes('myrren-pet-reference-ready'));
 const states={woodcutting:['idle','walk','takeoff','glide','land','climb'],mining:['burrow','surface','idle','dig'],fishing:['idle','walk','swim','water-idle','dive','catch']},hashes={};let count=0;
 for(const [sk,list] of Object.entries(states))for(const state of list)for(const facing of [-1,1]){
  const c=createCanvas(160,100),p={sk,previewState:state,stateAt:0,face:facing,x:0,y:0,trail:[]};assert(renderer.draw(c.getContext('2d'),p,80,75,400));const pixels=c.getContext('2d').getImageData(0,0,160,100).data;assert(pixels.some((n,i)=>i%4===3&&n>0));hashes[sk+':'+state+':'+facing]=crypto.createHash('sha256').update(pixels).digest('hex');count++;
 }
 assert.notEqual(hashes['mining:burrow:1'],hashes['mining:idle:1']);assert.notEqual(hashes['fishing:walk:1'],hashes['fishing:swim:1']);assert.notEqual(hashes['woodcutting:walk:1'],hashes['woodcutting:glide:1']);
 for(const sk of Object.keys(states))assert(renderer.icon(sk).startsWith('<img'));
 assert.equal(renderer.draw(createCanvas(1,1).getContext('2d'),{sk:'unknown'},0,0,0),false);
 console.log('PASS: '+count+' pet state/facing renders use the approved R5 crop atlas; mole travel differs from surfaced body; land/water/glide states and icons load.');
})().catch(e=>{console.error(e);process.exitCode=1});
