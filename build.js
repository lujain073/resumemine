// Zero-dependency static site generator — English (/) and Arabic (/ar/).
// Reads /content (edited from /admin), writes a fast, SEO-ready site to /dist.
// Run: node build.js
const fs = require('fs');
const path = require('path');
const UI = require('./ui.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const listJSON = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => readJSON(path.join(dir, f))) : [];
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]; return o; };

const EN = {
  site: readJSON(path.join(ROOT, 'content/site.json')),
  // Only projects switched to "Published" in the admin panel appear on the site
  projects: listJSON(path.join(ROOT, 'content/projects')).filter(p => p.published === true).sort((a, b) => (a.order || 99) - (b.order || 99)),
  articles: listJSON(path.join(ROOT, 'content/articles'))
};
const BASE = String(EN.site.siteUrl || '').replace(/\/$/, '');
const YEAR = new Date().getFullYear();
const LANGS = ['en', 'ar'];
const FIELDS = ['rd', 'manufacturing', 'quality', 'regulatory', 'supply', 'commercial', 'hospital', 'community', 'safety'];
const TECHS = ['llm', 'rag', 'ml', 'stats', 'opt', 'cv', 'rules', 'agent'];
const STATUSES = ['Conceptual', 'Working prototype', 'Working product'];
// The nine-field guide goes online only when "Show the 9 fields" is switched on in the admin panel
const SHOWF = !!(EN.site.publish && EN.site.publish.fields === true);

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paras = s => String(s || '').split(/\n{2,}/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
const list = (arr, cls = '') => (arr || []).length ? `<ul${cls ? ` class="${cls}"` : ''}>${arr.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
const pPage = p => `project-${p.slug}.html`;
const aPage = a => `article-${a.slug}.html`;
const catSlug = i => ['ai-research', 'healthcare-ai-trends', 'case-studies', 'innovation', 'new-applications'][i];
const urlOf = (lang, file) => `${BASE}${lang === 'ar' ? '/ar' : ''}/${file === 'index.html' ? '' : file.replace(/\.html$/, '')}`;

function md(src) { // tiny, safe markdown: ## headings, - lists, **bold**, [links](url), paragraphs
  const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  return String(src || '').split(/\n{2,}/).map(block => {
    const b = block.trim();
    if (b.startsWith('### ')) return `<h3>${inline(b.slice(4))}</h3>`;
    if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`;
    if (b.split('\n').every(l => /^[-*] /.test(l))) return `<ul>${b.split('\n').map(l => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

const MARK = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3.5 34.3 11.75v16.5L20 36.5 5.7 28.25v-16.5Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 12v16h10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34.3" cy="11.75" r="2.6" fill="var(--teal)"/></svg>`;

function buildLang(lang) {
  const T = UI[lang], rtl = lang === 'ar', R = rtl ? '../' : '';
  const OUT = rtl ? path.join(DIST, 'ar') : DIST;
  // Arabic content overrides English; anything not translated falls back to English.
  const site = rtl ? merge(EN.site, readJSON(path.join(ROOT, 'content/ar/site.json'))) : EN.site;
  const arP = rtl ? listJSON(path.join(ROOT, 'content/ar/projects')) : [];
  const projects = rtl ? EN.projects.map(p => ({ ...p, ...(arP.find(x => x.slug === p.slug) || {}) })) : EN.projects;
  const articles = (rtl ? listJSON(path.join(ROOT, 'content/ar/articles')) : EN.articles).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const otherName = rtl ? site.altName || EN.site.fullName : site.arabicName || '';
  const PH = T.phases, LV = T.levels;
  const faq = readJSON(path.join(ROOT, rtl ? 'content/ar/faq.json' : 'content/faq.json')).items;
  const cert = (site.certifications || []).find(c => c.featured);
  const HAS = projects.length > 0;
  const mk = readJSON(path.join(ROOT, rtl ? 'content/ar/marketing.json' : 'content/marketing.json'));
  const fmtDate = (d, o) => new Date(d).toLocaleDateString(rtl ? 'ar-JO-u-nu-latn' : 'en-GB', o);

  const phaseMeter = n => `<div class="meter" role="img" aria-label="${esc(T.phaseAria(n, PH[n - 1]))}">${PH.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
  const statusChip = p => `<span class="chip ${p.status === 'Conceptual' ? 'concept' : 'built'}">${esc(p.status === 'Conceptual' ? T.concept : (p.statusLabel || p.status))}</span>`;

  const fieldOf = p => T.fields[p.field] || ['', ''];
  const count = k => projects.filter(p => p.field === k).length;
  const FICON = {
    rd: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>',
    manufacturing: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M3 21h18"/>',
    quality: '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.2l2.8 2.8L16.2 9.5"/>',
    regulatory: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13l2 2 4-4"/>',
    supply: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    commercial: '<path d="M4 18V9M10 18V5M16 18v-7M22 18H2"/>',
    hospital: '<path d="M4 21V5h16v16M10 9h4M12 7v4M9 21v-5h6v5"/>',
    community: '<path d="M3 10l9-6 9 6M5 10v11h14V10"/><path d="M12 13v5M9.5 15.5h5"/>',
    safety: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v5M12 16h.01"/>'
  };
  const CICON = {
    web: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M7 21h10M12 18v3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    game: '<path d="M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5.2 2L14.5 15h-5l-1.3 1A3 3 0 0 1 3 14v-2a3 3 0 0 1 3-3z"/><path d="M8 11v3M6.5 12.5h3M15.5 12h.01M17.5 13.5h.01"/>',
    campaign: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6M19.5 7a7 7 0 0 1 0 10"/>',
    content: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7M9 8h3"/>',
    tools: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
  };
  const AICON = {
    companies: '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M3 21h18M8 17h1M12 17h1M16 17h1"/>',
    pharmacies: '<path d="M3 10l9-6 9 6M5 10v11h14V10"/><path d="M12 13v5M9.5 15.5h5"/>',
    warehouses: '<path d="M3 9l9-5 9 5v12H3z"/><path d="M7 21v-7h10v7M7 17h10"/>',
    individuals: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.3-7 8-7s7 2.5 8 7"/><path d="M15.5 17.5h4M17.5 15.5v4"/>',
    products: '<path d="M9 3h6v3H9zM8 6h8l1 3v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9z"/><path d="M10 13h4M12 11v4"/>'
  };
  const ficon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${FICON[k] || CICON[k] || AICON[k]}</svg>`;
  function fieldMap(mode) { // mode: 'filter' (buttons on the projects page) or 'link' (anchors to the projects page)
    const node = (k, i) => {
      const inner = `<span class="vc-ico">${ficon(k)}</span><span class="vc-n">${i + 1}</span><b>${esc(T.fields[k][0])}</b>${count(k) ? `<small>${esc(T.projCount(count(k)))}${projects.some(p => p.field === k && p.demo) ? ` · <em>${esc(T.live)}</em>` : ''}</small>` : ''}`;
      return mode === 'filter' ? `<li><button type="button" class="vc-node" data-f="${k}" aria-pressed="false" title="${esc(T.fields[k][1])}">${inner}</button></li>`
        : `<li><a class="vc-node" href="${HAS && (count(k) || !SHOWF) ? `projects.html#f-${k}` : `fields.html#field-${k}`}" title="${esc(T.fields[k][1])}">${inner}</a></li>`;
    };
    return `<div class="vchain${mode === 'filter' ? ' is-filter' : ''}"${mode === 'filter' ? ' data-fmap' : ''}>
      <span class="vc-end vc-start">${esc(T.mapStart)}</span>
      <ol>${FIELDS.map(node).join('')}</ol>
      <span class="vc-end vc-finish">${esc(T.mapEnd)}</span>
      ${mode === 'filter' ? `<button type="button" class="vc-all" data-f="all" aria-pressed="true">${esc(T.allFields)}</button>` : ''}
    </div>`;
  }

  // ---------- mega menu ----------
  function megaMenu(file) {
    const cur = h => h === file ? ' aria-current="page"' : '';
    const link = (href, title, desc) => `<a class="mm-link" href="${href}"><b>${esc(title)}</b><span>${esc(desc)}</span></a>`;
    const latest = articles[0];
    const panel = (id, label, inner, on) => `<li class="mm-item">
      <button class="mm-btn${on ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="mm-${id}">${esc(label)}<i aria-hidden="true"></i></button>
      <div class="mm-panel" id="mm-${id}"><div class="wrap mm-grid mm-${id}">${inner}</div></div>
    </li>`;
    return `<nav id="nav" aria-label="${esc(T.mainNav)}"><ul class="mm">
    <li><a class="mm-top" href="index.html"${cur('index.html')}>${esc(T.home)}</a></li>
    ${panel('about', T.about, `
      <div class="mm-intro">
        <picture><source type="image/webp" srcset="${R}img/portrait-520.webp"><img src="${R}img/portrait-520.jpg" alt="" width="520" height="728" loading="lazy"></picture>
        <div><b>${esc(site.fullName)}</b><span lang="${rtl ? 'en' : 'ar'}" dir="${rtl ? 'ltr' : 'rtl'}">${esc(otherName)}</span><small>${esc(T.capRole)} · ${esc(T.uni)}</small></div>
      </div>
      <div class="mm-col"><p class="mm-h">${esc(T.whoIam)}</p>
        ${link('about.html', T.myStory, T.myStoryD)}
        ${link('about.html#experience', T.experience, T.experienceD)}
        ${link('skills.html', T.skills, T.skillsD)}
      </div>
      <div class="mm-col"><p class="mm-h">${esc(T.credentials)}</p>
        ${link('about.html#education', T.education, T.educationD)}
        ${link('about.html#certifications', T.certs, T.certsD((site.certifications || []).length))}
        ${link('about.html#languages', T.languages, (site.languages || []).map(l => l.name).join(' · '))}
        ${link('faq.html', T.faq, T.faqSub)}
      </div>`, ['about.html', 'skills.html'].includes(file))}
    ${panel('marketing', T.marketing, `
      <div class="mm-col mm-wide"><p class="mm-h">${esc(T.audH)}</p>
        <div>${mk.audiences.map(a => `<a class="mm-proj mm-field" href="marketing.html#aud-${a.k}"><span class="vc-ico">${ficon(a.k)}</span><b>${esc(a.t)}</b><small>${esc(a.who)}</small></a>`).join('')}</div>
      </div>
      <div class="mm-col"><p class="mm-h">${esc(T.explore)}</p>
        ${link('marketing.html#builder', T.builderH, T.builderP)}
        ${link('marketing.html#process', T.processH, T.mkD)}
        ${link('marketing.html#rules', T.rulesH, T.rulesP)}
      </div>`, file === 'marketing.html')}
    ${!HAS ? (SHOWF ? `<li><a class="mm-top" href="fields.html"${cur('fields.html')}>${esc(T.fieldGuide)}</a></li>` : '') : panel('projects', T.projects, `
      <div class="mm-col mm-wide"><p class="mm-h">${esc(T.fiveRx)}</p>
        <div>${FIELDS.map(k => `<a class="mm-proj mm-field" href="projects.html#f-${k}"><span class="vc-ico">${ficon(k)}</span><b>${esc(T.fields[k][1])}</b><small>${esc(T.projCount(count(k)))}${projects.some(p => p.field === k && p.demo) ? ` · ${esc(T.live)}` : ''}</small></a>`).join('')}</div>
      </div>
      <div class="mm-col"><p class="mm-h">${esc(T.explore)}</p>
        ${link('projects.html#counter', T.counter, T.counterD)}
        ${link('projects.html#cabinet', T.cabinet, T.cabinetD)}
        ${link('projects.html#pipeline', T.pipeline, T.pipelineD)}
        ${SHOWF ? link('fields.html', T.fieldGuide, T.fieldGuideD) : ''}
      </div>
      <a class="mm-promo" href="projects.html#counter"><span class="rx-sym" aria-hidden="true">℞</span><b>${esc(T.counterQ)}</b><span>${esc(T.promoCta)}</span></a>`, file === 'projects.html' || file.startsWith('project-'))}
    ${panel('research', T.research, `
      <div class="mm-col"><p class="mm-h">${esc(T.topics)}</p>
        <div class="mm-topics">${T.cats.map((c, i) => `<a href="research.html#${catSlug(i)}">${esc(c)}</a>`).join('')}</div>
      </div>
      ${latest ? `<a class="mm-article" href="${aPage(latest)}"><p class="mm-h">${esc(T.latest)}</p><small>${esc(latest.category)}</small><b>${esc(latest.title)}</b><span>${esc(latest.excerpt)}</span></a>` : ''}
      <div class="mm-col"><p class="mm-h">${esc(T.allWriting)}</p>${link('research.html', T.researchLink, T.researchLinkD)}</div>`, file === 'research.html' || file.startsWith('article-'))}
    <li><a class="mm-top" href="skills.html"${cur('skills.html')}>${esc(T.skills)}</a></li>
    <li><a class="mm-lang" href="${rtl ? '../' : 'ar/'}${file}" hreflang="${rtl ? 'en' : 'ar'}" lang="${rtl ? 'en' : 'ar'}">${esc(T.switchLang)}</a></li>
    <li><a class="mm-cta" href="contact.html"${cur('contact.html')}>${esc(T.connect)}</a></li>
  </ul></nav>`;
  }

  // ---------- layout ----------
  function layout({ file, title, description, body, schema, ogType = 'website', bodyClass = '' }) {
    const url = urlOf(lang, file), t = site.theme || {};
    const ld = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : '';
    const fonts = 'family=Fraunces:opsz,wght@9..144,300..600&family=Manrope:wght@400;500;600;700&family=Amiri:wght@400;700&family=Caveat:wght@500;600' + (rtl ? '&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700' : '');
    return `<!DOCTYPE html>
<html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${esc(urlOf(l, file))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${esc(urlOf('en', file))}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="${esc(t.navy || '#0B1B33')}">
<meta property="og:type" content="${ogType}">
<meta property="og:locale" content="${rtl ? 'ar_JO' : 'en_US'}">
<meta property="og:locale:alternate" content="${rtl ? 'en_US' : 'ar_JO'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(BASE)}/img/og-image.jpg">
<meta property="og:site_name" content="${esc(site.fullName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="describedby" href="/llms.txt" type="text/markdown" title="llms.txt">
<link rel="alternate" href="/llms-full.txt" type="text/markdown" title="Full site content for AI assistants">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<link rel="stylesheet" href="${R}css/site.css">
<script>document.documentElement.classList.add('js')</script>
<style>:root{--navy:${esc(t.navy || '#0B1B33')};--teal:${esc(t.teal || '#2FA79B')};--sand:${esc(t.sand || '#E8DCCB')}}</style>
${ld}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">${esc(T.skip)}</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="index.html" aria-label="${esc(site.fullName)} — ${esc(T.home)}">${MARK}<span>${esc(site.fullName)}</span></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav"><span></span><span></span><span class="sr">${esc(T.menu)}</span></button>
    ${megaMenu(file)}
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div><a class="brand" href="index.html">${MARK}<span>${esc(site.fullName)}</span></a><p>${esc(site.brandConcept)}</p></div>
    <nav aria-label="${esc(T.footerNav)}">${[['index.html', T.home], ['about.html', T.about], ['marketing.html', T.marketing], ...(HAS ? [['projects.html', T.projects]] : []), ...(SHOWF ? [['fields.html', T.fieldGuide]] : []), ['research.html', T.research], ['skills.html', T.skills], ['faq.html', T.faq], ['contact.html', T.contact]].map(([h, l]) => `<a href="${h}">${esc(l)}</a>`).join('')}<a href="${rtl ? '../' : 'ar/'}${file}" lang="${rtl ? 'en' : 'ar'}">${esc(T.switchLang)}</a></nav>
    <p class="small">© ${YEAR} ${esc(site.fullName)} · ${esc(site.location)}</p>
  </div>
</footer>
<script src="${R}js/site.js" defer></script>
</body>
</html>`;
  }

  // ---------- shared blocks ----------
  const statusOf = p => T.statuses[p.status] || p.status;
  const dataAttrs = p => `data-field="${esc(p.field)}" data-tech="${esc((p.techTags || []).join(' '))}" data-status="${esc(p.status)}" data-q="${esc([p.title, p.area, p.short, p.symptom, p.problem, p.solution, fieldOf(p)[1], ...(p.data || []), ...(p.technology || []), ...(p.techTags || []).map(t => T.tech[t])].join(' ').toLowerCase())}"`;
  const techChips = p => (p.techTags || []).map(t => `<span>${esc(T.tech[t])}</span>`).join('');
  const pipeline = () => `<div class="pipe" data-pipe>
  <div class="pipe-head" aria-hidden="true"><span>${esc(T.pipeProject)}</span>${PH.map((p, i) => `<span><b>${i + 1}</b>${esc(p)}</span>`).join('')}</div>
  ${projects.map(p => `
  <a class="pipe-row" href="${pPage(p)}" ${dataAttrs(p)}>
    <span class="pipe-name"><small>${esc(fieldOf(p)[0])} · ${esc(p.area)}</small>${esc(p.title)}</span>
    <span class="pipe-track"><span class="pipe-bar" style="--to:${p.phase}"><em>${esc(PH[p.phase - 1])}</em></span></span>
    <span class="pipe-go" aria-hidden="true">→</span>
  </a>`).join('')}
  <p class="pipe-note">${T.pipeNote(projects.filter(p => p.status === 'Conceptual').length, projects.filter(p => p.status !== 'Conceptual').length)}</p>
</div>`;

  function explorer() {
    const chip = (attr, v, label, n) => `<button type="button" ${attr}="${esc(v)}" aria-pressed="false">${esc(label)}${n != null ? ` <small>${n}</small>` : ''}</button>`;
    const used = TECHS.filter(t => projects.some(p => (p.techTags || []).includes(t)));
    const sts = STATUSES.filter(s => projects.some(p => p.status === s));
    return `<div class="explorer" data-explorer>
      <div class="ex-row"><label class="ex-search"><span class="sr">${esc(T.exSearch)}</span><input type="search" id="ex-q" placeholder="${esc(T.exSearch)}" autocomplete="off"></label>
        <button type="button" class="ex-clear" data-clear>${esc(T.exClear)}</button></div>
      <div class="ex-row"><span class="ex-lab">${esc(T.exTech)}</span><div class="ex-chips" data-group="tech">${used.map(t => chip('data-t', t, T.tech[t], projects.filter(p => (p.techTags || []).includes(t)).length)).join('')}</div></div>
      <div class="ex-row"><span class="ex-lab">${esc(T.exStatus)}</span><div class="ex-chips" data-group="status">${sts.map(s => chip('data-s', s, T.statuses[s], projects.filter(p => p.status === s).length)).join('')}</div></div>
      <p class="ex-count" aria-live="polite" data-total="${projects.length}" data-tpl-en="${esc(T.exCount('{n}', '{t}'))}">${esc(T.exCount(projects.length, projects.length))}</p>
    </div>`;
  }
  const fieldPanels = () => `<div class="fpanels">${FIELDS.map(k => `<div class="fpanel" data-fpanel="${k}" hidden>
      <span class="vc-ico">${ficon(k)}</span><div><h3>${esc(T.fields[k][1])}</h3><p>${esc(T.fieldInfo[k][0])}</p>
      <p class="sub-lab">${esc(T.subareas)}</p><ul class="subareas">${T.fieldInfo[k][1].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`).join('')}</div>`;

  function rxCounter() {
    const today = fmtDate(Date.now(), { day: '2-digit', month: 'short', year: 'numeric' });
    return `<div class="counter" data-counter>
  <div class="counter-ask">
    <h3>${esc(T.counterQ)}</h3>
    <p class="small">${esc(T.counterSub)}</p>
    <div class="cfields" role="group" aria-label="${esc(T.byField)}"><button type="button" data-cf="all" aria-pressed="true">${esc(T.allFields)}</button>${FIELDS.map(k => `<button type="button" data-cf="${k}" aria-pressed="false">${esc(T.fields[k][0])}</button>`).join('')}</div>
    <div class="symptoms" role="group" aria-label="${esc(T.counterAria)}">${projects.map((p, i) => `<button type="button" data-rx="${i}" data-field="${esc(p.field)}" aria-pressed="${i === 0}"><small>${esc(fieldOf(p)[0])}</small>${esc(p.symptom || p.title)}</button>`).join('')}</div>
  </div>
  <div class="printer" aria-live="polite">
    <div class="slot" aria-hidden="true"></div>
    ${projects.map((p, i) => `
    <article class="rx${i === 0 ? ' show' : ''}" data-label="${i}"${i === 0 ? '' : ' hidden'}>
      <header><span class="rx-sym">℞</span><div><b>${esc(site.fullName)}</b><small>${esc(T.counter)} · ${esc(today)}</small></div><span class="rx-no">${esc(T.rxNo)} 00${i + 1}</span></header>
      <dl>
        <div><dt>${esc(T.rxFor)}</dt><dd>${esc(p.symptom || p.problem)}</dd></div>
        <div class="rx-main"><dt>${esc(T.rxDispense)}</dt><dd>${esc(p.ingredient || p.title)}</dd></div>
        <div><dt>${esc(T.directions)}</dt><dd>${esc(p.directions || p.solution)}</dd></div>
        <div><dt>${esc(T.rxEffect)}</dt><dd>${(p.impact || []).map(esc).join(' · ')}</dd></div>
      </dl>
      <footer><span>${esc(T.refills(p.phase, PH[p.phase - 1]))}</span><a href="${p.demo ? R + p.demo : pPage(p)}">${esc(p.demo ? T.tryDemo : T.openProject)}</a></footer>
    </article>`).join('')}
  </div>
</div>`;
  }

  const boxes = () => `<div class="boxes">${projects.map((p, i) => `
  <div class="box" style="--hue:${i % 5}" ${dataAttrs(p)}>
    <div class="box-in">
      <div class="face front">
        <span class="band-c"></span>
        <small>${esc(fieldOf(p)[1])}</small>
        <h3>${esc(p.title)}</h3>
        <p class="box-prob">${esc(p.symptom)}</p>
        <p class="box-tech">${techChips(p)}</p>
        <p class="ai-tag">${esc(T.activeIngredient)}: <b>AI</b> · <span class="st st-${p.status === 'Conceptual' ? 'c' : 'p'}">${esc(statusOf(p))}</span></p>
        <div class="box-foot">${phaseMeter(p.phase)}<span>${esc(PH[p.phase - 1])}</span></div>
        <button class="turn" type="button" aria-label="${esc(T.turnOver)}: ${esc(p.title)}">${esc(T.turnOver)} ↻</button>
      </div>
      <div class="face leaf">
        <dl>
          <div><dt>${esc(T.indication)}</dt><dd>${esc(p.problem)}</dd></div>
          <div><dt>${esc(T.activeIngredient)}</dt><dd>${esc(p.ingredient || p.solution)}</dd></div>
          <div><dt>${esc(T.effects)}</dt><dd>${(p.impact || []).map(esc).join(' · ')}</dd></div>
        </dl>
        <div class="leaf-foot"><a href="${p.demo ? R + p.demo : pPage(p)}">${esc(p.demo ? T.tryDemo : T.fullProject)}</a><button class="turn" type="button" aria-label="${esc(T.turnBack)}: ${esc(p.title)}">↺</button></div>
      </div>
    </div>
  </div>`).join('')}</div>
  <p class="small center">${T.pipeNote(projects.filter(p => p.status === 'Conceptual').length, projects.filter(p => p.status !== 'Conceptual').length)}</p>`;

  const createBlock = () => (site.create || []).length ? `<section class="band create-band" id="create">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.createH)}</h2><p>${esc(T.createP)}</p></div>
    <ul class="create">${site.create.map((c, i) => `<li><span class="vc-ico">${ficon(c.k)}</span><small>0${i + 1}</small><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></li>`).join('')}</ul>
  </div>
</section>` : '';
  const faqList = items => `<div class="faq">${items.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
  const faqTeaser = () => `<section class="band soft"><div class="wrap faq-wrap"><div><h2>${esc(T.faqTeaser)}</h2><a class="link-arrow" href="faq.html">${esc(T.allFaq)}</a></div>${faqList(faq.slice(0, 4))}</div></section>`;
  const certCard = () => cert ? `<article class="cert-card" id="certifications">
    <div class="cert-ribbon-v" aria-hidden="true"><span>CPD</span></div>
    <p class="kicker">${esc(T.certFeatured)}</p>
    <h2>${esc(cert.name)}</h2>
    <p class="cert-by">${esc(cert.issuer)}</p>
    <dl><div><dt>${esc(T.certPeriod)}</dt><dd>${esc(cert.period)}</dd></div><div><dt>${esc(T.certHoursL)}</dt><dd>${esc(cert.hours)}</dd></div><div><dt>${esc(T.certNo)}</dt><dd dir="ltr">${esc(cert.number)}</dd></div></dl>
  </article>` : '';

  const contactCta = () => `<section class="band navy cta">
  <div class="wrap cta-in">
    <h2>${esc(T.ctaH)}</h2>
    <p>${esc(site.contact.intro)}</p>
    <div class="btns"><a class="btn primary" href="contact.html">${esc(site.hero.secondaryCta)}</a><a class="btn ghost" href="marketing.html">${esc(T.seeMarketing)}</a></div>
  </div>
</section>`;

  // Campaign builder: choose an audience and a goal, get a campaign "prescription"
  function campaignBuilder() {
    const A = mk.audiences, G = mk.goals, show = (i) => i === 0 ? '' : ' hidden';
    const today = fmtDate(Date.now(), { day: '2-digit', month: 'short', year: 'numeric' });
    const by = (key, arr, fn) => arr.map((x, i) => `<span data-${key}-out="${x.k}"${show(i)}>${fn(x)}</span>`).join('');
    return `<div class="counter cb" data-cb>
  <div class="counter-ask">
    <h3>${esc(T.builderH)}</h3>
    <p class="small">${esc(T.builderP)}</p>
    <p class="cb-lab">${esc(T.bWho)}</p>
    <div class="symptoms cb-aud" role="group" aria-label="${esc(T.bWho)}">${A.map((a, i) => `<button type="button" data-a="${a.k}" aria-pressed="${i === 0}"><small>${esc(a.who)}</small>${esc(a.t)}</button>`).join('')}</div>
    <p class="cb-lab">${esc(T.bGoal)}</p>
    <div class="cfields cb-goal" role="group" aria-label="${esc(T.bGoal)}">${G.map((g, i) => `<button type="button" data-g="${g.k}" aria-pressed="${i === 0}">${esc(g.t)}</button>`).join('')}</div>
  </div>
  <div class="printer" aria-live="polite">
    <div class="slot" aria-hidden="true"></div>
    <article class="rx show">
      <header><span class="rx-sym">℞</span><div><b>${esc(site.fullName)}</b><small>${esc(T.rxCampaign)} · ${esc(today)}</small></div><span class="rx-no">${esc(T.rxNo)} <span data-cb-no>11</span></span></header>
      <dl>
        <div><dt>${esc(T.rxTo)}</dt><dd>${by('a', A, a => esc(a.t))}</dd></div>
        <div><dt>${esc(T.rxGoalL)}</dt><dd>${by('g', G, g => esc(g.t))}</dd></div>
        <div class="rx-main"><dt>${esc(T.rxDispense)}</dt><dd>${by('a', A, a => a.make.slice(0, 3).map(esc).join(' · '))}</dd></div>
        <div><dt>${esc(T.rxChannels)}</dt><dd>${by('a', A, a => a.channels.map(esc).join(' · '))}</dd></div>
        <div><dt>${esc(T.rxAngle)}</dt><dd>${by('g', G, g => esc(g.angle))}</dd></div>
        <div><dt>${esc(T.rxMeasure)}</dt><dd>${by('g', G, g => esc(g.kpi))}</dd></div>
        <div class="rx-caution"><dt>${esc(T.rxCaution)}</dt><dd>${by('a', A, a => esc(a.compliance))}</dd></div>
      </dl>
      <footer><a href="marketing.html#rules" class="cb-more">${esc(T.bFull)}</a><a href="contact.html" data-cb-order data-tpl="${esc(T.rxCampaign)}">${esc(T.bCta)}</a></footer>
    </article>
  </div>
</div>`;
  }
  const refsList = refs => `<ul class="refs">${refs.map(r => `<li><a href="${esc(r.url)}" rel="noopener" lang="en" dir="ltr">${esc(r.title)}</a></li>`).join('')}</ul>`;

  function archSVG(steps) {
    const n = steps.length, W = 1000, bw = 168, gap = (W - n * bw) / (n - 1 || 1), lim = rtl ? 20 : 16;
    const box = (s, i) => {
      const x = (rtl ? n - 1 - i : i) * (bw + gap), last = i === n - 1;
      const lines = []; let cur = '';
      esc(s).split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > lim) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; });
      lines.push(cur.trim());
      const y0 = 60 - (lines.length - 1) * 10;
      const arrow = rtl ? `M${x - 8} 60h-${gap - 16}` : `M${x + bw + 8} 60h${gap - 16}`;
      return `<g class="${last ? 'g-last' : ''}"><rect x="${x}" y="14" width="${bw}" height="92" rx="14" class="${last ? 'a-last' : 'a-box'}"/>
      <text x="${rtl ? x + bw - 16 : x + 16}" y="36" class="a-num" text-anchor="${rtl ? 'end' : 'start'}">0${i + 1}</text>
      ${lines.map((l, j) => `<text x="${x + bw / 2}" y="${y0 + 10 + j * 20}" text-anchor="middle" class="a-txt">${l}</text>`).join('')}
      ${last ? '' : `<path d="${arrow}" class="a-line" marker-end="url(#ah)"/>`}</g>`;
    };
    return `<svg class="arch-svg" viewBox="0 0 ${W} 120" role="img" aria-label="${esc(T.archAria)}: ${esc(steps.join(rtl ? ' ← ' : ' → '))}"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10z" fill="var(--teal)"/></marker></defs>${steps.map(box).join('')}</svg>
  <ol class="arch-list">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
  }

  // ---------- pages ----------
  const pages = [];
  const add = (file, cfg) => pages.push({ file, ...cfg });
  const personLD = {
    '@context': 'https://schema.org', '@type': 'Person', name: site.fullName, alternateName: otherName, jobTitle: site.role,
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Petra' }, email: site.contact.email,
    knowsLanguage: ['Arabic', 'English', 'Turkish', 'German'], description: site.tagline, url: urlOf(lang, 'index.html'), image: `${BASE}/img/portrait-880.jpg`,
    knowsAbout: ['Pharmacy', 'Pharmaceutical sciences', 'Artificial intelligence', 'Healthcare innovation', 'Medication safety'],
    address: { '@type': 'PostalAddress', addressLocality: 'Amman', addressCountry: 'JO' },
    sameAs: [site.contact.linkedin].filter(u => u && !u.includes('your-profile')),
    hasCredential: cert ? [{ '@type': 'EducationalOccupationalCredential', name: 'AI for Business to Increase Productivity', credentialCategory: 'certificate', recognizedBy: { '@type': 'Organization', name: 'Relevancy Academy' }, identifier: cert.number, dateCreated: '2026-11-26' }] : undefined,
    knowsAbout: ['Pharmacy', 'Pharmaceutical sciences', 'Pharmaceutical industry', 'Artificial intelligence', 'AI for business', 'Healthcare innovation', 'Medication safety', 'Pharmacovigilance', 'Regulatory affairs', 'Pharmaceutical supply chain', 'AI-generated websites, videos and marketing campaigns', 'Pharmaceutical marketing', 'Digital marketing for pharmacies', 'B2B marketing for drug distributors', 'Healthcare professional content', 'Medicine advertising compliance in Jordan']
  };

  add('index.html', {
    title: site.seo.home.title, description: site.seo.home.description, schema: personLD, bodyClass: 'home',
    body: `
<section class="hero band navy">
  <canvas class="hero-canvas" aria-hidden="true"></canvas>
  <div class="wrap hero-in">
    <div class="hero-text">
      <p class="kicker">${esc(site.positioning)}</p>
      <h1 class="name">${esc(site.fullName)}<span lang="${rtl ? 'en' : 'ar'}" dir="${rtl ? 'ltr' : 'rtl'}">${esc(otherName)}</span></h1>
      <p class="headline">${esc(site.hero.headline)}</p>
      <p class="sub">${esc(site.hero.subheadline)}</p>
      <div class="btns"><a class="btn primary" href="#builder">${esc(site.hero.primaryCta)}</a><a class="btn ghost" href="contact.html">${esc(site.hero.secondaryCta)}</a></div>
    </div>
    <figure class="portrait">
      <svg class="stamp" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="stampPath" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="60" cy="60" r="36" fill="none" stroke="currentColor" stroke-width="1"/>
        <g class="stamp-ring"><text><textPath href="#stampPath" textLength="285">${esc(T.stamp)}</textPath></text></g>
        <text x="60" y="71" text-anchor="middle" class="stamp-rx">℞</text></svg>
      <div class="arch">
        <picture>
          <source type="image/webp" srcset="${R}img/portrait-520.webp 520w, ${R}img/portrait-880.webp 880w" sizes="(max-width:700px) 70vw, 420px">
          <img src="${R}img/portrait-880.jpg" srcset="${R}img/portrait-520.jpg 520w, ${R}img/portrait-880.jpg 880w" sizes="(max-width:700px) 70vw, 420px" width="880" height="1232" alt="${esc(T.portraitAlt(site.fullName))}" fetchpriority="high">
        </picture>
      </div>
      <figcaption><b>${esc(T.capRole)}</b><span>${esc(T.capEdu)}</span></figcaption>
    </figure>
  </div>
</section>
<section class="stats" aria-label="${esc(T.highlightsAria)}"><div class="wrap stats-in">${(site.highlights || []).map(h => `<div><b>${esc(h.value)}</b><span>${esc(h.label)}</span></div>`).join('')}</div></section>
${cert ? `<a class="cert-ribbon" href="about.html#certifications"><span class="wrap"><b>${esc(T.certNew)}</b><span>${esc(cert.name)}</span><small>${esc(cert.issuer)} · ${esc(T.certHours(cert.hours))} · ${esc(cert.period)}</small></span></a>` : ''}

${(() => { const lp = projects.find(p => p.demo); if (!lp) return ''; const shot = (lp.screenshots || [])[0]; return `<section class="band live-band">
  <div class="wrap live-in">
    <div><p class="chip built">${esc(lp.statusLabel || lp.status)}</p><h2>${esc(lp.title)}</h2><p class="lead">${esc(lp.short)}</p>
      <div class="btns"><a class="btn primary" href="${R}${esc(lp.demo)}">${esc(T.tryDemo)}</a><a class="btn line" href="${pPage(lp)}">${esc(T.fullProject)}</a></div>
      <p class="small">${esc(T.liveNote)}</p></div>
    ${shot ? `<a class="live-shot" href="${R}${esc(lp.demo)}" aria-label="${esc(T.tryDemo)}"><img src="${R}${esc(shot.image)}" alt="${esc(shot.caption || lp.title)}" width="1160" height="1070" loading="lazy"></a>` : ''}
  </div>
</section>`; })()}
<section class="band" id="builder">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.mkTeaserH)}</h2><p>${esc(site.hero.intro)}</p></div>
    ${campaignBuilder()}
  </div>
</section>
${SHOWF ? `<section class="band map-band">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.mapH)}</h2><p>${esc(T.mapP)}</p></div>
    ${fieldMap('link')}
  </div>
</section>` : ''}
${createBlock()}
${HAS ? `<section class="band" id="counter">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.counter)}</h2><p>${esc(T.counterSub)}</p></div>
    ${rxCounter()}
  </div>
