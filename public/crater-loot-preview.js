/* Preview-only browser loot adapter. Uses existing monster coin/bread rates; no new balance. */
(()=>{'use strict';
 function roll(table,random=Math.random){
  const drops=[];for(const d of table.guaranteed||[])drops.push({...d});
  const main=table.main||[];const total=main.reduce((n,d)=>n+d.weight,0);
  if(total){let r=Math.floor(random()*total);for(const d of main){if(r<d.weight){if(d.itemId!=='nothing')drops.push({itemId:d.itemId,quantity:d.quantity||1});break}r-=d.weight}}
  for(const d of table.bonus||[])if(random()*10000<d.chanceBps)drops.push({itemId:d.itemId,quantity:d.quantity||1});
  return drops;
 }
 function create(){const settled=new WeakSet();return {award(monster,table,grant,random=Math.random){
  if(settled.has(monster))return false;
  const drops=roll(table,random);settled.add(monster);
  try{grant(drops)}catch(error){settled.delete(monster);throw error}
  return true;
 }}}
 window.MyrrenCraterLoot={roll,create};
})();
