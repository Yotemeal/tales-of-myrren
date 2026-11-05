/* Shared village geometry: rendering and collision use the same water field. */
(() => {
'use strict';
const CX=800,CY=800;
const lake={x:1250,y:1055,rx:161,ry:108};
const buildings=[
{id:'axe',x:660,y:712,w:56},
{id:'pick',x:590,y:820,w:56},
{id:'arms',x:915,y:725,w:88,open:true},
{id:'food',x:700,y:926,w:56},
{id:'fish',x:1000,y:875,w:54}
];
const bridge={x:1100,y:800,halfLength:58,halfWidth:12};
const stations=[{kind:'furnace',x:941,y:720},{kind:'anvil',x:890,y:735},{kind:'trade',x:916,y:697}];
const segmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
const stream=[[1090,865],[1122,891],[1139,928],[1151,969],[1193,994]];
function lakeF(a){return 1+.12*Math.sin(2*a+.65)+.065*Math.sin(3*a-1.1)+.035*Math.cos(5*a+.4)}
function lakeR(x,y){const nx=(x-lake.x)/lake.rx,ny=(y-lake.y)/lake.ry;return {r:Math.hypot(nx,ny),f:lakeF(Math.atan2(ny,nx))}}
function riverF(a){return 1+.04*Math.sin(3*a)+.025*Math.sin(5*a)}
function riverDistance(x,y){const nx=(x-CX)/300,ny=(y-CY)/178,r=Math.hypot(nx,ny),a=Math.atan2(ny,nx);return (Math.abs(r-riverF(a))-.085)*178}
function waterDistance(x,y){
 const l=lakeR(x,y);let d=Math.min((l.r-l.f)*108,riverDistance(x,y));
 if(x>1060&&x<1220&&y>840&&y<1020)for(let i=0;i<stream.length-1;i++)d=Math.min(d,segmentDistance(x,y,stream[i],stream[i+1])-12);
 return d;
}
function onBridge(x,y){return Math.abs(x-bridge.x)<=bridge.halfLength&&Math.abs(y-bridge.y)<=bridge.halfWidth}
function inWater(x,y){return !onBridge(x,y)&&waterDistance(x,y)<0}
function inVillage(x,y){const nx=(x-CX)/300,ny=(y-CY)/178;return Math.hypot(nx,ny)<riverF(Math.atan2(ny,nx))-.085}
const paths=buildings.map(b=>[[800,830],[b.x,b.y+7]]);
paths.push([[800,830],[960,800]],[[960,800],[1330,800]],[[500,800],[300,788]],[[800,650],[790,260]],[[800,985],[780,1400]]);
function pathKind(x,y){
 if(inVillage(x,y)&&((x-800)**2/(185*185)+(y-830)**2/(66*66)<1))return 'plaza';
 return paths.some(p=>segmentDistance(x,y,p[0],p[1])<13)?'path':'grass';
}
function safePosition(x,y,blocked=()=>false){
 if(!inWater(x,y)&&!blocked(x,y))return {x,y};
 for(let r=4;r<=160;r+=4)for(let i=0;i<32;i++){const a=i*Math.PI/16,nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(nx>108&&nx<1492&&ny>108&&ny<1492&&!inWater(nx,ny)&&!blocked(nx,ny))return {x:nx,y:ny}}
 return {x:800,y:840};
}
function fishingPosition(a){
 const f=lakeF(a),x=lake.x+Math.cos(a)*lake.rx*f,y=lake.y+Math.sin(a)*lake.ry*f;
 // Twelve world pixels offshore: within reach from dry shoreline.
 const nx=Math.cos(a)/lake.rx,ny=Math.sin(a)/lake.ry,mag=Math.hypot(nx,ny);
 return {x:x-nx/mag*12,y:y-ny/mag*12};
}
window.MyrrenWorld=Object.freeze({lake,buildings,bridge,stations,lakeF,lakeR,riverF,riverDistance,waterDistance,onBridge,inWater,inVillage,pathKind,safePosition,fishingPosition,segmentDistance});
})();