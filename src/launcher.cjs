'use strict';
/* Independent desktop renderer theme loader. Uses a private inherited CDP pipe. */
const {spawn}=require('node:child_process');const fs=require('node:fs');
const {resolveDesktop}=require('./platform.cjs');
let app,profile;try{({app,profile}=resolveDesktop())}catch(e){console.error(e.message);process.exit(1)}
fs.mkdirSync(profile,{recursive:true,mode:0o700});
const runtime=require('./bundle.cjs')();
const source=`(()=>{if(location.protocol!=='app:'||!location.pathname.endsWith('/index.html')||location.search.includes('avatar-overlay'))return;const start=()=>{${runtime}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})()`;
const child=spawn(app,['--user-data-dir='+profile,'--remote-debugging-pipe'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let seq=0,buffer=Buffer.alloc(0),session=null,done=false,mainId=null,mainSeen=false,missingSince=0;
const pending=new Map();
function stop(code=0){if(done)return;done=true;clearInterval(ticker);for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('launcher closed'))}pending.clear();if(!child.killed)child.kill('SIGTERM');setTimeout(()=>process.exit(code),400).unref();}
function call(method,params={},sessionId){return new Promise((resolve,reject)=>{if(done)return reject(Error('launcher closed'));let id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('debug pipe timeout: '+method))},12000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0',error=>{if(error&&pending.has(id)){clearTimeout(timer);pending.delete(id);reject(error)}})})}
child.stdio[3].on('error',e=>{if(!done){console.error('客户端调试管道写入失败：'+e.message);stop(1)}});
child.stdio[4].on('error',e=>{if(!done){console.error('客户端调试管道读取失败：'+e.message);stop(1)}});
child.stdio[4].on('end',()=>{if(!done){if(mainSeen){console.log('主题窗口已关闭。');stop(0)}else{console.error('客户端调试管道在连接前关闭。');stop(1)}}});
child.stdio[4].on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);let i;while((i=buffer.indexOf(0))!==-1){const frame=buffer.subarray(0,i);buffer=buffer.subarray(i+1);try{const msg=JSON.parse(frame);const p=pending.get(msg.id);if(p){pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result)}}catch{}}});
child.on('error',e=>{console.error('客户端启动失败：'+e.message);stop(1)});
child.on('exit',(code,signal)=>{if(!done){if(!mainSeen){console.error('客户端在主题连接前退出，请检查安装与启动环境。');stop(1)}else{console.log('主题窗口已关闭。');stop(code===0||signal?0:1)}}});
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
const started=Date.now();let busy=false;
async function tick(){if(busy||done)return;busy=true;try{
  const {targetInfos}=await call('Target.getTargets');
  const targets=targetInfos.filter(t=>t.type==='page'&&t.url.startsWith('app:')&&t.url.includes('/index.html')&&!t.url.includes('avatar-overlay'));
  const main=targets.find(t=>t.targetId===mainId)||targets[0];
  if(!main){if(mainSeen){if(!missingSince)missingSince=Date.now();if(Date.now()-missingSince>4000)stop()}else if(Date.now()-started>45000){console.error('未找到客户端主窗口。');stop(1)}return}
  mainSeen=true;missingSince=0;
  if(main.targetId!==mainId){mainId=main.targetId;session=(await call('Target.attachToTarget',{targetId:mainId,flatten:true})).sessionId;await call('Page.enable',{},session);await call('Page.addScriptToEvaluateOnNewDocument',{source},session);await call('Runtime.evaluate',{expression:source},session);console.log('主题注入请求已发送，等待客户端界面完成加载。');}
}catch(e){if(!done){console.error('主题加载异常：'+e.message);if(!mainSeen&&Date.now()-started>45000){console.error('未能连接客户端调试管道。');stop(1)}}}finally{busy=false}}
const ticker=setInterval(tick,1200);tick();
if(process.argv.includes('--verify')||process.argv.includes('--verify-sound')){
  const until=Date.now()+55000;
  let checkingSound=false;
  const verify=setInterval(async()=>{if(done){clearInterval(verify);return}if(!session){if(Date.now()>until){console.error('验证超时：未连接客户端。');clearInterval(verify);stop(1)}return}
    try{const result=await call('Runtime.evaluate',{expression:`(()=>({theme:document.documentElement.dataset.maidWindow==='active',root:!!document.querySelector('#maid-runtime-root'),outline:document.querySelector('#maid-runtime-root')?.dataset.outline,sidebar:!!document.querySelector('[data-slate-sidebar-content]'),surface:!!document.querySelector('[data-app-shell-main-surface=default]'),composer:!!document.querySelector('[data-codex-composer]'),wallpaperApplied:(()=>{const e=document.querySelector('[data-app-shell-main-surface=default]');return !!e&&getComputedStyle(e).backgroundImage.includes('data:image/webp')})(),composerVisible:(()=>{const e=document.querySelector('[data-codex-composer]');return !!e&&getComputedStyle(e).visibility==='visible'&&e.getBoundingClientRect().width>0})(),introFinished:document.querySelector('.maid-intro')?.classList.contains('is-done')}))()`,returnByValue:true},session);const v=result.result.value;if(v.theme&&v.root&&v.sidebar&&v.surface&&v.composer&&v.wallpaperApplied&&v.composerVisible&&v.introFinished){
      if(process.argv.includes('--verify-sound')){
        if(checkingSound)return;checkingSound=true;
        const box=await call('Runtime.evaluate',{expression:`(()=>{const r=document.querySelector('.maid-avatar')?.getBoundingClientRect();return r?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`,returnByValue:true},session);
        if(!box.result.value)throw Error('未找到角色按钮');
        const {x,y}=box.result.value;
        await call('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1},session);
        await call('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1},session);
        await new Promise(resolve=>setTimeout(resolve,150));
        const sound=await call('Runtime.evaluate',{expression:"window.__maidAtelierRuntime?.audioState",returnByValue:true},session);
        if(sound.result.value!=='running')throw Error('声音未启动: '+sound.result.value);
        v.soundState=sound.result.value;
      }
      console.log('真实窗口验证：'+JSON.stringify(v));clearInterval(verify);stop(0)
    }else if(Date.now()>until){console.error('真实窗口验证未完成：'+JSON.stringify(v));clearInterval(verify);stop(1)}}catch(e){if(checkingSound||Date.now()>until){console.error('真实窗口验证失败：'+e.message);clearInterval(verify);stop(1)}}
  },1200);
}
