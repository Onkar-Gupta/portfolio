/* ============================================================
   BUILD.JS: blocks that build themselves (step 2, staged)
   Every card on the page is built by one of four helper cursors
   (PID 043 to 046) when it scrolls into view:
     1 the cursor flies in on a curved path to the card's corner
     2 it traces the border (the line is drawn as it moves)
     3 the fill wipes in, top to bottom
     4 the card's parts appear one by one; headlines type in
   "lite" blocks (plain text, no card) skip the fill.
   Chapter titles are typed with no reflow, and a small corner
   log prints what the helpers are doing. Scramble stays on the
   hero name. Without JS, or with reduced motion, nothing is hidden.
   ============================================================ */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  /* what to build, by section. lite = no card, so no fill stage. */
  const PLAN = [
    { section: '#about',        blocks: [{ sel: '.win' }] },
    { section: '#skills',       blocks: [{ sel: '.skill-group' }, { sel: '.marquee', lite: true }] },
    { section: '#journey',      blocks: [{ sel: '.t-item' }] },
    { section: '#projects',     blocks: [{ sel: '.proj-card' }] },
    { section: '#achievements', blocks: [{ sel: '.ach-card' }] },
    { section: '#contact',      blocks: [{ sel: '.contact-cta', lite: true }, { sel: '.socials', lite: true }] },
  ];

  const NAMES = ['PID 043 · data', 'PID 044 · arch', 'PID 045 · train', 'PID 046 · out'];
  const FILL_MS = 380;       // fill wipe
  const KID_GAP = 130;       // ms between a card's parts
  const KID_TAIL = 650;      // after the last part starts, before "done"
  const LEAVE_MS = 650;
  const TYPE_MS = 30;        // per character, headlines inside cards
  const TITLE_MS = 38;       // per character, chapter titles
  /* the film's own boxes are built on a fast timetable (about 1.6 s a box instead of 5 s), because the
     scroll frames glide on within a second or two and a box must not arrive after the video has moved on */
  const FAST = { flyMin: 320, flyMax: 560, flyDist: 0.25, trace: 380, traceSize: 0.2, traceCap: 260, fill: 200, kidGap: 60, tail: 220, type: 14, leave: 380 };
  const LOG_LINES = 5;
  const LOG_IDLE_MS = 6000;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const pad = (n, w) => String(n).padStart(w, '0');
  const emit = (stage) => window.dispatchEvent(new CustomEvent('build', { detail: { stage } }));   // sound.js listens

  /* ---------- corner log ---------- */
  const logBox = document.createElement('div');
  logBox.className = 'b-log';
  logBox.setAttribute('aria-hidden', 'true');
  document.body.appendChild(logBox);
  let logTimer = 0;

  function log(tag, msg) {
    const d = new Date();
    const line = document.createElement('div');
    line.className = 'b-log-line';
    line.innerHTML =
      '<span class="t">[' + pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' +
      pad(d.getSeconds(), 2) + '.' + pad(d.getMilliseconds(), 3) + ']</span> ' +
      '<span class="a">' + tag + '</span> ' + msg;
    logBox.appendChild(line);
    while (logBox.children.length > LOG_LINES) logBox.removeChild(logBox.firstChild);
    logBox.classList.add('on');
    clearTimeout(logTimer);
    logTimer = setTimeout(() => logBox.classList.remove('on'), LOG_IDLE_MS);
  }

  /* ---------- typed chapter titles ---------- */
  const titles = Array.from(document.querySelectorAll('.ch-title .scramble'));
  titles.forEach((t) => { t.dataset.typed = '1'; });   // tells effects.js not to scramble it

  function typeTitle(span) {
    const text = span.dataset.text || span.textContent;
    const ov = document.createElement('span');
    ov.className = 'b-typing';
    span.appendChild(ov);                     // CSS keeps the real text transparent until data-done
    let i = 0;
    const tick = () => {
      i++;
      ov.innerHTML = '';
      ov.appendChild(document.createTextNode(text.slice(0, i)));
      const caret = document.createElement('i');
      caret.className = 'b-caret';
      ov.appendChild(caret);
      if (i < text.length) setTimeout(tick, TITLE_MS + (text[i - 1] === ' ' ? 40 : 0));
      else setTimeout(() => {
        span.dataset.done = '1';
        span.removeChild(ov);
        log('typed', '"' + (text.length > 26 ? text.slice(0, 26) + '…' : text) + '"');
      }, 450);
    };
    tick();
  }

  /* ---------- typed headlines inside cards (no reflow) ---------- */
  function typeKid(kid, ms) {
    const text = kid.textContent;
    const ov = document.createElement('span');
    ov.className = 'k-typing';
    ov.style.setProperty('--kc', getComputedStyle(kid).color);   // read before it goes transparent
    kid.dataset.typing = '1';
    kid.appendChild(ov);
    let i = 0;
    (function tick() {
      i++;
      ov.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(tick, ms || TYPE_MS);
      else setTimeout(() => { delete kid.dataset.typing; if (ov.parentNode === kid) kid.removeChild(ov); }, 120);
    })();
  }

  function revealKid(kid, fast) {
    kid.dataset.in = '1';
    if (kid.tagName === 'H3' || kid.tagName === 'B') typeKid(kid, fast ? FAST.type : TYPE_MS);
  }

  /* ---------- prepare blocks ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';

  function prepare(block, name, lite) {
    block.classList.remove('reveal');        // build.js owns this block's reveal
    const par = block.parentElement;         // a .reveal wrapper (stat cards) would fade the overlay too
    if (par && par.classList.contains('reveal')) par.classList.remove('reveal');
    block.dataset.block = name;
    block.dataset.state = 'empty';
    if (lite) block.dataset.lite = '1';
    const ov = document.createElement('div');
    ov.className = 'b-ov';
    ov.innerHTML =
      '<svg class="b-trace"><rect pathLength="1"></rect></svg>' +
      (lite ? '' : '<div class="b-fill"></div>') +
      '<span class="b-lbl"></span><span class="b-tip">guide.exe › building ' + name + '</span>';
    block.appendChild(ov);
  }

  const groups = [];
  PLAN.forEach((p) => {
    const section = document.querySelector(p.section);
    if (!section) return;
    const blocks = [];
    p.blocks.forEach((spec) => {
      section.querySelectorAll(spec.sel).forEach((b, i) => {
        prepare(b, p.section.slice(1) + '.' + spec.sel.replace('.', '') + (i ? i + 1 : ''), spec.lite);
        blocks.push(b);
      });
    });
    const g = { section, blocks, remaining: blocks.length, start: 0, name: p.section };
    blocks.forEach((b) => { b._g = g; });
    groups.push(g);
  });
  if (!groups.length) return;

  /* ---------- helper cursors ---------- */
  const layer = document.createElement('div');
  layer.className = 'helpers';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const helpers = NAMES.map((name, i) => {
    const el = document.createElement('div');
    el.className = 'helper';
    el.innerHTML =
      '<svg viewBox="0 0 20 22"><path d="M2 2 L2 17 L6.2 13 L9 19.5 L11.6 18.4 L8.8 12.2 L14.5 12 Z" ' +
      'fill="#C8792C" stroke="#1A120B" stroke-width="1.2" stroke-linejoin="round"/></svg>' +
      '<span class="h-tag">' + name + '</span>';
    layer.appendChild(el);
    return { el, i, name: name.split(' · ')[0], busy: false, x: 0, y: 0 };
  });

  function home(h) {
    const vw = window.innerWidth, vh = window.innerHeight;
    return { x: h.i % 2 === 0 ? -90 : vw + 90, y: vh * (0.2 + 0.18 * h.i) };
  }
  function place(h, x, y) {
    h.x = x; h.y = y;
    h.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
  }
  function quad(p0, c, p1, t) {
    const u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
             y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y };
  }
  /* point on a rectangle's outline, clockwise from the top-left, t from 0 to 1 */
  function perim(w, h, t) {
    let d = t * 2 * (w + h);
    if (d <= w) return { x: d, y: 0 };
    d -= w;
    if (d <= h) return { x: w, y: d };
    d -= h;
    if (d <= w) return { x: w - d, y: h };
    d -= w;
    return { x: 0, y: h - d };
  }

  const queue = [];   // { block, group }
  const tasks = [];
  let looping = false;

  /* while the film covers the page, wait: otherwise cards would build out of sight underneath it */
  const filmEl = document.getElementById('film');
  const filmCovering = () => filmEl && filmEl.classList.contains('on') && parseFloat(filmEl.style.opacity || '0') > 0.25;

  function pump(now) {
    const blocked = filmCovering();
    for (const h of helpers) {
      if (!queue.length) break;
      if (h.busy) continue;
      /* page cards wait while the film covers them; the film's own cards never wait */
      const at = queue.findIndex((j) => j.film || !blocked);
      if (at < 0) { setTimeout(() => pump(performance.now()), 120); break; }
      h.busy = true;
      const job = queue.splice(at, 1)[0];
      const block = job.block;
      const hm = home(h);
      place(h, hm.x, hm.y);
      h.el.style.opacity = '1';
      log(h.name, '→ ' + block.dataset.block);
      emit('fly');
      const rc = block.getBoundingClientRect();
      const r = { left: rc.left, top: rc.top, right: rc.right, bottom: rc.bottom, width: rc.width, height: rc.height };
      const dist = Math.hypot(r.left - hm.x, r.top - hm.y);
      const sign = Math.random() < 0.5 ? -1 : 1;
      const bow = dist * (0.12 + Math.random() * 0.06) * sign;
      const mx = (hm.x + r.left) / 2, my = (hm.y + r.top) / 2;
      const nx = -(r.top - hm.y) / (dist || 1), ny = (r.left - hm.x) / (dist || 1);
      const fast = !!job.film;
      tasks.push({
        h, block, group: job.group, born: now, lite: !!block.dataset.lite,
        fast, ov: block.querySelector('.b-ov'), fixed: fast, r,           // film boxes sit in a fixed layer: the rectangle never changes
        phase: 'fly', t0: now,
        dur: fast ? clamp(FAST.flyMin + dist * FAST.flyDist, FAST.flyMin, FAST.flyMax) : clamp(380 + dist * 0.45, 520, 1000),
        p0: { x: hm.x, y: hm.y }, c: { x: mx + nx * bow, y: my + ny * bow },
        traceMs: 0, doneAt: 0,
      });
    }
    if (tasks.length && !looping) { looping = true; requestAnimationFrame(frame); }
  }

  /* set the card's parts moving: each is revealed in turn */
  function startContent(t, now) {
    const b = t.block;
    b.dataset.state = 'content';
    const kids = Array.from(b.children).filter((c) => !c.classList.contains('b-ov'));
    const gap = t.fast ? FAST.kidGap : KID_GAP, tail = t.fast ? FAST.tail : KID_TAIL;
    kids.forEach((kid, i) => setTimeout(() => revealKid(kid, t.fast), i * gap));
    t.doneAt = now + Math.max(0, kids.length - 1) * gap + tail;
    emit('content');
    log(t.h.name, 'content ' + b.dataset.block + ' (' + kids.length + ' parts)');
    t.phase = 'content'; t.t0 = now; t.p0 = { x: t.h.x, y: t.h.y };
  }

  function frame(now) {
    /* pass 1: read every rectangle (page boxes move with the scroll; film boxes are cached).
       pass 2: all the writes. Reading and writing in turn made the browser recalculate the whole
       page layout once per box, every frame. */
    for (let k = 0; k < tasks.length; k++) {
      const t = tasks[k];
      if (!t.fixed) t.rc = t.block.getBoundingClientRect();
    }
    for (let k = tasks.length - 1; k >= 0; k--) {
      const t = tasks[k], h = t.h, b = t.block;
      const r = t.fixed ? t.r : t.rc;
      const ov = t.ov || (t.ov = b.querySelector('.b-ov'));
      const el = now - t.t0;

      if (t.phase === 'fly') {
        const p = clamp(el / t.dur, 0, 1);
        const pos = quad(t.p0, t.c, { x: r.left, y: r.top }, easeIO(p));
        place(h, pos.x, pos.y);
        if (p >= 1) {
          /* size the trace rectangle to this card, with its own corner radius */
          const rect = b.querySelector('.b-trace rect');
          const w = t.fixed ? r.width : b.offsetWidth, ht = t.fixed ? r.height : b.offsetHeight;
          const rx = parseFloat(getComputedStyle(b).borderTopLeftRadius) || 0;
          rect.setAttribute('x', 0.75); rect.setAttribute('y', 0.75);
          rect.setAttribute('width', Math.max(1, w - 1.5)); rect.setAttribute('height', Math.max(1, ht - 1.5));
          rect.setAttribute('rx', rx); rect.setAttribute('ry', rx);
          b.querySelector('.b-lbl').textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
          ov.style.setProperty('--t', '0'); ov.style.setProperty('--f', '0');
          b.dataset.state = 'trace';
          t.traceMs = t.fast ? FAST.trace + Math.min(FAST.traceCap, (r.width + r.height) * FAST.traceSize) : 600 + Math.min(500, (r.width + r.height) * 0.4);
          emit('trace');
          log(h.name, 'tracing ' + b.dataset.block + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
          t.phase = 'trace'; t.t0 = now;
        }
      } else if (t.phase === 'trace') {
        const p = easeIO(clamp(el / t.traceMs, 0, 1));
        ov.style.setProperty('--t', p.toFixed(3));
        const pt = perim(r.width, r.height, p);
        place(h, r.left + pt.x, r.top + pt.y);
        if (el >= t.traceMs) {
          if (t.lite) startContent(t, now);
          else {
            b.dataset.state = 'fill';
            emit('fill');
            t.phase = 'fill'; t.t0 = now; t.p0 = { x: h.x, y: h.y };
          }
        }
      } else if (t.phase === 'fill') {
        const p = clamp(el / (t.fast ? FAST.fill : FILL_MS), 0, 1);
        ov.style.setProperty('--f', easeOut(p).toFixed(3));
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, e = easeIO(p);
        place(h, t.p0.x + (cx - t.p0.x) * e, t.p0.y + (cy - t.p0.y) * e);
        if (p >= 1) startContent(t, now);
      } else if (t.phase === 'content') {
        /* the cursor settles in the middle of the card while its parts appear */
        const p = easeIO(clamp(el / 300, 0, 1));
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        place(h, t.p0.x + (cx - t.p0.x) * p, t.p0.y + (cy - t.p0.y) * p);
        if (now >= t.doneAt) {
          b.dataset.state = 'done';
          emit('done');
          log(h.name, 'done ' + b.dataset.block + ' (' + Math.round(now - t.born) + ' ms)');
          const g = t.group;
          if (--g.remaining === 0) {
            log('build', g.name + ' built in ' + ((now - g.start) / 1000).toFixed(1) + ' s');
          }
          t.phase = 'leave'; t.t0 = now; t.p0 = { x: h.x, y: h.y };
          const hm = home(h);
          t.c = { x: (t.p0.x + hm.x) / 2, y: Math.min(t.p0.y, hm.y) - 60 };
        }
      } else if (t.phase === 'leave') {
        const hm = home(h);
        const p = clamp(el / (t.fast ? FAST.leave : LEAVE_MS), 0, 1);
        const pos = quad(t.p0, t.c, hm, easeIO(p));
        place(h, pos.x, pos.y);
        if (p > 0.55) h.el.style.opacity = '0';
        if (p >= 1) {
          h.busy = false;
          tasks.splice(k, 1);
          pump(now);
        }
      }
    }
    if (tasks.length) requestAnimationFrame(frame);
    else looping = false;
  }

  /* hook for film.js: its overlay cards are built by the same cursors */
  window.BUILD = {
    group(name, count) { return { section: null, blocks: [], remaining: count, start: 0, name }; },
    add(block, name, lite, g) { prepare(block, name, lite); block._g = g; },
    go(block) {
      const g = block._g;
      if (!g.start) g.start = performance.now();
      queue.push({ block, group: g, film: true });
      pump(performance.now());
    },
    /* a box the visitor has already scrolled past: show it finished, with no animation */
    instant(block) {
      const qi = queue.findIndex((j) => j.block === block);
      if (qi >= 0) queue.splice(qi, 1);
      block.dataset.state = 'done';
    },
    /* a scene that has left the screen: finish whatever is still being built, at once */
    finish(block) {
      const qi = queue.findIndex((j) => j.block === block);
      if (qi >= 0) { queue.splice(qi, 1); block.dataset.state = 'done'; return; }
      const t = tasks.find((x) => x.block === block);
      if (t && t.phase !== 'leave') {
        block.dataset.state = 'done';
        Array.from(block.children).forEach((kid) => { kid.dataset.in = '1'; });
        t.phase = 'leave'; t.t0 = performance.now(); t.p0 = { x: t.h.x, y: t.h.y };
        const hm = home(t.h);
        t.c = { x: (t.p0.x + hm.x) / 2, y: Math.min(t.p0.y, hm.y) - 60 };
      }
    },
  };

  /* only hide things once every block is prepared */
  document.documentElement.classList.add('build-on');

  /* each card starts building when it comes into view */
  const bio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      bio.unobserve(en.target);
      const g = en.target._g;
      if (!g.start) g.start = performance.now();
      queue.push({ block: en.target, group: g });
      pump(performance.now());
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
  groups.forEach((g) => g.blocks.forEach((b) => bio.observe(b)));

  /* titles type when they come into view */
  const tio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      tio.unobserve(en.target);
      typeTitle(en.target);
    });
  }, { threshold: 0.6 });
  titles.forEach((t) => tio.observe(t));
})();
