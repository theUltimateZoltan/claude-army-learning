#!/usr/bin/env node
// Simple static file server for whatsapp-lessons skill outputs
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function renderIndex(files) {
  const rows = files.map((f, i) => {
    const stat = fs.statSync(path.join(ROOT, f));
    const kb = (stat.size / 1024).toFixed(1);
    const mtime = stat.mtime.toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    return `
      <tr>
        <td class="num">${i + 1}</td>
        <td><a href="/${encodeURIComponent(f)}">${f}</a></td>
        <td class="meta">${kb} KB</td>
        <td class="meta">${mtime}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>לקחים מוואטסאפ — תוצאות</title>
<style>
  :root {
    --bg: #0f1117; --surface: #1a1f2e; --card: #242938;
    --gold: #c9a84c; --blue: #4a90d9; --text: #e8eaf0;
    --text-sec: #8b90a0; --border: #2d3348;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg); color: var(--text);
    font-family: 'Segoe UI', Arial, sans-serif;
    min-height: 100vh; display: flex; flex-direction: column;
  }
  header {
    background: var(--surface); border-bottom: 2px solid var(--gold);
    padding: 1.5rem 2rem;
  }
  header h1 { font-size: 1.4rem; color: var(--gold); }
  header p { color: var(--text-sec); font-size: 0.85rem; margin-top: 0.25rem; }
  main { flex: 1; padding: 2rem; max-width: 900px; margin: 0 auto; width: 100%; }
  .empty { color: var(--text-sec); padding: 3rem; text-align: center; font-size: 1.1rem; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: var(--surface); }
  th {
    padding: 0.6rem 1rem; text-align: right; font-size: 0.8rem;
    color: var(--text-sec); font-weight: 600; letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
  }
  td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
  tr:hover td { background: var(--card); }
  td.num { color: var(--text-sec); font-size: 0.8rem; width: 2.5rem; }
  td.meta { color: var(--text-sec); font-size: 0.82rem; white-space: nowrap; }
  a { color: var(--blue); text-decoration: none; }
  a:hover { color: var(--gold); text-decoration: underline; }
  footer {
    text-align: center; padding: 1rem; color: var(--text-sec);
    font-size: 0.75rem; border-top: 1px solid var(--border);
  }
</style>
</head>
<body>
<header>
  <h1>למידה והדרכה 146 — תוצאות סקיל</h1>
  <p>שרת סטטי מקומי · ${files.length} קובץ${files.length !== 1 ? 'ות' : ''} זמינות</p>
</header>
<main>
${files.length === 0
  ? '<p class="empty">אין קבצי HTML בתיקייה עדיין. הרץ את הסקיל כדי לייצר תוצאות.</p>'
  : `<table>
      <thead><tr><th>#</th><th>קובץ</th><th>גודל</th><th>עדכון אחרון</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
</main>
<footer>whatsapp-lessons skill server · localhost:${PORT}</footer>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Index
  if (urlPath === '/' || urlPath === '') {
    const files = fs.readdirSync(ROOT)
      .filter(f => f.endsWith('.html') && f !== 'index.html')
      .sort((a, b) => {
        return fs.statSync(path.join(ROOT, b)).mtime -
               fs.statSync(path.join(ROOT, a)).mtime;
      });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(renderIndex(files));
  }

  // Static file
  const filePath = path.join(ROOT, urlPath);
  // Security: ensure resolved path stays inside ROOT
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  whatsapp-lessons server running`);
  console.log(`  http://localhost:${PORT}\n`);
});
