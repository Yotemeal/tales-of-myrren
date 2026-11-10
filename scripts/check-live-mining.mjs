// Compare our public Cloudflare deployment against the checked-in game build.
// By default this reports the current live version (safe for PR diagnostics).
// --require-current polls after a production main-branch release until assets
// are deployed; otherwise exits nonzero without inventing a deployment result.
import { readFile } from 'node:fs/promises';

const domain = 'https://tales-of-myrren.keznuts.workers.dev';
const mustMatch = process.argv.includes('--require-current');
const html = await readFile('public/index.html', 'utf8');
const script = html.match(/<script src="(\/myrren-game\.js\?v=(\d+))"><\/script>/);
if (!script) throw Error('Canonical game HTML lacks a versioned script URL');
const version = Number(script[2]);
const expectedSource = await readFile('public/myrren-game.js', 'utf8');
if (!expectedSource.includes('window.MyrrenBuild=' + version + ';') ||
    !expectedSource.includes('vein:6') ||
    !expectedSource.includes('ores left in this vein'))
  throw Error('Local mining release is not internally consistent');

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration));
const maxAttempts = mustMatch ? 24 : 1;
let last = 'No response';
for (let i = 1; i <= maxAttempts; i++) {
  try {
    const suffix = '?myrren-build-check=' + version + '-' + i;
    const response = await fetch(domain + '/' + suffix, {
      cache: 'no-store', signal: AbortSignal.timeout(12000),
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw Error('HTML HTTP ' + response.status);
    const liveHtml = await response.text();
    const liveSrc = liveHtml.match(/<script src="(\/myrren-game\.js\?v=(\d+))"><\/script>/);
    if (!liveSrc) throw Error('Live game script URL missing');
    const liveVersion = Number(liveSrc[2]);
    const jsResponse = await fetch(domain + liveSrc[1] + '&build-check=' + i, {
      cache: 'no-store', signal: AbortSignal.timeout(12000),
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!jsResponse.ok) throw Error('JavaScript HTTP ' + jsResponse.status);
    const liveCode = await jsResponse.text();
    const hasVeins = liveCode.includes('consumeOreVein(') &&
      liveCode.includes('vein:6') &&
      liveCode.includes('ores left in this vein');
    const matches = liveVersion === version &&
      liveCode.includes('window.MyrrenBuild=' + version + ';') &&
      hasVeins;
    last = 'HTML version ' + liveVersion + ', scripted veins ' + hasVeins +
      ', expected version ' + version;
    console.log('Cloudflare attempt ' + i + ': ' + last);
    if (matches) {
      console.log('PASS: live Cloudflare serves the tested multi-ore mining release');
      process.exit(0);
    }
    if (!mustMatch) {
      console.log('INFO: branch change is not yet deployed; current live script differs');
      process.exit(0);
    }
  } catch (e) {
    last = String(e?.message || e);
    console.log('Cloudflare attempt ' + i + ': ' + last);
    if (!mustMatch) {
      console.log('INFO: live Cloudflare cannot be verified from this runner');
      process.exit(0);
    }
  }
  if (i < maxAttempts) await sleep(10000);
}
console.error('FAIL: Cloudflare did not serve the new mining release. ' + last);
console.error('Check Cloudflare Worker tales-of-myrren Builds / Deployments for main.');
process.exitCode = 1;
