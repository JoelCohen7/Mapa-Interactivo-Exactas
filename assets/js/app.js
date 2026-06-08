/* =========================================================================
   Mapa interactivo FCEN-UBA — base funcional
   - Carga public/data.json (o la copia editada en localStorage)
   - Muestra cada piso como imagen con Leaflet (CRS.Simple) y marcadores
   - Buscador global (usa nombre, alias, descripción y el diccionario de siglas)
   - Modo edición: agregar (click en plano), mover (arrastrar), editar y borrar
   - Exportar / Importar JSON
   Las posiciones x,y se guardan como fracciones 0..1 de la imagen del piso.
   ========================================================================= */

const DATA_URL = 'public/data.json';
const LS_KEY = 'mapa-exactas-data-v1';

const state = {
  data: null,          // { meta, categorias, diccionario, pisos, entradas }
  currentPisoId: null,
  editMode: false,
  addMode: false,
  hiddenCats: new Set(),
  imgSize: {},         // pisoId -> {w, h} tamaño natural de la imagen
  markers: {},         // entryId -> L.marker
  editingId: null,     // id en edición (o null al crear)
  newPos: null,        // {x,y} al crear por click
  dictEditingCode: null, // código del diccionario en edición (o null al crear)
};

let map, overlayLayer, markerLayer;

/* ---------- Utilidades de datos ---------- */

function rutaImagen(piso) {
  // las rutas en data.json son relativas a public/
  return 'public/' + piso.imagen;
}

function nuevoId() {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function guardarLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.data));
  document.getElementById('unsaved').hidden = false;
}

function pisoActual() {
  return state.data.pisos.find(p => p.id === state.currentPisoId);
}

function catColor(tipo) {
  const c = state.data.categorias[tipo];
  return c ? c.color : '#888';
}
function catLabel(tipo) {
  const c = state.data.categorias[tipo];
  return c ? c.label : tipo;
}

/* ---------- Carga inicial ---------- */

async function init() {
  const local = localStorage.getItem(LS_KEY);
  if (local) {
    try {
      state.data = JSON.parse(local);
      document.getElementById('unsaved').hidden = false;
    } catch { /* si falla, cargamos del archivo */ }
  }
  if (!state.data) {
    const res = await fetch(DATA_URL);
    state.data = await res.json();
  }

  inicializarMapa();
  poblarSelectores();
  construirLeyenda();
  conectarEventos();
  checkServer();

  // primer piso con entradas, o el primero
  const conEntradas = state.data.pisos.find(p =>
    state.data.entradas.some(e => e.pisoId === p.id));
  cambiarPiso((conEntradas || state.data.pisos[0]).id);
}

/* ---------- Mapa ---------- */

function inicializarMapa() {
  map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -4,
    zoomControl: true,
    attributionControl: false,
  });
  markerLayer = L.layerGroup().addTo(map);

  // click en el plano para agregar (solo en addMode)
  map.on('click', (ev) => {
    if (!state.addMode) return;
    const piso = pisoActual();
    const size = state.imgSize[piso.id];
    if (!size) return;
    const fx = ev.latlng.lng / size.w;
    const fy = 1 - ev.latlng.lat / size.h;
    state.editingId = null;
    state.newPos = { x: clamp01(fx), y: clamp01(fy) };
    abrirFormulario(null);
    salirAddMode();
  });
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// fracción (x desde izq, y desde arriba) -> latlng de Leaflet
function fracALatLng(piso, x, y) {
  const s = state.imgSize[piso.id];
  return [s.h * (1 - y), x * s.w];
}
// latlng -> fracción
function latLngAFrac(piso, latlng) {
  const s = state.imgSize[piso.id];
  return { x: clamp01(latlng.lng / s.w), y: clamp01(1 - latlng.lat / s.h) };
}

function cargarImagen(piso) {
  return new Promise((resolve) => {
    if (state.imgSize[piso.id]) return resolve(state.imgSize[piso.id]);
    const img = new Image();
    img.onload = () => {
      state.imgSize[piso.id] = { w: img.naturalWidth, h: img.naturalHeight };
      resolve(state.imgSize[piso.id]);
    };
    img.onerror = () => { state.imgSize[piso.id] = { w: 1000, h: 700 }; resolve(state.imgSize[piso.id]); };
    img.src = rutaImagen(piso);
  });
}

