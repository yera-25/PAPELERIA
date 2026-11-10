/**
 * stock_movements.js - Control de Entradas de Mercancía, Mermas y Kardex Auditable
 * Sprint 1 - Módulo de Inventario | Papelería A B C (Entregable Unificado)
 */

async function initMovementsModule() {
    await populateProductSelectors();
    await populateProviderSelector();
    await reloadKardexTable();
    setupKardexFilters();
}

// Llenar selectores de productos para los formularios de entradas y mermas
async function populateProductSelectors() {
    const productos = await window.POS_DB.getProductosCompletos();
    const selectEntrada = document.getElementById('entrada-producto-select');
    const selectMerma = document.getElementById('merma-producto-select');
    const selectKardex = document.getElementById('kardex-producto-filter');

    const optionsHtml = '<option value="">-- Seleccionar Artículo --</option>' +
        productos.filter(p => !p.es_servicio).map(p =>
            `<option value="${p.id_producto}" data-stock="${p.stock_actual}" data-costo="${p.precio_compra}" data-unidad="${p.unidad_nombre}">
                ${p.nombre} (Stock: ${p.stock_actual} ${p.unidad_nombre})
            </option>`
        ).join('');

    if (selectEntrada) selectEntrada.innerHTML = optionsHtml;
    if (selectMerma) selectMerma.innerHTML = optionsHtml;

    if (selectKardex) {
        selectKardex.innerHTML = '<option value="">Todos los Productos</option>' +
            productos.map(p => `<option value="${p.id_producto}">${p.nombre}</option>`).join('');
    }
}

