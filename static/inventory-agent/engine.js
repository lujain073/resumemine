/* Pharmacy Inventory Agent — analysis engine (no dependencies).
   Works in the browser (window.InvEngine) and in Node (module.exports).
   Rules follow the agent specification: stock cover, lead-time alerts, batch-level expiry with FEFO,
   purchase-price-only finance, explicit assumptions, and no invented data. */
(function (root) {
  'use strict';
  const DAY = 86400000;

  // ---------- dates ----------
  const utc = d => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  function parseDate(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date && !isNaN(v)) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
    if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * DAY); // Excel serial
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return mk(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // DD/MM/YYYY (Jordan convention)
    if (m) return mk(+m[3], +m[2], +m[1]);
    m = s.match(/^(\d{1,2})[-/.](\d{4})$/); // MM/YYYY → last day of month (common on packs)
    if (m) return new Date(Date.UTC(+m[2], +m[1], 0));
    return null;
    function mk(y, mo, d) { const x = new Date(Date.UTC(y, mo - 1, d)); return x.getUTCMonth() === mo - 1 ? x : null; }
  }
  const iso = d => d ? new Date(d).toISOString().slice(0, 10) : '';
  const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY);
  const addDays = (d, n) => new Date(utc(d) + n * DAY);

  // ---------- CSV ----------
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const clean = rows.filter(r => r.some(c => String(c).trim() !== ''));
    if (!clean.length) return [];
    const head = clean[0].map(h => String(h).trim());
    return clean.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] == null ? '' : String(r[i]).trim()])));
  }

  // ---------- column mapping ----------
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const INV_COLS = {
    drug: ['drug', 'drugname', 'name', 'medicine', 'medicinename', 'item', 'product', 'productname'],
    stock: ['stock', 'currentstock', 'currentstockquantity', 'quantity', 'qty', 'onhand', 'stockqty', 'stockquantity'],
    dailySales: ['dailysales', 'avgdailysales', 'averagedailysales', 'salesperday', 'dailysale'],
    expiry: ['expiry', 'expirydate', 'expirationdate', 'exp', 'expdate', 'expiration'],
    batch: ['batch', 'batchnumber', 'batchno', 'lot', 'lotnumber', 'lotno'],
    purchasePrice: ['purchaseprice', 'purchasepriceperunit', 'cost', 'costprice', 'unitcost', 'buyprice'],
    sellingPrice: ['sellingprice', 'sellingpriceperunit', 'price', 'retailprice', 'saleprice', 'unitprice'],
    supplier: ['supplier', 'suppliername', 'vendor', 'distributor'],
    leadTime: ['leadtime', 'leadtimedays', 'supplierleadtime', 'supplierleadtimedays', 'deliverydays'],
    minStock: ['minstock', 'minimumstock', 'minimumstocklevel', 'minlevel', 'min'],
    maxStock: ['maxstock', 'maximumstock', 'maximumstocklevel', 'maxlevel', 'max']
  };
  const SALES_COLS = { date: ['date', 'saledate', 'day'], drug: INV_COLS.drug, qty: ['qty', 'quantity', 'unitssold', 'sold', 'sales', 'qtysold', 'quantitysold', 'dailysales'] };
  function mapCols(rows, spec) {
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const map = {};
    for (const f in spec) map[f] = keys.find(k => spec[f].includes(norm(k))) || null;
    return map;
  }
  const num = v => { if (v == null || v === '') return null; const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) && String(v).trim() !== '' ? n : null; };

  // ---------- stats ----------
  const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
  const Z = { 90: 1.28, 95: 1.65, 97.5: 1.96, 99: 2.33 };

  // ---------- main ----------
  function analyze(invRows, salesRows, opt = {}) {
    const today = parseDate(opt.today) || parseDate(new Date());
    const reviewDays = opt.reviewDays ?? 7;
    const service = opt.serviceLevel ?? 95, z = Z[service] || 1.65;
    const histWindow = opt.histWindow ?? 28;
    const issues = [], notes = [];
    const im = mapCols(invRows, INV_COLS);

    // field coverage
    const FIELD_LABEL = { drug: 'Drug name', stock: 'Current stock quantity', dailySales: 'Daily sales', expiry: 'Expiration date', batch: 'Batch number', purchasePrice: 'Purchase price per unit', sellingPrice: 'Selling price per unit', supplier: 'Supplier name', leadTime: 'Supplier lead time (days)', minStock: 'Minimum stock level', maxStock: 'Maximum stock level' };
    const IMPACT = {
      dailySales: 'Average daily sales cannot be calculated without daily sales or sales history; stock cover and stockout dates are unavailable for affected items.',
      expiry: 'Expiry risk cannot be assessed for affected batches.',
      batch: 'Batches cannot be told apart; expiry is monitored per row instead of per batch.',
      purchasePrice: 'Financial values and losses cannot be calculated accurately for affected items (selling price is never used as a substitute).',
      leadTime: 'Critical lead-time alerts and safety-stock reorder quantities cannot be calculated for affected items.',
      minStock: 'Reorder notices based on minimum stock level are not available for affected items.',
      maxStock: 'Reorder quantities are not capped by a maximum stock level for affected items.',
      supplier: 'Reorders cannot be grouped by supplier.', sellingPrice: 'Selling price is informational only; it is not used for loss calculations.'
    };
    const fields = {};
    for (const f in FIELD_LABEL) {
      const col = im[f];
      const present = col ? invRows.filter(r => String(r[col] ?? '').trim() !== '').length : 0;
      fields[f] = { label: FIELD_LABEL[f], column: col, present, total: invRows.length, impact: IMPACT[f] || '' };
    }
    if (!im.drug || !im.stock) {
      return { error: 'The inventory file must contain at least a drug name column and a current stock quantity column.', fields, columns: invRows.length ? Object.keys(invRows[0]) : [] };
    }

    // batches (deduplicated by drug + batch + expiry)
    const seen = new Map(), batches = [];
    invRows.forEach((r, i) => {
      const drug = String(r[im.drug] || '').trim();
      if (!drug) { issues.push({ level: 'warn', text: `Row ${i + 2}: missing drug name — row skipped.` }); return; }
      const qty = num(r[im.stock]);
      if (qty == null) { issues.push({ level: 'warn', text: `Row ${i + 2} (${drug}): stock quantity missing or not a number — row skipped.` }); return; }
      if (qty < 0) issues.push({ level: 'warn', text: `${drug}: negative stock (${qty}) — check the record. Treated as 0.` });
      const batch = im.batch ? String(r[im.batch] || '').trim() : '';
      const rawExp = im.expiry ? r[im.expiry] : '';
      const expiry = parseDate(rawExp);
      if (rawExp && !expiry) issues.push({ level: 'warn', text: `${drug}${batch ? ' / ' + batch : ''}: expiry date "${rawExp}" could not be read.` });
      const key = norm(drug) + '|' + batch + '|' + iso(expiry);
      if (seen.has(key)) { issues.push({ level: 'warn', text: `${drug}${batch ? ' / ' + batch : ''}: duplicate row — counted once to avoid double-counting.` }); return; }
      const b = {
        drug, key: norm(drug), batch, qty: Math.max(0, qty), expiry, rawExp,
        purchasePrice: im.purchasePrice ? num(r[im.purchasePrice]) : null,
        sellingPrice: im.sellingPrice ? num(r[im.sellingPrice]) : null,
        supplier: im.supplier ? String(r[im.supplier] || '').trim() : '',
        leadTime: im.leadTime ? num(r[im.leadTime]) : null,
        minStock: im.minStock ? num(r[im.minStock]) : null,
        maxStock: im.maxStock ? num(r[im.maxStock]) : null,
        dailySales: im.dailySales ? num(r[im.dailySales]) : null
      };
      if (b.purchasePrice != null && b.sellingPrice != null && b.purchasePrice > b.sellingPrice)
        issues.push({ level: 'info', text: `${drug}: purchase price (${b.purchasePrice}) is higher than selling price (${b.sellingPrice}) — please verify.` });
      seen.set(key, b); batches.push(b);
    });

    // sales history
    const sm = salesRows && salesRows.length ? mapCols(salesRows, SALES_COLS) : null;
    const hist = new Map(); let histDays = 0, histStart = null, histEnd = null;
    if (sm) {
      if (!sm.date || !sm.drug || !sm.qty) issues.push({ level: 'warn', text: 'Sales history file is missing a date, drug or quantity column — history ignored.' });
      else {
        const unknown = new Set();
        salesRows.forEach(r => {
          const d = parseDate(r[sm.date]), q = num(r[sm.qty]), k = norm(r[sm.drug] || '');
          if (!d || q == null || !k) return;
          if (!batches.some(b => b.key === k)) unknown.add(String(r[sm.drug]).trim());
          if (!hist.has(k)) hist.set(k, new Map());
          const m = hist.get(k); m.set(iso(d), (m.get(iso(d)) || 0) + q);
          if (!histStart || d < histStart) histStart = d; if (!histEnd || d > histEnd) histEnd = d;
        });
        if (unknown.size) issues.push({ level: 'info', text: `Sales history includes ${unknown.size} item(s) not in the inventory file: ${[...unknown].slice(0, 6).join(', ')}${unknown.size > 6 ? '…' : ''}.` });
        if (histStart) histDays = daysBetween(histStart, histEnd) + 1;
      }
    }

    // per drug
    const byDrug = new Map();
    batches.forEach(b => { if (!byDrug.has(b.key)) byDrug.set(b.key, []); byDrug.get(b.key).push(b); });
    const pick = (arr, f) => { const v = arr.map(b => b[f]).filter(x => x != null && x !== ''); return v.length ? v[0] : null; };
    const drugs = [];
    for (const [key, bs] of byDrug) {
      const isExp = b => b.expiry && daysBetween(today, b.expiry) < 0;
      const d = { key, name: bs[0].drug, batches: bs, stock: bs.filter(b => !isExp(b)).reduce((s, b) => s + b.qty, 0), expiredUnits: bs.filter(isExp).reduce((s, b) => s + b.qty, 0) };
      d.supplier = pick(bs, 'supplier') || ''; d.leadTime = pick(bs, 'leadTime'); d.minStock = pick(bs, 'minStock'); d.maxStock = pick(bs, 'maxStock');
      const prices = bs.filter(b => b.purchasePrice != null);
      d.priceKnown = prices.length === bs.length && bs.length > 0;
      d.value = bs.reduce((s, b) => s + (b.purchasePrice != null ? b.qty * b.purchasePrice : 0), 0);
      d.unitCost = prices.length ? prices.reduce((s, b) => s + b.purchasePrice * b.qty, 0) / Math.max(1, prices.reduce((s, b) => s + b.qty, 0)) : null;

      // demand
      const h = hist.get(key);
      if (h && histEnd) {
        const series = []; for (let i = histDays - 1; i >= 0; i--) series.push(h.get(iso(addDays(histEnd, -i))) || 0);
        d.series = series;
        const win = series.slice(-Math.min(histWindow, series.length));
        d.avg = mean(win); d.sd = sd(win); d.avgSource = `history: mean of last ${win.length} day(s)`; d.historyDays = series.length;
        if (series.length >= 14) {
          const last7 = mean(series.slice(-7)), prev = mean(series.slice(-28, -7).length ? series.slice(-28, -7) : series.slice(0, -7));
          d.avg7 = last7; d.avgPrev = prev;
          d.change = prev > 0 ? (last7 - prev) / prev : (last7 > 0 ? 1 : 0);
          d.trend = d.change >= 0.25 ? 'increasing' : d.change <= -0.25 ? 'decreasing' : 'stable';
        } else d.trend = 'insufficient history';
        if (series.length >= 14) {
          const base = series.slice(0, -1), m = mean(base), s = sd(base), lastV = series[series.length - 1];
          if (s > 0 && Math.abs(lastV - m) / s >= 3) d.unusual = { value: lastV, mean: m, direction: lastV > m ? 'spike' : 'drop' };
        }
      } else {
        const ds = pick(bs, 'dailySales');
        if (ds != null) { d.avg = ds; d.sd = null; d.avgSource = 'daily sales field (single value — no history)'; d.trend = 'insufficient history'; }
        else { d.avg = null; d.avgSource = 'not available'; d.trend = 'insufficient history'; }
      }

      // cover & stockout
      if (d.avg != null && d.avg > 0) {
        d.cover = d.stock / d.avg;
        d.stockoutDate = addDays(today, Math.floor(d.cover));
      } else if (d.avg === 0) { d.cover = Infinity; }
      else d.cover = null;

      // reorder (only with sufficient data)
      d.basis = [];
      if (d.avg != null && d.avg > 0 && d.leadTime != null) {
        const L = d.leadTime;
        d.leadDemand = d.avg * L;
        if (d.sd != null && d.historyDays >= 14) { d.ss = z * d.sd * Math.sqrt(L); d.basis.push(`safety stock = z(${service}%)=${z} × SD ${d.sd.toFixed(2)} × √${L} days = ${d.ss.toFixed(1)}`); }
        else { d.ss = 0; d.basis.push('no safety stock: at least 14 days of sales history are needed to measure variability'); }
        d.rop = d.leadDemand + d.ss;
        d.target = d.avg * (L + reviewDays) + d.ss;
        d.basis.unshift(`demand during lead time + review period = ${d.avg.toFixed(2)}/day × (${L} + ${reviewDays}) days = ${(d.avg * (L + reviewDays)).toFixed(1)}`);
        if (d.maxStock != null && d.target > d.maxStock) { d.target = d.maxStock; d.basis.push(`capped at maximum stock level ${d.maxStock}`); }
        d.reorderQty = Math.max(0, Math.ceil(d.target - d.stock));
        d.basis.push(`order-up-to ${Math.ceil(d.target)} − stock ${d.stock} = ${d.reorderQty}`);
      } else {
        d.reorderQty = null;
        if (d.avg == null) d.basis.push('no reorder quantity: daily sales unknown');
        else if (d.avg === 0) d.basis.push('no reorder needed: no recorded sales');
        else d.basis.push('no reorder quantity: supplier lead time missing');
      }

      // stock alert (most severe first)
      d.alert = null;
      if (d.cover != null && isFinite(d.cover)) {
        if (d.leadTime != null && d.cover < d.leadTime) d.alert = 'Critical';
        else if (d.cover <= 3) d.alert = 'High';
        else if (d.cover <= 7) d.alert = 'Warning';
      }
      if (!d.alert && d.minStock != null && d.stock <= d.minStock * 1.2) d.alert = 'Reorder notice';
      d.status = d.alert || (d.cover == null ? 'Unknown' : d.cover === Infinity ? 'No sales' : d.cover > 180 ? 'Overstock' : 'OK');
      drugs.push(d);
    }

    // expiry per batch with FEFO sell-through
    const expiry = [];
    drugs.forEach(d => {
      const bs = d.batches.filter(b => b.expiry).sort((a, b) => a.expiry - b.expiry);
      let consumedBefore = 0;
      bs.forEach(b => {
        const days = daysBetween(today, b.expiry);
        const cls = days < 0 ? 'Expired' : days <= 30 ? 'Critical' : days <= 60 ? 'High' : days <= 90 ? 'Moderate' : 'Safe';
        let unsold = null, sold = null;
        if (days < 0) { unsold = b.qty; sold = 0; }
        else if (d.avg != null) {
          const demandUntil = d.avg * days;
          sold = Math.min(b.qty, Math.max(0, demandUntil - consumedBefore));
          unsold = Math.max(0, Math.round(b.qty - sold));
          consumedBefore += b.qty;
        }
        const price = b.purchasePrice;
        const e = { drug: d.name, batch: b.batch || '—', expiry: b.expiry, days, cls, qty: b.qty, unsold, expectedSold: sold == null ? null : Math.round(sold), price, value: price != null ? b.qty * price : null, lossValue: price != null && unsold != null ? unsold * price : null };
        e.action = days < 0 ? 'Expired: quarantine immediately and do not dispense; process per return/disposal procedure with the pharmacist.'
          : cls === 'Safe' ? 'No action.'
          : unsold == null ? 'Sales unknown: review stock rotation (FEFO) manually.'
          : unsold > 0 ? `About ${unsold} unit(s) may remain unsold before expiry: dispense this batch first (FEFO), avoid new purchases until it clears, and discuss return-to-supplier options with the pharmacist.`
          : 'Expected to sell before expiry if dispensed first (FEFO). Keep this batch at the front.';
        expiry.push(e);
      });
      d.batches.filter(b => !b.expiry).forEach(b => expiry.push({ drug: d.name, batch: b.batch || '—', expiry: null, days: null, cls: 'Unknown', qty: b.qty, unsold: null, price: b.purchasePrice, value: null, lossValue: null, action: 'Expiry date missing: record it to enable monitoring.' }));
    });
    const sev = { Expired: 0, Critical: 1, High: 2, Moderate: 3, Unknown: 4, Safe: 5 };
    expiry.sort((a, b) => sev[a.cls] - sev[b.cls] || (a.days ?? 9e9) - (b.days ?? 9e9));

    // movers
    const withAvg = drugs.filter(d => d.avg != null).sort((a, b) => b.avg - a.avg);
    const n = withAvg.length, cut = Math.max(1, Math.round(n * 0.2));
    const movers = {
      fast: n ? withAvg.slice(0, cut) : [],
      slow: withAvg.filter(d => d.avg === 0 || (d.cover != null && d.cover > 60)).sort((a, b) => (b.cover === Infinity ? 1e9 : b.cover) - (a.cover === Infinity ? 1e9 : a.cover)),
      increasing: drugs.filter(d => d.trend === 'increasing').sort((a, b) => b.change - a.change),
      decreasing: drugs.filter(d => d.trend === 'decreasing').sort((a, b) => a.change - b.change),
      unusual: drugs.filter(d => d.unusual)
    };

    // finance (purchase price only)
    const priced = batches.filter(b => b.purchasePrice != null);
    const fin = {
      pricedShare: batches.length ? priced.length / batches.length : 0,
      totalValue: priced.reduce((s, b) => s + b.qty * b.purchasePrice, 0),
      nearExpiryValue: expiry.filter(e => ['Expired', 'Critical', 'High', 'Moderate'].includes(e.cls) && e.value != null).reduce((s, e) => s + e.value, 0),
      expiredValue: expiry.filter(e => e.cls === 'Expired' && e.value != null).reduce((s, e) => s + e.value, 0),
      potentialLoss: expiry.filter(e => e.lossValue != null && e.cls !== 'Safe').reduce((s, e) => s + e.lossValue, 0),
      slowValue: drugs.filter(d => d.cover === Infinity || (d.cover != null && d.cover > 120)).reduce((s, d) => s + d.value, 0),
      excess: drugs.filter(d => d.avg > 0 && d.unitCost != null && d.cover > 90).map(d => ({ name: d.name, units: Math.round(d.stock - d.avg * 90), value: (d.stock - d.avg * 90) * d.unitCost })).sort((a, b) => b.value - a.value),
      unpriced: [...new Set(batches.filter(b => b.purchasePrice == null).map(b => b.drug))]
    };
    fin.excessValue = fin.excess.reduce((s, x) => s + x.value, 0);
    fin.savings = fin.potentialLoss + fin.excessValue;

    // alerts
    const alerts = [];
    const rank = { Critical: 0, High: 1, Warning: 2, 'Reorder notice': 3 };
    drugs.filter(d => d.alert).sort((a, b) => rank[a.alert] - rank[b.alert] || a.cover - b.cover).forEach(d => alerts.push({
      type: 'stock', level: d.alert, drug: d.name, stock: d.stock, avg: d.avg, cover: d.cover, stockoutDate: d.stockoutDate, leadTime: d.leadTime,
      action: d.alert === 'Critical' ? `Stock will run out before a new delivery can arrive (lead time ${d.leadTime} days). Order now${d.reorderQty ? ` — suggested ${d.reorderQty} units` : ''}, consider an emergency supplier, and plan patient alternatives with the pharmacist.`
        : d.alert === 'High' ? `Runs out within 3 days. Order today${d.reorderQty ? ` (${d.reorderQty} units)` : ''}.`
        : d.alert === 'Warning' ? `Runs out within 7 days. Include in the next order${d.reorderQty ? ` (${d.reorderQty} units)` : ''}.`
        : `Approaching minimum stock level (${d.minStock}). Review at the next order.`
    }));
    expiry.filter(e => ['Expired', 'Critical', 'High', 'Moderate'].includes(e.cls)).forEach(e => alerts.push({ type: 'expiry', level: e.cls === 'Expired' ? 'Expired' : e.cls === 'Moderate' ? 'Moderate risk' : e.cls + ' risk', drug: e.drug, batch: e.batch, expiry: e.expiry, days: e.days, qty: e.qty, unsold: e.unsold, action: e.action }));

    // action plan
    const actions = { urgent: [], reorder: [], expiry: [], optimize: [] };
    drugs.filter(d => d.alert === 'Critical' || d.alert === 'High').forEach(d => actions.urgent.push(`${d.name}: ${d.alert === 'Critical' ? `stock covers ${d.cover.toFixed(1)} days but supplier lead time is ${d.leadTime} days` : `stock covers ${d.cover.toFixed(1)} days`}. Order${d.reorderQty ? ' ' + d.reorderQty + ' units' : ''} today${d.supplier ? ' from ' + d.supplier.replace(/\.$/, '') : ''}.`));
    expiry.filter(e => e.cls === 'Expired').forEach(e => actions.urgent.push(`${e.drug} batch ${e.batch}: expired ${-e.days} day(s) ago (${e.qty} units). Quarantine — do not dispense.`));
    const bySup = {};
    drugs.filter(d => d.reorderQty > 0 && (d.alert || d.stock <= (d.rop || 0))).forEach(d => { (bySup[d.supplier || 'Supplier not recorded'] ||= []).push(`${d.name} — ${d.reorderQty} units`); });
    Object.entries(bySup).forEach(([s, items]) => actions.reorder.push(`${s}: ${items.join('; ')}.`));
    expiry.filter(e => ['Critical', 'High'].includes(e.cls) && e.unsold > 0).forEach(e => actions.expiry.push(`${e.drug} batch ${e.batch}: ${e.days} days to expiry, ~${e.unsold} of ${e.qty} units may not sell. Dispense first (FEFO), pause purchases, discuss returns.`));
    expiry.filter(e => ['Critical', 'High', 'Moderate'].includes(e.cls) && e.unsold === 0).slice(0, 5).forEach(e => actions.expiry.push(`${e.drug} batch ${e.batch}: expected to clear before expiry — keep it at the front of the shelf.`));
    fin.excess.slice(0, 5).forEach(x => actions.optimize.push(`${x.name}: about ${x.units} units above 90 days of demand${x.value ? ` (≈ ${x.value.toFixed(2)} at purchase cost)` : ''} — skip reorders until cover falls below 90 days.`));
    drugs.filter(d => d.cover === Infinity).forEach(d => actions.optimize.push(`${d.name}: no recorded sales in the period — review whether to keep stocking it.`));
    movers.increasing.slice(0, 3).forEach(d => actions.optimize.push(`${d.name}: demand up ${(d.change * 100).toFixed(0)}% (last 7 days vs previous) — review minimum stock level.`));

    // data notes
    if (histDays) { fields.dailySales.covered = true; fields.dailySales.impact = 'Not needed: average daily sales are calculated from the sales history file.'; }
    if (drugs.some(d => d.expiredUnits)) notes.push('Expired units are excluded from sellable stock, stock cover and reorder calculations.');
    if (!sm) notes.push('No sales history provided: averages come from the daily sales field, so trends, seasonality and safety stock cannot be calculated.');
    else if (histDays) notes.push(`Sales history: ${histDays} days (${iso(histStart)} to ${iso(histEnd)}). Average daily sales use the most recent ${Math.min(histWindow, histDays)} days.`);
    if (histDays && histDays < 365) notes.push('Seasonal patterns need at least one year of history; only recent trends are reported.');
    notes.push(`Reorder quantities use: demand × (lead time + ${reviewDays}-day review period) + safety stock at ${service}% service level, minus current stock, capped at the maximum stock level when provided.`);
    notes.push('Dates in DD/MM/YYYY format are read as day/month (Jordan convention). MM/YYYY expiry dates are read as the last day of that month.');

    const summary = {
      drugs: drugs.length, batches: batches.length, units: drugs.reduce((s, d) => s + d.stock, 0), expiredUnits: drugs.reduce((s, d) => s + d.expiredUnits, 0),
      lowStock: drugs.filter(d => d.alert).length, critical: drugs.filter(d => d.alert === 'Critical').length,
      nearExpiry: expiry.filter(e => ['Critical', 'High', 'Moderate'].includes(e.cls)).length, expired: expiry.filter(e => e.cls === 'Expired').length,
      financialRisk: fin.potentialLoss
    };
    return { today, options: { reviewDays, service, histWindow }, fields, issues, notes, drugs: drugs.sort((a, b) => (a.cover ?? 9e9) - (b.cover ?? 9e9)), expiry, movers, fin, alerts, actions, summary, history: { days: histDays, start: histStart, end: histEnd } };
  }

  // ---------- fictional sample data (relative to the report date) ----------
  function sampleData(todayIn) {
    const today = parseDate(todayIn) || parseDate(new Date());
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pois = l => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
    // name, avg, trend(+/- over 60d), supplier, lead, min, max, cost, sell, batches [[qty, daysToExpiry, batch]]
    const S = [
      ['Amoxicillin 500 mg capsules (20)', 9, 0.3, 'Al-Hikma Distribution', 4, 30, 160, 1.35, 2.1, [[22, 420, 'AMX2611']]],
      ['Paracetamol 500 mg tablets (24)', 26, 0, 'Dar Al-Dawa Supply', 2, 80, 400, 0.42, 0.75, [[180, 300, 'PCM0925'], [140, 540, 'PCM1126']]],
      ['Metformin 850 mg tablets (30)', 11, 0, 'Al-Hikma Distribution', 3, 40, 200, 1.1, 1.8, [[150, 610, 'MET4410']]],
      ['Insulin glargine 100 IU/mL pen', 2.2, 0.05, 'Pharma Cold Chain Co.', 5, 8, 30, 9.8, 13.5, [[6, 210, 'GLA7731']]],
      ['Salbutamol 100 mcg inhaler', 5, 0.9, 'Dar Al-Dawa Supply', 3, 15, 80, 1.9, 3.2, [[33, 380, 'SAL2208']]],
      ['Omeprazole 20 mg capsules (14)', 7, 0, 'Al-Hikma Distribution', 3, 25, 120, 0.95, 1.6, [[44, 450, 'OME5521']]],
      ['Atorvastatin 20 mg tablets (30)', 6, 0, 'Jordan Medical Stores', 4, 20, 120, 2.4, 3.9, [[95, 700, 'ATV1180']]],
      ['Vitamin D3 50,000 IU capsules (4)', 1.1, -0.2, 'Jordan Medical Stores', 5, 5, 40, 2.1, 4.5, [[48, 52, 'VD3K004'], [30, 400, 'VD3K019']]],
      ['Azithromycin 500 mg tablets (3)', 2.4, -0.1, 'Al-Hikma Distribution', 4, 10, 60, 2.6, 4.2, [[70, 24, 'AZI0310'], [20, 500, 'AZI0412']]],
      ['Cetirizine 10 mg tablets (20)', 6, -0.6, 'Dar Al-Dawa Supply', 2, 20, 100, 0.7, 1.3, [[88, 330, 'CET3001']]],
      ['Ibuprofen 400 mg tablets (20)', 10, 0, 'Dar Al-Dawa Supply', 2, 30, 180, 0.65, 1.2, [[120, 480, 'IBU8820']]],
      ['Amlodipine 5 mg tablets (30)', 5, 0, 'Jordan Medical Stores', 4, 15, 90, 1.5, 2.6, [[70, 640, 'AML6612']]],
      ['Losartan 50 mg tablets (30)', 4, 0, 'Jordan Medical Stores', 4, 15, 90, 2.2, 3.6, [[66, 590, 'LOS1902']]],
      ['Levothyroxine 50 mcg tablets (50)', 3, 0, 'Al-Hikma Distribution', 5, 10, 60, 1.6, 2.7, [[40, 420, 'LEV7703']]],
      ['Clopidogrel 75 mg tablets (28)', 2.5, 0, 'Jordan Medical Stores', 5, 10, 50, 3.4, 5.6, [[30, 380, 'CLO2245']]],
      ['Enoxaparin 40 mg syringe', 1.8, 0.1, 'Pharma Cold Chain Co.', 10, 10, 40, 4.9, 7.2, [[12, 260, 'ENX5506']]],
      ['Oral rehydration salts sachets', 6, 0, 'Dar Al-Dawa Supply', 2, 20, 120, 0.25, 0.5, [[110, 500, 'ORS1144']], 'spike'],
      ['Diclofenac 1% gel 50 g', 3, 0, 'Dar Al-Dawa Supply', 3, 10, 60, 1.2, 2.3, [[45, 75, 'DIC9910']]],
      ['Fluconazole 150 mg capsule (1)', 0.4, 0, 'Al-Hikma Distribution', 4, 5, 25, 1.4, 2.8, [[38, 160, 'FLU0021']]],
      ['Ferrous sulfate 200 mg tablets (30)', 1.5, 0, 'Jordan Medical Stores', 4, 8, 50, 0.8, 1.5, [[14, -6, 'FER4432'], [36, 280, 'FER4490']]],
      ['Montelukast 10 mg tablets (28)', 2, 0.3, 'Al-Hikma Distribution', 4, 8, 50, 3.1, 5.2, [[26, 410, 'MON3317']]],
      ['Pantoprazole 40 mg tablets (14)', 3, 0, 'Al-Hikma Distribution', 3, 18, 80, 1.3, 2.2, [[20, 520, 'PAN2028']]],
      ['Dextromethorphan cough syrup 100 mL', 4, 1.2, 'Dar Al-Dawa Supply', 3, 12, 70, 1.05, 2.0, [[38, 88, 'DXM5150']]],
      ['Esomeprazole 40 mg capsules (14)', 2.5, 0, 'Jordan Medical Stores', null, 10, 60, null, 4.4, [[50, 340, '']]]
    ];
    const inv = [], sales = [], H = 60;
    S.forEach(([name, avg, tr, sup, lead, min, max, cost, sell, bs, special]) => {
      bs.forEach(([q, dte, batch]) => inv.push({
        drug_name: name, batch_number: batch, current_stock: q, expiry_date: iso(addDays(today, dte)),
        purchase_price: cost == null ? '' : cost, selling_price: sell, supplier: sup, lead_time_days: lead == null ? '' : lead, min_stock: min, max_stock: max
      }));
      for (let i = H; i >= 1; i--) {
        const f = 1 + tr * ((H - i) / H) - tr / 2;
        let q = pois(Math.max(0.05, avg * f));
        if (special === 'spike' && i === 1) q = Math.round(avg * 5);
        sales.push({ date: iso(addDays(today, -i)), drug_name: name, quantity_sold: q });
      }
    });
    return { inventory: inv, sales };
  }

  const toCSV = rows => { if (!rows.length) return ''; const h = Object.keys(rows[0]); const q = v => /[",\n;]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''); return [h.join(','), ...rows.map(r => h.map(k => q(r[k])).join(','))].join('\n'); };

  const api = { analyze, parseCSV, sampleData, toCSV, parseDate, iso, daysBetween };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.InvEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
