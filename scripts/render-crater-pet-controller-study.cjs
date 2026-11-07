/* Render the actual pet controller + approved reference adapter for review. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{spawnSync}=require('node:child_process'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const {W,H}=await require('../tests/wardrobe-harness.cjs')(),hero=H.create(W.base,{rawFrames:true});
 const sb={document:{createElement:()=>createCanvas(1,1)},window:{dispatchEvent(){}},Event:class{},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('public/crater-reference-frames.json','utf8'))}),Image:class{constructor(){const c=createCanvas(1,1);Object.defineProperty(c,'src',{set(url){loadImage('public/'+url.split('/').pop().split('?')[0]).then(im=>{c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);c.onload?.()})}});return c}}};
 vm.createContext(sb);for(const file of ['skilling-pets.js','crater-animation.js','crater-pet-reference.js'])vm.runInContext(fs.readFileSync('public/'+file,'utf8'),sb);
 const P=sb.window.MyrrenSkillingPets,renderer=sb.window.MyrrenPetReference.create();if(!await renderer.load())throw Error(renderer.error);
 const pets=['woodcutting','mining','fishing'].map(sk=>({sk,x:20,y:0,face:1,trail:[]}));for(const p of pets)P.reset(p,0,{playerMoving:true});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'myrren-pet-controller-'));let output=0;
 for(let tick=0;tick<=160;tick++){
  const now=tick*50,t=now/1000,moving=t<2,playerX=50+Math.min(t,2)*90;
  for(const p of pets){const active=t>=3,skill=p.sk,target={x:skill==='woodcutting'?246:skill==='mining'?218:244,y:0};
   const catchAt=t>=7.4?7400:t>=6.4?6400:null;
   P.update(p,{dt:tick? .05:0,now,player:{moving,dead:false,inside:false},anchor:{x:playerX-18,y:0},action:active?{skill,key:skill+'-node',target}:null,activeSkill:active?skill:null,success:skill==='fishing'&&catchAt?{skill,at:catchAt,key:'catch-'+catchAt}:null,inWater:x=>skill==='fishing'&&x>215,canMove:()=>true});
  }
  if(tick%4)continue;
  const c=createCanvas(900,650),x=c.getContext('2d');x.fillStyle='#10211d';x.fillRect(0,0,900,650);x.fillStyle='#e4d6af';x.font='bold 21px serif';x.fillText('The Crater · pet behaviour preview',22,30);x.font='13px sans-serif';x.fillStyle='#b5c5b2';x.fillText('Actual controllers · supplied art · player reference shown separately',22,52);x.fillText('Matching skill while summoned: 100 base XP → 103 XP',22,72);
  pets.forEach((p,i)=>{const ground=230+i*190;x.fillStyle='#e4d6af';x.font='17px serif';x.fillText(P.definitions[p.sk].name,20,ground-120);x.fillStyle='#b5c5b2';x.font='12px sans-serif';x.fillText(p.previewState.replaceAll('-',' ')+' · '+(moving?'player moving':t<3?'player stopped':'matching skill active'),20,ground-100);if(p.sk==='fishing'){x.fillStyle='#173b45';x.fillRect(420+215*1.4,ground-10,900-(420+215*1.4),22)}x.fillStyle='#3d5a48';x.fillRect(25,ground+2,850,1);
   x.save();x.translate(300,ground);x.scale(2.5,2.5);hero.draw(x,0,0,{dv:'s',f:1,g:[2,2,2,2,0,2],moving,nativeScale:false},now);x.restore();x.save();x.translate(420+p.x*1.4,ground);x.scale(2.5,2.5);renderer.draw(x,p,0,p.y,now);x.restore();
  });
  fs.writeFileSync(path.join(temp,String(output++).padStart(3,'0')+'.png'),c.toBuffer('image/png'));
 }
 const destination=path.resolve('docs/crater-pet-controller-study.gif');
 const py="from PIL import Image\nfrom pathlib import Path\nimport sys\nf=[Image.open(p) for p in sorted(Path(sys.argv[1]).glob('*.png'))]\nf[0].save(sys.argv[2],save_all=True,append_images=f[1:],duration=[200]*(len(f)-1)+[1000],loop=0,disposal=2)";
 const result=spawnSync(process.env.CODEX_PRIMARY_RUNTIME_PYTHON||'python',['-c',py,temp,destination],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);fs.rmSync(temp,{recursive:true});console.log(destination);
})().catch(e=>{console.error(e);process.exitCode=1});