</section>` : ''}
${faqTeaser()}
<section class="band">
  <div class="wrap split">
    <div><h2>${esc(site.brandConcept)}</h2><p class="lead">${esc(site.about.lead)}</p><a class="link-arrow" href="about.html">${esc(T.bgLink)}</a></div>
    <div class="facts">${T.facts(site.location).map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
  </div>
</section>
${contactCta()}`
  });

  const edu = site.about.education.map(e => `<li><span class="yr">${esc(e.year)}</span><div><b>${esc(e.degree)}</b>${e.institution ? `<span>${esc(e.institution)}</span>` : ''}${e.note ? `<span>${esc(e.note)}</span>` : ''}</div></li>`).join('');
  add('about.html', {
    title: site.seo.about.title, description: site.seo.about.description, schema: personLD,
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.about)}</p><h1>${esc(T.aboutH1)}</h1></div></section>
<section class="band" id="education">
  <div class="wrap about-grid">
    <div class="prose"><p class="lead">${esc(site.about.lead)}</p>${paras(site.about.body)}</div>
    <aside class="card"><h2 class="h3">${esc(T.education)}</h2><ul class="timeline">${edu}</ul></aside>
  </div>
</section>
<section class="band soft" id="experience">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.experience)}</h2><p>${esc(T.experienceP)}</p></div>
    <ol class="xp">${(site.experience || []).map(x => `<li><span class="when" dir="ltr">${esc(x.period)}</span><div><b>${esc(x.role)}</b><span class="org">${esc(x.org)}</span>${x.note ? `<p>${esc(x.note)}</p>` : ''}</div></li>`).join('')}</ol>
  </div>
