/**
 * pos.js - Controlador Avanzado de Punto de Venta (Mostrador) para "Papelería A B C"
 * Entregable Oficial de la Fase 5: Sprint 2 (Módulo de Ventas Operativo)
 * 
 * Capacidades Principales (Sprint 2):
 * - Búsqueda predictiva in-memory y soporte de lector láser de código de barras (<5ms)
 * - 5 Carritos de compra simultáneos / ventas en espera (RF-02)
 * - Detección y aplicación de Precios de Mayoreo por volumen o manual
 * - Cálculo automático de Descuentos (0%, 5%, 10%, 15% o personalizado)
 * - Modal de cobro con Botones de Denominación Rápida de Efectivo ($50, $100, $200, $500, $1000, Exacto)
 * - Emisión e impresión de Ticket Térmico estándar 58mm/80mm con Logotipo y Datos Fiscales de Papelería A B C
 * - Historial de ventas del turno y reimpresión de tickets
 * - Afectación inmediata de stock y asiento en Kárdex auditable (RF-07)
 * - Atajos de teclado ergonómicos para mostrador (F1, F2, F4, F8, F10, Esc)
 */

const MAX_CARTS = 5;
let carts = Array.from({ length: MAX_CARTS }, () => []);
let cartDiscounts = Array.from({ length: MAX_CARTS }, () => 0); // Descuento porcentual por carrito
let activeCartIndex = 0;
let currentProductsCatalog = [];

// Inicializar Módulo POS
async function initPOS() {
    await reloadCatalog();
    renderCartTabs();
    renderActiveCart();
    setupEventListeners();
    setupKeyboardShortcuts();
}

// Cargar catálogo en memoria para búsqueda ultra-rápida (<5ms)
async function reloadCatalog() {
    currentProductsCatalog = await window.POS_DB.getProductosCompletos();

    // Salvaguarda reactiva: si el catálogo viene vacío, forzar sincronización de 160 artículos
    if ((!currentProductsCatalog || currentProductsCatalog.length === 0) && window.POS_DB.recargarCatalogoCompleto160) {
        console.warn('[POS] Catálogo no detectado. Forzando sincronización de 160 productos...');
        await window.POS_DB.recargarCatalogoCompleto160(true);
        currentProductsCatalog = await window.POS_DB.getProductosCompletos();
    }

    renderQuickProductsGrid(currentProductsCatalog);
}

// Renderizar las pestañas de los 5 carritos simultáneos
function renderCartTabs() {
    const tabsContainer = document.getElementById('cart-tabs-container');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    carts.forEach((cart, idx) => {
        const itemCount = cart.reduce((acc, it) => acc + it.cantidad, 0);
        const bruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
        const descPct = cartDiscounts[idx] || 0;
        const neto = bruto * (1 - descPct / 100);

        const tabBtn = document.createElement('button');
        tabBtn.className = `cart-tab-btn ${idx === activeCartIndex ? 'active' : ''} ${itemCount > 0 ? 'has-items' : ''}`;
        tabBtn.innerHTML = `
            <span class="tab-icon">Carrito ${idx + 1}</span>
            <span class="tab-badge">${itemCount}</span>
            ${itemCount > 0 ? `<span class="tab-total">$${neto.toFixed(2)}</span>` : ''}
        `;
        tabBtn.onclick = () => switchCart(idx);
        tabsContainer.appendChild(tabBtn);
    });
}

// Cambiar de carrito activo
function switchCart(index) {
    if (index >= 0 && index < MAX_CARTS) {
        activeCartIndex = index;
        renderCartTabs();
        renderActiveCart();
        focusScanner();
    }
}

// Alternar secuencialmente al siguiente carrito (Atajo F2 en POS)
function cycleNextCart() {
    const nextIdx = (activeCartIndex + 1) % MAX_CARTS;
    switchCart(nextIdx);
    showToast(`Cambiado a Carrito ${nextIdx + 1}`, 'info');
}

// Agregar producto al carrito activo con soporte de Mayoreo
function addToCart(producto, cantidad = 1) {
    const cart = carts[activeCartIndex];
    const existingIndex = cart.findIndex(it => it.id_producto === producto.id_producto);

    // Validar disponibilidad si no es servicio
    if (!producto.es_servicio) {
        const cantActualEnCarrito = existingIndex >= 0 ? cart[existingIndex].cantidad : 0;
        if (cantActualEnCarrito + cantidad > producto.stock_actual) {
            showToast(`Stock insuficiente de "${producto.nombre}". Existencia: ${producto.stock_actual}`, 'warning');
            return;
        }
    }

    if (existingIndex >= 0) {
        cart[existingIndex].cantidad += cantidad;
        // Aplicar mayoreo si alcanza volumen (>=5 piezas) y tiene precio mayoreo
        if (cart[existingIndex].precio_mayoreo && cart[existingIndex].cantidad >= 5 && !cart[existingIndex].mayoreo_manual_override) {
            cart[existingIndex].es_mayoreo = true;
            cart[existingIndex].precio_unitario = cart[existingIndex].precio_mayoreo;
        }
        cart[existingIndex].subtotal = cart[existingIndex].cantidad * cart[existingIndex].precio_unitario;
    } else {
        const tieneMayoreo = Boolean(producto.precio_venta_mayoreo && producto.precio_venta_mayoreo > 0);
        const aplicaMayoreo = tieneMayoreo && cantidad >= 5;
        const precioUnitario = aplicaMayoreo ? producto.precio_venta_mayoreo : producto.precio_venta_menudeo;

        cart.push({
            id_producto: producto.id_producto,
            codigo_barras: producto.codigo_barras,
            sku: producto.sku,
            nombre: producto.nombre,
            unidad: producto.unidad_nombre || 'Pza',
            precio_menudeo: producto.precio_venta_menudeo,
            precio_mayoreo: tieneMayoreo ? producto.precio_venta_mayoreo : null,
            es_mayoreo: aplicaMayoreo,
            mayoreo_manual_override: false,
            precio_unitario: precioUnitario,
            cantidad: cantidad,
            subtotal: precioUnitario * cantidad,
            es_servicio: producto.es_servicio
        });
    }

    renderCartTabs();
    renderActiveCart();
}

