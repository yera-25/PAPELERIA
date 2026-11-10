/**
 * auth.js - Módulo de Seguridad, Control de Acceso Basado en Roles (RBAC) y Cifrado SHA-256
 * Papelería A B C — Fase 6: Sprint 3 (Seguridad y Autenticación | RF-09)
 * 
 * Perfiles del Sistema y Segregación de Funciones:
 * 1. ADMINISTRADOR: Destinado a la administración exclusiva de los perfiles y contraseñas,
 *    auditoría de seguridad y configuración institucional.
 * 2. SUPERVISOR: Gestión comercial del catálogo (altas de productos, categorías, marcas),
 *    ejecución de cortes de caja Z y consulta de reportes operativos.
 * 3. USUARIO (CAJERO): Operación en mostrador Punto de Venta (POS), cobro de tickets y
 *    consulta básica de existencias. Prohibido: alta de productos, categorías, marcas y cortes de caja.
 */

// Estado de sesión en memoria
let currentUser = null;
const AUTH_SESSION_KEY = 'PAPELERIA_ABC_AUTH_SESSION';

// -----------------------------------------------------------------------------
// 1. CIFRADO CRIPTOGRÁFICO SEGURO (SHA-256 CON SALT)
// -----------------------------------------------------------------------------

async function sha256(message) {
    if (window.crypto && window.crypto.subtle) {
        try {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('[Auth] Fallback a SHA-256 JS:', e);
        }
    }
    return sha256Fallback(message);
}

