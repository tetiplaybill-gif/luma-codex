'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {resolveDesktop}=require('../src/platform.cjs');
test('macOS finds the app and separate profile',()=>{
  const r=resolveDesktop({platform:'darwin',env:{},home:'/Users/test',exists:p=>p==='/Applications/ChatGPT.app/Contents/MacOS/ChatGPT'});
  assert.equal(r.app,'/Applications/ChatGPT.app/Contents/MacOS/ChatGPT');
  assert.equal(r.profile,'/Users/test/Library/Application Support/Luma Codex Theme/profile');
});
test('Windows discovers a registered application and uses local profile',()=>{
  const executable='C:\\Program Files\\WindowsApps\\OpenAI.Codex_1_x64\\app\\ChatGPT.exe';
  const r=resolveDesktop({platform:'win32',env:{LOCALAPPDATA:'C:\\Users\\tester\\AppData\\Local'},home:'C:\\Users\\tester',exists:p=>p===executable,query:()=>executable});
  assert.equal(r.app,executable);assert.equal(r.profile,'C:\\Users\\tester\\AppData\\Local\\Luma Codex Theme\\profile');
});
test('explicit paths win and missing apps fail safely',()=>{
  const r=resolveDesktop({platform:'win32',env:{MAID_CHATGPT_EXE:'C:\\custom\\ChatGPT.exe',MAID_PROFILE_DIR:'D:\\theme-profile'},exists:p=>p==='C:\\custom\\ChatGPT.exe',query:()=>{throw Error('query must not run')}});
  assert.equal(r.app,'C:\\custom\\ChatGPT.exe');assert.equal(r.profile,'D:\\theme-profile');
  assert.throws(()=>resolveDesktop({platform:'win32',env:{},exists:()=>false,query:()=>''}),/找不到新版 ChatGPT/);
  assert.throws(()=>resolveDesktop({platform:'linux',env:{},exists:()=>true}),/只支持/);
});
test('Windows package discovery returns a string without crashing', {skip:process.platform!=='win32'},()=>{
  const {queryWindowsPackage}=require('../src/platform.cjs');assert.equal(typeof queryWindowsPackage(),'string');
});
