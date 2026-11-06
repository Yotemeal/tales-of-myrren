const fs=require('node:fs');
module.exports=()=>fs.readFileSync('public/myrren-game.js','utf8');