// Implementación JS pura de SHA-256 (RFC 6234) como respaldo infalible
function sha256Fallback(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words = [];
    const asciiBitLength = ascii.length * 8;
    
    let hash = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    for (let i = 0; i < ascii.length; i++) {
        const j = i >> 2;
        words[j] = (words[j] || 0) | (ascii.charCodeAt(i) << ((3 - (i % 4)) * 8));
    }
    const endWord = ascii.length >> 2;
    words[endWord] = (words[endWord] || 0) | (0x80 << ((3 - (ascii.length % 4)) * 8));
    words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

    for (let j = 0; j < words.length; j += 16) {
        const w = words.slice(j, j + 16);
        const oldHash = [...hash];
        for (let i = 0; i < 64; i++) {
            if (i >= 16) {
                const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
                const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
                w[i] = (((w[i - 16] + s0) | 0) + ((w[i - 7] + s1) | 0)) | 0;
            }
            const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
            const ch = (hash[4] & hash[5]) ^ ((~hash[4]) & hash[6]);
            const temp1 = (((hash[7] + s1) | 0) + ((ch + k[i]) | 0) + (w[i] | 0)) | 0;
            const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
            const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            const temp2 = (s0 + maj) | 0;

            hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
        }
        for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j >= 0; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

function generarSalt() {
    return 'salt_abc_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
}

async function encriptarPassword(password, salt) {
    return await sha256(salt + password);
}

// -----------------------------------------------------------------------------
// 2. INICIALIZACIÓN Y GESTIÓN DE SESIÓN
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// MECANISMOS DE SEGURIDAD CONTRA FUERZA BRUTA Y ACCESOS NO AUTORIZADOS
// -----------------------------------------------------------------------------
let failedAttemptsCount = 0;
let lockoutTimestamp = null;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 60000; // 60 segundos de bloqueo temporal

async function initAuth() {
    console.log('[Auth] Inicializando subsistema de seguridad y RBAC...');
    
    // 1. Verificar si existe sesión activa en la ventana actual
    let sesionGuardada = null;
    try {
        const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (raw) sesionGuardada = JSON.parse(raw);
    } catch (e) {
        sesionGuardada = null;
    }

    if (sesionGuardada && sesionGuardada.username) {
        const usuarioDB = await window.POS_DB.getUsuarioPorUsername(sesionGuardada.username);
        if (usuarioDB && usuarioDB.activo) {
            currentUser = usuarioDB;
            actualizarUIUsuario();
            aplicarRestriccionesRBAC();
            return;
        }
    }

    // 2. Si no hay sesión activa, exigir inicio de sesión obligatorio al abrir la página
    currentUser = null;
    actualizarUIUsuario();
    aplicarRestriccionesRBAC();
    abrirModalLogin(true); // true = login obligatorio bloqueante
}

function guardarSesion(user) {
    try {
        const sessionData = {
            id_usuario: user.id_usuario,
            username: user.username,
            nombre_completo: user.nombre_completo,
            rol: user.rol,
            hora_inicio: new Date().toISOString()
        };
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
        console.error('[Auth] Error guardando sesión:', e);
    }
}

function getCurrentUser() {
    return currentUser;
}

// -----------------------------------------------------------------------------
// 3. AUTENTICACIÓN (LOGIN, LOGOUT, DEMO LOGIN)
// -----------------------------------------------------------------------------

async function login(username, password) {
    // 1. Verificacion de bloqueo activo contra ataques de fuerza bruta
    if (lockoutTimestamp && Date.now() < lockoutTimestamp) {
        const segRestantes = Math.ceil((lockoutTimestamp - Date.now()) / 1000);
        return {
            success: false,
            message: 'Acceso temporalmente bloqueado por seguridad tras multiples intentos fallidos. Intente de nuevo en ' + segRestantes + ' segundos.'
        };
    }

    const userClean = (username || '').trim().toLowerCase();
    const user = await window.POS_DB.getUsuarioPorUsername(userClean);

    if (!user) {
        failedAttemptsCount++;
        if (failedAttemptsCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
            lockoutTimestamp = Date.now() + LOCKOUT_PERIOD_MS;
            failedAttemptsCount = 0;
            return {
                success: false,
                message: 'Demasiados intentos fallidos consecutivos. Por politica de seguridad, el acceso ha sido bloqueado por 60 segundos.'
            };
        }
        const restantes = MAX_FAILED_LOGIN_ATTEMPTS - failedAttemptsCount;
        return {
            success: false,
            message: 'Credenciales invalidas. Le quedan ' + restantes + ' intento(s) antes del bloqueo temporal.'
        };
    }

    if (!user.activo) {
        return { success: false, message: 'La cuenta se encuentra inactiva. Contacte al Administrador.' };
    }

    const hashCalculado = await encriptarPassword(password, user.salt);
    if (hashCalculado !== user.password_hash) {
        failedAttemptsCount++;
        if (failedAttemptsCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
            lockoutTimestamp = Date.now() + LOCKOUT_PERIOD_MS;
            failedAttemptsCount = 0;
            return {
                success: false,
                message: 'Demasiados intentos fallidos consecutivos. Por politica de seguridad, el acceso ha sido bloqueado por 60 segundos.'
            };
        }
        const restantes = MAX_FAILED_LOGIN_ATTEMPTS - failedAttemptsCount;
        return {
            success: false,
            message: 'Contrasena incorrecta para ' + user.nombre_completo + '. Le quedan ' + restantes + ' intento(s) antes del bloqueo temporal.'
        };
    }

    // Login exitoso: restablecer contadores de seguridad
    failedAttemptsCount = 0;
    lockoutTimestamp = null;

    user.ultimo_acceso = new Date().toISOString();
    await window.POS_DB.actualizarUltimoAcceso(user.id_usuario, user.ultimo_acceso);

    currentUser = user;
    guardarSesion(currentUser);
    actualizarUIUsuario();
    aplicarRestriccionesRBAC();

    cerrarModalLogin();
    
    // Direccionamiento inteligente segun el perfil ingresado
    if (user.rol === 'ADMINISTRADOR') {
        const configBtn = document.querySelector('button[data-tab="tab-configuracion"]');
        if (configBtn) configBtn.click();
        if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
            window.POS_MODULE.showToast('Sesion iniciada como Administrador (' + user.nombre_completo + '). Gestion de perfiles activa.', 'info');
        }
    } else if (user.rol === 'SUPERVISOR') {
        const invBtn = document.querySelector('button[data-tab="tab-inventario"]');
        if (invBtn) invBtn.click();
        if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
            window.POS_MODULE.showToast('Sesion iniciada como Supervisor (' + user.nombre_completo + '). Altas de inventario y caja activas.', 'info');
        }
    } else {
        const posBtn = document.querySelector('button[data-tab="tab-pos"]');
        if (posBtn) posBtn.click();
        if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
            window.POS_MODULE.showToast('Bienvenido al Mostrador POS, ' + user.nombre_completo + '.', 'info');
        }
    }

    return { success: true, user: currentUser };
}

