// Browser checks for the Karts section. Build first (npm run build:karts
// and the Vite build), then run: node kart-parts/browser.mjs
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import assert from 'node:assert/strict';

const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json'};
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url, 'http://localhost').pathname; if (path.endsWith('/')) path += 'index.html';
    const file = path.startsWith('/test-lab/') ? resolve('public', '.' + path) : resolve('dist', '.' + path);
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium', headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
try {
  // 1. The page on its own, at phone and desktop sizes.
  for (const viewport of [{width: 390, height: 844}, {width: 844, height: 390}, {width: 1280, height: 800}]) {
    const page = await browser.newPage({viewport}), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/karts/`); await page.waitForFunction(() => window.kartLabReady, undefined, {timeout: 60000});
    const state = await page.evaluate(() => ({
      karts: kartLab.karts.map(k => k.kart.label),
      wheels: kartLab.karts.map(k => k.model.getObjectByName('wheels').children.length),
      dummies: kartLab.karts.every(k => k.dummy.visible),
      parts: kartLab.karts.every(k => Object.keys(k.kart.design).every(s => !!k.model.getObjectByName('part:' + s))),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.deepEqual(state, {karts: ['GoKart', 'GT GoKart', 'F1 GoKart'], wheels: [4, 4, 4], dummies: true, parts: true, overflow: false}, JSON.stringify(viewport));
    // Picking a kart looks at it alone; All three shows every kart again.
    await page.getByRole('button', {name: 'GT GoKart', exact: true}).click();
    assert.deepEqual(await page.evaluate(() => [kartLab.kart.label, kartLab.getFocus(), kartLab.karts.map(k => k.group.visible)]), ['GT GoKart', 'kart', [false, true, false]]);
    await page.getByRole('button', {name: 'All three'}).click();
    assert.deepEqual(await page.evaluate(() => kartLab.karts.map(k => k.group.visible)), [true, true, true]);
    await page.getByRole('button', {name: 'Driver', exact: true}).click();
    assert.equal(await page.evaluate(() => kartLab.karts.some(k => k.dummy.visible)), false, 'driver toggle hides the drivers');
    await page.getByRole('button', {name: 'Driver', exact: true}).click();
    // Swapping a wing style snaps it onto the same mount and shows its box.
    await page.getByRole('button', {name: 'GoKart', exact: true}).click();
    const before = await page.evaluate(() => kartLab.current.outlines.getObjectByName('slot:wing').position.toArray());
    await page.getByRole('button', {name: 'Tall extended wing'}).click();
    const after = await page.evaluate(() => ({at: kartLab.current.outlines.getObjectByName('slot:wing').position.toArray(), style: kartLab.choices.wing, shown: kartLab.current.outlines.visible}));
    assert.equal(after.style, 'tall-wing'); assert.ok(after.shown, 'part boxes shown');
    assert.ok(after.at[2] < before[2] && after.at[1] > before[1], 'extended wing sits further back and higher');
    await page.getByRole('button', {name: 'Fenders (optional)'}).click();
    assert.match(await page.locator('#note').textContent(), /^Fenders:/);
    for (const name of ['Front', 'Side', 'Back', 'Top', 'Angled']) {
      await page.getByRole('button', {name, exact: true}).click();
      assert.equal(await page.getByRole('button', {name, exact: true}).getAttribute('aria-pressed'), 'true');
    }
    assert.deepEqual(errors, []);
    console.log(`Karts page OK at ${viewport.width}x${viewport.height}`);
    await page.close();
  }
  // 2. Inside the Test Lab, like the other sections.
  const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/test-lab/`); await page.waitForFunction(() => window.testLabReady, undefined, {timeout: 60000});
  await page.locator('#subject').selectOption('karts'); await page.waitForFunction(() => window.testLabReady, undefined, {timeout: 60000});
  assert.equal(await page.evaluate(() => testLab.getState().subject), 'karts');
  assert.equal(await page.locator('#test-context').textContent(), 'Karts');
  assert.equal(await page.evaluate(() => testLab.frame.contentWindow.testLabScene.getState().floorColor), '8f9295');
  await page.evaluate(() => testLab.setInspection(true));
  assert.ok(await page.evaluate(() => testLab.frame.contentWindow.testLabScene.floors.every(f => !f.visible)));
  await page.evaluate(() => testLab.setView('isometric'));
  assert.equal(await page.evaluate(() => testLab.frame.contentWindow.testLabScene.getState().isometric), true);
  // The Test Lab's copy of the side panel stays in step with the page when
  // switching karts and swapping styles (owner report, 22 Nov 2026).
  const lab = page.locator('#live-controls'), state = () => page.evaluate(() => { const k = testLab.frame.contentWindow.kartLab; return {kart: k.kart.label, wing: k.choices.wing}; });
  for (const [tap, kartName, wing] of [['F1 GoKart', 'F1 GoKart', 'f1-wing'], ['GT GoKart', 'GT GoKart', 'gt-wing'], ['GT wing', 'GT GoKart', 'gt-wing'], ['Tall extended wing', 'GT GoKart', 'tall-wing'], ['F1 GoKart', 'F1 GoKart', 'f1-wing'], ['GoKart', 'GoKart', 'low-spoiler']]) {
    const copy = lab.getByRole('button', {name: tap, exact: true});
    assert.equal(await copy.count(), 1, `exactly one visible "${tap}" button`);
    await copy.tap();
    assert.deepEqual(await state(), {kart: kartName, wing}, `after tapping ${tap}`);
    assert.equal(await copy.getAttribute('aria-pressed'), 'true', `"${tap}" shows as pressed`);
  }
  assert.equal(await lab.getByRole('button', {name: 'GT wing', exact: true}).count(), 0, 'other karts\' buttons are hidden');
  for (const name of ['F1 GoKart', 'GT GoKart', 'F1 GoKart']) await lab.getByRole('button', {name, exact: true}).tap({noWaitAfter: true});// quick taps
  assert.equal((await state()).kart, 'F1 GoKart', 'the last quick tap wins');
  assert.deepEqual(errors, []);
  console.log('Karts loads in the Test Lab with grey floor, Inspection, Isometric and a working copied panel');
} finally { await browser.close(); server.close(); }
