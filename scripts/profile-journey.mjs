// Reproducible production-browser probe. No extra npm dependencies.
// node scripts/profile-journey.mjs baseline [width height dpr]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const label = process.argv[2] || 'current';
const watchdog = setTimeout(() => { console.error('Profile timed out'); process.exit(1); }, 120000);
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 900);
const dpr = Number(process.argv[5] || 1);
const tracing = process.env.PERF_TRACE !== '0';
const out = resolve('.cache/journey-perf', label);
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/portfolio\/?/, '');
  const file = relative.startsWith('assets/') ? resolve('dist', relative) : resolve('dist/index.html');
  try {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${out}/profile`,
  '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--hide-scrollbars', 'about:blank',
  ...(process.env.PERF_CPU_RASTER === '1' ? ['--disable-gpu-rasterization'] : []),
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 15000);
    chrome.stderr.on('data', chunk => {
      const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolveEndpoint(match[1]); }
    });
    chrome.on('error', reject);
  });
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  console.log('Chrome connected');
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const entry = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
      else entry.resolve(msg.result);
    } else listeners.get(msg.method)?.(msg.params);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolveCall, reject) => {
    pending.set(++id, { resolve: resolveCall, reject });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await page('Page.enable');
  await page('Runtime.enable');
  await page('Performance.enable');
  // External font availability must not turn a local rendering test into a network wait.
  await page('Network.enable');
  await page('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  if (process.env.PERF_FALLBACK === '1' || process.env.PERF_SHADER_FAILURE === '1') {
    await page('Page.addScriptToEvaluateOnNewDocument', { source: `
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (${process.env.PERF_FALLBACK === '1'} && type === 'webgl') return null;
        const context = original.call(this, type, ...args);
        if (${process.env.PERF_SHADER_FAILURE === '1'} && type === 'webgl' && context) {
          context.getShaderParameter = () => false;
        }
        return context;
      };
      if (${process.env.PERF_FALLBACK === '1'}) window.createImageBitmap = undefined;
    ` });
  }
  await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false });
  if (process.env.PERF_REDUCED === '1') await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const errors = [];
  listeners.set('Runtime.exceptionThrown', value => errors.push(value));
  const loaded = new Promise(r => listeners.set('Page.loadEventFired', r));
  await page('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/portfolio/?perf=1` });
  await loaded;
  console.log('Production page loaded');
  await evaluate('document.fonts.ready.then(() => Promise.all(Array.from(document.images, i => i.decode().catch(() => {}))))');
  await evaluate(`new Promise(resolveReady => {
    const canvas = document.querySelector('.jj-scenery--back');
    if (!canvas) return resolveReady();
    const started = performance.now();
    function check() { if (canvas.dataset.ready === 'true' || performance.now() - started > 5000) resolveReady(); else requestAnimationFrame(check); }
    check();
  })`);
  await new Promise(r => setTimeout(r, 800));
  if (process.env.PERF_CSS) await evaluate(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(process.env.PERF_CSS)}; document.head.append(s); })()`);
  if (process.env.PERF_HUD === '1') await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'SHOW HUD').click()`);
  await evaluate(`(() => {
    window.__profileLongFrames = [];
    window.__profileObservers = ['long-animation-frame', 'longtask'].filter(type => PerformanceObserver.supportedEntryTypes.includes(type)).map(type => {
      const observer = new PerformanceObserver(list => window.__profileLongFrames.push(...list.getEntries().map(entry => ({ ...entry.toJSON(), scripts: entry.scripts?.map(script => script.toJSON()) }))));
      observer.observe({ type });
      return observer;
    });
  })()`);
  const gpu = await send('SystemInfo.getInfo');
  if (process.env.PERF_WARMUP === '1') {
    console.log('Warming all journey phases before the repeat-scroll measurement');
    await evaluate(`new Promise(async resolveWarmup => {
      for (const p of [.1, .18, .35, .5, .65, .8, .9, .96, 1, 0]) {
        scrollTo(0, p * 15000);
        await new Promise(r => setTimeout(r, 650));
      }
      resolveWarmup();
    })`);
  }
  const initial = await page('Performance.getMetrics');
  if (tracing) await send('Tracing.start', { categories: 'devtools.timeline,blink,cc,gpu,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
  const measurements = await evaluate(`new Promise(resolveRun => {
    const frames = []; let last = 0; let start = 0; let previousSegment = -1;
    const transitions = ${process.env.PERF_TRANSITIONS === '1'};
    const segments = Array.from({length: 3}, (_, pass) => [
      { from: .06, to: .20, name: 'landing', pass },
      { from: .20, to: .06, name: 'landing-return', pass },
      { from: .82, to: 1, name: 'underground', pass },
      { from: 1, to: .82, name: 'underground-return', pass },
    ]).flat();
    function tick(now) {
      if (!start) start = now;
      const elapsed = now - start;
      const segment = segments[Math.min(segments.length - 1, Math.floor(elapsed / 2400))];
      const local = elapsed % 2400;
      const segmentIndex = Math.floor(elapsed / 2400);
      const renderedProgress = window.__scrollPerf?.currentProgress || 0;
      const withinSegment = renderedProgress >= Math.min(segment.from, segment.to) - .005
        && renderedProgress <= Math.max(segment.from, segment.to) + .005;
      // Allow the scrub to settle after jumps between the two test sections.
      const progress = transitions ? segment.from + (segment.to - segment.from) * Math.max(0, (local - 400) / 2000)
        : elapsed < 16000 ? elapsed / 16000 : 1 - (elapsed - 16000) / 10000;
      if (last) frames.push({ dt: now - last, time: now, progress: renderedProgress,
        direction: transitions ? segment.to > segment.from ? 'down' : 'up' : elapsed < 16000 ? 'down' : 'up',
        ...(transitions ? { segment: segment.name, pass: segment.pass,
          settling: local < 650 || previousSegment !== segmentIndex || !withinSegment } : {}) });
      previousSegment = segmentIndex;
      last = now;
      window.scrollTo(0, Math.max(0, Math.min(1, progress)) * 15000);
      if (elapsed < ${process.env.PERF_CHECKS_ONLY === '1' ? 0 : process.env.PERF_TRANSITIONS === '1' ? 28800 : 26000}) requestAnimationFrame(tick);
      else setTimeout(() => resolveRun({ frames, telemetry: window.__scrollPerf, images: Array.from(document.images, i => ({ src: i.currentSrc.split('/').pop(), width: i.naturalWidth, height: i.naturalHeight })), tracks: Array.from(document.querySelectorAll('.jj-layer-track'), e => ({ width: e.offsetWidth, height: e.offsetHeight })) }), 650);
    }
    requestAnimationFrame(tick);
  })`);
  console.log('Scroll sweep completed');
  measurements.longFrameDetails = await evaluate('window.__profileLongFrames');
  await writeFile(`${out}/measurements.json`, JSON.stringify(measurements));
  const final = await page('Performance.getMetrics');
  let trace = '{"traceEvents":[]}';
  if (tracing) {
  const traceDone = new Promise(r => listeners.set('Tracing.tracingComplete', r));
  await send('Tracing.end');
  const { stream } = await traceDone;
  trace = '';
  for (;;) {
    const part = await send('IO.read', { handle: stream });
    trace += part.data;
    if (part.eof) break;
  }
  await send('IO.close', { handle: stream });
  await writeFile(`${out}/trace.json`, trace);
  }
  const metrics = Object.fromEntries(final.metrics.map(m => [m.name, m.value - (initial.metrics.find(n => n.name === m.name)?.value || 0)]));
  const events = JSON.parse(trace).traceEvents;
  const timings = {};
  for (const event of events) {
    if (event.ph !== 'X' || !['Paint', 'Layout', 'UpdateLayoutTree', 'RasterTask', 'PrePaint', 'FunctionCall'].includes(event.name)) continue;
    const entry = timings[event.name] ||= { count: 0, totalMs: 0, maxMs: 0 };
    entry.count++; entry.totalMs += (event.dur || 0) / 1000; entry.maxMs = Math.max(entry.maxMs, (event.dur || 0) / 1000);
  }
  const phases = {};
  for (const [name, lo, hi] of [['landing',0,.15], ['cards',.15,.82], ['transition',.82,.95], ['footer',.95,1.01]]) {
    const times = measurements.frames.filter(f => f.progress >= lo && f.progress < hi).map(f => f.dt).sort((a,b) => a-b);
    phases[name] = { frames: times.length, p95ms: times[Math.floor(times.length * .95)], maxMs: times.at(-1), over33ms: times.filter(t => t > 33.4).length, over50ms: times.filter(t => t > 50).length };
  }
  for (const progress of process.env.PERF_MEASURE_ONLY === '1' ? [] : [0, .10, .15, .45, .85, .94, 1]) {
    await evaluate(`window.scrollTo(0, ${progress * 15000})`);
    await new Promise(r => setTimeout(r, 650));
    const shot = await page('Page.captureScreenshot', { format: 'png' });
    await writeFile(`${out}/${Math.round(progress * 100)}.png`, Buffer.from(shot.data, 'base64'));
  }
  const checks = [];
  if (process.env.PERF_MEASURE_ONLY !== '1' && await evaluate('!!document.querySelector(".jj-scenery")')) {
    const footerAtEnd = await evaluate(`(() => {
      const footer = document.querySelector('.jj-footer');
      const button = footer.querySelector('button');
      button.focus({ preventScroll: true });
      return { inert: footer.inert, focusable: document.activeElement === button,
        imageReady: footer.querySelector('img').naturalWidth > 0 };
    })()`);
    assert.equal(footerAtEnd.inert, false, 'footer is interactive after the reveal');
    assert.equal(footerAtEnd.focusable, true, 'footer controls accept keyboard focus');
    assert.equal(footerAtEnd.imageReady, true, 'footer artwork loaded');
    checks.push({ name: 'revealed footer artwork and keyboard access', ...footerAtEnd });
    if (process.env.PERF_REDUCED !== '1') {
      const launch = [];
      for (const progress of [0, .145, .153, .19, .153, 0]) {
        await evaluate(`window.scrollTo(0, ${progress * 15000})`);
        // Allow both the 500ms numeric scrub and the 200ms dust idle period.
        await new Promise(r => setTimeout(r, 850));
        launch.push(await evaluate(`(() => {
          const bike = document.querySelector('.jj-biker');
          const front = document.querySelector('.jj-scenery--front');
          return { bikeZ: getComputedStyle(bike).zIndex, frontZ: getComputedStyle(front).zIndex,
            wheel: getComputedStyle(bike.querySelector('.rim')).transform,
            crank: getComputedStyle(bike.querySelector('.crank-right')).transform,
            heroFinished: document.querySelector('.jj-hero').classList.contains('is-finished'),
            sprites: Array.from(bike.querySelectorAll('.force-visible'), e => e.getAttribute('src')),
            dustIdle: !bike.querySelector('.is-moving') };
        })()`));
      }
      assert.ok(launch.every(s => Number(s.frontZ) > Number(s.bikeZ)), 'foreground stays above the bike throughout launch and return');
      assert.equal(launch[1].heroFinished, true, 'hero retires before launch');
      assert.notEqual(launch[2].wheel, launch[0].wheel, 'wheels start first');
      assert.equal(launch[2].crank, launch[0].crank, 'pedals wait through the initial coast');
      assert.notEqual(launch[3].crank, launch[0].crank, 'pedals engage after coasting');
      assert.deepEqual(launch[4], launch[2], 'reverse scrolling restores the same launch stage');
      assert.deepEqual(launch[5], launch[0], 'return to hero resets bike and sprites');
      assert.ok(launch.every(s => s.dustIdle), 'dust stops after scrolling settles');
      checks.push({ name: 'staged launch, permanent foreground order, reverse and idle reset', launch });
    }
    await evaluate('document.querySelector(".jj-cloud-hud__nav").click()');
    await new Promise(r => setTimeout(r, 1900));
    const card = await evaluate(`(() => {
      const card = document.querySelector('.jj-project');
      const bounds = card.getBoundingClientRect();
      const surfaces = Array.from(document.querySelectorAll('.jj-scenery'), c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight }));
      return { center: bounds.left + bounds.width / 2, viewport: innerWidth, surfaces,
        frontFrames: document.querySelectorAll('.rider-front.force-visible').length,
        backFrames: document.querySelectorAll('.rider-back-leg.force-visible').length };
    })()`);
    assert.ok(Math.abs(card.center - card.viewport / 2) < 2, 'HUD navigation centers the project');
    assert.equal(card.surfaces.length, 4);
    assert.ok(card.surfaces.every(c => c.width <= c.cssWidth + 1 && c.height <= c.cssHeight + 1), 'decorative surfaces have bounded resolution');
    assert.equal(card.frontFrames, 1, 'exactly one torso sprite is visible');
    assert.equal(card.backFrames, 1, 'exactly one leg sprite is visible');
    checks.push({ name: 'navigation, bounded scenery, sprite selection', ...card });
    await evaluate('window.scrollTo(0, 2100)');
    await new Promise(r => setTimeout(r, 650));
    const scrub = await evaluate(`new Promise(resolveCheck => {
      scrollTo(0, 3300);
      const samples = []; let n = 0;
      function sample() {
        samples.push({ p: window.__scrollPerf.currentProgress, y: scrollY, bike: document.querySelector('.jj-biker').style.transform, track: document.querySelector('.jj-scenery--back').dataset.progress });
        if (++n < 40) requestAnimationFrame(sample); else resolveCheck(samples);
      }
      requestAnimationFrame(sample);
    })`);
    assert.ok(scrub.some((s, i) => i && s.y === scrub[i-1].y && s.p !== scrub[i-1].p && (process.env.PERF_REDUCED === '1' || s.bike !== scrub[i-1].bike) && s.track !== scrub[i-1].track), 'bike and scenery continue together after input stops');
    checks.push({ name: 'scrub remains synchronized after input stops', passed: true });
    await page('Emulation.setDeviceMetricsOverride', { width: width === 390 ? 900 : 390, height: 844, deviceScaleFactor: dpr, mobile: false });
    await new Promise(r => setTimeout(r, 700));
    const resized = await evaluate(`({ p: window.__scrollPerf.currentProgress, transform: document.querySelector('.jj-biker').style.transform, widths: Array.from(document.querySelectorAll('.jj-scenery'), e => e.width) })`);
    assert.ok(Number.isFinite(resized.p) && !/NaN/.test(resized.transform));
    assert.ok(resized.widths.every(w => w > 0 && w < 3000));
    checks.push({ name: 'resize recalculates bounded geometry', ...resized });
    const href = await evaluate('document.querySelectorAll(".jj-project")[2].getAttribute("href")');
    const slug = href.split('/').at(-1);
    await page('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/portfolio/?perf=1#${slug}` });
    // Changing only the hash is same-document navigation and emits no load
    // event. Reload at that hash to exercise a genuine restoration on mount.
    const hashLoaded = new Promise(r => listeners.set('Page.loadEventFired', r));
    await page('Page.reload');
    await hashLoaded;
    await new Promise(r => setTimeout(r, 1100));
    const hash = await evaluate(`(() => { const bounds = document.querySelectorAll('.jj-project')[2].getBoundingClientRect(); return { center: bounds.left + bounds.width / 2, viewport: innerWidth, overlay: !!document.querySelector('.jj-transition-overlay'), telemetryFrames: Object.keys(window.__scrollPerf.phaseFrames).length }; })()`);
    assert.ok(Math.abs(hash.center - hash.viewport / 2) < 2, 'direct hash restores the chosen project');
    assert.equal(hash.overlay, false, 'restoration overlay is removed');
    assert.ok(hash.telemetryFrames > 0, 'hidden HUD records via ?perf=1');
    assert.equal(await evaluate('document.querySelector(".jj-footer").inert'), true, 'covered footer does not capture keyboard focus');
    checks.push({ name: 'hash restoration and background telemetry', ...hash });
    if (process.env.PERF_FALLBACK === '1' || process.env.PERF_SHADER_FAILURE === '1') {
      const fallback = await evaluate(`Array.from(document.querySelectorAll('.jj-scenery'), c => c.dataset.renderer)`);
      assert.ok(fallback.every(renderer => renderer === 'canvas2d'), 'all scenery survives unavailable WebGL or shader failure');
      checks.push({ name: 'Canvas2D fallback', passed: true });
    } else {
      const restored = await evaluate(`new Promise(resolveRestore => {
        const canvas = document.querySelector('.jj-scenery--back');
        const extension = canvas.getContext('webgl').getExtension('WEBGL_lose_context');
        if (!extension) return resolveRestore('unsupported');
        extension.loseContext();
        setTimeout(() => extension.restoreContext(), 100);
        const started = performance.now();
        const poll = () => {
          const current = document.querySelector('.jj-scenery--back');
          if (current !== canvas && current.dataset.ready === 'true') return resolveRestore('restored');
          if (performance.now() - started > 5000) return resolveRestore('timeout');
          setTimeout(poll, 50);
        };
        poll();
      })`);
      assert.notEqual(restored, 'timeout', 'scenery recovers after losing its graphics context');
      checks.push({ name: 'graphics context restoration', result: restored });
    }
  }
  assert.equal(errors.length, 0, 'no runtime exceptions');
  const transitions = Object.fromEntries([...new Set(measurements.frames.filter(f => f.segment && !f.settling).map(f => f.segment + ':' + f.pass))].map(key => {
    const times = measurements.frames.filter(f => !f.settling && f.segment + ':' + f.pass === key).map(f => f.dt).sort((a,b) => a-b);
    return [key, { frames: times.length, maxMs: times.at(-1), over33ms: times.filter(t => t > 33.4).length, over50ms: times.filter(t => t > 50).length }];
  }));
  const report = { label, width, height, dpr, tracing, transitions, checksOnly: process.env.PERF_CHECKS_ONLY === '1', warmed: process.env.PERF_WARMUP === '1', cpuRaster: process.env.PERF_CPU_RASTER === '1', ablationCSS: process.env.PERF_CSS || null, externalFontsBlocked: true, checks, gpu: gpu.gpu, phases, timings, metrics, errors, ...measurements };
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ label, phases, transitions, timings, checks, errors, tracks: measurements.tracks }, null, 2));
  await send('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
  server.close();
  clearTimeout(watchdog);
}
