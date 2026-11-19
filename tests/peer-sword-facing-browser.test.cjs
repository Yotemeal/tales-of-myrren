'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

(async () => {
  const root = path.resolve(__dirname, '../public');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const types = {'.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.png':'image/png'};
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch();
    const pages = [];
    for (let i = 0; i < 2; i++) {
      const page = await browser.newPage({viewport:{width:852,height:393}, isMobile:true});
      pages.push(page);
      await page.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort());
      await page.exposeFunction('relay', async presence => {
        const other = pages[1-i];
        if (other) await other.evaluate(pr => window.receive?.({peers:[
          {peer:'other', kind:'viewer', presence:pr}
        ]}), presence);
      });
      await page.addInitScript(i => {
        window.claude = {use:async name => name === 'room' ? {
          onPeers:fn => window.receive = fn, onConnection(){}, connected:() => true,
          presence:p => window.relay(p)
        } : null};
        localStorage.setItem('ember-reach-v2', JSON.stringify({
          v:3, name:'Player'+i, xp:{melee:10000}, eq:{weapon:'bronze_sword',shield:'bronze_shield'}
        }));
      }, i);
      await page.goto(origin);
      await page.locator('#go').click();
    }
    const [sender, viewer] = pages;
    await viewer.evaluate(() => {
      window.seen = [];
      const atlas = MyrrenKezV2Atlas, draw = atlas.draw;
      atlas.draw = function(ctx, x, y, o, now) {
        if (o.name === 'Player0') seen.push({...o, age:now-o.swingAt});
        return draw.apply(this, arguments);
      };
    });
    for (const [key,dv,f] of [['ArrowRight','s',1],['ArrowUp','u',null],['ArrowLeft','s',-1],['ArrowDown','d',null]]) {
      await sender.keyboard.down(key);
      await sender.waitForTimeout(220);
      await sender.keyboard.up(key);
      await sender.waitForTimeout(550);
      await viewer.evaluate(() => window.seen = []);
      await sender.keyboard.press('Space', {delay:80});
      await viewer.waitForFunction(([dv,f]) => seen.some(o => o.dv === dv && (f === null || o.f === f)
        && !o.moving && o.age >= 0 && o.age < 320 && o.tool === 'sword' && o.g[4] === 2), [dv,f]);
    }
    // A stationary auto-target can reverse facing without changing position.
    // Feed that packet through the same receiver used by the room callback.
    await viewer.evaluate(() => {
      const pr = {x:800,y:844,n:'Player0',a:3,tt:2,g:[0,0,0,0,2,0],s:80};
      const send = state => receive({peers:[{peer:'other',kind:'viewer',presence:state}]});
      send({...pr,dv:'s',f:1});
      window.seen = [];
      send({...pr,s:81,dv:'s',f:-1});
    });
    await viewer.waitForFunction(() => seen.some(o => o.dv==='s' && o.f===-1 && o.age<320));
    // Older senders omit both facing fields. Their displacement supplies facing.
    await viewer.evaluate(() => {
      window.seen = [];
      receive({peers:[{peer:'other',kind:'viewer',presence:{
        x:800,y:838,n:'Player0',a:3,tt:2,s:82,g:[0,0,0,0,2,0]
      }}]});
    });
    await viewer.waitForFunction(() => seen.some(o => o.dv==='u' && o.age<320));
    await viewer.evaluate(() => {
      const pr={x:800,y:844,n:'Player0',a:3,tt:2,s:82,g:[0,0,0,0,2,0]};
      const send=state=>receive({peers:[{peer:'other',kind:'viewer',presence:state}]});
      send({...pr,hits:0,down:false});
      window.seen=[];
      send({...pr,hits:1,down:true});
      window.revive=()=>send({...pr,hits:1,down:false,x:808});
    });
    await viewer.waitForFunction(()=>seen.some(o=>o.deathAt!=null&&o.hurtAt>=0));
    await viewer.evaluate(()=>{seen.length=0;revive()});
    await viewer.waitForFunction(()=>seen.some(o=>o.deathAt==null&&o.hurtAt<0&&!o.moving));
    console.log('PASS: equipped remote sword strikes retained all four standing facings.');
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => {console.error(error);process.exitCode=1});
