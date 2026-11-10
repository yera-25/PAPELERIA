function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * cash.js - Controlador Profesional de Control de Caja, Turnos y Arqueo Rápido para "Papelería A B C"
 * Entregable Oficial de la Fase 5: Sprint 2 (Módulo de Ventas y Control de Caja)
 * Optimizado para máxima agilidad operativa en mostrador.
 */

async function initCash() {
    await renderCashDashboard();
    await renderTablaDevoluciones();
}

async function renderCashDashboard() {
    const turno = await window.POS_DB.getTurnoActivo();
    const statusBadge = document.getElementById('cash-shift-status');
    const cashierName = document.getElementById('cash-cashier-name');
    const openDate = document.getElementById('cash-open-date');
    const initialFund = document.getElementById('cash-initial-fund');
    const salesCash = document.getElementById('cash-sales-cash');
    const salesCard = document.getElementById('cash-sales-card');
    const salesSpei = document.getElementById('cash-sales-spei');
    const manualEntries = document.getElementById('cash-manual-entries');
    const manualWithdrawals = document.getElementById('cash-manual-withdrawals');
    const expectedDrawer = document.getElementById('cash-expected-drawer');
    const btnReabrir = document.getElementById('btn-reabrir-turno');
    const btnCorteZ = document.getElementById('btn-ejecutar-corte-z');

    if (!turno || turno.estado === 'CERRADO') {
        if (statusBadge) {
            statusBadge.textContent = 'TURNO CERRADO';
            statusBadge.style.color = '#d9534f';
        }
        if (btnReabrir) btnReabrir.style.display = 'inline-block';
        if (btnCorteZ) btnCorteZ.disabled = true;
        return;
    }

    if (btnReabrir) btnReabrir.style.display = 'none';
    if (btnCorteZ) btnCorteZ.disabled = false;

    if (statusBadge) {
        statusBadge.textContent = 'TURNO #1 ABIERTO';
        statusBadge.style.color = '#3a8e63';
    }
    if (cashierName) cashierName.textContent = turno.usuario || 'Gerardo Cabrera';
    if (openDate) openDate.textContent = new Date(turno.fecha_apertura).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    if (initialFund) initialFund.textContent = `$${(turno.monto_inicial_fondo || 0).toFixed(2)}`;
    if (salesCash) salesCash.textContent = `$${(turno.total_ventas_efectivo || 0).toFixed(2)}`;
    if (salesCard) salesCard.textContent = `$${(turno.total_ventas_tarjeta || 0).toFixed(2)}`;
    if (salesSpei) salesSpei.textContent = `$${(turno.total_ventas_transferencia || 0).toFixed(2)}`;
    if (manualEntries) manualEntries.textContent = `+$${(turno.total_entradas_manuales || 0).toFixed(2)}`;
    if (manualWithdrawals) manualWithdrawals.textContent = `-$${(turno.total_salidas_manuales || 0).toFixed(2)}`;

    const totalCajonEsperado = (turno.monto_inicial_fondo || 0) + 
                               (turno.total_ventas_efectivo || 0) + 
                               (turno.total_entradas_manuales || 0) - 
                               (turno.total_salidas_manuales || 0);

    if (expectedDrawer) expectedDrawer.textContent = `$${totalCajonEsperado.toFixed(2)}`;

    calcularArqueoCierre();
    await renderTablaDevoluciones();
    if (window.AUTH_MODULE && typeof window.AUTH_MODULE.aplicarRestriccionesRBAC === 'function') {
        window.AUTH_MODULE.aplicarRestriccionesRBAC();
    }
}

// Copiar automáticamente el monto esperado para cuadre exacto en 1 clic
function copiarMontoEsperado() {
    const expectedDisplay = document.getElementById('cash-expected-drawer');
    const inputContado = document.getElementById('input-arqueo-contado');
    if (!expectedDisplay || !inputContado) return;

    const esperado = parseFloat(expectedDisplay.textContent.replace('$', '').replace(/,/g, '')) || 0;
    inputContado.value = esperado.toFixed(2);
    calcularArqueoCierre();
    inputContado.focus();
    inputContado.select();
}

