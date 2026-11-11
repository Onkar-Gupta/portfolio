/* ============================================================
   FILM.JS: the scroll-scrubbed film, built from SCROLL FRAMES
   Four clips (media/film-a, b1, b2, c) play as the visitor scrolls
   through an empty runway section placed after the hero.

   The film is cut into BEATS. Each beat plays a set piece of video
   (from a share of a clip to another). At the end of a beat there is a
   REST POINT: the video has reached its planned frame and that beat's
   boxes are all built. Scrolling plays the video toward the next rest
   point; stop part-way and the page glides on to the nearest rest point
   (the video keeps playing as it glides), scrolling back rewinds the
   same way. Arrow keys and Page Up/Down jump one frame at a time.

   Every box has a CUE: a moment in its beat's video. The intro's boxes
   rise in with a CSS animation; every scene after the intro is built by
   the swarm cursors from build.js. Either way the box appears when the
   video reaches its cue, so the boxes belong to what is on screen. A counter shows which frame
   you are on.

   Beats (the opening plays by itself; scroll opens at the first rest point):
     a1  the code writes "> ejecting..."  (the intro: plays by itself)  R
     a2  the glass shatters, he comes out  (the intro)                    R
     fall   the free fall (the intro ends here; About boxes appear)      R
     orbit  front hold (journey)                                R
            travel, left hold (certifications)                  R
            travel, back hold (key results)                     R
            the rest of the orbit
     catch  the light cursors lower him onto a clean floor     R
     floor  the floppy archive: one rest point per disk, then contact
   The full sections below the film say the same things for search
   engines, keyboards and reduced motion. Without JS or with reduced
   motion nothing here is created.
   ============================================================ */

