/* ============================================
   ClienteAPP — Módulo de Pagos por Etapas
   ============================================ */

window.Pagos = {

  // ── Etapas estándar de pago ───────────────────────────────────────────────
  ETAPAS: [
    { key: 'firma',      label: 'Firma del Contrato',    porcentaje: 50 },
    { key: 'materiales', label: 'Descarga de Materiales', porcentaje: 40 },
    { key: 'techo',      label: 'Instalación del Techo',  porcentaje: 10 }
  ],

  // ── Crear etapas al crear proyecto ────────────────────────────────────────
  async crearEtapasProyecto(proyecto) {
    for (const etapa of this.ETAPAS) {
      const valorEtapa = Math.round(proyecto.precio * etapa.porcentaje / 100);
      await DB.put(DB.STORES.pagos, {
        id:          DB.generateId(),
        clienteId:   proyecto.clienteId,
        proyectoId:  proyecto.id,
        etapa:       etapa.key,
        etapaLabel:  etapa.label,
        porcentaje:  etapa.porcentaje,
        valorTotal:  valorEtapa,
        valorPagado: 0,
        estado:      'pendiente',
        fecha:       null,
        observaciones: ''
      });
    }

    // Etapa placa si aplica
    if (proyecto.incluyePlaca && proyecto.placaPrecio > 0) {
      await DB.put(DB.STORES.pagos, {
        id:          DB.generateId(),
        clienteId:   proyecto.clienteId,
        proyectoId:  proyecto.id,
        etapa:       'placa',
        etapaLabel:  'Placa de Cimentación',
        porcentaje:  100,
        valorTotal:  proyecto.placaPrecio,
        valorPagado: 0,
        estado:      'pendiente',
        fecha:       null,
        observaciones: '',
        esPlaca:     true
      });
    }
  },

  // ── Renderizar página de pagos ────────────────────────────────────────────
  async render() {
    const content = document.getElementById('pageContent');
    content.innerHTML = UI.spinner('Cargando pagos...');

    const pagos    = await DB.getAll(DB.STORES.pagos);
    const clientes = await DB.getAll(DB.STORES.clientes);
    const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));

    // Agrupar por cliente
    const porCliente = {};
    for (const p of pagos) {
      if (!porCliente[p.clienteId]) porCliente[p.clienteId] = [];
      porCliente[p.clienteId].push(p);
    }

    const pendientes = pagos.filter(p => p.estado !== 'pagado').length;
    document.getElementById('badgePagos').textContent = pendientes || '';

    content.innerHTML = `
      <div class="fade-in">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 class="fw-bold mb-1">Control de Pagos</h4>
            <p class="text-muted mb-0 small">${pendientes} etapa${pendientes !== 1 ? 's' : ''} pendiente${pendientes !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <!-- Resumen -->
        <div class="row g-2 mb-4 flex-nowrap overflow-auto">
          ${this._resumenCards(pagos)}
        </div>

        <!-- Por cliente -->
        ${Object.keys(porCliente).length === 0
          ? UI.emptyState('bi-cash-stack', 'No hay pagos registrados', 'Los pagos se generan automáticamente al crear un proyecto')
          : Object.entries(porCliente).map(([cId, cPagos]) =>
              this._clientePagosCard(clienteMap[cId], cPagos)
            ).join('')
        }
      </div>`;
  },

  // ── Cards de resumen ──────────────────────────────────────────────────────
  _resumenCards(pagos) {
    const totalEsperado = pagos.reduce((s, p) => s + (p.valorTotal || 0), 0);
    const totalRecibido = pagos.reduce((s, p) => s + (p.valorPagado || 0), 0);
    const pendiente     = totalEsperado - totalRecibido;
    const porcentaje    = totalEsperado > 0 ? Math.round(totalRecibido / totalEsperado * 100) : 0;

    const cards = [
      {
        icon: 'bi-cash-stack', color: 'primary',
        valor: UI.formatCurrency(totalEsperado), label: 'Total Esperado'
      },
      {
        icon: 'bi-check-circle', color: 'success',
        valor: UI.formatCurrency(totalRecibido), label: 'Recibido'
      },
      {
        icon: 'bi-hourglass-split', color: 'warning',
        valor: UI.formatCurrency(pendiente), label: 'Por Cobrar'
      },
      {
        icon: 'bi-percent', color: 'info',
        valor: `${porcentaje}%`, label: 'Cobrado',
        progress: porcentaje
      }
    ];

    return cards.map(c => `
      <div class="col-6 col-lg-3">
        <div class="stat-card py-2 px-3">
          <div class="d-flex align-items-center gap-2">
            <div class="stat-icon bg-${c.color} bg-opacity-10 flex-shrink-0"
                 style="width:36px;height:36px;border-radius:10px;font-size:16px;">
              <i class="bi ${c.icon} text-${c.color}"></i>
            </div>
            <div class="min-w-0">
              <div class="fw-bold lh-1 text-truncate" style="font-size:14px;">${c.valor}</div>
              <small class="text-muted" style="font-size:11px;">${c.label}</small>
            </div>
          </div>
          ${c.progress !== undefined ? `
            <div class="progress mt-2" style="height:3px;">
              <div class="progress-bar bg-${c.color}" style="width:${c.progress}%"></div>
            </div>` : ''}
        </div>
      </div>`).join('');
  },

  // ── Card de pagos por cliente ─────────────────────────────────────────────
  _clientePagosCard(cliente, pagos) {
    if (!cliente) return '';
    const totalEsperado = pagos.reduce((s, p) => s + (p.valorTotal || 0), 0);
    const totalPagado   = pagos.reduce((s, p) => s + (p.valorPagado || 0), 0);
    const pct = totalEsperado > 0 ? Math.round(totalPagado / totalEsperado * 100) : 0;

    return `
      <div class="card-app p-4 mb-3">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-3">
            <div class="cliente-avatar">${UI.initials(cliente.nombre)}</div>
            <div>
              <h6 class="fw-bold mb-0">${cliente.nombre}</h6>
              <small class="text-muted">${UI.estadoBadge(cliente.estado)}</small>
            </div>
          </div>
          <div class="text-end">
            <div class="fw-bold">${UI.formatCurrency(totalPagado)} / ${UI.formatCurrency(totalEsperado)}</div>
            <small class="text-muted">${pct}% cobrado</small>
          </div>
        </div>

        <div class="progress mb-3" style="height:8px; border-radius:4px;">
          <div class="progress-bar ${pct === 100 ? 'bg-success' : pct > 50 ? 'bg-primary' : 'bg-warning'}"
               style="width:${pct}%; transition:width 0.5s;"></div>
        </div>

        <div class="row g-2">
          ${pagos.map(p => this._etapaRow(p)).join('')}
        </div>
      </div>`;
  },

  // ── Fila de etapa ─────────────────────────────────────────────────────────
  _etapaRow(p) {
    const pct = p.valorTotal > 0 ? Math.round(p.valorPagado / p.valorTotal * 100) : 0;
    const clsCard = p.estado === 'pagado' ? 'pagado' : p.estado === 'parcial' ? 'parcial' : '';

    return `
      <div class="col-md-4">
        <div class="pago-etapa ${clsCard}">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div>
              <span class="fw-semibold small">${p.etapaLabel}</span>
              ${p.esPlaca ? '<span class="badge bg-warning text-dark ms-1 small">Placa</span>' : `<span class="badge bg-secondary ms-1 small">${p.porcentaje}%</span>`}
            </div>
            ${UI.pagoBadge(p.estado)}
          </div>
          <div class="d-flex align-items-center justify-content-between mb-1">
            <small class="text-muted">${UI.formatCurrency(p.valorPagado)} / ${UI.formatCurrency(p.valorTotal)}</small>
            <small class="fw-semibold">${pct}%</small>
          </div>
          <div class="progress mb-2" style="height:4px;">
            <div class="progress-bar ${p.estado === 'pagado' ? 'bg-success' : 'bg-warning'}" style="width:${pct}%;"></div>
          </div>
          ${p.fecha ? `<small class="text-muted"><i class="bi bi-calendar me-1"></i>${UI.formatDate(p.fecha)}</small>` : ''}
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary w-100" onclick="Pagos.abrirModalPago('${p.id}')">
              <i class="bi bi-cash me-1"></i>Registrar Pago
            </button>
          </div>
        </div>
      </div>`;
  },

  // ── Renderizar etapas en expediente ───────────────────────────────────────
  async renderEtapasExpediente(clienteId, proyectoId) {
    const pagos = await DB.getByIndex(DB.STORES.pagos, 'clienteId', clienteId);
    const proyPagos = proyectoId ? pagos.filter(p => p.proyectoId === proyectoId) : pagos;

    if (proyPagos.length === 0) {
      return `<div class="text-center py-4 text-muted">
        <i class="bi bi-cash-stack fs-2 d-block mb-2 opacity-50"></i>
        No hay etapas de pago. Crea un proyecto primero.
      </div>`;
    }

    const totalEsperado = proyPagos.reduce((s, p) => s + (p.valorTotal || 0), 0);
    const totalPagado   = proyPagos.reduce((s, p) => s + (p.valorPagado || 0), 0);
    const pct = totalEsperado > 0 ? Math.round(totalPagado / totalEsperado * 100) : 0;

    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold">Progreso Total de Pago</span>
          <span class="fw-bold">${pct}% — ${UI.formatCurrency(totalPagado)} / ${UI.formatCurrency(totalEsperado)}</span>
        </div>
        <div class="progress mb-4" style="height:12px; border-radius:6px;">
          <div class="progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'} progress-bar-striped"
               style="width:${pct}%; transition:width 0.5s;"></div>
        </div>
        <div class="row g-2">
          ${proyPagos.map(p => this._etapaRow(p)).join('')}
        </div>
      </div>`;
  },

  // ── Abrir modal pago ──────────────────────────────────────────────────────
  async abrirModalPago(pagoId) {
    const p = await DB.get(DB.STORES.pagos, pagoId);
    if (!p) return;

    document.getElementById('pagoId').value            = p.id;
    document.getElementById('pagoClienteId').value     = p.clienteId;
    document.getElementById('pagoEtapa').value         = p.etapa;
    document.getElementById('pagoEtapaNombre').value   = p.etapaLabel;
    document.getElementById('pagoValor').value         = p.valorPagado || '';
    document.getElementById('pagoFecha').value         = p.fecha ? p.fecha.split('T')[0] : new Date().toISOString().split('T')[0];
    document.getElementById('pagoEstado').value        = p.estado || 'pendiente';
    document.getElementById('pagoObservaciones').value = p.observaciones || '';

    // Si el expediente está abierto, cerrarlo primero para evitar modales apilados
    const expedienteEl = document.getElementById('modalExpediente');
    const expedienteInstance = bootstrap.Modal.getInstance(expedienteEl);
    if (expedienteInstance && expedienteEl.classList.contains('show')) {
      // Guardar el clienteId para reabrir el expediente al terminar
      document.getElementById('pagoClienteId').dataset.reopenExpediente = p.clienteId;
      expedienteInstance.hide();
      // Esperar a que termine la animación de cierre antes de abrir el pago
      expedienteEl.addEventListener('hidden.bs.modal', function abrirPagoTrasExpediente() {
        expedienteEl.removeEventListener('hidden.bs.modal', abrirPagoTrasExpediente);
        UI.openModal('modalPago');
      });
    } else {
      document.getElementById('pagoClienteId').dataset.reopenExpediente = '';
      UI.openModal('modalPago');
    }
  },

  // ── Guardar pago ──────────────────────────────────────────────────────────
  async guardar() {
    const id     = document.getElementById('pagoId').value;
    const valor  = parseFloat(document.getElementById('pagoValor').value);
    const fecha  = document.getElementById('pagoFecha').value;
    const estado = document.getElementById('pagoEstado').value;

    if (!valor || !fecha) {
      UI.toast('Valor y fecha son obligatorios', 'warning');
      return;
    }

    const existing = await DB.get(DB.STORES.pagos, id);
    if (!existing) return;

    existing.valorPagado   = valor;
    existing.fecha         = fecha;
    existing.estado        = estado;
    existing.observaciones = document.getElementById('pagoObservaciones').value.trim();

    await DB.put(DB.STORES.pagos, existing);

    // Leer si hay que reabrir el expediente
    const reopenId = document.getElementById('pagoClienteId').dataset.reopenExpediente || '';

    UI.closeModal('modalPago');

    const etapaLabel = existing.etapaLabel;
    UI.toast(`Pago registrado: ${etapaLabel}`, 'cash');

    if (estado === 'pagado') {
      setTimeout(() => UI.toast(`Etapa "${etapaLabel}" completada al 100%`, 'success', 5000), 600);
    }

    App.updateBadges();

    // Reabrir expediente si venía de ahí
    if (reopenId) {
      const modalPagoEl = document.getElementById('modalPago');
      modalPagoEl.addEventListener('hidden.bs.modal', async function reabrirExpediente() {
        modalPagoEl.removeEventListener('hidden.bs.modal', reabrirExpediente);
        await Clientes.abrirExpediente(reopenId);
      });
    } else {
      // Refrescar página actual si no venía del expediente
      const page = App.currentPage;
      if (page === 'pagos') await Pagos.render();
    }
  }
};

document.getElementById('btnGuardarPago')?.addEventListener('click', () => Pagos.guardar());
