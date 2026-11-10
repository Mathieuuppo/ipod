// Rendu de contrôle : node tools/stills.mjs 30 120 240 ...  -> out/stills/fXXXX.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';

const COMP = process.env.COMP ?? 'MaSelfieBoxAd';
const PREFIX = COMP === 'MaSelfieBoxAd' ? 'f' : 'v';
const frames = process.argv.slice(2).map(Number);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opts = {serveUrl, id: COMP, browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : null, chromiumOptions: {gl: 'swangle'}};
const composition = await selectComposition(opts);
fs.mkdirSync('out/stills', {recursive: true});
for (const frame of frames) {
  await renderStill({...opts, composition, frame, output: `out/stills/${PREFIX}${String(frame).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 85});
  process.stdout.write(frame + ' ');
}
console.log('ok');