</section>
<section class="band">
  <div class="wrap">${certCard()}</div>
  <div class="wrap duo">
    <div class="card"><h2 class="h3">${esc(T.certs)}</h2><ul class="certs">${(site.certifications || []).filter(c => !c.featured).map(c => `<li><b>${esc(c.name)}</b><span>${esc(c.issuer)}${c.date ? ' · ' + esc(c.date) : ''}</span></li>`).join('')}</ul></div>
    <div class="card" id="languages"><h2 class="h3">${esc(T.languages)}</h2><ul class="langs">${(site.languages || []).map(l => `<li><b>${esc(l.name)}</b><span>${esc(l.level)}</span></li>`).join('')}</ul></div>
  </div>
</section>
<section class="band soft">
  <div class="wrap trio">
    <div class="card"><h2 class="h3">${esc(T.interestsH)}</h2>${list(site.about.interests)}</div>
    <div class="card"><h2 class="h3">${esc(T.expertiseH)}</h2>${list(site.about.expertise)}</div>
    <div class="card"><h2 class="h3">${esc(T.devH)}</h2>${list(site.about.development)}</div>
  </div>
  <div class="wrap"><p class="small center">${T.skillsNote}</p></div>
</section>
${contactCta()}`
  });

  if (HAS) add('projects.html', {
    title: site.seo.projects.title, description: site.seo.projects.description,
    schema: { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: urlOf(lang, pPage(p)), name: p.title })) },
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.projKicker)}</p><h1>${esc(T.projH1)}</h1><p class="sub">${esc(T.projSub)}</p></div></section>
<section class="band map-band tight" id="fields"><div class="wrap"><div class="sec-head"><h2>${esc(T.mapH)}</h2><p>${esc(T.mapP)}</p></div>${fieldMap('filter')}${fieldPanels()}</div></section>
<section class="band soft" id="cabinet"><div class="wrap"><div class="sec-head"><h2>${esc(T.explorerH)}</h2><p>${esc(T.explorerP)} ${esc(T.cabinetP)}</p></div>${explorer()}${boxes()}<div class="empty ex-empty" hidden><b>${esc(T.exNone)}</b><span>${esc(T.exNoneD)}</span></div></div></section>
<section class="band" id="counter"><div class="wrap">${rxCounter()}</div></section>
<section class="band" id="pipeline"><div class="wrap"><div class="sec-head"><h2>${esc(T.pipeline)}</h2><p>${esc(T.devPipeP)}</p></div>${pipeline()}</div></section>
${contactCta()}`
  });

  projects.forEach((p, i) => {
    const prev = projects[(i - 1 + projects.length) % projects.length], next = projects[(i + 1) % projects.length];
    const shots = (p.screenshots || []).filter(s => s && s.image);
    const S = T.sec, SECS = ['indication', 'rationale', 'mechanism', 'architecture', 'data', 'composition', 'effect', 'precautions', 'review', 'stage', 'media', 'references'];
    const sec = (id, inner) => `<section id="${id}"><h2><span>${esc(S[id][0])}</span>${esc(S[id][1])}</h2>${inner}</section>`;
    add(pPage(p), {
      title: (!rtl && p.seoTitle) || T.projTitle(p, site.fullName),
      description: (!rtl && p.seoDescription) || T.projDesc(p, site.fullName),
      ogType: 'article',
      schema: { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, about: p.area, description: p.short, creativeWorkStatus: p.status, inLanguage: lang, author: { '@type': 'Person', name: site.fullName } },
      body: `
<section class="band navy page-head proj-head">
  <div class="wrap">
    <a class="back" href="projects.html">${esc(T.allProjects)}</a>
    <p class="kicker">${esc(fieldOf(p)[1])} · ${esc(p.area)}</p>
    <h1>${esc(p.title)}</h1>
    <p class="sub">${esc(p.short)}</p>
    <div class="status-row">${statusChip(p)}<div>${phaseMeter(p.phase)}<small>${esc(T.phaseOf(p.phase, PH[p.phase - 1]))}</small></div></div>
    ${p.demo ? `<div class="btns"><a class="btn primary" href="${R}${esc(p.demo)}">${esc(T.tryDemo)}</a><a class="btn ghost" href="#media">${esc(T.seeShots)}</a></div>` : ''}
  </div>
</section>
<section class="band">
  <div class="wrap mono-page">
    <nav class="toc" aria-label="${esc(T.onPage)}">${SECS.map(id => `<a href="#${id}">${esc(S[id][0])}</a>`).join('')}</nav>
    <article class="prose">
      ${p.directions ? `<p class="sig"><b>${esc(T.directions)}</b>${esc(p.directions)}</p>` : ''}
      ${sec('indication', `<p>${esc(p.problem)}</p>`)}
      ${sec('rationale', `<p>${esc(p.why)}</p>`)}
      ${sec('mechanism', `<p>${esc(p.solution)}</p>`)}
      ${sec('architecture', `<div class="arch-wrap">${archSVG(p.architecture || [])}</div>`)}
      ${sec('data', list(p.data))}
      ${sec('composition', `${list(p.technology, 'tags')}<p class="box-tech">${techChips(p)}</p>`)}
      ${sec('effect', `${list(p.impact)}<p class="small">${esc(p.status === 'Conceptual' ? T.effectNote : '')}</p>`)}
      ${sec('precautions', list(p.limitations))}
      ${sec('review', `<div class="review">${list(p.review)}</div>`)}
      ${sec('stage', `<div class="stage">${statusChip(p)}${phaseMeter(p.phase)}<p><b>${esc(T.phaseOf(p.phase, PH[p.phase - 1]))}.</b> ${esc(T.stageNote[p.status] || '')}</p></div>`)}
      ${sec('media', `${shots.length ? `<div class="shots">${shots.map(s => `<figure><img src="${R}${esc(s.image)}" alt="${esc(s.caption || p.title)}" loading="lazy">${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`
        : `<div class="empty"><b>${esc(T.noShots)}</b><span>${esc(T.noShotsD(PH[p.phase - 1]))}</span></div>`}
        ${p.video ? `<p><a class="link-arrow" href="${esc(p.video)}" rel="noopener">${esc(T.watch)}</a></p>` : `<div class="empty"><b>${esc(T.noVideo)}</b><span>${esc(T.noVideoD)}</span></div>`}`)}
      ${sec('references', (p.references || []).length ? `<ul class="refs">${p.references.map(r => `<li><a href="${esc(r.url)}" rel="noopener" lang="en" dir="ltr">${esc(r.title)}</a></li>`).join('')}</ul>` : `<p>${esc(T.refsSoon)}</p>`)}
    </article>
  </div>
</section>
<nav class="band soft pn" aria-label="${esc(T.more)}"><div class="wrap pn-in"><a href="${pPage(prev)}"><small>${esc(T.prev)}</small>${esc(prev.title)}</a><a href="${pPage(next)}"><small>${esc(T.next)}</small>${esc(next.title)}</a></div></nav>
${contactCta()}`
    });
  });

  add('marketing.html', {
    title: site.seo.marketing.title, description: site.seo.marketing.description,
    schema: { '@context': 'https://schema.org', '@type': 'Service', serviceType: 'AI-powered pharmaceutical marketing', name: T.mkKicker, inLanguage: lang, areaServed: 'JO',
      provider: { '@type': 'Person', name: site.fullName, jobTitle: site.role, email: site.contact.email },
      audience: mk.audiences.map(a => ({ '@type': 'BusinessAudience', name: a.t })),
      hasOfferCatalog: { '@type': 'OfferCatalog', name: T.makeL, itemListElement: mk.audiences.map(a => ({ '@type': 'OfferCatalog', name: a.t, itemListElement: a.make.map(m => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: m } })) })) } },
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.mkKicker)}</p><h1>${esc(T.mkH1)}</h1><p class="sub">${esc(T.mkSub)}</p>
  <div class="btns"><a class="btn primary" href="#builder">${esc(T.builderH)}</a><a class="btn ghost" href="contact.html">${esc(site.hero.secondaryCta)}</a></div></div></section>
<section class="band" id="audiences">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.audH)}</h2><p>${esc(T.audP)}</p></div>
    <div class="aud">${mk.audiences.map((a, i) => `<article class="aud-card" id="aud-${a.k}">
      <header><span class="vc-ico">${ficon(a.k)}</span><div><small>0${i + 1} · ${esc(a.who)}</small><h3>${esc(a.t)}</h3></div></header>
      <p class="aud-pain">${esc(a.pain)}</p>
      <p class="sub-lab">${esc(T.makeL)}</p><ul class="aud-make">${a.make.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
      <p class="sub-lab">${esc(T.chanL)}</p><p class="aud-chan">${a.channels.map(c => `<span>${esc(c)}</span>`).join('')}</p>
      <p class="aud-comp"><b>${esc(T.compL)}</b>${esc(a.compliance)}</p>
    </article>`).join('')}</div>
  </div>
</section>
<section class="band soft" id="builder"><div class="wrap">${campaignBuilder()}</div></section>
<section class="band" id="process">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.processH)}</h2><p>${esc(T.processP)}</p></div>
    <ol class="steps">${mk.process.map((p, i) => `<li><span>${i + 1}</span><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></li>`).join('')}</ol>
  </div>
</section>
<section class="band soft" id="rules">
  <div class="wrap">
    <div class="sec-head"><h2>${esc(T.rulesH)}</h2><p>${esc(T.rulesP)}</p></div>
    <ul class="rules">${mk.rules.map(r => `<li><h3>${esc(r.t)}</h3><p>${esc(r.d)}</p></li>`).join('')}</ul>
    <div class="rules-refs"><p class="sub-lab">${esc(T.refsH)}</p>${refsList(mk.references)}<p class="small">${esc(mk.note)}</p></div>
  </div>
</section>
${createBlock()}
${contactCta()}`
  });

  if (SHOWF) add('fields.html', {
    title: site.seo.fields.title, description: site.seo.fields.description,
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.fieldGuide)}</p><h1>${esc(T.fgH1)}</h1><p class="sub">${esc(T.fgSub)}</p></div></section>
<section class="band map-band tight"><div class="wrap">${fieldMap('link')}</div></section>
<section class="band"><div class="wrap fguide">${FIELDS.map((k, i) => { const ps = projects.filter(p => p.field === k); return `<article class="fcard" id="field-${k}">
  <header><span class="vc-ico">${ficon(k)}</span><div><small>${i + 1} / ${FIELDS.length}</small><h2>${esc(T.fields[k][1])}</h2></div></header>
  <p>${esc(T.fieldInfo[k][0])}</p>
  <p class="sub-lab">${esc(T.subareas)}</p><ul class="subareas">${T.fieldInfo[k][1].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  ${ps.length ? `<p class="sub-lab">${esc(T.projCount(ps.length))}</p>
  <ul class="fprojects">${ps.map(p => `<li><a href="${pPage(p)}"><b>${esc(p.title)}</b><span>${esc(p.symptom)}</span></a><span class="st st-${p.status === 'Conceptual' ? 'c' : 'p'}">${esc(statusOf(p))}</span></li>`).join('')}</ul>
  <a class="link-arrow" href="projects.html#f-${k}">${esc(T.seeProjects)}</a>` : ''}
</article>`; }).join('')}</div></section>
${contactCta()}`
  });

  add('research.html', {
    title: site.seo.research.title, description: site.seo.research.description,
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.researchLink)}</p><h1>${esc(T.resH1)}</h1><p class="sub">${esc(T.resSub)}</p></div></section>
<section class="band">
  <div class="wrap">
    <div class="filters" role="group" aria-label="${esc(T.filterAria)}"><button class="on" data-f="all">${esc(T.all)}</button>${T.cats.map((c, i) => `<button data-f="${esc(c)}" data-s="${catSlug(i)}">${esc(c)}</button>`).join('')}</div>
    <div class="articles">${articles.map(a => `
      <a class="acard" href="${aPage(a)}" data-cat="${esc(a.category)}">
        <small>${esc(a.category)} · <time datetime="${esc(a.date)}">${esc(fmtDate(a.date, { day: 'numeric', month: 'long', year: 'numeric' }))}</time></small>
        <h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p>${a.sample ? `<span class="chip concept">${esc(T.sampleChip)}</span>` : ''}
      </a>`).join('')}
      <div class="empty filter-empty" hidden><b>${esc(T.emptyH)}</b><span>${esc(T.emptyD)}</span></div>
    </div>
  </div>
</section>
${contactCta()}`
  });
  articles.forEach(a => add(aPage(a), {
    title: `${a.title} | ${site.fullName}`, description: a.excerpt, ogType: 'article',
    schema: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, inLanguage: lang, author: { '@type': 'Person', name: site.fullName }, description: a.excerpt },
    body: `
<section class="band navy page-head"><div class="wrap narrow"><a class="back" href="research.html">${esc(T.researchLink)}</a><p class="kicker">${esc(a.category)}</p><h1>${esc(a.title)}</h1><p class="sub">${esc(a.excerpt)}</p></div></section>
<section class="band"><div class="wrap narrow prose">${a.sample ? `<p class="note">${esc(T.sampleNote)}</p>` : ''}${md(a.body)}</div></section>
${contactCta()}`
  }));

  add('skills.html', {
    title: site.seo.skills.title, description: site.seo.skills.description,
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.skillsKicker)}</p><h1>${esc(T.skillsH1)}</h1><p class="sub">${esc(T.skillsSub)}</p></div></section>
<section class="band">
  <div class="wrap">
    <div class="legend"><span><i class="d1"></i>${esc(LV[1])}</span><span><i class="d2"></i>${esc(LV[2])}</span><span><i class="d3"></i>${esc(LV[3])}</span></div>
    <div class="skills">${site.skills.map(g => `
      <section class="card skill">
        <h2 class="h3">${esc(g.category)}</h2>
        <ul>${g.items.map(s => `<li><span>${esc(s.name)}</span><span class="lvl" title="${esc(LV[s.level])}"><i class="${s.level >= 1 ? 'on' : ''}"></i><i class="${s.level >= 2 ? 'on' : ''}"></i><i class="${s.level >= 3 ? 'on' : ''}"></i><em>${esc(LV[s.level])}</em></span></li>`).join('')}</ul>
      </section>`).join('')}</div>
  </div>
