'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
function data(name) { const p=path.join(root,'assets',name), ext=path.extname(p).toLowerCase();return `data:image/${ext==='.png'?'png':'webp'};base64,${fs.readFileSync(p).toString('base64')}`; }
module.exports=function bundle(){
  const images={chibi:data('chibi.png'),left:data('maid-left.png'),right:data('maid-right.png'),palace:data('palace.webp'),lace:data('lace.png'),ribbon:data('ribbon.webp')};
  let css=fs.readFileSync(path.join(__dirname,'theme.css'),'utf8');
  for(const [k,v] of Object.entries({CHIBI:images.chibi,MAID_LEFT:images.left,MAID_RIGHT:images.right,PALACE:images.palace,LACE:images.lace,RIBBON:images.ribbon}))css=css.replaceAll(`__${k}__`,v);
  return fs.readFileSync(path.join(__dirname,'theme.js'),'utf8').replace('__MAID_ASSETS__',JSON.stringify({left:images.left,chibi:images.chibi})).replace('__MAID_CSS__',JSON.stringify(css));
};
