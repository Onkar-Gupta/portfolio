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
      <p class="hero-tag">${esc(h.tagline)}</p>
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
      `<div class="ed-row q">${esc(c.hook)}</div>`,
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

  /* ---------- skills: model.summary() ---------- */
  function buildSkills(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    const marquee = c.marquee.map(m => `${esc(m)} <em>✦</em>`).join(' ');
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="win sum-win">
          ${winBar('model.summary()', '~/architecture/')}
          <div class="sum-row head"><span>layer</span><span>skills</span></div>
          ${c.groups.map(g => {
            const [layer, what] = g.title.split(' · ');
            return `<div class="sum-row"><span class="sum-name"><b>${esc(layer)}</b><i>${esc(what || '')}</i></span>` +
                   `<span class="chips">${g.items.map(it => `<span class="chip">${esc(it)}</span>`).join('')}</span></div>`;
          }).join('')}
          <div class="win-ticker"><div class="marquee-track">${marquee} ${marquee}</div></div>
          <div class="win-status"><span><b>layers</b> ${c.groups.length}</span><span>${c.groups.reduce((n, g) => n + g.items.length, 0)} skills</span></div>
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- journey: git log --graph ---------- */
  function buildJourney(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="win log-win">
          ${winBar('git log --graph', '~/training/')}
          ${c.epochs.map((e, i) => `
            <div class="log-row${i === 0 ? ' first' : ''}${i === c.epochs.length - 1 ? ' last' : ''}">
              <span class="log-rail"><i></i></span>
              <div class="log-main">
                <div class="log-line"><b>${esc(e.epoch)}</b>${i === 0 ? ' <em class="log-head">HEAD</em>' : ''}<span class="log-tag">${esc(e.loss)}</span><span class="log-date">${esc(e.date)}</span></div>
                <h3>${esc(e.heading)}</h3>
                <h4>${esc(e.org)}</h4>
                <p>${esc(e.desc)}</p>
                ${ptsHTML(e.points)}
              </div>
            </div>`).join('')}
          <div class="win-status"><span><b>git</b> log</span><span>${c.epochs.length} commits</span><span>loss goes down</span></div>
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- projects: a file explorer with a preview pane ---------- */
  function buildProjects(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    const short = (t) => t.split(':')[0].replace(/\s*\(.*\)/, '');
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="win xp-win">
          ${winBar('outputs/', '~/outputs/')}
          <div class="xp">
            <div class="xp-list" role="tablist" aria-label="projects">
              ${c.items.map((p, i) => `
                <button class="xp-file${i === 0 ? ' on' : ''}" type="button" role="tab" data-i="${i}" aria-selected="${i === 0}">
                  <span class="xp-name">output_${esc(p.num)}</span><span class="xp-title">${esc(short(p.title))}</span>
                </button>`).join('')}
            </div>
            <div class="xp-view">
              ${c.items.map((p, i) => `
                <div class="xp-pane" data-i="${i}"${i === 0 ? '' : ' hidden'}>
                  <span class="xp-key">${esc(p.key)}</span>
                  <h3>${esc(p.title)}</h3>
                  <p>${esc(p.desc)}</p>
                  ${ptsHTML(p.points)}
                  <div class="proj-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
                  <div class="proj-links">${p.links.map(l => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="win-status"><span><b>${c.items.length}</b> files</span><span class="xp-sel">output_${esc(c.items[0].num)} selected</span></div>
        </div>
      </div>` + eggHTML(c);
    s.querySelectorAll('.xp-file').forEach((b) => b.addEventListener('click', () => {
      const i = b.dataset.i;
      s.querySelectorAll('.xp-file').forEach((f) => { const on = f === b; f.classList.toggle('on', on); f.setAttribute('aria-selected', on); });
      s.querySelectorAll('.xp-pane').forEach((pn) => { pn.hidden = pn.dataset.i !== i; });
      s.querySelector('.xp-sel').textContent = `output_${c.items[i].num} selected`;
    }));
    return s;
  }

  /* ---------- achievements: a test report ---------- */
  function buildAchievements(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    s.innerHTML = chapterHead(c) + `
      <div class="ch-body">
        <div class="win test-win">
          ${winBar('pytest evaluation/', '~/evaluation/')}
          <div class="t-head">collected ${c.items.length} items</div>
          ${c.items.map(a => `
            <div class="t-row">
              <span class="t-name">${esc(a.title)}</span><span class="t-res">PASSED</span>
              <p>${esc(a.desc)}</p>
            </div>`).join('')}
          <div class="win-status"><span><b>${c.items.length} passed</b></span><span>0 failed</span></div>
        </div>
      </div>` + eggHTML(c);
    return s;
  }

  /* ---------- contact: a terminal ---------- */
  function buildContact(c) {
    const s = el('section', 'chapter win-chapter');
    s.id = c.id;
    s.innerHTML = `
      <header class="ch-head">
        <span class="ch-num reveal">${esc(c.num)}</span>
        <div>
          <span class="ch-tag reveal">epoch ${esc(c.num)} · ${esc(c.tag)}</span>
          <h2 class="ch-title"><span class="scramble" data-text="${esc(c.title)}">${esc(c.title)}</span></h2>
          <p class="ch-narrative reveal" data-delay="1">${esc(c.narrative)}</p>
        </div>
      </header>
      <div class="ch-body">
        <div class="win sh-win">
          ${winBar('deploy.sh', '~/deploy/')}
          <div class="sh-row first"><span class="sh-p">#</span>pick a way to reach me</div>
          <div class="sh-buttons">
            <a class="sh-btn solid" href="mailto:${CONTENT.meta.email}">${esc(c.ctaLabel)}</a>
            ${c.socials.map(so => `<a class="sh-btn" href="${so.href}"${so.href.startsWith('mailto') ? '' : ' target="_blank" rel="noopener"'}>${esc(so.label)}</a>`).join('')}
          </div>
          <div class="win-status"><span><b>exit</b> 0</span><span>${esc(CONTENT.meta.email)}</span></div>
        </div>
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
