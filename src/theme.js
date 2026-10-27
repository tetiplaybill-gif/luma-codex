/* Injected into the chosen desktop renderer. No network hooks or chat reads. */
(() => {
  if (window.__maidAtelierRuntime) return;
  const assets = __MAID_ASSETS__;
  const css = __MAID_CSS__;
  const style = document.createElement('style');
  style.id = 'maid-atelier-runtime-style'; style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  document.documentElement.dataset.maidWindow = 'active';
  const root = document.createElement('div'); root.id = 'maid-runtime-root';
  root.innerHTML = `<div class="maid-corner"><div class="maid-bubble" aria-live="polite">欢迎回来，今天也一起加油！</div><button class="maid-avatar" type="button" aria-label="和伴侣打招呼"><img src="${assets.chibi}" alt=""></button></div><button class="maid-replay" type="button" title="重播开场" aria-label="重播女仆开场">✦</button><div class="maid-intro"><div class="maid-intro-bg"></div><canvas class="maid-intro-canvas"></canvas><img class="maid-portrait" alt="" src="${assets.left}"><canvas class="maid-outline"></canvas><button class="maid-skip" type="button">跳过开场 ↗</button></div>`;
  (document.body || document.documentElement).appendChild(root);
  const intro = root.querySelector('.maid-intro');
  const outline = root.querySelector('.maid-outline');
  const sky = root.querySelector('.maid-intro-canvas');
  let raf = 0, deadline = 0, stopTimer = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let outlineReady = false;
  function buildOutline() {
    const img = new Image();
    img.onload = () => {
      const w=360,h=Math.round(w*img.naturalHeight/img.naturalWidth); outline.width=w;outline.height=h;
      const c=outline.getContext('2d',{willReadFrequently:true});
      c.clearRect(0,0,w,h); c.drawImage(img,0,0,w,h);
      const source=c.getImageData(0,0,w,h);const result=c.createImageData(w,h);const p=source.data;
      const lum=i => ((p[i]*.2126+p[i+1]*.7152+p[i+2]*.0722)*p[i+3]/255);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        let i=(y*w+x)*4, l=lum(i-4),r=lum(i+4),u=lum(i-w*4),d=lum(i+w*4);
        let edge=Math.min(255,(Math.abs(r-l)+Math.abs(d-u))*2.1);
        if(edge>28){ result.data[i]=186;result.data[i+1]=228;result.data[i+2]=255;result.data[i+3]=edge; }
      }
      c.putImageData(result,0,0);outlineReady=true;root.dataset.outline='ready';
    };
    img.onerror=()=>{root.dataset.outline='unavailable'}; img.src=assets.left;
  }
  function draw(now) {
    const elapsed=(now-deadline)/1000;
    const w=sky.clientWidth,h=sky.clientHeight,scale=Math.min(devicePixelRatio||1,1.5);
    if(sky.width!==Math.floor(w*scale)||sky.height!==Math.floor(h*scale)){sky.width=Math.floor(w*scale);sky.height=Math.floor(h*scale)}
    const c=sky.getContext('2d');c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,w,h);
    const strength=Math.max(0,1-Math.max(0,elapsed-6)/2.2);
    c.save();c.globalCompositeOperation='lighter';
    for(let j=0;j<4;j++){
      c.beginPath();const offset=j*30;const move=elapsed*70;
      c.moveTo(-120,h*.45+offset);c.bezierCurveTo(w*.2,h*.1+Math.sin(elapsed+j)*40,w*.52,h*.95-offset,w+120,h*.32+Math.cos(elapsed+j)*60);
      const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'transparent');g.addColorStop(.3,j%2?'#f9a8ff':'#75f3ff');g.addColorStop(.7,j%2?'#a9b7ff':'#b2ecff');g.addColorStop(1,'transparent');
      c.strokeStyle=g;c.globalAlpha=strength*(.35+.2*Math.sin(elapsed*2+j));c.lineWidth=j===0?2.4:1;c.shadowColor=j%2?'#d78dff':'#80d5ff';c.shadowBlur=18;c.setLineDash([w*.27,w*.9]);c.lineDashOffset=-move-j*90;c.stroke();
    }
    c.setLineDash([]);for(let i=0;i<30;i++){const x=(i*89.71%w),y=(i*63.37%h);c.globalAlpha=strength*(.25+.35*Math.sin(elapsed*2+i));c.fillStyle='#e3f4ff';c.beginPath();c.arc(x,y,i%6===0?2:1,0,Math.PI*2);c.fill()}
    c.restore();if(elapsed<9.2)raf=requestAnimationFrame(draw);
  }
  function finish() {clearTimeout(stopTimer);cancelAnimationFrame(raf);intro.classList.add('is-done');}
  function play() {
    clearTimeout(stopTimer);cancelAnimationFrame(raf);intro.classList.add('is-done');
    void intro.offsetWidth;intro.classList.remove('is-done');
    for(const e of [outline,root.querySelector('.maid-portrait')]){e.style.animation='none';void e.offsetWidth;e.style.animation=''}
    deadline=performance.now();raf=requestAnimationFrame(draw);const waitForWorkspace=()=>{const ready=!!document.querySelector('[data-app-shell-main-surface=default]')||location.protocol!=='app:';if(ready||performance.now()-deadline>45000)finish();else stopTimer=setTimeout(waitForWorkspace,500)};stopTimer=setTimeout(waitForWorkspace,9500);
  }
  const bubble=root.querySelector('.maid-bubble');let greeting=0;
  let audioContext=null,lastSound=-Infinity;
  function playGreetingSound() {
    try {
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      if(!audioContext || audioContext.state==='closed') audioContext=new Audio();
      if(audioContext.state==='suspended') audioContext.resume().catch(()=>{});
      const now=audioContext.currentTime;
      if(now-lastSound<0.12)return;
      lastSound=now;
      for(const [frequency,delay] of [[880,0],[1320,0.075]]) {
        const tone=audioContext.createOscillator(),volume=audioContext.createGain();
        tone.type='sine';tone.frequency.setValueAtTime(frequency,now+delay);
        volume.gain.setValueAtTime(0.0001,now+delay);
        volume.gain.exponentialRampToValueAtTime(0.045,now+delay+0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.23);
        tone.connect(volume);volume.connect(audioContext.destination);
        tone.start(now+delay);tone.stop(now+delay+0.24);
        tone.onended=()=>{tone.disconnect();volume.disconnect()};
      }
    } catch (_) { /* A sound failure must not interrupt the companion. */ }
  }
  const greetings=['欢迎回来，今天也一起加油！','我在这里，慢慢来。','灵感准备好了，随时开始。'];
  root.querySelector('.maid-avatar').addEventListener('click',()=>{greeting=(greeting+1)%greetings.length;bubble.textContent=greetings[greeting];playGreetingSound()});
  const onFocus=e=>{if(e.target.closest?.('[data-codex-composer]'))bubble.textContent='我在这里，慢慢写。'};
  document.addEventListener('focusin',onFocus);
  root.querySelector('.maid-skip').addEventListener('click',finish);
  root.querySelector('.maid-replay').addEventListener('click',play);
  const onKey=e=>{if(e.key==='Escape'&&!intro.classList.contains('is-done'))finish()};
  document.addEventListener('keydown',onKey);
  buildOutline();
  if(reduced.matches)finish();else play();
  window.__maidAtelierRuntime={version:'0.1.0', replay:play, finish, get outlineReady(){return outlineReady},get audioState(){return audioContext?.state||'inactive'},dispose(){finish();if(audioContext&&audioContext.state!=='closed')audioContext.close().catch(()=>{});document.removeEventListener('keydown',onKey);document.removeEventListener('focusin',onFocus);root.remove();style.remove();delete document.documentElement.dataset.maidWindow;delete window.__maidAtelierRuntime}};
})();
