import html2pdf from 'html2pdf.js';

export function exportPDF(id = 'session-content') {
  const el = document.getElementById(id);
  html2pdf().from(el).save('BB-Edtech-Math-Session.pdf');
}