// Comparación matemática: Efectivo Físico vs. Esperado en Cajón
function calcularArqueoCierre() {
    const inputContado = document.getElementById('input-arqueo-contado');
    const diffDisplay = document.getElementById('arqueo-diferencia-display');
    const expectedDisplay = document.getElementById('cash-expected-drawer');

    if (!expectedDisplay || !inputContado || !diffDisplay) return;

    const esperado = parseFloat(expectedDisplay.textContent.replace('$', '').replace(/,/g, '')) || 0;
    const contado = parseFloat(inputContado.value) || 0;
    const diferencia = contado - esperado;

    if (Math.abs(diferencia) < 0.01) {
        diffDisplay.textContent = '$0.00 (Corte Cuadrado Exacto)';
        diffDisplay.style.color = '#3a8e63';
    } else if (diferencia > 0) {
        diffDisplay.textContent = `+$${diferencia.toFixed(2)} (Sobrante en Caja)`;
        diffDisplay.style.color = '#2563eb';
    } else {
        diffDisplay.textContent = `-$${Math.abs(diferencia).toFixed(2)} (Faltante en Caja)`;
        diffDisplay.style.color = '#d9534f';
    }
}

// Registrar Movimiento Manual de Efectivo (Entrada / Retiro)
function abrirModalMovimiento(tipo = 'ENTRADA') {
    const modal = document.getElementById('modal-movimiento-caja');
    const selectTipo = document.getElementById('mov-caja-tipo');
    const title = document.getElementById('modal-mov-title');
    if (!modal) return;

    if (selectTipo) selectTipo.value = tipo;
    if (title) title.textContent = tipo === 'ENTRADA' ? 'Registrar Entrada de Efectivo' : 'Registrar Retiro de Efectivo';
    
    document.getElementById('mov-caja-monto').value = '';
    document.getElementById('mov-caja-concepto').value = '';
    modal.classList.add('active');

    setTimeout(() => {
        const inputMonto = document.getElementById('mov-caja-monto');
        if (inputMonto) inputMonto.focus();
    }, 50);
}

async function handleMovimientoCajaSubmit(event) {
    event.preventDefault();
    const tipo = document.getElementById('mov-caja-tipo').value;
    const monto = parseFloat(document.getElementById('mov-caja-monto').value) || 0;
    const concepto = document.getElementById('mov-caja-concepto').value.trim();

    if (monto <= 0) {
        window.POS_MODULE.showToast('El monto debe ser mayor a $0.00', 'warning');
        return;
    }
    if (!concepto) {
        window.POS_MODULE.showToast('Ingrese un concepto o justificación.', 'warning');
        return;
    }

    try {
        await window.POS_DB.registrarMovimientoCaja(tipo, monto, concepto);
        window.closeAllModals();
        window.POS_MODULE.showToast(`Movimiento de ${tipo.toLowerCase()} por $${monto.toFixed(2)} registrado correctamente`, 'success');
        await renderCashDashboard();
    } catch (err) {
        window.POS_MODULE.showToast('Error al registrar movimiento: ' + err.message, 'error');
    }
}

// Cerrar Turno de Caja y Generar Comprobante Oficial de Corte Z
async function cerrarTurnoCaja() {
    if (window.AUTH_MODULE && !window.AUTH_MODULE.canPerformCashCut()) {
        alert('Acceso restringido: Los cajeros no tienen autorización para realizar cortes de caja. Esta función es exclusiva del perfil SUPERVISOR.');
        return;
    }
    const inputContado = document.getElementById('input-arqueo-contado');
    const contado = parseFloat(inputContado ? inputContado.value : NaN);

    if (isNaN(contado)) {
        alert('Por favor ingrese el total de efectivo físico contado en el cajón (o presione "Cuadre Exacto").');
        if (inputContado) inputContado.focus();
        return;
    }

    const esperadoDisplay = document.getElementById('cash-expected-drawer');
    const esperado = parseFloat(esperadoDisplay.textContent.replace('$', '').replace(/,/g, '')) || 0;
    const diferencia = contado - esperado;
    const difStr = diferencia >= 0 ? `+$${diferencia.toFixed(2)}` : `-$${Math.abs(diferencia).toFixed(2)}`;

    const confirmMsg = `¿Confirmar Cierre de Turno y Emisión de Corte Z?\n\n` +
                       `Efectivo Esperado: $${esperado.toFixed(2)}\n` +
                       `Efectivo Físico Contado: $${contado.toFixed(2)}\n` +
                       `Diferencia: ${difStr}\n\n` +
                       `Al aceptar, el turno quedará CERRADO y se generará el Comprobante de Auditoría.`;

    if (!confirm(confirmMsg)) return;

    try {
        const corte = await window.POS_DB.registrarCorteTurno(contado, {
            efectivo_contado: contado,
            fecha: new Date().toISOString()
        });

        await renderCashDashboard();
        mostrarComprobanteCorteZ(corte);
        window.POS_MODULE.showToast('Turno cerrado exitosamente. Reporte Z emitido.', 'success');
    } catch (err) {
        alert('Error al cerrar turno: ' + err.message);
    }
}

