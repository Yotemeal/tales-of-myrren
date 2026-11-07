/* Shared village geometry: rendering and collision use the same water field. */
(() => {
'use strict';
const CX=800,CY=800;
const lake={x:1250,y:1055,rx:161,ry:108};
const buildings=[
{id:'axe',x:660,y:712,w:56},
{id:'pick',x:620,y:820,w:56},
{id:'arms',x:915,y:725,w:88,open:true},
{id:'food',x:700,y:926,w:56},
{id:'fish',x:1000,y:875,w:54}
];
const bridges=[]; // the Camp has a single dry passage through the fallen crater rocks
const bridge=null;
const river={rx:400,ry:285}; // legacy geometry retained for compatibility
const stations=[{kind:'furnace',x:941,y:720},{kind:'anvil',x:890,y:735},{kind:'trade',x:916,y:697}];
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
const streamAngle=.55,streamF=riverF(streamAngle);
const stream=[[CX+400*Math.cos(streamAngle)*streamF,CY+285*Math.sin(streamAngle)*streamF],[1200,987],[1193,1010]];
function lakeF(a){return 1+.12*Math.sin(2*a+.65)+.065*Math.sin(3*a-1.1)+.035*Math.cos(5*a+.4)}
function lakeR(x,y){const nx=(x-lake.x)/lake.rx,ny=(y-lake.y)/lake.ry;return {r:Math.hypot(nx,ny),f:lakeF(Math.atan2(ny,nx))}}
function riverF(a){return 1+.13*Math.sin(3*a)+.055*Math.sin(5*a)+.022*Math.sin(9*a)+.006*Math.sin(17*a)+.045*(Math.sin(2*a+.7)-Math.sin(.7))+.035*(Math.cos(4*a+.9)-Math.cos(.9))}
function riverHalfWidth(a){return 16+4*Math.sin(4*a+.6)+2*Math.sin(7*a-.3)}
function riverDistance(x,y){const nx=(x-CX)/river.rx,ny=(y-CY)/river.ry,r=Math.hypot(nx,ny),a=Math.atan2(ny,nx),fp=.39*Math.cos(3*a)+.275*Math.cos(5*a)+.198*Math.cos(9*a)+.102*Math.cos(17*a)+.09*Math.cos(2*a+.7)-.14*Math.sin(4*a+.9),q=fp/Math.max(.2,r),g=Math.hypot((Math.cos(a)+q*Math.sin(a))/river.rx,(Math.sin(a)-q*Math.cos(a))/river.ry);return Math.abs(r-riverF(a))/g-riverHalfWidth(a)}
function waterDistance(x,y){const l=lakeR(x,y);return (l.r-l.f)*108}
function onBridge(x,y){return false}
// Rockfall ring surrounding the Camp, with one clear opening to the south.
function craterWall(x,y){
 const r=Math.hypot((x-CX)/305,(y-CY)/235);
 // A collapsed section of the southern rim forms the sole entrance.
 const southGate=Math.abs(x-CX)<55&&y>CY+172;
 return !southGate&&r>.895&&r<1.085;
}
function inWater(x,y){return waterDistance(x,y)<0||craterWall(x,y)}
function inVillage(x,y){return Math.hypot((x-CX)/305,(y-CY)/235)<.895}
const paths=buildings.map(b=>[[800,830],[b.x,b.y+7]]);
paths.push([[800,830],[800,1180]],[[800,1180],[800,1450]]);
function bridgeApproach(x,y){return false}
function dryFootprint(x,y,halfWidth,top,bottom=3,margin=8){
 for(let yy=y-top;yy<=y+bottom;yy+=6)for(let xx=x-halfWidth;xx<=x+halfWidth;xx+=6)if(waterDistance(xx,yy)<margin)return false;
 return true;
}
function pathKind(x,y){
 if(waterDistance(x,y)<24)return 'grass';
 if(inVillage(x,y)&&((x-800)**2/(185*185)+(y-830)**2/(66*66)<1))return 'plaza';
 return paths.some(p=>segmentDistance(x,y,p[0],p[1])<13)?'path':'grass';
}
function safePosition(x,y,blocked=()=>false){
 if(!inWater(x,y)&&!blocked(x,y))return {x,y};
 for(let r=4;r<=160;r+=4)for(let i=0;i<32;i++){const a=i*Math.PI/16,nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(nx>108&&nx<1492&&ny>108&&ny<1492&&!inWater(nx,ny)&&!blocked(nx,ny))return {x:nx,y:ny}}
 return {x:800,y:840};
}
function fishingPosition(a){
 const f=lakeF(a),sx=lake.x+Math.cos(a)*lake.rx*f,sy=lake.y+Math.sin(a)*lake.ry*f;
 const nx=Math.cos(a)/lake.rx,ny=Math.sin(a)/lake.ry,mag=Math.hypot(nx,ny),dx=nx/mag,dy=ny/mag;
 // Use the actual connected shoreline, including the river mouth.
 let offset=2;
 while(offset<300&&waterDistance(sx+dx*offset,sy+dy*offset)<1)offset+=2;
 return {x:sx+dx*(offset-12),y:sy+dy*(offset-12)};
}

window.MyrrenWorld=Object.freeze({lake,buildings,bridge,bridges,river,stations,lakeF,lakeR,riverF,riverHalfWidth,riverDistance,waterDistance,onBridge,inWater,craterWall,inVillage,pathKind,bridgeApproach,dryFootprint,safePosition,fishingPosition,segmentDistance});
})();