async function cambiarPiso(pisoId) {
  state.currentPisoId = pisoId;
  const piso = pisoActual();
  const size = await cargarImagen(piso);
  const bounds = [[0, 0], [size.h, size.w]];

  if (overlayLayer) map.removeLayer(overlayLayer);
  overlayLayer = L.imageOverlay(rutaImagen(piso), bounds).addTo(map);
  map.fitBounds(bounds);
  map.setMaxBounds(bounds);

  document.getElementById('floor-title').textContent = `${piso.pabellon} · ${piso.piso}`;
  sincronizarSelectores();
  dibujarMarcadores();
}

function dibujarMarcadores() {
  markerLayer.clearLayers();
  state.markers = {};
  const piso = pisoActual();
  const entradas = state.data.entradas.filter(e => e.pisoId === piso.id && !state.hiddenCats.has(e.tipo));

  entradas.forEach(e => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="pin ${e.confianza === 'aprox' ? 'aprox' : ''}" style="background:${catColor(e.tipo)}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const m = L.marker(fracALatLng(piso, e.x, e.y), {
      icon,
      draggable: state.editMode,
      title: e.nombre,
    }).addTo(markerLayer);

    m.bindPopup(popupHTML(e), { autoClose: false });
    m.on('click', () => {
      markerLayer.eachLayer(l => { if (l !== m && l.isPopupOpen()) l.closePopup(); });
    });
    m.on('popupopen', () => engancharPopup(e.id));
    m.on('dragend', () => {
      const frac = latLngAFrac(piso, m.getLatLng());
      const ent = state.data.entradas.find(x => x.id === e.id);
      ent.x = frac.x; ent.y = frac.y; ent.confianza = 'exacta';
      guardarLocal();
    });
    state.markers[e.id] = m;
  });
}

function popupHTML(e) {
  const alias = (e.alias && e.alias.length) ? `<div class="popup-type">Alias: ${e.alias.join(', ')}</div>` : '';
  const desc = e.descripcion ? `<div class="popup-desc">${escapeHtml(e.descripcion)}</div>` : '';
  const aprox = e.confianza === 'aprox' ? ' · <span style="color:#c2731a">posición aprox.</span>' : '';
  const editBtn = state.editMode ? `<button class="btn btn-ghost popup-btn" data-edit="${e.id}">Editar</button>` : '';
  return `<div class="popup-name">${escapeHtml(e.nombre)}</div>
          <div class="popup-type">${catLabel(e.tipo)}${aprox}</div>
          ${alias}${desc}${editBtn}`;
}

function engancharPopup(id) {
  const btn = document.querySelector(`[data-edit="${id}"]`);
  if (btn) btn.addEventListener('click', () => { state.editingId = id; abrirFormulario(id); });
}

/* ---------- Selectores de pabellón / piso ---------- */

function poblarSelectores() {
  const pabSel = document.getElementById('pabellon-select');
  const pabellones = [...new Set(state.data.pisos.map(p => p.pabellon))];
  pabSel.innerHTML = pabellones.map(p => `<option value="${p}">${p}</option>`).join('');
  pabSel.addEventListener('change', () => {
    const primero = state.data.pisos.find(p => p.pabellon === pabSel.value);
    cambiarPiso(primero.id);
  });
  document.getElementById('piso-select').addEventListener('change', (ev) => cambiarPiso(ev.target.value));
}

function sincronizarSelectores() {
  const piso = pisoActual();
  const pabSel = document.getElementById('pabellon-select');
  const pisoSel = document.getElementById('piso-select');
  pabSel.value = piso.pabellon;
  const pisos = state.data.pisos.filter(p => p.pabellon === piso.pabellon);
  pisoSel.innerHTML = pisos.map(p => `<option value="${p.id}">${p.piso}</option>`).join('');
  pisoSel.value = piso.id;
}