// Renderizar Vista Previa de Corte de Turno (Reporte Z)
function mostrarComprobanteCorteZ(corte) {
    const curAuth = (window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser) ? window.AUTH_MODULE.getCurrentUser() : null;
    const activeSupervisorNombre = curAuth ? (curAuth.nombre_completo || curAuth.username) : 'Astrid García Ramírez [SUPERVISOR]';
    const modal = document.getElementById('modal-corte-reporte-z');
    const renderZone = document.getElementById('corte-z-render-zone');
    if (!modal || !renderZone) return;

    const fechaApertura = new Date(corte.fecha_apertura).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
    const fechaCierre = new Date(corte.fecha_cierre).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

    renderZone.innerHTML = `
        <div class="ticket-thermal-container" style="max-width: 380px; margin: 0 auto;">
            <div class="ticket-center-header">
                <img src="LOGO.jpg" alt="Papelería A B C" class="ticket-logo-img" onerror="this.style.display='none'"/>
                <div class="ticket-biz-name">Papelería A B C</div>
                <div class="ticket-biz-meta">AUDITORÍA Y CORTE DE CAJA (REPORTE Z)</div>
                <div class="ticket-biz-meta">RFC: PABC261005ABC</div>
                <div class="ticket-biz-meta">Av. Tecnológico #120, Col. Centro</div>
            </div>
            <div class="ticket-divider">================================</div>
            <div class="ticket-meta-info">
                <div><b>Folio Corte:</b> ${corte.folio_corte}</div>
                <div><b>Cajero:</b> ${corte.cajero}</div>
                <div><b>Apertura:</b> ${fechaApertura}</div>
                <div><b>Cierre:</b> ${fechaCierre}</div>
            </div>
            <div class="ticket-divider">--------------------------------</div>
            <div class="ticket-totals-section">
                <div class="ticket-row-total"><span>Fondo Inicial de Caja:</span><b>$${Number(corte.fondo_inicial).toFixed(2)}</b></div>
                <div class="ticket-row-total"><span>(+) Ventas en Efectivo:</span><span>$${Number(corte.ventas_efectivo).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>(+) Entradas Manuales:</span><span>$${Number(corte.entradas_manuales).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>(-) Retiros Manuales:</span><span>-$${Number(corte.retiros_manuales).toFixed(2)}</span></div>
                <div class="ticket-divider">--------------------------------</div>
                <div class="ticket-row-total"><span>(=) Efectivo Esperado:</span><b>$${Number(corte.esperado_cajon).toFixed(2)}</b></div>
                <div class="ticket-row-total"><span>Efectivo Físico Contado:</span><b>$${Number(corte.contado_fisico).toFixed(2)}</b></div>
                <div class="ticket-row-total ${corte.diferencia < 0 ? 'text-danger' : 'text-success'}" style="font-size: 1.05rem; font-weight: 800;">
                    <span>Diferencia:</span>
                    <span>${corte.diferencia >= 0 ? '+' : ''}$${Number(corte.diferencia).toFixed(2)}</span>
                </div>
                <div class="ticket-divider">--------------------------------</div>
                <div class="ticket-row-total"><span>Ventas con Tarjeta:</span><span>$${Number(corte.ventas_tarjeta).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>Ventas con Transferencia:</span><span>$${Number(corte.ventas_transferencia).toFixed(2)}</span></div>
                <div class="ticket-row-total main-total"><span>VENTA TOTAL DEL TURNO:</span><span>$${Number(corte.total_ventas).toFixed(2)}</span></div>
            </div>
            <div class="ticket-divider">================================</div>
            <div style="margin-top: 24px; text-align: center;">
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 24px auto 4px auto;"></div>
                <small style="color: #64748b;">Firma de Cajero: ${corte.cajero}</small>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 24px auto 4px auto;"></div>
                <small style="color: #64748b;">Firma de Supervisor / Autorizado: ${activeSupervisorNombre}</small>
            </div>
            <div class="ticket-center-footer" style="margin-top: 16px;">
                <small>Papelería A B C - Sistema POS Seguro</small>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Reabrir nuevo turno de caja para la siguiente jornada
async function reabrirTurno() {
    const fondoStr = prompt('Ingrese el monto de fondo inicial para el nuevo turno:', '500.00');
    if (!fondoStr) return;
    const fondo = parseFloat(fondoStr);
    if (isNaN(fondo) || fondo < 0) {
        alert('Monto de fondo inválido.');
        return;
    }

    await window.POS_DB.reabrirNuevoTurno(fondo);
    await renderCashDashboard();
    window.POS_MODULE.showToast(`Nuevo turno abierto con fondo de $${fondo.toFixed(2)} MXN`, 'success');
}


// =============================================================================
// GESTION AUDITABLE DE DEVOLUCIONES Y CAMBIOS DE MERCANCIA (RF-08 / RBAC)
// =============================================================================

async function renderTablaDevoluciones() {
    const tbody = document.getElementById('tabla-devoluciones-tbody');
    if (!tbody || !window.POS_DB || typeof window.POS_DB.getDevolucionesYCambios !== 'function') return;

    try {
        const items = await window.POS_DB.getDevolucionesYCambios();
        const inputBuscar = document.getElementById('filtro-devoluciones-busqueda');
        const selectTipo = document.getElementById('filtro-devoluciones-tipo');

        const busqueda = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        const tipoFiltro = selectTipo ? selectTipo.value : 'TODOS';

        const filtrados = items.filter(it => {
            const matchTipo = (tipoFiltro === 'TODOS') || (it.tipo === tipoFiltro);
            const matchBusq = !busqueda || 
                it.folio.toLowerCase().includes(busqueda) ||
                (it.folio_ticket_origen && it.folio_ticket_origen.toLowerCase().includes(busqueda)) ||
                (it.nombre_producto_devuelto && it.nombre_producto_devuelto.toLowerCase().includes(busqueda)) ||
                (it.nombre_producto_nuevo && it.nombre_producto_nuevo.toLowerCase().includes(busqueda)) ||
                (it.motivo && it.motivo.toLowerCase().includes(busqueda)) ||
                (it.autorizado_por && it.autorizado_por.toLowerCase().includes(busqueda));
            return matchTipo && matchBusq;
        });

        if (filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 24px; color: var(--color-slate-light);">
                        No se encontraron registros de devoluciones o cambios con los criterios seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtrados.map(it => {
            const fechaStr = new Date(it.fecha_hora).toLocaleString('es-MX', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            const badgeTipo = it.tipo === 'CAMBIO'
                ? `<span class="badge-cambio">[CAMBIO]</span>`
                : `<span class="badge-devolucion">[DEVOLUCION]</span>`;

            let efectoHtml = '$0.00';
            if (it.diferencia_monetaria < 0) {
                efectoHtml = `<span style="color: #b91c1c; font-weight: 700;">-$${Math.abs(it.diferencia_monetaria).toFixed(2)} (Reembolso)</span>`;
            } else if (it.diferencia_monetaria > 0) {
                efectoHtml = `<span style="color: #15803d; font-weight: 700;">+$${it.diferencia_monetaria.toFixed(2)} (Cobro)</span>`;
            } else {
                efectoHtml = `<span style="color: #64748b; font-weight: 700;">$0.00 (Exacto)</span>`;
            }

            const prodNuevoStr = it.tipo === 'CAMBIO' && it.nombre_producto_nuevo
                ? `<strong>${it.cantidad_nueva}x</strong> ${it.nombre_producto_nuevo} ($${Number(it.precio_unitario_nuevo).toFixed(2)})`
                : `<span style="color: #94a3b8;">-</span>`;

            const safeFolio = escapeHTML(it.folio);
            const safeTicket = escapeHTML(it.folio_ticket_origen || 'S/N');
            const safeNomDev = escapeHTML(it.nombre_producto_devuelto);
            const safeMotivo = escapeHTML(it.motivo);
            const safeJust = escapeHTML(it.justificacion);
            const safeAut = escapeHTML(it.autorizado_por);

            return `
                <tr>
                    <td><strong>${safeFolio}</strong></td>
                    <td style="white-space: nowrap; font-size: 0.74rem;">${fechaStr}</td>
                    <td>${badgeTipo}</td>
                    <td><code>${safeTicket}</code></td>
                    <td><strong>${it.cantidad_devuelta}x</strong> ${safeNomDev} ($${Number(it.precio_unitario_devuelto).toFixed(2)})</td>
                    <td>${prodNuevoStr}</td>
                    <td class="text-right">${efectoHtml}</td>
                    <td style="max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${safeMotivo}: ${safeJust}">${safeMotivo}</td>
                    <td><small style="font-weight: 600;">${safeAut}</small></td>
                    <td class="text-center">
                        <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 2px 7px; background: #ffffff;" onclick="window.CASH_MODULE.mostrarComprobanteDevolucion('${safeFolio}')" title="Ver e imprimir comprobante termico oficial">
                            Vale
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('[Cash] Error al renderizar tabla de devoluciones:', e);
    }
}