</section>
${contactCta()}`
  });

  const emailReal = site.contact.email && !site.contact.email.includes('example.com');
  const liReal = !!site.contact.linkedin && !site.contact.linkedin.includes('your-profile');
  const F = T.form;
  add('contact.html', {
    title: site.seo.contact.title, description: site.seo.contact.description,
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.contact)}</p><h1>${esc(T.contactH1)}</h1><p class="sub">${esc(site.contact.intro)}</p></div></section>
<section class="band">
  <div class="wrap contact-grid">
    <form class="rxpad" data-rxpad data-to="${esc(site.contact.email)}" data-subject="${esc(T.pad.subject)}" data-head="${esc(T.pad.head)}" data-need="${esc(T.pad.need)}" data-opened="${esc(T.pad.opened)}" data-copied="${esc(T.pad.copied)}" novalidate>
      <header><span class="rx-sym">℞</span><div><b>${esc(T.pad.h)}</b><small>${esc(site.fullName)} · ${esc(T.capEdu)}</small></div><span class="rx-date" dir="ltr">${esc(fmtDate(Date.now(), { day: '2-digit', month: 'short', year: 'numeric' }))}</span></header>
      <p class="pad-intro">${esc(T.pad.p)}</p>
      <div class="pad-row"><label><span>${esc(T.pad.for)}</span><input name="name" autocomplete="name" placeholder="${esc(T.pad.forPh)}" required></label>
        <label><span>${esc(T.pad.org)}</span><input name="org" autocomplete="organization" placeholder="${esc(T.pad.orgPh)}"></label></div>
      <label><span>${esc(T.pad.email)}</span><input name="email" type="email" autocomplete="email" dir="ltr"></label>
      <label><span>${esc(T.pad.dx)}</span><textarea name="dx" rows="3" placeholder="${esc(T.pad.dxPh)}" required></textarea></label>
      <label><span>${esc(T.pad.rx)}</span><select name="rx">${F.topics.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
      <label><span>${esc(T.pad.notes)}</span><textarea name="notes" rows="2" placeholder="${esc(T.pad.notesPh)}"></textarea></label>
      <div class="pad-sig"><span>${esc(T.pad.sig)}</span><output class="sig-out" aria-hidden="true"></output></div>
      <div class="btns"><button class="btn primary" type="submit">${esc(T.pad.send)}</button><button class="btn line pad-copy" type="button">${esc(T.pad.copy)}</button></div>
      <p class="form-msg" role="status" aria-live="polite"></p>
    </form>
    <aside class="card contact-side">
      <h2 class="h3">${esc(F.direct)}</h2>
      <p class="mail-line"><small>${esc(F.email)}</small><a href="mailto:${esc(site.contact.email)}" dir="ltr">${esc(site.contact.email)}</a><button type="button" class="copy-mail" data-mail="${esc(site.contact.email)}" data-done="${esc(T.emailCopied)}">${esc(T.copyEmail)}</button></p>
      ${liReal ? `<p><small>LinkedIn</small><a href="${esc(site.contact.linkedin)}" rel="noopener" dir="ltr">${esc(site.contact.linkedin.replace(/^https?:\/\/(www\.)?/, ''))}</a></p>` : ''}
      <p><small>${esc(F.location)}</small>${esc(site.location)}</p>
      <h2 class="h3">${esc(F.openTo)}</h2>${list(site.contact.roles)}
    </aside>
  </div>
</section>`
  });

  add('faq.html', {
    title: site.seo.faq.title, description: site.seo.faq.description,
    schema: { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    body: `
<section class="band navy page-head"><div class="wrap"><p class="kicker">${esc(T.faq)}</p><h1>${esc(T.faqH1)}</h1><p class="sub">${esc(T.faqSub)}</p></div></section>
<section class="band"><div class="wrap narrow">${faqList(faq)}<p class="faq-mail"><a class="btn primary" href="contact.html">${esc(T.emailMe)}</a> <a dir="ltr" href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a></p></div></section>
${contactCta()}`
  });

  add('404.html', { title: `${T.notFound} | ${site.fullName}`, description: T.notFound, body: `<section class="band navy page-head"><div class="wrap"><p class="kicker">404</p><h1>${esc(T.notFoundH1)}</h1><div class="btns"><a class="btn primary" href="index.html">${esc(T.backHome)}</a></div></div></section>` });

  fs.mkdirSync(OUT, { recursive: true });
  for (const p of pages) fs.writeFileSync(path.join(OUT, p.file), layout(p));
  return pages.map(p => p.file);
}