function logout() {
    currentUser = null;
    try {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {}
    actualizarUIUsuario();
    aplicarRestriccionesRBAC();
    abrirModalLogin(true);
    if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
        window.POS_MODULE.showToast('Sesion cerrada correctamente. Ingrese credenciales para continuar.', 'info');
    }
}

// -----------------------------------------------------------------------------
// 4. CONTROL DE ACCESO BASADO EN ROLES (RBAC) & PERMISOS REGLAMENTARIOS
// -----------------------------------------------------------------------------

function getNormalizedRole() {
    if (!currentUser) return null;
    const r = currentUser.rol ? currentUser.rol.toUpperCase() : '';
    if (r === 'CAJERO' || r === 'USUARIO') return 'USUARIO';
    return r;
}

function hasRole(rolesPermitidos) {
    const rolActual = getNormalizedRole();
    if (!rolActual) return false;

    if (Array.isArray(rolesPermitidos)) {
        const norm = rolesPermitidos.map(r => (r === 'CAJERO' ? 'USUARIO' : r.toUpperCase()));
        return norm.includes(rolActual);
    }
    const checkRole = (rolesPermitidos === 'CAJERO') ? 'USUARIO' : rolesPermitidos.toUpperCase();
    return rolActual === checkRole;
}

function canAccessTab(tabId) {
    if (!currentUser) return false;
    const rol = getNormalizedRole();

    if (rol === 'ADMINISTRADOR') {
        // Administrador tiene acceso total, enfocado en perfiles y contraseñas
        return true;
    }

    if (rol === 'SUPERVISOR') {
        // Supervisor accede a POS, Inventario, Caja, Reportes y Documentacion/Manuales
        return ['tab-pos', 'tab-inventario', 'tab-caja', 'tab-reportes', 'tab-documentacion'].includes(tabId);
    }

    if (rol === 'USUARIO') {
        // Usuario / Cajero accede a POS, Inventario (solo consulta), Caja (sin cortes) y Documentacion/Manuales
        return ['tab-pos', 'tab-inventario', 'tab-caja', 'tab-documentacion'].includes(tabId);
    }

    return false;
}

function canManageProducts() {
    if (!currentUser) return false;
    const rol = getNormalizedRole();
    // Cajeros NO pueden dar de alta ni modificar productos. Solo Supervisor y Administrador.
    return rol === 'SUPERVISOR' || rol === 'ADMINISTRADOR';
}

function canManageMasters() {
    if (!currentUser) return false;
    const rol = getNormalizedRole();
    // Cajeros NO pueden dar de alta categorías ni marcas. Solo Supervisor y Administrador.
    return rol === 'SUPERVISOR' || rol === 'ADMINISTRADOR';
}

function canPerformCashCut() {
    if (!currentUser) return false;
    const rol = getNormalizedRole();
    // Cajeros NO pueden hacer cortes de caja. "Solo el supervisor" (y admin por jerarquía).
    return rol === 'SUPERVISOR' || rol === 'ADMINISTRADOR';
}

function canManageUsersAndPasswords() {
    if (!currentUser) return false;
    const rol = getNormalizedRole();
    // "El perfil de administrador estará destinado a la administración de los perfiles y contraseñas"
    return rol === 'ADMINISTRADOR';
}

