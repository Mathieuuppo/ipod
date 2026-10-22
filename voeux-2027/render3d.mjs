// Rend voeux3d.html image par image (WebGL logiciel) dans frames/, en plusieurs processus.
// Usage : node render3d.mjs <fps> <worker> <nbWorkers>   |   node render3d.mjs preview t1,t2,... <dossier>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const dir = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', m => { if (m.type() === 'error') console.error('page:', m.text()); });
page.on('pageerror', e => console.error('pageerror:', e.message));
await page.goto(`http://localhost:${server.address().port}/voeux3d.html?static`);
await page.evaluate(() => window.ready);
const frame = t => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);

if (process.argv[2] === 'preview') {
  const out = process.argv[4];
  fs.mkdirSync(out, { recursive: true });
  for (const t of process.argv[3].split(',').map(Number)) {
    const t0 = Date.now();
    fs.writeFileSync(path.join(out, `t${t.toFixed(2)}.png`), Buffer.from(await frame(t), 'base64'));
    console.log(t, Date.now() - t0, 'ms');
  }
} else {
  const fps = Number(process.argv[2]), w = Number(process.argv[3]), nw = Number(process.argv[4]);
  const n = Math.round(45 * fps), out = path.join(dir, 'frames');
  fs.mkdirSync(out, { recursive: true });
  for (let i = w; i < n; i += nw) {
    const f = path.join(out, `f${String(i).padStart(5, '0')}.png`);
    if (fs.existsSync(f)) continue; // reprise possible
    fs.writeFileSync(f + '.tmp', Buffer.from(await frame(i / fps), 'base64'));
    fs.renameSync(f + '.tmp', f);
    if (i % 60 < nw) console.log(`worker ${w}: image ${i}/${n}`);
  }
}
await browser.close();
server.close();