(function () {
  'use strict';

  const MIND = window.MIND;
  if (!MIND || MIND.reduced || typeof CONTENT === 'undefined') return;
  const C = CONTENT;

  /* the beats. len is scroll length in viewport heights; from and to are the share of the
     clip played. rest: the beat ends at a rest point. Holds are plays with a tiny share,
     so the picture creeps while the boxes build. Orbit: 0 front, 0.25 left, 0.5 back. */
  const SEGS = [
    { name: 'a1',    clip: 'a',  from: 0,     to: 0.55,  len: 90  },                 // 0  the code writes
    { name: 'a2',    clip: 'a',  from: 0.55,  to: 1,     len: 80  },                 // 1  the glass shatters, he comes out
    { name: 'fall',  clip: 'b1', from: 0,     to: 1,     len: 120 },                 // 2  the free fall
    { name: 'orbit', clip: 'b2', from: 0,     to: 0.22,  len: 90  },                 // 3  orbit, front to left: the skills
    { name: 'orbit', clip: 'b2', from: 0.22,  to: 0.26,  len: 10  },                 // 4
    { name: 'orbit', clip: 'b2', from: 0.26,  to: 0.48,  len: 90  },                 // 5  left to back: the journey
    { name: 'orbit', clip: 'b2', from: 0.48,  to: 0.52,  len: 10  },                 // 6
    { name: 'orbit', clip: 'b2', from: 0.52,  to: 0.74,  len: 90  },                 // 7  back to right: the certifications
    { name: 'orbit', clip: 'b2', from: 0.74,  to: 1,     len: 70  },                 // 8  the rest of the orbit
    /* 9 the catch. Scroll is handed back at LEAVE: the moment he has walked out of the frame */
    { name: 'catch', clip: 'c',  from: 0,     to: 1,     len: 110, restAt: [0.945] },
    /* 10 the empty floor: six disks. restAt = rest points as shares of the beat, one per disk */
    { name: 'floor', clip: 'c',  from: 1,     to: 1,     len: 300, restAt: [0.05, 0.22, 0.39, 0.56, 0.73, 0.90] },
  ];
  const ALBUM_SEG = 10;
  const PHONE = window.matchMedia('(max-width: 999px)').matches;      // phones and small tablets get the 540p, short-keyframe clips (media/m/)
  const CLIP_DIR = PHONE ? 'media/m/' : 'media/';
  const CLIP_FILES = { a: CLIP_DIR + 'film-a.mp4', b1: CLIP_DIR + 'film-b1.mp4', b2: CLIP_DIR + 'film-b2.mp4', c: CLIP_DIR + 'film-c.mp4' };
  const LEAD = -4;         // vh after the runway starts when the film cuts in: just after the brain has formed
  const FADE = 30;         // vh at the end where the film fades into the page
  const END_HOLD = 0.04;   // seconds kept off the end so the last frame is never dropped
  const START_REST = 2;    // px into the film where the movie starts
  const LEAVE = 0.945;     // share of the catch clip at which he is out of frame: scroll opens here

  const k = window.innerWidth < 1000 ? 0.7 : 1;      // shorter runway on phones
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- DOM: the runway, the film, the overlay ---------- */
  const boot = document.getElementById('boot');
  if (!boot) return;

  const runway = document.createElement('section');
  runway.id = 'film-runway';
  runway.setAttribute('aria-hidden', 'true');
  boot.after(runway);

  const film = document.createElement('div');
  film.id = 'film';
  film.setAttribute('aria-hidden', 'true');
  document.body.appendChild(film);

  const ids = Array.from(new Set(SEGS.map((s) => s.clip)));
  const clips = ids.map((id) => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'none'; v.loop = false;
    v.dataset.clip = id;
    v.src = CLIP_FILES[id];
    film.appendChild(v);
    return { id, v, target: 0 };
  });

  const ui = document.createElement('div');
  ui.id = 'film-ui';
  ui.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ui);

  /* ---------- cards ---------- */
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = 'fc ' + cls; d.innerHTML = html; return d; };
  const chronological = C.journey.epochs.slice().reverse();     // B.Tech first, MSc last
  const P = C.projects.items;
  const shortTitle = (p) => p.title.split(/[:(]/)[0].trim();

  const cardTag = () => mk('fc-tag',
    `<b>${esc(C.meta.name)}</b><span>${esc(C.meta.role)} · ${esc(C.meta.location)}</span>`);
  const cardAbout = () => mk('', `
    <span class="k">epoch ${esc(C.about.num)} · ${esc(C.about.tag)}</span>
    <h3>${esc(C.about.title)}</h3>
    <p>${esc(C.about.paragraphs[0])}</p>
    <p>${esc(C.about.paragraphs[2])}</p>`);
  const cardStats = () => mk('', `
    <span class="k">at a glance</span>
    <div class="fc-stats">${C.about.stats.map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
    <ul class="pts">${C.about.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`);
  const cardSkill = (g) => mk('', `
    <span class="k">${esc(g.title)}</span>
    <div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>`);
  const cardEpoch = (e) => mk('', `
    <span class="k">${esc(e.epoch)} · ${esc(e.date)}</span>
    <h3>${esc(e.heading)}</h3>
    <p>${esc(e.org)}</p>
    <p>${esc(e.desc)}</p>`);
  const cardCert = (a) => mk('', `
    <span class="k">${esc(a.icon)} certification</span>
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.desc)}</p>`);
  const cardHighlights = (list, label) => mk('', `
    <span class="k">${esc(label)}</span>
    ${list.map((p) => `<div class="hl"><b>${esc(p.key)}</b><span>${esc(shortTitle(p))}</span></div>`).join('')}`);
  const cardContact = () => {
    const links = C.contact.socials.map((s) => `<a href="${s.href}" tabindex="-1"${s.label === 'email' ? ' class="solid"' : ''}>${esc(s.label)}</a>`).join('');
    return mk('fc-big', `
      <span class="k">epoch ${esc(C.contact.num)} · ${esc(C.contact.tag)}</span>
      <h3>${esc(C.contact.title)}</h3>
      <p>${esc(C.contact.narrative)}</p>
      <div class="fc-cta">${links}</div>`);
  };

  /* ---------- scenes ----------
     from/to: where the scene is on screen, as [beat, share of it].
     cues: one [beat, share] per card, in the order the cards are created
     (top, left, mid, right): the video moment each card is built at.
     chip = the small title above the left column; grp = the dot of the progress rail it lights. */
  const DEFS = [
    /* The opening is one movie that plays by itself. The boxes are part of it: they appear at their cues
       while the video runs, slows or holds (see MOVIE below), in the order of the menu: data (About),
       architecture (skills), training (journey), evaluation (certifications). Then he walks out of the
       frame, scroll opens, and the floppy disks (outputs) appear; the full sections take over after them.
       css: true = the boxes use the light CSS motion (no cursors inside the movie). */
    { id: 'about',      grp: 'about',    css: true, chip: `${C.about.num} · ${C.about.tag}`,
                                         from: [2, 0.26],  to: [3, 0.04],  left: [cardAbout], right: [cardStats],
                                         cues: [[2, 0.4], [2, 0.58]] },
    { id: 'skills',     grp: 'skills',   css: true, chip: `${C.skills.num} · ${C.skills.tag}`,
                                         from: [3, 0.0],  to: [4, 0.9],   left: [() => cardSkill(C.skills.groups[0]), () => cardSkill(C.skills.groups[1])],
                                         right: [() => cardSkill(C.skills.groups[2]), () => cardSkill(C.skills.groups[3])],
                                         cues: [[3, 0.05], [3, 0.22], [3, 0.39], [3, 0.56]] },
    { id: 'journey',    grp: 'journey',  css: true, chip: `${C.journey.num} · ${C.journey.tag}`,
                                         from: [5, 0.0],  to: [6, 0.9],   left: [() => cardEpoch(chronological[0]), () => cardEpoch(chronological[1])],
                                         right: [() => cardEpoch(chronological[2]), () => cardEpoch(chronological[3])],
                                         cues: [[5, 0.05], [5, 0.22], [5, 0.39], [5, 0.56]] },
    { id: 'certs',      grp: 'certs',    css: true, chip: `${C.achievements.num} · ${C.achievements.tag}`,
                                         from: [7, 0.0],  to: [8, 0.25],  left: [() => cardCert(C.achievements.items[0]), () => cardCert(C.achievements.items[1])],
                                         right: [() => cardCert(C.achievements.items[2]), () => cardCert(C.achievements.items[3])],
                                         cues: [[7, 0.05], [7, 0.22], [7, 0.39], [7, 0.56]] },
    { id: 'album',      grp: 'projects', album: true,     from: [9, LEAVE],   to: [10, 0.95] },
  ];

  /* the progress rail: one dot per part of the story */
  const RAIL = [['about', 'data'], ['skills', 'architecture'], ['journey', 'training'],
                ['certs', 'evaluation'], ['projects', 'outputs'], ['contact', 'deploy']];
  const rail = document.createElement('div');   // a div, not a nav: the site's nav styles would catch it
  rail.id = 'film-rail';
  rail.setAttribute('aria-hidden', 'true');
  rail.innerHTML = RAIL.map(([g, label]) => `<span data-grp="${g}"><i></i><b>${label}</b></span>`).join('');
  document.body.appendChild(rail);

  /* the frame counter and the scroll hint */
  const counter = document.createElement('div');
  counter.id = 'film-count';
  counter.setAttribute('aria-hidden', 'true');
  counter.innerHTML = '<b>01</b><span> / 01</span><i class="hint"></i>';
  document.body.appendChild(counter);
  const cNum = counter.querySelector('b'), cTot = counter.querySelector('span'), cHint = counter.querySelector('.hint');

  /* the intro: scroll is locked and the first beats play by themselves; this button lets anyone skip */
  const skip = document.createElement('button');
  skip.id = 'intro-skip';
  skip.type = 'button';
  skip.textContent = 'skip intro ›';
  document.body.appendChild(skip);

  /* ---------- the floppy archive ---------- */
  /* the plastic shells: the palette, plus the character's Sierra blue for variety */
  const SHELLS = ['#3A2A1B', '#B8661F', '#8C7B65', '#5E7388', '#2C2016', '#6B4C30'];

  /* a 3.5 inch floppy disk drawn in code: a metal shutter that slides open, a paper label
     with the project's real number, a write-protect notch. The label is the content. */
  function coverHTML(i) {
    const p = P[i];
    const bs = Math.min(0.17, 1.2 / p.album.big.length).toFixed(3);   // long numbers get smaller type
    const ts = shortTitle(p).length > 30 ? 0.046 : 0.06;               // long titles get smaller type
    return `<div class="cover floppy" style="--shell:${SHELLS[i % SHELLS.length]};--bs:${bs};--ts:${ts}">
      <div class="mag"><span></span></div>
      <div class="shutter"><i></i></div>
      <div class="label">
        <span class="no">No. ${esc(p.num)} · ${String(i + 1).padStart(2, '0')}/${String(P.length).padStart(2, '0')}</span>
        <div class="stat"><div class="big">${esc(p.album.big)}</div><div class="unit">${esc(p.album.unit)}</div></div>
        <div class="ttl">${esc(shortTitle(p))}</div>
        <div class="by">ONKAR GUPTA</div>
      </div>
      <b class="notch"></b>
    </div>`;
  }

  let recs = [], albumInfo = null, albumStage = null, albumIdx = -1;

  function buildAlbum() {
    const el = document.createElement('section');
    el.className = 'fs fs-album';
    el.dataset.scene = 'album';

    const chip = document.createElement('div');
    chip.className = 'fs-chip center';
    chip.textContent = `${C.projects.num} · ${C.projects.tag} · A:\\PROJECTS`;
    el.appendChild(chip);

    albumStage = document.createElement('div');
    albumStage.className = 'album-stage';
    recs = P.map((p, i) => {
      const r = document.createElement('div');
      r.className = 'rec';
      r.dataset.i = String(i);
      r.innerHTML = coverHTML(i);
      albumStage.appendChild(r);
      return r;
    });
    el.appendChild(albumStage);

    albumInfo = document.createElement('div');
    albumInfo.className = 'album-info';
    albumInfo.innerHTML = `<span class="k"></span><h3></h3><p></p><span class="hint">click the disk to open it · scroll for the next disk</span>`;
    el.appendChild(albumInfo);

    ui.appendChild(el);
    return el;
  }

  function sizeAlbum() {
    if (!albumStage) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const S = k < 1 ? Math.min(vw * 0.62, vh * 0.36) : Math.min(vw * 0.3, vh * 0.46, 420);
    albumStage.style.setProperty('--S', Math.round(S) + 'px');
  }

  function setAlbumInfo(i) {
    if (i === albumIdx) return;
    albumIdx = i;
    window.dispatchEvent(new CustomEvent('film-disk', { detail: { i } }));
    const p = P[i];
    albumInfo.querySelector('.k').textContent = `disk ${String(i + 1).padStart(2, '0')} / ${String(P.length).padStart(2, '0')} · output_${p.num}`;
    albumInfo.querySelector('h3').textContent = p.title;
    albumInfo.querySelector('p').textContent = p.desc;
  }

  /* cover-flow: p is the disk at the centre, as a number from 0 to the last index */
  function placeAlbum(p) {
    const S = parseFloat(albumStage.style.getPropertyValue('--S')) || 300;
    const space = k < 1 ? 0.5 : 0.6;
    recs.forEach((r, i) => {
      const off = i - p, a = Math.abs(off);
      r.style.transform = `translate(-50%,-50%) translateX(${(off * S * space).toFixed(1)}px) translateZ(${(-Math.min(a, 3) * 170).toFixed(0)}px) rotateY(${(clamp(off, -1, 1) * -48).toFixed(1)}deg) scale(${(1 - Math.min(a, 2) * 0.07).toFixed(3)})`;
      r.style.opacity = clamp(1 - Math.max(0, a - 1.5) * 0.85, 0, 1).toFixed(2);
      r.style.zIndex = String(100 - Math.round(a * 10));
      r.style.setProperty('--peek', clamp(1 - a * 1.7, 0, 1).toFixed(2));
      r.classList.toggle('act', a < 0.5);
    });
    setAlbumInfo(clamp(Math.round(p), 0, P.length - 1));
  }

  /* ---------- build the scenes ---------- */
  const scenes = DEFS.map((d) => {
    if (d.album) {
      const el = buildAlbum();
      return { def: d, el, cards: [], built: false, from: 0, to: 0, cuePx: [], cued: [] };
    }
    const el = document.createElement('section');
    el.className = 'fs';
    el.dataset.scene = d.id;
    /* left and right columns share one row, so they always have the same top and height */
    let row = null;
    if (d.left || d.right) { row = document.createElement('div'); row.className = 'row'; el.appendChild(row); }
    const cards = [];
    ['top', 'left', 'mid', 'right'].forEach((side) => {
      if (!d[side]) return;
      const col = document.createElement('div');
      col.className = 'col ' + side;
      d[side].forEach((make) => { const c = make(); col.appendChild(c); cards.push(c); });
      (side === 'left' || side === 'right' ? row : el).appendChild(col);
    });
    /* the chip sits just above the left column, clear of the character's face */
    if (d.chip && row) {
      const chip = document.createElement('div');
      chip.className = 'fs-chip';
      chip.textContent = d.chip;
      row.querySelector('.col.left').appendChild(chip);
    }
    ui.appendChild(el);
    const sc = { def: d, el, cards, built: false, from: 0, to: 0, cuePx: [], cued: [] };
    if (d.css || !window.BUILD) {
      /* the intro's boxes: a light CSS rise-and-fade (no cursors). Each part gets an index so CSS
         can drop the lines in one after another. */
      cards.forEach((c) => {
        c.classList.add('css-reveal');
        Array.from(c.children).forEach((kid, i) => kid.style.setProperty('--i', String(i)));
      });
    } else {
      /* every scene after the intro: the swarm cursors build the boxes */
      const g = window.BUILD.group('film.' + d.id, cards.length);
      cards.forEach((c, i) => window.BUILD.add(c, 'film.' + d.id + '.' + (i + 1), false, g));
    }
    return sc;
  });
  const albumScene = scenes.find((s) => s.def.album);

  /* ---------- a project opened over the film: the disk's contents ---------- */
  const modal = document.createElement('div');
  modal.id = 'fm';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  document.body.appendChild(modal);

  function openProject(i) {
    const p = P[i];
    modal.innerHTML = `<div class="fm-card sleeve">
      <button class="fm-close" aria-label="Close">×</button>
      <div class="sl-art">${coverHTML(i)}</div>
      <div class="sl-body">
        <span class="k">A:\\${esc(shortTitle(p).replace(/\s+/g, '_').toUpperCase())}> DIR</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <ol class="trk">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <div class="tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <div class="links">${p.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
      </div>
    </div>`;
    modal.classList.add('open');
    window.dispatchEvent(new CustomEvent('film-open'));
  }
  const closeModal = () => modal.classList.remove('open');
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.fm-close')) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- geometry (px), measured on load and resize ---------- */
  let filmStart = 0, total = 0, fadeStart = 0, segs = [], rests = [START_REST];

  function measure() {
    const vh = window.innerHeight;
    const segVh = SEGS.reduce((s, c) => s + c.len, 0);
    const totalVh = (segVh + FADE) * k;
    runway.style.height = Math.round((totalVh - LEAD * k) * vh / 100) + 'px';
    MIND.remeasure();
    filmStart = runway.offsetTop - LEAD * k * vh / 100;
    total = totalVh * vh / 100;

    let at = 0;
    segs = SEGS.map((s) => {
      const lenPx = s.len * k * vh / 100;
      const o = { ...s, start: at, lenPx, ci: ids.indexOf(s.clip) };
      at += lenPx;
      return o;
    });
    fadeStart = at;

    const pos = (ref) => (ref === 'end' ? total : segs[ref[0]].start + segs[ref[0]].lenPx * ref[1]);
    scenes.forEach((sc) => {
      sc.from = pos(sc.def.from);
      sc.to = pos(sc.def.to);
      sc.cuePx = (sc.def.cues || []).map(pos);
    });

    /* rest points, in px into the film */
    rests = [];
    segs.forEach((s) => {
      if (s.rest) rests.push(s.start + s.lenPx);
      if (s.restAt) s.restAt.forEach((share) => rests.push(s.start + s.lenPx * share));
    });
    cTot.textContent = ' / ' + String(rests.length).padStart(2, '0');
    sizeAlbum();
  }

  /* ---------- the opening: one seamless movie, all by itself ----------
     When the film cuts in after the brain has formed and the glitch has played, scroll is locked and the
     four clips play one after another like a film. The boxes are part of it. The movie is a list of
     phases:
       play  the clip plays for real (smooth) between two points, at a chosen speed
       hold  the picture is held (it creeps a hair) for a set time, so a set of boxes can appear one by one
     The video runs at normal speed while he emerges, falls and travels; it slows through the fall while the
     About boxes appear; and it holds at the front, the left and the back of the orbit while the skills, the
     journey and the certifications appear. When he has walked out of the frame, scroll opens at the first
     rest point and the floppy disks appear. From there scroll is free, through the floppies and on through
     the sections below, to the end. The page position follows the movie, so the boxes' cues (which are
     positions) fire in step. It plays once per visit; Esc, Enter or the skip button ends it at once. */
  const INTRO_REST = 0;                      // the rest point where scroll opens: he has left the frame
  const HOLD_MS = 7000;                      // how long the picture holds while four boxes appear
  const MOVIE = [
    { clip: 'a',  play: [0, 1],          rate: 1 },                  // the monitor, the code, the eject
    { clip: 'b1', play: [0, 1],          rate: 1 },                  // the fall (slow motion is baked into the clip, so it plays at normal speed)
    { clip: 'b2', play: [0, 1],          rate: 1 },                  // the orbit (also slowed in the file: slow playback in the browser judders)
    { clip: 'c',  play: [0, LEAVE],      rate: 1 },                  // the catch, until he has left the frame
  ];
  let intro = 'idle', introGuard = 0, phase = -1, phaseT0 = 0, phaseStarted = false;

  /* the listeners that block scrolling exist only while the movie plays: a blocking wheel or touch
     listener makes the browser wait for the script on every scroll step, which feels like lag */
  const stop = (e) => { e.preventDefault(); };
  const stopKeys = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter') { endIntro(true); return; }
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key)) e.preventDefault();
  };
  function lockOn() {
    document.documentElement.classList.add('scroll-locked'); skip.classList.add('on');
    window.addEventListener('wheel', stop, { passive: false });
    window.addEventListener('touchmove', stop, { passive: false });
    window.addEventListener('keydown', stopKeys);
  }
  function lockOff() {
    document.documentElement.classList.remove('scroll-locked'); skip.classList.remove('on');
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchmove', stop);
    window.removeEventListener('keydown', stopKeys);
  }

  /* where the page should be for a given moment u (0 to 1) of a clip */
  function fFor(clipId, u) {
    if (clipId === 'a') {
      const a1 = segs[0], a2 = segs[1];
      if (u < a1.to) return START_REST + (a1.lenPx - START_REST) * (u / a1.to);
      return a2.start + a2.lenPx * ((u - a2.from) / (a2.to - a2.from));
    }
    if (clipId === 'b1') return segs[2].start + segs[2].lenPx * u;
    if (clipId === 'b2') {
      for (let i = 3; i <= 8; i++) {
        const g = segs[i];
        if (u <= g.to || i === 8) return g.start + g.lenPx * clamp((u - g.from) / (g.to - g.from), 0, 1);
      }
    }
    return segs[9].start + segs[9].lenPx * u;
  }

  function showOnly(c) {
    clips.forEach((o) => o.v.classList.toggle('show', o === c));
    active = clips.indexOf(c);
  }

  /* start one phase of the movie. A clip that is not loaded yet is waited for, and is only shown once it
     can play, so the picture never goes blank between two clips. */
  function beginPhase(i, delay) {
    if (intro !== 'playing') return;
    if (i >= MOVIE.length) { endIntro(false); return; }
    phase = i; phaseStarted = false;
    const ph = MOVIE[i], c = clips.find((x) => x.id === ph.clip), v = c.v;
    v.preload = 'auto';
    const go = () => {
      if (intro !== 'playing' || phase !== i) return;
      const switching = !v.classList.contains('show');
      if (switching) showOnly(c);
      if (ph.hold != null) {                                     // hold: the picture rests at the start of its beat
        const g = segs[ph.hold];
        if (Math.abs(v.currentTime - g.from * v.duration) > 0.15) { try { v.currentTime = g.from * v.duration; } catch (e) { /* not seekable yet */ } }   // no seek when already there
        v.playbackRate = 0.0625;                                 // the slowest steady play: the picture drifts, no seeking
        const pr0 = v.play(); if (pr0 && pr0.catch) pr0.catch(() => {});
      } else {
        const u0 = ph.play[0];
        if (switching || i === 0) { try { v.currentTime = u0 * v.duration; } catch (e) { /* not seekable yet */ } }
        v.playbackRate = ph.rate;
        const pr = v.play();
        if (pr && pr.catch) pr.catch(() => endIntro(false));    // if playing is refused, never trap the visitor
      }
      phaseT0 = performance.now(); phaseStarted = true;
    };
    if (v.readyState >= 3) setTimeout(go, delay);
    else { v.addEventListener('canplay', () => setTimeout(go, delay), { once: true }); v.load(); }
  }

  /* called every frame while the movie plays: moves the page to follow it and finishes phases */
  function movieTick(now) {
    if (!phaseStarted) return;
    const ph = MOVIE[phase], c = clips.find((x) => x.id === ph.clip), v = c.v;
    if (!v.duration) return;
    let f, done;
    if (ph.hold != null) {
      const g = segs[ph.hold], p = clamp((now - phaseT0) / ph.ms, 0, 1);
      f = g.start + g.lenPx * p;
      /* the picture drifts on by itself at the slowest speed and is paused once it reaches the end of the
         beat: no seeking while the boxes appear, which is what made the hold lag */
      if (!v.paused && v.currentTime >= g.to * v.duration) v.pause();
      done = p >= 1;
    } else {
      const u = clamp(v.currentTime / v.duration, 0, 1);
      f = fFor(ph.clip, u);
      done = u >= ph.play[1] - 0.004 || v.ended;
    }
    window.scrollTo(0, filmStart + f);
    if (done) beginPhase(phase + 1, 0);
  }

  function startIntro() {
    intro = 'playing';
    lockOn();
    clips.forEach((c) => { c.v.preload = 'auto'; });
    /* hold the first frame for 0.6 s so the glitch can fade out over the still monitor, then play */
    beginPhase(0, 600);
    introGuard = setTimeout(() => endIntro(false), 120000);   // the movie is about a minute: this only fires if a clip stalls
  }
  function endIntro(skipped) {
    if (intro !== 'playing') return;
    intro = 'done';
    clearTimeout(introGuard);
    clips.forEach((c) => { c.v.pause(); c.v.playbackRate = 1; });
    active = -1;                              // let the scroll logic choose the clip again
    lockOff();
    const y = filmStart + rests[INTRO_REST];
    if (skipped) glideTo(y);
    else {
      /* land exactly on the rest point, and bring the smoothed position there at once: otherwise the
         scrub logic would pull the video back to where the page position was still catching up from */
      window.scrollTo(0, y);
      MIND.current = y;
    }
    lastY = window.scrollY;
  }
  skip.addEventListener('click', () => endIntro(true));

  /* ---------- scroll frames: glide to the nearest rest point ---------- */
  let snapping = false, snapTimer = 0, lastY = window.scrollY, lastDir = 1, lastAct = performance.now(), touching = false;

  let glideId = 0;
  function glideTo(y) {
    const y0 = window.scrollY, dist = Math.abs(y - y0);
    if (dist < 2) return;
    const id = ++glideId;                                  // a newer glide cancels an older one for good
    const dur = clamp(380 + dist * 0.5, 520, 1600), t0 = performance.now();
    snapping = true;
    (function step(now) {
      if (id !== glideId || !snapping) return;
      const p = clamp((now - t0) / dur, 0, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, y0 + (y - y0) * e);
      if (p < 1) requestAnimationFrame(step);
      else { snapping = false; lastY = window.scrollY; }
    })(t0);
  }

  function settle() {
    if (snapping || touching || intro === 'playing' || modal.classList.contains('open')) return;
    const f = window.scrollY - filmStart;
    const last = rests[rests.length - 1];
    if (f < rests[0] - 3 || f > last + 3) return;               // free zones: the hero and the movie, and past the end
    const n = rests.findIndex((r) => r > f + 3);
    if (n < 1) return;
    const prev = rests[n - 1], next = rests[n];
    if (f - prev <= 3) return;                                   // already resting
    /* a small fixed push is enough to move on: one mouse-wheel notch is only about 100 px, far less
       than a share of a long beat, so a percentage rule would snap you back after every notch */
    const PUSH = 36;
    const target = lastDir > 0 ? (f - prev >= PUSH ? next : prev) : (next - f >= PUSH ? prev : next);
    glideTo(filmStart + target);
  }

  window.addEventListener('scroll', () => {
    if (snapping || intro === 'playing') return;
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 0.5) lastDir = y > lastY ? 1 : -1;
    lastY = y;
    lastAct = performance.now();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(settle, 190);
  }, { passive: true });

  /* any input from the visitor cancels a glide in progress */
  ['wheel', 'mousedown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { snapping = false; lastAct = performance.now(); }, { passive: true }));
  window.addEventListener('touchstart', () => { snapping = false; touching = true; lastAct = performance.now(); }, { passive: true });
  window.addEventListener('touchend', () => { touching = false; clearTimeout(snapTimer); snapTimer = setTimeout(settle, 220); }, { passive: true });

  /* arrow keys, Page Up/Down and Space jump one frame */
  window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('open') || intro === 'playing') return;
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
    const f = window.scrollY - filmStart;
    if (f < -window.innerHeight * 0.1 || f > rests[rests.length - 1] + 3) return;   // outside the film: normal scrolling
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
    let target = null;
    if (down) target = rests.find((r) => r > f + 4);
    else for (let i = rests.length - 1; i >= 0; i--) if (rests[i] < f - 4) { target = rests[i]; break; }
    if (target == null) return;
    e.preventDefault();
    glideTo(filmStart + target);
  });

  /* click a disk: a side disk glides to the centre, the centre disk opens its contents */
  document.addEventListener('click', (e) => {
    const rec = e.target.closest && e.target.closest('#film-ui .rec');
    if (!rec || !albumScene.el.classList.contains('on')) return;
    const i = +rec.dataset.i;
    if (i === albumIdx) { openProject(i); return; }
    const s = segs[ALBUM_SEG];
    glideTo(filmStart + s.start + s.lenPx * (0.05 + 0.85 * (i / (P.length - 1))));
  });

  /* ---------- load the clips quietly after the page is up ---------- */
  function warm() {
    clips.forEach((c, i) => setTimeout(() => { c.v.preload = 'auto'; c.v.load(); }, i * 700));
    /* paint everything once while the visitor is still on the loader and the brain: every box, every scene
       and every clip is drawn at 1% opacity for a moment, so the browser has already painted them and put
       them on the graphics card. When the movie plays, a box only has to fade in. */
    fontsReady = Promise.all([400, 600, 700, 800].map((w) => document.fonts.load(w + ' 16px Sora', 'Aa'))
      .concat([400, 500, 700].map((w) => document.fonts.load(w + ' 16px "IBM Plex Mono"', 'Aa0')))
      .concat([document.fonts.load('16px Bangers', 'Aa')])).catch(() => {});
    [2500, 5000, 8000].forEach((ms) => setTimeout(prewarm, ms));
  }
  let prewarming = false, fontsReady = Promise.resolve();
  function prewarm() {
    fontsReady.then(prewarmNow);
  }
  function prewarmNow() {
    if (prewarming || filmOn || intro !== 'idle' || window.scrollY > filmStart - 300) return;
    prewarming = true;
    document.documentElement.classList.add('prewarm');
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
      document.documentElement.classList.remove('prewarm'); prewarming = false;
    }, 900)));
  }
  window.addEventListener('site-enter', () => setTimeout(prewarm, 300));

  /* ---------- per-frame: scroll position > clip, time, cues and scenes ---------- */
  let prevF = -1, active = -1, countIdx = -1;
  /* writes to the page cost a frame each, so every value is cached and only written when it changes */
  const FS = { inside: false, seg: 0, name: '', q: 0, f: 0, rest: 0 };
  MIND.film = FS;
  let lastOp = '', lastLit = '', lastLight = null, lastHint = '', lastResting = null, filmOn = null, lastShowCount = null, lastCovered = false;
  /* low-power mode: if frames average slower than about 36 fps while the film is on, switch off
     the film grain and the heavier shadows */
  let lastTs = 0, ema = 16, slow = 0, lite = false;

  function frame(ts) {
    const f = MIND.current - filmStart;              // px into the film

    if (f >= 0 && prevF < 0) {                       // the computer dies, the film cuts in
      MIND.playGlitch();
      if (intro === 'idle' && f < 700 && rests.length > INTRO_REST) startIntro();   // only if we came in from the hero (a fast flick can cross by a few hundred px)
    }
    prevF = f;
    if (intro === 'playing') movieTick(performance.now());       // the movie moves the page, and the boxes' cues follow

    const inside = f >= 0 && f <= total;
    /* while the film fully covers the screen, nothing under it needs drawing: hide the page, the canvases and
       the grain so the browser composites only the video and the boxes (see .film-on in film.css) */
    FS.past = f > total;                              // sound.js plays its tune once the film is behind us
    const covered = f >= 60 && f < fadeStart - 40;
    if (covered !== lastCovered) { lastCovered = covered; document.documentElement.classList.toggle('film-on', covered); }
    if (inside !== filmOn) { filmOn = inside; film.classList.toggle('on', inside); }

    if (inside && lastTs) {
      const dt = ts - lastTs;
      if (dt < 250) ema += (dt - ema) * 0.04;
      if (!lite && ema > 28 && ++slow > 180) { lite = true; document.documentElement.classList.add('lite'); }
      else if (ema <= 28) slow = 0;
    }
    lastTs = ts;

    if (!inside) {
      if (lastOp !== '0') {
        lastOp = '0';
        film.style.opacity = '0'; ui.style.opacity = '0'; rail.style.opacity = '0'; counter.style.opacity = '0';
        active = -1;
        clips.forEach((c) => c.v.classList.remove('show'));
        scenes.forEach((sc) => { sc.el.classList.remove('on'); sc.wasOn = false; });
      }
      FS.inside = false;
    } else {
      let i = segs.findIndex((s) => f <= s.start + s.lenPx + 0.5);       // on a boundary (a rest point) the beat that ends there still shows
      if (i < 0) i = segs.length - 1;                // the fade window holds the last frame of C
      const s = segs[i];
      const q = clamp((f - s.start) / s.lenPx, 0, 1);
      const c = clips[s.ci];
      FS.inside = true; FS.seg = i; FS.name = s.name; FS.q = q; FS.f = f;      // sound.js and effects.js read this

      if (intro !== 'playing' && s.ci !== active) {          // while the intro plays it chooses the clip itself
        clips.forEach((o, j) => o.v.classList.toggle('show', j === s.ci));
        active = s.ci;
      }
      if (c.v.readyState >= 1 && c.v.duration && intro !== 'playing') {
        c.target = (s.from + (s.to - s.from) * q) * (c.v.duration - END_HOLD);
        // seek queue: never stack seeks, and ignore changes smaller than one frame
        if (!c.v.seeking && Math.abs(c.v.currentTime - c.target) > 1 / 30) c.v.currentTime = c.target;
      }

      const op = (f > fadeStart ? clamp(1 - (f - fadeStart) / (total - fadeStart), 0, 1) : 1).toFixed(2);
      if (op !== lastOp) {
        lastOp = op;
        film.style.opacity = op; ui.style.opacity = op; rail.style.opacity = op; counter.style.opacity = op;
      }

      const lit = {};
      scenes.forEach((sc) => {
        const on = f >= sc.from && f <= sc.to;
        sc.el.classList.toggle('on', on);
        if (on) lit[sc.def.grp] = true;
        if (on !== !!sc.wasOn) {
          sc.wasOn = on;
          if (on) window.dispatchEvent(new CustomEvent('film-scene', { detail: { id: sc.def.id } }));
        }
        if (on && sc.def.album && !sc.built) {       // the disks slide in the first time
          sc.built = true;
          recs.forEach((r, n) => setTimeout(() => r.classList.add('in'), n * 120));
        }
        /* each card appears when the video reaches its cue. One the visitor has already scrolled
           well past is simply shown finished, so building never falls behind the video. */
        sc.cards.forEach((card, n) => {
          if (sc.cued[n] || !on || f < sc.cuePx[n]) return;
          sc.cued[n] = true;
          const late = f - sc.cuePx[n] > window.innerHeight * 0.45;
          if (sc.def.css || !window.BUILD) {
            card.classList.add('in');
            if (late) card.classList.add('now');
            else window.dispatchEvent(new CustomEvent('film-card'));
          } else if (late) window.BUILD.instant(card);
          else window.BUILD.go(card);
        });
        /* a swarm scene that has left the screen finishes whatever is still being built, at once */
        if (on) sc.wasBuilt = true;
        else if (sc.wasBuilt && !sc.def.css && window.BUILD) { sc.wasBuilt = false; sc.cards.forEach((card) => window.BUILD.finish(card)); }
      });
      if (albumScene.el.classList.contains('on')) {
        const sA = segs[ALBUM_SEG];
        const t = clamp((f - (sA.start + 0.05 * sA.lenPx)) / (0.85 * sA.lenPx), 0, 1);
        placeAlbum(t * (P.length - 1));
      }
      const litKey = Object.keys(lit).join(',');
      if (litKey !== lastLit) {
        lastLit = litKey;
        rail.querySelectorAll('[data-grp]').forEach((dot) => dot.classList.toggle('on', !!lit[dot.dataset.grp]));
      }
      /* the floor is light: the menu text switches to dark while it shows */
      const light = FS.name === 'floor' || (FS.name === 'catch' && FS.q > 0.6);
      if (light !== lastLight) { lastLight = light; document.body.classList.toggle('film-light', light); }

      /* the frame counter and the hint */
      let ri = 0, bd = Infinity;
      rests.forEach((r, n) => { const d = Math.abs(r - f); if (d < bd) { bd = d; ri = n; } });
      if (ri !== countIdx) { countIdx = ri; cNum.textContent = String(ri + 1).padStart(2, '0'); FS.rest = ri; }
      const showCount = f >= rests[0] - 10;
      if (showCount !== lastShowCount) { lastShowCount = showCount; counter.style.visibility = showCount ? 'visible' : 'hidden'; }
      const resting = bd < 10 && performance.now() - lastAct > 900 && !snapping;
      if (resting !== lastResting) { lastResting = resting; counter.classList.toggle('hint-on', resting); }
      const hint = ri === rests.length - 1 ? (k < 1 ? 'swipe on' : 'keep scrolling') : (k < 1 ? 'swipe up' : 'scroll');
      if (hint !== lastHint) { lastHint = hint; cHint.textContent = hint; }
    }
    if (!inside && lastLight !== false) { lastLight = false; document.body.classList.remove('film-light'); }
    requestAnimationFrame(frame);
  }

  /* lets the console check the frames: MIND.filmRests() */
  MIND.filmMovie = () => ({ intro, phase, phases: MOVIE.length });
  MIND.filmRests = () => ({ filmStart, rests: rests.slice(), total, segs: segs.map((q) => ({ name: q.name, start: Math.round(q.start), len: Math.round(q.lenPx) })) });

  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', () => { setTimeout(measure, 450); warm(); });
  requestAnimationFrame(frame);
})();
