{
  // Admin invitation / password links land here: forward them to the admin panel
  if (/(invite|recovery|confirmation|email_change)_token=/.test(location.hash)) location.replace('/admin/' + location.hash);
  const d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile menu
  const btn = d.querySelector('.menu-btn'), nav = d.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open); nav.classList.toggle('open', open);
    });
    nav.addEventListener('click', e => { if (e.target.tagName === 'A') { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); } });
  }

  // Mega menu: hover on desktop, click/keyboard everywhere, accordion on mobile
  const items = [...d.querySelectorAll('.mm-item')];
  const desk = matchMedia('(min-width: 981px) and (hover: hover)');
  const scrim = d.createElement('div'); scrim.className = 'mm-scrim'; d.body.appendChild(scrim);
  const setOpen = (it, on) => {
    it.classList.toggle('open', on); it.querySelector('.mm-btn').setAttribute('aria-expanded', on);
    scrim.classList.toggle('on', desk.matches && items.some(x => x.classList.contains('open')));
  };
  const closeAll = except => items.forEach(it => it !== except && setOpen(it, false));
  items.forEach(it => {
    let t;
    it.querySelector('.mm-btn').addEventListener('click', () => { const on = !it.classList.contains('open'); closeAll(it); setOpen(it, on); });
    it.addEventListener('mouseenter', () => { if (!desk.matches) return; clearTimeout(t); closeAll(it); setOpen(it, true); });
    it.addEventListener('mouseleave', () => { if (!desk.matches) return; t = setTimeout(() => setOpen(it, false), 160); });
    it.querySelectorAll('.mm-panel a').forEach(a => a.addEventListener('click', () => closeAll()));
  });
  scrim.addEventListener('click', () => closeAll());
  d.addEventListener('keydown', e => { if (e.key === 'Escape') { const o = items.find(i => i.classList.contains('open')); closeAll(); o && o.querySelector('.mm-btn').focus(); } });
  d.addEventListener('click', e => { if (desk.matches && !e.target.closest('.mm-item')) closeAll(); });

  // Reveal on scroll + pipeline bars grow
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 }) : null;
  const vh = innerHeight;
  d.querySelectorAll('.band:not(.hero):not(.page-head) .wrap > *, [data-pipe]').forEach(el => {
    if (!io) return el.classList.add('in');
    if (!el.matches('[data-pipe]')) { if (el.getBoundingClientRect().top < vh) return; el.classList.add('rv'); }
    io.observe(el);
  });

  // AI pharmacy counter: choose a symptom, print the prescription label
  d.querySelectorAll('[data-counter]').forEach(c => {
    c.addEventListener('click', e => {
      const b = e.target.closest('button[data-rx]'); if (!b) return;
      c.querySelectorAll('button[data-rx]').forEach(x => x.setAttribute('aria-pressed', x === b));
      c.querySelectorAll('.rx').forEach(l => {
        const on = l.dataset.label === b.dataset.rx;
        l.hidden = !on; l.classList.remove('show');
        if (on) { void l.offsetWidth; l.classList.add('show'); }
      });
      if (innerWidth < 820) c.querySelector('.printer').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Counter: filter symptoms by field
  d.querySelectorAll('[data-counter]').forEach(c => {
    const chips = [...c.querySelectorAll('[data-cf]')];
    c.setField = f => {
      chips.forEach(x => x.setAttribute('aria-pressed', x.dataset.cf === f));
      const btns = [...c.querySelectorAll('button[data-rx]')];
      btns.forEach(b => { b.hidden = f !== 'all' && b.dataset.field !== f; });
      const cur = btns.find(b => b.getAttribute('aria-pressed') === 'true');
      if (!cur || cur.hidden) { const first = btns.find(b => !b.hidden); if (first) first.click(); }
    };
    chips.forEach(x => x.addEventListener('click', () => c.setField(x.dataset.cf)));
  });

  // Project explorer: field (map) + search + technology + stage, applied to the cabinet, pipeline and counter
  const fmap = d.querySelector('[data-fmap]'), ex = d.querySelector('[data-explorer]');
  if (fmap || ex) {
    const st = { field: 'all', q: '', tech: new Set(), status: new Set() };
    const items = [...d.querySelectorAll('.box[data-field], .pipe-row[data-field]')];
    const count = ex && ex.querySelector('.ex-count'), empty = d.querySelector('.ex-empty');
    const apply = () => {
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach(el => {
        const tags = (el.dataset.tech || '').split(' ');
        const ok = (st.field === 'all' || el.dataset.field === st.field)
          && (!st.tech.size || [...st.tech].some(t => tags.includes(t)))
          && (!st.status.size || st.status.has(el.dataset.status))
          && words.every(w => (el.dataset.q || '').includes(w));
        el.hidden = !ok; if (ok && el.classList.contains('box')) shown++;
      });
      if (count) count.textContent = count.dataset.tplEn.replace('{n}', shown).replace('{t}', count.dataset.total);
      if (empty) empty.hidden = shown > 0;
      if (fmap) fmap.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === st.field));
      d.querySelectorAll('[data-fpanel]').forEach(pn => { pn.hidden = pn.dataset.fpanel !== st.field; });
      d.querySelectorAll('[data-counter]').forEach(c => c.setField && c.setField(st.field));
      try { history.replaceState(null, '', st.field === 'all' ? location.pathname : '#f-' + st.field); } catch (e) {}
    };
    if (fmap) fmap.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; st.field = b.getAttribute('aria-pressed') === 'true' && b.dataset.f !== 'all' ? 'all' : b.dataset.f; apply(); });
    if (ex) {
      let tq; ex.querySelector('#ex-q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { st.q = e.target.value; apply(); }, 120); });
      ex.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-clear')) { st.q = ''; st.tech.clear(); st.status.clear(); st.field = 'all'; ex.querySelector('#ex-q').value = ''; ex.querySelectorAll('[aria-pressed]').forEach(x => x.setAttribute('aria-pressed', 'false')); apply(); return; }
        const set = b.dataset.t ? st.tech : b.dataset.s ? st.status : null; if (!set) return;
        const v = b.dataset.t || b.dataset.s, on = !set.has(v);
        on ? set.add(v) : set.delete(v); b.setAttribute('aria-pressed', on); apply();
      });
    }
    const m = location.hash.match(/^#f-([a-z]+)$/);
    if (m && fmap && fmap.querySelector(`[data-f="${m[1]}"]`)) { st.field = m[1]; apply(); setTimeout(() => d.getElementById('fields').scrollIntoView({ block: 'start' }), 50); }
  }

  // Campaign builder: audience + goal → campaign prescription
  d.querySelectorAll('[data-cb]').forEach(cb => {
    const st = { a: cb.querySelector('[data-a]').dataset.a, g: cb.querySelector('[data-g]').dataset.g };
    const rx = cb.querySelector('.rx'), no = cb.querySelector('[data-cb-no]'), order = cb.querySelector('[data-cb-order]');
    const label = (k, v) => cb.querySelector(`[data-${k}="${v}"]`).textContent.replace(cb.querySelector(`[data-${k}="${v}"] small`)?.textContent || '', '').trim();
    const render = anim => {
      cb.querySelectorAll('[data-a]').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === st.a));
      cb.querySelectorAll('[data-g]').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === st.g));
      cb.querySelectorAll('[data-a-out]').forEach(x => { x.hidden = x.dataset.aOut !== st.a; });
      cb.querySelectorAll('[data-g-out]').forEach(x => { x.hidden = x.dataset.gOut !== st.g; });
      const ai = [...cb.querySelectorAll('[data-a]')].findIndex(b => b.dataset.a === st.a) + 1, gi = [...cb.querySelectorAll('[data-g]')].findIndex(b => b.dataset.g === st.g) + 1;
      no.textContent = `${ai}${gi}`;
      order.href = `contact.html?campaign=${encodeURIComponent(`${order.dataset.tpl}: ${label('a', st.a)} — ${label('g', st.g)}`)}`;
      if (anim) { rx.classList.remove('show'); void rx.offsetWidth; rx.classList.add('show'); }
    };
    cb.addEventListener('click', e => {
      const b = e.target.closest('button[data-a],button[data-g]'); if (!b) return;
      if (b.dataset.a) st.a = b.dataset.a; else st.g = b.dataset.g;
      render(true);
      if (innerWidth < 820 && b.dataset.g) cb.querySelector('.printer').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    render(false);
  });

  // Prescription pad: compose an email to Lujain
  const pad = d.querySelector('[data-rxpad]');
  if (pad) {
    const out = pad.querySelector('.sig-out'), msg = pad.querySelector('.form-msg'), to = pad.dataset.to;
    const val = n => (pad.elements[n] && pad.elements[n].value || '').trim();
    pad.elements.name.addEventListener('input', () => { out.textContent = val('name'); });
    const camp = new URLSearchParams(location.search).get('campaign');
    if (camp && !pad.elements.dx.value) pad.elements.dx.value = camp;
    const compose = () => {
      const lines = [pad.dataset.head, '', `℞ ${val('rx')}`, '', `• ${val('dx')}`];
      if (val('notes')) lines.push('', val('notes'));
      lines.push('', '—', val('name') + (val('org') ? ` · ${val('org')}` : ''));
      if (val('email')) lines.push(val('email'));
      return { subject: `${pad.dataset.subject}: ${val('rx')} — ${val('name')}`, body: lines.join('\n') };
    };
    const ok = () => { if (!val('name') || !val('dx')) { msg.className = 'form-msg err'; msg.textContent = pad.dataset.need; return false; } return true; };
    pad.addEventListener('submit', e => {
      e.preventDefault(); if (!ok()) return;
      const m = compose();
      location.href = `mailto:${to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
      msg.className = 'form-msg ok'; msg.textContent = `${pad.dataset.opened} ${to}`;
    });
    pad.querySelector('.pad-copy').addEventListener('click', async () => {
      if (!ok()) return; const m = compose();
      try { await navigator.clipboard.writeText(`${m.subject}\n\n${m.body}`); msg.className = 'form-msg ok'; msg.textContent = `${pad.dataset.copied} ${to}`; }
      catch (e) { msg.className = 'form-msg'; msg.textContent = `${m.subject}\n\n${m.body}`; }
    });
  }
  d.querySelectorAll('.copy-mail').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.mail); const t = b.textContent; b.textContent = b.dataset.done; setTimeout(() => { b.textContent = t; }, 1800); } catch (e) {}
  }));

  // Medicine boxes: turn over to read the leaflet
  d.querySelectorAll('.box').forEach(box => box.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    if (e.target.closest('.turn') || e.target.closest('.front')) {
      const f = box.classList.toggle('flip');
      box.querySelector('.front').inert = f; box.querySelector('.leaf').inert = !f;
    }
  }));
  d.querySelectorAll('.box .leaf').forEach(b => b.inert = true);

  // Research filters
  const filters = d.querySelector('.filters');
  if (filters) filters.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filters.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    let shown = 0;
    d.querySelectorAll('.acard').forEach(a => { const ok = b.dataset.f === 'all' || a.dataset.cat === b.dataset.f; a.hidden = !ok; shown += ok; });
    d.querySelector('.filter-empty').hidden = shown > 0;
  });

  if (filters && location.hash) { const b = filters.querySelector(`[data-s="${CSS.escape(location.hash.slice(1))}"]`); if (b) b.click(); }

  // Monograph table of contents highlight
  const toc = d.querySelectorAll('.toc a');
  if (toc.length && io) {
    const tio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) toc.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-30% 0px -60% 0px' });
    d.querySelectorAll('.mono-page section[id]').forEach(s => tio.observe(s));
  }

  // Contact form (Netlify Forms, sent without leaving the page)
  const form = d.querySelector('form[name=contact]');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = form.querySelector('.form-msg'), sb = form.querySelector('[type=submit]');
    sb.disabled = true; msg.className = 'form-msg'; msg.textContent = form.dataset.sending || 'Sending…';
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!r.ok) throw new Error(r.status);
      form.reset(); msg.classList.add('ok'); msg.textContent = form.dataset.ok;
    } catch (err) {
      msg.classList.add('err'); msg.textContent = form.dataset.err;
    } finally { sb.disabled = false; }
  });

  // Hero: molecules re-wiring into a neural network
  const cv = d.querySelector('.hero-canvas');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d'), N_RING = 6, N = N_RING * 6;
    let W = 0, H = 0, dpr = 1, nodes = [], netEdges = [], molEdges = [], running = true, t0 = performance.now();
    const rand = (a, b) => a + Math.random() * (b - a);
    function layout() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = Math.max(18, Math.min(W, H) * .045);
      const centers = [[.08, .2], [.3, .82], [.52, .12], [.62, .9], [.9, .25], [.96, .7]];
      const order = [...Array(N).keys()].sort(() => Math.random() - .5);
      nodes = []; molEdges = []; netEdges = [];
      for (let k = 0; k < N_RING; k++) for (let j = 0; j < 6; j++) {
        const a = j * Math.PI / 3 + Math.PI / 6, i = k * 6 + j, slot = order[i];
        const col = Math.floor(slot / 6), row = slot % 6;
        nodes.push({ mx: centers[k][0] * W + Math.cos(a) * r, my: centers[k][1] * H + Math.sin(a) * r,
          nx: W * (.06 + col * .176), ny: H * (.14 + row * .145) + (col % 2) * H * .05, ph: rand(0, 6.28), col });
        molEdges.push([i, k * 6 + (j + 1) % 6]);
      }
      const byCol = c => nodes.map((n, i) => n.col === c ? i : -1).filter(i => i >= 0);
      for (let c = 0; c < 5; c++) { const A = byCol(c), B = byCol(c + 1); A.forEach((a, x) => { netEdges.push([a, B[x % B.length]], [a, B[(x + 2) % B.length]]); }); }
    }
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    function draw(now) {
      const time = (now - t0) / 1000;
      const cyc = reduce ? 0 : (Math.sin(time * Math.PI / 9 - Math.PI / 2) + 1) / 2; // 18s loop
      const m = ease(cyc);
      ctx.clearRect(0, 0, W, H);
      const P = nodes.map(n => [n.mx + (n.nx - n.mx) * m + Math.sin(time * .6 + n.ph) * 3, n.my + (n.ny - n.my) * m + Math.cos(time * .5 + n.ph) * 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(232,220,203,${.32 * (1 - m)})`;
      ctx.beginPath(); molEdges.forEach(([a, b]) => { ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); }); ctx.stroke();
      ctx.strokeStyle = `rgba(95,208,196,${.2 * m})`;
      ctx.beginPath(); netEdges.forEach(([a, b]) => { ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); }); ctx.stroke();
      P.forEach(([x, y], i) => {
        ctx.fillStyle = i % 5 === 0 ? 'rgba(95,208,196,.85)' : 'rgba(232,220,203,.55)';
        ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 2.6 : 1.8, 0, 6.283); ctx.fill();
      });
      if (running && !reduce) requestAnimationFrame(draw);
    }
    layout(); requestAnimationFrame(draw);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (reduce) draw(performance.now()); }, 150); });
    if (io) new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was && !reduce) requestAnimationFrame(draw); }).observe(cv);
  }
}
