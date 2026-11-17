import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { promisify } from 'node:util';

const repository='Yotemeal/tales-of-myrren';
const branch='tools/standalone-myrren-editor';
const shaPattern=/^[a-f0-9]{40}$/;
const run=promisify(execFile);
const home=process.env.MYRREN_APP_HOME;
const revision=process.env.MYRREN_APP_REVISION;
export const appUpdatesEnabled=Boolean(home&&shaPattern.test(revision));
let installing=false;

export async function checkAppUpdate(){
 if(!appUpdatesEnabled)throw Error('Open the Fedora AppImage to use app updates.');
 const response=await fetch('https://api.github.com/repos/'+repository+'/git/ref/heads/'+branch,{
  headers:{Accept:'application/vnd.github+json','User-Agent':'Myrren-Editor'},signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error('GitHub update check returned HTTP '+response.status+'.');
 const latest=(await response.json()).object?.sha;
 if(!shaPattern.test(latest))throw Error('GitHub did not return an editor revision.');
 let installed=revision;
 try{installed=(await readFile(join(home,'current'),'utf8')).trim()}catch(error){if(error.code!=='ENOENT')throw error}
 return {revision,latest,available:latest!==installed,restartNeeded:installed!==revision};
}
export async function installAppUpdate(){
 if(installing)throw Error('An update is already downloading.');
 installing=true;
 let staging;
 try{
  const state=await checkAppUpdate();
  if(!state.available)return state;
  const versions=join(home,'versions');
  await mkdir(versions,{recursive:true});
  staging=await mkdtemp(join(versions,'.upgrade-'));
  const archive=join(staging,'update.tar.gz'),checkout=join(staging,'checkout');
  await mkdir(checkout);
  const response=await fetch('https://codeload.github.com/'+repository+'/tar.gz/'+state.latest,{
   signal:AbortSignal.timeout(90000)
  });
  if(!response.ok||!response.body)throw Error('GitHub download returned HTTP '+response.status+'.');
  await pipeline(Readable.fromWeb(response.body),createWriteStream(archive,{flags:'wx'}));
  await run('tar',['-xzf',archive,'-C',checkout,'--strip-components=1','--no-same-owner'],{timeout:60000});
  const tools=join(checkout,'tools');
  await Promise.all([
   access(join(tools,'myrren-editor.html')),
   access(join(checkout,'public','myrren-preview-config.js')),
   run(process.execPath,['--check',join(tools,'preview-myrren.mjs')])
  ]);
  const target=join(versions,state.latest);
  try{await rename(checkout,target)}
  catch(error){
   if(!['EEXIST','ENOTEMPTY'].includes(error.code))throw error;
   await access(join(target,'tools','preview-myrren.mjs'));
  }
  const pointer=join(staging,'current');
  await writeFile(pointer,state.latest+'\n',{flag:'wx'});
  await rename(pointer,join(home,'current'));
  return {...state,available:false,restartNeeded:true};
 }finally{
  if(staging)await rm(staging,{recursive:true,force:true}).catch(()=>{});
  installing=false;
 }
}
