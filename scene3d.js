(function () {
  const canvas = document.getElementById('scene3d');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SHAPES = {
    cube: {
      verts: [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
      edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
    },
    octa: {
      verts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
      edges: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]]
    },
    tetra: {
      verts: [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]],
      edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]
    }
  };
  const TYPES = Object.keys(SHAPES);

  function rand(min, max) { return min + Math.random() * (max - min); }

  const COUNT = window.innerWidth < 700 ? 6 : 11;
  const instances = Array.from({ length: COUNT }, (_, i) => ({
    type: TYPES[i % TYPES.length],
    xFrac: rand(0.06, 0.94),
    yFrac: rand(0.04, 0.96),
    depth: rand(0.3, 1),
    size: rand(26, 60),
    rotX: rand(0, Math.PI * 2),
    rotY: rand(0, Math.PI * 2),
    speedX: rand(0.15, 0.4) * (Math.random() < 0.5 ? -1 : 1),
    speedY: rand(0.1, 0.3) * (Math.random() < 0.5 ? -1 : 1)
  }));

  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function rotatePoint([x, y, z], ax, ay) {
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
    return [x2, y1, z2];
  }
  function project([x, y, z], cx, cy, scale) {
    const f = 3.4;
    const s = (f / (f + z)) * scale;
    return [cx + x * s, cy + y * s];
  }

  function readVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  let ink = readVar('--ink', '#111111');
  let accent = readVar('--accent', '#d9552c');
  function refreshTheme() { ink = readVar('--ink', ink); accent = readVar('--accent', accent); }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', refreshTheme);
  new MutationObserver(refreshTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function draw(t) {
    if (document.hidden) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    const time = t / 1000;

    instances.forEach((s, i) => {
      const ax = s.rotX + time * s.speedX + scrollY * 0.0006 * s.depth;
      const ay = s.rotY + time * s.speedY + scrollY * 0.0004 * s.depth;
      const cx = s.xFrac * W;
      const cy = s.yFrac * H - scrollY * (0.05 + s.depth * 0.15);
      const shape = SHAPES[s.type];
      const pts = shape.verts.map(v => project(rotatePoint(v, ax, ay), cx, cy, s.size * s.depth));

      ctx.beginPath();
      shape.edges.forEach(([a, b]) => {
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
      });
      ctx.strokeStyle = i % 4 === 0 ? accent : ink;
      ctx.globalAlpha = 0.12 + s.depth * 0.14;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
