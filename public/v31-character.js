/* Native V31 face consistency and a restrained, feet-planted idle cadence. */
(() => {
  'use strict';
  function buildFaceAtlas(image) {
    const atlas=document.createElement('canvas');atlas.width=128;atlas.height=320;
    const c=atlas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,0,0);
    // The standing front frame has a different white eye. Use the approved
    // walking face, aligned to each pose's head centre. Preserve hair, jaw,
    // neck, torso, legs, and all side/back artwork outside this small patch.
    const walkCenters=[15,16,15,15];
    for(let frame=0;frame<4;frame++){
      c.clearRect(frame*32+10,18,12,5);
      c.drawImage(image,9,4*40+18,12,5,frame*32+10,18,12,5);
      const x=frame*32+walkCenters[frame]-6;
      c.clearRect(x,4*40+18,12,5);
      c.drawImage(image,9,4*40+18,12,5,x,4*40+18,12,5);
    }
    return atlas;
  }
  function idleLift(now,resting=true) {
    if(!resting||!Number.isFinite(now))return 0;
    const phase=((now%3600)+3600)%3600;
    return phase>=1500&&phase<2900?1:0;
  }
  window.V31Character={buildFaceAtlas,idleLift};
})();