function canProcessReturns() {
    const rol = getNormalizedRole();
    return rol === 'SUPERVISOR' || rol === 'ADMINISTRADOR';
}

function aplicarRestriccionesRBAC() {
    const rol = getNormalizedRole();

    // 1. Pestañas de Navegación Principal
    const tabReportesBtn = document.querySelector('button[data-tab="tab-reportes"]');
    const tabConfigBtn = document.querySelector('button[data-tab="tab-configuracion"]');

    if (tabReportesBtn) {
        tabReportesBtn.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
    }

    if (tabConfigBtn) {
        // Solo el Administrador accede a la configuración y gestión de perfiles y contraseñas
        tabConfigBtn.style.display = (rol === 'ADMINISTRADOR') ? '' : 'none';
        tabConfigBtn.textContent = 'Perfiles y Contraseñas';
    }

    // 2. Restricciones en Almacén e Inventario
    const btnNuevoProducto = document.getElementById('btn-inv-nuevo-producto');
    if (btnNuevoProducto) {
        btnNuevoProducto.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
    }

    const btnSincronizar = document.getElementById('btn-inv-sincronizar');
    if (btnSincronizar) {
        btnSincronizar.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
    }

    // Sub-pestañas de inventario: Cajero solo ve Catálogo y Existencias
    const subtabsRestringidas = [
        'subtab-inv-masters',
        'subtab-inv-entradas',
        'subtab-inv-mermas',
        'subtab-inv-kardex',
        'subtab-inv-import-export'
    ];
    subtabsRestringidas.forEach(subtabKey => {
        const btnSub = document.querySelector('button[data-subtab="' + subtabKey + '"]');
        if (btnSub) {
            btnSub.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
        }
    });

    // Columnas de costo de compra en catálogo de inventario (ocultas para cajero)
    const costoHeaders = document.querySelectorAll('.th-costo-compra, .td-costo-compra');
    costoHeaders.forEach(el => {
        el.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
    });

    // KPI de valorización en inventario (oculto para cajero)
    const kpiValorizacion = document.getElementById('stat-total-value');
    if (kpiValorizacion && kpiValorizacion.parentElement) {
        kpiValorizacion.parentElement.style.display = (rol === 'USUARIO' || !rol) ? 'none' : '';
    }

    // 3. Restricciones en Control de Caja: Corte Z exclusivo para Supervisor
    const btnCorteZ = document.getElementById('btn-ejecutar-corte-z');
    const btnCuadreExacto = document.getElementById('btn-cuadre-exacto');
    const inputContado = document.getElementById('input-arqueo-contado');
    const avisoCorteCajero = document.getElementById('aviso-corte-cajero');

    if (rol === 'USUARIO' || !rol) {
        if (btnCorteZ) btnCorteZ.style.display = 'none';
        if (btnCuadreExacto) btnCuadreExacto.style.display = 'none';
        if (inputContado) {
            inputContado.disabled = true;
            inputContado.placeholder = 'Corte restringido a Supervisor';
        }
        if (avisoCorteCajero) avisoCorteCajero.style.display = 'block';
    } else {
        if (btnCorteZ) btnCorteZ.style.display = '';
        if (btnCuadreExacto) btnCuadreExacto.style.display = '';
        if (inputContado) {
            inputContado.disabled = false;
            inputContado.placeholder = '0.00';
        }
        if (avisoCorteCajero) avisoCorteCajero.style.display = 'none';
    }

    // Control de Devoluciones y Cambios de Mercancia (Exclusivo Supervisor y Admin)
    const btnDevolucionCambio = document.getElementById('btn-devolucion-cambio');
    const puedeDevolver = canProcessReturns();
    if (btnDevolucionCambio) {
        btnDevolucionCambio.style.display = puedeDevolver ? '' : 'none';
    }

    // 4. Sección de Administración de Perfiles y Contraseñas (solo Administrador)
    const secUsuarios = document.getElementById('sec-admin-usuarios');
    if (secUsuarios) {
        secUsuarios.style.display = (rol === 'ADMINISTRADOR') ? 'block' : 'none';
    }

    // 5. Refrescar tablas visuales dependientes de permisos
    if (window.INVENTORY_MODULE && typeof window.INVENTORY_MODULE.reloadCatalogTable === 'function') {
        const invSec = document.getElementById('tab-inventario');
        if (invSec && invSec.classList.contains('active')) {
            window.INVENTORY_MODULE.reloadCatalogTable();
        }
    }
}

