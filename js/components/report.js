/* report.js – shows a report in a modal with "Print / Save as PDF" and "Download CSV".
   sections: [{ heading, kv?: [[label, value]], columns?: [..], rows?: [[..]] }] */
import { openModal } from './modal.js';
import { esc } from '../core/dom.js';

const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function toCSV(title, sections) {
  const lines = [csvCell(title), ''];
  sections.forEach(s => {
    lines.push(csvCell(s.heading));
    if (s.kv) s.kv.forEach(([k, v]) => lines.push([k, v].map(csvCell).join(',')));
    if (s.columns) { lines.push(s.columns.map(csvCell).join(',')); s.rows.forEach(r => lines.push(r.map(csvCell).join(','))); }
    lines.push('');
  });
  return lines.join('\r\n');
}
export function downloadFile(name, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openReport({ title, subtitle = '', filename = 'report', sections }) {
  const generated = new Date().toLocaleString();
  const m = openModal(`
    <div class="report-sheet">
      <h1>${esc(title)}</h1>
      <p class="report-sub">${esc(subtitle)}${subtitle ? ' · ' : ''}Generated ${esc(generated)}</p>
      ${sections.map(s => `<section><h3>${esc(s.heading)}</h3>
        ${s.kv ? `<table class="rtable kv">${s.kv.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}
        ${s.columns ? (s.rows.length ? `<table class="rtable"><thead><tr>${s.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="muted">No data.</p>') : ''}
      </section>`).join('')}
    </div>
    <div class="report-actions">
      <button type="button" class="btn-outline" data-act="csv">Download CSV</button>
      <button type="button" class="btn-solid" data-act="print">Print / Save as PDF</button>
    </div>`, { wide: true });
  m.addEventListener('click', e => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'csv') downloadFile(filename + '.csv', toCSV(title, sections));
    if (a === 'print') window.print();
  });
}