async function abrirModalDevolucionCambio() {
    if (!window.AUTH_MODULE || !window.AUTH_MODULE.canProcessReturns()) {
        alert('Acceso restringido: Las devoluciones y cambios de producto son exclusivos del SUPERVISOR o ADMINISTRADOR.');
        return;
    }

    const modal = document.getElementById('modal-devolucion-cambio');
    if (!modal) return;

    const form = document.getElementById('form-devolucion-cambio');
    if (form) form.reset();

    const curUser = (window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser) ? window.AUTH_MODULE.getCurrentUser() : null;
    const authInput = document.getElementById('dev-autorizado-por');
    if (authInput) {
        authInput.value = curUser ? (curUser.nombre_completo + ' [' + curUser.rol + ']') : 'Supervisor en Turno';
    }

    const productos = await window.POS_DB.getProductos();
    const selDevuelto = document.getElementById('dev-producto-select');
    const selNuevo = document.getElementById('cam-producto-nuevo-select');

    const getPrecio = p => parseFloat(p.precio_venta_menudeo ?? p.precio_venta ?? p.precio ?? 0);
    if (selDevuelto) {
        selDevuelto.innerHTML = '<option value="">-- Seleccionar Articulo del Catalogo --</option>' +
            productos.map(p => `<option value="${p.id_producto}" data-precio="${getPrecio(p)}" data-stock="${p.stock_actual}" data-servicio="${p.es_servicio}">${p.nombre} ($${getPrecio(p).toFixed(2)})</option>`).join('');
    }

    if (selNuevo) {
        selNuevo.innerHTML = '<option value="">-- Seleccionar Articulo de Reemplazo --</option>' +
            productos.map(p => `<option value="${p.id_producto}" data-precio="${getPrecio(p)}" data-stock="${p.stock_actual}" data-servicio="${p.es_servicio}">${p.nombre} ($${getPrecio(p).toFixed(2)}) - Stock: ${p.es_servicio ? 'Infinito' : p.stock_actual}</option>`).join('');
    }

    const radioDev = document.getElementById('modo-op-devolucion');
    if (radioDev) radioDev.checked = true;

    onModoOperacionChange();
    recalcularValoresDevolucion();

    modal.classList.add('active');
}