// -----------------------------------------------------------------------------
// 5. ACTUALIZACIÓN DE INTERFAZ Y MODAL DE LOGIN
// -----------------------------------------------------------------------------

function actualizarUIUsuario() {
    const userDisplay = document.getElementById('header-user-display');
    const btnCerrarSesion = document.getElementById('btn-header-logout');

    if (!currentUser) {
        if (userDisplay) {
            userDisplay.innerHTML = '<span style="color: #cbd5e1;">Sin sesión activa</span>';
        }
        if (btnCerrarSesion) btnCerrarSesion.style.display = 'none';
        return;
    }

    const rolNorm = getNormalizedRole();
    let badgeClass = 'role-badge-usuario';
    let rolDisplay = 'USUARIO';

    if (rolNorm === 'ADMINISTRADOR') {
        badgeClass = 'role-badge-administrador';
        rolDisplay = 'ADMINISTRADOR';
    } else if (rolNorm === 'SUPERVISOR') {
        badgeClass = 'role-badge-supervisor';
        rolDisplay = 'SUPERVISOR';
    }

    if (userDisplay) {
        userDisplay.innerHTML = 
            '<span style="font-weight: 700; color: #ffffff;">' + escapeHTML(currentUser.nombre_completo) + '</span> ' +
            '<span class="role-badge ' + badgeClass + '">[' + rolDisplay + ']</span>';
    }

    if (btnCerrarSesion) btnCerrarSesion.style.display = '';

    const cajeroLabel = document.getElementById('cash-cashier-name');
    if (cajeroLabel) {
        cajeroLabel.textContent = currentUser.nombre_completo;
    }

    renderTablaUsuarios();
}

function abrirModalLogin(mandatory = false) {
    const modal = document.getElementById('modal-login');
    if (!modal) return;

    modal.classList.add('active');
    modal.style.display = 'flex';

    const isMandatory = mandatory || !currentUser;
    if (isMandatory) {
        modal.setAttribute('data-mandatory', 'true');
    } else {
        modal.removeAttribute('data-mandatory');
    }

    const closeBtn = modal.querySelector('.btn-modal-close');
    if (closeBtn) closeBtn.style.display = isMandatory ? 'none' : '';

    const cancelBtn = modal.querySelector('.modal-dialog-footer .btn-secondary');
    if (cancelBtn) cancelBtn.style.display = isMandatory ? 'none' : '';

    const userInput = document.getElementById('login-username');
    if (userInput) {
        userInput.value = '';
        userInput.focus();
    }
    const passInput = document.getElementById('login-password');
    if (passInput) passInput.value = '';

    const alertBox = document.getElementById('login-alert');
    if (alertBox) {
        alertBox.style.display = 'none';
        alertBox.textContent = '';
    }
}

function cerrarModalLogin() {
    if (!currentUser) {
        // Bloquear cierre si no hay sesion activa
        return;
    }
    const modal = document.getElementById('modal-login');
    if (modal) {
        modal.classList.remove('active');
        modal.removeAttribute('data-mandatory');
        modal.style.display = '';
    }
}

