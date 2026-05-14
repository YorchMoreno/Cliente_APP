/* ============================================
   ClienteAPP — Controlador Principal
   ============================================ */

// ── Módulo Expediente ─────────────────────────────────────────────────────────
window.Expediente = {

  async render(cliente, proyecto, pagos, seguimientos) {
    const session = Auth.getSession();

    return `
      <div class="p-0">
        <!-- Header del expediente -->
        <div class="p-4 border-bottom" style="background:linear-gradient(135deg,#f8fafc,#e8f0f8);">
          <div class="d-flex align-items-start gap-3">
            <div class="cliente-avatar" style="width:56px;height:56px;font-size:20px;">
              ${UI.initials(cliente.nombre)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h5 class="fw-bold mb-0">${cliente.nombre}</h5>
                ${UI.estadoBadge(cliente.estado)}
              </div>
              <div class="d-flex flex-wrap gap-3 mt-2">
                ${cliente.telefono ? `
                  <a href="${UI.whatsappLink(cliente.telefono)}" target="_blank" class="btn-whatsapp btn btn-sm">
                    <i class="bi bi-whatsapp me-1"></i>${cliente.telefono}
                  </a>` : ''}
                ${cliente.ubicacion ? `
                  <span class="text-muted small">
                    <i class="bi bi-geo-alt me-1"></i>${cliente.ubicacion}
                  </span>` : ''}
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary"
                onclick="Expediente.editarClienteDesdeExpediente('${cliente.id}')">
                <i class="bi bi-pencil me-1"></i>Editar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav expediente-tabs border-bottom px-4" id="expedienteTabs">
          <li class="nav-item">
            <a class="nav-link active" data-tab="proyecto" href="#">
              <i class="bi bi-building me-1"></i>Proyecto
            </a>
          </li>
          ${Proyectos.ESTADOS_FIRMADOS.includes(cliente.estado) ? `
          <li class="nav-item">
            <a class="nav-link" data-tab="pagos" href="#">
              <i class="bi bi-cash me-1"></i>Pagos
            </a>
          </li>` : ''}
          <li class="nav-item">
            <a class="nav-link" data-tab="seguimiento" href="#">
              <i class="bi bi-chat-dots me-1"></i>Seguimiento
              <span class="badge bg-primary ms-1">${seguimientos.length}</span>
            </a>
          </li>
        </ul>

        <!-- Tab content -->
        <div class="p-4" id="expedienteTabContent">
          ${await this._tabProyecto(cliente, proyecto)}
        </div>
      </div>`;
  },

  async _tabProyecto(cliente, proyecto) {
    if (!proyecto) {
      return `
        <div class="text-center py-5">
          <i class="bi bi-building fs-1 text-muted d-block mb-3 opacity-50"></i>
          <h6 class="fw-semibold text-muted">Sin proyecto asignado</h6>
          <p class="text-muted small">Crea un proyecto para este cliente</p>
          <button class="btn btn-success" onclick="Proyectos.abrirModalNuevo('${cliente.id}')">
            <i class="bi bi-plus-lg me-2"></i>Crear Proyecto
          </button>
        </div>`;
    }

    const firmado = Proyectos.ESTADOS_FIRMADOS.includes(cliente.estado);

    return `
      <div class="row g-4">

        <!-- Columna izquierda: detalles -->
        <div class="${firmado ? 'col-md-6' : 'col-12'}">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold mb-0"><i class="bi bi-house me-2 text-success"></i>Detalles del Proyecto</h6>
            ${!firmado ? `
              <span class="badge bg-secondary px-3 py-2">
                <i class="bi bi-clock me-1"></i>Cotización — pendiente de firma
              </span>` : ''}
          </div>

          ${firmado ? `<div class="mb-3">${Proyectos._fechaEntregaBadge(proyecto.fechaEntrega)}</div>` : ''}

          <!-- Info básica -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <div class="rounded-3 p-2 text-center" style="background:#f0fdf4;">
                <div class="fw-bold text-success">${UI.formatCurrency(proyecto.precio)}</div>
                <div class="text-muted" style="font-size:11px;">Precio Total</div>
              </div>
            </div>
            <div class="col-6">
              <div class="rounded-3 p-2 text-center" style="background:#eff6ff;">
                <div class="fw-bold text-primary">${proyecto.area} m²</div>
                <div class="text-muted" style="font-size:11px;">Área</div>
              </div>
            </div>
            ${firmado && proyecto.incluyePlaca ? `
            <div class="col-12">
              <div class="rounded-3 p-2 text-center" style="background:#fffbeb;">
                <div class="fw-bold text-warning">${UI.formatCurrency(proyecto.placaPrecio)}</div>
                <div class="text-muted" style="font-size:11px;">Placa de Cimentación</div>
              </div>
            </div>` : ''}
          </div>

          <!-- Modelo -->
          <div class="mb-3 p-3 rounded-3 border">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Modelo</div>
            <div class="fw-semibold">${proyecto.modelo}</div>
          </div>

          <!-- Especificaciones técnicas -->
          ${this._renderEspecificaciones(proyecto.especificaciones)}

          <!-- Notas técnicas -->
          ${proyecto.notas ? `
            <div class="mt-3 p-3 rounded-3" style="background:#fefce8;border:1px solid #fde68a;">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-sticky-fill text-warning"></i>
                <span class="fw-semibold small text-uppercase">Notas Técnicas</span>
              </div>
              <p class="mb-0 small" style="line-height:1.6;">${proyecto.notas}</p>
            </div>` : ''}

          ${!firmado ? `
            <div class="alert alert-warning mt-3 py-2 small">
              <i class="bi bi-info-circle me-1"></i>
              Para activar pagos, fecha de entrega y evidencias, cambia el estado del cliente a
              <strong>Firmado</strong> y luego edita el proyecto.
            </div>` : ''}

          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-sm btn-outline-success" onclick="Proyectos.abrirModalEditar('${proyecto.id}')">
              <i class="bi bi-pencil me-1"></i>Editar Proyecto
            </button>
            <small class="text-muted align-self-center">
              Registrado: ${UI.formatDate(proyecto.createdAt)}
            </small>
          </div>
        </div>

        <!-- Columna derecha: pagos (solo si firmado) -->
        ${firmado ? `
        <div class="col-md-6">
          <h6 class="fw-bold mb-3"><i class="bi bi-cash me-2 text-primary"></i>Resumen de Pagos</h6>
          <div id="resumenPagosExpediente">
            ${await Pagos.renderEtapasExpediente(cliente.id, proyecto.id)}
          </div>
        </div>` : ''}

        <!-- Galería (solo si firmado) -->
        ${firmado ? `
        <div class="col-12">
          <hr class="my-1" />
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold mb-0">
              <i class="bi bi-images me-2 text-primary"></i>Evidencias / Planos
              ${(proyecto.archivos||[]).length > 0
                ? `<span class="badge bg-primary ms-1">${proyecto.archivos.length}</span>`
                : ''}
            </h6>
            <button class="btn btn-sm btn-outline-primary" onclick="Proyectos.abrirModalEditar('${proyecto.id}')">
              <i class="bi bi-plus-lg me-1"></i>Agregar
            </button>
          </div>
          ${Proyectos.renderGaleria(proyecto)}
        </div>` : ''}

      </div>`;
  },

  async _tabPagos(clienteId, proyectoId) {
    return `
      <div>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold mb-0"><i class="bi bi-cash-stack me-2 text-primary"></i>Etapas de Pago</h6>
        </div>
        ${await Pagos.renderEtapasExpediente(clienteId, proyectoId)}
      </div>`;
  },

  async _tabSeguimiento(clienteId) {
    return `
      <div>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold mb-0"><i class="bi bi-chat-dots me-2 text-purple"></i>Historial de Seguimiento</h6>
          <button class="btn btn-sm btn-primary" onclick="Seguimiento.abrirModal('${clienteId}')">
            <i class="bi bi-plus-lg me-1"></i>Agregar
          </button>
        </div>
        ${await Seguimiento.renderTimeline(clienteId)}
      </div>`;
  },

  // ── Renderizar especificaciones técnicas ─────────────────────────────────
  _renderEspecificaciones(esp) {
    if (!esp) return '';

    const items = [
      { icon: 'bi-bricks',        label: 'Sistema',          val: esp.sistema },
      { icon: 'bi-house-door',    label: 'Estilo',           val: esp.estilo },
      { icon: 'bi-arrows-vertical',label:'Altura',           val: esp.alturaMin && esp.alturaMax ? `${esp.alturaMin}m — ${esp.alturaMax}m` : (esp.alturaMin || esp.alturaMax || null) },
      { icon: 'bi-house-fill',    label: 'Cubierta',         val: esp.cubierta === 'Otro' ? esp.cubiertaOtro : esp.cubierta },
      { icon: 'bi-grid-3x3-gap', label: 'Ornamentación',    val: this._ornLabel(esp) },
      { icon: 'bi-door-open',     label: 'Puertas',          val: this._puertaLabel(esp) }
    ].filter(i => i.val);

    if (items.length === 0) return '';

    const secciones = [
      { titulo: 'Construcción',   icono: 'bi-bricks',       color: '#6366f1', bg: '#eef2ff', keys: ['Sistema', 'Estilo', 'Altura'] },
      { titulo: 'Cubierta',       icono: 'bi-house-fill',   color: '#0891b2', bg: '#ecfeff', keys: ['Cubierta'] },
      { titulo: 'Ornamentación',  icono: 'bi-grid-3x3-gap', color: '#059669', bg: '#ecfdf5', keys: ['Ornamentación'] },
      { titulo: 'Puertas',        icono: 'bi-door-open',    color: '#d97706', bg: '#fffbeb', keys: ['Puertas'] }
    ];

    return `
      <div class="mt-3">
        <div class="d-flex align-items-center gap-2 mb-3">
          <div style="height:1.5px;flex:1;background:linear-gradient(90deg,#e2e8f0,transparent);"></div>
          <span class="fw-bold small text-uppercase text-muted" style="letter-spacing:1px;">
            <i class="bi bi-tools me-1"></i>Especificaciones
          </span>
          <div style="height:1.5px;flex:1;background:linear-gradient(90deg,transparent,#e2e8f0);"></div>
        </div>
        <div class="row g-2">
          ${items.map(item => `
            <div class="col-12">
              <div class="d-flex align-items-start gap-2 p-2 rounded-3" style="background:#f8fafc;border:1px solid #e8edf2;">
                <i class="bi ${item.icon} mt-1 flex-shrink-0" style="color:#64748b;font-size:13px;"></i>
                <div class="flex-grow-1">
                  <div class="text-muted" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${item.label}</div>
                  <div class="fw-semibold small">${item.val}</div>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  _ornLabel(esp) {
    if (!esp?.ornSistema) return null;
    let label = esp.ornSistema;
    if (esp.ornSistema === 'Apertura' && esp.ornApertura) label += ` · ${esp.ornApertura}`;
    const color = esp.ornColor === 'Otro' ? esp.ornColorOtro : esp.ornColor;
    if (color) label += ` · Anticorrosivo ${color}`;
    return label || null;
  },

  _puertaLabel(esp) {
    if (!esp?.puertaColor && !esp?.puertaChapa) return null;
    const parts = [];
    if (esp.puertaColor) parts.push(`Color ${esp.puertaColor}`);
    if (esp.puertaChapa) parts.push(esp.puertaChapa);
    return parts.join(' · ') || null;
  },

  // ── Editar cliente desde expediente (cierra expediente primero) ──────────
  editarClienteDesdeExpediente(clienteId) {
    const expedienteEl = document.getElementById('modalExpediente');
    const expedienteInstance = bootstrap.Modal.getInstance(expedienteEl);
    if (expedienteInstance && expedienteEl.classList.contains('show')) {
      expedienteEl.dataset.reopenClienteId = clienteId;
      expedienteInstance.hide();
      expedienteEl.addEventListener('hidden.bs.modal', async function abrirEditCliente() {
        expedienteEl.removeEventListener('hidden.bs.modal', abrirEditCliente);
        await Clientes.abrirModalEditar(clienteId);
      });
    } else {
      Clientes.abrirModalEditar(clienteId);
    }
  },

  bindEvents(clienteId, proyecto) {
    document.querySelectorAll('#expedienteTabs .nav-link').forEach(tab => {
      tab.addEventListener('click', async (e) => {
        e.preventDefault();
        document.querySelectorAll('#expedienteTabs .nav-link').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabName = tab.dataset.tab;
        const content = document.getElementById('expedienteTabContent');
        content.innerHTML = UI.spinner();

        if (tabName === 'proyecto') {
          const cliente = await DB.get(DB.STORES.clientes, clienteId);
          content.innerHTML = await this._tabProyecto(cliente, proyecto);
        } else if (tabName === 'pagos') {
          content.innerHTML = await this._tabPagos(clienteId, proyecto?.id);
        } else if (tabName === 'seguimiento') {
          content.innerHTML = await this._tabSeguimiento(clienteId);
        }
      });
    });
  }
};

// ── App Principal ─────────────────────────────────────────────────────────────
window.App = {
  currentPage: 'dashboard',

  // ── Inicializar ───────────────────────────────────────────────────────────
  async init() {
    try {
      await DB.init();
      await DB.seed();

      if (Auth.isAuthenticated()) {
        this.showApp();
      } else {
        this.showLogin();
      }

      this._bindGlobalEvents();
      this._checkOnlineStatus();
      this._checkReminders();

    } catch (err) {
      console.error('[App] Error al inicializar:', err);
      alert('Error al inicializar la aplicación: ' + err.message);
    }
  },

  // ── Mostrar login ─────────────────────────────────────────────────────────
  showLogin() {
    document.getElementById('loginScreen').classList.remove('d-none');
    document.getElementById('appScreen').classList.add('d-none');
  },

  // ── Mostrar app ───────────────────────────────────────────────────────────
  showApp() {
    document.getElementById('loginScreen').classList.add('d-none');
    document.getElementById('appScreen').classList.remove('d-none');

    const session = Auth.getSession();
    // Actualizar nombre si sigue siendo "Administrador" → "George"
    const nombre = session?.nombre === 'Administrador' ? 'George' : (session?.nombre || 'George');
    document.getElementById('sidebarUserName').textContent = nombre;
    document.getElementById('sidebarUserRole').textContent = Auth.getRoleName(session?.rol || '');
    document.getElementById('sidebarAvatar').textContent   = UI.initials(nombre);

    this.navigate('dashboard');
    this.updateBadges();

    // Solicitar permisos de notificaciones push (con pequeño delay para no interrumpir)
    setTimeout(() => PushNotif.requestPermission(), 2000);
  },

  // ── Navegar a página ──────────────────────────────────────────────────────
  async navigate(page) {
    this.currentPage = page;

    // Actualizar sidebar activo
    document.querySelectorAll('.sidebar-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });

    // Actualizar título
    const titles = {
      dashboard:     'Dashboard',
      clientes:      'Clientes',
      proyectos:     'Proyectos',
      pagos:         'Control de Pagos',
      finanzas:      'Mis Finanzas',
      tareas:        'Tareas y Pendientes',
      configuracion: 'Configuración'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    // Cerrar sidebar en móvil
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('d-none');

    // Renderizar página
    const pages = {
      dashboard:     () => Dashboard.render(),
      clientes:      () => Clientes.render(),
      proyectos:     () => Proyectos.render(),
      pagos:         () => Pagos.render(),
      finanzas:      () => Finanzas.render(),
      tareas:        () => Tareas.render(),
      configuracion: () => Configuracion.render()
    };

    if (pages[page]) await pages[page]();
  },

  // ── Actualizar badges ─────────────────────────────────────────────────────
  async updateBadges() {
    const [clientes, pagos, tareas] = await Promise.all([
      DB.getAll(DB.STORES.clientes),
      DB.getAll(DB.STORES.pagos),
      DB.getAll(DB.STORES.tareas)
    ]);

    document.getElementById('badgeClientes').textContent = clientes.length || '';
    const pendientesPago = pagos.filter(p => p.estado !== 'pagado').length;
    document.getElementById('badgePagos').textContent = pendientesPago || '';

    // Badge tareas
    const tareasPendientes = tareas.filter(t => t.estado !== 'completada').length;
    const badgeTareas = document.getElementById('badgeTareas');
    if (badgeTareas) {
      if (tareasPendientes > 0) {
        badgeTareas.textContent = tareasPendientes;
        badgeTareas.style.display = '';
      } else {
        badgeTareas.style.display = 'none';
      }
    }

    // Badge notificaciones
    const sinSeguimiento = clientes.filter(c => {
      if (['finalizado', 'perdido'].includes(c.estado)) return false;
      const ref  = c.ultimoSeguimiento || c.createdAt;
      const dias = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
      return dias > 7;
    }).length;

    const totalAlertas = sinSeguimiento + pendientesPago;
    const badge = document.getElementById('notifBadge');
    if (totalAlertas > 0) {
      badge.textContent = totalAlertas;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  },

  // ── Eventos globales ──────────────────────────────────────────────────────
  _bindGlobalEvents() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user  = document.getElementById('loginUser').value;
      const pass  = document.getElementById('loginPass').value;
      const alert = document.getElementById('loginAlert');
      const msg   = document.getElementById('loginAlertMsg');
      const btn   = e.target.querySelector('button[type="submit"]');

      // Mostrar spinner en el botón
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Verificando...';
      btn.disabled = true;

      try {
        await Auth.login(user, pass);
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>¡Bienvenido!';
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
        setTimeout(() => this.showApp(), 400);
      } catch (err) {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        msg.textContent = err.message;
        alert.classList.remove('d-none');
        Sound.play('danger');
        // Sacudir el formulario
        const card = document.querySelector('#loginScreen .card');
        if (card) {
          card.style.animation = 'loginShake 0.4s ease';
          setTimeout(() => { card.style.animation = ''; }, 400);
        }
        setTimeout(() => alert.classList.add('d-none'), 4000);
      }
    });

    // Toggle password
    document.getElementById('togglePass').addEventListener('click', () => {
      const input = document.getElementById('loginPass');
      const icon  = document.querySelector('#togglePass i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
      }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => Auth.logout());

    // Sidebar links
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
      });
    });

    // Mobile sidebar
    document.getElementById('openSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('open');
      document.getElementById('sidebarOverlay').classList.remove('d-none');
    });

    document.getElementById('closeSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.add('d-none');
    });

    document.getElementById('sidebarOverlay').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.add('d-none');
    });

    // Notificaciones
    document.getElementById('btnNotifications').addEventListener('click', () => {
      UI.mostrarPanelNotificaciones();
    });
  },

  // ── Estado online/offline ─────────────────────────────────────────────────
  _checkOnlineStatus() {
    const update = () => {
      const online = navigator.onLine;
      const dot  = document.getElementById('syncStatus');
      const text = document.getElementById('syncText');
      dot.className    = 'sync-dot ' + (online ? 'online' : 'offline');
      text.textContent = online ? 'En línea' : 'Sin conexión';
    };

    update();
    window.addEventListener('online',  () => {
      update();
      UI.toast('Conexión restaurada', 'success');
    });
    window.addEventListener('offline', () => {
      update();
      UI.toast('Sin conexión — modo offline activo', 'warning');
    });
  },

  // ── Verificar recordatorios ───────────────────────────────────────────────
  async _checkReminders() {
    const seguimientos = await DB.getAll(DB.STORES.seguimientos);
    const ahora = new Date();

    for (const s of seguimientos) {
      if (!s.recordatorio || s.recordatorioMostrado) continue;
      const fecha = new Date(s.recordatorio);
      if (fecha <= ahora) {
        const cliente = await DB.get(DB.STORES.clientes, s.clienteId);
        UI.toast(
          `${cliente?.nombre || 'Cliente'} — ${s.descripcion.substring(0, 60)}`,
          'alert',
          8000
        );
        s.recordatorioMostrado = true;
        await DB.put(DB.STORES.seguimientos, s);
      }
    }
  },

  // ── Panel de notificaciones ───────────────────────────────────────────────
  async _mostrarNotificaciones() {
    const [clientes, pagos] = await Promise.all([
      DB.getAll(DB.STORES.clientes),
      DB.getAll(DB.STORES.pagos)
    ]);

    const notifs = [];

    // Clientes sin seguimiento
    for (const c of clientes) {
      if (['finalizado', 'perdido'].includes(c.estado)) continue;
      const ref  = c.ultimoSeguimiento || c.createdAt;
      const dias = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
      if (dias > 7) {
        notifs.push({ tipo: 'alert', msg: `${c.nombre} sin seguimiento hace ${dias} días` });
      }
    }

    // Pagos pendientes
    const pendientes = pagos.filter(p => p.estado === 'pendiente');
    if (pendientes.length > 0) {
      notifs.push({
        tipo: 'warning',
        msg:  `${pendientes.length} etapa${pendientes.length > 1 ? 's' : ''} de pago pendiente${pendientes.length > 1 ? 's' : ''}`
      });
    }

    if (notifs.length === 0) {
      UI.toast('Todo al día — sin alertas pendientes', 'success');
      return;
    }

    // Mostrar con pequeño delay entre cada una para que se apilen visualmente
    notifs.forEach((n, i) => {
      setTimeout(() => UI.toast(n.msg, n.tipo, 6000), i * 400);
    });
  }
};

