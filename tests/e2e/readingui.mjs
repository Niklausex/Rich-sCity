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
await pg.evaluate(() => document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: true } })));
const stopShown = await pg.evaluate(() => document.getElementById('btn-read-stop').style.display !== 'none');
await pg.evaluate(() => document.dispatchEvent(new CustomEvent('tts-state', { detail: { speaking: false } })));
const stopHiddenAgain = await pg.evaluate(() => document.getElementById('btn-read-stop').style.display === 'none');
console.log('stopShown:', stopShown, 'stopHiddenAgain:', stopHiddenAgain);
await pg.screenshot({ path: '/tmp/reading_v341.png', fullPage: false });
console.log('console errors:', errs.length, errs.slice(0,3));
await b.close();