function onModoOperacionChange() {
    const modoCambio = document.getElementById('modo-op-cambio');
    const secNuevo = document.getElementById('sec-producto-nuevo-cambio');
    const selNuevo = document.getElementById('cam-producto-nuevo-select');

    const esCambio = modoCambio && modoCambio.checked;
    if (secNuevo) secNuevo.style.display = esCambio ? 'block' : 'none';
    if (selNuevo) selNuevo.required = esCambio;

    recalcularValoresDevolucion();
}

function onTicketOrigenInput() {
    // Escucha dinamica de ticket
}

function recalcularValoresDevolucion() {
    const selDev = document.getElementById('dev-producto-select');
    const cantDevInput = document.getElementById('dev-cantidad');
    const precioDevInput = document.getElementById('dev-precio-unitario');
    const subtotalDevInput = document.getElementById('dev-subtotal-devuelto');

    const optDev = selDev ? selDev.options[selDev.selectedIndex] : null;
    const precioDev = optDev && optDev.dataset.precio ? parseFloat(optDev.dataset.precio) : 0;
    const cantDev = cantDevInput ? Math.max(1, parseInt(cantDevInput.value) || 1) : 1;
    const subtotalDev = cantDev * precioDev;

    if (precioDevInput) precioDevInput.value = `$${precioDev.toFixed(2)}`;
    if (subtotalDevInput) subtotalDevInput.value = `$${subtotalDev.toFixed(2)}`;

    const modoCambio = document.getElementById('modo-op-cambio');
    const esCambio = modoCambio && modoCambio.checked;

    let totalNuevo = 0;
    if (esCambio) {
        const selNuevo = document.getElementById('cam-producto-nuevo-select');
        const cantNuevoInput = document.getElementById('cam-cantidad-nueva');
        const precioNuevoInput = document.getElementById('cam-precio-nuevo');
        const subtotalNuevoInput = document.getElementById('cam-subtotal-nuevo');
        const stockAviso = document.getElementById('cam-stock-aviso');

        const optNuevo = selNuevo ? selNuevo.options[selNuevo.selectedIndex] : null;
        const precioNuevo = optNuevo && optNuevo.dataset.precio ? parseFloat(optNuevo.dataset.precio) : 0;
        const cantNuevo = cantNuevoInput ? Math.max(1, parseInt(cantNuevoInput.value) || 1) : 1;
        totalNuevo = cantNuevo * precioNuevo;

        if (precioNuevoInput) precioNuevoInput.value = `$${precioNuevo.toFixed(2)}`;
        if (subtotalNuevoInput) subtotalNuevoInput.value = `$${totalNuevo.toFixed(2)}`;

        if (stockAviso && optNuevo && optNuevo.value) {
            const stock = optNuevo.dataset.stock;
            const esServ = optNuevo.dataset.servicio === 'true' || optNuevo.dataset.servicio === '1';
            stockAviso.textContent = esServ ? 'Articulo de servicio con disponibilidad continua.' : `Stock actual en tienda: ${stock} piezas disponibles.`;
            stockAviso.style.color = (esServ || parseInt(stock) >= cantNuevo) ? 'var(--color-slate-light)' : '#b91c1c';
        }
    }

    const labelTipoBalance = document.getElementById('label-tipo-balance');
    const descEfecto = document.getElementById('desc-efecto-caja');
    const montoEfecto = document.getElementById('monto-efecto-caja');

    if (!esCambio) {
        if (labelTipoBalance) {
            labelTipoBalance.textContent = 'REEMBOLSO DE EFECTIVO';
            labelTipoBalance.style.color = '#b91c1c';
        }
        if (descEfecto) descEfecto.textContent = 'Se retirara efectivo del cajon para entregar al cliente.';
        if (montoEfecto) {
            montoEfecto.textContent = `-$${subtotalDev.toFixed(2)}`;
            montoEfecto.style.color = '#b91c1c';
        }
    } else {
        const diff = totalNuevo - subtotalDev;
        if (Math.abs(diff) < 0.01) {
            if (labelTipoBalance) {
                labelTipoBalance.textContent = 'CAMBIO EXACTO SIN DIFERENCIA';
                labelTipoBalance.style.color = '#64748b';
            }
            if (descEfecto) descEfecto.textContent = 'Articulos de igual valor comercial. No hay movimiento de efectivo.';
            if (montoEfecto) {
                montoEfecto.textContent = '$0.00';
                montoEfecto.style.color = '#64748b';
            }
        } else if (diff > 0) {
            if (labelTipoBalance) {
                labelTipoBalance.textContent = 'COBRO DE DIFERENCIA (INGRESO A CAJA)';
                labelTipoBalance.style.color = '#15803d';
            }
            if (descEfecto) descEfecto.textContent = 'El producto nuevo tiene mayor precio. El cliente paga la diferencia en efectivo.';
            if (montoEfecto) {
                montoEfecto.textContent = `+$${diff.toFixed(2)}`;
                montoEfecto.style.color = '#15803d';
            }
        } else {
            const reemb = Math.abs(diff);
            if (labelTipoBalance) {
                labelTipoBalance.textContent = 'REEMBOLSO DE DIFERENCIA (SALIDA DE CAJA)';
                labelTipoBalance.style.color = '#b91c1c';
            }
            if (descEfecto) descEfecto.textContent = 'El producto devuelto tiene mayor precio. Se devuelve la diferencia al cliente.';
            if (montoEfecto) {
                montoEfecto.textContent = `-$${reemb.toFixed(2)}`;
                montoEfecto.style.color = '#b91c1c';
            }
        }
    }
}