async function handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const userInput = document.getElementById('login-username');
    const passInput = document.getElementById('login-password');
    const alertBox = document.getElementById('login-alert');

    const username = userInput ? userInput.value : '';
    const password = passInput ? passInput.value : '';

    const res = await login(username, password);
    if (!res.success) {
        if (alertBox) {
            alertBox.textContent = res.message;
            alertBox.style.display = 'block';
        }
    } else {
        if (alertBox) alertBox.style.display = 'none';
    }
}

// -----------------------------------------------------------------------------
// 6. GESTIÓN DE PERFILES Y CONTRASEÑAS (SOLO ADMINISTRADOR)
// -----------------------------------------------------------------------------

async function renderTablaUsuarios() {
    const tbody = document.getElementById('tabla-usuarios-tbody');
    if (!tbody) return;

    const usuarios = await window.POS_DB.getUsuarios();
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 16px; color: var(--color-slate-light);">No hay perfiles registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = usuarios.map(u => {
        const rolU = (u.rol === 'CAJERO') ? 'USUARIO' : u.rol;
        let badgeClass = 'role-badge-usuario';
        if (rolU === 'ADMINISTRADOR') badgeClass = 'role-badge-administrador';
        if (rolU === 'SUPERVISOR') badgeClass = 'role-badge-supervisor';

        const estadoClass = u.activo ? 'status-pill-ok' : 'status-pill-danger';
        const estadoText = u.activo ? 'Activo' : 'Inactivo';
        const ultimoAcceso = u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin ingresos';
        
        const esUsuarioSesion = currentUser && currentUser.id_usuario === u.id_usuario;
        const btnEliminar = esUsuarioSesion 
            ? '<span style="font-size: 0.72rem; color: var(--color-slate-light);">(Sesión activa)</span>'
            : '<button type="button" class="btn-table-action btn-danger" style="background: #ef4444; color: white;" onclick="window.AUTH_MODULE.eliminarUsuario(' + u.id_usuario + ')">Eliminar</button>';

        return (
            '<tr>' +
                '<td><b>' + escapeHTML(u.username) + '</b></td>' +
                '<td>' + escapeHTML(u.nombre_completo) + '</td>' +
                '<td><span class="role-badge ' + badgeClass + '">[' + rolU + ']</span></td>' +
                '<td><span class="' + estadoClass + '">' + estadoText + '</span></td>' +
                '<td style="font-size: 0.76rem; color: var(--color-slate-light);">' + ultimoAcceso + '</td>' +
                '<td class="text-center" style="white-space: nowrap;">' +
                    '<button type="button" class="btn-table-action" style="background: #0284c7; color: white; margin-right: 4px;" onclick="window.AUTH_MODULE.abrirModalEditarUsuario(' + u.id_usuario + ')">Editar / Clave</button>' +
                    btnEliminar +
                '</td>' +
            '</tr>'
        );
    }).join('');
}

async function abrirModalNuevoUsuario() {
    if (!canManageUsersAndPasswords()) {
        alert('Acceso restringido: Solo el Administrador puede gestionar perfiles y contraseñas.');
        return;
    }

    const modal = document.getElementById('modal-usuario-form');
    const form = document.getElementById('form-usuario');
    if (!modal || !form) return;

    document.getElementById('modal-usuario-title').textContent = 'Nuevo Perfil de Usuario';
    document.getElementById('user-id').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-username').removeAttribute('readonly');
    document.getElementById('user-nombre').value = '';
    document.getElementById('user-rol').value = 'USUARIO';
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').setAttribute('required', 'required');
    document.getElementById('user-password-hint').style.display = 'none';
    document.getElementById('user-activo').checked = true;

    modal.classList.add('active');
    modal.style.display = 'flex';
}

