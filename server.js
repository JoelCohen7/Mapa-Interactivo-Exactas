/**
 * server.js — mini servidor OPCIONAL para guardar datos sin salir de la app.
 *
 * Solo necesitás esto si querés el botón "Guardar en servidor" en la UI.
 * La app funciona perfectamente sin este archivo.
 *
 * Requisitos: Node.js >= 18
 *   npm install express
 *   node server.js
 *
 * Luego abrí http://localhost:3001 en lugar de usar python3 -m http.server.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_PATH = path.join(__dirname, 'public', 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Endpoint de health-check para que la app detecte si el servidor está corriendo
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// Guardar data.json actualizado desde la app
app.post('/guardar', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Body inválido' });
  }
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Ediciones se guardarán en ${DATA_PATH}`);
});
