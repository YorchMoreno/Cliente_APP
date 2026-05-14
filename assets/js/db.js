/* ============================================
   ClienteAPP — Base de Datos Local (IndexedDB)
   Offline-first con sincronización futura
   ============================================ */

const DB_NAME = 'ClienteAPP';
const DB_VERSION = 3;

const STORES = {
  usuarios:     'usuarios',
  clientes:     'clientes',
  proyectos:    'proyectos',
  pagos:        'pagos',
  seguimientos: 'seguimientos',
  config:       'config',
  finanzas:     'finanzas',
  tareas:       'tareas'
};

let db = null;

// ── Inicializar DB ──────────────────────────────────────────────────────────
function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;

      // Usuarios
      if (!d.objectStoreNames.contains(STORES.usuarios)) {
        const us = d.createObjectStore(STORES.usuarios, { keyPath: 'id' });
        us.createIndex('login', 'login', { unique: true });
      }

      // Clientes
      if (!d.objectStoreNames.contains(STORES.clientes)) {
        const cs = d.createObjectStore(STORES.clientes, { keyPath: 'id' });
        cs.createIndex('estado', 'estado', { unique: false });
        cs.createIndex('asesorId', 'asesorId', { unique: false });
      }

      // Proyectos
      if (!d.objectStoreNames.contains(STORES.proyectos)) {
        const ps = d.createObjectStore(STORES.proyectos, { keyPath: 'id' });
        ps.createIndex('clienteId', 'clienteId', { unique: false });
      }

      // Pagos
      if (!d.objectStoreNames.contains(STORES.pagos)) {
        const pgs = d.createObjectStore(STORES.pagos, { keyPath: 'id' });
        pgs.createIndex('clienteId', 'clienteId', { unique: false });
        pgs.createIndex('proyectoId', 'proyectoId', { unique: false });
      }

      // Seguimientos
      if (!d.objectStoreNames.contains(STORES.seguimientos)) {
        const ss = d.createObjectStore(STORES.seguimientos, { keyPath: 'id' });
        ss.createIndex('clienteId', 'clienteId', { unique: false });
      }

      // Config
      if (!d.objectStoreNames.contains(STORES.config)) {
        d.createObjectStore(STORES.config, { keyPath: 'key' });
      }

      // Finanzas (v2)
      if (e.oldVersion < 2) {
        if (!d.objectStoreNames.contains(STORES.finanzas)) {
          const fs = d.createObjectStore(STORES.finanzas, { keyPath: 'id' });
          fs.createIndex('tipo',  'tipo',  { unique: false });
          fs.createIndex('fecha', 'fecha', { unique: false });
        }
      }

      // Tareas (v3)
      if (e.oldVersion < 3) {
        if (!d.objectStoreNames.contains(STORES.tareas)) {
          const ts = d.createObjectStore(STORES.tareas, { keyPath: 'id' });
          ts.createIndex('estado',    'estado',    { unique: false });
          ts.createIndex('categoria', 'categoria', { unique: false });
          ts.createIndex('fecha',     'fecha',     { unique: false });
        }
      }
    };

    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    req.onerror = (e) => reject(e.target.error);
  });
}

// ── Helpers genéricos ───────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function dbTransaction(storeName, mode = 'readonly') {
  return db.transaction([storeName], mode).objectStore(storeName);
}

// ── CRUD genérico ───────────────────────────────────────────────────────────
function dbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const req = dbTransaction(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function dbGet(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = dbTransaction(storeName).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

function dbPut(storeName, record) {
  return new Promise((resolve, reject) => {
    if (!record.id) record.id = generateId();
    record.updatedAt = new Date().toISOString();
    if (!record.createdAt) record.createdAt = record.updatedAt;
    const req = dbTransaction(storeName, 'readwrite').put(record);
    req.onsuccess = () => resolve(record);
    req.onerror  = () => reject(req.error);
  });
}

function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const req = dbTransaction(storeName, 'readwrite').delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror  = () => reject(req.error);
  });
}

function dbGetByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const store = dbTransaction(storeName);
    const index = store.index(indexName);
    const req   = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

// ── Seed de datos iniciales ─────────────────────────────────────────────────
async function seedInitialData() {
  const usuarios = await dbGetAll(STORES.usuarios);
  if (usuarios.length === 0) {
    // Solo usuario admin
    await dbPut(STORES.usuarios, {
      id: 'admin-001',
      nombre: 'George',
      login: 'admin',
      password: btoa('admin123'),
      rol: 'admin',
      activo: true
    });
    console.log('[DB] Usuario admin creado');
  }
}

// ── Config ──────────────────────────────────────────────────────────────────
async function getConfig(key) {
  const rec = await dbGet(STORES.config, key);
  return rec ? rec.value : null;
}

async function setConfig(key, value) {
  await dbPut(STORES.config, { key, value });
}

// ── Export global ───────────────────────────────────────────────────────────
window.DB = {
  init: initDB,
  seed: seedInitialData,
  getAll: dbGetAll,
  get: dbGet,
  put: dbPut,
  delete: dbDelete,
  getByIndex: dbGetByIndex,
  generateId,
  STORES,
  getConfig,
  setConfig
};
