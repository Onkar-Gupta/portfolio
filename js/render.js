/* ============================================================
   RENDER.JS: builds the entire DOM from CONTENT (content.js)
   You should not need to edit this file to change your info.
   ============================================================ */

(function () {
  const app = document.getElementById('app');

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- nav ---------- */
  document.getElementById('logo').innerHTML =
    `${esc(CONTENT.meta.shortName)}<b>@portfolio:~$</b>`;
  document.getElementById('nav-links').innerHTML = CONTENT.nav
    .map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('');

  /* ---------- bullet points under a card (shared) ---------- */
  function ptsHTML(points) {
    return points && points.length
      ? `<ul class="pts">${points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`
      : '';
  }

  /* ---------- easter egg line (shared) ---------- */
  function eggHTML(c) {
    return c.egg ? `<span class="ch-egg reveal" data-delay="4">${esc(c.egg)}</span>` : '';
  }

  /* ---------- chapter header (shared) ---------- */
  function chapterHead(c) {
    return `
      <header class="ch-head">
        <span class="ch-num reveal">${esc(c.num)}</span>
        <div>
          <span class="ch-tag reveal">epoch ${esc(c.num)} · ${esc(c.tag)}</span>
          <h2 class="ch-title"><span class="scramble" data-text="${esc(c.title)}">${esc(c.title)}</span></h2>
          <p class="ch-narrative reveal" data-delay="1">${esc(c.narrative)}</p>
        </div>
      </header>`;
  }

  /* ---------- hero: the 3D mind ---------- */
  function buildHero(h) {
    const s = el('section', 'chapter hero');
    s.id = 'hero';
    s.innerHTML = `
      <p class="hero-kicker">${esc(h.kicker)}</p>
      <h1 class="hero-title"><span class="scramble" data-text="${esc(h.title)}">${esc(h.title)}</span></h1>
      <p class="hero-sub">${esc(h.subtitle)}</p>
      <div class="scroll-hint">${esc(h.scrollHint)}</div>`;
    return s;
  }

  /* ---------- boot: the computer (populated by terminal.js) ---------- */
  function buildBoot() {
    /* the old CSS computer and terminal are gone: the film's first clip is the computer now.
       #boot stays as an empty anchor that film.js places its runway after. */
    const s = el('section');
    s.id = 'boot';
    s.setAttribute('aria-hidden', 'true');
    return s;
    // eslint-disable-next-line no-unreachable
    s.innerHTML = `
      <div class="rig" id="rig">
        <div class="monitor" id="monitor">
          <div class="monitor-screen">
            <div class="term-bar"><i></i><i></i><i></i><span>mind_os | tty1</span></div>
            <div class="term-body" id="term-body"></div>
          </div>
          <div class="monitor-stand"></div>
          <div class="monitor-base"></div>
        </div>
        <div class="desk-line"></div>
      </div>
      <p class="boot-caption" id="boot-caption"></p>`;
    return s;
  }

  /* ---------- window frame (shared): a title bar, rows, a status bar ---------- */
  function winBar(tab, path) {
    return `<div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span>` +
           `<span class="win-tab">${esc(tab)}</span><span class="win-path">${esc(path)}</span></div>`;
  }

  /* ---------- about: a text editor (about.md) beside a table (stats.csv) ---------- */
  function buildAbout(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    const rows = [
      `<div class="ed-row h first"><i>#</i>Onkar Gupta</div>`,
      `<div class="ed-row blank"></div>`,
      ...c.paragraphs.map(p => `<div class="ed-row">${esc(p)}</div>`),
      `<div class="ed-row blank"></div>`,
      `<div class="ed-row h"><i>##</i>focus</div>`,
      ...c.points.map((p, i) => `<div class="ed-row li${i === c.points.length - 1 ? ' last' : ''}">${esc(p)}${i === c.points.length - 1 ? '<i class="caret"></i>' : ''}</div>`),
    ];
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body about-split">
        <div class="win about-win">
          ${winBar('about.md', '~/data/')}
          ${rows.join('')}
          <div class="win-status"><span><b>md</b> markdown</span><span>utf-8</span><span>${rows.length} lines</span></div>
        </div>
        <div class="win csv-win">
          ${winBar('stats.csv', '~/data/')}
          <div class="csv-row head"><span>value</span><span>label</span></div>
          ${c.stats.map(st => `<div class="csv-row"><b>${esc(st.value)}</b><span>${esc(st.label)}</span></div>`).join('')}
          <div class="win-status"><span><b>csv</b> table</span><span>${c.stats.length} rows</span></div>
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- skills ---------- */
  function buildSkills(c) {
    const s = el('section', 'chapter');
    s.id = c.id;
    const marquee = c.marquee.map(m => `${esc(m)} <em>✦</em>`).join(' ');
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="skill-groups">
          ${c.groups.map((g, i) => `
            <div class="skill-group reveal" data-delay="${Math.min(i + 1, 4)}">
              <h3>${esc(g.title)}</h3>
              <div class="chips">${g.items.map(it => `<span class="chip">${esc(it)}</span>`).join('')}</div>
            </div>`).join('')}
        </div>
        <div class="marquee reveal">
          <div class="marquee-track">${marquee} ${marquee}</div>
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- journey ---------- */
  function buildJourney(c) {
    const s = el('section', 'chapter');
    s.id = c.id;
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="timeline">
          ${c.epochs.map((e, i) => `
            <div class="t-item reveal" data-delay="${Math.min(i + 1, 4)}">
              <div class="t-meta">
                <span class="t-epoch">${esc(e.epoch)}</span>
                <span class="t-loss">${esc(e.loss)}</span>
                <span class="t-date">${esc(e.date)}</span>
              </div>
              <h3>${esc(e.heading)}</h3>
              <h4>${esc(e.org)}</h4>
              <p>${esc(e.desc)}</p>
              ${ptsHTML(e.points)}
            </div>`).join('')}
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- projects ---------- */
  function buildProjects(c) {
    const s = el('section', 'chapter');
    s.id = c.id;
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body proj-grid">
        ${c.items.map((p, i) => `
          <div class="proj-card reveal" data-delay="${Math.min(i + 1, 4)}">
            <span class="proj-num">output_${esc(p.num)}</span>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.desc)}</p>
            ${ptsHTML(p.points)}
            <div class="proj-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
            <div class="proj-links">
              ${p.links.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}
            </div>
          </div>`).join('')}
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- achievements ---------- */
  function buildAchievements(c) {
    const s = el('section', 'chapter');
    s.id = c.id;
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body ach-grid">
        ${c.items.map((a, i) => `
          <div class="ach-card reveal" data-delay="${Math.min(i + 1, 4)}">
            <span class="ach-icon">${esc(a.icon)}</span>
            <h3>${esc(a.title)}</h3>
            <p>${esc(a.desc)}</p>
          </div>`).join('')}
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- contact ---------- */
  function buildContact(c) {
    const s = el('section', 'chapter');
    s.id = c.id;
    s.innerHTML = `
      <header class="ch-head">
        <span class="ch-num">${esc(c.num)}</span>
        <div>
          <span class="ch-tag reveal">epoch ${esc(c.num)} · ${esc(c.tag)}</span>
          <h2 class="ch-title"><span class="scramble" data-text="${esc(c.title)}">${esc(c.title)}</span></h2>
          <p class="ch-narrative reveal" data-delay="1">${esc(c.narrative)}</p>
        </div>
      </header>
      <div class="contact-cta reveal" data-delay="2">
        <a href="mailto:${CONTENT.meta.email}" class="btn btn-solid magnetic">${esc(c.ctaLabel)}</a>
      </div>
      <div class="socials reveal" data-delay="3">
        ${c.socials.map(so => `<a class="magnetic" href="${so.href}">${esc(so.label)}</a>`).join('')}
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- assemble ---------- */
  app.appendChild(buildHero(CONTENT.hero));
  app.appendChild(buildBoot());
  app.appendChild(buildAbout(CONTENT.about));
  app.appendChild(buildSkills(CONTENT.skills));
  app.appendChild(buildJourney(CONTENT.journey));
  app.appendChild(buildProjects(CONTENT.projects));
  app.appendChild(buildAchievements(CONTENT.achievements));
  app.appendChild(buildContact(CONTENT.contact));

  /* zigzag: content chapters alternate left / right (path connects them) */
  ['about', 'skills', 'journey', 'projects', 'achievements'].forEach((id, i) => {
    document.getElementById(id).classList.add(i % 2 === 0 ? 'ch-left' : 'ch-right');
  });

  document.getElementById('footer').innerHTML =
    CONTENT.footer.split('·').map((part, i) =>
      i === 0 ? `<b>${esc(part.trim())}</b>` : esc(part.trim())
    ).join(' · ');

  document.title = `${CONTENT.meta.name}, ${CONTENT.meta.role}`;
})();
