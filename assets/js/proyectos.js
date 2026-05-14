/* ============================================
   ClienteAPP — Módulo de Proyectos
   ============================================ */

window.Proyectos = {

  // Archivos pendientes en el modal (antes de guardar)
  _archivosNuevos: [],
  // Cache de archivos del proyecto actual (para el lightbox)
  _archivosCache: [],

  // Estados que implican contrato firmado
  ESTADOS_FIRMADOS: ['firmado', 'construccion', 'finalizado'],

  // ── ¿El cliente tiene contrato activo? ───────────────────────────────────
  async _clienteFirmado(clienteId) {
    const cliente = await DB.get(DB.STORES.clientes, clienteId);
    return cliente && this.ESTADOS_FIRMADOS.includes(cliente.estado);
  },

  // ── Renderizar página ────────────────────────────────────────────────────
  async render() {
    const content = document.getElementById('pageContent');
    content.innerHTML = UI.spinner('Cargando proyectos...');

    const proyectos = await DB.getAll(DB.STORES.proyectos);
    const clientes  = await DB.getAll(DB.STORES.clientes);
    const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c]));

    content.innerHTML = `
      <div class="fade-in">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 class="fw-bold mb-1">Proyectos</h4>
            <p class="text-muted mb-0 small">${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''} registrado${proyectos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        ${proyectos.length === 0
          ? UI.emptyState('bi-building', 'No hay proyectos', 'Los proyectos se crean desde el expediente de cada cliente')
          : `<div class="row g-3">${proyectos.map(p => this._proyectoCard(p, clienteMap[p.clienteId])).join('')}</div>`
        }
      </div>`;
  },

  // ── Card de proyecto ──────────────────────────────────────────────────────
  _proyectoCard(p, cliente) {
    const firmado   = cliente && this.ESTADOS_FIRMADOS.includes(cliente.estado);
    const nArchivos = (p.archivos || []).length;
    const esp       = p.especificaciones || {};

    // Chips de especificaciones para mostrar en la card
    const chips = [
      esp.sistema      ? { icon: 'bi-bricks',       label: esp.sistema } : null,
      esp.cubierta     ? { icon: 'bi-house-fill',    label: esp.cubierta === 'Otro' ? esp.cubiertaOtro : esp.cubierta } : null,
      esp.ornSistema   ? { icon: 'bi-grid-3x3-gap',  label: esp.ornSistema } : null,
      esp.puertaChapa  ? { icon: 'bi-door-open',     label: esp.puertaChapa } : null
    ].filter(Boolean).slice(0, 3);

    return `
      <div class="col-md-6 col-xl-4">
        <div class="proyecto-card h-100 d-flex flex-column">

          <!-- Header de la card -->
          <div class="proyecto-card-header">
            <div class="d-flex align-items-start justify-content-between gap-2">
              <div class="flex-grow-1 min-w-0">
                <h6 class="fw-bold mb-1 text-white text-truncate">${p.modelo || 'Sin modelo'}</h6>
                <div class="text-white opacity-75 small">
                  <i class="bi bi-person me-1"></i>${cliente ? cliente.nombre : 'Cliente no encontrado'}
                </div>
              </div>
              <div class="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                <span class="badge bg-white text-primary fw-bold">${p.area || 0} m²</span>
                ${firmado
                  ? '<span class="badge" style="background:rgba(255,255,255,0.2);color:white;"><i class="bi bi-patch-check me-1"></i>Firmado</span>'
                  : '<span class="badge" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);"><i class="bi bi-clock me-1"></i>Cotización</span>'}
              </div>
            </div>
          </div>

          <!-- Cuerpo -->
          <div class="proyecto-card-body flex-grow-1 d-flex flex-column">

            <!-- Precios -->
            <div class="row g-2 mb-3">
              <div class="col-${firmado && p.incluyePlaca ? '6' : '12'}">
                <div class="precio-box">
                  <div class="fw-bold text-success">${UI.formatCurrency(p.precio)}</div>
                  <div class="text-muted" style="font-size:10px;">PRECIO TOTAL</div>
                </div>
              </div>
              ${firmado && p.incluyePlaca ? `
              <div class="col-6">
                <div class="precio-box" style="background:#fffbeb;border-color:#fde68a;">
                  <div class="fw-bold text-warning">${UI.formatCurrency(p.placaPrecio)}</div>
                  <div class="text-muted" style="font-size:10px;">PLACA CIMENTACIÓN</div>
                </div>
              </div>` : ''}
            </div>

            <!-- Especificaciones chips -->
            ${chips.length > 0 ? `
              <div class="d-flex flex-wrap gap-1 mb-3">
                ${chips.map(c => `
                  <span class="espec-chip">
                    <i class="bi ${c.icon}"></i>${c.label}
                  </span>`).join('')}
              </div>` : ''}

            <!-- Altura si existe -->
            ${esp.alturaMin && esp.alturaMax ? `
              <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
                <i class="bi bi-arrows-vertical"></i>
                <span>Altura: ${esp.alturaMin}m — ${esp.alturaMax}m</span>
              </div>` : ''}

            <!-- Fecha entrega -->
            ${firmado ? `<div class="mb-3">${this._fechaEntregaBadge(p.fechaEntrega)}</div>` : ''}

            <!-- Evidencias -->
            ${nArchivos > 0 ? `
              <div class="mb-2">
                <span class="text-muted small">
                  <i class="bi bi-images me-1"></i>${nArchivos} evidencia${nArchivos > 1 ? 's' : ''}
                </span>
              </div>` : ''}

            <!-- Botones -->
            <div class="d-flex gap-2 mt-auto pt-2">
              <button class="btn btn-sm btn-primary flex-grow-1"
                onclick="Clientes.abrirExpediente('${p.clienteId}')">
                <i class="bi bi-folder2-open me-1"></i>Ver Expediente
              </button>
              <button class="btn btn-sm btn-outline-secondary"
                onclick="Proyectos.abrirModalEditar('${p.id}')" title="Editar proyecto">
                <i class="bi bi-pencil"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`;
  },

  // ── Badge fecha de entrega ────────────────────────────────────────────────
  _fechaEntregaBadge(fechaStr) {
    if (!fechaStr) {
      return `<span class="fecha-entrega-badge sin-fecha">
        <i class="bi bi-calendar"></i> Sin fecha de entrega
      </span>`;
    }
    const hoy   = new Date(); hoy.setHours(0,0,0,0);
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dias  = Math.round((fecha - hoy) / 86400000);
    const label = UI.formatDate(fechaStr);

    if (dias < 0) {
      return `<span class="fecha-entrega-badge vencida"><i class="bi bi-calendar-x"></i> Entrega: ${label} (vencida)</span>`;
    } else if (dias <= 14) {
      return `<span class="fecha-entrega-badge cercana"><i class="bi bi-calendar-event"></i> Entrega: ${label} (${dias}d)</span>`;
    } else {
      return `<span class="fecha-entrega-badge proxima"><i class="bi bi-calendar-check"></i> Entrega: ${label}</span>`;
    }
  },

  // ── Abrir modal nuevo ─────────────────────────────────────────────────────
  async abrirModalNuevo(clienteId) {
    const firmado = await this._clienteFirmado(clienteId);

    document.getElementById('modalProyectoTitle').innerHTML = '<i class="bi bi-building me-2"></i>Nuevo Proyecto';
    document.getElementById('formProyecto').reset();
    document.getElementById('proyectoId').value = '';
    document.getElementById('proyectoClienteId').value = clienteId || '';
    document.getElementById('placaPrecioGroup').classList.add('d-none');
    // Ocultar campos condicionales
    document.getElementById('especCubiertaOtroGroup')?.classList.add('d-none');
    document.getElementById('especOrnAperturaGroup')?.classList.remove('d-none');
    document.getElementById('especOrnColorOtroGroup')?.classList.add('d-none');
    this._archivosNuevos = [];
    this._renderPreview();
    this._toggleSeccionesFirmado(firmado);
    this._bindDropZone();

    const expedienteEl = document.getElementById('modalExpediente');
    const expedienteInstance = bootstrap.Modal.getInstance(expedienteEl);
    if (expedienteInstance && expedienteEl.classList.contains('show')) {
      expedienteEl.dataset.reopenClienteId = clienteId || '';
      expedienteInstance.hide();
      expedienteEl.addEventListener('hidden.bs.modal', function abrirProyTrasExpediente() {
        expedienteEl.removeEventListener('hidden.bs.modal', abrirProyTrasExpediente);
        UI.openModal('modalProyecto');
      });
    } else {
      UI.openModal('modalProyecto');
    }
  },

  // ── Abrir modal editar ────────────────────────────────────────────────────
  async abrirModalEditar(id) {
    const p = await DB.get(DB.STORES.proyectos, id);
    if (!p) return;

    const firmado = await this._clienteFirmado(p.clienteId);

    document.getElementById('modalProyectoTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Proyecto';
    document.getElementById('proyectoId').value          = p.id;
    document.getElementById('proyectoClienteId').value   = p.clienteId;
    document.getElementById('proyectoModelo').value      = p.modelo || '';
    document.getElementById('proyectoArea').value        = p.area || '';
    document.getElementById('proyectoPrecio').value      = p.precio || '';
    document.getElementById('proyectoPlaca').checked     = p.incluyePlaca || false;
    document.getElementById('proyectoPlacaPrecio').value = p.placaPrecio || '';
    document.getElementById('proyectoNotas').value       = p.notas || '';
    document.getElementById('proyectoFechaEntrega').value= p.fechaEntrega || '';

    // Características técnicas
    const esp = p.especificaciones || {};
    document.getElementById('especSistema').value       = esp.sistema      || '';
    document.getElementById('especEstilo').value        = esp.estilo       || '';
    document.getElementById('especAlturaMin').value     = esp.alturaMin    || '';
    document.getElementById('especAlturaMax').value     = esp.alturaMax    || '';
    document.getElementById('especCubierta').value      = esp.cubierta     || '';
    document.getElementById('especCubiertaOtro').value  = esp.cubiertaOtro || '';
    document.getElementById('especOrnSistema').value    = esp.ornSistema   || '';
    document.getElementById('especOrnApertura').value   = esp.ornApertura  || '';
    document.getElementById('especOrnColor').value      = esp.ornColor     || '';
    document.getElementById('especOrnColorOtro').value  = esp.ornColorOtro || '';
    document.getElementById('especPuertaColor').value   = esp.puertaColor  || '';
    document.getElementById('especPuertaChapa').value   = esp.puertaChapa  || '';

    // Mostrar/ocultar campos condicionales
    document.getElementById('especCubiertaOtroGroup')
      .classList.toggle('d-none', esp.cubierta !== 'Otro');
    document.getElementById('especOrnAperturaGroup')
      .classList.toggle('d-none', esp.ornSistema !== 'Apertura');
    document.getElementById('especOrnColorOtroGroup')
      .classList.toggle('d-none', esp.ornColor !== 'Otro');

    const placaGroup = document.getElementById('placaPrecioGroup');
    if (p.incluyePlaca) placaGroup.classList.remove('d-none');
    else placaGroup.classList.add('d-none');

    this._archivosNuevos = p.archivos ? [...p.archivos] : [];
    this._renderPreview();
    this._toggleSeccionesFirmado(firmado);
    this._bindDropZone();

    const expedienteEl = document.getElementById('modalExpediente');
    const expedienteInstance = bootstrap.Modal.getInstance(expedienteEl);
    // Solo cerrar el expediente si está realmente visible en pantalla
    if (expedienteInstance && expedienteEl.classList.contains('show')) {
      expedienteEl.dataset.reopenClienteId = p.clienteId;
      expedienteInstance.hide();
      expedienteEl.addEventListener('hidden.bs.modal', function abrirEditProyTrasExpediente() {
        expedienteEl.removeEventListener('hidden.bs.modal', abrirEditProyTrasExpediente);
        UI.openModal('modalProyecto');
      });
    } else {
      UI.openModal('modalProyecto');
    }
  },

  // ── Mostrar/ocultar secciones según si está firmado ───────────────────────
  _toggleSeccionesFirmado(firmado) {
    // Secciones que solo aplican cuando hay contrato firmado
    const ids = ['seccionFechaEntrega', 'seccionPlaca', 'seccionEvidencias'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (firmado) {
        el.classList.remove('d-none');
      } else {
        el.classList.add('d-none');
      }
    });

    // Banner informativo
    const banner = document.getElementById('bannerCotizacion');
    if (banner) {
      banner.classList.toggle('d-none', firmado);
    }
  },

  // ── Guardar proyecto ──────────────────────────────────────────────────────
  async guardar() {
    const id        = document.getElementById('proyectoId').value;
    const clienteId = document.getElementById('proyectoClienteId').value;
    const modelo    = document.getElementById('proyectoModelo').value.trim();
    const area      = parseFloat(document.getElementById('proyectoArea').value);
    const precio    = parseFloat(document.getElementById('proyectoPrecio').value);

    if (!modelo || !area || !precio) {
      UI.toast('Modelo, área y precio son obligatorios', 'warning');
      return;
    }

    const firmado      = await this._clienteFirmado(clienteId);
    const incluyePlaca = firmado && document.getElementById('proyectoPlaca').checked;
    const placaPrecio  = incluyePlaca ? parseFloat(document.getElementById('proyectoPlacaPrecio').value) || 0 : 0;
    const fechaEntrega = firmado ? (document.getElementById('proyectoFechaEntrega').value || null) : null;

    // Leer especificaciones técnicas
    const cubierta    = document.getElementById('especCubierta').value;
    const ornSistema  = document.getElementById('especOrnSistema').value;
    const ornColor    = document.getElementById('especOrnColor').value;

    const especificaciones = {
      sistema:       document.getElementById('especSistema').value,
      estilo:        document.getElementById('especEstilo').value.trim(),
      alturaMin:     document.getElementById('especAlturaMin').value,
      alturaMax:     document.getElementById('especAlturaMax').value,
      cubierta,
      cubiertaOtro:  cubierta === 'Otro' ? document.getElementById('especCubiertaOtro').value.trim() : '',
      ornSistema,
      ornApertura:   ornSistema === 'Apertura' ? document.getElementById('especOrnApertura').value : '',
      ornColor,
      ornColorOtro:  ornColor === 'Otro' ? document.getElementById('especOrnColorOtro').value.trim() : '',
      puertaColor:   document.getElementById('especPuertaColor').value.trim(),
      puertaChapa:   document.getElementById('especPuertaChapa').value
    };

    const data = {
      id:           id || DB.generateId(),
      clienteId,
      modelo,
      area,
      precio,
      especificaciones,
      incluyePlaca,
      placaPrecio,
      notas:        document.getElementById('proyectoNotas').value.trim(),
      fechaEntrega,
      archivos:     firmado ? [...this._archivosNuevos] : []
    };

    if (id) {
      const existing = await DB.get(DB.STORES.proyectos, id);
      if (existing) data.createdAt = existing.createdAt;
    }

    await DB.put(DB.STORES.proyectos, data);

    // Crear etapas de pago SOLO si es nuevo proyecto Y el cliente está firmado
    if (!id && firmado) {
      await Pagos.crearEtapasProyecto(data);
    }

    // Si ya existía y acaba de firmarse (tiene etapas?), verificar
    if (id && firmado) {
      const etapasExistentes = await DB.getByIndex(DB.STORES.pagos, 'proyectoId', data.id);
      if (etapasExistentes.length === 0) {
        await Pagos.crearEtapasProyecto(data);
        UI.toast('Etapas de pago generadas al confirmar firma', 'info', 5000);
      }
    }

    this._archivosNuevos = [];
    UI.closeModal('modalProyecto');

    const msg = firmado
      ? (id ? 'Proyecto actualizado' : 'Proyecto creado con etapas de pago')
      : (id ? 'Cotización actualizada' : 'Cotización guardada — lista para cuando firme');
    UI.toast(msg, 'success');

    if (clienteId) {
      const modalProyEl = document.getElementById('modalProyecto');
      modalProyEl.addEventListener('hidden.bs.modal', async function reabrirExpediente() {
        modalProyEl.removeEventListener('hidden.bs.modal', reabrirExpediente);
        await Clientes.abrirExpediente(clienteId);
      });
    }
  },

  // ── Drop zone y selección de archivos ────────────────────────────────────
  _bindDropZone() {
    const zone  = document.getElementById('dropZone');
    const input = document.getElementById('inputArchivos');
    if (!zone || !input) return;

    // Clonar para limpiar listeners anteriores
    const newZone  = zone.cloneNode(true);
    const newInput = input.cloneNode(true);
    zone.replaceWith(newZone);
    input.replaceWith(newInput);

    const dz = document.getElementById('dropZone');
    const fi = document.getElementById('inputArchivos');

    dz.addEventListener('dragover',  (e) => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      this._procesarArchivos([...e.dataTransfer.files]);
    });

    fi.addEventListener('change', () => {
      this._procesarArchivos([...fi.files]);
      fi.value = '';
    });
  },

  // ── Procesar archivos → Base64 ────────────────────────────────────────────
  async _procesarArchivos(files) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    let agregados = 0;

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        UI.toast(`"${file.name}" supera 5 MB`, 'warning');
        continue;
      }

      // Evitar duplicados por nombre
      if (this._archivosNuevos.find(a => a.nombre === file.name)) continue;

      const base64 = await this._fileToBase64(file);
      this._archivosNuevos.push({
        id:     DB.generateId(),
        nombre: file.name,
        tipo:   file.type,
        data:   base64,
        fecha:  new Date().toISOString()
      });
      agregados++;
    }

    if (agregados > 0) {
      this._renderPreview();
      UI.toast(`${agregados} archivo${agregados > 1 ? 's' : ''} agregado${agregados > 1 ? 's' : ''}`, 'success');
    }
  },

  // ── File → Base64 ─────────────────────────────────────────────────────────
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // ── Renderizar preview en el modal ────────────────────────────────────────
  _renderPreview() {
    const container = document.getElementById('archivosPreview');
    if (!container) return;

    if (this._archivosNuevos.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this._archivosNuevos.map((a, i) => {
      const esImagen = a.tipo.startsWith('image/');
      return `
        <div class="col-6 col-sm-4 col-md-3">
          <div class="archivo-thumb">
            ${esImagen
              ? `<img src="${a.data}" alt="${a.nombre}" />`
              : `<div class="archivo-pdf">
                   <i class="bi bi-file-earmark-pdf fs-2"></i>
                   <span class="small fw-semibold">PDF</span>
                 </div>`
            }
            <div class="archivo-info" title="${a.nombre}">${a.nombre}</div>
            <button class="btn-remove" onclick="Proyectos._eliminarArchivo(${i})" title="Eliminar">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  },

  // ── Eliminar archivo del preview ──────────────────────────────────────────
  _eliminarArchivo(index) {
    this._archivosNuevos.splice(index, 1);
    this._renderPreview();
  },

  // ── Renderizar galería en expediente ──────────────────────────────────────
  renderGaleria(proyecto) {
    const archivos = proyecto?.archivos || [];
    // Guardar en cache para el lightbox (evita pasar JSON en onclick)
    this._archivosCache = archivos;

    if (archivos.length === 0) {
      return `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-images fs-2 d-block mb-2 opacity-40"></i>
          <p class="mb-1 small fw-semibold">Sin evidencias fotográficas</p>
          <small>Edita el proyecto para agregar fotos o planos</small>
        </div>`;
    }

    return `
      <div class="galeria-grid">
        ${archivos.map((a, idx) => {
          const esImagen = a.tipo.startsWith('image/');
          // Pasar el índice directamente — más simple y sin problemas de escape
          return `
            <div class="galeria-item" onclick="Proyectos._abrirLightbox('${a.id}', Proyectos._archivosCache)">
              ${esImagen
                ? `<img src="${a.data}" alt="${a.nombre}" loading="lazy" />`
                : `<div class="archivo-pdf" style="height:100px;">
                     <i class="bi bi-file-earmark-pdf fs-2"></i>
                     <span class="small">PDF</span>
                   </div>`
              }
              <div class="galeria-label" title="${a.nombre}">${a.nombre}</div>
            </div>`;
        }).join('')}
      </div>`;
  },

  // ── Lightbox con navegación ───────────────────────────────────────────────
  _abrirLightbox(archivoId, archivos) {
    // archivos puede llegar como string JSON desde el onclick inline
    const lista = typeof archivos === 'string' ? JSON.parse(archivos) : archivos;
    let idx = lista.findIndex(a => a.id === archivoId);
    if (idx === -1) idx = 0;

    const mostrar = (i) => {
      const archivo = lista[i];
      if (!archivo) return;

      // Para PDF abrir en nueva pestaña
      if (!archivo.tipo.startsWith('image/')) {
        const win = window.open();
        win.document.write(`<iframe src="${archivo.data}" style="width:100%;height:100vh;border:none;"></iframe>`);
        return;
      }

      // Eliminar overlay anterior
      document.getElementById('lightboxOverlay')?.remove();

      const total    = lista.filter(a => a.tipo.startsWith('image/')).length;
      const imgIndex = lista.filter((a, j) => a.tipo.startsWith('image/') && j <= i).length;
      const hayPrev  = lista.slice(0, i).some(a => a.tipo.startsWith('image/'));
      const hayNext  = lista.slice(i + 1).some(a => a.tipo.startsWith('image/'));

      const html = `
        <div id="lightboxOverlay">
          <!-- Cerrar al clic en fondo -->
          <div style="position:absolute;inset:0;z-index:0;" onclick="document.getElementById('lightboxOverlay').remove()"></div>

          <!-- Contador -->
          ${total > 1 ? `<div class="lb-counter">${imgIndex} / ${total}</div>` : ''}

          <!-- Botón cerrar -->
          <button class="lb-close" onclick="document.getElementById('lightboxOverlay').remove()">
            <i class="bi bi-x-lg"></i>
          </button>

          <!-- Flecha anterior -->
          ${hayPrev ? `<button class="lb-nav lb-prev" id="lbPrev">
            <i class="bi bi-chevron-left"></i>
          </button>` : ''}

          <!-- Imagen -->
          <img src="${archivo.data}" alt="${archivo.nombre}"
               onclick="event.stopPropagation()"
               style="animation:fadeInUp 0.2s ease;" />

          <!-- Flecha siguiente -->
          ${hayNext ? `<button class="lb-nav lb-next" id="lbNext">
            <i class="bi bi-chevron-right"></i>
          </button>` : ''}

          <!-- Caption -->
          <div class="lb-caption">${archivo.nombre}</div>
        </div>`;

      document.body.insertAdjacentHTML('beforeend', html);

      // Navegación con botones
      document.getElementById('lbPrev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Buscar imagen anterior
        for (let j = i - 1; j >= 0; j--) {
          if (lista[j].tipo.startsWith('image/')) { mostrar(j); break; }
        }
      });

      document.getElementById('lbNext')?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Buscar imagen siguiente
        for (let j = i + 1; j < lista.length; j++) {
          if (lista[j].tipo.startsWith('image/')) { mostrar(j); break; }
        }
      });
    };

    mostrar(idx);

    // Teclado: flechas + Escape
    const handler = (e) => {
      const overlay = document.getElementById('lightboxOverlay');
      if (!overlay) { document.removeEventListener('keydown', handler); return; }

      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', handler);
      } else if (e.key === 'ArrowRight') {
        document.getElementById('lbNext')?.click();
      } else if (e.key === 'ArrowLeft') {
        document.getElementById('lbPrev')?.click();
      }
    };
    document.addEventListener('keydown', handler);
  }
};

// ── Toggle placa ──────────────────────────────────────────────────────────────
document.getElementById('proyectoPlaca')?.addEventListener('change', function() {
  const group = document.getElementById('placaPrecioGroup');
  if (this.checked) group.classList.remove('d-none');
  else group.classList.add('d-none');
});

document.getElementById('btnGuardarProyecto')?.addEventListener('click', () => Proyectos.guardar());