async function handleDevolucionCambioSubmit(event) {
    event.preventDefault();

    if (!window.AUTH_MODULE || !window.AUTH_MODULE.canProcessReturns()) {
        alert('Acceso restringido: Esta operacion solo puede ser procesada por el Supervisor o Administrador.');
        return;
    }

    const modoCambio = document.getElementById('modo-op-cambio');
    const esCambio = modoCambio && modoCambio.checked;
    const tipo = esCambio ? 'CAMBIO' : 'DEVOLUCION';

    const idDevuelto = document.getElementById('dev-producto-select').value;
    const cantDev = parseInt(document.getElementById('dev-cantidad').value, 10);
    const estadoProd = document.getElementById('dev-estado-producto').value;
    const ticketOrigen = document.getElementById('dev-ticket-origen').value.trim();
    const motivo = document.getElementById('dev-motivo-select').value;
    const justificacion = document.getElementById('dev-justificacion').value.trim();
    const autorizadoPor = document.getElementById('dev-autorizado-por').value;

    if (!idDevuelto) {
        alert('Por favor seleccione el articulo devuelto por el cliente.');
        return;
    }
    if (!cantDev || cantDev <= 0) {
        alert('Ingrese una cantidad valida a devolver.');
        return;
    }

    let idNuevo = null;
    let cantNuevo = 0;

    if (esCambio) {
        idNuevo = document.getElementById('cam-producto-nuevo-select').value;
        cantNuevo = parseInt(document.getElementById('cam-cantidad-nueva').value, 10);
        if (!idNuevo) {
            alert('Por favor seleccione el articulo nuevo a entregar en el canje.');
            return;
        }
        if (!cantNuevo || cantNuevo <= 0) {
            alert('Ingrese una cantidad valida para el articulo de reemplazo.');
            return;
        }
        if (idDevuelto === idNuevo) {
            alert('El articulo devuelto y el articulo nuevo no pueden ser el mismo para un cambio.');
            return;
        }
    }

    const datos = {
        tipo: tipo,
        folio_ticket_origen: ticketOrigen,
        id_producto_devuelto: idDevuelto,
        cantidad_devuelta: cantDev,
        estado_producto: estadoProd,
        id_producto_nuevo: idNuevo,
        cantidad_nueva: cantNuevo,
        motivo: motivo,
        justificacion: justificacion,
        autorizado_por: autorizadoPor
    };

    try {
        const registro = await window.POS_DB.registrarDevolucionOCambio(datos);
        window.closeAllModals();

        if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
            window.POS_MODULE.showToast((tipo === 'CAMBIO' ? 'Cambio' : 'Devolución') + ' procesado exitosamente con folio ' + registro.folio, 'success');
        }

        await renderCashDashboard();
        await renderTablaDevoluciones();

        if (window.INVENTORY_MODULE && typeof window.INVENTORY_MODULE.reloadCatalogTable === 'function') {
            window.INVENTORY_MODULE.reloadCatalogTable();
        }
        if (window.MOVEMENTS_MODULE && typeof window.MOVEMENTS_MODULE.reloadKardexTable === 'function') {
            window.MOVEMENTS_MODULE.reloadKardexTable();
        }
        if (window.POS_MODULE && typeof window.POS_MODULE.reloadCatalog === 'function') {
            window.POS_MODULE.reloadCatalog();
        }

        mostrarComprobanteDevolucion(registro.folio);
    } catch (err) {
        alert('Error al registrar devolucion/cambio: ' + err.message);
    }
}

