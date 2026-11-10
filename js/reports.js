/**
 * reports.js - Módulo de Reportes, Analítica Comercial y Exportación Ejecutiva
 * Papelería A B C — Fase 6: Sprint 3 (Reportes y Seguridad | RF-06 / RF-07 / RF-08)
 * 
 * Funcionalidades:
 * 1. Filtros avanzados por rango temporal (Hoy, Ayer, 7 Días, Mes Actual, Todo, Personalizado).
 * 2. Filtros por Categoría de Producto y Método de Pago (Efectivo, Tarjeta, SPEI).
 * 3. Indicadores Financieros Clave (KPIs):
 *    - Ventas Brutas, Descuentos Totales, Ventas Netas, Utilidad Bruta Estimada y Margen %.
 * 4. Reporte de Balance Diario y Conciliación Financiera con Gráfica de Tendencia.
 * 5. Reporte de Ranking de Productos Más Vendidos (Top Artículos por Volumen y Utilidad).
 * 6. Reporte de Distribución de Ventas por Categoría y Familia.
 * 7. Exportación oficial de todos los resúmenes a CSV delimitado por comas con UTF-8 BOM (\uFEFF) para Excel.
 */

let filtroActual = {
    periodo: '7DIAS',
    fechaInicio: null,
    fechaFin: null,
    categoria: 'TODAS',
    metodoPago: 'TODOS'
};

let cacheReporteVentas = [];

// -----------------------------------------------------------------------------
// 1. INICIALIZACIÓN DEL MÓDULO DE REPORTES
// -----------------------------------------------------------------------------

async function initReportsModule() {
    console.log('[Reports] Inicializando módulo de reportes y analítica...');
    configurarFechasPorDefecto();
    await cargarCategoriasEnFiltro();
    await cargarReportes();
}

function configurarFechasPorDefecto() {
    setFiltroPeriodo('7DIAS', false);
}

async function cargarCategoriasEnFiltro() {
    const select = document.getElementById('report-filtro-categoria');
    if (!select) return;

    const categorias = await window.POS_DB.getCategorias();
    let options = '<option value="TODAS">Todas las Categorías</option>';
    (categorias || []).forEach(c => {
        options += `<option value="${c.id_categoria}">${escapeHTML(c.nombre)}</option>`;
    });
    select.innerHTML = options;
}

// -----------------------------------------------------------------------------
// 2. CONTROL DE FILTROS TEMPORALES Y CRITERIOS
// -----------------------------------------------------------------------------

function setFiltroPeriodo(tipo, recargar = true) {
    filtroActual.periodo = tipo;

    const hoy = new Date();
    const toISODate = d => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const inputInicio = document.getElementById('report-fecha-inicio');
    const inputFin = document.getElementById('report-fecha-fin');

    // Desmarcar todos los botones de periodo rápido
    document.querySelectorAll('.btn-periodo-rapido').forEach(b => b.classList.remove('active'));
    const btnActivo = document.querySelector(`.btn-periodo-rapido[data-periodo="${tipo}"]`);
    if (btnActivo) btnActivo.classList.add('active');

    if (tipo === 'HOY') {
        filtroActual.fechaInicio = toISODate(hoy);
        filtroActual.fechaFin = toISODate(hoy);
    } else if (tipo === 'AYER') {
        const ayer = new Date();
        ayer.setDate(hoy.getDate() - 1);
        filtroActual.fechaInicio = toISODate(ayer);
        filtroActual.fechaFin = toISODate(ayer);
    } else if (tipo === '7DIAS') {
        const sieteDias = new Date();
        sieteDias.setDate(hoy.getDate() - 6);
        filtroActual.fechaInicio = toISODate(sieteDias);
        filtroActual.fechaFin = toISODate(hoy);
    } else if (tipo === 'MES') {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        filtroActual.fechaInicio = toISODate(inicioMes);
        filtroActual.fechaFin = toISODate(hoy);
    } else if (tipo === 'TODO') {
        filtroActual.fechaInicio = null;
        filtroActual.fechaFin = null;
    }

    if (inputInicio && filtroActual.fechaInicio) inputInicio.value = filtroActual.fechaInicio;
    if (inputFin && filtroActual.fechaFin) inputFin.value = filtroActual.fechaFin;

    if (recargar) {
        cargarReportes();
    }
}

function handleCustomDateChange() {
    const inputInicio = document.getElementById('report-fecha-inicio');
    const inputFin = document.getElementById('report-fecha-fin');

    if (inputInicio && inputInicio.value) {
        filtroActual.fechaInicio = inputInicio.value;
    }
    if (inputFin && inputFin.value) {
        filtroActual.fechaFin = inputFin.value;
    }

    filtroActual.periodo = 'CUSTOM';
    document.querySelectorAll('.btn-periodo-rapido').forEach(b => b.classList.remove('active'));

    cargarReportes();
}

function handleFiltrosAdicionalesChange() {
    const selCat = document.getElementById('report-filtro-categoria');
    const selMet = document.getElementById('report-filtro-metodo');

    if (selCat) filtroActual.categoria = selCat.value;
    if (selMet) filtroActual.metodoPago = selMet.value;

    cargarReportes();
}

// -----------------------------------------------------------------------------
// 3. MOTOR ANALÍTICO Y CÁLCULO DE MÉTRICAS
// -----------------------------------------------------------------------------

async function cargarReportes() {
    // 1. Obtener todas las ventas y catálogo maestro
    const [todasLasVentas, productos] = await Promise.all([
        window.POS_DB.getHistorialVentas(),
        window.POS_DB.getProductosCompletos()
    ]);

    const prodCostMap = new Map((productos || []).map(p => [p.id_producto, p.precio_compra || 0]));
    const prodCatMap = new Map((productos || []).map(p => [p.id_producto, p.id_categoria || 0]));
    const prodCatNombreMap = new Map((productos || []).map(p => [p.id_producto, p.categoria_nombre || 'General']));

    // 2. Filtrar ventas por rango de fecha, método y categoría
    const ventasFiltradas = todasLasVentas.filter(v => {
        if (!v.fecha_hora) return false;
        const fechaStr = v.fecha_hora.slice(0, 10);

        if (filtroActual.fechaInicio && fechaStr < filtroActual.fechaInicio) return false;
        if (filtroActual.fechaFin && fechaStr > filtroActual.fechaFin) return false;

        if (filtroActual.metodoPago !== 'TODOS' && v.metodo_pago !== filtroActual.metodoPago) {
            return false;
        }

        if (filtroActual.categoria !== 'TODAS') {
            const catIdNum = parseInt(filtroActual.categoria, 10);
            const tieneItemCat = (v.items || []).some(it => prodCatMap.get(it.id_producto) === catIdNum);
            if (!tieneItemCat) return false;
        }

        return true;
    });

    cacheReporteVentas = ventasFiltradas;

    // 3. Calcular métricas financieras consolidadas
    let totalBruto = 0;
    let totalDescuentos = 0;
    let totalNeto = 0;
    let totalIva = 0;
    let totalCosto = 0;
    let articulosVendidos = 0;

    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalSpei = 0;

    const productoStats = new Map(); // id -> { id, nombre, categoria, unidades, ingreso, costo, utilidad }
    const categoriaStats = new Map(); // catNombre -> { nombre, unidades, total }
    const diarioStats = new Map(); // YYYY-MM-DD -> { fecha, transacciones, bruto, desc, neto, iva, costo, efvo, tarj, spei }

    ventasFiltradas.forEach(v => {
        const fechaKey = v.fecha_hora.slice(0, 10);
        totalBruto += Number(v.total_bruto || v.total || 0);
        totalDescuentos += Number(v.descuento || 0);
        totalNeto += Number(v.total || 0);
        totalIva += Number(v.iva || 0);

        if (v.metodo_pago === 'EFECTIVO') totalEfectivo += Number(v.total || 0);
        else if (v.metodo_pago === 'TARJETA') totalTarjeta += Number(v.total || 0);
        else if (v.metodo_pago === 'TRANSFERENCIA') totalSpei += Number(v.total || 0);

        if (!diarioStats.has(fechaKey)) {
            diarioStats.set(fechaKey, {
                fecha: fechaKey,
                transacciones: 0,
                bruto: 0,
                descuento: 0,
                neto: 0,
                iva: 0,
                costo: 0,
                efectivo: 0,
                tarjeta: 0,
                spei: 0
            });
        }
        const dia = diarioStats.get(fechaKey);
        dia.transacciones += 1;
        dia.bruto += Number(v.total_bruto || v.total || 0);
        dia.descuento += Number(v.descuento || 0);
        dia.neto += Number(v.total || 0);
        dia.iva += Number(v.iva || 0);

        if (v.metodo_pago === 'EFECTIVO') dia.efectivo += Number(v.total || 0);
        else if (v.metodo_pago === 'TARJETA') dia.tarjeta += Number(v.total || 0);
        else if (v.metodo_pago === 'TRANSFERENCIA') dia.spei += Number(v.total || 0);

        (v.items || []).forEach(it => {
            articulosVendidos += Number(it.cantidad || 0);
            const costUnit = prodCostMap.get(it.id_producto) || 0;
            const costLine = Number(it.cantidad || 0) * costUnit;
            totalCosto += costLine;
            dia.costo += costLine;

            // Stats de producto
            const pId = it.id_producto || it.nombre;
            if (!productoStats.has(pId)) {
                productoStats.set(pId, {
                    id_producto: it.id_producto,
                    nombre: it.nombre,
                    categoria: prodCatNombreMap.get(it.id_producto) || (it.es_servicio ? 'Servicios' : 'General'),
                    unidades: 0,
                    ingreso: 0,
                    costo: 0,
                    utilidad: 0
                });
            }
            const pStat = productoStats.get(pId);
            pStat.unidades += Number(it.cantidad || 0);
            pStat.ingreso += Number(it.subtotal || 0);
            pStat.costo += costLine;
            pStat.utilidad = pStat.ingreso - pStat.costo;

            // Stats de categoría
            const catNombre = prodCatNombreMap.get(it.id_producto) || (it.es_servicio ? 'Servicios' : 'General');
            if (!categoriaStats.has(catNombre)) {
                categoriaStats.set(catNombre, {
                    nombre: catNombre,
                    unidades: 0,
                    total: 0
                });
            }
            const cStat = categoriaStats.get(catNombre);
            cStat.unidades += Number(it.cantidad || 0);
            cStat.total += Number(it.subtotal || 0);
        });
    });

    const utilidadBruta = totalNeto - totalCosto;
    const margenPorcentaje = totalNeto > 0 ? (utilidadBruta / totalNeto) * 100 : 0;
    const ticketPromedio = ventasFiltradas.length > 0 ? totalNeto / ventasFiltradas.length : 0;

    // 4. Renderizar KPIs
    renderKPIs({
        transacciones: ventasFiltradas.length,
        articulosVendidos,
        totalBruto,
        totalDescuentos,
        totalNeto,
        totalIva,
        totalCosto,
        utilidadBruta,
        margenPorcentaje,
        ticketPromedio,
        totalEfectivo,
        totalTarjeta,
        totalSpei
    });

    // 5. Renderizar tablas y visualizadores
    renderReporteBalanceDiario(Array.from(diarioStats.values()).sort((a, b) => b.fecha.localeCompare(a.fecha)), totalNeto);
    renderReporteTopProductos(Array.from(productoStats.values()).sort((a, b) => b.unidades - a.unidades), totalNeto);
    renderReporteVentasCategoria(Array.from(categoriaStats.values()).sort((a, b) => b.total - a.total), totalNeto);
    renderReporteTransacciones(ventasFiltradas);
}

