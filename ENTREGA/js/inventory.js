/**
 * inventory.js - Gestión del Catálogo de Productos y Validaciones (Sprint 1)
 * Papelería A B C — Entregable Unificado
 */

let catalogoLocal = [];

async function initInventoryModule() {
    await reloadCatalogTable();
    setupProductFilterListeners();
    populateSelectOptions();
}

// Cargar tabla con opciones y filtros
async function reloadCatalogTable() {
    catalogoLocal = await window.POS_DB.getProductosCompletos();

    // Salvaguarda reactiva: si el catálogo viene vacío, forzar sincronización garantizada de 160 artículos
    if ((!catalogoLocal || catalogoLocal.length === 0) && window.POS_DB.recargarCatalogoCompleto160) {
        console.warn('[Inventario] Catálogo vacío detectado. Sincronizando 160 artículos automáticamente...');
        await window.POS_DB.recargarCatalogoCompleto160(true);
        catalogoLocal = await window.POS_DB.getProductosCompletos();
    }

    renderProductsTable(catalogoLocal);
    updateInventoryMetrics(catalogoLocal);
}

// Renderizar la tabla de productos
function renderProductsTable(productos) {
    const tbody = document.getElementById('products-table-tbody');
    const emptyState = document.getElementById('products-empty-state');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    tbody.innerHTML = '';

    productos.forEach(p => {
        const tr = document.createElement('tr');
        if (p.esta_bajo_stock) tr.className = 'row-danger-stock';

        const puedeGestionar = !window.AUTH_MODULE || window.AUTH_MODULE.canManageProducts();
        tr.innerHTML = `
            <td>
                <code>${p.codigo_barras}</code>
                <div class="product-sku-sub">${p.sku}</div>
            </td>
            <td>
                <div class="product-title-cell">${escapeHTML(p.nombre)}</div>
                <div class="product-desc-sub">${escapeHTML(p.descripcion || 'Sin descripción')}</div>
            </td>
            <td><span class="badge-tag badge-cat">${escapeHTML(p.categoria_nombre)}</span></td>
            <td><span class="badge-tag badge-brand">${escapeHTML(p.marca_nombre)}</span></td>
            <td class="text-right text-muted td-costo-compra" style="${puedeGestionar ? '' : 'display: none;'}">$${Number(p.precio_compra || 0).toFixed(2)}</td>
            <td class="text-right font-bold text-navy">$${Number(p.precio_venta_menudeo || 0).toFixed(2)}</td>
            <td class="text-center">
                <span class="stock-pill ${p.esta_bajo_stock ? 'stock-pill-low' : 'stock-pill-ok'}">
                    ${p.es_servicio ? 'Infinito' : `${p.stock_actual} ${p.unidad_nombre}`}
                </span>
                ${p.esta_bajo_stock ? `<div class="badge-alert-min">Mínimo: ${p.stock_minimo}</div>` : ''}
            </td>
            <td class="text-center">
                ${puedeGestionar ? `
                    <button class="btn-table-action btn-edit" title="Editar producto" onclick="window.INVENTORY_MODULE.openProductModal(${p.id_producto})">Editar</button>
                    <button class="btn-table-action btn-delete" title="Eliminar producto" onclick="window.INVENTORY_MODULE.confirmDeleteProduct(${p.id_producto}, '${escapeHTML(p.nombre)}')">Eliminar</button>
                ` : `
                    <span class="badge-tag" style="background: #f1f5f9; color: #64748b; font-size: 0.72rem; padding: 3px 6px; border-radius: 4px;">Solo Consulta</span>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Actualizar métricas del inventario en el dashboard superior
function updateInventoryMetrics(productos) {
    const totalProdEl = document.getElementById('stat-total-products');
    const totalValueEl = document.getElementById('stat-total-value');
    const lowStockEl = document.getElementById('stat-low-stock-count');
    const totalCatsEl = document.getElementById('stat-total-categories');

    const totalProductos = productos.length;
    const valorInventario = productos.reduce((sum, p) => sum + (p.es_servicio ? 0 : p.stock_actual * p.precio_compra), 0);
    const bajoStockCount = productos.filter(p => p.esta_bajo_stock).length;

    const uniqueCats = new Set(productos.map(p => p.id_categoria)).size;

    if (totalProdEl) totalProdEl.textContent = totalProductos;
    if (totalValueEl) totalValueEl.textContent = `$${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
    if (lowStockEl) lowStockEl.textContent = bajoStockCount;
    if (totalCatsEl) totalCatsEl.textContent = uniqueCats;
}

// Configurar escuchas de filtros
function setupProductFilterListeners() {
    const searchInput = document.getElementById('catalog-search-input');
    const catFilter = document.getElementById('catalog-category-filter');
    const brandFilter = document.getElementById('catalog-brand-filter');
    const lowStockCheck = document.getElementById('catalog-low-stock-only');

    const applyFilters = () => {
        const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
        const catVal = (catFilter ? catFilter.value : '');
        const brandVal = (brandFilter ? brandFilter.value : '');
        const onlyLow = (lowStockCheck ? lowStockCheck.checked : false);

        const filtrados = catalogoLocal.filter(p => {
            const matchesQuery = p.nombre.toLowerCase().includes(query) ||
                                 p.codigo_barras.includes(query) ||
                                 p.sku.toLowerCase().includes(query);
            const matchesCat = catVal === '' || p.id_categoria.toString() === catVal;
            const matchesBrand = brandVal === '' || p.id_marca.toString() === brandVal;
            const matchesLowStock = !onlyLow || p.esta_bajo_stock;

            return matchesQuery && matchesCat && matchesBrand && matchesLowStock;
        });

        renderProductsTable(filtrados);
    };

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (catFilter) catFilter.addEventListener('change', applyFilters);
    if (brandFilter) brandFilter.addEventListener('change', applyFilters);
    if (lowStockCheck) lowStockCheck.addEventListener('change', applyFilters);
}

// Llenar selectores desplegables con marcas, categorías y unidades
async function populateSelectOptions() {
    const cats = await window.POS_DB.getCategorias();
    const marcas = await window.POS_DB.getMarcas();
    const unidades = await window.POS_DB.getUnidades();

    // Filtros de tabla
    const filterCat = document.getElementById('catalog-category-filter');
    const filterBrand = document.getElementById('catalog-brand-filter');

    if (filterCat) {
        filterCat.innerHTML = '<option value="">Todas las Categorías</option>';
        cats.forEach(c => filterCat.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`);
    }

    if (filterBrand) {
        filterBrand.innerHTML = '<option value="">Todas las Marcas</option>';
        marcas.forEach(m => filterBrand.innerHTML += `<option value="${m.id_marca}">${m.nombre}</option>`);
    }

    // Selectores del modal de producto
    const modalCat = document.getElementById('prod-categoria');
    const modalBrand = document.getElementById('prod-marca');
    const modalUnit = document.getElementById('prod-unidad');

    if (modalCat) {
        modalCat.innerHTML = '<option value="">-- Seleccionar Categoría --</option>';
        cats.forEach(c => modalCat.innerHTML += `<option value="${c.id_categoria}">${c.nombre}</option>`);
    }

    if (modalBrand) {
        modalBrand.innerHTML = '<option value="">-- Seleccionar Marca --</option>';
        marcas.forEach(m => modalBrand.innerHTML += `<option value="${m.id_marca}">${m.nombre}</option>`);
    }

    if (modalUnit) {
        modalUnit.innerHTML = '<option value="">-- Seleccionar Unidad --</option>';
        unidades.forEach(u => modalUnit.innerHTML += `<option value="${u.id_unidad}">${u.nombre} (${u.clave})</option>`);
    }
}

// -------------------------------------------------------------
// MODAL DE ALTA Y EDICIÓN DE PRODUCTO CON VALIDACIONES
// -------------------------------------------------------------

function openProductModal(idProducto = null) {
    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageProducts()) {
        showToast('Acceso restringido: Los cajeros no tienen autorización para dar de alta ni editar productos. Función reservada para el Supervisor.', 'error');
        return;
    }
    const modal = document.getElementById('modal-product-form');
    const modalTitle = document.getElementById('modal-product-title');
    const form = document.getElementById('form-product');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('prod-id').value = '';

    if (idProducto) {
        const prod = catalogoLocal.find(p => p.id_producto === idProducto);
        if (!prod) return;

        modalTitle.textContent = `Editar Artículo: ${prod.nombre}`;
        document.getElementById('prod-id').value = prod.id_producto;
        document.getElementById('prod-barcode').value = prod.codigo_barras;
        document.getElementById('prod-sku').value = prod.sku;
        document.getElementById('prod-nombre').value = prod.nombre;
        document.getElementById('prod-categoria').value = prod.id_categoria;
        document.getElementById('prod-marca').value = prod.id_marca;
        document.getElementById('prod-unidad').value = prod.id_unidad;
        document.getElementById('prod-precio-compra').value = prod.precio_compra;
        document.getElementById('prod-precio-menudeo').value = prod.precio_venta_menudeo;
        document.getElementById('prod-precio-mayoreo').value = prod.precio_venta_mayoreo || '';
        document.getElementById('prod-stock-actual').value = prod.stock_actual;
        document.getElementById('prod-stock-minimo').value = prod.stock_minimo;
        document.getElementById('prod-es-servicio').checked = prod.es_servicio || false;
        document.getElementById('prod-permite-desglose').checked = prod.permite_desglose || false;
        document.getElementById('prod-descripcion').value = prod.descripcion || '';
    } else {
        modalTitle.textContent = 'Nuevo Artículo para Papelería A B C';
        document.getElementById('prod-stock-actual').value = '10';
        document.getElementById('prod-stock-minimo').value = '3';
    }

    modal.classList.add('active');
}

