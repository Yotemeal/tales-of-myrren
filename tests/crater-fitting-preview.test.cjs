const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const {W,H}=await require('./wardrobe-harness.cjs')(),metadata=JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'));
 const elements=new Map(),selects=new Set(['category','creature','state','armour']);
 const element=id=>({id,value:'',textContent:'',checked:false,children:[],events:{},append(...children){this.children.push(...children);if(selects.has(id)&&!this.value&&children.length)this.value=children[0].value},replaceChildren(){this.children=[];if(selects.has(id))this.value=''},addEventListener(k,f){this.events[k]=f}});
 for(const id of ['category','creature','state','armour','size','duration','mirror','frame','frameLabel','details','missing','error','status','play','replay','sizeLabel','durationLabel'])elements.set(id,element(id));
 for(const [id,v] of [['category','Hostiles'],['armour','0'],['size','1'],['duration','160'],['frame','0']])elements.get(id).value=v;
 const canvas=createCanvas(960,432);elements.set('stage',canvas);let nextFrame;
 const sb={window:{MyrrenWardrobe:W,MyrrenHero:H},document:{getElementById:id=>elements.get(id),createElement:()=>element('')},requestAnimationFrame:f=>nextFrame=f,
  fetch:async url=>{assert.equal(url,'/crater-reference-frames.json?v=3');return{ok:true,json:async()=>metadata}},
  Image:class{constructor(){const c=createCanvas(1,1);Object.defineProperty(c,'src',{set(url){loadImage('public/'+url.split('/').pop().split('?')[0]).then(im=>{c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);c.onload?.()}).catch(e=>c.onerror?.(e))}});return c}},
  localStorage:{getItem(){throw Error('Fitting preview must never read player saves')},setItem(){throw Error('Fitting preview must never save progress')}}};
 vm.createContext(sb);vm.runInContext(fs.readFileSync('public/crater-animation.js','utf8'),sb);vm.runInContext(fs.readFileSync('public/crater-fitting-preview.js','utf8'),sb);
 for(let i=0;i<200&&!nextFrame&&!elements.get('error').textContent;i++)await new Promise(r=>setTimeout(r,5));
 assert.equal(elements.get('error').textContent,'');assert(nextFrame);assert(elements.get('status').textContent.includes('16 creatures'));
 let now=0,count=0;
 for(const category of ['Hostiles','Wildlife','Pets']){
  elements.get('category').value=category;elements.get('category').events.change();
  for(const option of [...elements.get('creature').children]){
   elements.get('creature').value=option.value;elements.get('creature').events.change();
   for(const state of [...elements.get('state').children]){
    elements.get('state').value=state.value;elements.get('state').events.change();nextFrame(now+=160);assert(elements.get('frameLabel').textContent.includes('/'));count++;
   }
  }
 }
 assert.equal(count,61);elements.get('category').value='Pets';elements.get('category').events.change();elements.get('creature').value='geode_mole';elements.get('creature').events.change();elements.get('state').value='surface';elements.get('state').events.change();
 elements.get('frame').value='2';elements.get('frame').events.input();nextFrame(now+=160);assert.equal(elements.get('frameLabel').textContent,'3 / 4','scrubbing pauses at the chosen supplied frame');nextFrame(now+=160);assert.equal(elements.get('frameLabel').textContent,'3 / 4');
 elements.get('replay').events.click();nextFrame(now);assert.equal(elements.get('frameLabel').textContent,'1 / 4');
 for(let i=0;i<10;i++)nextFrame(now+=200);assert.equal(elements.get('frameLabel').textContent,'4 / 4','one-shot surface holds final pose');
 elements.get('mirror').checked=true;elements.get('armour').value='8';nextFrame(now+=160);
 assert(canvas.getContext('2d').getImageData(0,0,960,432).data.some((v,i)=>i%4===0&&v>100),'player and reference draw successfully');
 console.log('PASS: fitting controls render all 16 creatures/61 clips; frame scrub/pause/replay/held one-shots, mirror and armour; no save access. Synthetic DOM/canvas verification, not browser QA.');
})().catch(e=>{console.error(e);process.exitCode=1});