/* ---------- Leyenda / filtros ---------- */

function construirLeyenda() {
  const cont = document.getElementById('legend');
  cont.innerHTML = '';
  Object.entries(state.data.categorias).forEach(([key, cat]) => {
    const id = 'cat-' + key;
    const row = document.createElement('label');
    row.innerHTML = `<input type="checkbox" id="${id}" checked />
      <span class="dot" style="background:${cat.color}"></span> ${cat.label}`;
    row.querySelector('input').addEventListener('change', (ev) => {
      if (ev.target.checked) state.hiddenCats.delete(key);
      else state.hiddenCats.add(key);
      dibujarMarcadores();
    });
    cont.appendChild(row);
  });
}

/* ---------- Búsqueda global ---------- */

function buscar(q) {
  const cont = document.getElementById('results');
  q = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!q) { cont.hidden = true; cont.innerHTML = ''; return; }

  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Expandir via diccionario: códigos que matchean el query por nombre completo
  const dicMatchCodigos = new Set(
    (state.data.diccionario || [])
      .filter(d => norm(d.codigo).includes(q) || norm(d.nombre).includes(q))
      .map(d => norm(d.codigo))
  );

  // Entradas que matchean directamente o por expansión del diccionario
  const hitIds = new Set();
  const hits = state.data.entradas.filter(e => {
    const directMatch =
      norm(e.nombre).includes(q) ||
      norm(e.descripcion).includes(q) ||
      (e.alias || []).some(a => norm(a).includes(q)) ||
      norm(catLabel(e.tipo)).includes(q);
    const dictMatch = dicMatchCodigos.size > 0 &&
      (e.alias || []).some(a => dicMatchCodigos.has(norm(a)));
    if (directMatch || dictMatch) { hitIds.add(e.id); return true; }
    return false;
  });

  // Entradas del diccionario sin marcador (mostrar aviso)
  const dicSinUbicacion = (state.data.diccionario || []).filter(d =>
    (norm(d.codigo).includes(q) || norm(d.nombre).includes(q)) &&
    !hits.some(h => (h.alias || []).map(norm).includes(norm(d.codigo)))
  );

  // Agrupar hits por pabellón
  const groups = {};
  hits.slice(0, 50).forEach(e => {
    const piso = state.data.pisos.find(p => p.id === e.pisoId);
    const pabellon = piso ? piso.pabellon : 'Sin piso';
    if (!groups[pabellon]) groups[pabellon] = [];
    groups[pabellon].push({ e, pisoNombre: piso ? piso.piso : '' });
  });

  let html = '';
  Object.entries(groups).forEach(([pabellon, items]) => {
    html += `<div class="r-group-label">${escapeHtml(pabellon)}</div>`;

    // Agrupar entradas con mismo nombre en el mismo piso
    const merged = [];
    const seenKey = new Map();
    items.forEach(({ e, pisoNombre }) => {
      const key = e.nombre.toLowerCase() + '|' + e.pisoId;
      if (seenKey.has(key)) {
        merged[seenKey.get(key)].ids.push(e.id);
      } else {
        seenKey.set(key, merged.length);
        merged.push({ e, pisoNombre, ids: [e.id] });
      }
    });

    merged.forEach(({ e, pisoNombre, ids }) => {
      const badge = ids.length > 1
        ? ` <span style="font-size:0.7em;background:#e8f0fe;color:#3b5bdb;border-radius:4px;padding:1px 5px;margin-left:4px">${ids.length} ubicaciones</span>`
        : '';
      html += `<div class="result" data-goto="${ids.join(',')}">
        <div class="r-name">${escapeHtml(e.nombre)}${badge}</div>
        <div class="r-loc">${escapeHtml(pisoNombre)}</div>
      </div>`;
    });
  });

  dicSinUbicacion.slice(0, 15).forEach(d => {
    html += `<div class="result empty">
      <div class="r-name">${escapeHtml(d.codigo)} — ${escapeHtml(d.nombre)}</div>
      <div class="r-tag">sin ubicación marcada — agregala desde modo edición</div>
    </div>`;
  });

  if (!html) html = '<div class="result empty"><div class="r-name">Sin resultados</div></div>';

  cont.innerHTML = html;
  cont.hidden = false;
  cont.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => irAEntrada(el.dataset.goto));
  });
}

