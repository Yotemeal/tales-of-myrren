/* Tales of Myrren — QA-only native A/B trees and paired stumps.
 * This file is loaded ONLY by tree-native-review.html, never the normal game.
 * All tree art is an unscaled, lossless PNG atlas of the approved reference.
 * The original renderer and game logic are left untouched. */
(() => {
  'use strict';
  const base=window.MyrrenEnvironment;
  if(!base||typeof base.tree!=='function')throw Error('Production environment must load before tree QA adapter');
  const SPECIES=['pine','birch','oak','willow','maple','ironbark'];
  // [treeWidth,treeHeight,stumpWidth,stumpHeight] for the actual native PNGs.
  const SIZES={
    pine:[[66,93,34,23],[67,93,34,23]],
    birch:[[67,90,33,23],[68,90,33,23]],
    oak:[[79,88,46,28],[85,88,48,30]],
    willow:[[86,94,37,24],[85,94,37,24]],
    maple:[[79,91,36,23],[87,91,36,23]],
    ironbark:[[96,96,53,30],[91,95,55,33]]
  };
  const VISUAL_ONLY_ALIASES={
    tree:'pine',oak:'oak',maple:'maple',elder:'ironbark',myrren:'willow',
    bramblewood:'pine',alder:'birch',redleaf:'maple',duskwillow:'willow',
    elderthorn:'ironbark',starroot:'ironbark',ironbark:'ironbark'
  };
  const atlas=new Image();
  atlas.decoding='async';
  const review={ready:false,failed:false,draws:0,fullDraws:0,stumpDraws:0,
    source:'/assets/resources/tree-preview-v1/approved_tree_atlas.png',
    sizes:SIZES};
  window.MyrrenTreeNativeReview=review;
  atlas.onload=()=>{
    review.ready=atlas.naturalWidth===600&&atlas.naturalHeight===276;
    review.failed=!review.ready;
  };
  atlas.onerror=()=>{review.failed=true;};
  atlas.src=review.source;
  function variant(n){
    if(n.previewVariant==='a'||n.previewVariant==='b')return n.previewVariant;
    // Deterministic 70:30 A:B, stable between sessions and on respawn.
    const seed=(Math.imul(Math.round(n.x||0),73856093)^Math.imul(Math.round(n.y||0),19349663))>>>0;
    return seed%10<7?'a':'b';
  }
  function nativeTree(ctx,n,x,y,now,ancient){
    const species=n.previewNativeType||
      VISUAL_ONLY_ALIASES[n.previewTree]||
      VISUAL_ONLY_ALIASES[n.k];
    if(ancient||!species||!Object.prototype.hasOwnProperty.call(SIZES,species))
      return base.tree(ctx,n,x,y,now,ancient);
    if(!review.ready)return;
    const v=variant(n),row=v==='a'?0:1,col=SPECIES.indexOf(species);
    const cut=!!n.previewStump||now<n.back;
    const sz=SIZES[species][row],w=sz[cut?2:0],h=sz[cut?3:1];
    const sx=col*100+Math.floor((100-w)/2);
    const sy=row*138+(cut?104:2);
    // Both states share the same world-foot location. No scaling, slicing or
    // synthetic foliage motion; trunk and stump dimensions remain individual.
    ctx.drawImage(atlas,sx,sy,w,h,Math.round(x-w/2),Math.round(y-h+4),w,h);
    review.draws++;
    if(cut)review.stumpDraws++;else review.fullDraws++;
  }
  window.MyrrenEnvironment=Object.freeze({...base,tree:nativeTree});
})();