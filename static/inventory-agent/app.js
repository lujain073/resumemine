{
  const E = window.InvEngine, $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { inv: null, sales: null, names: {}, result: null, sample: false, pdfUrl: null };
  const COLOR = { Critical: 'var(--crit)', 'Critical risk': 'var(--crit)', Expired: 'var(--exp)', High: 'var(--high)', 'High risk': 'var(--high)', Warning: 'var(--warn)', 'Moderate risk': 'var(--warn)', Moderate: 'var(--warn)', 'Reorder notice': 'var(--teal-ink)', OK: 'var(--ok)', Safe: 'var(--ok)', Overstock: 'var(--warn)', 'No sales': 'var(--muted)', Unknown: 'var(--muted)' };
  const pill = t => `<span class="pill" style="--c:${COLOR[t] || 'var(--muted)'}">${esc(t)}</span>`;
  const n = (v, d = 1) => v == null ? '—' : v === Infinity ? 'No sales' : (+v).toFixed(d);
  const dt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
  const cur = () => ($('#o-cur').value || 'JOD').trim().slice(0, 4);
  const money = v => v == null ? 'n/a' : `${esc(cur())} ${(+v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const msg = (t, k = 'info') => { const m = $('#msg'); m.className = `msg on ${k}`; m.textContent = t; if (!t) m.className = 'msg'; };

  // Amman date by default
  const amman = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Amman' }).format(new Date());
  $('#o-date').value = amman;

  // ---------- files ----------
  let xlsxLoading;
  const loadXLSX = () => xlsxLoading ||= new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = ok; s.onerror = () => { xlsxLoading = null; no(new Error('xlsx')); }; document.head.appendChild(s); });
  async function readFile(file) {
    if (/\.xlsx?$/i.test(file.name)) {
      try { await loadXLSX(); } catch { throw new Error('Excel support could not load. Please save the sheet as CSV (File → Save As → CSV) and try again.'); }
      const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      return window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
    }
    return E.parseCSV(await file.text());
  }
  async function setFile(k, file) {
    const box = $(k === 'inv' ? '#f-inv' : '#f-sales');
    try {
      const rows = await readFile(file);
      if (!rows.length) throw new Error(`${file.name} has no data rows.`);
      state[k] = rows; state.names[k] = file.name; state.sample = false;
      box.classList.add('has'); box.querySelector('em').textContent = `${file.name} · ${rows.length} rows`;
      msg('');
    } catch (e) { state[k] = null; box.classList.remove('has'); box.querySelector('em').textContent = ''; msg(e.message || 'This file could not be read.', 'err'); }
    $('#run').disabled = !state.inv;
  }
  document.querySelectorAll('.file input').forEach(inp => {
    inp.addEventListener('change', () => inp.files[0] && setFile(inp.dataset.k, inp.files[0]));
    const box = inp.parentElement;
    box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('over'); });
    box.addEventListener('dragleave', () => box.classList.remove('over'));
    box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('over'); if (e.dataTransfer.files[0]) setFile(inp.dataset.k, e.dataTransfer.files[0]); });
  });

  $('#sample').addEventListener('click', () => {
    const d = E.sampleData($('#o-date').value);
    state.inv = d.inventory; state.sales = d.sales; state.sample = true; state.names = { inv: 'sample-inventory.csv', sales: 'sample-sales-60-days.csv' };
    $('#f-inv').classList.add('has'); $('#f-inv em').textContent = `Sample · ${d.inventory.length} batches`;
    $('#f-sales').classList.add('has'); $('#f-sales em').textContent = `Sample · 60 days of sales`;
    $('#run').disabled = false; run();
  });
  $('#run').addEventListener('click', run);

  // ---------- analysis ----------
  function run() {
    msg('');
    const r = E.analyze(state.inv, state.sales || [], { today: $('#o-date').value, reviewDays: +$('#o-review').value, serviceLevel: +$('#o-sl').value });
    if (r.error) { msg(`${r.error} Columns found: ${r.columns.join(', ') || 'none'}.`, 'err'); return; }
    state.result = r; render(r);
    document.getElementById('out').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function table(cols, rows, cls = 'stack') {
    if (!rows.length) return '<p class="note">Nothing to show.</p>';
    return `<div class="scroll"><table class="${cls}"><thead><tr>${cols.map(c => `<th class="${c.n ? 'n' : ''}">${esc(c.h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${cols[i].n ? 'n' : ''}" data-l="${esc(cols[i].h)}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function render(r) {
    const S = r.summary, priced = r.fin.pricedShare > 0;
    const stockAlerts = r.alerts.filter(a => a.type === 'stock'), expAlerts = r.alerts.filter(a => a.type === 'expiry');
    const so = r.drugs.filter(d => d.cover != null && isFinite(d.cover) && (d.alert || d.cover <= 14));
    const exRisk = r.expiry.filter(e => e.cls !== 'Safe');
    const missing = Object.values(r.fields).filter(f => f.present < f.total && !f.covered);

    const alertHTML = r.alerts.length ? r.alerts.map(a => `<div class="al" style="--c:${COLOR[a.level] || 'var(--muted)'}">
      <div class="lv">${esc(a.level)}<small>${a.type === 'stock' ? 'Stock' : 'Expiry'}</small></div>
      <div><b>${esc(a.drug)}</b>${a.batch ? ` <span class="note">· batch ${esc(a.batch)}</span>` : ''}
        <div class="facts">${a.type === 'stock'
          ? `<span>Stock ${a.stock}</span><span>Avg ${n(a.avg, 2)}/day</span><span>${n(a.cover)} days left</span><span>Out by ${dt(a.stockoutDate)}</span>${a.leadTime != null ? `<span>Lead time ${a.leadTime} d</span>` : ''}`
          : `<span>Expires ${dt(a.expiry)}</span><span>${a.days < 0 ? `${-a.days} days ago` : `${a.days} days left`}</span><span>Qty ${a.qty}</span>${a.unsold != null ? `<span>~${a.unsold} may not sell</span>` : ''}`}</div>
        <p>${esc(a.action)}</p></div></div>`).join('') : '';

    const tabs = [
      ['inv', 'Inventory', r.drugs.length],
      ['so', 'Stockout predictions', so.length, stockAlerts.some(a => a.level === 'Critical')],
      ['exp', 'Expiry risk', exRisk.length, exRisk.some(e => e.cls === 'Expired' || e.cls === 'Critical')],
      ['sales', 'Sales analysis'], ['fin', 'Financial'], ['plan', 'Action plan', r.actions.urgent.length, r.actions.urgent.length > 0],
      ['dq', 'Data quality', missing.length + r.issues.length]
    ];

    $('#out').innerHTML = `
    <div class="res-head">
      <div><h2>Inventory report · ${dt(r.today)}</h2><p>${esc(state.names.inv || '')}${state.sales ? ' + ' + esc(state.names.sales) : ''}${state.sample ? ' — fictional sample pharmacy for demonstration' : ''}</p></div>
      <div class="btns"><button class="btn dark" id="pdf" type="button">Create PDF report</button></div>
    </div>
    <div class="tiles">
      <div class="tile"><b>${S.drugs}</b><span>Medicines monitored</span></div>
      <div class="tile"><b>${S.units.toLocaleString('en')}</b><span>Sellable units${S.expiredUnits ? ` (+${S.expiredUnits} expired)` : ''}</span></div>
      <div class="tile ${S.lowStock ? 'bad' : 'good'}"><b>${S.lowStock}</b><span>Low-stock medicines</span></div>
      <div class="tile ${S.critical ? 'bad' : 'good'}"><b>${S.critical}</b><span>Critical stockout risks</span></div>
      <div class="tile ${S.nearExpiry + S.expired ? 'bad' : 'good'}"><b>${S.nearExpiry}${S.expired ? `<small style="font-size:.5em"> +${S.expired} expired</small>` : ''}</b><span>Batches expiring ≤ 90 days</span></div>
      <div class="tile"><b>${priced ? money(S.financialRisk) : 'n/a'}</b><span>${priced ? 'Estimated loss at cost' : 'Purchase prices missing'}</span></div>
    </div>
    <section class="alerts" aria-label="Alerts">
      <header><h3>Alerts</h3><span class="note" style="margin:0">${stockAlerts.length} stock · ${expAlerts.length} expiry</span></header>
      ${stockAlerts.some(a => a.level === 'Critical') ? '' : '<div class="ok-line">No critical stockout alerts were identified.</div>'}
      <div class="alert-list">${alertHTML}</div>
    </section>
    <div class="tabs" role="tablist">${tabs.map(([id, l, c, red], i) => `<button role="tab" id="t-${id}" aria-controls="p-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(l)}${c != null ? `<span class="n${red ? ' r' : ''}">${c}</span>` : ''}</button>`).join('')}</div>

    <div class="pane" role="tabpanel" id="p-inv" aria-labelledby="t-inv">
      <div class="pane-tools"><input type="search" id="q" placeholder="Search medicines" aria-label="Search medicines"><span class="note" style="margin:0">Sorted by days of cover, shortest first</span></div>
      <div id="inv-table">${invTable(r.drugs)}</div>
    </div>

    <div class="pane" role="tabpanel" id="p-so" aria-labelledby="t-so" hidden>
      <p class="note">Medicines with an alert or less than 14 days of cover. Open “how” to see each reorder calculation.</p>
      ${table([{ h: 'Drug name' }, { h: 'Current stock', n: 1 }, { h: 'Avg daily sales', n: 1 }, { h: 'Est. stockout', n: 1 }, { h: 'Lead time', n: 1 }, { h: 'Risk level' }, { h: 'Reorder qty', n: 1 }],
        so.map(d => [`<b>${esc(d.name)}</b>${d.supplier ? `<div class="why">${esc(d.supplier)}</div>` : ''}<details class="why"><summary>how</summary>${d.basis.map(esc).join('<br>')}</details>`, d.stock, n(d.avg, 2), dt(d.stockoutDate), d.leadTime != null ? d.leadTime + ' d' : '—', pill(d.alert || 'OK'), d.reorderQty ?? 'n/a']))}
    </div>

    <div class="pane" role="tabpanel" id="p-exp" aria-labelledby="t-exp" hidden>
      <p class="note">Per batch. “May not sell” assumes earliest-expiring batches are dispensed first at today’s average sales.</p>
      ${table([{ h: 'Drug · batch' }, { h: 'Expiry', n: 1 }, { h: 'Days left', n: 1 }, { h: 'Risk' }, { h: 'Qty', n: 1 }, { h: 'May not sell', n: 1 }, { h: 'Value at risk', n: 1 }, { h: 'Recommended action' }],
        exRisk.map(e => [`<b>${esc(e.drug)}</b><div class="why">Batch ${esc(e.batch)}</div>`, dt(e.expiry), e.days ?? '—', pill(e.cls), e.qty, e.unsold ?? '?', e.lossValue != null ? money(e.lossValue) : (e.price == null ? 'no cost' : money(0)), esc(e.action)]))}
      ${exRisk.length ? '' : '<p class="note">No batches expire within 90 days.</p>'}
    </div>

    <div class="pane" role="tabpanel" id="p-sales" aria-labelledby="t-sales" hidden>
      <p class="note">Actual sales: ${r.history.days ? `${r.history.days} days of history` : 'daily sales field only'}. Trends compare the last 7 days with the previous 21 days — estimates, not certainties.</p>
      <h4>Fast-moving</h4>${table([{ h: 'Drug' }, { h: 'Avg / day', n: 1 }, { h: 'Days of cover', n: 1 }], r.movers.fast.map(d => [esc(d.name), n(d.avg, 2), n(d.cover)]))}
      <h4>Slow-moving</h4>${table([{ h: 'Drug' }, { h: 'Avg / day', n: 1 }, { h: 'Days of cover', n: 1 }], r.movers.slow.map(d => [esc(d.name), n(d.avg, 2), n(d.cover)]))}
      <h4>Changing demand</h4>${r.history.days >= 14 ? table([{ h: 'Drug' }, { h: 'Trend' }, { h: 'Last 7 days', n: 1 }, { h: 'Previous', n: 1 }, { h: 'Change', n: 1 }],
        [...r.movers.increasing, ...r.movers.decreasing].map(d => [esc(d.name), esc(d.trend), n(d.avg7, 2), n(d.avgPrev, 2), `${d.change > 0 ? '+' : ''}${(d.change * 100).toFixed(0)}%`])) : '<p class="note">Needs at least 14 days of sales history.</p>'}
      <h4>Unusual sales days</h4>${table([{ h: 'Drug' }, { h: 'Latest day', n: 1 }, { h: 'Usual average', n: 1 }, { h: 'Type' }], r.movers.unusual.map(d => [esc(d.name), d.unusual.value, n(d.unusual.mean, 2), esc(d.unusual.direction)]))}
    </div>

    <div class="pane" role="tabpanel" id="p-fin" aria-labelledby="t-fin" hidden>
      ${priced ? `<p class="note">All values at purchase cost. Selling price is never used to estimate losses.${r.fin.unpriced.length ? ` Excluded (no purchase price): ${esc(r.fin.unpriced.join(', '))}.` : ''}</p>
      <div class="kv">
        <div><small>Total inventory value</small><b>${money(r.fin.totalValue)}</b></div>
        <div><small>Expiring ≤ 90 days (incl. expired)</small><b>${money(r.fin.nearExpiryValue)}</b></div>
        <div><small>Already expired</small><b>${money(r.fin.expiredValue)}</b></div>
        <div class="strong"><small>Estimated potential loss</small><b>${money(r.fin.potentialLoss)}</b></div>
        <div><small>Slow-moving exposure</small><b>${money(r.fin.slowValue)}</b></div>
        <div class="strong"><small>Potential savings</small><b>${money(r.fin.savings)}</b></div>
      </div>
      <h4>Stock above 90 days of demand</h4>${table([{ h: 'Drug' }, { h: 'Extra units', n: 1 }, { h: 'Value', n: 1 }], r.fin.excess.map(x => [esc(x.name), x.units, money(x.value)]))}`
      : '<p class="note"><b>Financial loss cannot be accurately calculated:</b> the inventory file has no purchase prices.</p>'}
    </div>

    <div class="pane" role="tabpanel" id="p-plan" aria-labelledby="t-plan" hidden>
      <div class="plan">
        ${[['1. Urgent actions', r.actions.urgent, 'No urgent actions today.'], ['2. Reorder by supplier', r.actions.reorder, 'No reorders needed.'], ['3. Near-expiry stock', r.actions.expiry, 'Nothing to act on.'], ['4. Stock optimization', r.actions.optimize, 'No suggestions.']]
          .map(([h, a, e]) => `<section><h4>${h}</h4>${a.length ? `<ol>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : `<p class="note">${e}</p>`}</section>`).join('')}
      </div>
      <p class="note" style="margin-top:12px">The agent never places orders, edits records or removes medicines. The pharmacist approves every action.</p>
    </div>

    <div class="pane" role="tabpanel" id="p-dq" aria-labelledby="t-dq" hidden>
      <h4>Missing information</h4>
      ${missing.length ? table([{ h: 'Field' }, { h: 'Provided', n: 1 }, { h: 'Effect on the analysis' }], missing.map(f => [esc(f.label), `${f.present}/${f.total}`, esc(f.impact)])) : '<p class="note">All fields were provided for every row.</p>'}
      <h4>Records to check</h4>${r.issues.length ? `<ul class="issues">${r.issues.map(i => `<li>${esc(i.text)}</li>`).join('')}</ul>` : '<p class="note">No inconsistencies found.</p>'}
      <h4>Assumptions</h4><ul class="issues">${r.notes.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
    <div id="pdf-box"></div>`;

    // tabs
    const tabBtns = [...document.querySelectorAll('[role=tab]')];
    const show = b => { tabBtns.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); };
    tabBtns.forEach((b, i) => { b.addEventListener('click', () => show(b)); b.addEventListener('keydown', e => { const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (k) { const nb = tabBtns[(i + k + tabBtns.length) % tabBtns.length]; show(nb); nb.focus(); } }); });
    $('#q').addEventListener('input', e => { const q = e.target.value.toLowerCase(); $('#inv-table').innerHTML = invTable(r.drugs.filter(d => d.name.toLowerCase().includes(q))); });
    $('#pdf').addEventListener('click', makePDF);
  }

  function invTable(drugs) {
    return table([{ h: 'Drug name' }, { h: 'Current qty', n: 1 }, { h: 'Avg daily sales', n: 1 }, { h: 'Days of cover', n: 1 }, { h: 'Status' }, { h: 'Trend' }],
      drugs.map(d => [`<b>${esc(d.name)}</b><div class="why">${d.batches.length} batch${d.batches.length > 1 ? 'es' : ''} · ${esc(d.avgSource)}</div>`, d.stock + (d.expiredUnits ? `<div class="why">+${d.expiredUnits} expired</div>` : ''), n(d.avg, 2),
        `${n(d.cover)}${d.cover != null && isFinite(d.cover) ? `<div class="bar" style="--c:${COLOR[d.status] || 'var(--teal)'}"><i style="width:${Math.min(100, d.cover / 60 * 100)}%"></i></div>` : ''}`, pill(d.status), esc(d.trend)]));
  }

  // ---------- PDF ----------
  let pdfLoading;
  const loadPDF = () => pdfLoading ||= new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/pdf-lib.min.js'; s.onload = ok; s.onerror = () => { pdfLoading = null; no(); }; document.head.appendChild(s); });
  async function makePDF() {
    const b = $('#pdf'); b.disabled = true; b.textContent = 'Creating PDF…';
    try {
      await loadPDF();
      const r = state.result;
      const bytes = await window.InvReport.build(r, { date: E.iso(r.today), currency: cur(), pharmacy: state.sample ? 'Sample Pharmacy (fictional data)' : 'Pharmacy', generated: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Amman', dateStyle: 'medium', timeStyle: 'short' }) + ' (Amman)', author: 'Pharmacy Inventory Agent — prototype by Lujain Abu Ghanemeh' });
      if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);
      state.pdfUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const name = `inventory-report-${E.iso(r.today)}.pdf`;
      $('#pdf-box').innerHTML = `<div class="pdf-view"><header><b>${esc(name)}</b><div class="btns"><a class="btn primary" href="${state.pdfUrl}" download="${esc(name)}">Download PDF</a></div></header><iframe title="PDF report preview" src="${state.pdfUrl}"></iframe></div>`;
      $('#pdf-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { console.error(e); msg('The PDF could not be created in this browser. Please try another browser.', 'err'); }
    finally { b.disabled = false; b.textContent = 'Create PDF report'; }
  }

  // ---------- templates ----------
  const tpl = () => E.toCSV(E.sampleData($('#o-date').value).inventory.slice(0, 4));
  $('#tpl-copy').addEventListener('click', async () => {
    const t = tpl(), pre = $('#tpl'); pre.hidden = false; pre.textContent = t;
    try { await navigator.clipboard.writeText(t); $('#tpl-copy').textContent = 'Copied'; } catch { $('#tpl-copy').textContent = 'Select the text below'; }
    setTimeout(() => { $('#tpl-copy').textContent = 'Copy inventory template'; }, 2200);
  });
  $('#tpl-dl').addEventListener('click', () => {
    const d = E.sampleData($('#o-date').value);
    [['inventory-template.csv', E.toCSV(d.inventory)], ['sales-history-template.csv', E.toCSV(d.sales)]].forEach(([f, c]) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + c], { type: 'text/csv' })); a.download = f; document.body.appendChild(a); a.click(); a.remove();
    });
  });
}