// Llenar selector de proveedores
async function populateProviderSelector() {
    const provs = await window.POS_DB.getProveedores();
    const select = document.getElementById('entrada-proveedor-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>' +
        provs.map(pr => `<option value="${pr.nombre}">${pr.nombre}</option>`).join('');
}

// -------------------------------------------------------------
// ENTRADAS DE MERCANCÍA / COMPRAS A PROVEEDOR
// -------------------------------------------------------------

function onEntradaProductChange() {
    const select = document.getElementById('entrada-producto-select');
    const selectedOption = select.options[select.selectedIndex];
    const costoInput = document.getElementById('entrada-costo-unitario');
    const unidadDisplay = document.getElementById('entrada-unidad-display');

    if (selectedOption && selectedOption.value) {
        const costo = parseFloat(selectedOption.getAttribute('data-costo')) || 0;
        const unidad = selectedOption.getAttribute('data-unidad') || 'pza';
        if (costoInput) costoInput.value = costo.toFixed(2);
        if (unidadDisplay) unidadDisplay.textContent = unidad;
        calcularSubtotalEntrada();
    } else {
        if (unidadDisplay) unidadDisplay.textContent = '';
    }
}

function calcularSubtotalEntrada() {
    const cantInput = document.getElementById('entrada-cantidad');
    const costoInput = document.getElementById('entrada-costo-unitario');
    const subtotalDisplay = document.getElementById('entrada-subtotal-display');

    const cant = parseFloat(cantInput.value) || 0;
    const costo = parseFloat(costoInput.value) || 0;
    const subtotal = cant * costo;

    if (subtotalDisplay) {
        subtotalDisplay.textContent = `$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    }
}

async function handleEntradaFormSubmit(e) {
    if (e) e.preventDefault();

    const selectProd = document.getElementById('entrada-producto-select');
    const idProducto = parseInt(selectProd.value);
    const cantidad = parseFloat(document.getElementById('entrada-cantidad').value);
    const costoUnitario = parseFloat(document.getElementById('entrada-costo-unitario').value);
    const proveedor = document.getElementById('entrada-proveedor-select').value;
    const folioFactura = document.getElementById('entrada-folio-factura').value.trim();

    if (!idProducto) {
        alert('Debe seleccionar el producto a ingresar.');
        return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        alert('La cantidad a ingresar debe ser mayor a 0.');
        return;
    }
    if (isNaN(costoUnitario) || costoUnitario < 0) {
        alert('El costo unitario debe ser un valor no negativo.');
        return;
    }

    try {
        await window.POS_DB.registrarEntradaMercancia({
            id_producto: idProducto,
            cantidad: cantidad,
            costo_unitario: costoUnitario,
            proveedor_nombre: proveedor || 'Distribuidora Papelera',
            folio_factura: folioFactura || 'Remisión S/F',
            responsable: 'Gerardo Cabrera Morales'
        });

        document.getElementById('form-entrada-mercancia').reset();
        document.getElementById('entrada-subtotal-display').textContent = '$0.00 MXN';

        window.INVENTORY_MODULE.showToast(`Entrada registrada exitosamente (+${cantidad} existencias)`, 'success');
        await window.INVENTORY_MODULE.reloadCatalogTable();
        await populateProductSelectors();
        await reloadKardexTable();
        if (window.POS_MODULE) await window.POS_MODULE.reloadCatalog();
    } catch (err) {
        alert('Error al registrar entrada: ' + err.message);
    }
}

// -------------------------------------------------------------
// REGISTRO DE MERMAS Y DESINCORPORACIONES
// -------------------------------------------------------------

function onMermaProductChange() {
    const select = document.getElementById('merma-producto-select');
    const selectedOption = select.options[select.selectedIndex];
    const stockDisplay = document.getElementById('merma-stock-disponible');
    const cantInput = document.getElementById('merma-cantidad');

    if (selectedOption && selectedOption.value) {
        const stock = parseFloat(selectedOption.getAttribute('data-stock')) || 0;
        const unidad = selectedOption.getAttribute('data-unidad') || 'pzas';
        if (stockDisplay) stockDisplay.textContent = `${stock} ${unidad}`;
        if (cantInput) cantInput.max = stock;
    } else {
        if (stockDisplay) stockDisplay.textContent = '0';
    }
}

async function handleMermaFormSubmit(e) {
    if (e) e.preventDefault();

    const selectProd = document.getElementById('merma-producto-select');
    const idProducto = parseInt(selectProd.value);
    const cantidad = parseFloat(document.getElementById('merma-cantidad').value);
    const motivo = document.getElementById('merma-motivo-select').value;
    const justificacion = document.getElementById('merma-justificacion').value.trim();
    const responsable = document.getElementById('merma-responsable').value.trim();

    if (!idProducto) {
        alert('Debe seleccionar el artículo que presenta merma.');
        return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        alert('La cantidad a dar de baja debe ser mayor a 0.');
        return;
    }
    if (!motivo) {
        alert('Debe especificar el motivo de la merma.');
        return;
    }
    if (!justificacion) {
        alert('Debe ingresar una breve justificación técnica o causa del daño.');
        return;
    }

    try {
        await window.POS_DB.registrarMerma({
            id_producto: idProducto,
            cantidad: cantidad,
            motivo: motivo,
            justificacion: justificacion,
            responsable: responsable || 'Encargado de Mostrador'
        });

        document.getElementById('form-merma').reset();
        document.getElementById('merma-stock-disponible').textContent = '0';

        window.INVENTORY_MODULE.showToast(`Merma registrada: -${cantidad} piezas desincorporadas`, 'warning');
        await window.INVENTORY_MODULE.reloadCatalogTable();
        await populateProductSelectors();
        await reloadKardexTable();
        if (window.POS_MODULE) await window.POS_MODULE.reloadCatalog();
    } catch (err) {
        alert('Error al registrar merma: ' + err.message);
    }
}

// -------------------------------------------------------------
// HISTORIAL KARDEX AUDITABLE (RF-07)
// -------------------------------------------------------------

async function reloadKardexTable() {
    const prodFiltro = document.getElementById('kardex-producto-filter')?.value;
    const tipoFiltro = document.getElementById('kardex-tipo-filter')?.value;

    let log = await window.POS_DB.getHistorialKardex(prodFiltro);

    if (tipoFiltro) {
        log = log.filter(m => m.tipo_movimiento === tipoFiltro);
    }

    renderKardexTable(log);
}

function renderKardexTable(movimientos) {
    const tbody = document.getElementById('kardex-full-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron movimientos registrados para este criterio de búsqueda.</td></tr>';
        return;
    }

    movimientos.forEach(m => {
        const fecha = new Date(m.fecha_hora).toLocaleString('es-MX', {
            dateStyle: 'short',
            timeStyle: 'short'
        });

        let badgeClass = 'kardex-badge-neutral';
        if (m.tipo_movimiento.includes('ENTRADA') || m.tipo_movimiento.includes('COMPRA') || m.tipo_movimiento.includes('ALTA')) {
            badgeClass = 'kardex-badge-in';
        } else if (m.tipo_movimiento.includes('VENTA') || m.tipo_movimiento.includes('MERMA') || m.tipo_movimiento.includes('SALIDA')) {
            badgeClass = 'kardex-badge-out';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><small class="font-mono">${fecha}</small></td>
            <td><b>${escapeHTML(m.nombre_producto)}</b></td>
            <td><span class="badge-tag ${badgeClass}">${m.tipo_movimiento}</span></td>
            <td class="text-center font-bold">${m.cantidad}</td>
            <td class="text-center text-muted">${m.stock_anterior}</td>
            <td class="text-center font-bold text-navy">${m.stock_posterior}</td>
            <td><small class="text-muted">${escapeHTML(m.referencia || '—')}</small></td>
        `;
        tbody.appendChild(tr);
    });
}

function setupKardexFilters() {
    const prodSelect = document.getElementById('kardex-producto-filter');
    const tipoSelect = document.getElementById('kardex-tipo-filter');

    if (prodSelect) prodSelect.addEventListener('change', reloadKardexTable);
    if (tipoSelect) tipoSelect.addEventListener('change', reloadKardexTable);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

window.MOVEMENTS_MODULE = {
    initMovementsModule,
    populateProductSelectors,
    onEntradaProductChange,
    calcularSubtotalEntrada,
    handleEntradaFormSubmit,
    onMermaProductChange,
    handleMermaFormSubmit,
    reloadKardexTable
};
