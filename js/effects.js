/* ============================================================
   EFFECTS.JS: scroll / theme / path engine
   Shared state for brain.js, terminal.js, guide.js:
     window.MIND = { current, p, vh, mouse, reduced, theme }
     window.PATH = { samples: [{x,y}], startY, endY, built }
   Colour: one scroll journey, brown to cream (see css/base.css).
   updateJourney() writes --j and --jt on <html> each frame and
   keeps MIND.theme in step for the canvases. No visitor toggle.
   ============================================================ */

(function () {
  'use strict';

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const MIND = window.MIND = {
    current: 0, p: 0,
    vh: window.innerHeight,
    mouse: { x: -100, y: -100 },
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    theme: { txt: [244, 217, 160], accent: [200, 121, 44] },
  };
  const PATH = window.PATH = { samples: [], startY: 0, endY: 0, built: false };

  /* ============================================================
     THEME: ink & paper, visitor's choice
     ============================================================ */
  const CREAM = [244, 217, 160];
  const DEEP = [26, 18, 11];
  const smoothstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  /* j runs 0 to 1 from the start of #projects to the start of #contact, so most of
     the page stays dark and only the end turns to the light stone colour.
     Positions are measured on load and resize. */
  let jFrom = 0, jTo = 1, lastJ = -1, lastJT = -1;
  function measureJourney() {
    const a = document.getElementById('projects');
    const b = document.getElementById('contact');
    jFrom = a ? a.offsetTop - MIND.vh * 0.5 : 0;
    jTo = b ? b.offsetTop : jFrom + 1;
    if (jTo <= jFrom) jTo = jFrom + 1;
  }

  function updateJourney() {
    const j = clamp((MIND.current - jFrom) / (jTo - jFrom), 0, 1);
    const jt = smoothstep((j - 0.36) / 0.10);
    if (Math.abs(j - lastJ) < 0.0005 && Math.abs(jt - lastJT) < 0.0005) return;
    lastJ = j; lastJT = jt;
    const root = document.documentElement.style;
    root.setProperty('--j', j.toFixed(4));
    root.setProperty('--jt', jt.toFixed(4));
    MIND.theme.txt = CREAM.map((c, i) => Math.round(c + (DEEP[i] - c) * jt));
  }

  /* ============================================================
     LOADER (dismisses itself; Enter or a click skips the wait)
     ============================================================ */
  const loader = document.getElementById('loader');
  let entered = false;

  function enterSite(sound) {
    if (entered) return;
    entered = true;
    loader.classList.add('done');
    /* sound.js listens for this; the click on a button is also the gesture browsers need for audio */
    window.dispatchEvent(new CustomEvent('site-enter', { detail: { sound: sound === true } }));
    /* replay the hero title decode now that it's actually visible */
    const heroTitle = document.querySelector('#hero .scramble');
    if (heroTitle && !MIND.reduced) setTimeout(() => scramble(heroTitle), 350);
  }

  /* the visitor chooses sound on or off; Enter or a 9 second wait means off */
  document.querySelectorAll('#loader [data-sound]').forEach((b) => {
    b.addEventListener('click', () => enterSite(b.dataset.sound === 'on'));
  });
  setTimeout(() => enterSite(false), 9000);
  window.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterSite(false); });

  /* ============================================================
     SMOOTH SCROLL (lerp + fixed wrapper)
     ============================================================ */
  const wrapper = document.getElementById('smooth-wrapper');
  const content = document.getElementById('smooth-content');
  let target = 0;
  const EASE = MIND.reduced ? 1 : 0.085;

  function setBodyHeight() {
    document.body.style.height = content.getBoundingClientRect().height + 'px';
  }
  let maxScroll = 1;
  function computeMax() {
    MIND.vh = window.innerHeight;
    maxScroll = Math.max(1, content.getBoundingClientRect().height - MIND.vh);
  }
  setBodyHeight(); computeMax(); measureJourney();
  MIND.remeasure = () => { setBodyHeight(); computeMax(); measureJourney(); };  // film.js calls this after it adds the runway
  window.addEventListener('resize', () => { setBodyHeight(); computeMax(); measureJourney(); });
  window.addEventListener('load', () => setTimeout(() => { setBodyHeight(); computeMax(); measureJourney(); }, 350));

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target_el = document.querySelector(a.getAttribute('href'));
    if (!target_el) return;
    e.preventDefault();
    window.scrollTo(0, target_el.offsetTop);
  });

  /* ============================================================
     TRAINING HUD
     ============================================================ */
  const hudFill = document.getElementById('hud-fill');
  const hudLabel = document.getElementById('hud-label');
  let lastHudW = '', lastHudT = '';
  function updateHUD(p) {
    /* only touch the page when the text really changes: this runs every frame */
    const w = (p * 100).toFixed(1) + '%';
    if (w !== lastHudW) { hudFill.style.width = w; lastHudW = w; }
    let t;
    if (p >= 0.985) {
      t = 'converged ✓ · model ready';
    } else {
      const loss = (2.847 * Math.pow(1 - p, 1.8)).toFixed(3);
      const epoch = String(Math.min(6, Math.floor(p * 7))).padStart(2, '0');
      t = `epoch ${epoch}/06 · loss: ${loss}`;
    }
    if (t !== lastHudT) { hudLabel.textContent = t; lastHudT = t; }
  }

  /* ============================================================
     TERMINAL-TAKEOVER GLITCH: a CRT dying, in phosphor green.
     Fires once each time you dive through the brain.
     ============================================================ */
  const glitch = document.getElementById('glitch-overlay');
  const glitchText = document.getElementById('glitch-text');
  const GLYPHS = '▓▒░█<>/\\|=+*#@%&01!?;:~^';
  const PANICS = [
    'ERR 0x2A :: SYNAPSE_OVERFLOW',
    'kernel panic: consciousness not found',
    '>> SIGNAL LOST <<',
    'core dumped · 4.2TB of memories',
    'rerouting → mind://terminal/tty1',
    'SEGFAULT at 0xDEADBEEF (dreams segment)',
  ];
  let glitched = false, glitchTimer = null;

  function randRow(w) {
    let s = '';
    for (let i = 0; i < w; i++) {
      s += Math.random() < 0.82 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : ' ';
    }
    return s;
  }

  function playGlitch() {
    window.dispatchEvent(new Event('glitch'));
    /* size the grid from the real font, so the text fills the screen at any size and never runs off the edge */
    const fs = parseFloat(getComputedStyle(glitchText).fontSize) || 12;
    const rows = Math.max(1, Math.floor(window.innerHeight * 0.9 / (fs * 1.5)));
    const cols = Math.max(1, Math.floor(window.innerWidth * 0.82 / (fs * 0.6)));
    glitch.classList.add('play');
    let frame = 0;
    clearInterval(glitchTimer);
    glitchTimer = setInterval(() => {
      let out = '';
      for (let r = 0; r < rows; r++) {
        if (Math.random() < 0.12) {
          const msg = PANICS[(Math.random() * PANICS.length) | 0].slice(0, cols);
          const pad = Math.max(0, ((Math.random() * (cols - msg.length)) | 0));
          out += ' '.repeat(pad) + msg + '\n';
        } else if (Math.random() < 0.25) {
          out += '\n';                                   /* dead scanline */
        } else {
          out += randRow(cols) + '\n';
        }
      }
      glitchText.textContent = out;
      if (++frame > 12) {
        clearInterval(glitchTimer);
        glitch.classList.remove('play');
        glitchText.textContent = '';
      }
    }, 70);
  }
  MIND.playGlitch = playGlitch;      // film.js uses it to cover the cut into the first clip

  function updateGlitch() {
    /* the glitch now plays from film.js, the moment the film cuts in (one glitch, not two).
       Kept as a no-op so the frame loop stays the same. */
  }

  /* ---------- seamless handoff: the computer fades up exactly as
     the formed brain fades out (same scroll window) ---------- */
  let rigEl = null;
  function updateBootEntrance() {
    if (!rigEl) { rigEl = document.getElementById('rig'); if (!rigEl) return; }
    const diveP = MIND.current / (MIND.vh * 1.05);
    const o = MIND.reduced ? 1 : clamp((diveP - 0.97) / 0.2, 0, 1);
    rigEl.style.opacity = o.toFixed(3);
    rigEl.style.transform = `translateY(${(1 - o) * 46}px) scale(${0.965 + o * 0.035})`;
  }

  /* ============================================================
     WINDING JOURNEY PATH: starts at the computer, snakes
     left/right through the chapters. The stick figure walks it.
     ============================================================ */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let pathEl = null, pathLen = 0, pathNodes = [];

  function buildJourneyPath() {
    const old = document.getElementById('journey-path');
    if (old) old.remove();
    pathEl = null; pathNodes = [];
    PATH.built = false; PATH.samples = [];
    return;   // retired: the film layer replaced the walking stick figure and its road
    // eslint-disable-next-line no-unreachable
    if (window.innerWidth < 1000) return;

    const chapters = Array.from(document.querySelectorAll('.chapter'));
    if (chapters.length < 4) return;

    const W = window.innerWidth;
    const H = content.getBoundingClientRect().height;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.id = 'journey-path';
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const boot = chapters[1];
    const pts = [[W * 0.5, boot.offsetTop + boot.offsetHeight - 90]];
    chapters.slice(2, -1).forEach((sec) => {
      const x = sec.classList.contains('ch-right') ? W * 0.82 : W * 0.18;
      pts.push([x, sec.offsetTop + Math.min(sec.offsetHeight * 0.45, 420)]);
    });
    /* final stop: right beside the "Training complete." title,
       so the guide stands next to it and waves goodbye */
    const contact = chapters[chapters.length - 1];
    const titleSpan = contact.querySelector('.ch-title .scramble');
    if (titleSpan) {
      const half = Math.min(titleSpan.offsetWidth / 2, W * 0.3);
      pts.push([
        W / 2 + half * 0.55,                        /* perched on "complete." */
        contact.offsetTop + titleSpan.offsetTop + 4, /* top edge of the words */
      ]);
    } else {
      pts.push([W * 0.5, contact.offsetTop + 100]);
    }

    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const my_ = (y0 + y1) / 2;
      d += ` C ${x0} ${my_}, ${x1} ${my_}, ${x1} ${y1}`;
    }

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);

    pts.forEach(([x, y]) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 5);
      svg.appendChild(c);
      pathNodes.push({ el: c, y });
    });

    content.insertBefore(svg, content.firstChild);
    pathEl = path;
    pathLen = path.getTotalLength();
    path.style.strokeDasharray = pathLen;
    path.style.strokeDashoffset = pathLen;

    const step = 10;
    for (let l = 0; l <= pathLen; l += step) {
      const pt = path.getPointAtLength(l);
      PATH.samples.push({ x: pt.x, y: pt.y });
    }
    PATH.startY = pts[0][1];
    PATH.endY = pts[pts.length - 1][1];
    PATH.built = true;
  }

  function updateJourneyPath() {
    if (!pathEl) return;
    const lead = MIND.current + MIND.vh * 0.72;
    const p = clamp(lead / (maxScroll + MIND.vh * 0.72), 0, 1);
    pathEl.style.strokeDashoffset = pathLen * (1 - p);
    pathNodes.forEach((n) => n.el.classList.toggle('lit', n.y < lead));
  }

  window.addEventListener('load', () => setTimeout(buildJourneyPath, 400));
  let rsTimer;
  window.addEventListener('resize', () => {
    clearTimeout(rsTimer);
    rsTimer = setTimeout(buildJourneyPath, 200);
  });

  /* ---------- master frame loop ---------- */
  let lastWrapY = null;
  (function frame() {
    target = window.scrollY;
    MIND.current += (target - MIND.current) * EASE;
    if (Math.abs(target - MIND.current) < 0.05) MIND.current = target;
    if (MIND.current !== lastWrapY) {                 // no write when the page is not moving
      wrapper.style.transform = `translate3d(0, ${-MIND.current}px, 0)`;
      lastWrapY = MIND.current;
    }

    MIND.p = clamp(MIND.current / maxScroll, 0, 1);
    updateHUD(MIND.p);
    updateJourney();
    updateGlitch();
    updateBootEntrance();
    updateJourneyPath();
    requestAnimationFrame(frame);
  })();

  /* ============================================================
     CURSOR + MAGNETIC + SPOTLIGHT
     ============================================================ */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let rx = -100, ry = -100, lastRx = 1e9, lastRy = 1e9;

  window.addEventListener('mousemove', (e) => {
    MIND.mouse.x = e.clientX; MIND.mouse.y = e.clientY;
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;   // transform, not left/top: no layout
  });
  (function ringLoop() {
    rx = lerp(rx, MIND.mouse.x, 0.16);
    ry = lerp(ry, MIND.mouse.y, 0.16);
    if (Math.abs(rx - lastRx) > 0.05 || Math.abs(ry - lastRy) > 0.05) {      // no write when the ring has arrived
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      lastRx = rx; lastRy = ry;
    }
    requestAnimationFrame(ringLoop);
  })();

  const HOVERABLE = 'a, button, .proj-card, .chip, .stat-card, .ach-card, .skill-group, .panel';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVERABLE)) ring.classList.add('hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVERABLE)) ring.classList.remove('hovering');
  });

  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform =
        `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });

  document.querySelectorAll('.proj-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ============================================================
     REVEALS + TEXT SCRAMBLE
     ============================================================ */
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}-=+*^?#01';

  function scramble(el) {
    const text = el.dataset.text || el.textContent;
    const start = performance.now();
    (function tick(now) {
      const t = clamp(((now || performance.now()) - start) / 900, 0, 1);
      const solved = Math.floor(t * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += (i < solved || text[i] === ' ')
          ? text[i]
          : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = text;
    })();
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('visible');
      if (en.target.classList.contains('scramble') && !en.target.dataset.typed && !MIND.reduced) scramble(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal, .scramble, .timeline').forEach((el) => io.observe(el));

  /* ============================================================
     AMBIENT PARTICLE NETWORK (theme-aware)
     ============================================================ */
  const canvas = document.getElementById('net-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];

  function initCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const count = Math.min(80, Math.floor((W * H) / 26000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    }));
  }
  initCanvas();
  window.addEventListener('resize', initCanvas);

  const LINK_DIST = 130;
  const netPaths = [[], [], [], []];
  let netCleared = false;
  (function drawNet() {
    requestAnimationFrame(drawNet);
    /* the film covers this canvas completely: stop drawing it while the film is on screen */
    if (MIND.reduced || (MIND.film && MIND.film.inside)) {
      if (!netCleared) { ctx.clearRect(0, 0, W, H); netCleared = true; }
      return;
    }
    netCleared = false;
    ctx.clearRect(0, 0, W, H);
    const [r, g, b] = MIND.theme.txt;
    const [ar, ag, ab] = MIND.theme.accent;

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }
    /* links in 4 batches by closeness (one path and one stroke each), then the dots in one fill: this used
       to be one stroke and one colour string per link, hundreds a frame */
    for (let q = 0; q < 4; q++) netPaths[q] = [];
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const c = nodes[j];
        const dx = a.x - c.x, dy = a.y - c.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const q = Math.min(3, ((1 - Math.sqrt(d2) / LINK_DIST) * 4) | 0);
          netPaths[q].push(a.x, a.y, c.x, c.y);
        }
      }
    }
    for (let q = 0; q < 4; q++) {
      const seg = netPaths[q];
      if (!seg.length) continue;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.07 * ((q + 0.5) / 4)})`;
      ctx.beginPath();
      for (let k = 0; k < seg.length; k += 4) { ctx.moveTo(seg[k], seg[k + 1]); ctx.lineTo(seg[k + 2], seg[k + 3]); }
      ctx.stroke();
    }
    for (let i = 0; i < nodes.length; i++) {      // the few links to the cursor keep their own colour
      const a = nodes[i];
      const dm = Math.hypot(a.x - MIND.mouse.x, a.y - MIND.mouse.y);
      if (dm < LINK_DIST * 1.3) {
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.18 * (1 - dm / (LINK_DIST * 1.3))})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(MIND.mouse.x, MIND.mouse.y); ctx.stroke();
      }
    }
    ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
    ctx.beginPath();
    for (let i = 0; i < nodes.length; i++) { const a = nodes[i]; ctx.moveTo(a.x + 1.4, a.y); ctx.arc(a.x, a.y, 1.4, 0, Math.PI * 2); }
    ctx.fill();
  })();

  /* ============================================================
     KONAMI CODE + console egg
     ============================================================ */
  const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let ki = 0;
  window.addEventListener('keydown', (e) => {
    ki = (e.key === KONAMI[ki]) ? ki + 1 : 0;
    if (ki === KONAMI.length) {
      ki = 0;
      document.body.classList.add('overclock');
      window.__overclock = true;
      setTimeout(() => {
        document.body.classList.remove('overclock');
        window.__overclock = false;
      }, 3500);
    }
  });

  console.log(
    '%c◉ you found the hidden layer.\n' +
    '%cthis mind was hand-built: no templates. try the konami code.\n' +
    'mention "gradient" in your email for +10 respect.',
    'color:#C8792C;font-size:14px;font-weight:bold',
    'color:#8a6a4a;font-size:11px'
  );

  /* ============================================================
     FRAME RATE READOUT: add ?fps to the address to see it.
     Shows frames a second and the slowest frame in the last second,
     and whether the low-power mode has switched on.
     ============================================================ */
  if (/[?&]fps/.test(location.search)) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:9998;font:12px monospace;color:#F4D9A0;background:rgba(26,18,11,.85);border:1px solid #C8792C;padding:3px 10px;border-radius:999px;pointer-events:none';
    document.body.appendChild(box);
    let last = performance.now(), n = 0, worst = 0, acc = 0;
    (function tick(t) {
      requestAnimationFrame(tick);
      const dt = t - last; last = t; n++; acc += dt; worst = Math.max(worst, dt);
      if (acc >= 1000) {
        box.textContent = Math.round(n * 1000 / acc) + ' fps · worst ' + Math.round(worst) + ' ms' + (document.documentElement.classList.contains('lite') ? ' · lite' : '');
        n = 0; acc = 0; worst = 0;
      }
    })(last);
  }
})();