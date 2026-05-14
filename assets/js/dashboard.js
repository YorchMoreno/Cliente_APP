/* ============================================
   ClienteAPP — Dashboard Principal v2
   ============================================ */

window.Dashboard = {

  async render() {
    const content = document.getElementById('pageContent');
    content.innerHTML = UI.spinner('Cargando dashboard...');

    const [clientes, proyectos, pagos, seguimientos] = await Promise.all([
      DB.getAll(DB.STORES.clientes),
      DB.getAll(DB.STORES.proyectos),
      DB.getAll(DB.STORES.pagos),
      DB.getAll(DB.STORES.seguimientos)
    ]);

    const session = Auth.getSession();

    // ── Métricas globales ──────────────────────────────────────────────────
    const totalClientes     = clientes.length;
    const enConstruccion    = clientes.filter(c => c.estado === 'construccion').length;
    const firmados          = clientes.filter(c => ['firmado','construccion','finalizado'].includes(c.estado)).length;
    const finalizados       = clientes.filter(c => c.estado === 'finalizado').length;
    const perdidos          = clientes.filter(c => c.estado === 'perdido').length;

    const totalEsperado     = pagos.reduce((s, p) => s + (p.valorTotal  || 0), 0);
    const totalRecibido     = pagos.reduce((s, p) => s + (p.valorPagado || 0), 0);
    const totalPendiente    = totalEsperado - totalRecibido;
    const pctCobrado        = totalEsperado > 0 ? Math.round(totalRecibido / totalEsperado * 100) : 0;
    const etapasPendientes  = pagos.filter(p => p.estado !== 'pagado').length;

    // Clientes sin seguimiento > 7 días
    const sinSeguimiento = clientes.filter(c => {
      if (['finalizado','perdido'].includes(c.estado)) return false;
      const ref  = c.ultimoSeguimiento || c.createdAt;
      return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000) > 7;
    });

    // Por estado
    const porEstado = {};
    clientes.forEach(c => { porEstado[c.estado] = (porEstado[c.estado] || 0) + 1; });

    // Proyectos con entrega próxima (≤ 30 días)
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const entregasProximas = proyectos.filter(p => {
      if (!p.fechaEntrega) return false;
      const dias = Math.round((new Date(p.fechaEntrega + 'T00:00:00') - hoy) / 86400000);
      return dias >= 0 && dias <= 30;
    }).sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));

    // Pagos pendientes por cliente (top 5)
    const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));
    const pagosPendientesPorCliente = {};
    pagos.filter(p => p.estado !== 'pagado').forEach(p => {
      if (!pagosPendientesPorCliente[p.clienteId]) pagosPendientesPorCliente[p.clienteId] = 0;
      pagosPendientesPorCliente[p.clienteId] += (p.valorTotal - p.valorPagado);
    });
    const topDeudores = Object.entries(pagosPendientesPorCliente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    content.innerHTML = `
      <div class="fade-in">

        <!-- ── HERO HEADER ── -->
        <div class="dashboard-hero mb-4">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h3 class="fw-bold mb-1 text-white">
                ${saludo}, ${session?.nombre === 'Administrador' ? 'George' : (session?.nombre?.split(' ')[0] || 'George')} 👋
              </h3>
              <p class="mb-0 text-white opacity-75 small">
                <i class="bi bi-calendar3 me-1"></i>
                ${new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <div class="hero-pill">
                <i class="bi bi-people-fill me-1"></i>${totalClientes} clientes
              </div>
              <div class="hero-pill">
                <i class="bi bi-building me-1"></i>${enConstruccion} en obra
              </div>
              <div class="hero-pill ${etapasPendientes > 0 ? 'hero-pill-warn' : ''}">
                <i class="bi bi-cash me-1"></i>${etapasPendientes} pagos pendientes
              </div>
            </div>
          </div>
        </div>

        <!-- ── ALERTAS ── -->
        ${sinSeguimiento.length > 0 ? `
          <div class="alert alert-warning alert-dismissible fade show d-flex align-items-start gap-3 mb-4 shadow-sm" role="alert">
            <i class="bi bi-exclamation-triangle-fill fs-4 flex-shrink-0 mt-1"></i>
            <div>
              <strong>${sinSeguimiento.length} cliente${sinSeguimiento.length > 1 ? 's' : ''} sin seguimiento</strong>
              en más de 7 días:
              ${sinSeguimiento.slice(0, 3).map(c =>
                `<a href="#" class="alert-link fw-semibold" onclick="Clientes.abrirExpediente('${c.id}'); return false;">${c.nombre.split(' ')[0]}</a>`
              ).join(', ')}
              ${sinSeguimiento.length > 3 ? ` y ${sinSeguimiento.length - 3} más` : ''}
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>` : ''}

        <!-- ── KPI CARDS ── -->
        <div class="row g-3 mb-4">
          ${this._kpiCard('bi-people-fill', 'primary', totalClientes, 'Total Clientes', `${firmados} firmados`)}
          ${this._kpiCard('bi-building-fill', 'danger', enConstruccion, 'En Construcción', `${finalizados} finalizados`)}
          ${this._kpiCard('bi-hourglass-split', 'warning', etapasPendientes, 'Pagos Pendientes', `${UI.formatCurrency(totalPendiente)} por cobrar`)}
          ${this._kpiCard('bi-cash-coin', 'success', UI.formatCurrency(totalRecibido), 'Total Recaudado', `${pctCobrado}% del total`)}
        </div>

        <!-- ── FILA 2: Cobros + Estados ── -->
        <div class="row g-3 mb-4">

          <!-- Progreso global de cobros -->
          <div class="col-lg-5">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-graph-up-arrow me-2 text-success"></i>Progreso Global de Cobros
                </h6>
              </div>
              <div class="card-body px-4 pb-4">
                <div class="text-center mb-3">
                  <div class="display-6 fw-bold text-success counter" data-target="${pctCobrado}">0%</div>
                  <small class="text-muted">del total cobrado</small>
                </div>
                <div class="progress mb-3" style="height:14px;border-radius:8px;">
                  <div class="progress-bar bg-success progress-bar-striped progress-bar-animated"
                       role="progressbar" style="width:0%"
                       data-width="${pctCobrado}%"
                       aria-valuenow="${pctCobrado}" aria-valuemin="0" aria-valuemax="100">
                  </div>
                </div>
                <div class="row g-2 text-center">
                  <div class="col-4">
                    <div class="rounded-3 p-2" style="background:#f0fdf4;">
                      <div class="fw-bold text-success small">${UI.formatCurrency(totalRecibido)}</div>
                      <div class="text-muted" style="font-size:10px;">Recibido</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="rounded-3 p-2" style="background:#fffbeb;">
                      <div class="fw-bold text-warning small">${UI.formatCurrency(totalPendiente)}</div>
                      <div class="text-muted" style="font-size:10px;">Pendiente</div>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="rounded-3 p-2" style="background:#eff6ff;">
                      <div class="fw-bold text-primary small">${UI.formatCurrency(totalEsperado)}</div>
                      <div class="text-muted" style="font-size:10px;">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clientes por estado -->
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-bar-chart-fill me-2 text-primary"></i>Clientes por Estado
                </h6>
              </div>
              <div class="card-body px-4 pb-4">
                ${totalClientes === 0
                  ? '<p class="text-muted text-center py-3 mb-0">Sin clientes registrados</p>'
                  : this._estadoChart(porEstado, totalClientes)}
              </div>
            </div>
          </div>
        </div>

        <!-- ── FILA 3: Pendientes de pago + Entregas próximas ── -->
        <div class="row g-3 mb-4">

          <!-- Top pendientes de pago -->
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex align-items-center justify-content-between">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-cash-stack me-2 text-warning"></i>Saldos Pendientes por Cliente
                </h6>
                <a href="#" class="small text-primary text-decoration-none" onclick="App.navigate('pagos'); return false;">
                  Ver pagos <i class="bi bi-arrow-right"></i>
                </a>
              </div>
              <div class="card-body px-4 pb-4">
                ${topDeudores.length === 0
                  ? `<div class="text-center py-4 text-muted">
                       <i class="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
                       <small>¡Todo al día! Sin saldos pendientes</small>
                     </div>`
                  : topDeudores.map(([cId, monto]) => {
                      const c = clienteMap[cId];
                      if (!c) return '';
                      const cPagos  = pagos.filter(p => p.clienteId === cId);
                      const total   = cPagos.reduce((s, p) => s + (p.valorTotal || 0), 0);
                      const pagado  = cPagos.reduce((s, p) => s + (p.valorPagado || 0), 0);
                      const pct     = total > 0 ? Math.round(pagado / total * 100) : 0;
                      return `
                        <div class="d-flex align-items-center gap-3 py-2 border-bottom cursor-pointer"
                             onclick="Clientes.abrirExpediente('${c.id}')" style="cursor:pointer;">
                          <div class="cliente-avatar flex-shrink-0" style="width:36px;height:36px;font-size:13px;">
                            ${UI.initials(c.nombre)}
                          </div>
                          <div class="flex-grow-1 min-w-0">
                            <div class="fw-semibold small text-truncate">${c.nombre}</div>
                            <div class="progress mt-1" style="height:4px;border-radius:2px;">
                              <div class="progress-bar ${pct > 70 ? 'bg-success' : pct > 30 ? 'bg-warning' : 'bg-danger'}"
                                   style="width:${pct}%;transition:width 1s ease;"></div>
                            </div>
                          </div>
                          <div class="text-end flex-shrink-0">
                            <div class="fw-bold text-danger small">${UI.formatCurrency(monto)}</div>
                            <div class="text-muted" style="font-size:10px;">${pct}% pagado</div>
                          </div>
                        </div>`;
                    }).join('')
                }
              </div>
            </div>
          </div>

          <!-- Entregas próximas -->
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex align-items-center justify-content-between">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-calendar-event me-2 text-info"></i>Entregas Próximas (30 días)
                </h6>
                <span class="badge bg-info text-dark">${entregasProximas.length}</span>
              </div>
              <div class="card-body px-4 pb-4">
                ${entregasProximas.length === 0
                  ? `<div class="text-center py-4 text-muted">
                       <i class="bi bi-calendar-check fs-2 d-block mb-2 opacity-40"></i>
                       <small>Sin entregas programadas en los próximos 30 días</small>
                     </div>`
                  : entregasProximas.map(p => {
                      const c    = clienteMap[p.clienteId];
                      const dias = Math.round((new Date(p.fechaEntrega + 'T00:00:00') - hoy) / 86400000);
                      const cls  = dias <= 7 ? 'danger' : dias <= 14 ? 'warning' : 'success';
                      return `
                        <div class="d-flex align-items-center gap-3 py-2 border-bottom"
                             onclick="Clientes.abrirExpediente('${p.clienteId}')" style="cursor:pointer;">
                          <div class="flex-shrink-0 text-center" style="width:44px;">
                            <div class="fw-bold text-${cls}" style="font-size:18px;line-height:1;">${dias}</div>
                            <div class="text-muted" style="font-size:10px;">días</div>
                          </div>
                          <div class="flex-grow-1 min-w-0">
                            <div class="fw-semibold small text-truncate">${c ? c.nombre : 'Cliente'}</div>
                            <div class="text-muted" style="font-size:11px;">
                              <i class="bi bi-house me-1"></i>${p.modelo} · ${UI.formatDate(p.fechaEntrega)}
                            </div>
                          </div>
                          <span class="badge bg-${cls} bg-opacity-10 text-${cls} border border-${cls} border-opacity-25">
                            ${dias === 0 ? '¡Hoy!' : dias <= 7 ? 'Urgente' : 'Próximo'}
                          </span>
                        </div>`;
                    }).join('')
                }
              </div>
            </div>
          </div>
        </div>

        <!-- ── FILA 4: Últimos clientes + Seguimientos recientes ── -->
        <div class="row g-3">

          <!-- Últimos clientes -->
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex align-items-center justify-content-between">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-person-lines-fill me-2 text-primary"></i>Últimos Clientes
                </h6>
                <a href="#" class="small text-primary text-decoration-none" onclick="App.navigate('clientes'); return false;">
                  Ver todos <i class="bi bi-arrow-right"></i>
                </a>
              </div>
              <div class="card-body px-4 pb-4">
                ${this._ultimosClientes(clientes)}
              </div>
            </div>
          </div>

          <!-- Seguimientos recientes -->
          <div class="col-lg-6">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white border-0 pt-4 pb-2 px-4">
                <h6 class="fw-bold mb-0">
                  <i class="bi bi-chat-dots-fill me-2 text-purple" style="color:#8e44ad;"></i>Seguimientos Recientes
                </h6>
              </div>
              <div class="card-body px-4 pb-4">
                ${this._seguimientosRecientes(seguimientos, clienteMap)}
              </div>
            </div>
          </div>
        </div>

      </div>`;

    // Animar contadores y barras de progreso
    this._animarElementos();
  },

  // ── KPI Card ──────────────────────────────────────────────────────────────
  _kpiCard(icon, color, valor, label, sub) {
    const gradients = {
      primary: 'linear-gradient(135deg,#2d6a9f,#5a9fd4)',
      danger:  'linear-gradient(135deg,#dc3545,#f07080)',
      warning: 'linear-gradient(135deg,#f59e0b,#fcd34d)',
      success: 'linear-gradient(135deg,#28a745,#6ee7b7)',
      info:    'linear-gradient(135deg,#17a2b8,#67e8f9)'
    };
    return `
      <div class="col-6 col-lg-3">
        <div class="kpi-card" style="--kpi-gradient:${gradients[color] || gradients.primary};">
          <div class="kpi-icon">
            <i class="bi ${icon}"></i>
          </div>
          <div class="kpi-valor">${valor}</div>
          <div class="kpi-label">${label}</div>
          <div class="kpi-sub">${sub}</div>
        </div>
      </div>`;
  },

  // ── Gráfico de estados ────────────────────────────────────────────────────
  _estadoChart(porEstado, total) {
    const estados = [
      { key: 'nuevo',        label: 'Nuevos',         color: '#10b981', icon: 'bi-circle-fill' },
      { key: 'cotizado',     label: 'Cotizados',       color: '#3b82f6', icon: 'bi-circle-fill' },
      { key: 'negociacion',  label: 'Negociación',     color: '#f59e0b', icon: 'bi-circle-fill' },
      { key: 'firmado',      label: 'Firmados',        color: '#f97316', icon: 'bi-circle-fill' },
      { key: 'construccion', label: 'En Construcción', color: '#ef4444', icon: 'bi-circle-fill' },
      { key: 'finalizado',   label: 'Finalizados',     color: '#06b6d4', icon: 'bi-circle-fill' },
      { key: 'perdido',      label: 'Perdidos',        color: '#94a3b8', icon: 'bi-circle-fill' }
    ];

    return estados
      .filter(e => (porEstado[e.key] || 0) > 0)
      .map(e => {
        const count = porEstado[e.key] || 0;
        const pct   = Math.round(count / total * 100);
        return `
          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="small fw-semibold d-flex align-items-center gap-1">
                <i class="bi bi-circle-fill" style="color:${e.color};font-size:8px;"></i>
                ${e.label}
              </span>
              <span class="small text-muted">${count} <span class="text-muted fw-normal">(${pct}%)</span></span>
            </div>
            <div class="progress" style="height:8px;border-radius:4px;">
              <div class="progress-bar" role="progressbar"
                   style="width:0%;background:${e.color};border-radius:4px;transition:width 1s ease;"
                   data-width="${pct}%"></div>
            </div>
          </div>`;
      }).join('');
  },

  // ── Últimos clientes ──────────────────────────────────────────────────────
  _ultimosClientes(clientes) {
    const ultimos = [...clientes]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (ultimos.length === 0) {
      return `<div class="text-center py-4 text-muted">
        <i class="bi bi-people fs-2 d-block mb-2 opacity-40"></i>
        <small>Sin clientes registrados</small>
      </div>`;
    }

    return ultimos.map(c => `
      <div class="d-flex align-items-center gap-3 py-2 border-bottom"
           onclick="Clientes.abrirExpediente('${c.id}')" style="cursor:pointer;">
        <div class="cliente-avatar flex-shrink-0" style="width:36px;height:36px;font-size:13px;">
          ${UI.initials(c.nombre)}
        </div>
        <div class="flex-grow-1 min-w-0">
          <div class="fw-semibold small text-truncate">${c.nombre}</div>
          <div class="text-muted" style="font-size:11px;">
            <i class="bi bi-telephone me-1"></i>${c.telefono || '—'}
          </div>
        </div>
        <div class="d-flex flex-column align-items-end gap-1">
          ${UI.estadoBadge(c.estado)}
          <span class="text-muted" style="font-size:10px;">${UI.timeAgo(c.createdAt)}</span>
        </div>
      </div>`).join('');
  },

  // ── Seguimientos recientes ────────────────────────────────────────────────
  _seguimientosRecientes(seguimientos, clienteMap) {
    const recientes = [...seguimientos]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (recientes.length === 0) {
      return `<div class="text-center py-4 text-muted">
        <i class="bi bi-chat-dots fs-2 d-block mb-2 opacity-40"></i>
        <small>Sin seguimientos registrados aún</small>
      </div>`;
    }

    const tipoConfig = {
      llamada:      { icon: 'bi-telephone-fill',  color: '#2d6a9f', label: 'Llamada' },
      whatsapp:     { icon: 'bi-whatsapp',         color: '#25d366', label: 'WhatsApp' },
      visita:       { icon: 'bi-house-fill',       color: '#f97316', label: 'Visita' },
      reunion:      { icon: 'bi-people-fill',      color: '#8e44ad', label: 'Reunión' },
      nota:         { icon: 'bi-sticky-fill',      color: '#f59e0b', label: 'Nota' },
      recordatorio: { icon: 'bi-bell-fill',        color: '#ef4444', label: 'Recordatorio' }
    };

    return recientes.map(s => {
      const c   = clienteMap[s.clienteId];
      const cfg = tipoConfig[s.tipo] || tipoConfig.nota;
      return `
        <div class="d-flex align-items-start gap-3 py-2 border-bottom"
             onclick="Clientes.abrirExpediente('${s.clienteId}')" style="cursor:pointer;">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle"
               style="width:32px;height:32px;background:${cfg.color}20;">
            <i class="bi ${cfg.icon}" style="color:${cfg.color};font-size:13px;"></i>
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="fw-semibold small">${c ? c.nombre.split(' ')[0] + ' ' + (c.nombre.split(' ')[1] || '') : 'Cliente'}</span>
              <span class="badge rounded-pill" style="background:${cfg.color}20;color:${cfg.color};font-size:10px;">${cfg.label}</span>
            </div>
            <div class="text-muted text-truncate" style="font-size:11px;">${s.descripcion}</div>
          </div>
          <span class="text-muted flex-shrink-0" style="font-size:10px;">${UI.timeAgo(s.createdAt)}</span>
        </div>`;
    }).join('');
  },

  // ── Animar barras y contadores ────────────────────────────────────────────
  _animarElementos() {
    // Barras de progreso con data-width
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('[data-width]').forEach(el => {
          el.style.width = el.dataset.width;
        });
      }, 150);
    });

    // Contador animado del porcentaje
    document.querySelectorAll('.counter').forEach(el => {
      const target = parseInt(el.dataset.target) || 0;
      let current  = 0;
      const step   = Math.max(1, Math.round(target / 40));
      const timer  = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + '%';
        if (current >= target) clearInterval(timer);
      }, 30);
    });
  }
};
