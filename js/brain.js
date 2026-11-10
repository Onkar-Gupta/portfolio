/* ============================================================
   BRAIN.JS: wireframe brain, pure canvas. Zero dependencies,
   always renders (no CDN, no WebGL required).
   Styled after a classic "network brain" illustration:
   · ~620 nodes connected by fine lines (the wireframe)
   · dendrite spikes sticking out of the surface, dot at each tip
   · slow 3D rotation + breathing; neurons pulse asynchronously
   · cursor-reactive: nodes near the pointer light up in accent
   · SCROLL DIVE: full 360° turn + zoom INTO the mesh, fading
     out right as the terminal glitch takes over
   Ink color follows the chosen theme (paper ↔ ink).
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('brain-canvas');
  const ctx = canvas.getContext('2d');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let W, H, DPR;
  /* tall, narrow screens (phones): a smaller brain in the upper part, so it fits across
     the width and the hero text can sit below it */
  let PORTRAIT = false, BRAIN_Y = 0.48, SIL_Y = 0.46, UNIT = 21, ZOOM = 1.6;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    PORTRAIT = W < 700 && H > W;
    BRAIN_Y = PORTRAIT ? 0.34 : 0.48;
    SIL_Y = PORTRAIT ? 0.32 : 0.46;
    UNIT = PORTRAIT ? 28 : 21;
    ZOOM = PORTRAIT ? 0.8 : 1.6;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- sample the brain volume (units ≈ ±9) ---------- */
  const N = 620;
  const nodes = [];           /* {x,y,z, r(unit radius), phase} */
  while (nodes.length < N) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = Math.cbrt(Math.random());
    const sx = r * Math.sqrt(1 - u * u) * Math.cos(th);
    const sy = r * u;
    const sz = r * Math.sqrt(1 - u * u) * Math.sin(th);

    const x = sx * 9, y = sy * 6.4, z = sz * 7;

    if (Math.abs(x) < 0.65 && Math.random() < 0.7) continue;   /* fissure   */
    if (y < -3.4) continue;                                    /* flat base */
    if (y < -2.3 && Math.random() < 0.5) continue;
    if (r < 0.6 && Math.random() < 0.55) continue;             /* cortex bias */

    nodes.push({ x, y, z, r, phase: Math.random() * Math.PI * 2 });
  }
  /* brain stem: a few nodes trailing down-left like the sketch */
  for (let i = 0; i < 16; i++) {
    const t = i / 16;
    nodes.push({
      x: -1.5 - t * 1.6 + (Math.random() - 0.5) * 0.5,
      y: -2.8 - t * 2.2,
      z: (Math.random() - 0.5) * 1.2,
      r: 1, phase: Math.random() * Math.PI * 2,
    });
  }

  /* ---------- edges between near neighbours ---------- */
  const edges = [];
  const LINKD2 = 2.3 * 2.3, MAXE = 1500;
  outer:
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      if (dx * dx + dy * dy + dz * dz < LINKD2) {
        edges.push([i, j]);
        if (edges.length >= MAXE) break outer;
      }
    }
  }

  /* flat copies of the edge list and per-frame scratch buffers (no allocation inside the loop) */
  const edgeI = Int16Array.from(edges, (e) => e[0]);
  const edgeJ = Int16Array.from(edges, (e) => e[1]);
  const edgeB = new Uint8Array(edges.length);
  const nodeB = new Uint8Array(nodes.length);
  const nodeR = new Float32Array(nodes.length);
  const nearI = new Int16Array(nodes.length);
  const nearA = new Float32Array(nodes.length);

  /* ---------- dendrite spikes on the surface (dot at each tip) ---------- */
  const spikes = [];
  for (let i = 0; i < nodes.length && spikes.length < 70; i++) {
    const n = nodes[i];
    if (n.r > 0.86 && Math.random() < 0.4) {
      const len = 1.18 + Math.random() * 0.18;
      spikes.push({ i, tx: n.x * len, ty: n.y * len, tz: n.z * len });
    }
  }

  /* ---------- the FINALE shape: as the dive rotation ends, every
     node migrates onto a clean side-profile brain silhouette ---------- */
  const OUTLINE = [
    [0.95, -0.08], [0.90, 0.16], [0.76, 0.36], [0.56, 0.50], [0.32, 0.58],
    [0.05, 0.60], [-0.22, 0.57], [-0.46, 0.49], [-0.66, 0.38], [-0.81, 0.22],
    [-0.89, 0.02], [-0.86, -0.18], [-0.74, -0.32], [-0.60, -0.36], [-0.50, -0.28],
    [-0.42, -0.44], [-0.24, -0.52], [-0.04, -0.50], [0.16, -0.42], [0.36, -0.40],
    [0.56, -0.36], [0.76, -0.28], [0.90, -0.18],
  ];
  /* perimeter-length lookup so outline points spread evenly */
  const perim = [0];
  for (let i = 1; i <= OUTLINE.length; i++) {
    const a = OUTLINE[i - 1], b = OUTLINE[i % OUTLINE.length];
    perim.push(perim[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const perimTotal = perim[perim.length - 1];
  function outlineAt(u) {
    const d = u * perimTotal;
    let i = 1;
    while (i < perim.length && perim[i] < d) i++;
    const a = OUTLINE[i - 1], b = OUTLINE[i % OUTLINE.length];
    const t = (d - perim[i - 1]) / (perim[i] - perim[i - 1] || 1);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  /* per-node target: 55% trace the outline, the rest fill the inside */
  const targ = nodes.map((n, i) => {
    const [ox, oy] = outlineAt((i * 0.61803) % 1);      /* golden-ratio spread */
    const inward = (i % 100) < 55 ? 1 : 0.2 + ((i * 37) % 70) / 100;
    return { x: ox * inward, y: oy * inward };
  });
  const smoothstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- projection ---------- */
  const FOV = 26;
  const px = new Float32Array(nodes.length);
  const py = new Float32Array(nodes.length);
  const pd = new Float32Array(nodes.length);   /* depth 0(back)..1(front) */

  function project(x, y, z, cy, cx, sx_, scale, out) {
    /* rotate around Y, then X */
    const x1 = x * cy + z * sx_;
    const z1 = -x * sx_ + z * cy;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const yr = y * cosX - z1 * sinX;
    const zr = y * sinX + z1 * cosX;

    const f = FOV / (FOV + zr);
    out[0] = W / 2 + x1 * scale * f;
    out[1] = H * BRAIN_Y + yr * scale * f;
    out[2] = clamp((f - 0.72) / 0.55, 0, 1);
  }

  let rotX = 0, brainCleared = false;
  const tmp = [0, 0, 0];

  /* ---------- animation loop ---------- */
  function loop(now) {
    requestAnimationFrame(loop);
    const MIND = window.MIND;
    if (!MIND) return;
    const t = now * 0.001;

    /* dive: 0 in hero → 1 as the boot section arrives */
    const dive = clamp(MIND.current / (MIND.vh * 1.05), 0, 1.2);
    if (dive >= 1.12) {                               // the brain has faded out: clear once, then leave the canvas alone
      if (!brainCleared) { ctx.clearRect(0, 0, W, H); brainCleared = true; }
      return;                                         // (clearing every frame made the browser re-upload the canvas)
    }
    brainCleared = false;
    ctx.clearRect(0, 0, W, H);
    /* hold the fully-formed silhouette for a real glimpse,
       then fade as the computer rises to meet it */
    const fade = clamp(1 - (dive - 0.97) / 0.13, 0, 1);
    /* morph factor: rotation ends → nodes migrate onto the brain profile */
    const m = MIND.reduced ? 0 : smoothstep((dive - 0.7) / 0.24);
    const SS = Math.min(W, H) * 0.34;                 /* silhouette scale */
    const SCX = W / 2, SCY = H * SIL_Y;

    const [ir, ig, ib] = MIND.theme.txt;
    const [ar, ag, ab] = MIND.theme.accent;

    const breathe = MIND.reduced ? 1 : 1 + Math.sin(t * 1.15) * 0.03;
    const scale = (Math.min(W, H) / UNIT) * breathe * (1 + dive * ZOOM);

    const spin = (MIND.reduced ? 0.4 : t * 0.15)
      + Math.min(dive, 1) * Math.PI * 2                          /* 360° on dive */
      + (MIND.mouse.x / W - 0.5) * 0.5;                          /* cursor parallax */
    rotX = -0.12 + (MIND.mouse.y / H - 0.5) * 0.25 + dive * 0.25;

    const cy = Math.cos(spin), sy_ = Math.sin(spin);

    /* project all nodes, then blend toward the silhouette targets */
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      project(n.x, n.y, n.z, cy, 1, sy_, scale, tmp);
      if (m > 0) {
        px[i] = tmp[0] + (SCX + targ[i].x * SS - tmp[0]) * m;
        py[i] = tmp[1] + (SCY - targ[i].y * SS - tmp[1]) * m;
        pd[i] = tmp[2] + (0.85 - tmp[2]) * m;
      } else {
        px[i] = tmp[0]; py[i] = tmp[1]; pd[i] = tmp[2];
      }
    }

    /* edges: ink lines, front edges darker/heavier. Drawn in 6 batches by depth: one path and one stroke
       per batch instead of one per line (1,500 strokes and 1,500 colour strings a frame was the stutter) */
    ctx.lineWidth = 1;
    for (let e = 0; e < edgeI.length; e++) edgeB[e] = Math.min(5, ((pd[edgeI[e]] + pd[edgeJ[e]]) * 3) | 0);
    for (let b = 0; b < 6; b++) {
      ctx.strokeStyle = `rgba(${ir},${ig},${ib},${(0.06 + ((b + 0.5) / 6) * 0.2) * fade})`;
      ctx.beginPath();
      for (let e = 0; e < edgeI.length; e++) {
        if (edgeB[e] !== b) continue;
        ctx.moveTo(px[edgeI[e]], py[edgeI[e]]);
        ctx.lineTo(px[edgeJ[e]], py[edgeJ[e]]);
      }
      ctx.stroke();
    }

    /* dendrite spikes with tip dots */
    for (let s = 0; s < spikes.length; s++) {
      const sp = spikes[s];
      project(sp.tx, sp.ty, sp.tz, cy, 1, sy_, scale, tmp);
      if (m > 0) {                      /* spikes follow their base outward */
        tmp[0] += (SCX + targ[sp.i].x * SS * 1.14 - tmp[0]) * m;
        tmp[1] += (SCY - targ[sp.i].y * SS * 1.14 - tmp[1]) * m;
      }
      const d = (pd[sp.i] + tmp[2]) / 2;
      ctx.strokeStyle = `rgba(${ir},${ig},${ib},${(0.1 + d * 0.3) * fade})`;
      ctx.beginPath();
      ctx.moveTo(px[sp.i], py[sp.i]);
      ctx.lineTo(tmp[0], tmp[1]);
      ctx.stroke();
      ctx.fillStyle = `rgba(${ir},${ig},${ib},${(0.25 + d * 0.5) * fade})`;
      ctx.beginPath();
      ctx.arc(tmp[0], tmp[1], 1.6 + d * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    /* nodes: pulsing neurons; accent glow near the cursor. Drawn in 8 batches by brightness (one fill each);
       the few nodes under the cursor are drawn on their own in the accent colour */
    let nearCount = 0;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const fire = MIND.reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.2 + n.phase * 3);
      const dx = px[i] - MIND.mouse.x, dy = py[i] - MIND.mouse.y;
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / 110);
      nodeR[i] = (0.9 + pd[i] * 1.7) * (0.8 + fire * 0.5) + near * 2.2;
      if (near > 0.05) { nodeB[i] = 255; nearA[nearCount] = (0.35 + near * 0.6) * fade; nearI[nearCount++] = i; }
      else nodeB[i] = Math.min(7, Math.max(0, ((0.2 + pd[i] * 0.55 + fire * 0.15 - 0.2) * 10) | 0));
    }
    for (let b = 0; b < 8; b++) {
      ctx.fillStyle = `rgba(${ir},${ig},${ib},${(0.25 + b * 0.1) * fade})`;
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        if (nodeB[i] !== b) continue;
        ctx.moveTo(px[i] + nodeR[i], py[i]);
        ctx.arc(px[i], py[i], nodeR[i], 0, Math.PI * 2);
      }
      ctx.fill();
    }
    for (let k = 0; k < nearCount; k++) {
      const i = nearI[k];
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${nearA[k]})`;
      ctx.beginPath();
      ctx.arc(px[i], py[i], nodeR[i], 0, Math.PI * 2);
      ctx.fill();
    }

    /* overclock: extra firing */
    if (window.__overclock) {
      for (let k = 0; k < 14; k++) {
        const i = (Math.random() * nodes.length) | 0;
        ctx.fillStyle = `rgba(${ar},${ag},${ab},0.8)`;
        ctx.beginPath();
        ctx.arc(px[i], py[i], 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  requestAnimationFrame(loop);
})();