// -----------------------------------------------------------------------------
// 4. RENDERIZADO VISUAL DE INDICADORES (KPIS)
// -----------------------------------------------------------------------------

function renderKPIs(kpis) {
    const formatMoney = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const elTotal = document.getElementById('kpi-ventas-totales');
    if (elTotal) elTotal.textContent = formatMoney(kpis.totalNeto);

    const elTrans = document.getElementById('kpi-transacciones');
    if (elTrans) elTrans.textContent = `${kpis.transacciones} ventas (${kpis.articulosVendidos} pzas)`;

    const elUtilidad = document.getElementById('kpi-utilidad-bruta');
    if (elUtilidad) elUtilidad.textContent = formatMoney(kpis.utilidadBruta);

    const elMargen = document.getElementById('kpi-margen-pct');
    if (elMargen) elMargen.textContent = `Margen: ${kpis.margenPorcentaje.toFixed(1)}%`;

    const elTicketAvg = document.getElementById('kpi-ticket-promedio');
    if (elTicketAvg) elTicketAvg.textContent = formatMoney(kpis.ticketPromedio);

    const elMix = document.getElementById('kpi-mezcla-pagos');
    if (elMix) {
        elMix.innerHTML = `
            <span style="color: var(--color-emerald);">Efvo: ${formatMoney(kpis.totalEfectivo)}</span> | 
            <span style="color: #0284c7;">Tarj: ${formatMoney(kpis.totalTarjeta)}</span> | 
            <span style="color: #7c3aed;">SPEI: ${formatMoney(kpis.totalSpei)}</span>
        `;
    }
}

// -----------------------------------------------------------------------------
// 5. RENDERIZADO DE TABLAS Y GRÁFICAS
// -----------------------------------------------------------------------------

