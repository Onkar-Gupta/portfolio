/* ============================================================
   SOUND.JS: every sound is synthesised in the browser (Web Audio).
   No sound files, no libraries, no licences. It starts only after
   the visitor presses "Sound on" in the loader (browsers need a
   click before they allow audio), and a small button mutes it.
   Everything is quiet: one master volume and a compressor.

   Layers that follow the scroll:
     hum        a low computer hum, always under the page
     riser      a rising noise as the brain dives
     typing     a key tick for every 26 px scrolled while the code writes
     wind       the free fall; louder the faster you scroll
     pad        a soft chord under the orbit
     drive      a floppy drive whirr while the disks scroll, with seek ticks
     melody     a slow tune for the sections below the film (see buildMelody)
   One-shots:
     glitch burst, eject alarm and glass shatter, catch chime,
     scene chimes, cursor sounds as cards are built, disk insert click,
     shutter, drive spin-up when a disk opens, the closing chord.
   Reads MIND.film (set by film.js: name of the current beat, q, f) and listens for the events
   'site-enter', 'glitch', 'build', 'film-scene', 'film-disk', 'film-open'.
   ============================================================ */

(function () {
  'use strict';

  const MIND = window.MIND;
  if (!MIND) return;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);

  let ctx = null, master = null, noiseBuf = null;
  let enabled = false, btn = null;
  const L = {};                                    // continuous layers (AudioParams)
  const fired = { eject: false, catch: false };

  /* ---------- engine ---------- */
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC({ latencyHint: 'playback' });   // a bigger buffer: phones crackle and stutter with the default small one
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 24; comp.ratio.value = 6;
    master.connect(comp); comp.connect(ctx.destination);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    buildLayers();
    buildMelody();
    return true;
  }

  const loopNoise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(); return s; };
  const filt = (type, f, q) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 1; return b; };
  const gain0 = () => { const g = ctx.createGain(); g.gain.value = 0; return g; };

  function buildLayers() {
    /* hum: two detuned saws and a sine, low-passed */
    const humLp = filt('lowpass', 150);
    [[55, 'sawtooth', 0.5], [55.6, 'sawtooth', 0.5], [110, 'sine', 0.25]].forEach(([f, t, v]) => {
      const o = ctx.createOscillator(); o.type = t; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = v;
      o.connect(g); g.connect(humLp); o.start();
    });
    const hum = gain0(); humLp.connect(hum); hum.connect(master);
    L.hum = hum.gain;

    /* riser and wind: looped noise through a band-pass */
    [['riser', 300, 2], ['wind', 600, 1.2]].forEach(([name, f, q]) => {
      const bp = filt('bandpass', f, q), g = gain0();
      loopNoise().connect(bp); bp.connect(g); g.connect(master);
      L[name] = g.gain; L[name + 'F'] = bp.frequency;
    });

    /* pad: A minor 7, slightly detuned, soft */
    const padLp = filt('lowpass', 900), pad = gain0();
    [220, 261.63, 329.63, 392].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f * (1 + (i - 1.5) * 0.0007);
      const g = ctx.createGain(); g.gain.value = 0.25;
      o.connect(g); g.connect(padLp); o.start();
    });
    padLp.connect(pad); pad.connect(master);
    L.pad = pad.gain;

    /* floppy drive whirr: noise, band-passed, with a 34 Hz tremolo */
    const am = ctx.createGain(); am.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 34;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG); lfoG.connect(am.gain); lfo.start();
    const whirr = gain0();
    loopNoise().connect(filt('bandpass', 1100, 4)).connect(am);
    am.connect(whirr); whirr.connect(master);
    L.whirr = whirr.gain;
  }

  /* the layers are updated every frame, and each call queues an automation event: hundreds a second on a phone.
     A change under half a percent is not audible, so it is skipped. */
  const lastSet = new WeakMap();
  const set = (p, v, tc) => {
    const o = lastSet.get(p);
    if (o !== undefined && Math.abs(v - o) <= 0.005 * Math.abs(o) + 1e-5) return;
    lastSet.set(p, v);
    p.setTargetAtTime(v, ctx.currentTime, tc || 0.12);
  };

  /* ---------- the melody: the sections below the film ----------
     A four-bar tune in A minor, chords Am, F, C, G, at 84 beats a minute: a plucked arpeggio, a soft bass
     note and a singing melody on top, through a short echo. Notes are scheduled a little ahead of time with
     the audio clock (a timer every 120 ms, a handful of notes a bar), so it costs the page almost nothing.
     It fades in when you leave the film and out if you scroll back up into it. */
  const BPM = 84, BEAT = 60 / BPM, BARS = 4, LOOK = 0.45;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]];   // Am F C G, low voicings
  const BASS = [45, 41, 48, 43];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 1];                       // eight notes a bar
  const TUNE = [                                               // [midi note, start beat, length in beats]
    [76, 0, 1], [74, 1, 0.5], [72, 1.5, 0.5], [69, 2, 2],
    [72, 4, 1], [69, 5, 0.5], [72, 5.5, 0.5], [77, 6, 2],
    [76, 8, 1.5], [79, 9.5, 0.5], [76, 10, 1], [72, 11, 1],
    [74, 12, 1], [71, 13, 1], [67, 14, 1], [71, 15, 1],
  ];
  let melBus = null, melTimer = 0, melNext = 0, melOn = false;

  function buildMelody() {
    melBus = ctx.createGain(); melBus.gain.value = 0;
    melBus.connect(master);
    const dly = ctx.createDelay(1); dly.delayTime.value = BEAT * 0.75;     // a dotted-eighth echo
    const fb = ctx.createGain(); fb.gain.value = 0.34;
    const wet = ctx.createGain(); wet.gain.value = 0.28;
    const lp = filt('lowpass', 2400);
    melBus.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(wet); wet.connect(master);
  }
  function note(type, midi, t, len, vol, atk, cut) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = filt('lowpass', cut);
    o.type = type; o.frequency.value = mtof(midi);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(f); f.connect(g); g.connect(melBus);
    o.start(t); o.stop(t + len + 0.05);
  }
  function scheduleBar(bar, t0) {
    const c = CHORDS[bar];
    note('sine', BASS[bar], t0, BEAT * 3.8, 0.05, 0.03, 400);                        // the bass, one long note
    ARP.forEach((k, i) => note('triangle', c[k], t0 + i * BEAT / 2, BEAT * 1.1, 0.03, 0.008, 1800));   // the pluck
    TUNE.forEach(([m, b, d]) => {
      if (b >= bar * 4 && b < bar * 4 + 4) {                                         // the singing line
        const t = t0 + (b - bar * 4) * BEAT;
        note('sine', m, t, d * BEAT * 1.05 + 0.25, 0.05, 0.025, 3000);
        note('triangle', m + 12, t, d * BEAT * 0.8 + 0.1, 0.008, 0.02, 3000);        // a soft octave above for shine
      }
    });
  }
  let melBar = 0;
  function melodyTick() {
    if (!melOn || !ctx || ctx.state !== 'running') return;
    if (melNext < ctx.currentTime) { melNext = ctx.currentTime + 0.1; melBar = 0; }   // (re)start cleanly
    while (melNext < ctx.currentTime + LOOK) {
      scheduleBar(melBar % BARS, melNext);
      melNext += BEAT * 4; melBar++;
    }
  }
  function melodyTo(on) {
    if (on === melOn) return;
    melOn = on;
    if (!melBus) return;
    set(melBus.gain, on ? 1 : 0, on ? 1.2 : 0.5);
    if (on) { melNext = 0; melBar = 0; if (!melTimer) melTimer = setInterval(melodyTick, 120); melodyTick(); }
    else setTimeout(() => { if (!melOn && melTimer) { clearInterval(melTimer); melTimer = 0; } }, 3000);
  }

  /* ---------- one-shot building blocks ---------- */
  function env(g, t, attack, peak, decay) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.006, vol, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(dur, vol, type, freq, q, delay) {
    const t = ctx.currentTime + (delay || 0);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = filt(type, freq, q), g = ctx.createGain();
    env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, rnd(0, 1.5)); s.stop(t + dur + 0.05);
  }

  /* ---------- the sounds ---------- */
  const keyTick = () => { burst(0.03, 0.1, 'highpass', 3200, 1); tone('square', 1700, 1100, 0.02, 0.025); };
  const seekTick = () => { burst(0.022, 0.09, 'bandpass', rnd(1300, 2000), 4); };
  const shutter = () => { burst(0.07, 0.11, 'highpass', 5200, 1); tone('triangle', 2500, 1700, 0.05, 0.035); };
  const insertClick = () => { tone('square', 150, 55, 0.09, 0.1); burst(0.06, 0.18, 'lowpass', 900, 1); tone('sawtooth', 110, 320, 0.3, 0.035, 0.06); };
  const spinUp = () => { tone('sawtooth', 90, 280, 0.5, 0.05); burst(0.1, 0.14, 'lowpass', 800, 1); tone('square', 1320, null, 0.06, 0.03, 0.42); };

  function glitchSound() {
    for (let i = 0; i < 9; i++) {
      burst(rnd(0.03, 0.08), 0.16, 'bandpass', rnd(200, 3200), 2, i * 0.075);
      tone('sawtooth', rnd(90, 500), null, 0.05, 0.06, i * 0.075);
    }
    tone('sine', 60, 30, 0.7, 0.12);
  }
  function ejectSound() {
    tone('square', 880, null, 0.12, 0.05, 0);
    tone('square', 880, null, 0.12, 0.05, 0.2);
    burst(0.4, 0.12, 'bandpass', 900, 1, 0.45);                       // the crack
    for (let i = 0; i < 16; i++) burst(rnd(0.06, 0.16), 0.08, 'highpass', rnd(3500, 7000), 1, 0.5 + i * 0.03);   // shards
  }
  function catchSound() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone('sine', f, null, 0.7, 0.05, i * 0.08));
    tone('sine', 220, 110, 0.5, 0.06);
  }
  function chord(freqs, vol, dur) { freqs.forEach((f, i) => tone('triangle', f, null, dur, vol, i * 0.06)); }
  const SCENE_NOTES = { about: 523.25, skills: 587.33, journey: 659.25, certs: 739.99, highlights: 783.99 };

  /* cursor and card sounds: quiet, and rate limited so a busy build never turns into noise */
  const lastBuild = {};
  function buildSound(stage) {
    const t = performance.now();
    if (t - (lastBuild[stage] || 0) < 90) return;
    lastBuild[stage] = t;
    if (stage === 'fly') burst(0.16, 0.03, 'bandpass', rnd(1200, 1900), 2);
    else if (stage === 'trace') tone('sine', rnd(900, 1200), null, 0.05, 0.03);
    else if (stage === 'fill') burst(0.22, 0.035, 'lowpass', 1800, 1);
    else if (stage === 'content') tone('triangle', 520, null, 0.06, 0.03);
    else if (stage === 'done') { tone('sine', 784, null, 0.14, 0.05); tone('sine', 1175, null, 0.2, 0.04, 0.08); }
  }

  /* ---------- on, off and the button ---------- */
  function setEnabled(v) {
    enabled = v;
    if (btn) btn.setAttribute('aria-pressed', v ? 'true' : 'false');
    if (!ctx) return;
    if (!v) melodyTo(false);
    if (v) ctx.resume();
    set(master.gain, v ? 0.9 : 0, 0.06);
  }

  function makeButton() {
    btn = document.createElement('button');
    btn.id = 'sound-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Sound on or off');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML =
      '<svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>' +
      '<svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    btn.addEventListener('click', () => {
      if (!init()) return;                     // the click is the gesture the browser needs
      setEnabled(!enabled);
      if (enabled) tone('sine', 440, 660, 0.18, 0.05);
    });
    document.body.appendChild(btn);
  }

  window.addEventListener('site-enter', (e) => {
    makeButton();
    if (e.detail && e.detail.sound && init()) {
      setEnabled(true);
      tone('sine', 220, 440, 0.45, 0.05);       // power on
    }
  });
  /* phones (iOS above all) keep the audio context suspended until a tap reaches it, and suspend it again after
     a call or a tab switch. Every tap while sound is on therefore resumes it and plays one silent sample,
     which is the trick that unlocks Web Audio on iOS. Cheap: it does nothing once the context is running. */
  function unlock() {
    if (!ctx || !enabled || ctx.state === 'running') return;
    ctx.resume();
    const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
  }
  ['touchend', 'pointerdown', 'click'].forEach((n) => document.addEventListener(n, unlock, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });

  /* ---------- events from the rest of the site ---------- */
  const on = (name, fn) => window.addEventListener(name, (e) => { if (enabled && ctx && ctx.state === 'running') fn(e); });
  on('glitch', glitchSound);
  on('build', (e) => buildSound(e.detail.stage));
  on('film-scene', (e) => {
    const id = e.detail.id;
    if (SCENE_NOTES[id]) { tone('sine', SCENE_NOTES[id], null, 0.5, 0.05); tone('sine', SCENE_NOTES[id] * 1.5, null, 0.5, 0.03, 0.09); }
    else if (id === 'album') { shutter(); tone('sine', 880, null, 0.3, 0.04, 0.05); }
    else if (id === 'contact') chord([261.63, 329.63, 392, 523.25], 0.05, 1.4);
  });
  on('film-disk', () => { insertClick(); setTimeout(shutter, 90); });
  /* an intro box rising in: a soft pop and a small rising tick, at most one every 90 ms */
  let lastCard = 0;
  on('film-card', () => {
    const t = performance.now();
    if (t - lastCard < 90) return;
    lastCard = t;
    tone('sine', 420, 760, 0.12, 0.05);
    burst(0.1, 0.03, 'bandpass', 2200, 2);
  });
  on('film-open', spinUp);

  /* small interface sounds: a soft tick when the pointer reaches a link, button or window, and a blip on a
     click. One short oscillator each, at most one every 90 ms, so they cost nothing. */
  let lastUi = 0;
  const UI = 'a, button, .win, .chip, .rec, .xp-file, .sh-btn';
  document.addEventListener('mouseover', (e) => {
    if (!enabled || !ctx || ctx.state !== 'running') return;
    const t = e.target.closest && e.target.closest(UI);
    if (!t || t === e.relatedTarget || (e.relatedTarget && t.contains(e.relatedTarget))) return;
    const now = performance.now();
    if (now - lastUi < 90) return;
    lastUi = now;
    tone('sine', t.matches('.win') ? 520 : 1250, null, 0.04, 0.018);
  });
  document.addEventListener('click', (e) => {
    if (!enabled || !ctx || ctx.state !== 'running' || !e.target.closest || !e.target.closest('a, button, .rec')) return;
    tone('triangle', 660, 990, 0.07, 0.03);
  });

  /* ---------- the scroll-driven layers ---------- */
  let lastCur = MIND.current, lastT = performance.now(), speed = 0, keyAcc = 0, seekAcc = 0;

  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.max(1, t - lastT) / 1000;
    lastT = t;
    const cur = MIND.current, dist = Math.abs(cur - lastCur);
    speed += (dist / dt - speed) * 0.15;
    lastCur = cur;
    if (!ctx || !enabled || ctx.state !== 'running') return;

    const F = MIND.film || { inside: false };
    const dive = clamp(cur / (MIND.vh * 1.05), 0, 1);
    const inFilm = !!F.inside;
    melodyTo(!!F.past && enabled);                    // the tune plays below the film only

    set(L.hum, F.past ? 0 : inFilm ? 0.022 : 0.03 + dive * 0.02, F.past ? 0.8 : 0.12);   // below the film the tune plays alone: no hum
    set(L.riser, !inFilm && !F.past && dive > 0.05 ? dive * dive * 0.09 : 0, 0.1);   // the brain-dive noise: not below the film
    set(L.riserF, 250 + dive * 2600, 0.1);
    set(L.wind, inFilm && F.name === 'fall' ? 0.05 + clamp(speed / 2500, 0, 1) * 0.09 : 0);
    set(L.windF, 500 + clamp(speed, 0, 3000) * 0.35);
    set(L.pad, inFilm && F.name === 'orbit' ? 0.045 : 0, 0.6);

    const disks = inFilm && ((F.name === 'catch' && F.q > 0.72) || (F.name === 'floor' && F.q < 0.95));
    set(L.whirr, disks ? 0.016 + clamp(speed / 1800, 0, 1) * 0.03 : 0, 0.1);

    /* the code writes in clip A (the first beat): one key tick per 26 px of scroll */
    if (inFilm && F.name === 'a1' && F.q > 0.25 && F.q < 0.85) {
      keyAcc += dist;
      let n = 0;
      while (keyAcc > 26 && n++ < 3) { keyAcc -= 26; keyTick(); }
      if (keyAcc > 80) keyAcc = 0;
    } else keyAcc = 0;

    /* the disk drive seeks while the disks scroll past */
    if (disks && dist > 0.5) {
      seekAcc += dist;
      let n = 0;
      while (seekAcc > 44 && n++ < 3) { seekAcc -= 44; seekTick(); }
      if (seekAcc > 120) seekAcc = 0;
    }

    /* one-shots tied to a position in the film; they re-arm when you scroll back above */
    /* the alarm and shatter play as the second beat reaches the shatter */
    if (inFilm && F.name === 'a2' && F.q > 0.15 && !fired.eject) { fired.eject = true; ejectSound(); }
    if (!inFilm || F.name === 'a1' || (F.name === 'a2' && F.q < 0.05)) fired.eject = false;
    if (inFilm && F.name === 'catch' && F.q > 0.38 && !fired.catch) { fired.catch = true; catchSound(); }
    if (!inFilm || ['a1', 'a2', 'fall', 'orbit'].includes(F.name) || (F.name === 'catch' && F.q < 0.3)) fired.catch = false;
  }
  requestAnimationFrame(loop);

  /* a hook for checking the engine from the console */
  window.SOUND = { state: () => (ctx ? ctx.state : 'none'), enabled: () => enabled, ctx: () => ctx, master: () => master };
})();