async function irAEntrada(idsStr) {
  const ids = String(idsStr).split(',');
  const first = state.data.entradas.find(x => x.id === ids[0]);
  if (!first) return;
  markerLayer.eachLayer(l => { if (l.isPopupOpen()) l.closePopup(); });
  if (first.pisoId !== state.currentPisoId) await cambiarPiso(first.pisoId);
  const piso = pisoActual();

  if (ids.length === 1) {
    map.flyTo(fracALatLng(piso, first.x, first.y), Math.max(map.getZoom(), 0));
    const m = state.markers[ids[0]];
    if (m) {
      m.openPopup();
      const el = m.getElement()?.querySelector('.pin');
      if (el) { el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 3500); }
    }
  } else {
    // Múltiples marcadores en el mismo piso: volar al centroide y pulsar todos
    const entries = ids.map(id => state.data.entradas.find(x => x.id === id)).filter(Boolean);
    const cx = entries.reduce((s, e) => s + e.x, 0) / entries.length;
    const cy = entries.reduce((s, e) => s + e.y, 0) / entries.length;
    map.flyTo(fracALatLng(piso, cx, cy), Math.max(map.getZoom(), 0));
    ids.forEach(id => {
      const m = state.markers[id];
      if (!m) return;
      m.openPopup();
      const el = m.getElement()?.querySelector('.pin');
      if (el) { el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 3500); }
    });
  }

  document.getElementById('results').hidden = true;
  document.getElementById('search').value = '';
}

/* ---------- Edición ---------- */

function setEditMode(on) {
  state.editMode = on;
  document.getElementById('edit-toggle').classList.toggle('active', on);
  document.getElementById('edit-toggle').textContent = on ? '✓ Edición activa' : '✏️ Modo edición';
  document.getElementById('edit-controls').hidden = !on;
  if (!on) salirAddMode();
  dibujarMarcadores();
}

function entrarAddMode() {
  state.addMode = true;
  document.getElementById('add-hint').hidden = false;
  map.getContainer().style.cursor = 'crosshair';
}
function salirAddMode() {
  state.addMode = false;
  const h = document.getElementById('add-hint');
  if (h) h.hidden = true;
  if (map) map.getContainer().style.cursor = '';
}

function abrirFormulario(id) {
  const form = document.getElementById('entry-form');
  const sel = form.querySelector('[name=tipo]');
  sel.innerHTML = Object.entries(state.data.categorias)
    .map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');

  if (id) {
    const e = state.data.entradas.find(x => x.id === id);
    document.getElementById('form-title').textContent = 'Editar espacio';
    form.nombre.value = e.nombre;
    form.tipo.value = e.tipo;
    form.alias.value = (e.alias || []).join(', ');
    form.descripcion.value = e.descripcion || '';
    document.getElementById('form-delete').hidden = false;
  } else {
    document.getElementById('form-title').textContent = 'Nuevo espacio';
    form.reset();
    sel.innerHTML = Object.entries(state.data.categorias)
      .map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');
    document.getElementById('form-delete').hidden = true;
  }
  document.getElementById('form-backdrop').hidden = false;
}

function cerrarFormulario() {
  document.getElementById('form-backdrop').hidden = true;
  state.editingId = null;
  state.newPos = null;
}

function guardarFormulario(ev) {
  ev.preventDefault();
  const form = ev.target;
  const datos = {
    nombre: form.nombre.value.trim(),
    tipo: form.tipo.value,
    alias: form.alias.value.split(',').map(s => s.trim()).filter(Boolean),
    descripcion: form.descripcion.value.trim(),
  };
  if (!datos.nombre) return;

  if (state.editingId) {
    const e = state.data.entradas.find(x => x.id === state.editingId);
    Object.assign(e, datos);
  } else {
    state.data.entradas.push({
      id: nuevoId(),
      ...datos,
      pisoId: state.currentPisoId,
      x: state.newPos.x,
      y: state.newPos.y,
      confianza: 'exacta',
    });
  }
  guardarLocal();
  cerrarFormulario();
  dibujarMarcadores();
}

