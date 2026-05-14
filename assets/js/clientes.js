/* ============================================
   ClienteAPP — Módulo de Clientes
   ============================================ */

window.Clientes = {

  filtroActual: 'todos',
  busqueda: '',

  // ── Renderizar página ────────────────────────────────────────────────────
  async render() {
    const content = document.getElementById('pageContent');
    content.innerHTML = UI.spinner('Cargando clientes...');

    const clientes = await DB.getAll(DB.STORES.clientes);
    const total = clientes.length;

    // Actualizar badge sidebar
    document.getElementById('badgeClientes').textContent = total;

    content.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h4 class="fw-bold mb-1">Clientes</h4>
            <p class="text-muted mb-0 small">${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-primary" id="btnNuevoCliente">
            <i class="bi bi-person-plus me-2"></i>Nuevo Cliente
          </button>
        </div>

        <!-- Búsqueda y filtros -->
        <div class="card-app p-3 mb-4">
          <div class="row g-3 align-items-center">
            <div class="col-md-5">
              <div class="search-bar">
                <i class="bi bi-search text-muted"></i>
                <input type="text" id="searchClientes" placeholder="Buscar por nombre, teléfono o ubicación..." value="${this.busqueda}" />
              </div>
            </div>
            <div class="col-md-7">
              <div class="d-flex flex-wrap gap-2">
                ${this._filterPills()}
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de clientes -->
        <div id="listaClientes">
          ${this._renderLista(clientes)}
        </div>
      </div>`;

    this._bindEvents();
  },

  // ── Filtros pills ─────────────────────────────────────────────────────────
  _filterPills() {
    const filtros = [
      { key: 'todos',        label: 'Todos' },
      { key: 'nuevo',        label: '🟢 Nuevos' },
      { key: 'cotizado',     label: '🔵 Cotizados' },
      { key: 'negociacion',  label: '🟡 Negociación' },
      { key: 'firmado',      label: '🟠 Firmados' },
      { key: 'construccion', label: '🔴 Construcción' },
      { key: 'finalizado',   label: '✅ Finalizados' },
      { key: 'perdido',      label: '❌ Perdidos' }
    ];
    return filtros.map(f =>
      `<button class="filter-pill ${this.filtroActual === f.key ? 'active' : ''}" data-filtro="${f.key}">${f.label}</button>`
    ).join('');
  },

  // ── Renderizar lista ──────────────────────────────────────────────────────
  _renderLista(clientes) {
    let filtrados = clientes;

    if (this.filtroActual !== 'todos') {
      filtrados = filtrados.filter(c => c.estado === this.filtroActual);
    }

    if (this.busqueda) {
      const q = this.busqueda.toLowerCase();
      filtrados = filtrados.filter(c =>
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.telefono || '').includes(q) ||
        (c.ubicacion || '').toLowerCase().includes(q)
      );
    }

    // Ordenar: más recientes primero
    filtrados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filtrados.length === 0) {
      return UI.emptyState(
        'bi-people',
        'No hay clientes',
        this.busqueda ? 'Intenta con otra búsqueda' : 'Agrega tu primer cliente para comenzar',
        `<button class="btn btn-primary mt-3" onclick="Clientes.abrirModalNuevo()">
          <i class="bi bi-person-plus me-2"></i>Agregar Cliente
        </button>`
      );
    }

    return `<div class="row g-3">
      ${filtrados.map(c => this._clienteCard(c)).join('')}
    </div>`;
  },

  // ── Card de cliente ───────────────────────────────────────────────────────
  _clienteCard(c) {
    const diasSinSeguimiento = this._diasSinSeguimiento(c);
    const alertaSeguimiento = diasSinSeguimiento > 7 && !['finalizado','perdido'].includes(c.estado)
      ? `<span class="badge bg-warning text-dark ms-1" title="Sin seguimiento hace ${diasSinSeguimiento} días">
           <i class="bi bi-clock"></i> ${diasSinSeguimiento}d
         </span>` : '';

    return `
      <div class="col-md-6 col-xl-4">
        <div class="cliente-card" onclick="Clientes.abrirExpediente('${c.id}')">
          <div class="d-flex align-items-start gap-3">
            <div class="cliente-avatar">${UI.initials(c.nombre)}</div>
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex align-items-center gap-1 flex-wrap">
                <h6 class="mb-0 fw-bold text-truncate">${c.nombre}</h6>
                ${alertaSeguimiento}
              </div>
              <div class="text-muted small mt-1">
                <i class="bi bi-telephone me-1"></i>${c.telefono || '—'}
              </div>
              ${c.ubicacion ? `<div class="text-muted small"><i class="bi bi-geo-alt me-1"></i>${c.ubicacion}</div>` : ''}
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between mt-3">
            <div>${UI.estadoBadge(c.estado)}</div>
            <div class="d-flex gap-1">
              ${c.telefono ? `
                <a href="${UI.whatsappLink(c.telefono)}" target="_blank" class="btn-whatsapp btn btn-sm"
                   onclick="event.stopPropagation()">
                  <i class="bi bi-whatsapp"></i>
                </a>` : ''}
              <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); Clientes.abrirModalEditar('${c.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); Clientes.eliminar('${c.id}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  },

  // ── Días sin seguimiento ──────────────────────────────────────────────────
  _diasSinSeguimiento(cliente) {
    const ref = cliente.ultimoSeguimiento || cliente.createdAt;
    if (!ref) return 0;
    return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  },

  // ── Bind eventos ─────────────────────────────────────────────────────────
  _bindEvents() {
    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => this.abrirModalNuevo());

    document.getElementById('searchClientes')?.addEventListener('input', (e) => {
      this.busqueda = e.target.value;
      this._actualizarLista();
    });

    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filtroActual = btn.dataset.filtro;
        this._actualizarLista();
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  // ── Actualizar lista sin re-renderizar todo ───────────────────────────────
  async _actualizarLista() {
    const clientes = await DB.getAll(DB.STORES.clientes);
    document.getElementById('listaClientes').innerHTML = this._renderLista(clientes);
  },

  // ── Abrir modal nuevo ─────────────────────────────────────────────────────
  async abrirModalNuevo() {
    document.getElementById('modalClienteTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Nuevo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('clienteId').value = '';
    UI.openModal('modalCliente');
  },

  // ── Abrir modal editar ────────────────────────────────────────────────────
  async abrirModalEditar(id) {
    const c = await DB.get(DB.STORES.clientes, id);
    if (!c) return;

    document.getElementById('modalClienteTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Cliente';
    document.getElementById('clienteId').value       = c.id;
    document.getElementById('clienteNombre').value   = c.nombre || '';
    document.getElementById('clienteTelefono').value = c.telefono || '';
    document.getElementById('clienteUbicacion').value= c.ubicacion || '';
    document.getElementById('clienteEstado').value   = c.estado || 'nuevo';
    document.getElementById('clienteNotas').value    = c.notas || '';

    UI.openModal('modalCliente');
  },

  // ── Guardar cliente ───────────────────────────────────────────────────────
  async guardar() {
    const id      = document.getElementById('clienteId').value;
    const nombre  = document.getElementById('clienteNombre').value.trim();
    const telefono= document.getElementById('clienteTelefono').value.trim();

    if (!nombre || !telefono) {
      UI.toast('Nombre y teléfono son obligatorios', 'warning');
      return;
    }

    const data = {
      id:        id || DB.generateId(),
      nombre,
      telefono,
      ubicacion: document.getElementById('clienteUbicacion').value.trim(),
      estado:    document.getElementById('clienteEstado').value,
      notas:     document.getElementById('clienteNotas').value.trim()
    };

    if (id) {
      const existing = await DB.get(DB.STORES.clientes, id);
      if (existing) {
        data.createdAt = existing.createdAt;
        data.ultimoSeguimiento = existing.ultimoSeguimiento;
      }
    }

    await DB.put(DB.STORES.clientes, data);
    UI.closeModal('modalCliente');
    UI.toast(id ? 'Cliente actualizado correctamente' : '¡Nuevo cliente registrado!', 'success');

    // Si venía del expediente, reabrirlo tras cerrar el modal
    const expedienteEl = document.getElementById('modalExpediente');
    const reopenId = expedienteEl?.dataset.reopenClienteId;
    if (id && reopenId === id) {
      const modalClienteEl = document.getElementById('modalCliente');
      modalClienteEl.addEventListener('hidden.bs.modal', async function reabrirExpediente() {
        modalClienteEl.removeEventListener('hidden.bs.modal', reabrirExpediente);
        expedienteEl.dataset.reopenClienteId = '';
        await Clientes.abrirExpediente(id);
      });
    }

    await this.render();
    App.updateBadges();
  },

  // ── Eliminar cliente ──────────────────────────────────────────────────────
  async eliminar(id) {
    const c = await DB.get(DB.STORES.clientes, id);
    if (!c) return;

    const ok = await UI.confirm(
      `¿Eliminar a <strong>${c.nombre}</strong>? Se eliminarán también sus proyectos, pagos y seguimientos.`,
      'Eliminar Cliente'
    );
    if (!ok) return;

    // Eliminar datos relacionados
    const proyectos = await DB.getByIndex(DB.STORES.proyectos, 'clienteId', id);
    for (const p of proyectos) await DB.delete(DB.STORES.proyectos, p.id);

    const pagos = await DB.getByIndex(DB.STORES.pagos, 'clienteId', id);
    for (const p of pagos) await DB.delete(DB.STORES.pagos, p.id);

    const segs = await DB.getByIndex(DB.STORES.seguimientos, 'clienteId', id);
    for (const s of segs) await DB.delete(DB.STORES.seguimientos, s.id);

    await DB.delete(DB.STORES.clientes, id);
    UI.toast('Cliente eliminado', 'danger');
    await this.render();
    App.updateBadges();
  },

  // ── Abrir expediente completo ─────────────────────────────────────────────
  async abrirExpediente(clienteId) {
    const cliente = await DB.get(DB.STORES.clientes, clienteId);
    if (!cliente) return;

    document.getElementById('expedienteTitulo').innerHTML =
      `<i class="bi bi-folder2-open me-2"></i>Expediente — ${cliente.nombre}`;

    const proyectos    = await DB.getByIndex(DB.STORES.proyectos, 'clienteId', clienteId);
    const pagos        = await DB.getByIndex(DB.STORES.pagos, 'clienteId', clienteId);
    const seguimientos = await DB.getByIndex(DB.STORES.seguimientos, 'clienteId', clienteId);

    const proyecto = proyectos[0] || null;

    document.getElementById('expedienteContent').innerHTML =
      await Expediente.render(cliente, proyecto, pagos, seguimientos);

    UI.openModal('modalExpediente');
    Expediente.bindEvents(clienteId, proyecto);
  }
};

// ── Bind modal guardar ────────────────────────────────────────────────────────
document.getElementById('btnGuardarCliente')?.addEventListener('click', () => Clientes.guardar());
document.getElementById('btnQuickAdd')?.addEventListener('click', () => Clientes.abrirModalNuevo());
