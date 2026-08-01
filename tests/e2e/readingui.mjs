import { chromium } from 'playwright-core';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await pg.evaluate(() => { localStorage.clear(); });
await pg.reload({ waitUntil: 'networkidle' });
await pg.evaluate(() => { document.querySelectorAll('.modal-overlay').forEach(m => m.remove()); });
await pg.evaluate(() => UI.openPanel('reading'));
await pg.waitForTimeout(500);
const info = await pg.evaluate(() => {
  const paras = document.querySelectorAll('.btn-read-para').length;
  const stop = document.getElementById('btn-read-stop');
  const words = document.querySelector('#panel-title') ? true : null;
  const txt = document.getElementById('read-text');
  return { paras, stopHidden: stop && stop.style.display === 'none', textLen: txt ? txt.textContent.length : 0,
           title: document.body.textContent.includes('今日短文') };
});
console.log(JSON.stringify(info));
// click play, then check tts-state / stop button behavior via dispatch (headless has no TTS voices)
await pg.evaluate(() => document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: true, paused: false } })));
const s1 = await pg.evaluate(() => {
  const stop = document.getElementById('btn-read-stop');
  const pauses = [...document.querySelectorAll('.btn-tts-pause')];
  return { stopShown: stop.style.display !== 'none',
           pauseCount: pauses.length,
           pausesShown: pauses.every(p => p.style.display !== 'none'),
           label: pauses[0] ? pauses[0].textContent.trim() : '' };
});
await pg.evaluate(() => document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: true, paused: true } })));
const s2 = await pg.evaluate(() => {
  const p = document.querySelector('.btn-tts-pause');
  return { label: p.textContent.trim(), green: p.classList.contains('btn-green') };
});
await pg.evaluate(() => document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: false, paused: false } })));
const s3 = await pg.evaluate(() => {
  const stop = document.getElementById('btn-read-stop');
  const p = document.querySelector('.btn-tts-pause');
  return { stopHidden: stop.style.display === 'none', pauseHidden: p.style.display === 'none' };
});
console.log('speaking:', JSON.stringify(s1));
console.log('paused:', JSON.stringify(s2));
console.log('stopped:', JSON.stringify(s3));
await pg.screenshot({ path: '/tmp/reading_v341.png', fullPage: false });
console.log('console errors:', errs.length, errs.slice(0,3));
await b.close();