function borrarEntrada() {
  if (!state.editingId) return;
  if (!confirm('¿Borrar este espacio?')) return;
  state.data.entradas = state.data.entradas.filter(e => e.id !== state.editingId);
  guardarLocal();
  cerrarFormulario();
  dibujarMarcadores();
}

/* ---------- Diccionario de siglas ---------- */

function abrirDiccionario() {
  document.getElementById('dict-backdrop').hidden = false;
  document.getElementById('dict-search').value = '';
  renderDiccionario('');
  document.getElementById('dict-search').focus();
}

function cerrarDiccionario() {
  document.getElementById('dict-backdrop').hidden = true;
}

function renderDiccionario(filtro) {
  const f = (filtro || '').toLowerCase();
  const lista = document.getElementById('dict-list');
  const items = (state.data.diccionario || []).filter(d =>
    !f || d.codigo.toLowerCase().includes(f) || d.nombre.toLowerCase().includes(f)
  );

  if (!items.length) {
    lista.innerHTML = '<div class="dict-empty">Sin resultados.</div>';
    return;
  }

  lista.innerHTML = items.map(d => {
    const color = catColor(d.tipo);
    const label = catLabel(d.tipo);
    return `<div class="dict-item">
      <div class="dict-item-info">
        <span class="dict-codigo">${escapeHtml(d.codigo)}</span>
        <span class="dict-nombre">${escapeHtml(d.nombre)}</span>
        <span class="dict-chip" style="background:${color}22;color:${color}">${escapeHtml(label)}</span>
      </div>
      <button class="btn btn-ghost dict-edit-btn" data-dict="${escapeHtml(d.codigo)}">Editar</button>
    </div>`;
  }).join('');

  lista.querySelectorAll('[data-dict]').forEach(btn => {
    btn.addEventListener('click', () => abrirDictEntry(btn.dataset.dict));
  });
}

function abrirDictEntry(codigo) {
  state.dictEditingCode = codigo || null;
  const form = document.getElementById('dict-entry-form');
  const sel = form.querySelector('[name=tipo]');
  sel.innerHTML = Object.entries(state.data.categorias)
    .map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');

  if (codigo) {
    const d = (state.data.diccionario || []).find(x => x.codigo === codigo);
    if (!d) return;
    document.getElementById('dict-entry-title').textContent = 'Editar sigla';
    form.codigo.value = d.codigo;
    form.nombre.value = d.nombre;
    form.tipo.value = d.tipo;
    document.getElementById('dict-entry-delete').hidden = false;
  } else {
    document.getElementById('dict-entry-title').textContent = 'Nueva sigla';
    form.reset();
    sel.innerHTML = Object.entries(state.data.categorias)
      .map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');
    document.getElementById('dict-entry-delete').hidden = true;
  }
  document.getElementById('dict-entry-backdrop').hidden = false;
}

function cerrarDictEntry() {
  document.getElementById('dict-entry-backdrop').hidden = true;
  state.dictEditingCode = null;
}

function guardarDictEntry(ev) {
  ev.preventDefault();
  const form = ev.target;
  const datos = {
    codigo: form.codigo.value.trim().toUpperCase(),
    nombre: form.nombre.value.trim(),
    tipo: form.tipo.value,
  };
  if (!datos.codigo || !datos.nombre) return;

  if (!state.data.diccionario) state.data.diccionario = [];
  if (state.dictEditingCode) {
    const idx = state.data.diccionario.findIndex(d => d.codigo === state.dictEditingCode);
    if (idx >= 0) state.data.diccionario[idx] = datos;
  } else {
    if (!state.data.diccionario.find(d => d.codigo === datos.codigo)) {
      state.data.diccionario.push(datos);
    }
  }
  guardarLocal();
  cerrarDictEntry();
  renderDiccionario(document.getElementById('dict-search').value);
}