// ── Registrar Service Worker ──────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      // Detectar nueva versión disponible
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Hay una nueva versión — notificar al usuario
            UI.toast('Nueva versión disponible. Recarga para actualizar.', 'info', 8000);
          }
        });
      });
    }).catch(err => {
      console.warn('[SW] No se pudo registrar:', err);
    });
  });
}

// ── PWA Install prompt ────────────────────────────────────────────────────────
let _deferredInstallPrompt = null;

// Cuando el navegador soporta instalación automática
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;

  // Mostrar sección de instalación directa en el modal
  const autoSection = document.getElementById('pwaAutoInstall');
  if (autoSection) autoSection.classList.remove('d-none');

  // Botón de instalación directa dentro del modal
  const btnDirecto = document.getElementById('btnInstalarDirecto');
  if (btnDirecto) {
    btnDirecto.onclick = async () => {
      if (!_deferredInstallPrompt) return;
      btnDirecto.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Instalando...';
      btnDirecto.disabled = true;
      _deferredInstallPrompt.prompt();
      const { outcome } = await _deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        UI.toast('¡ClienteAPP instalada en tu escritorio!', 'success', 7000);
        bootstrap.Modal.getInstance(document.getElementById('modalInstalar'))?.hide();
      } else {
        btnDirecto.innerHTML = '<i class="bi bi-download me-2"></i>Instalar Ahora';
        btnDirecto.disabled = false;
      }
      _deferredInstallPrompt = null;
    };
  }
});

// El botón siempre abre el modal de instrucciones
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnInstalarPWA');
  if (btn) {
    btn.addEventListener('click', () => {
      // Si hay prompt automático disponible, dispararlo directamente
      if (_deferredInstallPrompt) {
        _deferredInstallPrompt.prompt();
        _deferredInstallPrompt.userChoice.then(({ outcome }) => {
          if (outcome === 'accepted') {
            UI.toast('¡ClienteAPP instalada en tu escritorio!', 'success', 7000);
            btn.style.display = 'none';
          }
          _deferredInstallPrompt = null;
        });
      } else {
        // Mostrar modal con instrucciones
        UI.openModal('modalInstalar');
      }
    });
  }
});

window.addEventListener('appinstalled', () => {
  UI.toast('✅ ClienteAPP instalada correctamente en tu dispositivo', 'success', 6000);
  const btn = document.getElementById('btnInstalarPWA');
  if (btn) btn.style.display = 'none';
  _deferredInstallPrompt = null;
});

// ── Iniciar aplicación ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