// Alternar manualmente entre precio de mayoreo y menudeo para un renglón
function toggleItemMayoreo(index) {
    const cart = carts[activeCartIndex];
    if (!cart[index] || !cart[index].precio_mayoreo) return;

    cart[index].es_mayoreo = !cart[index].es_mayoreo;
    cart[index].mayoreo_manual_override = true;
    cart[index].precio_unitario = cart[index].es_mayoreo ? cart[index].precio_mayoreo : cart[index].precio_menudeo;
    cart[index].subtotal = cart[index].cantidad * cart[index].precio_unitario;

    renderCartTabs();
    renderActiveCart();
    showToast(cart[index].es_mayoreo ? 'Precio Mayoreo activado' : 'Precio Menudeo restaurado', 'info');
}

// Renderizar la tabla del carrito activo
function renderActiveCart() {
    const tbody = document.getElementById('cart-items-tbody');
    const emptyState = document.getElementById('cart-empty-state');
    const tableContainer = document.getElementById('cart-table-wrapper');
    const cart = carts[activeCartIndex];

    if (!tbody) return;

    if (cart.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        tbody.innerHTML = '';
        updateTotalsDisplay(0, 0, 0, 0, 0);
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'block';

    tbody.innerHTML = '';
    let totalBruto = 0;

    cart.forEach((item, index) => {
        totalBruto += item.subtotal;
        const tr = document.createElement('tr');
        tr.className = item.es_servicio ? 'service-item-row' : '';

        const badgeMayoreo = item.precio_mayoreo ? `
            <button type="button" class="btn-mayoreo-toggle ${item.es_mayoreo ? 'active' : ''}" 
                onclick="window.POS_MODULE.toggleItemMayoreo(${index})" 
                title="Alternar Precio Mayoreo: $${item.precio_mayoreo.toFixed(2)} / Menudeo: $${item.precio_menudeo.toFixed(2)}">
                ${item.es_mayoreo ? 'MAYOREO' : 'Menudeo'}
            </button>
        ` : '';

        tr.innerHTML = `
            <td>
                <div class="cart-item-title">${escapeHTML(item.nombre)}</div>
                <div class="cart-item-meta">
                    <span>${item.sku} | ${item.es_servicio ? 'Servicio' : item.unidad}</span>
                    ${badgeMayoreo}
                </div>
            </td>
            <td class="text-center">
                <div class="qty-control">
                    <button type="button" class="btn-qty" onclick="window.POS_MODULE.updateItemQty(${index}, -1)">-</button>
                    <span class="qty-val">${item.cantidad}</span>
                    <button type="button" class="btn-qty" onclick="window.POS_MODULE.updateItemQty(${index}, 1)">+</button>
                </div>
            </td>
            <td class="text-right">$${item.precio_unitario.toFixed(2)}</td>
            <td class="text-right font-bold text-navy">$${item.subtotal.toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn-del-item" title="Eliminar renglón" onclick="window.POS_MODULE.removeItemFromCart(${index})">&times;</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Descuento porcentual aplicado al carrito activo
    const descPct = cartDiscounts[activeCartIndex] || 0;
    const montoDescuento = totalBruto * (descPct / 100);
    const totalNeto = Math.max(0, totalBruto - montoDescuento);

    // Desglose con IVA 16% incluido
    const subtotal = totalNeto / 1.16;
    const iva = totalNeto - subtotal;
    updateTotalsDisplay(subtotal, iva, totalNeto, montoDescuento, descPct);
}

// Modificar cantidad de un renglón
function updateItemQty(index, delta) {
    const cart = carts[activeCartIndex];
    if (!cart[index]) return;

    const nuevoValor = cart[index].cantidad + delta;
    if (nuevoValor <= 0) {
        removeItemFromCart(index);
        return;
    }

    // Validar stock si es físico
    if (!cart[index].es_servicio) {
        const prodMaestro = currentProductsCatalog.find(p => p.id_producto === cart[index].id_producto);
        if (prodMaestro && nuevoValor > prodMaestro.stock_actual) {
            showToast(`Máximo stock disponible: ${prodMaestro.stock_actual}`, 'warning');
            return;
        }
    }

    cart[index].cantidad = nuevoValor;

    // Actualizar automáticamente mayoreo si superó umbral y no hubo toggle manual
    if (cart[index].precio_mayoreo && !cart[index].mayoreo_manual_override) {
        cart[index].es_mayoreo = cart[index].cantidad >= 5;
        cart[index].precio_unitario = cart[index].es_mayoreo ? cart[index].precio_mayoreo : cart[index].precio_menudeo;
    }

    cart[index].subtotal = cart[index].cantidad * cart[index].precio_unitario;

    renderCartTabs();
    renderActiveCart();
}

// Eliminar un renglón del carrito activo
function removeItemFromCart(index) {
    const cart = carts[activeCartIndex];
    if (cart[index]) {
        cart.splice(index, 1);
        renderCartTabs();
        renderActiveCart();
    }
}

// Limpiar todo el carrito activo
function clearActiveCart() {
    if (carts[activeCartIndex].length === 0) return;
    if (confirm(`¿Vaciar todos los artículos del Carrito ${activeCartIndex + 1}?`)) {
        carts[activeCartIndex] = [];
        cartDiscounts[activeCartIndex] = 0;
        renderCartTabs();
        renderActiveCart();
        showToast(`Carrito ${activeCartIndex + 1} vaciado`, 'info');
        focusScanner();
    }
}

// Configurar descuento porcentual para el carrito activo
function setDescuento(pct) {
    cartDiscounts[activeCartIndex] = pct;
    
    // Actualizar estilo visual de los botones de descuento
    document.querySelectorAll('.btn-discount').forEach(btn => {
        const p = parseInt(btn.getAttribute('data-pct'), 10);
        btn.classList.toggle('active', p === pct);
    });

    renderCartTabs();
    renderActiveCart();

    // Si el modal de cobro está abierto, recalcular
    const modalCheckout = document.getElementById('modal-checkout');
    if (modalCheckout && modalCheckout.classList.contains('active')) {
        const cart = carts[activeCartIndex];
        const bruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
        const neto = bruto * (1 - pct / 100);
        document.getElementById('modal-checkout-total').textContent = `$${neto.toFixed(2)}`;
        calcularCambio(neto);
    }

    showToast(pct > 0 ? `Descuento del ${pct}% aplicado al carrito` : 'Descuento retirado', 'info');
}

// Actualizar valores numéricos en el panel derecho de cobro
function updateTotalsDisplay(subtotal, iva, total, descuento = 0, pct = 0) {
    const elSub = document.getElementById('calc-subtotal');
    const elIva = document.getElementById('calc-iva');
    const elTot = document.getElementById('calc-total');
    const rowDesc = document.getElementById('row-discount');
    const elDesc = document.getElementById('calc-descuento');

    if (elSub) elSub.textContent = `$${subtotal.toFixed(2)}`;
    if (elIva) elIva.textContent = `$${iva.toFixed(2)}`;
    if (elTot) elTot.textContent = `$${total.toFixed(2)}`;

    if (rowDesc && elDesc) {
        if (descuento > 0) {
            rowDesc.style.display = 'flex';
            elDesc.textContent = `-$${descuento.toFixed(2)} (${pct}%)`;
        } else {
            rowDesc.style.display = 'none';
        }
    }
}

// Renderizar cuadrícula visual de artículos rápidos en mostrador
function renderQuickProductsGrid(productos) {
    const grid = document.getElementById('quick-products-grid');
    if (!grid) return;

    grid.innerHTML = '';
    productos.slice(0, 16).forEach(p => {
        const card = document.createElement('div');
        card.className = `quick-product-card ${p.es_servicio ? 'service-card' : ''}`;
        card.innerHTML = `
            <div class="card-tag">${p.es_servicio ? 'SER' : (p.unidad_nombre || 'PZA')}</div>
            <div class="card-name">${escapeHTML(p.nombre)}</div>
            <div class="card-bottom">
                <span class="card-stock">${p.es_servicio ? 'Servicio' : `Stock: ${p.stock_actual}`}</span>
                <span class="card-price">$${p.precio_venta_menudeo.toFixed(2)}</span>
            </div>
        `;
        card.onclick = () => addToCart(p, 1);
        grid.appendChild(card);
    });
}

// Procesar búsqueda en tiempo real e input de lector de barras (<5ms)
function setupEventListeners() {
    const searchInput = document.getElementById('barcode-search-input');
    const searchDropdown = document.getElementById('search-dropdown-results');

    if (searchInput) {
        // Al presionar Enter (pistola láser de código de barras o teclado)
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const term = searchInput.value.trim();
                if (!term) return;

                // 1. Buscar coincidencia exacta por código de barras
                const exacto = await window.POS_DB.buscarProductoPorCodigo(term);
                if (exacto) {
                    addToCart(exacto, 1);
                    searchInput.value = '';
                    if (searchDropdown) searchDropdown.style.display = 'none';
                    return;
                }

                // 2. Si no es código exacto, buscar primer resultado
                const filtrados = currentProductsCatalog.filter(p =>
                    p.nombre.toLowerCase().includes(term.toLowerCase()) ||
                    p.sku.toLowerCase().includes(term.toLowerCase())
                );

                if (filtrados.length === 1) {
                    addToCart(filtrados[0], 1);
                    searchInput.value = '';
                    if (searchDropdown) searchDropdown.style.display = 'none';
                } else if (filtrados.length > 1) {
                    renderSearchDropdown(filtrados);
                } else {
                    showToast(`Artículo no encontrado para "${term}"`, 'warning');
                }
            }
        });

        // Autocompletado mientras se teclea
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length >= 2) {
                const resultados = currentProductsCatalog.filter(p =>
                    p.nombre.toLowerCase().includes(query) ||
                    p.codigo_barras.includes(query) ||
                    p.sku.toLowerCase().includes(query)
                ).slice(0, 8);
                renderSearchDropdown(resultados);
            } else {
                if (searchDropdown) searchDropdown.style.display = 'none';
            }
        });
    }

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#barcode-search-container')) {
            if (searchDropdown) searchDropdown.style.display = 'none';
        }
    });
}

// Renderizar lista desplegable de resultados instantáneos
function renderSearchDropdown(items) {
    const dropdown = document.getElementById('search-dropdown-results');
    const searchInput = document.getElementById('barcode-search-input');
    if (!dropdown) return;

    if (items.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = '';
    items.forEach(p => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'dropdown-item';
        itemDiv.innerHTML = `
            <div class="dd-title">${escapeHTML(p.nombre)}</div>
            <div class="dd-meta">
                <span>SKU: ${p.sku} | ${p.categoria_nombre || ''}</span>
                <span class="dd-price">$${p.precio_venta_menudeo.toFixed(2)}</span>
            </div>
        `;
        itemDiv.onclick = () => {
            addToCart(p, 1);
            if (searchInput) searchInput.value = '';
            dropdown.style.display = 'none';
            focusScanner();
        };
        dropdown.appendChild(itemDiv);
    });

    dropdown.style.display = 'block';
}

// Configurar Atajos de Teclado Profesionales para Mostrador
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            const activeTab = document.querySelector('.app-tab-section.active');
            if (activeTab && activeTab.id === 'tab-inventario') {
                const invSearch = document.getElementById('catalog-search-input');
                if (invSearch) invSearch.focus();
            } else {
                focusScanner();
            }
        } else if (e.key === 'F2') {
            e.preventDefault();
            const activeTab = document.querySelector('.app-tab-section.active');
            if (activeTab && activeTab.id === 'tab-inventario') {
                if (window.INVENTORY_MODULE) window.INVENTORY_MODULE.openProductModal();
            } else {
                cycleNextCart();
            }
        } else if (e.key === 'F4') {
            e.preventDefault();
            openCopiasModal();
        } else if (e.key === 'F8') {
            e.preventDefault();
            abrirHistorialTickets();
        } else if (e.key === 'F10') {
            e.preventDefault();
            openCheckoutModal();
        } else if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function focusScanner() {
    const searchInput = document.getElementById('barcode-search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

// -------------------------------------------------------------
// MODAL DE COBRO Y EMISIÓN DE TICKET (RF-04)
// -------------------------------------------------------------
function openCheckoutModal() {
    const cart = carts[activeCartIndex];
    if (cart.length === 0) {
        showToast('El carrito está vacío. Agregue artículos antes de cobrar.', 'warning');
        return;
    }

    const modal = document.getElementById('modal-checkout');
    if (!modal) return;

    const totalBruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
    const descPct = cartDiscounts[activeCartIndex] || 0;
    const totalNeto = Math.max(0, totalBruto * (1 - descPct / 100));

    document.getElementById('modal-checkout-total').textContent = `$${totalNeto.toFixed(2)}`;

    // Sincronizar botones de descuento en modal
    document.querySelectorAll('.btn-discount').forEach(btn => {
        const p = parseInt(btn.getAttribute('data-pct'), 10);
        btn.classList.toggle('active', p === descPct);
    });

    const efectivoInput = document.getElementById('checkout-efectivo-recibido');
    if (efectivoInput) {
        efectivoInput.value = totalNeto.toFixed(2);
    }

    calcularCambio(totalNeto);
    modal.classList.add('active');

    // Colocar el cursor automáticamente sobre el monto recibido para agilizar el cobro
    setTimeout(() => {
        const inputRecibido = document.getElementById('checkout-efectivo-recibido');
        if (inputRecibido) {
            inputRecibido.focus();
            inputRecibido.select();
        }
    }, 50);
}

// Denominación rápida de efectivo ($50, $100, $200, $500, $1000, Exacto)
function setEfectivoRapido(valor) {
    const cart = carts[activeCartIndex];
    const totalBruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
    const descPct = cartDiscounts[activeCartIndex] || 0;
    const totalNeto = Math.max(0, totalBruto * (1 - descPct / 100));

    const efectivoInput = document.getElementById('checkout-efectivo-recibido');
    if (!efectivoInput) return;

    if (valor === 'exacto') {
        efectivoInput.value = totalNeto.toFixed(2);
    } else {
        efectivoInput.value = Number(valor).toFixed(2);
    }

    calcularCambio(totalNeto);
    efectivoInput.focus();
    efectivoInput.select();
}

function calcularCambio(total = null) {
    if (total === null) {
        const cart = carts[activeCartIndex];
        const totalBruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
        const descPct = cartDiscounts[activeCartIndex] || 0;
        total = Math.max(0, totalBruto * (1 - descPct / 100));
    }

    const efectivoInput = document.getElementById('checkout-efectivo-recibido');
    const cambioDisplay = document.getElementById('checkout-cambio-devuelto');
    const btnConfirmar = document.getElementById('btn-confirmar-cobro');

    const recibido = parseFloat(efectivoInput.value) || 0;
    const cambio = recibido - total;

    if (cambioDisplay) {
        cambioDisplay.textContent = `$${Math.max(0, cambio).toFixed(2)}`;
        if (cambio < -0.01) {
            cambioDisplay.style.color = '#d9534f';
            cambioDisplay.textContent = `-$${Math.abs(cambio).toFixed(2)} (Faltan $${Math.abs(cambio).toFixed(2)})`;
            if (btnConfirmar) btnConfirmar.disabled = true;
        } else {
            cambioDisplay.style.color = '#3a8e63';
            if (btnConfirmar) btnConfirmar.disabled = false;
        }
    }
}

// Confirmar venta e imprimir ticket con logotipo institucional
async function confirmarVenta() {
    const cart = carts[activeCartIndex];
    if (cart.length === 0) return;

    const totalBruto = cart.reduce((acc, it) => acc + it.subtotal, 0);
    const descPct = cartDiscounts[activeCartIndex] || 0;
    const montoDescuento = totalBruto * (descPct / 100);
    const totalNeto = Math.max(0, totalBruto - montoDescuento);

    const subtotal = totalNeto / 1.16;
    const iva = totalNeto - subtotal;
    const efectivoInput = document.getElementById('checkout-efectivo-recibido');
    const metodoPago = document.getElementById('checkout-metodo-pago').value;
    const recibido = parseFloat(efectivoInput.value) || totalNeto;
    const cambio = Math.max(0, recibido - totalNeto);

    // QA Fix: Validación de monto suficiente en pago en efectivo
    if (metodoPago === 'EFECTIVO' && recibido < totalNeto) {
        alert('Pago insuficiente: El monto recibido ($' + recibido.toFixed(2) + ') es menor al total a pagar ($' + totalNeto.toFixed(2) + ').');
        if (efectivoInput) efectivoInput.focus();
        return;
    }

    // QA Fix: Cajero dinámico desde la sesión autenticada
    const activeAuthUser = (window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser) ? window.AUTH_MODULE.getCurrentUser() : null;
    const cajeroNombre = activeAuthUser ? (activeAuthUser.nombre_completo || activeAuthUser.username) : 'Gerardo Cabrera Morales (Líder Técnico & Cajero)';

    const ventaData = {
        subtotal: subtotal,
        iva: iva,
        descuento: montoDescuento,
        descuento_porcentaje: descPct,
        total_bruto: totalBruto,
        total: totalNeto,
        metodo_pago: metodoPago,
        monto_recibido: recibido,
        cambio: cambio,
        items: cart,
        cajero: cajeroNombre
    };

    try {
        const folioVenta = await window.POS_DB.registrarVentaConKardex(ventaData);
        closeAllModals();
        showToast(`¡Venta Ticket #${folioVenta} completada exitosamente!`, 'success');

        // Mostrar ticket para impresión térmica (RF-04)
        mostrarTicketImpresion(folioVenta, new Date().toISOString(), cart, ventaData);

        // Vaciar el carrito completado y reiniciar descuento
        carts[activeCartIndex] = [];
        cartDiscounts[activeCartIndex] = 0;
        renderCartTabs();
        renderActiveCart();

        // Actualizar catálogos y almacén
        await reloadCatalog();
        if (window.INVENTORY_MODULE) await window.INVENTORY_MODULE.reloadCatalogTable();
        if (window.CASH_MODULE) await window.CASH_MODULE.renderCashDashboard();
    } catch (err) {
        console.error(err);
        showToast('Error al procesar la transacción de venta: ' + err.message, 'error');
    }
}

// Renderizar Vista Previa de Ticket Térmico con Marca "Papelería A B C"
function mostrarTicketImpresion(folio, fecha, items, datosVenta) {
    const modal = document.getElementById('modal-ticket-preview');
    const ticketContent = document.getElementById('ticket-render-zone');
    if (!modal || !ticketContent) return;

    const fechaFormat = new Date(fecha).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    let itemsHtml = '';
    (items || []).forEach(it => {
        const descMayoreo = it.es_mayoreo ? ' <small>[MAYOREO]</small>' : '';
        itemsHtml += `
            <div class="ticket-row-item">
                <span class="ti-desc">${it.cantidad}x ${escapeHTML(it.nombre)}${descMayoreo}</span>
                <span class="ti-price">$${Number(it.subtotal).toFixed(2)}</span>
            </div>
        `;
    });

    const renglonDescuento = (datosVenta.descuento && datosVenta.descuento > 0) ? `
        <div class="ticket-row-total text-danger">
            <span>Descuento (${datosVenta.descuento_porcentaje || 0}%):</span>
            <span>-$${Number(datosVenta.descuento).toFixed(2)}</span>
        </div>
    ` : '';

    const folioTicket = datosVenta.folio_ticket || ('TICK-' + String(folio).padStart(5, '0'));

    ticketContent.innerHTML = `
        <div class="ticket-thermal-container">
            <div class="ticket-center-header">
                <img src="LOGO.jpg" alt="Papelería A B C" class="ticket-logo-img" onerror="this.style.display='none'"/>
                <div class="ticket-biz-name">Papelería A B C</div>
                <div class="ticket-biz-meta">Sistema POS & Inventario Comercial</div>
                <div class="ticket-biz-meta">RFC: PABC261005ABC</div>
                <div class="ticket-biz-meta">Av. Tecnológico #120, Col. Centro</div>
                <div class="ticket-biz-meta">Tel: 442-123-4567 | Querétaro, Qro.</div>
            </div>
            <div class="ticket-divider">================================</div>
            <div class="ticket-meta-info">
                <div><b>Folio:</b> ${folioTicket}</div>
                <div><b>Fecha:</b> ${fechaFormat}</div>
                <div><b>Cajero:</b> ${datosVenta.cajero || 'Gerardo Cabrera'}</div>
                <div><b>Caja:</b> Principal #01</div>
            </div>
            <div class="ticket-divider">--------------------------------</div>
            <div class="ticket-items-list">
                ${itemsHtml}
            </div>
            <div class="ticket-divider">--------------------------------</div>
            <div class="ticket-totals-section">
                ${(datosVenta.total_bruto && datosVenta.descuento > 0) ? `<div class="ticket-row-total"><span>Total Bruto:</span><span>$${Number(datosVenta.total_bruto).toFixed(2)}</span></div>` : ''}
                ${renglonDescuento}
                <div class="ticket-row-total"><span>Subtotal:</span><span>$${Number(datosVenta.subtotal).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>IVA (16% trasl.):</span><span>$${Number(datosVenta.iva).toFixed(2)}</span></div>
                <div class="ticket-row-total main-total"><span>TOTAL:</span><span>$${Number(datosVenta.total).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>Pago (${datosVenta.metodo_pago || 'EFECTIVO'}):</span><span>$${Number(datosVenta.monto_recibido || datosVenta.total).toFixed(2)}</span></div>
                <div class="ticket-row-total"><span>Cambio:</span><span>$${Number(datosVenta.cambio || 0).toFixed(2)}</span></div>
            </div>
            <div class="ticket-divider">================================</div>
            
            <!-- Simulación de Código de Barras de Ticket para Devoluciones -->
            <div class="ticket-barcode-wrap" style="text-align: center; margin: 8px 0;">
                <div style="font-family: monospace; font-size: 1.4rem; letter-spacing: 3px; font-weight: 800;">|||||| | |||| ||| |||| |</div>
                <div style="font-family: monospace; font-size: 0.72rem; color: #475569;">${folioTicket}</div>
            </div>

            <div class="ticket-center-footer">
                <p>¡Gracias por su compra en Papelería A B C!</p>
                <small>Comprobante de venta simplificado sin valor fiscal.</small><br/>
                <small>Cambios o aclaraciones presentando este ticket.</small>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// -------------------------------------------------------------
// HISTORIAL DE VENTAS Y REIMPRESIÓN DE TICKETS [F8]
// -------------------------------------------------------------
// -------------------------------------------------------------
// HISTORIAL Y ANÁLISIS DE VENTAS [F8]
// -------------------------------------------------------------
let cacheVentasHistorial = [];

async function abrirHistorialTickets() {
    const modal = document.getElementById('modal-historial-ventas');
    const tbody = document.getElementById('historial-ventas-tbody');
    if (!modal || !tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px;">Cargando ventas...</td></tr>';
    modal.classList.add('active');

    cacheVentasHistorial = await window.POS_DB.getHistorialVentas() || [];

    // Resetear filtros iniciales
    const searchInput = document.getElementById('historial-search-input');
    const metodoFilter = document.getElementById('historial-filtro-metodo');
    const periodoFilter = document.getElementById('historial-filtro-periodo');
    if (searchInput) searchInput.value = '';
    if (metodoFilter) metodoFilter.value = 'TODOS';
    if (periodoFilter) periodoFilter.value = 'HOY';

    filtrarHistorialVentas();
    
    // Enfocar el buscador para agilizar el análisis
    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 50);
}

function resetFiltrosHistorial() {
    const searchInput = document.getElementById('historial-search-input');
    const metodoFilter = document.getElementById('historial-filtro-metodo');
    const periodoFilter = document.getElementById('historial-filtro-periodo');
    if (searchInput) searchInput.value = '';
    if (metodoFilter) metodoFilter.value = 'TODOS';
    if (periodoFilter) periodoFilter.value = 'TODOS';
    filtrarHistorialVentas();
}

function filtrarHistorialVentas() {
    const tbody = document.getElementById('historial-ventas-tbody');
    if (!tbody) return;

    const query = (document.getElementById('historial-search-input')?.value || '').toLowerCase().trim();
    const metodo = document.getElementById('historial-filtro-metodo')?.value || 'TODOS';
    const periodo = document.getElementById('historial-filtro-periodo')?.value || 'HOY';

    const localDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const hoyLocal = localDateStr(new Date());

    let filtradas = cacheVentasHistorial.filter(v => {
        // Filtro Periodo
        if (periodo === 'HOY') {
            const fVenta = v.fecha_hora ? localDateStr(new Date(v.fecha_hora)) : '';
            if (fVenta && fVenta !== hoyLocal) return false;
        }

        // Filtro Método
        if (metodo !== 'TODOS' && (v.metodo_pago || 'EFECTIVO') !== metodo) {
            return false;
        }

        // Filtro Búsqueda
        if (query) {
            const folio = (v.folio_ticket || ('TICK-' + String(v.id_venta).padStart(5, '0'))).toLowerCase();
            const cajero = (v.cajero || '').toLowerCase();
            const prods = (v.items || []).map(it => (it.nombre || '').toLowerCase()).join(' ');
            if (!folio.includes(query) && !cajero.includes(query) && !prods.includes(query)) {
                return false;
            }
        }

        return true;
    });

    // Actualizar KPIs de análisis en base a los datos filtrados
    actualizarKPIsHistorial(filtradas);

    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:32px; color: var(--color-slate-light); font-size: 0.9rem;">No se encontraron ventas con los criterios seleccionados.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    filtradas.forEach(v => {
        const d = new Date(v.fecha_hora || Date.now());
        const fechaHora = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }) + ' ' + 
                          d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const folio = v.folio_ticket || ('TICK-' + String(v.id_venta).padStart(5, '0'));
        const totalArts = v.total_articulos || (v.items ? v.items.reduce((s, it) => s + it.cantidad, 0) : 0);
        
        // Resumen legible de artículos
        const itemsList = (v.items || []).map(it => `${it.cantidad}x ${it.nombre}`).join(', ');
        const itemsClipped = itemsList.length > 55 ? itemsList.substring(0, 52) + '...' : (itemsList || 'Sin desglose');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b style="color: var(--color-primary); font-family: monospace; font-size: 0.85rem;">${folio}</b></td>
            <td style="color: var(--color-slate-dark); font-size: 0.78rem;">${fechaHora}</td>
            <td style="font-size: 0.78rem;">${escapeHTML(v.cajero || 'Cajero')}</td>
            <td><span class="badge-pay-method pay-${(v.metodo_pago || 'EFECTIVO').toLowerCase()}">${v.metodo_pago || 'EFECTIVO'}</span></td>
            <td>
                <span style="background: #e2e8f0; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem; margin-right: 6px;">${totalArts} arts.</span>
                <span title="${itemsList.replace(/"/g, '&quot;')}" style="color: var(--color-slate-dark); font-size: 0.78rem;">${escapeHTML(itemsClipped)}</span>
            </td>
            <td class="text-right font-mono" style="color: var(--color-slate-light);">$${Number(v.subtotal || (v.total / 1.16)).toFixed(2)}</td>
            <td class="text-right font-bold font-mono" style="color: var(--color-primary); font-size: 0.92rem;">$${Number(v.total).toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn-table-action btn-print-ticket" onclick="window.POS_MODULE.reimprimirTicket('${v.folio_ticket || v.id_venta}')" title="Reimprimir ticket térmico">Reimprimir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarKPIsHistorial(ventas) {
    const kpiCount = document.getElementById('hist-kpi-count');
    const kpiItems = document.getElementById('hist-kpi-items');
    const kpiTotal = document.getElementById('hist-kpi-total');
    const kpiIva = document.getElementById('hist-kpi-iva');
    const kpiAvg = document.getElementById('hist-kpi-avg');
    const kpiMix = document.getElementById('hist-kpi-mix');
    const filteredCount = document.getElementById('historial-filtered-count');
    const badgeCount = document.getElementById('historial-tickets-count-badge');

    const totalVentas = ventas.length;
    let sumaMonto = 0;
    let sumaArts = 0;
    let sumaIva = 0;
    let efvo = 0;
    let tarj = 0;
    let spei = 0;

    ventas.forEach(v => {
        const tot = Number(v.total) || 0;
        sumaMonto += tot;
        sumaArts += v.total_articulos || (v.items ? v.items.reduce((s, it) => s + it.cantidad, 0) : 0);
        sumaIva += Number(v.iva || (tot - (tot / 1.16))) || 0;

        const m = (v.metodo_pago || 'EFECTIVO').toUpperCase();
        if (m === 'EFECTIVO') efvo += tot;
        else if (m === 'TARJETA') tarj += tot;
        else if (m === 'TRANSFERENCIA') spei += tot;
    });

    const avg = totalVentas > 0 ? (sumaMonto / totalVentas) : 0;

    if (kpiCount) kpiCount.textContent = `${totalVentas} ticket${totalVentas === 1 ? '' : 's'}`;
    if (kpiItems) kpiItems.textContent = `${sumaArts} artículos`;
    if (kpiTotal) kpiTotal.textContent = `$${sumaMonto.toFixed(2)}`;
    if (kpiIva) kpiIva.textContent = `IVA trasl.: $${sumaIva.toFixed(2)}`;
    if (kpiAvg) kpiAvg.textContent = `$${avg.toFixed(2)}`;
    if (kpiMix) {
        kpiMix.innerHTML = `
            <span style="color: var(--color-emerald);">Efvo: $${efvo.toFixed(2)}</span> | 
            <span style="color: #0284c7;">Tarj: $${tarj.toFixed(2)}</span><br>
            <span style="color: #7c3aed;">SPEI: $${spei.toFixed(2)}</span>
        `;
    }
    if (filteredCount) filteredCount.textContent = totalVentas;
    if (badgeCount) badgeCount.textContent = `${totalVentas} ticket${totalVentas === 1 ? '' : 's'}`;
}

async function reimprimirTicket(folio) {
    const venta = await window.POS_DB.getVentaPorFolio(folio);
    if (!venta) {
        showToast('Ticket no encontrado', 'error');
        return;
    }
    mostrarTicketImpresion(venta.folio_venta || venta.id_venta, venta.fecha_hora, venta.items, venta);
}

// -------------------------------------------------------------
// EXPORTACIÓN DE HISTORIAL DE VENTAS DEL DÍA A CSV (RF-04 / RF-08)
// -------------------------------------------------------------
async function exportarVentasDiaCSV() {
    try {
        const ventas = await window.POS_DB.getHistorialVentas();
        if (!ventas || ventas.length === 0) {
            showToast('No hay ventas registradas aún en el sistema para exportar.', 'warning');
            return;
        }

        const localDateStr = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        const hoyLocal = localDateStr(new Date());

        let ventasFiltradas = ventas.filter(v => {
            if (!v.fecha_hora) return false;
            return localDateStr(new Date(v.fecha_hora)) === hoyLocal;
        });

        // Si no hay ventas con la fecha de hoy, exportar las registradas en el turno activo
        if (ventasFiltradas.length === 0) {
            ventasFiltradas = ventas;
        }

        const headers = [
            'Folio_Ticket',
            'Fecha',
            'Hora',
            'Cajero',
            'Metodo_Pago',
            'Total_Articulos',
            'Desglose_Articulos',
            'Subtotal_MXN',
            'IVA_16_MXN',
            'Total_Cobrado_MXN',
            'Monto_Recibido_MXN',
            'Cambio_Entregado_MXN',
            'Estado'
        ];

        let csvContent = '\uFEFF'; // BOM para soporte de tildes y caracteres en Excel
        csvContent += headers.join(',') + '\r\n';

        let sumaArticulos = 0;
        let sumaSubtotal = 0;
        let sumaIva = 0;
        let sumaTotal = 0;

        ventasFiltradas.forEach(v => {
            const d = new Date(v.fecha_hora || Date.now());
            const fecha = localDateStr(d);
            const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const folio = v.folio_ticket || ('TICK-' + String(v.id_venta).padStart(5, '0'));
            const cajero = (v.cajero || 'Cajero en Turno').replace(/"/g, '""');
            const metodo = v.metodo_pago || 'EFECTIVO';
            const cantArt = v.total_articulos || (v.items ? v.items.reduce((s, it) => s + it.cantidad, 0) : 0);

            // Resumen de artículos
            const itemsResumen = (v.items || []).map(it => `${it.cantidad}x ${it.nombre} ($${Number(it.subtotal).toFixed(2)})`).join('; ').replace(/"/g, '""');

            const sub = Number(v.subtotal || (v.total / 1.16)).toFixed(2);
            const iva = Number(v.iva || (v.total - (v.total / 1.16))).toFixed(2);
            const tot = Number(v.total).toFixed(2);
            const rec = Number(v.monto_recibido || v.total).toFixed(2);
            const cam = Number(v.cambio || 0).toFixed(2);
            const est = v.estado || 'COMPLETADA';

            sumaArticulos += cantArt;
            sumaSubtotal += parseFloat(sub);
            sumaIva += parseFloat(iva);
            sumaTotal += parseFloat(tot);

            const row = [
                `"${folio}"`,
                `"${fecha}"`,
                `"${hora}"`,
                `"${cajero}"`,
                `"${metodo}"`,
                cantArt,
                `"${itemsResumen}"`,
                sub,
                iva,
                tot,
                rec,
                cam,
                `"${est}"`
            ];
            csvContent += row.join(',') + '\r\n';
        });

        // Fila de resumen total para auditoría
        csvContent += `\r\n"TOTAL DEL DÍA","","","","TOTAL OPERACIONES: ${ventasFiltradas.length}",${sumaArticulos},"RESUMEN TOTALES",${sumaSubtotal.toFixed(2)},${sumaIva.toFixed(2)},${sumaTotal.toFixed(2)},"","",""\r\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const fileName = `ventas_del_dia_${hoyLocal}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`Historial de ${ventasFiltradas.length} venta(s) exportado a CSV`, 'success');
    } catch (err) {
        console.error(err);
        showToast('Error al exportar ventas del día: ' + err.message, 'error');
    }
}

// -------------------------------------------------------------
// SERVICIOS DE COPIADO RÁPIDO [F4]
// -------------------------------------------------------------
function openCopiasModal() {
    const modal = document.getElementById('modal-servicios-copias');
    if (modal) modal.classList.add('active');
}

function agregarServiciosAlCarrito() {
    const cantBn = parseInt(document.getElementById('input-cant-copias-bn').value) || 0;
    const cantColor = parseInt(document.getElementById('input-cant-copias-color').value) || 0;
    const cantEnmicado = parseInt(document.getElementById('input-cant-enmicados').value) || 0;

    let agregados = 0;

    if (cantBn > 0) {
        addToCart({
            id_producto: 9901,
            codigo_barras: 'SRV-COPIA-BN',
            sku: 'SRV-CP-BN',
            nombre: 'Fotocopia Blanco y Negro Carta',
            precio_venta_menudeo: 1.00,
            stock_actual: 9999,
            es_servicio: true,
            unidad_nombre: 'Servicio'
        }, cantBn);
        agregados++;
    }

    if (cantColor > 0) {
        addToCart({
            id_producto: 9902,
            codigo_barras: 'SRV-COPIA-COL',
            sku: 'SRV-CP-COL',
            nombre: 'Fotocopia / Impresión Color Carta',
            precio_venta_menudeo: 5.00,
            stock_actual: 9999,
            es_servicio: true,
            unidad_nombre: 'Servicio'
        }, cantColor);
        agregados++;
    }

    if (cantEnmicado > 0) {
        addToCart({
            id_producto: 9903,
            codigo_barras: 'SRV-ENMIC-CAR',
            sku: 'SRV-ENMIC',
            nombre: 'Enmicado Térmico Tamaño Carta',
            precio_venta_menudeo: 15.00,
            stock_actual: 9999,
            es_servicio: true,
            unidad_nombre: 'Servicio'
        }, cantEnmicado);
        agregados++;
    }

    if (agregados > 0) {
        closeAllModals();
        document.getElementById('input-cant-copias-bn').value = '';
        document.getElementById('input-cant-copias-color').value = '';
        document.getElementById('input-cant-enmicados').value = '';
    } else {
        showToast('Ingrese al menos una cantidad de servicio.', 'warning');
    }
}

// Utilerías UI
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    focusScanner();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

window.POS_MODULE = {
    initPOS,
    reloadCatalog,
    addToCart,
    switchCart,
    cycleNextCart,
    clearActiveCart,
    updateItemQty,
    removeItemFromCart,
    toggleItemMayoreo,
    setDescuento,
    setEfectivoRapido,
    openCheckoutModal,
    calcularCambio,
    confirmarVenta,
    openCopiasModal,
    agregarServiciosAlCarrito,
    abrirHistorialTickets,
    filtrarHistorialVentas,
    resetFiltrosHistorial,
    reimprimirTicket,
    exportarVentasDiaCSV,
    closeAllModals,
    focusScanner,
    showToast
};