// Rend voeux.html image par image puis encode en MP4 avec ffmpeg.
// Usage : node render.mjs [fps] [--preview t1,t2,...]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const dir = path.dirname(new URL(import.meta.url).pathname);
const fps = Number(process.argv[2]) || 60;
const prevIdx = process.argv.indexOf('--preview');
// petit serveur local (les images chargées en file:// bloqueraient l'export du canvas)
const types = { '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://localhost:${server.address().port}/voeux.html?static`);
await page.evaluate(() => window.ready);

async function frame(t) {
  return page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);
}

if (prevIdx > 0) {
  const out = process.argv[prevIdx + 2] || path.join(dir, 'preview');
  fs.mkdirSync(out, { recursive: true });
  for (const t of process.argv[prevIdx + 1].split(',').map(Number))
    fs.writeFileSync(path.join(out, `t${t.toFixed(2)}.png`), Buffer.from(await frame(t), 'base64'));
} else {
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(dir, 'video-sans-son.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = 15 * fps;
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from(await frame(i / fps), 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`image ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
server.close();
