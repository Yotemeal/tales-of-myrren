const fs=require('node:fs');
module.exports=async function createGame(localSaves={}){
const worldSource=fs.readFileSync('public/myrren-world.js','utf8'),envSource=fs.readFileSync('public/myrren-environment.js','utf8'),gameSource=require('./game-source.cjs')();
 let rects=0;
 const context=()=>new Proxy({globalAlpha:1,fillRect(...p){if(!p.slice(0,4).every(Number.isFinite))throw Error('Nonfinite rectangle '+p);rects++},drawImage(){},createRadialGradient(){return {addColorStop(){}}}}, {get(t,k){return k in t?t[k]:(()=>{})}});
 const elements=new Map();
 function element(id=''){
   return {id,value:'',disabled:false,hidden:false,width:800,height:600,clientWidth:800,clientHeight:600,dataset:{},style:{},children:[],scrollTop:0,classList:{add(){},remove(){},contains(){return false}},events:{},
    getContext:()=>context(),addEventListener(k,v){this.events[k]=v},append(...v){this.children.push(...v)},setAttribute(){},querySelectorAll(){return []},querySelector(){return null},getBoundingClientRect(){return {left:0,top:0,width:800,height:600}},contains(){return false},blur(){},focus(){},select(){},click(){this.events.click?.({preventDefault(){}})}};
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},createElement:()=>element(),querySelectorAll:()=>[],addEventListener(){},hidden:false,activeElement:null};
 const memory=new Map(Object.entries(localSaves)),localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const window={addEventListener(){}};new Function('window',worldSource)(window);new Function('window','document',envSource)(window,document);
 new Function('window','document',fs.readFileSync('public/v31-character.js','utf8'))(window,document);
 class Image{constructor(){this.naturalWidth=128;this.naturalHeight=320}set src(v){this.onload?.()}}
 let request=null;
 const source=gameSource.slice(0,gameSource.lastIndexOf('})();'))+'window.__test={me,save,die,respawnPlayer,beginSwing,hpMax,CX,CY,BLD,SOLID,keys,VILLAGE,SMELT,FORGE,DEFS,xpTable,start,update,frame,drawOutdoor,smelt,forge,snap,applySave,adoptSave,nearSmithy,openSmithy,curShop,closeModal,enterBuilding,relocateSavedPosition,inventoryEntries,inventorySlots,reconcileSlots,moveInventorySlot,depositItem,withdrawItem,sellItemQuantity,availableItem,canSellEntry,bankAccess,SPOTS,openModal,canFitInventory,stackKinds,slotsUsed,killMon,combatKillXp,resolveSwing,doAction,cookTick,beginAct,persist,buyItem,buyFood,unequip,equipFromBag,finalizeSave,parseSavedProgress,ITEMS,NT,COOK,MT,mons,blocked,getAct:()=>act,getInside:()=>inside,getTab:()=>tab,getCat:()=>shopCat,setForgeMat:v=>forgeMat=v};'+gameSource.slice(gameSource.lastIndexOf('})();'));
 new Function('window','document','localStorage','indexedDB','navigator','performance','Image','requestAnimationFrame','addEventListener','setTimeout','clearTimeout','MyrrenWorld','MyrrenEnvironment','URLSearchParams','location',source)(
 window,document,localStorage,{open(){throw Error('No IDB in unit test')}},{getGamepads:()=>[]},{now:()=>1000},Image,f=>request=f,()=>{},()=>1,()=>{},window.MyrrenWorld,window.MyrrenEnvironment,class{get(){return null}},{search:''});

 await Promise.resolve();await Promise.resolve();
 return {game:window.__test,memory,elements};
};