// ---------- write ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };
copyDir(path.join(ROOT, 'static'), DIST);
// Prototypes and their screenshots go online only when their project is published
const liveDemos = EN.projects.map(p => p.demo).filter(Boolean);
if (!liveDemos.some(d => d.startsWith('inventory-agent'))) {
  fs.rmSync(path.join(DIST, 'inventory-agent'), { recursive: true, force: true });
  for (const f of fs.readdirSync(path.join(DIST, 'img/uploads'))) if (f.startsWith('inventory-agent')) fs.rmSync(path.join(DIST, 'img/uploads', f));
}
copyDir(path.join(ROOT, 'admin'), path.join(DIST, 'admin'));
const files = {};
for (const l of LANGS) files[l] = buildLang(l);

const today = new Date().toISOString().slice(0, 10);
const all = files.en.filter(f => f !== '404.html');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.flatMap(l => all.filter(f => files[l].includes(f)).map(f => `  <url><loc>${esc(urlOf(l, f))}</loc><lastmod>${today}</lastmod>${LANGS.filter(x => files[x].includes(f)).map(x => `<xhtml:link rel="alternate" hreflang="${x}" href="${esc(urlOf(x, f))}"/>`).join('')}</url>`)).join('\n')}
${liveDemos.map(d => `  <url><loc>${esc(BASE)}/${esc(d.replace(/index\.html$/, ''))}</loc><lastmod>${today}</lastmod></url>\n`).join('')}</urlset>
`);
// AI assistants (ChatGPT, Claude, Perplexity, Gemini) are explicitly welcome
const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended'];
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\n${bots.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /admin/`).join('\n\n')}\n\nSitemap: ${BASE}/sitemap.xml\n`);

// llms.txt (short guide) + llms-full.txt (all content as plain Markdown) for AI assistants
function siteMarkdown(lang) {
  const T = UI[lang], rtl = lang === 'ar';
  const site = rtl ? merge(EN.site, readJSON(path.join(ROOT, 'content/ar/site.json'))) : EN.site;
  const arP = rtl ? listJSON(path.join(ROOT, 'content/ar/projects')) : [];
  const projects = EN.projects.map(p => ({ ...p, ...(arP.find(x => x.slug === p.slug) || {}) }));
  const articles = rtl ? listJSON(path.join(ROOT, 'content/ar/articles')) : EN.articles;
  const ul = a => (a || []).map(x => `- ${x}`).join('\n');
  const L = s => urlOf(lang, s);
  const mk = readJSON(path.join(ROOT, rtl ? 'content/ar/marketing.json' : 'content/marketing.json'));
  return [
    `# ${site.fullName}${site.arabicName && !rtl ? ` (${site.arabicName})` : site.altName ? ` (${site.altName})` : ''}`,
    `> ${site.role} · ${site.location}. ${site.tagline}`,
    `${site.hero.subheadline}\n\n${site.hero.intro}`,
    `## ${T.about} — ${L('about.html')}\n\n${site.about.lead}\n\n${site.about.body}`,
    `### ${T.education}\n${site.about.education.map(e => `- ${e.degree}${e.institution ? ', ' + e.institution : ''} (${e.year})${e.note ? ' — ' + e.note : ''}`).join('\n')}`,
    `### ${T.experience}\n${(site.experience || []).map(x => `- ${x.period}: ${x.role} — ${x.org}. ${x.note || ''}`).join('\n')}`,
    `### ${T.certs}\n${(site.certifications || []).map(c => `- ${c.name} — ${c.issuer}${c.date ? ' (' + c.date + ')' : ''}`).join('\n')}`,
    `### ${T.languages}\n${(site.languages || []).map(l => `- ${l.name}: ${l.level}`).join('\n')}`,
    `### ${T.interestsH}\n${ul(site.about.interests)}\n\n### ${T.expertiseH}\n${ul(site.about.expertise)}\n\n### ${T.devH}\n${ul(site.about.development)}`,
    ...(projects.length ? [`## ${T.projects} — ${L('projects.html')}\n\n${T.pipeNote(projects.filter(p => p.status === 'Conceptual').length, projects.filter(p => p.status !== 'Conceptual').length).replace(/<[^>]+>/g, '')}`,
    ...projects.map(p => `### ${p.title} (${(T.fields[p.field] || ['', ''])[1]} · ${p.area}) — ${L(pPage(p))}\n${p.status === 'Conceptual' ? T.concept : (p.statusLabel || p.status)} · ${T.phaseOf(p.phase, T.phases[p.phase - 1])}${p.demo ? ` · ${T.tryDemo}: ${BASE}/${p.demo}` : ''}\n\n- ${T.sec.indication[1]}: ${p.problem}\n- ${T.sec.rationale[1]}: ${p.why}\n- ${T.sec.mechanism[1]}: ${p.solution}\n- ${T.sec.composition[1]}: ${(p.technology || []).join(', ')}\n- ${T.sec.effect[1]}: ${(p.impact || []).join(', ')}\n- ${T.sec.data[1]}: ${(p.data || []).join('; ')}\n- ${T.sec.precautions[1]}: ${(p.limitations || []).join('; ')}\n- ${T.sec.review[1]}: ${(p.review || []).join(' ')}\n- ${T.sec.stage[1]}: ${T.stageNote[p.status] || ''}`)] : []),
    `## ${T.marketing} — ${L('marketing.html')}\n\n${T.mkSub}\n\n${mk.audiences.map(a => `### ${a.t} (${a.who})\n${a.pain}\n\n- ${T.makeL}: ${a.make.join('; ')}\n- ${T.chanL}: ${a.channels.join(', ')}\n- ${T.compL}: ${a.compliance}`).join('\n\n')}\n\n### ${T.processH}\n${mk.process.map((x, i) => `${i + 1}. ${x.t}: ${x.d}`).join('\n')}\n\n### ${T.rulesH}\n${mk.rules.map(x => `- ${x.t}: ${x.d}`).join('\n')}\n\n${mk.note}\n${mk.references.map(r => `- ${r.title}: ${r.url}`).join('\n')}`,
    `## ${T.createH}\n${(site.create || []).map(c => `- ${c.t}: ${c.d}`).join('\n')}`,
    `## ${T.faq} — ${L('faq.html')}\n${readJSON(path.join(ROOT, rtl ? 'content/ar/faq.json' : 'content/faq.json')).items.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}`,
    `## ${T.skills} — ${L('skills.html')}\n${site.skills.map(g => `### ${g.category}\n${g.items.map(i => `- ${i.name}: ${T.levels[i.level]}`).join('\n')}`).join('\n\n')}`,
    `## ${T.research} — ${L('research.html')}\n${articles.map(a => `### ${a.title} — ${L(aPage(a))}\n${a.excerpt}\n\n${a.body}`).join('\n\n')}`,
    `## ${T.contact} — ${L('contact.html')}\n${site.contact.intro}\n\n- Email: ${site.contact.email}${site.contact.linkedin && !site.contact.linkedin.includes('your-profile') ? `\n- LinkedIn: ${site.contact.linkedin}` : ''}\n\n### ${T.form.openTo}\n${ul(site.contact.roles)}`
  ].join('\n\n');
}
const en = EN.site;
const hasP = EN.projects.length > 0;
const C = (en.certifications || []).find(c => c.featured);
const FAQ_EN = readJSON(path.join(ROOT, 'content/faq.json')).items;
const MK = readJSON(path.join(ROOT, 'content/marketing.json'));
fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${en.fullName} (${en.arabicName}) — ${en.role}