function borrarDictEntry() {
  if (!state.dictEditingCode) return;
  if (!confirm(`¿Borrar la sigla "${state.dictEditingCode}"?`)) return;
  state.data.diccionario = (state.data.diccionario || []).filter(d => d.codigo !== state.dictEditingCode);
  guardarLocal();
  cerrarDictEntry();
  renderDiccionario(document.getElementById('dict-search').value);
}

/* ---------- Servidor opcional ---------- */

async function checkServer() {
  try {
    const r = await fetch('api/ping', { signal: AbortSignal.timeout(800) });
    if (r.ok) document.getElementById('save-server').hidden = false;
  } catch { /* no hay servidor corriendo — está bien */ }
}

async function guardarEnServidor() {
  try {
    const r = await fetch('guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.data, null, 2),
    });
    if (r.ok) {
      alert('✓ Datos guardados en el servidor.');
      localStorage.removeItem(LS_KEY);
      document.getElementById('unsaved').hidden = true;
    } else {
      alert('Error al guardar en el servidor: HTTP ' + r.status);
    }
  } catch (e) {
    alert('No se pudo conectar al servidor: ' + e.message);
  }
}

/* ---------- Exportar / Importar / Descartar ---------- */

function exportarJSON() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importarJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state.data = JSON.parse(reader.result);
      guardarLocal();
      state.imgSize = {};
      poblarSelectores();
      construirLeyenda();
      cambiarPiso(state.data.pisos[0].id);
    } catch (e) { alert('No se pudo leer el JSON: ' + e.message); }
  };
  reader.readAsText(file);
}

async function descartarLocal() {
  if (!confirm('¿Descartar tus cambios locales y volver a los datos publicados?')) return;
  localStorage.removeItem(LS_KEY);
  state.data = null; state.imgSize = {};
  document.getElementById('unsaved').hidden = true;
  const res = await fetch(DATA_URL);
  state.data = await res.json();
  poblarSelectores();
  construirLeyenda();
  cambiarPiso(state.data.pisos[0].id);
}

/* ---------- Eventos ---------- */

function conectarEventos() {
  const $ = id => document.getElementById(id);

  $('search').addEventListener('input', (e) => buscar(e.target.value));
  // cerrar resultados al hacer click fuera del buscador
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap') && !e.target.closest('#results')) {
      $('results').hidden = true;
    }
  });

  $('edit-toggle').addEventListener('click', () => setEditMode(!state.editMode));
  $('add-entry').addEventListener('click', entrarAddMode);
  $('export').addEventListener('click', exportarJSON);
  $('import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', (e) => { if (e.target.files[0]) importarJSON(e.target.files[0]); });
  $('discard').addEventListener('click', descartarLocal);
  $('save-server').addEventListener('click', guardarEnServidor);

  $('entry-form').addEventListener('submit', guardarFormulario);
  $('form-cancel').addEventListener('click', cerrarFormulario);
  $('form-delete').addEventListener('click', borrarEntrada);
  $('form-backdrop').addEventListener('click', (e) => { if (e.target.id === 'form-backdrop') cerrarFormulario(); });

  // Diccionario
  $('open-dict').addEventListener('click', abrirDiccionario);
  $('dict-close').addEventListener('click', cerrarDiccionario);
  $('dict-backdrop').addEventListener('click', (e) => { if (e.target.id === 'dict-backdrop') cerrarDiccionario(); });
  $('dict-add').addEventListener('click', () => abrirDictEntry(null));
  $('dict-search').addEventListener('input', (e) => renderDiccionario(e.target.value));
  $('dict-entry-form').addEventListener('submit', guardarDictEntry);
  $('dict-entry-cancel').addEventListener('click', cerrarDictEntry);
  $('dict-entry-delete').addEventListener('click', borrarDictEntry);
  $('dict-entry-backdrop').addEventListener('click', (e) => { if (e.target.id === 'dict-entry-backdrop') cerrarDictEntry(); });

  // Toggle del panel lateral en mobile
  $('sidebar-toggle').addEventListener('click', () => {
    $('sidebar').classList.toggle('collapsed');
  });
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

init();
