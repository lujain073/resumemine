/* Daily PDF report (7 sections + data quality) built with pdf-lib, entirely in the browser. */
(function () {
  'use strict';
  const NAVY = [11 / 255, 27 / 255, 51 / 255], TEAL = [47 / 255, 167 / 255, 155 / 255], SAND = [232 / 255, 220 / 255, 203 / 255];
  const INK = [0.09, 0.15, 0.23], MUTED = [0.36, 0.42, 0.5], LINE = [0.88, 0.9, 0.93], SOFT = [0.965, 0.972, 0.98];
  const LVL = { Critical: [0.75, 0.16, 0.16], Expired: [0.55, 0.05, 0.05], High: [0.85, 0.42, 0.08], Warning: [0.8, 0.6, 0.05], 'Reorder notice': TEAL, Moderate: [0.8, 0.6, 0.05], Safe: [0.13, 0.55, 0.35], OK: [0.13, 0.55, 0.35] };

  // Standard PDF fonts only support WinAnsi characters
  const safe = s => String(s ?? '').replace(/[≈]/g, '~').replace(/[√]/g, 'sqrt ').replace(/[−–]/g, '-').replace(/[→]/g, '->').replace(/[←]/g, '<-')
    .replace(/[≤]/g, '<=').replace(/[≥]/g, '>=').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF—•…]/g, '');

  async function build(r, meta) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Pharmacy Inventory Report ${meta.date}`); pdf.setAuthor(meta.author || 'Pharmacy Inventory Agent'); pdf.setSubject('Daily inventory, stockout and expiry report');
    const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold);
    const W = 595.28, H = 841.89, M = 40, CW = W - 2 * M;
    const C = a => rgb(a[0], a[1], a[2]);
    let page, y;
    const pages = [];
    const newPage = () => { page = pdf.addPage([W, H]); pages.push(page); y = H - M; };
    const ensure = h => { if (y - h < M + 24) { newPage(); return true; } return false; };
    const width = (t, f, s) => f.widthOfTextAtSize(safe(t), s);
    const wrap = (t, f, s, w) => {
      const out = []; safe(t).split('\n').forEach(par => {
        let line = ''; par.split(' ').forEach(word => {
          const test = line ? line + ' ' + word : word;
          if (width(test, f, s) <= w) line = test;
          else { if (line) out.push(line); while (width(word, f, s) > w) { let k = word.length; while (k > 1 && width(word.slice(0, k), f, s) > w) k--; out.push(word.slice(0, k)); word = word.slice(k); } line = word; }
        }); out.push(line);
      }); return out;
    };
    const text = (t, x, yy, { f = F, s = 9.5, c = INK } = {}) => page.drawText(safe(t), { x, y: yy, size: s, font: f, color: C(c) });
    const para = (t, { f = F, s = 9.5, c = INK, gap = 4, indent = 0 } = {}) => {
      wrap(t, f, s, CW - indent).forEach(l => { ensure(s + 3); text(l, M + indent, y - s, { f, s, c }); y -= s + 3; }); y -= gap;
    };
    const bullet = (t, c = INK) => {
      const lines = wrap(t, F, 9.5, CW - 14);
      lines.forEach((l, i) => { ensure(13); if (i === 0) page.drawCircle({ x: M + 4, y: y - 6.5, size: 1.8, color: C(TEAL) }); text(l, M + 14, y - 9.5, { c }); y -= 12.5; }); y -= 2;
    };
    const h1 = (n, t) => {
      ensure(60); y -= 8;
      page.drawRectangle({ x: M, y: y - 26, width: CW, height: 26, color: C(SOFT) });
      page.drawRectangle({ x: M, y: y - 26, width: 3, height: 26, color: C(TEAL) });
      text(`Section ${n}`, M + 12, y - 17, { f: B, s: 8.5, c: TEAL });
      text(t, M + 70, y - 17.5, { f: B, s: 12.5, c: NAVY });
      y -= 38;
    };
    const h2 = t => { ensure(30); text(t, M, y - 11, { f: B, s: 10.5, c: NAVY }); y -= 18; };

    function table(cols, rows, { empty = 'None.', size = 8.2 } = {}) {
      if (!rows.length) { para(empty, { c: MUTED }); return; }
      const total = cols.reduce((s, c) => s + c.w, 0), ws = cols.map(c => c.w / total * CW);
      const head = () => {
        const hl = cols.map((c, i) => wrap(c.h, B, size, ws[i] - 8)), hh = Math.max(...hl.map(l => l.length)) * (size + 2) + 8;
        ensure(hh + 18);
        page.drawRectangle({ x: M, y: y - hh, width: CW, height: hh, color: C(NAVY) });
        let x = M; hl.forEach((ls, i) => { ls.forEach((l, j) => { const tx = cols[i].a === 'r' ? x + ws[i] - 4 - width(l, B, size) : x + 4; text(l, tx, y - 5 - (j + 1) * (size + 2) + 2, { f: B, s: size, c: [1, 1, 1] }); }); x += ws[i]; });
        y -= hh;
      };
      head();
      rows.forEach((row, ri) => {
        const cells = cols.map((c, i) => { const v = row[i]; const o = v && typeof v === 'object' && !Array.isArray(v) ? v : { t: v }; return { ...o, lines: wrap(o.t == null || o.t === '' ? '—' : o.t, o.b ? B : F, size, ws[i] - 8) }; });
        const rh = Math.max(...cells.map(c => c.lines.length)) * (size + 2) + 7;
        if (ensure(rh)) head();
        if (ri % 2) page.drawRectangle({ x: M, y: y - rh, width: CW, height: rh, color: C(SOFT) });
        let x = M;
        cells.forEach((c, i) => {
          if (c.badge) { const bw = width(c.lines[0], B, size - 0.5) + 10; page.drawRectangle({ x: x + 3, y: y - 4 - (size + 5), width: Math.min(bw, ws[i] - 6), height: size + 5, color: C(c.badge), opacity: 0.14 }); }
          c.lines.forEach((l, j) => { const f = c.b || c.badge ? B : F; const tx = cols[i].a === 'r' ? x + ws[i] - 4 - width(l, f, size) : x + (c.badge ? 8 : 4); text(l, tx, y - 4 - (j + 1) * (size + 2) + 2, { f, s: size, c: c.badge || c.c || INK }); });
          x += ws[i];
        });
        page.drawLine({ start: { x: M, y: y - rh }, end: { x: M + CW, y: y - rh }, thickness: 0.5, color: C(LINE) });
        y -= rh;
      });
      y -= 10;
    }

    const n = (v, d = 1) => v == null ? '—' : v === Infinity ? 'No sales' : (+v).toFixed(d);
    const money = v => v == null ? 'n/a' : `${meta.currency} ${(+v).toFixed(2)}`;
    const dt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
    const priced = r.fin.pricedShare > 0;

    // ---------- cover ----------
    newPage();
    page.drawRectangle({ x: 0, y: H - 150, width: W, height: 150, color: C(NAVY) });
    page.drawRectangle({ x: 0, y: H - 153, width: W, height: 3, color: C(TEAL) });
    text('Daily Pharmacy Inventory Report', M, H - 62, { f: B, s: 22, c: [1, 1, 1] });
    text(meta.pharmacy || 'Pharmacy', M, H - 86, { s: 12, c: SAND });
    text(`Report date: ${dt(r.today)}   ·   Generated: ${meta.generated}`, M, H - 108, { s: 9.5, c: [0.8, 0.85, 0.9] });
    text('Decision support only. All purchasing, stock and disposal decisions require pharmacist approval.', M, H - 126, { s: 8.5, c: [0.7, 0.76, 0.83] });
    y = H - 175;

    // ---------- 1. executive summary ----------
    h1(1, 'Executive summary');
    const S = r.summary;
    const tiles = [['Medicines monitored', S.drugs], ['Sellable units in stock', S.units], ['Low-stock medicines', S.lowStock], ['Critical stockout risks', S.critical], ['Near-expiry batches (90 days)', S.nearExpiry + (S.expired ? ` (+${S.expired} expired)` : '')], ['Estimated financial risk', priced ? money(S.financialRisk) : 'Not available']];
    const tw = (CW - 10) / 3;
    tiles.forEach(([k, v], i) => {
      const x = M + (i % 3) * (tw + 5), ty = y - Math.floor(i / 3) * 56;
      page.drawRectangle({ x, y: ty - 50, width: tw, height: 50, borderColor: C(LINE), borderWidth: 0.8, color: C([1, 1, 1]) });
      text(String(v), x + 10, ty - 26, { f: B, s: 16, c: i === 3 && S.critical ? LVL.Critical : NAVY });
      text(k, x + 10, ty - 42, { s: 8, c: MUTED });
    });
    y -= 120;
    if (!r.alerts.some(a => a.type === 'stock' && a.level === 'Critical')) para('No critical stockout alerts were identified today.', { f: B, c: LVL.Safe });
    else para(`${S.critical} medicine(s) will run out before a new delivery can arrive. See Section 7 for urgent actions.`, { f: B, c: LVL.Critical });
    if (!priced) para('Purchase prices are missing, so financial loss cannot be calculated accurately. Selling prices are never used as a substitute.', { c: MUTED });
    r.notes.forEach(t => para(t, { s: 8.5, c: MUTED, gap: 2 }));

    // ---------- 2. inventory overview ----------
    h1(2, 'Inventory overview');
    table([{ h: 'Drug name', w: 3.4 }, { h: 'Current qty', w: 1, a: 'r' }, { h: 'Avg daily sales', w: 1.1, a: 'r' }, { h: 'Days of cover', w: 1.1, a: 'r' }, { h: 'Stock status', w: 1.4 }],
      r.drugs.map(d => [d.name, d.stock, n(d.avg, 2), n(d.cover), { t: d.status, badge: LVL[d.status] || (d.status === 'Overstock' ? LVL.Warning : MUTED) }]));

    // ---------- 3. sales analysis ----------
    h1(3, 'Sales analysis');
    para('Averages below are actual sales from the data provided. Trends compare the last 7 days with the previous 21 days and are estimates, not guarantees.', { s: 8.5, c: MUTED });
    h2('Fast-moving medicines');
    table([{ h: 'Drug', w: 3.4 }, { h: 'Avg daily sales', w: 1.2, a: 'r' }, { h: 'Days of cover', w: 1.1, a: 'r' }], r.movers.fast.map(d => [d.name, n(d.avg, 2), n(d.cover)]));
    h2('Slow-moving medicines');
    table([{ h: 'Drug', w: 3.4 }, { h: 'Avg daily sales', w: 1.2, a: 'r' }, { h: 'Days of cover', w: 1.1, a: 'r' }], r.movers.slow.map(d => [d.name, n(d.avg, 2), n(d.cover)]));
    h2('Changing demand');
    table([{ h: 'Drug', w: 3 }, { h: 'Trend', w: 1.1 }, { h: 'Last 7 days avg', w: 1.2, a: 'r' }, { h: 'Previous avg', w: 1.1, a: 'r' }, { h: 'Change', w: 0.9, a: 'r' }],
      [...r.movers.increasing, ...r.movers.decreasing].map(d => [d.name, d.trend, n(d.avg7, 2), n(d.avgPrev, 2), `${d.change > 0 ? '+' : ''}${(d.change * 100).toFixed(0)}%`]), { empty: r.history.days >= 14 ? 'No significant changes in demand.' : 'Not assessable: at least 14 days of sales history are needed.' });
    h2('Unusual sales changes');
    table([{ h: 'Drug', w: 3 }, { h: 'Latest day', w: 1, a: 'r' }, { h: 'Usual average', w: 1.1, a: 'r' }, { h: 'Type', w: 1 }], r.movers.unusual.map(d => [d.name, d.unusual.value, n(d.unusual.mean, 2), d.unusual.direction]), { empty: 'No unusual daily sales detected.' });

    // ---------- 4. stockout predictions ----------
    h1(4, 'Stockout predictions');
    const so = r.drugs.filter(d => d.cover != null && isFinite(d.cover) && (d.alert || d.cover <= 14));
    table([{ h: 'Drug name', w: 2.8 }, { h: 'Current stock', w: 0.9, a: 'r' }, { h: 'Avg daily sales', w: 0.9, a: 'r' }, { h: 'Est. stockout date', w: 1.2 }, { h: 'Lead time (days)', w: 0.9, a: 'r' }, { h: 'Risk level', w: 1.1 }, { h: 'Reorder qty', w: 0.9, a: 'r' }],
      so.map(d => [d.name, d.stock, n(d.avg, 2), dt(d.stockoutDate), d.leadTime ?? '—', { t: d.alert || 'Low', badge: LVL[d.alert] || LVL.OK }, d.reorderQty ?? 'n/a']), { empty: 'No medicine is expected to run out within 14 days.' });
    h2('How reorder quantities were calculated');
    so.filter(d => d.reorderQty).slice(0, 8).forEach(d => bullet(`${d.name}: ${d.basis.join('; ')}.`));

    // ---------- 5. expiry ----------
    h1(5, 'Expiry risk analysis');
    para('Classification per batch: Critical <= 30 days, High <= 60 days, Moderate <= 90 days. Unsold quantity assumes First-Expired-First-Out dispensing at the current average daily sales.', { s: 8.5, c: MUTED });
    const ex = r.expiry.filter(e => e.cls !== 'Safe');
    table([{ h: 'Drug name', w: 2.3 }, { h: 'Batch', w: 0.9 }, { h: 'Expiry date', w: 1 }, { h: 'Days left', w: 0.7, a: 'r' }, { h: 'Qty at risk', w: 0.8, a: 'r' }, { h: 'Est. value', w: 0.9, a: 'r' }, { h: 'Recommended action', w: 3 }],
      ex.map(e => [{ t: e.drug, b: true }, e.batch, dt(e.expiry), e.days ?? '—', e.unsold == null ? `${e.qty} (sales unknown)` : `${e.unsold} of ${e.qty}`, e.lossValue != null ? money(e.lossValue) : e.price == null ? 'no cost' : money(0), { t: e.action, c: e.cls === 'Expired' || e.cls === 'Critical' ? LVL.Critical : INK }]), { empty: 'No batches expire within 90 days.', size: 7.8 });

    // ---------- 6. finance ----------
    h1(6, 'Financial analysis');
    if (!priced) para('Financial loss cannot be accurately calculated: no purchase prices were provided.', { f: B, c: LVL.Critical });
    else {
      table([{ h: 'Measure (at purchase cost)', w: 3 }, { h: 'Value', w: 1.2, a: 'r' }], [
        ['Total inventory value', money(r.fin.totalValue)],
        ['Value of batches expiring within 90 days (incl. expired)', money(r.fin.nearExpiryValue)],
        ['Already expired stock', money(r.fin.expiredValue)],
        [{ t: 'Estimated potential loss (expired + expected unsold before expiry)', b: true }, { t: money(r.fin.potentialLoss), b: true }],
        ['Slow-moving stock exposure (cover > 120 days or no sales)', money(r.fin.slowValue)],
        ['Capital above 90 days of demand', money(r.fin.excessValue)],
        [{ t: 'Potential savings from better inventory management', b: true }, { t: money(r.fin.savings), b: true }]
      ]);
      if (r.fin.unpriced.length) para(`Purchase price missing for: ${r.fin.unpriced.join(', ')}. These items are excluded from all values above.`, { s: 8.5, c: MUTED });
      h2('Opportunities to reduce unnecessary purchases');
      table([{ h: 'Drug', w: 3 }, { h: 'Units above 90-day demand', w: 1.3, a: 'r' }, { h: 'Value', w: 1, a: 'r' }], r.fin.excess.slice(0, 10).map(x => [x.name, x.units, money(x.value)]), { empty: 'No medicine holds more than 90 days of demand.' });
    }

    // ---------- 7. action plan ----------
    h1(7, 'Pharmacist action plan');
    const block = (t, arr, empty) => { h2(t); if (!arr.length) para(empty, { c: MUTED }); else arr.forEach(a => bullet(a)); y -= 4; };
    block('1. Urgent actions', r.actions.urgent, 'No urgent actions today.');
    block('2. Reordering recommendations (grouped by supplier)', r.actions.reorder, 'No reorders needed today.');
    block('3. Near-expiry inventory actions', r.actions.expiry, 'No near-expiry actions needed.');
    block('4. Stock optimization recommendations', r.actions.optimize, 'No optimization suggestions.');
    para('The agent never places orders, edits inventory records or disposes of medicines. Every action above needs pharmacist review and approval.', { s: 8.5, c: MUTED });

    // ---------- data quality ----------
    h1('A', 'Data quality and missing information');
    table([{ h: 'Field', w: 2 }, { h: 'Coverage', w: 0.9, a: 'r' }, { h: 'Effect on the analysis', w: 4 }],
      Object.values(r.fields).filter(f => f.present < f.total).map(f => [f.label, f.covered ? 'history' : `${f.present}/${f.total}`, f.impact]), { empty: 'All fields were provided for every row.' });
    if (r.issues.length) { h2('Records to check'); r.issues.forEach(i => bullet(i.text)); }

    // footers
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: M, y: 30 }, end: { x: W - M, y: 30 }, thickness: 0.5, color: C(LINE) });
      p.drawText(safe(`${meta.pharmacy || 'Pharmacy'} · Inventory report ${dt(r.today)} · Pharmacist approval required`), { x: M, y: 18, size: 7.5, font: F, color: C(MUTED) });
      const t = `Page ${i + 1} of ${pages.length}`; p.drawText(t, { x: W - M - F.widthOfTextAtSize(t, 7.5), y: 18, size: 7.5, font: F, color: C(MUTED) });
    });
    return pdf.save();
  }
  window.InvReport = { build };
})();
