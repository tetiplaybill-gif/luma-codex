'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const bundle=require('../src/bundle.cjs');
test('bundle is valid JavaScript and contains all local assets',()=>{
  const source=bundle();assert.doesNotThrow(()=>new vm.Script(source));
  assert.ok(!source.includes('__MAID_ASSETS__'));assert.ok(!source.includes('__MAID_CSS__'));
  for(const name of ['maid-left.png','maid-right.png','chibi.png','palace.webp','lace.png','ribbon.webp'])assert.ok(fs.statSync(path.join(__dirname,'..','assets',name)).size>0);
  assert.ok(source.includes('data:image/png;base64,'));assert.ok(source.includes('data:image/webp;base64,'));
});