async function mostrarComprobanteDevolucion(folio) {
    const modal = document.getElementById('modal-comprobante-devolucion');
    const renderZone = document.getElementById('comprobante-devolucion-render-zone');
    if (!modal || !renderZone) return;

    const lista = await window.POS_DB.getDevolucionesYCambios();
    const op = lista.find(it => it.folio === folio);
    if (!op) {
        alert('Comprobante no encontrado: ' + folio);
        return;
    }

    const fechaStr = new Date(op.fecha_hora).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    renderZone.innerHTML = `
        <div class="ticket-thermal-container" style="max-width: 380px; margin: 0 auto;">
            <div class="ticket-center-header">
                <img src="LOGO.jpg" alt="Papelería A B C" class="ticket-logo-img" onerror="this.style.display='none'"/>
                <div class="ticket-biz-name">Papelería A B C</div>
                <div class="ticket-biz-meta">${op.tipo === 'DEVOLUCION' ? 'COMPROBANTE OFICIAL DE DEVOLUCION' : 'COMPROBANTE OFICIAL DE CAMBIO'}</div>
                <div class="ticket-biz-meta">RFC: PABC261005ABC</div>
                <div class="ticket-biz-meta">Av. Tecnológico #120, Col. Centro</div>
            </div>
            <div class="ticket-divider">================================</div>
            <div class="ticket-meta-info">
                <div><b>Folio Operación:</b> ${escapeHTML(op.folio)}</div>
                <div><b>Fecha y Hora:</b> ${fechaStr}</div>
                <div><b>Ticket Referencia:</b> ${escapeHTML(op.folio_ticket_origen || 'MOSTRADOR')}</div>
                <div><b>Autorizado Por:</b> ${escapeHTML(op.autorizado_por)}</div>
            </div>
            <div class="ticket-divider">--------------------------------</div>
            <div style="font-size: 0.8rem; margin: 8px 0; line-height: 1.4;">
                <b style="color: #b91c1c;">MERCANCIA DEVUELTA:</b><br/>
                ${op.cantidad_devuelta}x ${op.nombre_producto_devuelto} ($${Number(op.precio_unitario_devuelto).toFixed(2)})<br/>
                <b>Total Devuelto:</b> $${Number(op.total_devuelto).toFixed(2)}<br/>
                <small>Condición: ${op.estado_producto === 'BUENO' ? 'Buen estado (Reingresado a inventario)' : 'Defectuoso (Desincorporado a merma)'}</small>
            </div>
            ${op.tipo === 'CAMBIO' ? `
            <div class="ticket-divider">--------------------------------</div>
            <div style="font-size: 0.8rem; margin: 8px 0; line-height: 1.4;">
                <b style="color: #0369a1;">MERCANCIA ENTREGADA (CANJE):</b><br/>
                ${op.cantidad_nueva}x ${op.nombre_producto_nuevo} ($${Number(op.precio_unitario_nuevo).toFixed(2)})<br/>
                <b>Total Entregado:</b> $${Number(op.total_nuevo).toFixed(2)}
            </div>
            ` : ''}
            <div class="ticket-divider">--------------------------------</div>
            <div class="ticket-totals-section">
                <div class="ticket-row-total main-total">
                    <span>${op.tipo === 'DEVOLUCION' ? 'TOTAL REEMBOLSADO:' : (op.diferencia_monetaria > 0 ? 'DIFERENCIA COBRADA:' : (op.diferencia_monetaria < 0 ? 'DIFERENCIA DEVUELTA:' : 'DIFERENCIA:'))}</span>
                    <span>$${Math.abs(op.diferencia_monetaria).toFixed(2)} MXN</span>
                </div>
                <small style="display:block; text-align:right; color: #475569; margin-top: 3px;">
                    ${op.tipo === 'DEVOLUCION' ? 'Salida de Efectivo del Cajón' : (op.diferencia_monetaria > 0 ? 'Entrada en Efectivo al Cajón' : (op.diferencia_monetaria < 0 ? 'Salida de Efectivo del Cajón' : 'Canje exacto sin flujo de dinero'))}
                </small>
            </div>
            <div class="ticket-divider">================================</div>
            <div style="font-size: 0.74rem; color: #64748b; margin-top: 8px; line-height: 1.4;">
                <b>Motivo:</b> ${op.motivo}<br/>
                <b>Observaciones:</b> ${op.justificacion}
            </div>
            <div style="margin-top: 24px; text-align: center;">
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 24px auto 4px auto;"></div>
                <small style="color: #64748b;">Firma de Conformidad del Cliente</small>
                <div style="border-top: 1px solid #94a3b8; width: 80%; margin: 24px auto 4px auto;"></div>
                <small style="color: #64748b;">Firma de Autorización: ${op.autorizado_por}</small>
            </div>
            <div class="ticket-center-footer" style="margin-top: 16px;">
                <small>Papelería A B C - Sistema POS Local & Seguro</small>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

async function exportarDevolucionesCSV() {
    const lista = await window.POS_DB.getDevolucionesYCambios();
    if (!lista || lista.length === 0) {
        alert('No hay registros de devoluciones para exportar.');
        return;
    }

    const headers = [
        'Folio',
        'Tipo',
        'Fecha y Hora',
        'Ticket Origen',
        'ID Prod Devuelto',
        'Producto Devuelto',
        'Cantidad Devuelta',
        'Precio Unitario Devuelto',
        'Total Devuelto',
        'Estado Producto',
        'ID Prod Nuevo',
        'Producto Nuevo',
        'Cantidad Nueva',
        'Precio Unitario Nuevo',
        'Total Nuevo',
        'Diferencia Efectivo',
        'Motivo',
        'Justificacion',
        'Autorizado Por',
        'Cajero'
    ];

    const escapeCsv = (v) => {
        if (v === null || v === undefined) return '""';
        return '"' + String(v).replace(/"/g, '""') + '"';
    };

    const rows = lista.map(it => [
        escapeCsv(it.folio),
        escapeCsv(it.tipo),
        escapeCsv(it.fecha_hora),
        escapeCsv(it.folio_ticket_origen),
        it.id_producto_devuelto,
        escapeCsv(it.nombre_producto_devuelto),
        it.cantidad_devuelta,
        it.precio_unitario_devuelto,
        it.total_devuelto,
        escapeCsv(it.estado_producto),
        it.id_producto_nuevo || '',
        escapeCsv(it.nombre_producto_nuevo || ''),
        it.cantidad_nueva || 0,
        it.precio_unitario_nuevo || 0,
        it.total_nuevo || 0,
        it.diferencia_monetaria,
        escapeCsv(it.motivo),
        escapeCsv(it.justificacion),
        escapeCsv(it.autorizado_por),
        escapeCsv(it.cajero)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Papeleria_ABC_Devoluciones_Cambios_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.CASH_MODULE = {
    initCash,
    renderCashDashboard,
    calcularArqueoCierre,
    copiarMontoEsperado,
    abrirModalMovimiento,
    handleMovimientoCajaSubmit,
    cerrarTurnoCaja,
    mostrarComprobanteCorteZ,
    reabrirTurno,
    renderTablaDevoluciones,
    abrirModalDevolucionCambio,
    onModoOperacionChange,
    onTicketOrigenInput,
    recalcularValoresDevolucion,
    handleDevolucionCambioSubmit,
    mostrarComprobanteDevolucion,
    exportarDevolucionesCSV
};

Object.freeze(window.CASH_MODULE);
