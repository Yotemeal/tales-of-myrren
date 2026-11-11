'use strict';
// Smoke-test the actual Cloudflare public/ entry point in an independent browser.
// Produces screenshots so native character and armour quality can be reviewed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filename.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  try{const stat=fs.statSync(filename);if(!stat.isFile())throw Error('Not a file');
    response.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
    fs.createReadStream(filename).pipe(response);
  }catch(_){response.writeHead(404);response.end('Not found')}
});
const bronzeProof=process.argv.includes('--bronze-proof');
async function checkBronzeGameplay(browser,base){
  const output='/tmp/myrren-bronze-gameplay';
  fs.mkdirSync(output,{recursive:true});
  const armour=['helm','body','legs','boots','shield','gloves'];
  const items=[...armour,'sword'].map(kind=>'bronze_'+kind);
  const directions=[['front','d',1],['back','u',1],['left','s',-1],['right','s',1]];
  const clients=new Map();
  const presence=new Map();
  async function connectRoom(page,device){
    clients.set(device,page);
    await page.exposeBinding('relayBronzePresence',async(_,payload)=>{
      presence.set(device,payload);
      for(const [recipient,target] of clients){
        if(recipient===device||target.isClosed())continue;
        const peers=[...presence].map(([peer,data])=>({
          peer,kind:'viewer',isMe:peer===recipient,presence:data
        }));
        await target.evaluate(peers=>window.receiveBronzePeers?.({peers}),peers);
      }
    });
    await page.addInitScript(()=>{
      const room={
        onPeers(callback){window.receiveBronzePeers=callback},
        onConnection(){},
        connected(){return true},
        presence(data){return window.relayBronzePresence(data)}
      };
      window.claude={use:async service=>service==='room'?room:null};
    });
  }
  for(const [device,viewport] of [['desktop',{width:1200,height:800}],['mobile',{width:390,height:844}]]){
    const mobile=device==='mobile';
    const page=await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
    await connectRoom(page,device);
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // Expose production inventory actions and set deterministic render inputs in this browser only.
    await page.route('**/myrren-game.js?*',async route=>{
      const response=await route.fetch();
      let script=await response.text();
      assert(script.includes('  update(dt,now);'));
      script=script.replace('  update(dt,now);','  update(dt,now);\n  window.bronzeQA?.pose(now);');
      const hook=`
        window.bronzeQA={
          fill(ids){save.bag=[...new Set([...save.bag,...ids])]},
          set(ids){
            for(const slot of SLOTS)unequip(slot);
            for(const id of ids)equipFromBag(save.bag.indexOf(id));
            persist(true);
            return Object.values(save.eq).filter(Boolean).sort();
          },
          equipped(){return Object.values(save.eq).filter(Boolean).sort()},
          closeModal,
          die,
          respawnPlayer,
          hurt(){me.hurtAt=performance.now();sendPresence()},
          state:null,
          pose(now){
            if(!this.state)return;
            const {dv,face,moving,action}=this.state;
            Object.assign(me,{dv,face,moving});
            if(action==='attack')me.swing=now-145;
            if(action==='hurt')me.hurtAt=now-75;
            if(action==='death')me.deathAt=now-420;
          }
        };
        const originalDrawKez=drawKezV2;
        drawKezV2=function(x,y,avatar,now){
          const drawn=originalDrawKez(x,y,avatar,now);
          if(drawn&&!avatar.isMe)window.bronzeQA.lastPeerDraw={
            name:avatar.name,gear:avatar.g,tool:avatar.tool,
            hurt:now-avatar.hurtAt<220,dead:avatar.deathAt!=null
          };
          return drawn;
        };
      `;
      const end=script.lastIndexOf('})();');
      assert(end>=0);
      await route.fulfill({response,body:script.slice(0,end)+hook+script.slice(end)});
    });
    const url=base+'/?bronze-proof';
    const enter=async()=>{
      await page.waitForFunction(()=>window.MyrrenKezV2Equipment?.hasAtlas(2)&&
        window.MyrrenKezV2Atlas?.ready&&window.MyrrenKezV2Atlas.punchReady&&window.MyrrenKezV2Atlas.swordReady&&window.MyrrenKezV2Atlas.collapseReady&&
        !document.querySelector('#go').disabled);
      await page.locator('#nick').fill('Bronze QA');
      await page.locator('#go').click();
      await page.waitForFunction(()=>document.querySelector('#intro').hidden);
    };
    await page.goto(url);
    await enter();
    await page.evaluate(ids=>window.bronzeQA.fill(ids),items);
    const equip=async ids=>assert.deepEqual(await page.evaluate(ids=>window.bronzeQA.set(ids),ids),[...ids].sort());
    const capture=async(name,dv,face,moving=false,action=null)=>{
      await page.evaluate(async state=>{
        window.bronzeQA.state=state;
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      },{dv,face,moving,action});
      await page.screenshot({path:path.join(output,device+'-'+name+'.png')});
    };
    for(const [name,ids] of [['bare',[]],['bronze',items]]){
      await equip(ids);
      for(const [direction,dv,face] of directions)await capture(name+'-'+direction,dv,face);
    }
    if(!mobile){
      for(const kind of [...armour,'sword']){
        await equip(['bronze_'+kind]);
        await capture(kind+'-only','d',1);
      }
      await equip(['bronze_sword','bronze_shield']);
      await capture('sword-and-shield','s',1);
      for(const [direction,dv,face] of directions)await capture('sword-attack-'+direction,dv,face,false,'attack');
      await equip([]);
      for(const [direction,dv,face] of directions)await capture('punch-'+direction,dv,face,false,'attack');
      await equip(items.filter(id=>id!=='bronze_sword'));
      for(const [direction,dv,face] of directions)await capture('bronze-punch-'+direction,dv,face,false,'attack');
      await equip(items);
      await capture('walk','s',-1,true);
      await capture('hurt','d',1,false,'hurt');
      await page.locator('[data-ui-open="gear"]').click();
      await page.locator('.character-portrait canvas').waitFor();
      await page.screenshot({path:path.join(output,'desktop-equipment-panel.png')});
      await page.evaluate(()=>window.bronzeQA.closeModal());
      await capture('death','d',1,false,'death');
    }
    await page.reload();
    await enter();
    assert.deepEqual(await page.evaluate(()=>window.bronzeQA.equipped()),[...items].sort());
    assert.deepEqual(errors,[]);
    if(!mobile)continue;
    const desktop=clients.get('desktop');
    await desktop.evaluate(()=>{window.bronzeQA.state=null});
    await desktop.locator('#intro').waitFor({state:'hidden'});
    const peerShows=async expected=>page.waitForFunction(expected=>{
      const draw=window.bronzeQA.lastPeerDraw;
      return draw?.name==='Bronze QA'&&Object.entries(expected).every(
        ([key,value])=>JSON.stringify(draw[key])===JSON.stringify(value));
    },expected);
    await desktop.evaluate(()=>window.bronzeQA.set(['bronze_shield','bronze_sword']));
    await peerShows({gear:[0,0,0,0,2,0],tool:'sword'});
    await page.screenshot({path:path.join(output,'mobile-remote-sword-shield.png')});
    // Install the observer before emitting the short hurt flash.
    await page.evaluate(()=>{
      window.sawBronzePeerHurt=false;
      const inspect=()=>{
        if(window.bronzeQA.lastPeerDraw?.hurt)window.sawBronzePeerHurt=true;
        else requestAnimationFrame(inspect);
      };
      requestAnimationFrame(inspect);
    });
    await desktop.evaluate(()=>window.bronzeQA.hurt());
    await page.waitForFunction(()=>window.sawBronzePeerHurt);
    await desktop.evaluate(()=>window.bronzeQA.die());
    await peerShows({dead:true});
    await page.screenshot({path:path.join(output,'mobile-remote-collapse.png')});
    await desktop.evaluate(()=>window.bronzeQA.respawnPlayer());
    await peerShows({dead:false,gear:[0,0,0,0,2,0],tool:'sword'});
    await desktop.close();
    await page.close();
  }
  console.log('PASS: Bronze gameplay captures, production equip/unequip, equipment UI and reload');
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    if(bronzeProof){await checkBronzeGameplay(browser,base);return;}
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.MyrrenKezV2Atlas?.ready,{timeout:15000});
    await page.waitForFunction(()=>!document.querySelector('#go').disabled,{timeout:15000});
    assert.equal(await page.evaluate(()=>window.MyrrenKezV2Atlas.dimensions.scale),1);
    assert(await page.evaluate(()=>!!window.MyrrenKezV2Equipment));
    await page.locator('#nick').fill('Kez QA');
    await page.locator('#go').click();
    await page.waitForFunction(()=>document.querySelector('#intro').hidden,{timeout:5000});
    await page.waitForTimeout(600);
    await page.screenshot({path:'/tmp/myrren-kez-v2-mobile.png'});
    const check=await page.evaluate(()=>{
      const canvas=document.getElementById('cv'),ctx=canvas.getContext('2d');
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let colored=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]||pixels[i+1]||pixels[i+2])colored++;
      return {width:canvas.width,height:canvas.height,colored};
    });
    assert(check.colored>300,'world canvas should contain a painted game world');
    await page.locator('[data-ui-open="gear"]').click();
    await page.waitForFunction(()=>!!document.querySelector('.character-portrait canvas'),{timeout:5000});
    await page.waitForTimeout(200);
    await page.screenshot({path:'/tmp/myrren-kez-v2-equipment.png'});
    await page.evaluate(()=>{
      const tiers=[2,3,4,5,7,6,8];
      const gallery=document.createElement('canvas');gallery.id='qa-gallery';gallery.width=840;gallery.height=220;
      const g=gallery.getContext('2d');g.fillStyle='#222b2e';g.fillRect(0,0,gallery.width,gallery.height);
      g.imageSmoothingEnabled=false;
      tiers.forEach((mat,i)=>{
        const name=['Bronze','Iron','Steel','Black Iron','Obsidianite','Myrrenite','Starsteel'][i];
        const x=i*120+60,y=160,o={dv:'d',f:1,moving:false,now:0,g:[mat,mat,mat,mat,mat,mat]};
        g.fillStyle='#303d3c';g.fillRect(i*120+8,7,104,204);
        g.save();g.translate(x,y);g.scale(4,4);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'under');
        window.MyrrenKezV2Atlas.draw(g,0,0,o,0);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'over');
        g.restore();g.fillStyle='#fff4e0';g.font='12px sans-serif';g.textAlign='center';g.fillText(name,x,200);
      });
      document.body.appendChild(gallery);
    });
    const galleryPng=await page.evaluate(()=>document.getElementById('qa-gallery').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync('/tmp/myrren-kez-v2-seven-metals.png',Buffer.from(galleryPng,'base64'));

    // Directional QA: every metal, both side views, rear, sword and unarmed.
    // This intentionally uses the live JS renderer rather than a mock drawing.
    const directionalPng=await page.evaluate(()=>{
      const tiers=[2,3,4,5,7,6,8];
      const specs=[
        ['FRONT','d',1,false,false],['RIGHT','s',1,false,false],
        ['LEFT','s',-1,false,false],['BACK','u',1,false,false],
        ['RIGHT ATTACK','s',1,true,false],['LEFT ATTACK','s',-1,true,false],
        ['FRONT ATTACK','d',1,true,false],['BACK ATTACK','u',1,true,false],
        ['BARE FIST','d',1,true,true]
      ];
      const c=document.createElement('canvas');c.width=896;c.height=specs.length*145;
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      g.fillStyle='#23302c';g.fillRect(0,0,c.width,c.height);
      for(let row=0;row<specs.length;row++){
        const [title,dv,f,attack,bare]=specs[row];
        for(let col=0;col<tiers.length;col++){
          const mat=tiers[col],x=col*128+64,y=row*145+130;
          g.fillStyle='#32423b';g.fillRect(col*128+5,row*145+3,118,140);
          const o={dv,f,moving:false,now:attack?120:0,
            tool:attack?(bare?'fist':'sword'):'sword',
            swingAt:attack?0:-99999, g:bare?[0,0,0,0,0,0]:[mat,mat,mat,mat,mat,mat]};
          g.save();g.translate(x,y);g.scale(4,4);
          const hx=dv==='s'?(f<0?-6:6):dv==='u'?-8:5;
          const weapon=()=>{if(attack&&!bare){
            const motion=window.MyrrenKezV2SwordMotion;
            if(!motion||!window.MyrrenSwords.draw(g,mat,hx,-7,f,motion.angle(o.now),.6))
              throw Error('Actual sword renderer unavailable');
          }};
          if(dv==='u')weapon();
          window.MyrrenKezV2Equipment.draw(g,0,0,o,'under');
          window.MyrrenKezV2Atlas.draw(g,0,0,o,o.now);
          window.MyrrenKezV2Equipment.draw(g,0,0,o,'over');
          if(dv!=='u')weapon();
          g.restore();
          g.font='12px sans-serif';g.fillStyle='#f3eed8';g.textAlign='center';
          if(row===0)g.fillText(['Bronze','Iron','Steel','Black Iron','Obsidianite','Myrrenite','Starsteel'][col],x,row*145+18);
          g.fillText(title,x,row*145+140);
        }
      }
      return c.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync('/tmp/myrren-kez-v2-directions.png',Buffer.from(directionalPng,'base64'));

    // Rigid attack QA: sample the actual equipped sword and motion modules
    // across four facings and the full 320 ms animation. Do not use a fixed
    // illustration angle here: that previously hid broken attack movement.
    const contactPng=await page.evaluate(()=>{
      const D=[['FRONT','d',1],['RIGHT','s',1],['BACK','u',1],['LEFT','s',-1]];
      const A=[0,60,110,160,210,270,310],mat=6;
      const tileW=116,tileH=156;
      const c=document.createElement('canvas');
      c.width=tileW*A.length;c.height=tileH*D.length;
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      const gear=window.MyrrenKezV2Equipment,hero=window.MyrrenKezV2Atlas;
      const sword=window.MyrrenSwords,motion=window.MyrrenKezV2SwordMotion;
      if(!sword?.ready||!motion||!hero?.ready||!gear)throw Error('Missing production render modules');
      let changed=0;
      for(let di=0;di<D.length;di++)for(let ai=0;ai<A.length;ai++){
        const [name,dv,f]=D[di],age=A[ai],tx=ai*tileW,ty=di*tileH;
        const cx=tx+tileW/2,cy=ty+128;
        g.fillStyle='#23322e';g.fillRect(tx,ty,tileW,tileH);
        const pose={dv,f,moving:false,now:age,tool:'sword',swingAt:0,
          g:[mat,mat,mat,mat,mat,mat]};
        const hx=dv==='u'?-8:dv==='s'?f*6:5,hy=-7;
        g.save();g.translate(cx,cy);g.scale(4,4);
        const paintSword=()=>{
          const pre=g.getImageData(cx-80,cy-168,160,184).data;
          if(!sword.draw(g,mat,hx,hy,f,motion.angle(age),.6))
            throw Error('Forged sword not ready');
          const post=g.getImageData(cx-80,cy-168,160,184).data;
          for(let px=0;px<pre.length;px+=4)if(pre[px+3]!==post[px+3]||
            pre[px]!==post[px]||pre[px+1]!==post[px+1]||pre[px+2]!==post[px+2])changed++;
          // The glove hides the weapon's hilt; the offhand shield draws separately.
          if(dv!=='u'){g.fillStyle='#91e4db';g.fillRect(hx-1,hy-1,2,2)}
        };
        if(dv==='u')paintSword();
        gear.draw(g,0,0,pose,'under');
        hero.draw(g,0,0,pose,age);
        gear.draw(g,0,0,pose,'over');
        if(dv!=='u')paintSword();
        g.restore();
        g.fillStyle='#e9e2ce';g.font='11px sans-serif';g.textAlign='center';
        g.fillText(name+' '+age+'ms',cx,ty+149);
      }
      if(changed<100)throw Error('Sword pixels did not render throughout strike');
      return c.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync('/tmp/myrren-kez-v2-sword-motion-contact-sheet.png',Buffer.from(contactPng,'base64'));

    // Cosmetics QA: default metal identity survives all four saved dye choices.
    const dyePng=await page.evaluate(()=>{
      const metals=[4,5,7,6,8];
      const labels=['None','Crimson','Emerald','Midnight','Royal gold'];
      const names=['Steel','Black Iron','Obsidianite','Myrrenite','Starsteel'];
      const c=document.createElement('canvas');c.width=740;c.height=750;
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      g.fillStyle='#24322e';g.fillRect(0,0,c.width,c.height);
      for(let row=0;row<5;row++)for(let col=0;col<metals.length;col++){
        const mat=metals[col],dye=row?row-1:null,x=col*148+74,y=row*150+124;
        const o={dv:'d',f:1,moving:false,now:0,dye,g:[mat,mat,mat,mat,mat,mat]};
        g.fillStyle='#34423e';g.fillRect(col*148+5,row*150+4,138,142);
        g.save();g.translate(x,y);g.scale(4,4);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'under');
        window.MyrrenKezV2Atlas.draw(g,0,0,o,0);
        window.MyrrenKezV2Equipment.draw(g,0,0,o,'over');
        g.restore();
        g.font='12px sans-serif';g.textAlign='center';g.fillStyle='#f2e7d1';
        if(row===0)g.fillText(names[col],x,row*150+16);
        g.fillText(labels[row],x,row*150+142);
      }
      return c.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync('/tmp/myrren-kez-v2-dyes.png',Buffer.from(dyePng,'base64'));

    // Approval capture: Myrrenite's revised gold-crested teal T-visor must
    // be the same in front, side, rear and dyed character equipment previews.
    const myrrenitePng=await page.evaluate(()=>{
      const views=[
        ['FRONT','d',1,null],['RIGHT','s',1,null],
        ['LEFT','s',-1,null],['BACK','u',1,null],
        ['EMERALD DYE','d',1,1]
      ];
      const canvas=document.createElement('canvas');
      canvas.width=750;canvas.height=270;
      const g=canvas.getContext('2d');
      g.imageSmoothingEnabled=false;
      g.fillStyle='#1c2431';g.fillRect(0,0,canvas.width,canvas.height);
      views.forEach(([label,dv,f,dye],i)=>{
        const x=i*150+75,y=221;
        g.fillStyle='#33414a';g.fillRect(i*150+7,14,136,240);
        const pose={dv,f,moving:false,now:0,tool:'sword',swingAt:-99999,
          dye,g:[6,6,6,6,6,6]};
        g.save();g.translate(x,y);g.scale(6,6);
        window.MyrrenKezV2Equipment.draw(g,0,0,pose,'under');
        window.MyrrenKezV2Atlas.draw(g,0,0,pose,0);
        window.MyrrenKezV2Equipment.draw(g,0,0,pose,'over');
        g.restore();
        g.fillStyle='#f1e9c8';g.font='12px sans-serif';
        g.textAlign='center';g.fillText(label,x,258);
      });
      return canvas.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync('/tmp/myrren-kez-v2-myrrenite-helmet.png',Buffer.from(myrrenitePng,'base64'));
    assert.deepEqual(errors,[],'no unhandled browser script exceptions');
    console.log('PASS: real browser loads Kez V2, enters game, paints world, opens equipped portrait and renders all seven metal tiers.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
