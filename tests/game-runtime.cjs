const fs=require('node:fs');
module.exports=async function createGame(localSaves={}){
const worldSource=fs.readFileSync('public/myrren-world.js','utf8'),envSource=fs.readFileSync('public/myrren-environment.js','utf8'),gameSource=require('./game-source.cjs')();
 let rects=0;const renderedText=[];
 const context=()=>new Proxy({globalAlpha:1,fillRect(...p){if(!p.slice(0,4).every(Number.isFinite))throw Error('Nonfinite rectangle '+p);rects++},fillText(t){renderedText.push(String(t))},drawImage(){},createRadialGradient(){return {addColorStop(){}}}}, {get(t,k){return k in t?t[k]:(()=>{})}});
 const elements=new Map();
 const windowEvents=new Map(),documentEvents=new Map();
 const listen=(events,type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn)};
 const dispatch=(events,type,event={})=>{for(const fn of events.get(type)||[])fn(event)};
 function element(id=''){
   return {id,value:'',disabled:false,hidden:false,width:800,height:600,clientWidth:800,clientHeight:600,dataset:{},style:{},children:[],scrollTop:0,classList:{add(){},remove(){},contains(){return false}},events:{},
    getContext:()=>context(),addEventListener(k,v){this.events[k]=v},append(...v){for(const child of v){this.children.push(child);if(child)child.parent=this}},prepend(...v){for(const child of v.reverse()){this.children.unshift(child);if(child)child.parent=this}},remove(){if(this.parent){const i=this.parent.children.indexOf(this);if(i!==-1)this.parent.children.splice(i,1)}this.removed=true},setAttribute(){},querySelectorAll(){return []},querySelector(){return null},getBoundingClientRect(){return {left:0,top:0,width:800,height:600}},contains(){return false},blur(){},focus(){},select(){},click(){this.events.click?.({preventDefault(){}})}};
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)},createElement:()=>element(),querySelectorAll:()=>[],addEventListener:(type,fn)=>listen(documentEvents,type,fn),hidden:false,activeElement:null};
 const memory=new Map(Object.entries(localSaves)),localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const window={addEventListener:(type,fn)=>listen(windowEvents,type,fn),MyrrenKezV2Atlas:{ready:true,failed:false}};
 class Image{constructor(){this.naturalWidth=128;this.naturalHeight=320}set src(v){this.onload?.()}}
 new Function('window',worldSource)(window);
 new Function('window','document','Image',envSource)(window,document,Image);
 new Function('window','document',fs.readFileSync('public/v31-character.js','utf8'))(window,document);
 const timers=[];
 let request=null;
 const source=gameSource.slice(0,gameSource.lastIndexOf('})();'))+'window.__test={me,save,die,respawnPlayer,beginSwing,hpMax,hpAt,atkBonus,defTotal,defRed,CX,CY,BLD,SOLID,keys,VILLAGE,SMELT,FORGE,forgeXp,forgeReq,equipmentSetPlan,ARMOUR_SET_KINDS,PRODUCTION_MS,smithMaximum,smithMaterials,smithStation,startSmithing,smithingTick,stopSmithing,smelt,forge,DEFS,xpTable,start,update,frame,drawOutdoor,smelt,forge,snap,applySave,adoptSave,nearSmithy,readyToGather,facingNode,nodeOK,openSmithy,curShop,closeModal,enterBuilding,relocateSavedPosition,inventoryEntries,inventorySlots,reconcileSlots,moveInventorySlot,depositItem,withdrawItem,sellItemQuantity,availableItem,canSellEntry,bankAccess,SPOTS,TRADER,openModal,canFitInventory,stackKinds,slotsUsed,killMon,combatKillXp,recordBossContribution,resolveBossRewards,resolveSwing,doAction,cookTick,COOK_MS,cookingChance,cookingStation,openCooking,startCooking,stopCooking,cookingProgress,rCook,drawSpot,beginAct,persist,buyItem,buyFood,unequip,equipFromBag,finalizeSave,parseSavedProgress,ITEMS,NT,COOK,MT,mons,nodes,blocked,recordMiningHit,consumeOreVein,miningInterval,miningDustColors,recordForestryHit,forestryHitPalette,drawForestryImpact,drawTree,drawRock,nodeTip,activeDef,sellVal,xpPopups,queueXpDrop,addXp,meleeDistance,meleeReach,meleeTarget,faceMeleeTarget,combatImpacts,recordCombatHit,drawCombatImpacts,monsterWarningConfig,beginMonsterWarning,completeMonsterWarning,damagePlayerFromMonster,drawMonsterWarning,splats,splat,layoutMonsterOverlays,drawMonsterOverlays,layoutDamagePopups,drawDamagePopups,combatRectOverlaps,defeatCollapse,drawDefeatDust,drawMon,getPendingStrike:()=>pendingStrike,getAct:()=>act,getInside:()=>inside,getTab:()=>tab,getCat:()=>shopCat,setForgeMat:v=>forgeMat=v,setSmithQuantity:v=>smithQuantity=v,getSmithJob:()=>smithJob,getProductionReadyAt:()=>productionReadyAt,setCookQuantity:v=>cookQuantity=v,setCookSelected:v=>cookSelected=v,getCookJob:()=>cookJob};'+gameSource.slice(gameSource.lastIndexOf('})();'));
 new Function('window','document','localStorage','indexedDB','navigator','performance','Image','requestAnimationFrame','addEventListener','setTimeout','clearTimeout','MyrrenWorld','MyrrenEnvironment','URLSearchParams','location',source)(
 window,document,localStorage,{open(){throw Error('No IDB in unit test')}},{getGamepads:()=>[]},{now:()=>1000},Image,f=>request=f,window.addEventListener,(fn,delay)=>{timers.push({fn,delay});return timers.length},()=>{},window.MyrrenWorld,window.MyrrenEnvironment,class{get(){return null}},{search:''});

 await Promise.resolve();await Promise.resolve();
 return {game:window.__test,memory,elements,timers,rectCount:()=>rects,renderedText,document,dispatchWindowEvent:(type,event)=>dispatch(windowEvents,type,event),dispatchDocumentEvent:(type,event)=>dispatch(documentEvents,type,event)};
};
