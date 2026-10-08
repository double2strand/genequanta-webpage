// Paste the Google Apps Script Web app URL (ends in /exec) between the quotes, then re-upload this file.
// While it is empty, the form falls back to opening an email to FALLBACK_EMAIL.
window.GQ_CAREERS = Object.assign({
  ENDPOINT: 'https://script.google.com/macros/s/AKfycbzvTBV6SglniENmq2a_0o1__Y-2tnTTeuyar-Sb9rfdm-u8OQByhXavr4DGhLULDIwS/exec',
  FALLBACK_EMAIL: 'yixuan@genequanta.com',
  MAX_MB: 5,
  RETENTION: 'up to 12 months after the recruitment process ends'
}, window.GQ_CAREERS || {});