> ${en.fullName} is a pharmacist based in ${en.location} who creates AI-powered marketing for the pharmaceutical sector — pharmaceutical companies, pharmacies, drug warehouses and distributors, individual pharmacists and healthcare professionals, and pharmaceutical products. She produces campaigns, videos, websites, content and interactive experiences with AI, and reviews every claim as a pharmacist against medicine-advertising rules in Jordan.${C ? ` Certified in "${C.name}" (${C.issuer}, ${C.hours} training hours, ${C.period}, certificate no. ${C.number}).` : ''}

This file follows the llms.txt proposal (llmstxt.org). Facts here are maintained by ${en.fullName}; please quote the linked pages, and prefer them over this summary if anything differs. Contact is by email only.

## Profile facts
- Name: ${en.fullName} (Arabic: ${en.arabicName})
- Role: ${en.role}
- Location: ${en.location}
- Education: B.Sc. Pharmacy, University of Petra, 2022 — GPA 3.8/4.0 (Excellent), academic achievement award for four years
- Experience: community pharmacy, laboratory work, COVID-19 vaccination center, three years in pharmaceutical sales and business development (2022–2025)
${C ? `- AI certification: ${C.name} — ${C.issuer}, ${C.period}, ${C.hours} training hours, certificate no. ${C.number}\n` : ''}- Languages: Arabic (native), English (C2), Turkish (B2), German (A2)
- Email: ${en.contact.email}
- Open to: ${en.contact.roles.join('; ')}

