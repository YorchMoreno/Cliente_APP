/* ============================================
   ClienteAPP — Módulo de Configuración
   ============================================ */

window.Configuracion = {

  async render() {
    const content = document.getElementById('pageContent');
    const session = Auth.getSession();

    // Calcular uso de almacenamiento estimado
    let storageInfo = 'Calculando...';
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        const usedMB  = (est.usage  / 1024 / 1024).toFixed(1);
        const quotaMB = (est.quota  / 1024 / 1024).toFixed(0);
        storageInfo = `${usedMB} MB usados de ${quotaMB} MB`;
      } else {
        storageInfo = 'Almacenamiento local del equipo';
      }
    } catch { storageInfo = 'Almacenamiento local del equipo'; }

    content.innerHTML = `
      <div class="fade-in">

        <!-- Hero configuración -->
        <div class="cfg-hero mb-4">
          <div class="d-flex align-items-center gap-4">
            <div class="cfg-avatar">
              <i class="bi bi-person-fill fs-2"></i>
            </div>
            <div>
              <h3 class="fw-bold text-white mb-1">${session?.nombre || 'George'}</h3>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="hero-pill"><i class="bi bi-shield-fill-check me-1"></i>Administrador</span>
                <span class="hero-pill"><i class="bi bi-hdd-fill me-1"></i>Almacenamiento Local</span>
                <span class="hero-pill ${navigator.onLine ? '' : 'hero-pill-warn'}">
                  <i class="bi bi-${navigator.onLine ? 'wifi' : 'wifi-off'} me-1"></i>
                  ${navigator.onLine ? 'En línea' : 'Sin conexión'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">

          <!-- ── Cambiar contraseña ── -->
          <div class="col-lg-5">
            <div class="card border-0 shadow-sm h-100" style="border-radius:16px;overflow:hidden;">
              <div class="card-header border-0 py-3 px-4"
                   style="background:linear-gradient(135deg,#1a3c5e,#2d6a9f);">
                <h6 class="fw-bold mb-0 text-white">
                  <i class="bi bi-shield-lock me-2"></i>Cambiar Contraseña
                </h6>
              </div>
              <div class="card-body p-4">
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-uppercase text-muted">Contraseña actual</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                      <i class="bi bi-lock text-muted"></i>
                    </span>
                    <input type="password" class="form-control border-start-0 ps-1"
                           id="passActual" placeholder="••••••••" />
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold small text-uppercase text-muted">Nueva contraseña</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                      <i class="bi bi-key text-muted"></i>
                    </span>
                    <input type="password" class="form-control border-start-0 ps-1"
                           id="passNueva" placeholder="Mínimo 6 caracteres" />
                  </div>
                </div>
                <div class="mb-4">
                  <label class="form-label fw-semibold small text-uppercase text-muted">Confirmar contraseña</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                      <i class="bi bi-key-fill text-muted"></i>
                    </span>
                    <input type="password" class="form-control border-start-0 ps-1"
                           id="passConfirm" placeholder="Repite la nueva contraseña" />
                  </div>
                </div>
                <button class="btn btn-primary w-100 py-2 fw-semibold"
                        onclick="Configuracion.cambiarPassword()">
                  <i class="bi bi-check-circle me-2"></i>Actualizar Contraseña
                </button>
              </div>
            </div>
          </div>

          <!-- ── Columna derecha ── -->
          <div class="col-lg-7">
            <div class="row g-4">

              <!-- Info del sistema -->
              <div class="col-12">
                <div class="card border-0 shadow-sm" style="border-radius:16px;overflow:hidden;">
                  <div class="card-header border-0 py-3 px-4"
                       style="background:linear-gradient(135deg,#0f1f30,#1a3c5e);">
                    <h6 class="fw-bold mb-0 text-white">
                      <i class="bi bi-cpu me-2"></i>Sistema e Información
                    </h6>
                  </div>
                  <div class="card-body p-0">
                    <div class="list-group list-group-flush">
                      ${this._infoRow('bi-app', 'Aplicación', 'ClienteAPP v1.0.0', 'text')}
                      ${this._infoRow('bi-person-badge', 'Usuario', session?.nombre || 'George', 'badge-primary')}
                      ${this._infoRow('bi-hdd-fill', 'Almacenamiento', 'Tu computador (Local)', 'badge-success')}
                      ${this._infoRow('bi-database', 'Motor de datos', 'IndexedDB — Sin servidor', 'badge-info')}
                      ${this._infoRow('bi-pie-chart', 'Espacio usado', storageInfo, 'text')}
                      ${this._infoRow('bi-broadcast', 'Modo', 'Offline-First PWA', 'badge-purple')}
                      ${this._infoRow('bi-wifi', 'Conexión',
                          navigator.onLine ? 'En línea' : 'Sin conexión',
                          navigator.onLine ? 'badge-success' : 'badge-warning')}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Gestión de datos -->
              <div class="col-12">
                <div class="card border-0 shadow-sm" style="border-radius:16px;overflow:hidden;">
                  <div class="card-header border-0 py-3 px-4"
                       style="background:linear-gradient(135deg,#4a3a1a,#8a6a2d);">
                    <h6 class="fw-bold mb-0 text-white">
                      <i class="bi bi-database-gear me-2"></i>Gestión de Datos
                    </h6>
                  </div>
                  <div class="card-body p-4">
                    <div class="row g-3">
                      <div class="col-sm-4">
                        <button class="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center gap-1"
                                style="border-radius:12px;"
                                onclick="Configuracion.exportarDatos()">
                          <i class="bi bi-download fs-3"></i>
                          <span class="fw-semibold small">Exportar</span>
                          <span class="text-muted" style="font-size:10px;">Backup JSON</span>
                        </button>
                      </div>
                      <div class="col-sm-4">
                        <button class="btn btn-outline-warning w-100 py-3 d-flex flex-column align-items-center gap-1"
                                style="border-radius:12px;"
                                onclick="document.getElementById('importFile').click()">
                          <i class="bi bi-upload fs-3"></i>
                          <span class="fw-semibold small">Importar</span>
                          <span class="text-muted" style="font-size:10px;">Restaurar backup</span>
                        </button>
                        <input type="file" id="importFile" accept=".json" class="d-none"
                               onchange="Configuracion.importarDatos(this)" />
                      </div>
                      <div class="col-sm-4">
                        <button class="btn btn-outline-danger w-100 py-3 d-flex flex-column align-items-center gap-1"
                                style="border-radius:12px;"
                                onclick="Configuracion.limpiarDatos()">
                          <i class="bi bi-trash3 fs-3"></i>
                          <span class="fw-semibold small">Limpiar</span>
                          <span class="text-muted" style="font-size:10px;">Borrar todo</span>
                        </button>
                      </div>
                    </div>
                    <div class="alert alert-info py-2 px-3 mt-3 mb-0 small d-flex align-items-center gap-2">
                      <i class="bi bi-info-circle-fill flex-shrink-0"></i>
                      <span>Los datos se guardan en <strong>tu computador</strong>.
                      Exporta un backup regularmente para no perder información.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>`;
  },

  // ── Fila de info ──────────────────────────────────────────────────────────
  _infoRow(icon, label, value, type) {
    let valHtml;
    if (type === 'text') {
      valHtml = `<span class="fw-semibold small">${value}</span>`;
    } else if (type === 'badge-primary') {
      valHtml = `<span class="badge bg-primary">${value}</span>`;
    } else if (type === 'badge-success') {
      valHtml = `<span class="badge bg-success">${value}</span>`;
    } else if (type === 'badge-info') {
      valHtml = `<span class="badge bg-info text-dark">${value}</span>`;
    } else if (type === 'badge-warning') {
      valHtml = `<span class="badge bg-warning text-dark">${value}</span>`;
    } else if (type === 'badge-purple') {
      valHtml = `<span class="badge" style="background:#8e44ad;">${value}</span>`;
    } else {
      valHtml = `<span class="fw-semibold small">${value}</span>`;
    }
    return `
      <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3">
        <span class="text-muted small d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>${label}
        </span>
        ${valHtml}
      </li>`;
  },

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  async cambiarPassword() {
    const actual   = document.getElementById('passActual').value;
    const nueva    = document.getElementById('passNueva').value;
    const confirma = document.getElementById('passConfirm').value;

    if (!actual || !nueva || !confirma) {
      UI.toast('Completa todos los campos', 'warning'); return;
    }
    if (nueva.length < 6) {
      UI.toast('La nueva contraseña debe tener al menos 6 caracteres', 'warning'); return;
    }
    if (nueva !== confirma) {
      UI.toast('Las contraseñas no coinciden', 'danger'); return;
    }

    const session = Auth.getSession();
    const usuario = await DB.get(DB.STORES.usuarios, session.id);

    if (!usuario || usuario.password !== btoa(actual)) {
      UI.toast('La contraseña actual es incorrecta', 'danger'); return;
    }

    usuario.password = btoa(nueva);
    await DB.put(DB.STORES.usuarios, usuario);

    document.getElementById('passActual').value  = '';
    document.getElementById('passNueva').value   = '';
    document.getElementById('passConfirm').value = '';
    UI.toast('Contraseña actualizada correctamente', 'success');
  },

  // ── Exportar datos ────────────────────────────────────────────────────────
  async exportarDatos() {
    const [clientes, proyectos, pagos, seguimientos, finanzas] = await Promise.all([
      DB.getAll(DB.STORES.clientes),
      DB.getAll(DB.STORES.proyectos),
      DB.getAll(DB.STORES.pagos),
      DB.getAll(DB.STORES.seguimientos),
      DB.getAll(DB.STORES.finanzas)
    ]);

    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: { clientes, proyectos, pagos, seguimientos, finanzas }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ClienteAPP_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Backup exportado y guardado en tu computador', 'success');
  },

  // ── Importar datos ────────────────────────────────────────────────────────
  async importarDatos(input) {
    const file = input.files[0];
    if (!file) return;

    const ok = await UI.confirm(
      'Esto fusionará los datos del backup con los actuales. ¿Continuar?',
      'Importar Backup'
    );
    if (!ok) { input.value = ''; return; }

    try {
      const text   = await file.text();
      const backup = JSON.parse(text);
      if (!backup.data) throw new Error('Formato inválido');

      const { clientes, proyectos, pagos, seguimientos, finanzas } = backup.data;
      for (const c of (clientes     || [])) await DB.put(DB.STORES.clientes, c);
      for (const p of (proyectos    || [])) await DB.put(DB.STORES.proyectos, p);
      for (const p of (pagos        || [])) await DB.put(DB.STORES.pagos, p);
      for (const s of (seguimientos || [])) await DB.put(DB.STORES.seguimientos, s);
      for (const f of (finanzas     || [])) await DB.put(DB.STORES.finanzas, f);

      UI.toast('Backup importado correctamente', 'success');
      App.updateBadges();
    } catch (e) {
      UI.toast('Error al importar: ' + e.message, 'danger');
    }
    input.value = '';
  },

  // ── Limpiar datos ─────────────────────────────────────────────────────────
  async limpiarDatos() {
    const ok = await UI.confirm(
      '⚠️ Esto eliminará TODOS los clientes, proyectos, pagos y finanzas. No se puede deshacer.',
      'Limpiar Datos'
    );
    if (!ok) return;

    const stores = [
      DB.STORES.clientes, DB.STORES.proyectos,
      DB.STORES.pagos, DB.STORES.seguimientos, DB.STORES.finanzas
    ];
    for (const store of stores) {
      const items = await DB.getAll(store);
      for (const item of items) await DB.delete(store, item.id);
    }

    UI.toast('Datos eliminados', 'warning');
    await this.render();
    App.updateBadges();
  }
};
