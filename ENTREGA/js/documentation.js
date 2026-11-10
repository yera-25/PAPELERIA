/**
 * DOCUMENTATION_MODULE - Papelera A B C (Fase 8: Documentacin y Manuales)
 * Proporciona acceso interactivo al Manual de Usuario, Manual Tcnico, Arquitectura,
 * scripts SQL DDL y explorador del Catlogo Muestra Realista de 160 productos.
 */

window.DOCUMENTATION_MODULE = (function () {
    let catalogoCache = [];
    let initialized = false;

    // Script SQL DDL oficial de las 10 tablas en 3FN
    const SQL_DDL_OFICIAL = `-- =============================================================================
-- ESQUEMA RELACIONAL SQLITE 3FN - SISTEMA POS PAPELERIA A B C (FASE 8)
-- =============================================================================

CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS marcas (
    id_marca INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    pais_origen TEXT DEFAULT 'Mexico',
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS unidades_medida (
    id_unidad INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
    rfc TEXT NOT NULL UNIQUE,
    razon_social TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS productos (
    id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT NOT NULL UNIQUE,
    sku TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    id_categoria INTEGER NOT NULL,
    id_marca INTEGER NOT NULL,
    id_unidad INTEGER NOT NULL,
    precio_compra REAL NOT NULL CHECK(precio_compra >= 0),
    precio_venta_menudeo REAL NOT NULL CHECK(precio_venta_menudeo > 0),
    precio_venta_mayoreo REAL NOT NULL CHECK(precio_venta_mayoreo > 0),
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    es_servicio INTEGER NOT NULL DEFAULT 0,
    permite_desglose INTEGER NOT NULL DEFAULT 0,
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_marca) REFERENCES marcas(id_marca) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_unidad) REFERENCES unidades_medida(id_unidad) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_prod_codigo ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_prod_sku ON productos(sku);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('ADMINISTRADOR', 'SUPERVISOR', 'USUARIO', 'CAJERO')),
    activo INTEGER NOT NULL DEFAULT 1,
    ultimo_login TEXT
);

CREATE TABLE IF NOT EXISTS turnos_caja (
    id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    fecha_apertura TEXT NOT NULL,
    monto_inicial REAL NOT NULL DEFAULT 0,
    fecha_cierre TEXT,
    monto_final_sistema REAL DEFAULT 0,
    monto_final_declarado REAL DEFAULT 0,
    diferencia REAL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'ABIERTO',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id_movimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_turno INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('ENTRADA', 'SALIDA')),
    monto REAL NOT NULL,
    motivo TEXT NOT NULL,
    fecha_hora TEXT NOT NULL,
    FOREIGN KEY (id_turno) REFERENCES turnos_caja(id_turno)
);

CREATE TABLE IF NOT EXISTS ventas (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    folio_ticket TEXT NOT NULL UNIQUE,
    id_turno INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    fecha_hora TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    descuento REAL NOT NULL DEFAULT 0,
    descuento_porcentaje REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    monto_recibido REAL NOT NULL,
    cambio REAL NOT NULL,
    FOREIGN KEY (id_turno) REFERENCES turnos_caja(id_turno),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    es_mayoreo INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE IF NOT EXISTS devoluciones_cambios (
    id_devolucion INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK(tipo IN ('DEVOLUCION', 'CAMBIO')),
    id_producto_devuelto INTEGER NOT NULL,
    nombre_producto_devuelto TEXT NOT NULL,
    cantidad_devuelta INTEGER NOT NULL CHECK(cantidad_devuelta > 0),
    precio_unitario_devuelto REAL NOT NULL,
    total_devuelto REAL NOT NULL,
    id_producto_nuevo INTEGER,
    nombre_producto_nuevo TEXT,
    cantidad_nueva INTEGER,
    precio_unitario_nuevo REAL,
    total_nuevo REAL,
    diferencia REAL NOT NULL DEFAULT 0,
    motivo TEXT NOT NULL,
    autorizado_por TEXT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto_devuelto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_producto_nuevo) REFERENCES productos(id_producto)
);`;

    function init() {
        if (!initialized) {
            setupDocumentationSubtabs();
            setupEventListeners();
            initialized = true;
        }
        cargarCatalogo160();
    }

    function setupDocumentationSubtabs() {
        const subtabBtns = document.querySelectorAll('.doc-subtab-btn');
        subtabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-doc-subtab');
                subtabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.doc-subtab-pane').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const pane = document.getElementById(target);
                if (pane) pane.classList.add('active');

                if (target === 'doc-subtab-catalogo') {
                    cargarCatalogo160();
                }
            });
        });
    }

    function setupEventListeners() {
        // Buscador de catlogo en documentacin
        const searchInput = document.getElementById('doc-catalogo-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filtrarCatalogo160(e.target.value);
            });
        }

        // Filtro de categora en catlogo documentacin
        const catSelect = document.getElementById('doc-catalogo-cat-filter');
        if (catSelect) {
            catSelect.addEventListener('change', () => {
                filtrarCatalogo160(searchInput ? searchInput.value : '');
            });
        }
    }

    async function cargarCatalogo160() {
        if (!window.POS_DB) return;
        try {
            catalogoCache = await window.POS_DB.getProductosCompletos();
            poblarFiltroCategorias();
            renderCatalogoTabla(catalogoCache);
        } catch (err) {
            console.error('Error cargando catlogo en documentacin:', err);
        }
    }

    function poblarFiltroCategorias() {
        const catSelect = document.getElementById('doc-catalogo-cat-filter');
        if (!catSelect || catSelect.options.length > 1) return;

        const categorias = [...new Set(catalogoCache.map(p => p.categoria_nombre))].sort();
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });
    }

    function filtrarCatalogo160(query = '') {
        const q = query.trim().toLowerCase();
        const catSelect = document.getElementById('doc-catalogo-cat-filter');
        const catVal = catSelect ? catSelect.value : '';

        const filtrados = catalogoCache.filter(p => {
            const matchesText = !q ||
                p.nombre.toLowerCase().includes(q) ||
                p.codigo_barras.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.marca_nombre && p.marca_nombre.toLowerCase().includes(q));

            const matchesCat = !catVal || p.categoria_nombre === catVal;

            return matchesText && matchesCat;
        });

        renderCatalogoTabla(filtrados);
    }

    function renderCatalogoTabla(lista) {
        const tbody = document.getElementById('doc-catalogo-tbody');
        const countBadge = document.getElementById('doc-catalogo-count-badge');
        if (!tbody) return;

        if (countBadge) {
            countBadge.textContent = `${lista.length} de ${catalogoCache.length} artculos`;
        }

        if (lista.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">
                        No se encontraron productos coincidentes con la bsqueda.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        lista.forEach(p => {
            const stockClass = p.stock_actual <= p.stock_minimo ? 'style=\"color: #ef4444; font-weight: 700;\"' : '';
            html += `
                <tr>
                    <td style="font-weight: 600; color: #334155;">#${p.id_producto}</td>
                    <td><code>${escapeHTML(p.codigo_barras)}</code></td>
                    <td><small style="color: #64748b;">${escapeHTML(p.sku)}</small></td>
                    <td style="font-weight: 600; color: #0f172a;">${escapeHTML(p.nombre)}</td>
                    <td><span class="badge-cat-doc">${escapeHTML(p.categoria_nombre)}</span></td>
                    <td>${escapeHTML(p.marca_nombre)}</td>
                    <td style="text-align: right; color: #64748b;">$${Number(p.precio_compra).toFixed(2)}</td>
                    <td style="text-align: right; font-weight: 700; color: #059669;">$${Number(p.precio_venta_menudeo).toFixed(2)}</td>
                    <td style="text-align: center;" ${stockClass}>${p.stock_actual} / <small>${p.stock_minimo}</small></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }

    function copiarSQLScript() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(SQL_DDL_OFICIAL).then(() => {
                if (window.POS_MODULE && window.POS_MODULE.showToast) {
                    window.POS_MODULE.showToast('Script SQL DDL copiado al portapapeles correctamente.', 'success');
                } else {
                    alert('Script SQL DDL copiado al portapapeles correctamente.');
                }
            });
        } else {
            // Fallback con textarea temporal
            const ta = document.createElement('textarea');
            ta.value = SQL_DDL_OFICIAL;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (window.POS_MODULE && window.POS_MODULE.showToast) {
                window.POS_MODULE.showToast('Script SQL DDL copiado al portapapeles correctamente.', 'success');
            } else {
                alert('Script SQL DDL copiado al portapapeles correctamente.');
            }
        }
    }

    async function forzarRecargaCatalogo160() {
        const confirmar = confirm('Desea restablecer y sincronizar el catalogo maestro completo de 160 productos clasificados? (Se preservaran ventas y usuarios existentes)');
        if (!confirmar) return;

        if (window.POS_DB && typeof window.POS_DB.recargarCatalogoCompleto160 === 'function') {
            await window.POS_DB.recargarCatalogoCompleto160(true);
            await cargarCatalogo160();
            if (window.INVENTORY_MODULE) window.INVENTORY_MODULE.reloadCatalogTable();
            if (window.POS_MODULE) window.POS_MODULE.reloadCatalog();

            if (window.POS_MODULE && window.POS_MODULE.showToast) {
                window.POS_MODULE.showToast('Catalogo maestro de 160 productos restablecido con exito.', 'success');
            } else {
                alert('Catalogo maestro de 160 productos restablecido con exito.');
            }
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }


    function solicitarDescargaBD() {
        const modal = document.getElementById('modal-auth-descarga-bd');
        const form = document.getElementById('form-auth-descarga-bd');
        const errorDiv = document.getElementById('auth-bd-error');
        const userInput = document.getElementById('auth-bd-username');
        const passInput = document.getElementById('auth-bd-password');

        if (form) form.reset();
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }

        const curUser = (window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser) ? window.AUTH_MODULE.getCurrentUser() : null;
        if (curUser && curUser.rol === 'ADMINISTRADOR') {
            if (userInput) userInput.value = curUser.username;
        } else {
            if (userInput) userInput.value = 'admin';
        }

        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                if (passInput) passInput.focus();
            }, 60);
        }
    }

    async function handleAuthDescargaBDSubmit(event) {
        event.preventDefault();
        const userInput = document.getElementById('auth-bd-username');
        const passInput = document.getElementById('auth-bd-password');
        const errorDiv = document.getElementById('auth-bd-error');

        const username = userInput ? userInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!username || !password) {
            if (errorDiv) {
                errorDiv.textContent = 'Ingrese usuario y contrasena de Administrador.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        if (!window.POS_DB || !window.AUTH_MODULE) {
            alert('Error: Motor de base de datos o autenticacion no inicializado.');
            return;
        }

        const user = await window.POS_DB.getUsuarioPorUsername(username);
        if (!user) {
            if (errorDiv) {
                errorDiv.textContent = 'Credenciales invalidas o usuario inexistente.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        if (user.rol !== 'ADMINISTRADOR') {
            if (errorDiv) {
                errorDiv.textContent = 'Acceso denegado: El usuario ingresado no posee rol de ADMINISTRADOR.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        const hashIntento = await window.AUTH_MODULE.encriptarPassword(password, user.salt);
        if (hashIntento !== user.password_hash) {
            if (errorDiv) {
                errorDiv.textContent = 'Contrasena de Administrador incorrecta.';
                errorDiv.style.display = 'block';
            }
            return;
        }

        // Autorizacion exitosa
        window.closeAllModals();

        if (window.POS_MODULE && window.POS_MODULE.showToast) {
            window.POS_MODULE.showToast('Autorizacion de Administrador concedida. Descargando base de datos...', 'success');
        }

        const link = document.createElement('a');
        link.href = 'papeleria_pos.db';
        link.download = 'papeleria_pos.db';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return {
        init,
        cargarCatalogo160,
        filtrarCatalogo160,
        copiarSQLScript,
        forzarRecargaCatalogo160,
        solicitarDescargaBD,
        handleAuthDescargaBDSubmit,
        getSqlDDL: () => SQL_DDL_OFICIAL
    };
})();