## Who she markets for
${MK.audiences.map(a => `- ${a.t} (${a.who}): ${a.make.join(', ')}. Channels: ${a.channels.join(', ')}. Compliance: ${a.compliance}`).join('\n')}

## How a campaign is made
${MK.process.map((x, i) => `${i + 1}. ${x.t}: ${x.d}`).join('\n')}

## Compliance principles (Jordan)
${MK.rules.map(x => `- ${x.t}: ${x.d}`).join('\n')}
- ${MK.note}

## AI-powered creation
${(en.create || []).map(c => `- ${c.t}: ${c.d}`).join('\n')}

## Main pages
- [Home](${BASE}/): overview, highlights, campaign builder and AI creation
- [AI marketing](${BASE}/marketing): audiences, services, workflow and compliance rules
- [About](${BASE}/about): education, experience, certifications and languages
${SHOWF ? `- [Field guide](${BASE}/fields): nine pharmaceutical fields, their workflows and sub-areas\n` : ''}- [Skills](${BASE}/skills): self-assessed skill levels
- [FAQ](${BASE}/faq): common questions about services, compliance, qualifications and contact
- [Contact](${BASE}/contact): email and prescription-style contact form
${hasP ? `- [Projects](${BASE}/projects): pharmaceutical AI projects, each labelled with its development stage\n` : ''}
## Research
${EN.articles.map(a => `- [${a.title}](${urlOf('en', aPage(a))}): ${a.excerpt}`).join('\n')}
${hasP ? `\n## Projects\n${EN.projects.map(p => `- [${p.title}](${urlOf('en', pPage(p))}) — ${p.status}: ${p.short}`).join('\n')}\n` : ''}
## FAQ
${FAQ_EN.map(f => `- ${f.q} ${f.a}`).join('\n')}

## Sources for the compliance principles
${MK.references.map(r => `- [${r.title}](${r.url})`).join('\n')}

## Arabic
- [النسخة العربية — الرئيسية](${BASE}/ar/)
- [التسويق بالذكاء الاصطناعي](${BASE}/ar/marketing)
- [الأسئلة الشائعة](${BASE}/ar/faq)

## Optional
- [Full site content in Markdown (English and Arabic)](${BASE}/llms-full.txt)
- [Sitemap](${BASE}/sitemap.xml)
- [Robots policy](${BASE}/robots.txt)
`);
fs.writeFileSync(path.join(DIST, 'llms-full.txt'), `${siteMarkdown('en')}\n\n---\n\n${siteMarkdown('ar')}\n`);
console.log(`Built ${files.en.length} English + ${files.ar.length} Arabic pages → dist/`);
