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
      chassis: !!kartLab.base.getObjectByName('steering_wheel'),
      wheels: kartLab.base.getObjectByName('wheels').children.length,
      allFit: kartLab.outlines.children.every(b => b.userData.fits),
      driverZone: kartLab.zone.children.length,
      main: !!kartLab.mainKart.getObjectByName('front_axle_left_wheel'),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.deepEqual(state, {chassis: true, wheels: 4, allFit: true, driverZone: 3, main: true, overflow: false}, JSON.stringify(viewport));
    // Each kart loads with its own wheels, part boxes and driver zone, all fitting.
    for (const name of ['GT GoKart', 'F1 GoKart', 'GoKart']) {
      await page.getByRole('button', {name, exact: true}).click();
      const k = await page.evaluate(() => ({label: kartLab.kart.label, wheels: kartLab.base.getObjectByName('wheels')?.children.length ?? kartLab.base.children.length, fit: kartLab.outlines.children.every(b => b.userData.fits), boxes: kartLab.outlines.children.length}));
      assert.equal(k.label, name); assert.equal(k.wheels, 4); assert.ok(k.fit && k.boxes > 10, JSON.stringify(k));
    }
    // Swapping a wing style snaps the new wing onto the same mount.
    const before = await page.evaluate(() => kartLab.outlines.getObjectByName('slot:wing').position.toArray());
    await page.getByRole('button', {name: 'Tall extended wing'}).click();
    const after = await page.evaluate(() => ({at: kartLab.outlines.getObjectByName('slot:wing').position.toArray(), style: kartLab.choices.wing}));
    assert.equal(after.style, 'tall-wing'); assert.ok(after.at[2] < before[2] && after.at[1] > before[1], 'extended wing sits further back and higher');
    assert.equal(await page.getByRole('button', {name: 'Tall extended wing'}).getAttribute('aria-pressed'), 'true');
    // Focus buttons hide the other kart; part buttons highlight; toggles work.
    await page.getByRole('button', {name: 'New kart'}).click();
    assert.deepEqual(await page.evaluate(() => [kartLab.newKart.visible, kartLab.mainKart.visible]), [true, false]);
    await page.getByRole('button', {name: 'Main kart'}).click();
    assert.deepEqual(await page.evaluate(() => [kartLab.newKart.visible, kartLab.mainKart.visible]), [false, true]);
    await page.getByRole('button', {name: 'Both karts'}).click();
    await page.getByRole('button', {name: 'Fenders'}).click();
    assert.equal(await page.getByRole('button', {name: 'Fenders'}).getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('#note').textContent(), /^Fenders:/);
    await page.getByRole('button', {name: 'Part boxes'}).click();
    assert.equal(await page.evaluate(() => kartLab.outlines.visible), false);
    await page.getByRole('button', {name: 'Driver zone'}).click();
    assert.equal(await page.evaluate(() => kartLab.zone.visible), false);
    for (const name of ['Front', 'Side', 'Back', 'Top', 'Angled']) {
      await page.getByRole('button', {name, exact: true}).click();
      assert.equal(await page.getByRole('button', {name, exact: true}).getAttribute('aria-pressed'), 'true');
    }
    const pixels = await page.evaluate(() => { const c = kartLab.renderer.domElement; return c.width*c.height; });
    assert.ok(pixels > 0);
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
  assert.deepEqual(errors, []);
  console.log('Karts loads in the Test Lab with grey floor, Inspection and Isometric');
} finally { await browser.close(); server.close(); }