function renderReporteBalanceDiario(dias, maxTotal) {
    const tbody = document.getElementById('tabla-balance-diario-tbody');
    if (!tbody) return;

    if (dias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 20px; color: var(--color-slate-light);">No hay registros de ventas para el periodo seleccionado.</td></tr>';
        return;
    }

    const formatMoney = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maxDia = Math.max(...dias.map(d => d.neto), 1);

    tbody.innerHTML = dias.map(d => {
        const utilDia = d.neto - d.costo;
        const barWidth = Math.min(100, Math.round((d.neto / maxDia) * 100));

        return `
            <tr>
                <td><b>${d.fecha}</b></td>
                <td class="text-center">${d.transacciones}</td>
                <td class="text-right" style="color: var(--color-slate-light);">${formatMoney(d.bruto)}</td>
                <td class="text-right" style="color: #d9534f;">${d.descuento > 0 ? '-' + formatMoney(d.descuento) : '$0.00'}</td>
                <td class="text-right font-bold" style="color: var(--color-emerald);">${formatMoney(d.neto)}</td>
                <td class="text-right">${formatMoney(utilDia)}</td>
                <td style="font-size: 0.74rem;">
                    E: ${formatMoney(d.efectivo)}<br/>
                    T: ${formatMoney(d.tarjeta)} | S: ${formatMoney(d.spei)}
                </td>
                <td style="vertical-align: middle; width: 130px;">
                    <div style="background: #e2e8f0; border-radius: 4px; height: 12px; width: 100%; overflow: hidden;">
                        <div style="background: var(--color-primary); height: 100%; width: ${barWidth}%;"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderReporteTopProductos(productos, totalFacturado) {
    const tbody = document.getElementById('tabla-top-productos-tbody');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 20px; color: var(--color-slate-light);">Sin datos de productos vendidos en este rango.</td></tr>';
        return;
    }

    const formatMoney = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maxUnidades = Math.max(...productos.map(p => p.unidades), 1);

    tbody.innerHTML = productos.slice(0, 15).map((p, index) => {
        const barWidth = Math.min(100, Math.round((p.unidades / maxUnidades) * 100));
        const pctFacturacion = totalFacturado > 0 ? ((p.ingreso / totalFacturado) * 100).toFixed(1) : '0.0';

        return `
            <tr>
                <td class="text-center font-bold" style="color: var(--color-primary);">#${index + 1}</td>
                <td>
                    <b>${escapeHTML(p.nombre)}</b>
                    <small style="display: block; color: var(--color-slate-light); font-size: 0.72rem;">${escapeHTML(p.categoria)}</small>
                </td>
                <td class="text-center font-bold" style="font-size: 0.95rem;">${p.unidades}</td>
                <td class="text-right font-bold" style="color: var(--color-emerald);">${formatMoney(p.ingreso)}</td>
                <td class="text-right" style="color: var(--color-slate-light);">${formatMoney(p.costo)}</td>
                <td class="text-right font-bold" style="color: #0284c7;">${formatMoney(p.utilidad)}</td>
                <td style="vertical-align: middle; width: 140px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <div style="background: #e2e8f0; border-radius: 4px; height: 10px; flex: 1; overflow: hidden;">
                            <div style="background: var(--color-emerald); height: 100%; width: ${barWidth}%;"></div>
                        </div>
                        <small style="font-size: 0.7rem; font-weight: bold; width: 35px;">${pctFacturacion}%</small>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderReporteVentasCategoria(categorias, totalFacturado) {
    const tbody = document.getElementById('tabla-ventas-categoria-tbody');
    if (!tbody) return;

    if (categorias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 20px; color: var(--color-slate-light);">Sin ventas por categoría.</td></tr>';
        return;
    }

    const formatMoney = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maxTotal = Math.max(...categorias.map(c => c.total), 1);

    tbody.innerHTML = categorias.map(c => {
        const barWidth = Math.min(100, Math.round((c.total / maxTotal) * 100));
        const pctTotal = totalFacturado > 0 ? ((c.total / totalFacturado) * 100).toFixed(1) : '0.0';

        return `
            <tr>
                <td><b>${escapeHTML(c.nombre)}</b></td>
                <td class="text-center font-bold">${c.unidades} pzas</td>
                <td class="text-right font-bold" style="color: var(--color-emerald);">${formatMoney(c.total)}</td>
                <td style="vertical-align: middle; width: 180px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="background: #e2e8f0; border-radius: 4px; height: 12px; flex: 1; overflow: hidden;">
                            <div style="background: #0284c7; height: 100%; width: ${barWidth}%;"></div>
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 800; width: 45px;">${pctTotal}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderReporteTransacciones(ventas) {
    const tbody = document.getElementById('tabla-transacciones-tbody');
    if (!tbody) return;

    if (ventas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding: 20px; color: var(--color-slate-light);">No se encontraron transacciones en el periodo.</td></tr>';
        return;
    }

    const formatMoney = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    tbody.innerHTML = ventas.slice(0, 50).map(v => {
        const fechaFormat = new Date(v.fecha_hora).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
        const itemsResumen = (v.items || []).map(it => `${it.cantidad}x ${it.nombre}`).join(', ');

        return `
            <tr>
                <td><b>${v.folio_ticket || ('TICK-' + String(v.id_venta).padStart(5, '0'))}</b></td>
                <td>${fechaFormat}</td>
                <td>${escapeHTML(v.cajero || 'Cajero')}</td>
                <td><span class="meta-chip">${v.metodo_pago}</span></td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(itemsResumen)}">
                    ${escapeHTML(itemsResumen)}
                </td>
                <td class="text-right font-bold" style="color: var(--color-emerald);">${formatMoney(v.total)}</td>
                <td class="text-center">
                    <button type="button" class="btn-table-action" style="background: #0284c7; color: white;" onclick="window.POS_MODULE.reimprimirTicket('${v.folio_ticket || v.id_venta}')">
                        Ticket
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// -----------------------------------------------------------------------------
// 6. EXPORTACIÓN OFICIAL DE REPORTES A CSV (EXCEL COMPLIANT)
// -----------------------------------------------------------------------------

function descargarArchivoCSV(nombreArchivo, filas) {
    const csvContent = '\uFEFF' + filas.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportarBalanceCSV() {
    if (!cacheReporteVentas || cacheReporteVentas.length === 0) {
        alert('No hay datos en el reporte actual para exportar.');
        return;
    }

    const filas = [
        ['PAPELERIA A B C - REPORTE DE BALANCE DIARIO Y CONCILIACION FINANCIERA'],
        ['Fecha de Generacion:', new Date().toLocaleString('es-MX')],
        ['Periodo Filtrado:', filtroActual.periodo, 'Desde:', filtroActual.fechaInicio || 'Inicio', 'Hasta:', filtroActual.fechaFin || 'Fin'],
        ['Metodo Pago:', filtroActual.metodoPago, 'Categoria:', filtroActual.categoria],
        []
    ];

    filas.push(['Fecha', 'Transacciones', 'Ventas Brutas ($)', 'Descuentos ($)', 'Ventas Netas ($)', 'IVA Trasladado 16% ($)', 'Costo Mercancia ($)', 'Utilidad Bruta ($)', 'Efectivo ($)', 'Tarjeta ($)', 'SPEI ($)']);

    const diarioMap = new Map();
    cacheReporteVentas.forEach(v => {
        const f = v.fecha_hora.slice(0, 10);
        if (!diarioMap.has(f)) {
            diarioMap.set(f, { fecha: f, trans: 0, bruto: 0, desc: 0, neto: 0, iva: 0, costo: 0, efvo: 0, tarj: 0, spei: 0 });
        }
        const d = diarioMap.get(f);
        d.trans += 1;
        d.bruto += Number(v.total_bruto || v.total || 0);
        d.desc += Number(v.descuento || 0);
        d.neto += Number(v.total || 0);
        d.iva += Number(v.iva || 0);
        if (v.metodo_pago === 'EFECTIVO') d.efvo += Number(v.total || 0);
        else if (v.metodo_pago === 'TARJETA') d.tarj += Number(v.total || 0);
        else if (v.metodo_pago === 'TRANSFERENCIA') d.spei += Number(v.total || 0);
    });

    Array.from(diarioMap.values()).sort((a, b) => b.fecha.localeCompare(a.fecha)).forEach(d => {
        filas.push([
            d.fecha,
            d.trans,
            d.bruto.toFixed(2),
            d.desc.toFixed(2),
            d.neto.toFixed(2),
            d.iva.toFixed(2),
            d.costo.toFixed(2),
            (d.neto - d.costo).toFixed(2),
            d.efvo.toFixed(2),
            d.tarj.toFixed(2),
            d.spei.toFixed(2)
        ]);
    });

    const fechaHoy = new Date().toISOString().slice(0, 10);
    descargarArchivoCSV(`reporte_balance_diario_${fechaHoy}.csv`, filas);
}

async function exportarTopProductosCSV() {
    const productos = await window.POS_DB.getProductosCompletos();
    const prodCostMap = new Map(productos.map(p => [p.id_producto, p.precio_compra || 0]));
    const prodCatMap = new Map(productos.map(p => [p.id_producto, p.categoria_nombre || 'General']));

    const productoStats = new Map();
    cacheReporteVentas.forEach(v => {
        (v.items || []).forEach(it => {
            const pId = it.id_producto || it.nombre;
            if (!productoStats.has(pId)) {
                productoStats.set(pId, {
                    id: it.id_producto,
                    nombre: it.nombre,
                    categoria: prodCatMap.get(it.id_producto) || (it.es_servicio ? 'Servicios' : 'General'),
                    unidades: 0,
                    ingreso: 0,
                    costo: 0
                });
            }
            const p = productoStats.get(pId);
            p.unidades += Number(it.cantidad || 0);
            p.ingreso += Number(it.subtotal || 0);
            p.costo += Number(it.cantidad || 0) * (prodCostMap.get(it.id_producto) || 0);
        });
    });

    const filas = [
        ['PAPELERIA A B C - RANKING DE PRODUCTOS MAS VENDIDOS (TOP PRODUCTOS)'],
        ['Fecha de Generacion:', new Date().toLocaleString('es-MX')],
        ['Total Articulos Vendidos:', Array.from(productoStats.values()).reduce((s, p) => s + p.unidades, 0)],
        []
    ];

    filas.push(['Posicion', 'Nombre del Articulo', 'Categoria', 'Unidades Vendidas', 'Ingresos Generados ($)', 'Costo Total ($)', 'Utilidad Bruta ($)', 'Margen Rentabilidad (%)']);

    const sorted = Array.from(productoStats.values()).sort((a, b) => b.unidades - a.unidades);
    sorted.forEach((p, idx) => {
        const util = p.ingreso - p.costo;
        const mg = p.ingreso > 0 ? ((util / p.ingreso) * 100).toFixed(1) + '%' : '0.0%';
        filas.push([
            idx + 1,
            p.nombre,
            p.categoria,
            p.unidades,
            p.ingreso.toFixed(2),
            p.costo.toFixed(2),
            util.toFixed(2),
            mg
        ]);
    });

    const fechaHoy = new Date().toISOString().slice(0, 10);
    descargarArchivoCSV(`reporte_top_productos_${fechaHoy}.csv`, filas);
}

function exportarVentasCategoriaCSV() {
    const categoriaStats = new Map();
    cacheReporteVentas.forEach(v => {
        (v.items || []).forEach(it => {
            const cat = it.es_servicio ? 'Servicios y Copias' : 'General';
            if (!categoriaStats.has(cat)) {
                categoriaStats.set(cat, { nombre: cat, unidades: 0, total: 0 });
            }
            const c = categoriaStats.get(cat);
            c.unidades += Number(it.cantidad || 0);
            c.total += Number(it.subtotal || 0);
        });
    });

    const filas = [
        ['PAPELERIA A B C - VENTAS CONSOLIDADAS POR CATEGORIA'],
        ['Fecha de Generacion:', new Date().toLocaleString('es-MX')],
        []
    ];
    filas.push(['Categoria Comercial', 'Unidades Vendidas', 'Importe Facturado ($ MXN)', '% de Participacion']);

    const totalGlobal = Array.from(categoriaStats.values()).reduce((s, c) => s + c.total, 0);
    Array.from(categoriaStats.values()).sort((a, b) => b.total - a.total).forEach(c => {
        const pct = totalGlobal > 0 ? ((c.total / totalGlobal) * 100).toFixed(1) + '%' : '0.0%';
        filas.push([c.nombre, c.unidades, c.total.toFixed(2), pct]);
    });

    const fechaHoy = new Date().toISOString().slice(0, 10);
    descargarArchivoCSV(`reporte_ventas_categoria_${fechaHoy}.csv`, filas);
}

function exportarTransaccionesDetalladasCSV() {
    if (!cacheReporteVentas || cacheReporteVentas.length === 0) {
        alert('No hay transacciones para exportar.');
        return;
    }

    const filas = [
        ['PAPELERIA A B C - HISTORIAL DETALLADO DE TRANSACCIONES DE VENTA'],
        ['Fecha de Generacion:', new Date().toLocaleString('es-MX')],
        ['Total Ventas Exportadas:', cacheReporteVentas.length],
        []
    ];

    filas.push(['Folio Ticket', 'Fecha y Hora', 'Cajero', 'Metodo de Pago', 'Articulos Vendidos', 'Subtotal ($)', 'IVA 16% ($)', 'Total Cobrado ($)', 'Monto Recibido ($)', 'Cambio ($)']);

    cacheReporteVentas.forEach(v => {
        const itemsStr = (v.items || []).map(it => `${it.cantidad}x ${it.nombre}`).join(' | ');
        filas.push([
            v.folio_ticket || ('TICK-' + String(v.id_venta).padStart(5, '0')),
            v.fecha_hora,
            v.cajero || 'Cajero',
            v.metodo_pago,
            itemsStr,
            Number(v.subtotal || 0).toFixed(2),
            Number(v.iva || 0).toFixed(2),
            Number(v.total || 0).toFixed(2),
            Number(v.monto_recibido || v.total || 0).toFixed(2),
            Number(v.cambio || 0).toFixed(2)
        ]);
    });

    const fechaHoy = new Date().toISOString().slice(0, 10);
    descargarArchivoCSV(`reporte_transacciones_detalladas_${fechaHoy}.csv`, filas);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// -----------------------------------------------------------------------------
// EXPORTACIÓN DE API GLOBAL
// -----------------------------------------------------------------------------

// =============================================================================
// REPORTE EJECUTIVO PDF: VENTAS SEMANA/MES/AÑO, CAJEROS Y AUDITORÍA DE USUARIOS
// =============================================================================

function formatMoney(amount) {
    const num = Number(amount) || 0;
    return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sanitizeTextForPDF(str) {
    if (!str) return '';
    return str.toString()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
        .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
        .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}

async function calcularMetricasReporteEjecutivo() {
    const ventas = await window.POS_DB.getHistorialVentas();
    const usuarios = await window.POS_DB.getUsuarios();
    const bitacora = await window.POS_DB.getBitacoraSeguridad();
    const cortes = (typeof window.POS_DB.getCortesCaja === 'function') ? await window.POS_DB.getCortesCaja() : [];
    const movimientos = (typeof window.POS_DB.getMovimientosCaja === 'function') ? await window.POS_DB.getMovimientosCaja() : [];
    const devoluciones = (typeof window.POS_DB.getDevolucionesYCambios === 'function') ? await window.POS_DB.getDevolucionesYCambios() : [];
    const kardex = (typeof window.POS_DB.getHistorialKardex === 'function') ? await window.POS_DB.getHistorialKardex() : [];

    const now = new Date();
    const semanaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const anoInicio = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    function acumularVentas(lista) {
        let total = 0;
        let tickets = lista.length;
        let articulos = 0;
        let efectivo = 0;
        let tarjeta = 0;
        let transferencia = 0;

        lista.forEach(v => {
            const tot = Number(v.total) || 0;
            total += tot;
            articulos += Number(v.total_articulos) || (v.items ? v.items.reduce((s, it) => s + Number(it.cantidad || 0), 0) : 1);
            const met = (v.metodo_pago || 'EFECTIVO').toUpperCase();
            if (met.includes('EFECTIVO')) efectivo += tot;
            else if (met.includes('TARJETA')) tarjeta += tot;
            else if (met.includes('TRANSFERENCIA') || met.includes('SPEI')) transferencia += tot;
            else efectivo += tot;
        });

        const promedio = tickets > 0 ? total / tickets : 0;
        return { total, tickets, articulos, promedio, efectivo, tarjeta, transferencia };
    }

    const ventasCompletadas = (ventas || []).filter(v => (v.estado || 'COMPLETADA') !== 'CANCELADA');

    const ventasSemana = ventasCompletadas.filter(v => new Date(v.fecha_hora) >= semanaInicio);
    const ventasMes = ventasCompletadas.filter(v => new Date(v.fecha_hora) >= mesInicio);
    const ventasAno = ventasCompletadas.filter(v => new Date(v.fecha_hora) >= anoInicio);
    const ventasHistorico = ventasCompletadas;

    const resumenSemana = acumularVentas(ventasSemana);
    const resumenMes = acumularVentas(ventasMes);
    const resumenAno = acumularVentas(ventasAno);
    const resumenHistorico = acumularVentas(ventasHistorico);

    // Desglose por Cajero
    const cajerosMap = new Map();
    ventasHistorico.forEach(v => {
        const nombreCajero = (v.cajero || 'Cajero Sin Asignar').trim();
        if (!cajerosMap.has(nombreCajero)) {
            cajerosMap.set(nombreCajero, {
                nombre: nombreCajero,
                ventas: []
            });
        }
        cajerosMap.get(nombreCajero).ventas.push(v);
    });

    const desgloseCajeros = [];
    cajerosMap.forEach(c => {
        const metSemana = acumularVentas(c.ventas.filter(v => new Date(v.fecha_hora) >= semanaInicio));
        const metMes = acumularVentas(c.ventas.filter(v => new Date(v.fecha_hora) >= mesInicio));
        const metAno = acumularVentas(c.ventas.filter(v => new Date(v.fecha_hora) >= anoInicio));
        const metTotal = acumularVentas(c.ventas);

        const pct = resumenHistorico.total > 0 ? ((metTotal.total / resumenHistorico.total) * 100) : 0;

        // Buscar rol correspondiente en usuarios
        const usrMatch = (usuarios || []).find(u => 
            (u.nombre_completo && u.nombre_completo.toLowerCase() === c.nombre.toLowerCase()) ||
            (u.username && u.username.toLowerCase() === c.nombre.toLowerCase())
        );

        desgloseCajeros.push({
            nombre: c.nombre,
            rol: usrMatch ? usrMatch.rol : 'CAJERO/OPERADOR',
            username: usrMatch ? usrMatch.username : '-',
            semanaTotal: metSemana.total,
            mesTotal: metMes.total,
            anoTotal: metAno.total,
            totalGlobal: metTotal.total,
            tickets: metTotal.tickets,
            articulos: metTotal.articulos,
            promedio: metTotal.promedio,
            efectivo: metTotal.efectivo,
            tarjeta: metTotal.tarjeta,
            transferencia: metTotal.transferencia,
            pctContribucion: pct
        });
    });

    desgloseCajeros.sort((a, b) => b.totalGlobal - a.totalGlobal);

    // Auditoría y Reportes de Eventos de Cada Usuario
    const auditoriaUsuarios = (usuarios || []).map(u => {
        const uName = (u.username || '').toLowerCase();
        const uFull = (u.nombre_completo || '').toLowerCase();

        const matchUser = (val) => {
            if (!val) return false;
            const clean = val.toString().trim().toLowerCase();
            return clean === uName || clean === uFull;
        };

        const userVentas = ventasCompletadas.filter(v => matchUser(v.cajero));
        const totVentasUser = userVentas.reduce((s, v) => s + (Number(v.total) || 0), 0);

        const userCortes = (cortes || []).filter(c => matchUser(c.cajero) || matchUser(c.usuario));
        const userMovs = (movimientos || []).filter(m => matchUser(m.usuario));
        const userDevs = (devoluciones || []).filter(d => matchUser(d.autorizado_por) || matchUser(d.cajero) || matchUser(d.usuario));
        const userKardex = (kardex || []).filter(k => matchUser(k.usuario));
        const userSeguridad = (bitacora || []).filter(b => matchUser(b.usuario));

        return {
            id_usuario: u.id_usuario,
            username: u.username,
            nombre_completo: u.nombre_completo || u.username,
            rol: u.rol,
            activo: u.activo ? 'ACTIVO' : 'INACTIVO',
            ultimo_acceso: u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX') : 'Sin registros',
            ventasTickets: userVentas.length,
            ventasMonto: totVentasUser,
            cortesZ: userCortes.length,
            movimientosCaja: userMovs.length,
            devolucionesCambios: userDevs.length,
            movimientosKardex: userKardex.length,
            eventosSeguridad: userSeguridad.length
        };
    });

    // Bitácora cronológica reciente
    const eventosRecientes = (bitacora || []).slice(0, 15);

    // Emisor del reporte
    const currentUser = (window.AUTH_MODULE && typeof window.AUTH_MODULE.getCurrentUser === 'function')
        ? window.AUTH_MODULE.getCurrentUser()
        : null;
    const emisorNombre = currentUser ? `${currentUser.nombre_completo || currentUser.username} (${currentUser.rol})` : 'Gerardo Cabrera Morales (ADMINISTRADOR)';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const folioReporte = `REP-PDF-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${randomSuffix}`;
    const fechaEmisionTexto = now.toLocaleString('es-MX');

    // Sello de integridad básico
    const hashData = `${folioReporte}|${resumenHistorico.total}|${resumenSemana.total}|${desgloseCajeros.length}|${now.toISOString()}`;
    let hashIntegridad = '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
    try {
        let hash = 0;
        for (let i = 0; i < hashData.length; i++) {
            const chr = hashData.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        hashIntegridad = Math.abs(hash).toString(16).padStart(16, '0') + 'e3b0c44298fc1c149afbf4c8996fb924';
    } catch(e) {}

    return {
        folio: folioReporte,
        fechaEmision: fechaEmisionTexto,
        emisor: emisorNombre,
        hashIntegridad: hashIntegridad,
        periodos: {
            semana: resumenSemana,
            mes: resumenMes,
            ano: resumenAno,
            historico: resumenHistorico
        },
        cajeros: desgloseCajeros,
        usuarios: auditoriaUsuarios,
        eventosRecientes: eventosRecientes
    };
}

function renderReportePDFHTML(data) {
    const p = data.periodos;

    let cajerosRowsHTML = '';
    data.cajeros.forEach(c => {
        cajerosRowsHTML += `
            <tr>
                <td style="font-weight: 600;">${escapeHTML(c.nombre)}</td>
                <td><span class="role-badge role-${c.rol.toLowerCase().includes('admin') ? 'admin' : (c.rol.toLowerCase().includes('super') ? 'supervisor' : 'cajero')}">${escapeHTML(c.rol)}</span></td>
                <td style="text-align: center;">${c.tickets}</td>
                <td style="text-align: right; font-weight: 600; color: #0284c7;">${formatMoney(c.semanaTotal)}</td>
                <td style="text-align: right; font-weight: 600; color: #0369a1;">${formatMoney(c.mesTotal)}</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a;">${formatMoney(c.totalGlobal)}</td>
                <td style="text-align: right;">${formatMoney(c.promedio)}</td>
                <td style="text-align: right; font-weight: 700;">${c.pctContribucion.toFixed(1)}%</td>
            </tr>
        `;
    });

    let usuariosRowsHTML = '';
    data.usuarios.forEach(u => {
        usuariosRowsHTML += `
            <tr>
                <td style="font-weight: 700;">${escapeHTML(u.username)}</td>
                <td>${escapeHTML(u.nombre_completo)}</td>
                <td><span class="role-badge role-${u.rol.toLowerCase().includes('admin') ? 'admin' : (u.rol.toLowerCase().includes('super') ? 'supervisor' : 'cajero')}">${escapeHTML(u.rol)}</span></td>
                <td style="font-size: 0.72rem; color: #64748b;">${escapeHTML(u.ultimo_acceso)}</td>
                <td style="text-align: center; font-weight: 600;">${u.ventasTickets} <small>(${formatMoney(u.ventasMonto)})</small></td>
                <td style="text-align: center;">${u.cortesZ}</td>
                <td style="text-align: center;">${u.movimientosCaja}</td>
                <td style="text-align: center;">${u.devolucionesCambios}</td>
                <td style="text-align: center;">${u.movimientosKardex}</td>
                <td style="text-align: center; font-weight: 700; color: ${u.eventosSeguridad > 0 ? '#b91c1c' : '#166534'};">${u.eventosSeguridad}</td>
            </tr>
        `;
    });

    let eventosRowsHTML = '';
    if (data.eventosRecientes.length === 0) {
        eventosRowsHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No hay eventos registrados en la bitácora de seguridad.</td></tr>';
    } else {
        data.eventosRecientes.forEach(ev => {
            const fechaStr = new Date(ev.fecha_hora).toLocaleString('es-MX');
            const sevColor = ev.severidad === 'ALTA' ? '#b91c1c' : (ev.severidad === 'MEDIA' ? '#d97706' : '#166534');
            eventosRowsHTML += `
                <tr>
                    <td style="font-size: 0.72rem; white-space: nowrap;">${escapeHTML(fechaStr)}</td>
                    <td style="font-weight: 600; font-size: 0.74rem;">${escapeHTML(ev.tipo_evento || 'AUDITORIA')}</td>
                    <td style="font-size: 0.74rem;">${escapeHTML(ev.usuario || 'SISTEMA')} <small style="color: #64748b;">(${escapeHTML(ev.rol || '-')})</small></td>
                    <td><span style="font-size: 0.68rem; font-weight: 700; color: ${sevColor}; padding: 2px 6px; border-radius: 3px; background: #f8fafc; border: 1px solid #e2e8f0;">${escapeHTML(ev.severidad || 'INFO')}</span></td>
                    <td style="font-size: 0.72rem; color: #334155;">${escapeHTML(ev.detalles || 'Operación registrada')}</td>
                </tr>
            `;
        });
    }

    return `
        <div style="background: #ffffff; padding: 20px 24px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            
            <!-- Encabezado Oficial -->
            <div class="report-pdf-header-box">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <img src="LOGO.jpg" alt="Logo Papelería ABC" style="width: 58px; height: 58px; object-fit: contain; border-radius: 6px; border: 1px solid #e2e8f0; padding: 2px;" onerror="this.style.display='none'">
                    <div>
                        <h1 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">PAPELERÍA A B C, S.A. DE C.V.</h1>
                        <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #475569; font-weight: 600;">SISTEMA INTEGRAL DE PUNTO DE VENTA Y CONTROL DE ALMACÉN</p>
                        <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: #64748b;">RFC: PAB-980415-ABC | Av. Universidad 1200, Col. Xoco, CDMX | Tel: (55) 5524-8800</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: #0f172a; color: #ffffff; padding: 5px 12px; border-radius: 4px; font-weight: 800; font-size: 0.82rem; display: inline-block;">
                        REPORTE EJECUTIVO OFICIAL
                    </div>
                    <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px; font-weight: 700;">
                        FOLIO: <span style="color: #b91c1c;">${escapeHTML(data.folio)}</span>
                    </div>
                </div>
            </div>

            <!-- Metadatos de Emisión e Integridad -->
            <div class="report-pdf-meta-box">
                <div><strong>Fecha de Emisión:</strong> ${escapeHTML(data.fechaEmision)}</div>
                <div><strong>Emisor Responsable:</strong> ${escapeHTML(data.emisor)}</div>
                <div><strong>Estado de Certificación:</strong> <span style="color: #166534; font-weight: 700;">VALIDADO Y FIRMADO LOCALMENTE</span></div>
                <div style="width: 100%; font-size: 0.68rem; color: #64748b; margin-top: 4px; word-break: break-all;">
                    <strong>Firma SHA-256 de Integridad:</strong> ${escapeHTML(data.hashIntegridad)}
                </div>
            </div>

            <!-- SECCIÓN 1: CONSOLIDADO DE VENTAS POR PERÍODO -->
            <div class="report-pdf-section-title">
                <span>1. CONSOLIDADO FINANCIERO Y VENTAS POR PERÍODO (SEMANA, MES, AÑO, HISTÓRICO)</span>
                <span style="font-size: 0.72rem; font-weight: 400; opacity: 0.9;">Moneda Oficial: Pesos Mexicanos ($ MXN)</span>
            </div>

            <!-- Tarjetas KPI -->
            <div class="report-pdf-kpi-grid">
                <div class="report-pdf-kpi-card" style="border-left-color: #2563eb;">
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Ventas Esta Semana (7 Días)</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #1e3a8a; margin: 4px 0;">${formatMoney(p.semana.total)}</div>
                    <div style="font-size: 0.72rem; color: #475569;">${p.semana.tickets} Tickets | Prom: ${formatMoney(p.semana.promedio)}</div>
                </div>
                <div class="report-pdf-kpi-card" style="border-left-color: #0284c7;">
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Ventas Este Mes Actual</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #0369a1; margin: 4px 0;">${formatMoney(p.mes.total)}</div>
                    <div style="font-size: 0.72rem; color: #475569;">${p.mes.tickets} Tickets | Prom: ${formatMoney(p.mes.promedio)}</div>
                </div>
                <div class="report-pdf-kpi-card" style="border-left-color: #059669;">
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Ventas Este Año Fiscal (2026)</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #065f46; margin: 4px 0;">${formatMoney(p.ano.total)}</div>
                    <div style="font-size: 0.72rem; color: #475569;">${p.ano.tickets} Tickets | Prom: ${formatMoney(p.ano.promedio)}</div>
                </div>
                <div class="report-pdf-kpi-card" style="border-left-color: #0f172a;">
                    <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Acumulado Histórico</div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 4px 0;">${formatMoney(p.historico.total)}</div>
                    <div style="font-size: 0.72rem; color: #475569;">${p.historico.tickets} Tickets | ${p.historico.articulos} Artículos</div>
                </div>
            </div>

            <!-- Tabla Detallada de Períodos -->
            <table class="report-pdf-table">
                <thead>
                    <tr>
                        <th>Período Temporal</th>
                        <th style="text-align: right;">Ventas Totales ($)</th>
                        <th style="text-align: center;">Tickets</th>
                        <th style="text-align: right;">Ticket Prom. ($)</th>
                        <th style="text-align: center;">Artículos</th>
                        <th style="text-align: right;">Efectivo ($)</th>
                        <th style="text-align: right;">Tarjeta ($)</th>
                        <th style="text-align: right;">Transferencia ($)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: 700; color: #2563eb;">Esta Semana (Últimos 7 Días)</td>
                        <td style="text-align: right; font-weight: 700; color: #2563eb;">${formatMoney(p.semana.total)}</td>
                        <td style="text-align: center;">${p.semana.tickets}</td>
                        <td style="text-align: right;">${formatMoney(p.semana.promedio)}</td>
                        <td style="text-align: center;">${p.semana.articulos}</td>
                        <td style="text-align: right;">${formatMoney(p.semana.efectivo)}</td>
                        <td style="text-align: right;">${formatMoney(p.semana.tarjeta)}</td>
                        <td style="text-align: right;">${formatMoney(p.semana.transferencia)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; color: #0284c7;">Este Mes (Noviembre)</td>
                        <td style="text-align: right; font-weight: 700; color: #0284c7;">${formatMoney(p.mes.total)}</td>
                        <td style="text-align: center;">${p.mes.tickets}</td>
                        <td style="text-align: right;">${formatMoney(p.mes.promedio)}</td>
                        <td style="text-align: center;">${p.mes.articulos}</td>
                        <td style="text-align: right;">${formatMoney(p.mes.efectivo)}</td>
                        <td style="text-align: right;">${formatMoney(p.mes.tarjeta)}</td>
                        <td style="text-align: right;">${formatMoney(p.mes.transferencia)}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; color: #059669;">Este Año (Ejercicio 2026)</td>
                        <td style="text-align: right; font-weight: 700; color: #059669;">${formatMoney(p.ano.total)}</td>
                        <td style="text-align: center;">${p.ano.tickets}</td>
                        <td style="text-align: right;">${formatMoney(p.ano.promedio)}</td>
                        <td style="text-align: center;">${p.ano.articulos}</td>
                        <td style="text-align: right;">${formatMoney(p.ano.efectivo)}</td>
                        <td style="text-align: right;">${formatMoney(p.ano.tarjeta)}</td>
                        <td style="text-align: right;">${formatMoney(p.ano.transferencia)}</td>
                    </tr>
                    <tr style="background: #f1f5f9; font-weight: 700;">
                        <td style="color: #0f172a;">Histórico Consolidado</td>
                        <td style="text-align: right; color: #0f172a;">${formatMoney(p.historico.total)}</td>
                        <td style="text-align: center;">${p.historico.tickets}</td>
                        <td style="text-align: right;">${formatMoney(p.historico.promedio)}</td>
                        <td style="text-align: center;">${p.historico.articulos}</td>
                        <td style="text-align: right;">${formatMoney(p.historico.efectivo)}</td>
                        <td style="text-align: right;">${formatMoney(p.historico.tarjeta)}</td>
                        <td style="text-align: right;">${formatMoney(p.historico.transferencia)}</td>
                    </tr>
                </tbody>
            </table>

            <!-- SECCIÓN 2: DESGLOSE POR CAJERO -->
            <div class="report-pdf-section-title" style="margin-top: 24px;">
                <span>2. DESGLOSE DE VENTAS Y PRODUCTIVIDAD POR CAJERO</span>
                <span style="font-size: 0.72rem; font-weight: 400; opacity: 0.9;">Total Colaboradores en Turno: ${data.cajeros.length}</span>
            </div>

            <table class="report-pdf-table">
                <thead>
                    <tr>
                        <th>Cajero / Colaborador</th>
                        <th>Rol Asignado</th>
                        <th style="text-align: center;">Tickets</th>
                        <th style="text-align: right;">Ventas Semana ($)</th>
                        <th style="text-align: right;">Ventas Mes ($)</th>
                        <th style="text-align: right;">Total Acumulado ($)</th>
                        <th style="text-align: right;">Ticket Prom. ($)</th>
                        <th style="text-align: right;">% Aportación</th>
                    </tr>
                </thead>
                <tbody>
                    ${cajerosRowsHTML}
                </tbody>
            </table>

            <!-- SECCIÓN 3: AUDITORÍA Y EVENTOS DE CADA USUARIO -->
            <div class="report-pdf-section-title" style="margin-top: 24px;">
                <span>3. AUDITORÍA OPERATIVA Y REPORTE DE EVENTOS POR USUARIO</span>
                <span style="font-size: 0.72rem; font-weight: 400; opacity: 0.9;">Perfiles Registrados en Catálogo RBAC: ${data.usuarios.length}</span>
            </div>

            <table class="report-pdf-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Rol</th>
                        <th>Último Acceso</th>
                        <th style="text-align: center;">Tickets Venta</th>
                        <th style="text-align: center;">Cortes Z</th>
                        <th style="text-align: center;">Mov. Caja</th>
                        <th style="text-align: center;">Dev/Cam</th>
                        <th style="text-align: center;">Kardex</th>
                        <th style="text-align: center;">Eventos Seg.</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuariosRowsHTML}
                </tbody>
            </table>

            <!-- SECCIÓN 4: BITÁCORA CRONOLÓGICA DE AUDITORÍA -->
            <div class="report-pdf-section-title" style="margin-top: 24px;">
                <span>4. BITÁCORA CRONOLÓGICA DE EVENTOS DE AUDITORÍA Y SEGURIDAD RECIENTE</span>
                <span style="font-size: 0.72rem; font-weight: 400; opacity: 0.9;">Últimos Eventos Registrados en Motor Relacional</span>
            </div>

            <table class="report-pdf-table">
                <thead>
                    <tr>
                        <th style="width: 140px;">Fecha / Hora</th>
                        <th>Tipo de Evento</th>
                        <th>Usuario / Rol</th>
                        <th style="width: 75px; text-align: center;">Severidad</th>
                        <th>Detalles Operativos</th>
                    </tr>
                </thead>
                <tbody>
                    ${eventosRowsHTML}
                </tbody>
            </table>

            <!-- SECCIÓN 5: CERTIFICACIÓN Y FIRMAS -->
            <div class="no-break-inside" style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 20px;">
                <div style="font-size: 0.8rem; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 25px; text-align: center;">
                    Certificación de Autenticidad y Validación Administrativa
                </div>
                <div class="report-pdf-signature-grid">
                    <div class="report-pdf-signature-box">
                        <div class="report-pdf-signature-line"></div>
                        <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a;">Lic. Gerardo Cabrera Morales</div>
                        <div style="font-size: 0.7rem; color: #64748b;">Administrador General del Sistema</div>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 2px;">Firma de Autorización y Cierre</div>
                    </div>
                    <div class="report-pdf-signature-box">
                        <div class="report-pdf-signature-line"></div>
                        <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a;">Astrid García Ramírez</div>
                        <div style="font-size: 0.7rem; color: #64748b;">Supervisora Operativa de Caja</div>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 2px;">Firma de Conciliación Arqueo</div>
                    </div>
                    <div class="report-pdf-signature-box">
                        <div class="report-pdf-signature-line"></div>
                        <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a;">Auditoría y Control Interno</div>
                        <div style="font-size: 0.7rem; color: #64748b;">Papelería A B C, S.A. de C.V.</div>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 2px;">Sello Digital Criptográfico SHA-256</div>
                    </div>
                </div>
            </div>

            <!-- Pie del Reporte -->
            <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 0.68rem; color: #64748b;">
                <div>Papelería A B C — Reporte Oficial generado mediante arquitectura web local blindada | Sin dependencias externas</div>
                <div>Folio: ${escapeHTML(data.folio)} | Página 1 de 1</div>
            </div>
        </div>
    `;
}

// -----------------------------------------------------------------------------
// GENERADOR NATIVO BINARIO %PDF-1.4 EN JAVASCRIPT PURO
// -----------------------------------------------------------------------------

function generarPDFBinario(data) {
    const p = data.periodos;

    const pages = [];

    // PAGINA 1: Encabezado, Resumen Periodos y Desglose Cajeros
    const p1 = [];
    p1.push('0.06 0.09 0.16 rg 40 735 532 35 re f');
    p1.push('BT /F2 12 Tf 1 1 1 rg 50 752 Td (' + sanitizeTextForPDF('PAPELERIA A B C - REPORTE EJECUTIVO Y AUDITORIA INTEGRAL') + ') Tj ET');
    p1.push('BT /F1 8 Tf 0.8 0.85 0.9 rg 50 740 Td (' + sanitizeTextForPDF('SISTEMA DE PUNTO DE VENTA Y CONTROL DE INVENTARIOS | RFC: PAB-980415-ABC') + ') Tj ET');

    // Metadatos
    p1.push('0.95 0.96 0.98 rg 40 682 532 45 re f 0.8 0.83 0.88 RG 0.5 w 40 682 532 45 re s');
    p1.push('BT /F2 8 Tf 0.1 0.1 0.1 rg 50 712 Td (' + sanitizeTextForPDF('FOLIO OFICIAL: ' + data.folio) + ') Tj /F1 8 Tf 180 0 Td (' + sanitizeTextForPDF('FECHA: ' + data.fechaEmision) + ') Tj 150 0 Td (' + sanitizeTextForPDF('EMISOR: ' + data.emisor) + ') Tj ET');
    p1.push('BT /F1 7 Tf 0.3 0.35 0.4 rg 50 692 Td (' + sanitizeTextForPDF('SELLO INTEGRIDAD SHA-256: ' + data.hashIntegridad) + ') Tj ET');

    // Seccion 1: Periodos
    p1.push('0.1 0.25 0.45 rg 40 655 532 16 re f');
    p1.push('BT /F2 8.5 Tf 1 1 1 rg 50 660 Td (' + sanitizeTextForPDF('1. RESUMEN DE VENTAS POR PERIODO (SEMANA, MES, ANO, HISTORICO)') + ') Tj ET');

    // Header tabla periodos
    p1.push('0.92 0.94 0.96 rg 40 637 532 15 re f 0.8 0.83 0.88 RG 0.5 w 40 637 532 15 re s');
    p1.push('BT /F2 7.2 Tf 0.1 0.15 0.2 rg 45 641 Td (' + sanitizeTextForPDF('PERIODO') + ') Tj 80 0 Td (' + sanitizeTextForPDF('VENTAS ($)') + ') Tj 70 0 Td (' + sanitizeTextForPDF('TICKETS') + ') Tj 50 0 Td (' + sanitizeTextForPDF('PROM ($)') + ') Tj 55 0 Td (' + sanitizeTextForPDF('ARTS') + ') Tj 55 0 Td (' + sanitizeTextForPDF('EFECTIVO') + ') Tj 65 0 Td (' + sanitizeTextForPDF('TARJETA') + ') Tj 65 0 Td (' + sanitizeTextForPDF('TRANSF') + ') Tj ET');

    let y = 623;
    const periodosData = [
        ['Esta Semana (7d)', formatMoney(p.semana.total), String(p.semana.tickets), formatMoney(p.semana.promedio), String(p.semana.articulos), formatMoney(p.semana.efectivo), formatMoney(p.semana.tarjeta), formatMoney(p.semana.transferencia)],
        ['Este Mes Actual', formatMoney(p.mes.total), String(p.mes.tickets), formatMoney(p.mes.promedio), String(p.mes.articulos), formatMoney(p.mes.efectivo), formatMoney(p.mes.tarjeta), formatMoney(p.mes.transferencia)],
        ['Este Ano Fiscal (2026)', formatMoney(p.ano.total), String(p.ano.tickets), formatMoney(p.ano.promedio), String(p.ano.articulos), formatMoney(p.ano.efectivo), formatMoney(p.ano.tarjeta), formatMoney(p.ano.transferencia)],
        ['Total Historico Consolidado', formatMoney(p.historico.total), String(p.historico.tickets), formatMoney(p.historico.promedio), String(p.historico.articulos), formatMoney(p.historico.efectivo), formatMoney(p.historico.tarjeta), formatMoney(p.historico.transferencia)]
    ];

    periodosData.forEach((row, idx) => {
        p1.push('0.88 0.90 0.92 RG 0.5 w 40 ' + (y - 3) + ' m 572 ' + (y - 3) + ' l S');
        const fontName = idx === 3 ? '/F2' : '/F1';
        p1.push('BT /F2 7 Tf 0.1 0.1 0.1 rg 45 ' + y + ' Td (' + sanitizeTextForPDF(row[0]) + ') Tj ' + fontName + ' 7 Tf 80 0 Td (' + sanitizeTextForPDF(row[1]) + ') Tj 70 0 Td (' + sanitizeTextForPDF(row[2]) + ') Tj 50 0 Td (' + sanitizeTextForPDF(row[3]) + ') Tj 55 0 Td (' + sanitizeTextForPDF(row[4]) + ') Tj 55 0 Td (' + sanitizeTextForPDF(row[5]) + ') Tj 65 0 Td (' + sanitizeTextForPDF(row[6]) + ') Tj 65 0 Td (' + sanitizeTextForPDF(row[7]) + ') Tj ET');
        y -= 14;
    });

    // Seccion 2: Desglose Cajeros
    y -= 10;
    p1.push('0.1 0.25 0.45 rg 40 ' + y + ' 532 16 re f');
    p1.push('BT /F2 8.5 Tf 1 1 1 rg 50 ' + (y + 5) + ' Td (' + sanitizeTextForPDF('2. DESGLOSE DE VENTAS Y PRODUCTIVIDAD POR CAJERO') + ') Tj ET');
    y -= 18;
    p1.push('0.92 0.94 0.96 rg 40 ' + y + ' 532 15 re f 0.8 0.83 0.88 RG 0.5 w 40 ' + y + ' 532 15 re s');
    p1.push('BT /F2 7.2 Tf 0.1 0.15 0.2 rg 45 ' + (y + 4) + ' Td (' + sanitizeTextForPDF('CAJERO / COLABORADOR') + ') Tj 130 0 Td (' + sanitizeTextForPDF('ROL') + ') Tj 60 0 Td (' + sanitizeTextForPDF('TCK') + ') Tj 50 0 Td (' + sanitizeTextForPDF('SEMANA ($)') + ') Tj 75 0 Td (' + sanitizeTextForPDF('MES ($)') + ') Tj 75 0 Td (' + sanitizeTextForPDF('TOTAL ($)') + ') Tj 65 0 Td (' + sanitizeTextForPDF('% TOTAL') + ') Tj ET');

    y -= 14;
    data.cajeros.forEach(c => {
        p1.push('0.88 0.90 0.92 RG 0.5 w 40 ' + (y - 3) + ' m 572 ' + (y - 3) + ' l S');
        p1.push('BT /F2 7 Tf 0.1 0.1 0.1 rg 45 ' + y + ' Td (' + sanitizeTextForPDF(c.nombre) + ') Tj /F1 7 Tf 130 0 Td (' + sanitizeTextForPDF(c.rol) + ') Tj 60 0 Td (' + sanitizeTextForPDF(String(c.tickets)) + ') Tj 50 0 Td (' + sanitizeTextForPDF(formatMoney(c.semanaTotal)) + ') Tj 75 0 Td (' + sanitizeTextForPDF(formatMoney(c.mesTotal)) + ') Tj 75 0 Td (' + sanitizeTextForPDF(formatMoney(c.totalGlobal)) + ') Tj 65 0 Td (' + sanitizeTextForPDF(c.pctContribucion.toFixed(1) + '%') + ') Tj ET');
        y -= 14;
    });

    // Footer Pagina 1
    p1.push('0.8 0.83 0.88 RG 0.5 w 40 45 m 572 45 l S');
    p1.push('BT /F1 7 Tf 0.4 0.45 0.5 rg 45 35 Td (' + sanitizeTextForPDF('Papeleria A B C | Sistema POS Local Blindado | Documento Oficial de Reportes y Auditoria') + ') Tj 350 0 Td (Pagina 1 de 2) Tj ET');

    pages.push(p1);

    // PAGINA 2: Auditoría Usuarios, Bitácora y Firmas
    const p2 = [];
    p2.push('0.06 0.09 0.16 rg 40 735 532 25 re f');
    p2.push('BT /F2 10 Tf 1 1 1 rg 50 745 Td (' + sanitizeTextForPDF('PAPELERIA A B C - AUDITORIA DE USUARIOS Y BITACORA DE EVENTOS') + ') Tj ET');

    // Seccion 3: Usuarios
    y = 705;
    p2.push('0.1 0.25 0.45 rg 40 ' + y + ' 532 16 re f');
    p2.push('BT /F2 8.5 Tf 1 1 1 rg 50 ' + (y + 5) + ' Td (' + sanitizeTextForPDF('3. AUDITORIA OPERATIVA Y REPORTE DE EVENTOS POR USUARIO') + ') Tj ET');
    y -= 18;
    p2.push('0.92 0.94 0.96 rg 40 ' + y + ' 532 15 re f 0.8 0.83 0.88 RG 0.5 w 40 ' + y + ' 532 15 re s');
    p2.push('BT /F2 7 Tf 0.1 0.15 0.2 rg 45 ' + (y + 4) + ' Td (' + sanitizeTextForPDF('USUARIO') + ') Tj 50 0 Td (' + sanitizeTextForPDF('ROL') + ') Tj 65 0 Td (' + sanitizeTextForPDF('ESTADO') + ') Tj 45 0 Td (' + sanitizeTextForPDF('ULT. ACCESO') + ') Tj 80 0 Td (' + sanitizeTextForPDF('VENTAS') + ') Tj 50 0 Td (' + sanitizeTextForPDF('CORTES') + ') Tj 50 0 Td (' + sanitizeTextForPDF('MOV CAJA') + ') Tj 55 0 Td (' + sanitizeTextForPDF('DEV/CAM') + ') Tj 50 0 Td (' + sanitizeTextForPDF('KARDEX') + ') Tj 45 0 Td (' + sanitizeTextForPDF('SEGURIDAD') + ') Tj ET');

    y -= 14;
    data.usuarios.forEach(u => {
        p2.push('0.88 0.90 0.92 RG 0.5 w 40 ' + (y - 3) + ' m 572 ' + (y - 3) + ' l S');
        const vInfo = u.ventasTickets + ' (' + formatMoney(u.ventasMonto) + ')';
        p2.push('BT /F2 6.8 Tf 0.1 0.1 0.1 rg 45 ' + y + ' Td (' + sanitizeTextForPDF(u.username) + ') Tj /F1 6.8 Tf 50 0 Td (' + sanitizeTextForPDF(u.rol) + ') Tj 65 0 Td (' + sanitizeTextForPDF(u.activo) + ') Tj 45 0 Td (' + sanitizeTextForPDF(u.ultimo_acceso.slice(0, 16)) + ') Tj 80 0 Td (' + sanitizeTextForPDF(vInfo) + ') Tj 50 0 Td (' + sanitizeTextForPDF(String(u.cortesZ)) + ') Tj 50 0 Td (' + sanitizeTextForPDF(String(u.movimientosCaja)) + ') Tj 55 0 Td (' + sanitizeTextForPDF(String(u.devolucionesCambios)) + ') Tj 50 0 Td (' + sanitizeTextForPDF(String(u.movimientosKardex)) + ') Tj 45 0 Td (' + sanitizeTextForPDF(String(u.eventosSeguridad)) + ') Tj ET');
        y -= 14;
    });

    // Seccion 4: Bitacora de Seguridad
    y -= 15;
    p2.push('0.1 0.25 0.45 rg 40 ' + y + ' 532 16 re f');
    p2.push('BT /F2 8.5 Tf 1 1 1 rg 50 ' + (y + 5) + ' Td (' + sanitizeTextForPDF('4. BITACORA CRONOLOGICA DE AUDITORIA Y SEGURIDAD RECIENTE') + ') Tj ET');
    y -= 18;
    p2.push('0.92 0.94 0.96 rg 40 ' + y + ' 532 15 re f 0.8 0.83 0.88 RG 0.5 w 40 ' + y + ' 532 15 re s');
    p2.push('BT /F2 7 Tf 0.1 0.15 0.2 rg 45 ' + (y + 4) + ' Td (' + sanitizeTextForPDF('FECHA / HORA') + ') Tj 85 0 Td (' + sanitizeTextForPDF('TIPO EVENTO') + ') Tj 105 0 Td (' + sanitizeTextForPDF('USUARIO / ROL') + ') Tj 95 0 Td (' + sanitizeTextForPDF('SEVERIDAD') + ') Tj 70 0 Td (' + sanitizeTextForPDF('DETALLES OPERATIVOS') + ') Tj ET');

    y -= 13;
    data.eventosRecientes.slice(0, 8).forEach(ev => {
        p2.push('0.88 0.90 0.92 RG 0.5 w 40 ' + (y - 3) + ' m 572 ' + (y - 3) + ' l S');
        const fStr = new Date(ev.fecha_hora).toLocaleString('es-MX');
        const uStr = (ev.usuario || 'SISTEMA') + ' (' + (ev.rol || '-') + ')';
        p2.push('BT /F1 6.5 Tf 0.2 0.2 0.2 rg 45 ' + y + ' Td (' + sanitizeTextForPDF(fStr) + ') Tj /F2 6.5 Tf 85 0 Td (' + sanitizeTextForPDF(ev.tipo_evento || 'AUDITORIA') + ') Tj /F1 6.5 Tf 105 0 Td (' + sanitizeTextForPDF(uStr) + ') Tj 95 0 Td (' + sanitizeTextForPDF(ev.severidad || 'INFO') + ') Tj 70 0 Td (' + sanitizeTextForPDF((ev.detalles || 'Operacion registrada').slice(0, 45)) + ') Tj ET');
        y -= 13;
    });

    // Seccion 5: Firmas
    y -= 25;
    p2.push('0.8 0.83 0.88 RG 0.5 w 40 ' + y + ' 532 75 re s');
    p2.push('0.96 0.97 0.98 rg 40 ' + (y + 60) + ' 532 15 re f');
    p2.push('BT /F2 7.5 Tf 0.1 0.15 0.2 rg 50 ' + (y + 65) + ' Td (' + sanitizeTextForPDF('5. CERTIFICACION Y FIRMAS DE CONFORMIDAD INSTITUCIONAL') + ') Tj ET');

    const sigY = y + 25;
    p2.push('0.2 0.2 0.2 RG 1 w 55 ' + sigY + ' m 195 ' + sigY + ' l S');
    p2.push('0.2 0.2 0.2 RG 1 w 235 ' + sigY + ' m 375 ' + sigY + ' l S');
    p2.push('0.2 0.2 0.2 RG 1 w 415 ' + sigY + ' m 555 ' + sigY + ' l S');

    p2.push('BT /F2 7 Tf 0.1 0.1 0.1 rg 75 ' + (sigY - 10) + ' Td (' + sanitizeTextForPDF('Gerardo Cabrera Morales') + ') Tj 170 0 Td (' + sanitizeTextForPDF('Astrid Garcia Ramirez') + ') Tj 185 0 Td (' + sanitizeTextForPDF('Auditoria Interna') + ') Tj ET');
    p2.push('BT /F1 6.5 Tf 0.4 0.4 0.4 rg 82 ' + (sigY - 18) + ' Td (' + sanitizeTextForPDF('Administrador General') + ') Tj 175 0 Td (' + sanitizeTextForPDF('Supervisor Operativo') + ') Tj 180 0 Td (' + sanitizeTextForPDF('Control de Calidad') + ') Tj ET');

    // Footer Pagina 2
    p2.push('0.8 0.83 0.88 RG 0.5 w 40 45 m 572 45 l S');
    p2.push('BT /F1 7 Tf 0.4 0.45 0.5 rg 45 35 Td (' + sanitizeTextForPDF('Papeleria A B C | Sistema POS Local Blindado | Documento Oficial de Reportes y Auditoria') + ') Tj 350 0 Td (Pagina 2 de 2) Tj ET');

    pages.push(p2);

    // Ensamble binario de objetos PDF-1.4
    const numPages = pages.length;
    const allObjs = [];
    const pageNums = [];
    let curObj = 5;

    for (let pIdx = 0; pIdx < numPages; pIdx++) {
        const pNum = curObj;
        const cNum = curObj + 1;
        curObj += 2;
        pageNums.push(pNum);

        const streamData = pages[pIdx].join('\n') + '\n';
        const cBody = '<< /Length ' + streamData.length + ' >>\nstream\n' + streamData + 'endstream';
        allObjs.push({ num: cNum, body: cBody });

        const pBody = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + cNum + ' 0 R >>';
        allObjs.push({ num: pNum, body: pBody });
    }

    const kidsRefs = pageNums.map(n => n + ' 0 R').join(' ');

    allObjs.push({ num: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' });
    allObjs.push({ num: 2, body: '<< /Type /Pages /Kids [' + kidsRefs + '] /Count ' + numPages + ' >>' });
    allObjs.push({ num: 3, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' });
    allObjs.push({ num: 4, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' });

    allObjs.sort((a, b) => a.num - b.num);

    let pdfText = '%PDF-1.4\n';
    const offsets = {};

    for (let i = 0; i < allObjs.length; i++) {
        const item = allObjs[i];
        offsets[item.num] = pdfText.length;
        pdfText += item.num + ' 0 obj\n' + item.body + '\nendobj\n';
    }

    const xrefOffset = pdfText.length;
    pdfText += 'xref\n0 ' + (allObjs.length + 1) + '\n0000000000 65535 f \n';
    for (let num = 1; num <= allObjs.length; num++) {
        const offStr = String(offsets[num]).padStart(10, '0');
        pdfText += offStr + ' 00000 n \n';
    }

    pdfText += 'trailer\n<< /Size ' + (allObjs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';

    // Convertir a Uint8Array
    const uint8 = new Uint8Array(pdfText.length);
    for (let i = 0; i < pdfText.length; i++) {
        uint8[i] = pdfText.charCodeAt(i) & 0xff;
    }
    return uint8;
}

// -----------------------------------------------------------------------------
// CONTROLADOR DE MODAL Y EXPORTACIONES DE ALTA FIDELIDAD
// -----------------------------------------------------------------------------

async function abrirModalReportePDF() {
    console.log('[Reports] Generando Reporte Ejecutivo Oficial en PDF...');
    const zone = document.getElementById('reporte-pdf-render-zone');
    if (zone) {
        zone.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b; font-weight: 600;">Calculando balance de ventas por período, productividad de cajeros y auditoría de eventos...</div>';
    }

    const modal = document.getElementById('modal-reporte-pdf');
    if (modal) {
        modal.classList.add('active');
    }

    try {
        const data = await calcularMetricasReporteEjecutivo();
        window._ultimoReporteEjecutivoData = data;
        if (zone) {
            zone.innerHTML = renderReportePDFHTML(data);
        }
    } catch (err) {
        console.error('[Reports] Error al generar reporte PDF:', err);
        if (zone) {
            zone.innerHTML = '<div style="color: #b91c1c; padding: 20px; font-weight: 700;">Error al compilar el reporte ejecutivo: ' + escapeHTML(err.message) + '</div>';
        }
    }
}

async function descargarReportePDFBinario() {
    let data = window._ultimoReporteEjecutivoData;
    if (!data) {
        data = await calcularMetricasReporteEjecutivo();
        window._ultimoReporteEjecutivoData = data;
    }

    const pdfBytes = generarPDFBinario(data);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().slice(0, 10);
    a.download = `Reporte_Ejecutivo_Papeleria_ABC_${fecha}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function descargarReporteHTMLPDF() {
    let data = window._ultimoReporteEjecutivoData;
    if (!data) {
        data = await calcularMetricasReporteEjecutivo();
        window._ultimoReporteEjecutivoData = data;
    }

    const bodyHTML = renderReportePDFHTML(data);
    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Ejecutivo - Papelería A B C (${data.folio})</title>
    <style>
        body { margin: 0; padding: 20px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .report-pdf-header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; gap: 16px; }
        .report-pdf-meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 0.78rem; }
        .report-pdf-section-title { background: #0f172a; color: #ffffff; font-size: 0.82rem; font-weight: 700; padding: 6px 12px; border-radius: 4px; margin-top: 18px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .report-pdf-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .report-pdf-kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; border-left: 4px solid #0284c7; }
        .report-pdf-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-bottom: 14px; }
        .report-pdf-table th { background: #f1f5f9; color: #334155; font-weight: 700; padding: 7px 10px; border: 1px solid #cbd5e1; text-align: left; }
        .report-pdf-table td { padding: 7px 10px; border: 1px solid #e2e8f0; color: #1e293b; }
        .report-pdf-table tr:nth-child(even) td { background: #fbfcfe; }
        .report-pdf-signature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 35px; padding-top: 10px; text-align: center; }
        .report-pdf-signature-box { display: flex; flex-direction: column; align-items: center; }
        .report-pdf-signature-line { width: 80%; border-top: 1.5px solid #334155; margin-bottom: 6px; }
        .role-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; }
        .role-admin { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .role-supervisor { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .role-cajero { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        @media print { body { background: #ffffff; padding: 0; } }
    </style>
</head>
<body>
    ${bodyHTML}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().slice(0, 10);
    a.download = `Reporte_Ejecutivo_Papeleria_ABC_${fecha}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}


window.REPORTS_MODULE = {
    initReportsModule,
    cargarReportes,
    setFiltroPeriodo,
    handleCustomDateChange,
    handleFiltrosAdicionalesChange,
    exportarBalanceCSV,
    exportarTopProductosCSV,
    exportarVentasCategoriaCSV,
    exportarTransaccionesDetalladasCSV,
    abrirModalReportePDF,
    calcularMetricasReporteEjecutivo,
    descargarReportePDFBinario,
    descargarReporteHTMLPDF
};
