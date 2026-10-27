'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const bundle = require('../src/bundle.cjs');
let browser;
(async () => {
  const executablePath=process.env.CHROME_EXECUTABLE||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
  browser = await chromium.launch({ ...(executablePath ? {executablePath} : {}), headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    const connect = GainNode.prototype.connect;
    window.__audioTest = { contexts: 0, starts: 0, context: null, analyser: null };
    window.AudioContext = class extends NativeAudioContext {
      constructor(...args) { super(...args); window.__audioTest.contexts++; window.__audioTest.context=this; }
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function(...args) { window.__audioTest.starts++; return start.apply(this,args); };
    GainNode.prototype.connect = function(destination, ...args) {
      if (destination instanceof AudioDestinationNode) {
        let analyser = window.__audioTest.analyser;
        if (!analyser) { analyser = this.context.createAnalyser(); analyser.fftSize=2048; analyser.connect(destination); window.__audioTest.analyser=analyser; }
        return connect.call(this, analyser, ...args);
      }
      return connect.call(this, destination, ...args);
    };
  });
  await page.goto('file://' + path.join(__dirname,'fixture.html'));
  await page.addScriptTag({ content: bundle() });
  assert.equal(await page.evaluate(() => window.__audioTest.contexts), 0, 'audio should not start on load');
  await page.locator('.maid-avatar').click();
  const first = await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
    const t = window.__audioTest, samples = new Float32Array(t.analyser.fftSize);
    t.analyser.getFloatTimeDomainData(samples);
    return { contexts:t.contexts, starts:t.starts, state:t.context.state, peak:Math.max(...samples.map(Math.abs)) };
  });
  assert.equal(first.contexts, 1); assert.equal(first.starts, 2);
  assert.equal(first.state, 'running'); assert.ok(first.peak > 0.001, `audio signal missing: ${first.peak}`);
  await page.waitForTimeout(300);
  await page.locator('.maid-avatar').click();
  assert.deepEqual(await page.evaluate(() => ({ contexts:window.__audioTest.contexts, starts:window.__audioTest.starts })), { contexts:1, starts:4 });
  await page.evaluate(() => window.__maidAtelierRuntime.dispose());
  await page.waitForFunction(() => window.__audioTest.context.state === 'closed');
  console.log('PASS: click creates audible Web Audio signal, reuses context, and closes on disposal; no sound on load');
  await browser.close();
})().catch(async error => { console.error(error); process.exitCode=1; if (browser) await browser.close(); });
