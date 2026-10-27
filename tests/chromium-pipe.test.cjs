'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');const {spawn}=require('node:child_process');
const candidates=process.platform==='win32' ? [
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES,'Google','Chrome','Application','chrome.exe'),
  process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'],'Google','Chrome','Application','chrome.exe'),
  process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES,'Microsoft','Edge','Application','msedge.exe'),
  process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'],'Microsoft','Edge','Application','msedge.exe')
] : process.platform==='darwin' ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'] : [];
const browser=candidates.find(p=>p && fs.existsSync(p));
test('installed Chromium responds over a private pipe', {skip:browser ? false : 'no supported Chromium browser found',timeout:20000}, async()=>{
  // This isolated test profile contains no user session. The test never reads user browser data.
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'luma-ci-chromium-'));
  const child=spawn(browser,['--headless=new','--no-first-run','--disable-gpu','--no-sandbox',`--user-data-dir=${profile}`,'--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
  try{
    const result=await new Promise((resolve,reject)=>{
      let buffer=Buffer.alloc(0);const timeout=setTimeout(()=>reject(Error('Chromium pipe timed out')),15000);
      child.once('error',reject);child.once('exit',()=>reject(Error('Chromium exited before response')));
      child.stdio[4].on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);let at;while((at=buffer.indexOf(0))>=0){const frame=buffer.subarray(0,at);buffer=buffer.subarray(at+1);const msg=JSON.parse(frame);if(msg.id===99){clearTimeout(timeout);resolve(msg)}}});
      child.stdio[3].write(JSON.stringify({id:99,method:'Browser.getVersion'})+'\0');
    });
    assert.equal(result.id,99);assert.ok(result.result?.product,'missing Chromium version');
  }finally{child.kill()}
});