async function abrirModalEditarUsuario(idUsuario) {
    if (!canManageUsersAndPasswords()) {
        alert('Acceso restringido: Solo el Administrador puede gestionar perfiles y contraseñas.');
        return;
    }

    const modal = document.getElementById('modal-usuario-form');
    if (!modal) return;

    const u = await window.POS_DB.getUsuarioPorId(idUsuario);
    if (!u) return;

    document.getElementById('modal-usuario-title').textContent = 'Editar Perfil y Contraseña: ' + u.username;
    document.getElementById('user-id').value = u.id_usuario;
    document.getElementById('user-username').value = u.username;
    document.getElementById('user-username').setAttribute('readonly', 'readonly');
    document.getElementById('user-nombre').value = u.nombre_completo;
    document.getElementById('user-rol').value = (u.rol === 'CAJERO') ? 'USUARIO' : u.rol;
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').removeAttribute('required');
    document.getElementById('user-password-hint').style.display = 'block';
    document.getElementById('user-activo').checked = Boolean(u.activo);

    modal.classList.add('active');
    modal.style.display = 'flex';
}

async function handleUsuarioFormSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!canManageUsersAndPasswords()) {
        alert('Acceso denegado: Operación exclusiva del perfil Administrador.');
        return;
    }

    const id = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value.trim().toLowerCase();
    const nombre = document.getElementById('user-nombre').value.trim();
    const rol = document.getElementById('user-rol').value;
    const password = document.getElementById('user-password').value;
    const activo = document.getElementById('user-activo').checked ? 1 : 0;

    if (!username || !nombre || !rol) {
        alert('Complete todos los campos obligatorios del perfil.');
        return;
    }

    if (!id && !password) {
        alert('Debe especificar una contraseña para el nuevo perfil.');
        return;
    }

    const userData = {
        username,
        nombre_completo: nombre,
        rol,
        activo
    };

    if (id) {
        userData.id_usuario = parseInt(id, 10);
    }

    if (password && password.trim().length > 0) {
        if (password.trim().length < 6) {
            alert('Por politica de seguridad, la contrasena debe tener al menos 6 caracteres.');
            return;
        }
        const salt = generarSalt();
        const hash = await encriptarPassword(password.trim(), salt);
        userData.salt = salt;
        userData.password_hash = hash;
    }

    await window.POS_DB.guardarUsuario(userData);

    if (currentUser && currentUser.id_usuario === userData.id_usuario) {
        currentUser = { ...currentUser, ...userData };
        guardarSesion(currentUser);
        actualizarUIUsuario();
        aplicarRestriccionesRBAC();
    }

    const modal = document.getElementById('modal-usuario-form');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = '';
    }

    await renderTablaUsuarios();
    if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
        window.POS_MODULE.showToast('Perfil guardado exitosamente con cifrado SHA-256.', 'success');
    }
}

async function eliminarUsuario(idUsuario) {
    if (!canManageUsersAndPasswords()) {
        alert('Acceso restringido: Solo el Administrador puede eliminar perfiles.');
        return;
    }

    if (currentUser && currentUser.id_usuario === parseInt(idUsuario, 10)) {
        alert('No es posible eliminar el perfil que tiene la sesión activa.');
        return;
    }

    if (!confirm('¿Confirma que desea eliminar este perfil del sistema? Esta acción no se puede deshacer.')) {
        return;
    }

    await window.POS_DB.eliminarUsuario(idUsuario);
    await renderTablaUsuarios();
    if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
        window.POS_MODULE.showToast('Perfil eliminado correctamente.', 'info');
    }
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
window.AUTH_MODULE = {
    initAuth,
    login,
    logout,
        getCurrentUser,
    getNormalizedRole,
    hasRole,
    canAccessTab,
    canManageProducts,
    canManageMasters,
    canPerformCashCut,
    canProcessReturns,
    canManageUsersAndPasswords,
    aplicarRestriccionesRBAC,
    abrirModalLogin,
    cerrarModalLogin,
    handleLoginSubmit,
    renderTablaUsuarios,
    abrirModalNuevoUsuario,
    abrirModalEditarUsuario,
    handleUsuarioFormSubmit,
    eliminarUsuario,
    sha256,
    encriptarPassword
};

Object.freeze(window.AUTH_MODULE);
