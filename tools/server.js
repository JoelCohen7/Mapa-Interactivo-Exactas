/**
 * Servidor local opcional para editar `public/data.json` desde la app.
 *
 * La versión publicada en GitHub Pages no usa este archivo: es solo para trabajo local.
 * Requisitos: Node.js >= 18. No requiere dependencias externas.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.PORT || 3001);
const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'public', 'data.json');
const JSON_LIMIT_BYTES = 10 * 1024 * 1024;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function safeStaticPath(urlPath) {
  const requested = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(requested === '/' ? '/index.html' : requested);
  const filePath = path.join(ROOT, normalized);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
  return filePath === ROOT || filePath.startsWith(rootWithSep) ? filePath : null;
}

function serveStatic(req, res) {
  const filePath = safeStaticPath(req.url);
  if (!filePath) return sendJson(res, 403, { error: 'Ruta inválida' });

  fs.readFile(filePath, (err, content) => {
    if (err) return sendJson(res, 404, { error: 'No encontrado' });
    const type = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > JSON_LIMIT_BYTES) {
        reject(new Error('El JSON supera el límite de 10 MB'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function saveData(req, res) {
  try {
    const body = await readBody(req);
    const data = JSON.parse(body);
    if (!data || typeof data !== 'object' || !Array.isArray(data.pisos) || !Array.isArray(data.entradas)) {
      return sendJson(res, 400, { error: 'Estructura de datos inválida' });
    }
    fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/ping') return sendJson(res, 200, { ok: true });
  if (req.method === 'POST' && req.url === '/guardar') return saveData(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  return sendJson(res, 405, { error: 'Método no permitido' });
});

server.listen(PORT, () => {
  console.log(`Servidor local: http://localhost:${PORT}`);
  console.log(`Ediciones guardadas en: ${DATA_PATH}`);
});
