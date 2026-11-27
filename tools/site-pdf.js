// Builds a printable HTML of the whole website (English + Arabic) for review by AI assistants or people.
// Usage: node tools/site-pdf.js  → writes dist/site-content.html (print it to PDF)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const UI = require(path.join(ROOT, 'ui.js'));
const rj = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const lj = d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.json')).map(f => rj(path.join(d, f)));
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const merge = (a, b) => { const o = { ...a }; for (const k in b) o[k] = isObj(a[k]) && isObj(b[k]) ? merge(a[k], b[k]) : b[k]; return o; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FIELDS = ['rd', 'manufacturing', 'quality', 'regulatory', 'supply', 'commercial', 'hospital', 'community', 'safety'];

const enSite = rj('content/site.json');
const enProjects = lj('content/projects').sort((a, b) => a.order - b.order);
const data = {
  en: { site: enSite, projects: enProjects, articles: lj('content/articles') },
  ar: { site: merge(enSite, rj('content/ar/site.json')), projects: enProjects.map(p => ({ ...p, ...(lj('content/ar/projects').find(x => x.slug === p.slug) || {}) })), articles: lj('content/ar/articles') }
};
const ul = a => (a || []).length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
const md = s => String(s || '').split(/\n{2,}/).map(b => b.startsWith('## ') ? `<h4>${esc(b.slice(3))}</h4>` : b.split('\n').every(l => l.startsWith('- ')) ? `<ul>${b.split('\n').map(l => `<li>${esc(l.slice(2)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>` : `<p>${esc(b)}</p>`).join('');

function part(lang) {
  const { site, projects, articles } = data[lang], T = UI[lang], ar = lang === 'ar';
  const L = ar ? {
    part: 'الجزء الثاني: محتوى الموقع باللغة العربية (/ar/)', hero: 'الواجهة الرئيسية', about: 'من أنا', edu: 'التعليم', xp: 'الخبرات', certs: 'الشهادات والدورات', langs: 'اللغات',
    interests: 'الاهتمامات المهنية', expertise: 'مجالات الخبرة', dev: 'التطوير المهني', projects: 'المشاريع حسب المجال', skills: 'المهارات', research: 'الأبحاث والمقالات', contact: 'التواصل', highlights: 'أبرز الأرقام',
    status: 'الحالة', data: 'البيانات المطلوبة', review: 'المراجعة البشرية', tags: 'فلاتر التقنية', counter: 'في الكاونتر الذكي', problem: 'المشكلة', why: 'لماذا يهم', solution: 'الحل المقترح', tech: 'التقنيات', impact: 'الأثر المتوقع', limits: 'القيود', refs: 'المراجع', arch: 'البنية', demo: 'النموذج الأولي', seo: 'عناوين ووصف SEO', page: 'الصفحة', open: 'منفتحة على'
  } : {
    part: 'Part 1: Website content in English (/)', hero: 'Home page', about: 'About', edu: 'Education', xp: 'Experience', certs: 'Certifications & courses', langs: 'Languages',
    interests: 'Professional interests', expertise: 'Areas of expertise', dev: 'Professional development', projects: 'Projects by field', skills: 'Skills', research: 'Research & articles', contact: 'Contact', highlights: 'Highlights',
    status: 'Status', data: 'Required data', review: 'Human review & approval', tags: 'Technology filters', counter: 'At the AI counter', problem: 'Problem', why: 'Why it matters', solution: 'Proposed solution', tech: 'Technology', impact: 'Expected impact', limits: 'Limitations', refs: 'References', arch: 'Architecture', demo: 'Live prototype', seo: 'SEO titles and descriptions', page: 'Page', open: 'Open to'
  };
  const st = p => p.status === 'Conceptual' ? T.concept : (p.statusLabel || p.status);
  return `<section class="part" dir="${ar ? 'rtl' : 'ltr'}" lang="${lang}">
  <h2 class="part-h">${L.part}</h2>
  <h3>${L.hero}</h3>
  <p class="kick">${esc(site.positioning)}</p>
  <p class="big">${esc(site.fullName)}${ar ? ` <span dir="ltr">(${esc(site.altName)})</span>` : ` (${esc(site.arabicName)})`}</p>
  <p><b>${esc(site.hero.headline)}</b></p><p>${esc(site.hero.subheadline)}</p><p>${esc(site.hero.intro)}</p>
  <p class="meta">${esc(site.brandConcept)} · ${esc(site.tagline)} · ${esc(site.location)}</p>
  <h4>${L.highlights}</h4><table class="grid"><tr>${site.highlights.map(h => `<td><b>${esc(h.value)}</b><br><small>${esc(h.label)}</small></td>`).join('')}</tr></table>

  <h3>${L.about}</h3><p><b>${esc(site.about.lead)}</b></p>${site.about.body.split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')}
  <h4>${L.edu}</h4><ul>${site.about.education.map(e => `<li><b>${esc(e.degree)}</b>${e.institution ? ' — ' + esc(e.institution) : ''} (${esc(e.year)})${e.note ? '. ' + esc(e.note) : ''}</li>`).join('')}</ul>
  <h4>${L.xp}</h4><table><tbody>${site.experience.map(x => `<tr><td class="nw" dir="ltr">${esc(x.period)}</td><td><b>${esc(x.role)}</b> — ${esc(x.org)}<br><small>${esc(x.note)}</small></td></tr>`).join('')}</tbody></table>
  <h4>${L.certs}</h4><ul>${site.certifications.map(c => `<li>${esc(c.name)} — ${esc(c.issuer)}${c.date ? ` (<span dir="ltr">${esc(c.date)}</span>)` : ''}</li>`).join('')}</ul>
  <h4>${L.langs}</h4><p>${site.languages.map(l => `${esc(l.name)}: ${esc(l.level)}`).join(' · ')}</p>
  <div class="cols3"><div><h4>${L.interests}</h4>${ul(site.about.interests)}</div><div><h4>${L.expertise}</h4>${ul(site.about.expertise)}</div><div><h4>${L.dev}</h4>${ul(site.about.development)}</div></div>

  <h3>${L.projects}</h3>
  ${FIELDS.map((k, i) => {
    const ps = projects.filter(p => p.field === k); if (!ps.length) return '';
    return `<h4 class="field">${i + 1}. ${esc(T.fields[k][1])}</h4><p class="meta">${esc(T.fieldInfo[k][0])}<br><b>${esc(ar ? 'المجالات الفرعية' : 'Areas covered')}:</b> ${T.fieldInfo[k][1].map(esc).join(' · ')}</p>` + ps.map(p => `<div class="proj">
      <p class="ptitle"><b>${esc(p.title)}</b> <span class="tag${p.status === 'Conceptual' ? '' : ' live'}">${esc(st(p))} · ${esc(T.phaseOf(p.phase, T.phases[p.phase - 1]))}</span></p>
      <p><i>${esc(p.short)}</i></p>
      <table><tbody>
        <tr><th>${L.counter}</th><td>${esc(p.symptom)} → <b>${esc(p.ingredient)}</b>. ${esc(p.directions)}</td></tr>
        <tr><th>${L.problem}</th><td>${esc(p.problem)}</td></tr>
        <tr><th>${L.why}</th><td>${esc(p.why)}</td></tr>
        <tr><th>${L.solution}</th><td>${esc(p.solution)}</td></tr>
        <tr><th>${L.arch}</th><td>${(p.architecture || []).map(esc).join(ar ? ' ← ' : ' → ')}</td></tr>
        <tr><th>${L.data}</th><td>${(p.data || []).map(esc).join('<br>')}</td></tr>
        <tr><th>${L.tech}</th><td>${(p.technology || []).map(esc).join(' · ')}<br><small>${L.tags}: ${(p.techTags || []).map(t => esc(T.tech[t])).join(' · ')}</small></td></tr>
        <tr><th>${L.impact}</th><td>${(p.impact || []).map(esc).join(' · ')}</td></tr>
        <tr><th>${L.limits}</th><td>${(p.limitations || []).map(esc).join('<br>')}</td></tr>
        <tr><th>${L.review}</th><td>${(p.review || []).map(esc).join('<br>')}</td></tr>
        ${(p.references || []).length ? `<tr><th>${L.refs}</th><td dir="ltr" style="text-align:left">${p.references.map(r => `${esc(r.title)} — ${esc(r.url)}`).join('<br>')}</td></tr>` : ''}
        ${p.demo ? `<tr><th>${L.demo}</th><td dir="ltr" style="text-align:left">/${esc(p.demo)}</td></tr>` : ''}
      </tbody></table></div>`).join('');
  }).join('')}

  <h3>${L.skills}</h3><p class="meta">${esc(T.skillsSub)}</p>
  <table><tbody>${site.skills.map(g => `<tr><th>${esc(g.category)}</th><td>${g.items.map(s => `${esc(s.name)} <small>(${esc(T.levels[s.level])})</small>`).join(' · ')}</td></tr>`).join('')}</tbody></table>

  <h3>${L.research}</h3>${articles.map(a => `<p><b>${esc(a.title)}</b>${a.sample ? ` <span class="tag">${esc(T.sampleChip)}</span>` : ''}<br><small>${esc(a.category)} · ${esc(a.date)}</small></p><p><i>${esc(a.excerpt)}</i></p>${md(a.body)}`).join('')}

  <h3>${L.contact}</h3><p>${esc(site.contact.intro)}</p><p dir="ltr" style="text-align:${ar ? 'right' : 'left'}">Email: ${esc(site.contact.email)} · LinkedIn: ${site.contact.linkedin.includes('your-profile') ? (ar ? 'لم يُضف بعد' : 'not added yet') : esc(site.contact.linkedin)}</p>
  <h4>${L.open}</h4>${ul(site.contact.roles)}

  <h3>${L.seo}</h3><table><tbody>${Object.entries(site.seo).map(([k, v]) => `<tr><th>${esc(k)}</th><td><b>${esc(v.title)}</b><br><small>${esc(v.description)}</small></td></tr>`).join('')}</tbody></table>
</section>`;
}

const live = enProjects.filter(p => p.status !== 'Conceptual');
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Amman' });
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Lujain Abu Ghanemeh — Website content for review</title>
<style>
@page{size:A4;margin:16mm 15mm 16mm}
body{font:10.5pt/1.5 "DejaVu Sans",Arial,sans-serif;color:#13233a;margin:0}
[lang=ar]{font-family:"DejaVu Sans","FreeSerif",sans-serif;line-height:1.75}
h1{font-size:24pt;margin:0 0 4pt;color:#0B1B33}
h2.part-h{font-size:16pt;color:#fff;background:#0B1B33;padding:8pt 12pt;border-radius:6pt;margin:0 0 12pt}
h3{font-size:14pt;color:#0B1B33;border-bottom:2pt solid #2FA79B;padding-bottom:3pt;margin:18pt 0 8pt;break-after:avoid}
h4{font-size:11pt;color:#1d7f75;margin:12pt 0 5pt;break-after:avoid}
h4.field{font-size:12pt;color:#0B1B33;background:#eef7f6;padding:5pt 9pt;border-radius:4pt;margin-top:16pt}
p{margin:0 0 6pt}ul{margin:0 0 6pt;padding-inline-start:16pt}li{margin-bottom:2pt}
table{width:100%;border-collapse:collapse;margin:0 0 8pt;font-size:9.5pt}
th,td{border:0.6pt solid #dfe5ec;padding:4pt 6pt;vertical-align:top;text-align:start}
th{background:#f5f7f9;width:24%;font-weight:bold;color:#33475f}
table.grid td{text-align:center;width:25%}
.nw{white-space:nowrap;width:22%}
.proj{break-inside:avoid;margin-bottom:10pt}
.ptitle{font-size:11.5pt;margin-bottom:3pt}
.tag{display:inline-block;font-size:8pt;font-weight:bold;padding:1pt 6pt;border-radius:8pt;background:#f3ebdf;color:#6b4f2c}
.tag.live{background:#d9f1ee;color:#1d7f75}
.kick{color:#1d7f75;font-weight:bold;font-size:9.5pt}.big{font-size:15pt;font-weight:bold;color:#0B1B33}
.meta,small{color:#55647a}
.cols3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10pt}
.cover{border-bottom:3pt solid #2FA79B;padding-bottom:12pt;margin-bottom:14pt}
.part{break-before:page}
.note{background:#f5f7f9;border-inline-start:3pt solid #2FA79B;padding:8pt 10pt;margin:8pt 0}
</style></head><body>
<div class="cover">
  <h1>Lujain Abu Ghanemeh — لجين أبو غنيمة</h1>
  <p class="kick">Personal portfolio website · full content for review · ${today}</p>
  <p>This document contains the complete text of the website in English and Arabic, plus a description of its structure and interactive features. The site is not yet published on its own domain; links use the placeholder your-domain.com.</p>
</div>
<h3>Website structure and features</h3>
<table><tbody>
<tr><th>Central idea</th><td>${esc(enSite.tagline)}</td></tr>
<tr><th>Positioning</th><td>${esc(enSite.role)}: a pharmacist who understands workflows across the entire pharmaceutical industry — R&amp;D, manufacturing &amp; engineering, quality, regulatory affairs, supply chain &amp; procurement, medical affairs &amp; sales, hospital pharmacy, community pharmacy and pharmacovigilance — and designs AI solutions for them.</td></tr>
<tr><th>Pages</th><td>Home · About · Projects (explorer) · Field guide · ${enProjects.length} project pages · Research · Article · Skills · Contact · 404 — in English (/) and Arabic (/ar/, right-to-left) with a language switch.</td></tr>
<tr><th>Navigation</th><td>Mega menu with three panels: About (profile card, story, experience, skills, education, certifications, languages); Projects (the 8 fields with project counts, links to the counter, cabinet and pipeline); Research (topics and latest article).</td></tr>
<tr><th>Project explorer</th><td>Search box plus filters by field (value-chain map), technology (language models, retrieval, machine learning, statistics, optimization, computer vision, rules, AI agents) and development stage (conceptual, working prototype, working product), with a live result count.</td></tr>
<tr><th>Field guide</th><td>One card per field: description, sub-areas covered and the projects in that field.</td></tr>
<tr><th>Value-chain map</th><td>“From molecule to patient”: 9 stations, one per pharmaceutical field, each with an icon and project count. On the Projects page it filters everything by field.</td></tr>
<tr><th>The AI counter</th><td>Interactive “prescription counter”: the visitor picks a field and a problem (“symptom”), and an animated prescription label prints the AI solution: For / Dispense / Directions / Expected effect / Refills (= development phase).</td></tr>
<tr><th>Medicine cabinet</th><td>Each project is a medicine box (“Active ingredient: AI”) that flips over to show a short leaflet: Indication, Active ingredient, Effects.</td></tr>
<tr><th>Development pipeline</th><td>Projects tracked like a drug pipeline: Problem discovery → Concept design → Prototype → Validation → Deployment.</td></tr>
<tr><th>Project pages</th><td>Same 13-part structure for every project: name, field, real-world problem, why it matters, proposed AI solution, how the system works (diagram), required data, technologies, expected business or clinical impact, limitations and risks, human review and approval, development stage, references.</td></tr>
<tr><th>Live prototype</th><td>${live.map(p => `${esc(p.title)} (/${esc(p.demo)}): runs in the browser; reads inventory and sales files (CSV/Excel); calculates days of cover, stockout dates and lead-time alerts (Critical / High / Warning / Reorder notice), reorder quantities with safety stock, batch-level expiry risk with FEFO sell-through, losses at purchase cost only, data-quality checks; generates a 7-section PDF report. Tested on fictional sample data only.`).join('')}</td></tr>
<tr><th>Honesty rules</th><td>Every project is labelled Conceptual unless built; skills are self-assessed (Learning / Developing / Proficient); no invented qualifications; limitations listed on every project; the pharmacist or specialist makes every final decision.</td></tr>
<tr><th>Technical</th><td>Static, zero-dependency site generator; pre-rendered HTML; per-page SEO titles and descriptions; hreflang EN/AR; Schema.org (Person, CreativeWork, Article); sitemap; robots.txt welcoming AI crawlers; llms.txt; admin panel (Decap CMS) to edit all content in both languages; contact form via Netlify Forms.</td></tr>
<tr><th>Design</th><td>Deep navy, white, teal accent and warm sand (from the portrait); Fraunces + Manrope (English), Amiri + IBM Plex Sans Arabic (Arabic); portrait in an arch frame; animated hero background where hexagonal molecules re-wire into a neural network.</td></tr>
</tbody></table>
<div class="note">Statistics: ${enProjects.length} projects in ${FIELDS.length} fields · ${live.length} working prototype · ${enProjects.length - live.length} conceptual projects.</div>
${part('en')}
${part('ar')}
</body></html>`;
fs.writeFileSync(path.join(ROOT, 'dist/site-content.html'), html);
console.log('ok');
