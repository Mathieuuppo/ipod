import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Navigateur headless : utilise celui de l'environnement s'il existe, sinon
// Remotion télécharge le sien (machine de l'utilisateur).
const HEADLESS =
  process.env.REMOTION_BROWSER ??
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(HEADLESS)) {
  Config.setBrowserExecutable(HEADLESS);
}
// WebGL logiciel (Three.js) fiable en rendu serveur
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
