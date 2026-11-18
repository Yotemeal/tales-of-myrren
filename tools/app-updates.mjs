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

async function githubFetch(url,options){
 try{return await fetch(url,options)}
 catch(error){
  if(error.name==='TimeoutError')throw Error('GitHub took too long to respond. Try again.');
  throw Error('Could not reach GitHub. Check your connection and try again.');
 }
}
async function validateEditor(root){
 await Promise.all([
  access(join(root,'tools','myrren-editor.html')),
  access(join(root,'public','myrren-preview-config.js')),
  ...['preview-myrren.mjs','app-updates.mjs'].map(name=>
   run(process.execPath,['--check',join(root,'tools',name)]))
 ]);
}

export async function checkAppUpdate(){
 if(!appUpdatesEnabled)throw Error('Open the Fedora AppImage to use app updates.');
 const response=await githubFetch('https://api.github.com/repos/'+repository+'/git/ref/heads/'+branch,{
  headers:{Accept:'application/vnd.github+json','User-Agent':'Myrren-Editor'},signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error('GitHub update check returned HTTP '+response.status+'.');
 const latest=(await response.json()).object?.sha;
 if(!shaPattern.test(latest))throw Error('GitHub did not return an editor revision.');
 let installed=revision;
 try{
  const candidate=(await readFile(join(home,'current'),'utf8')).trim();
  if(shaPattern.test(candidate)){
   await access(join(home,'versions',candidate,'tools','preview-myrren.mjs'));
   installed=candidate;
  }
 }catch(error){if(error.code!=='ENOENT')throw error}
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
  const response=await githubFetch('https://codeload.github.com/'+repository+'/tar.gz/'+state.latest,{
   signal:AbortSignal.timeout(90000)
  });
  if(!response.ok||!response.body)throw Error('GitHub download returned HTTP '+response.status+'.');
  await pipeline(Readable.fromWeb(response.body),createWriteStream(archive,{flags:'wx'}));
  await run('tar',['-xzf',archive,'-C',checkout,'--strip-components=1','--no-same-owner'],{timeout:60000});
  await validateEditor(checkout);
  const target=join(versions,state.latest);
  try{await rename(checkout,target)}
  catch(error){
   if(!['EEXIST','ENOTEMPTY'].includes(error.code))throw error;
   await validateEditor(target);
  }
  const pointer=join(staging,'current');
  await writeFile(pointer,state.latest+'\n',{flag:'wx'});
  await rename(pointer,join(home,'current'));
  return {...state,available:false,restartNeeded:state.latest!==revision};
 }finally{
  if(staging)await rm(staging,{recursive:true,force:true}).catch(()=>{});
  installing=false;
 }
}