// Generador de Código de Barras EAN-13 Simulado para Productos Sueltos
function generateBarcodeEAN13() {
    const prefix = '7501000'; // Prefijo mexicano común
    const randomBody = Math.floor(100000 + Math.random() * 900000).toString();
    const barcodeInput = document.getElementById('prod-barcode');
    if (barcodeInput) {
        barcodeInput.value = prefix + randomBody.slice(0, 5) + '0';
    }
}

// Guardar producto con validaciones de integridad técnica y de negocio
async function handleProductFormSubmit(e) {
    if (e) e.preventDefault();

    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageProducts()) {
        alert('Acceso restringido: Los cajeros no pueden dar de alta ni modificar productos. Operación exclusiva de Supervisor.');
        return;
    }

    const id = document.getElementById('prod-id').value;
    const barcode = document.getElementById('prod-barcode').value.trim();
    const sku = document.getElementById('prod-sku').value.trim().toUpperCase();
    const nombre = document.getElementById('prod-nombre').value.trim();
    const idCat = parseInt(document.getElementById('prod-categoria').value);
    const idMarca = parseInt(document.getElementById('prod-marca').value);
    const idUnidad = parseInt(document.getElementById('prod-unidad').value);
    const precioCompra = parseFloat(document.getElementById('prod-precio-compra').value);
    const precioMenudeo = parseFloat(document.getElementById('prod-precio-menudeo').value);
    const precioMayoreo = parseFloat(document.getElementById('prod-precio-mayoreo').value) || precioMenudeo;
    const stockActual = parseFloat(document.getElementById('prod-stock-actual').value);
    const stockMinimo = parseFloat(document.getElementById('prod-stock-minimo').value);
    const esServicio = document.getElementById('prod-es-servicio').checked;
    const permiteDesglose = document.getElementById('prod-permite-desglose').checked;
    const descripcion = document.getElementById('prod-descripcion').value.trim();

    // 1. Validaciones de presencia
    if (!barcode) { alert('El código de barras es obligatorio.'); return; }
    if (!sku) { alert('El código interno SKU es obligatorio.'); return; }
    if (!nombre) { alert('El nombre comercial del producto es obligatorio.'); return; }
    if (!idCat) { alert('Debe seleccionar una categoría.'); return; }
    if (!idMarca) { alert('Debe seleccionar una marca.'); return; }
    if (!idUnidad) { alert('Debe seleccionar una unidad de medida.'); return; }

    // 2. Validaciones de unicidad en código de barras y SKU
    const idNum = id ? parseInt(id) : null;
    const duplicateBarcode = catalogoLocal.find(p => p.codigo_barras === barcode && p.id_producto !== idNum);
    if (duplicateBarcode) {
        alert(`Ya existe otro artículo con el código de barras "${barcode}":\n(${duplicateBarcode.nombre})`);
        return;
    }

    const duplicateSku = catalogoLocal.find(p => p.sku === sku && p.id_producto !== idNum);
    if (duplicateSku) {
        alert(`Ya existe otro artículo con el SKU "${sku}":\n(${duplicateSku.nombre})`);
        return;
    }

    // 3. Validaciones numéricas de negocio
    if (isNaN(precioCompra) || precioCompra < 0) {
        alert('El precio de compra (costo) debe ser un valor no negativo.');
        return;
    }
    if (isNaN(precioMenudeo) || precioMenudeo <= 0) {
        alert('El precio de venta menudeo debe ser mayor a 0.');
        return;
    }
    if (!esServicio && precioMenudeo < precioCompra) {
        if (!confirm('Advertencia: El precio de venta al menudeo es menor al costo de adquisición. ¿Desea guardarlo de todas formas?')) {
            return;
        }
    }
    if (isNaN(stockActual) || stockActual < 0) {
        alert('El stock actual no puede ser un valor negativo.');
        return;
    }
    if (isNaN(stockMinimo) || stockMinimo < 0) {
        alert('El umbral de stock mínimo debe ser no negativo.');
        return;
    }

    const productoData = {
        codigo_barras: barcode,
        sku: sku,
        nombre: nombre,
        id_categoria: idCat,
        id_marca: idMarca,
        id_unidad: idUnidad,
        precio_compra: precioCompra,
        precio_venta_menudeo: precioMenudeo,
        precio_venta_mayoreo: precioMayoreo,
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        es_servicio: esServicio,
        permite_desglose: permiteDesglose,
        descripcion: descripcion
    };

    if (idNum) {
        productoData.id_producto = idNum;
    }

    try {
        await window.POS_DB.guardarProducto(productoData);
        closeAllModals();
        showToast(idNum ? 'Artículo actualizado correctamente' : 'Nuevo artículo registrado con éxito', 'success');
        await reloadCatalogTable();
        if (window.MOVEMENTS_MODULE) await window.MOVEMENTS_MODULE.populateProductSelectors();
        if (window.POS_MODULE) await window.POS_MODULE.reloadCatalog();
    } catch (err) {
        console.error(err);
        alert('Error al guardar en base de datos: ' + err.message);
    }
}

// Eliminar producto con confirmación
async function confirmDeleteProduct(idProducto, nombre) {
    if (confirm(`¿Confirma eliminar definitivamente el artículo "${nombre}" del catálogo?\n\nEsta acción no se puede deshacer.`)) {
        try {
            await window.POS_DB.eliminarProducto(idProducto);
            showToast('Artículo eliminado del catálogo', 'info');
            await reloadCatalogTable();
            if (window.POS_MODULE) await window.POS_MODULE.reloadCatalog();
        } catch (err) {
            alert('Error al eliminar producto: ' + err.message);
        }
    }
}

// Utilerías
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

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function showToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${tipo}`;
    toast.innerHTML = `<span>${escapeHTML(mensaje)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

window.INVENTORY_MODULE = {
    initInventoryModule,
    getCatalogoLocal: () => catalogoLocal,
    renderProductsTable,
    reloadCatalogTable,
    openProductModal,
    generateBarcodeEAN13,
    handleProductFormSubmit,
    confirmDeleteProduct,
    closeAllModals,
    showToast
};
