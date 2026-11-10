// Poppins (SIL Open Font License) servie localement : Regular, Medium,
// SemiBold, Bold, ExtraBold — aucune requête externe au rendu.
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import '@fontsource/poppins/latin-ext-400.css';
import '@fontsource/poppins/latin-ext-800.css';
import {continueRender, delayRender} from 'remotion';

const handle = delayRender('Chargement de Poppins');
Promise.all(
  [400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Poppins`, 'AÉÀéèàçù€’ —0123456789')),
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
