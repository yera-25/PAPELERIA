// ================= PROTECCION CONTRA ATAQUES DE CLICKJACKING (FRAMEBUSTING) =================
(function() {
    if (window.top !== window.self) {
        try {
            window.top.location = window.self.location;
        } catch (e) {
            document.documentElement.style.display = 'none';
            throw new Error('[Seguridad] Acceso embebido no autorizado. El sistema no permite ser cargado dentro de iframes para prevenir ataques de Clickjacking (UI Redressing).');
        }
    }
})();

/**
 * app.js - Orquestador Global del Sistema Unificado POS & Almacén
 * PAPELERÍA A B C — Entregable Unificado y Progresivo
 */

// ================= GESTOR UNIVERSAL DE VENTANAS EMERGENTES Y MODALES =================
function closeAllModals() {
    const isAuth = window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser();
    const activeModals = document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"]');
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        // Si no hay sesión activa, preservar modal-login abierto obligatoriamente
        if (modal.id === 'modal-login' && !isAuth) {
            return;
        }
        modal.classList.remove('active');
        modal.style.display = '';
    });
    if (isAuth && window.POS_MODULE && typeof window.POS_MODULE.focusScanner === 'function') {
        window.POS_MODULE.focusScanner();
    }
}
window.closeAllModals = closeAllModals;
window.closeModal = closeAllModals;

function cerrarTicketPreview() {
    const modal = document.getElementById('modal-ticket-preview');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = '';
    }
    const remaining = document.querySelectorAll('.modal-overlay.active');
    if (remaining.length === 0) {
        if (window.POS_MODULE && typeof window.POS_MODULE.focusScanner === 'function') {
            window.POS_MODULE.focusScanner();
        }
    }
}
window.cerrarTicketPreview = cerrarTicketPreview;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Reloj en vivo
    startLiveClock();

    // 2. Activar navegación de pestañas principales y sub-pestañas INMEDIATAMENTE
    // para que la interfaz NUNCA se congele ni bloquee los clics del usuario
    setupMainTabNavigation();
    setupInventorySubTabNavigation();

    // 3. Activar manejador universal de modales (clic en X, cancelar, clic fuera y Escape)
    setupGlobalModalHandlers();

    // 4. Inicializar base de datos IndexedDB / SQL Store
    try {
        await window.POS_DB.initDB();
        console.log('[App] Base de datos PapeleriaABC_POS_DB inicializada correctamente.');
    } catch (err) {
        console.error('[App] Error inicializando base de datos:', err);
    }

    // 5. Inicializar submódulos de forma aislada y tolerante a fallos
    const initModuleSafely = async (name, fn) => {
        try {
            if (fn) await fn();
        } catch (e) {
            console.error(`[App] Error inicializando submódulo ${name}:`, e);
        }
    };

    if (window.AUTH_MODULE) {
        await initModuleSafely('Seguridad', () => window.AUTH_MODULE.initAuth());
    }
    if (window.POS_MODULE) {
        window.POS_MODULE.closeAllModals = closeAllModals;
        await initModuleSafely('POS', () => window.POS_MODULE.initPOS());
    }
    if (window.INVENTORY_MODULE) {
        window.INVENTORY_MODULE.closeAllModals = closeAllModals;
        await initModuleSafely('Inventario', () => window.INVENTORY_MODULE.initInventoryModule());
    }
    if (window.MASTERS_MODULE) {
        window.MASTERS_MODULE.closeAllModals = closeAllModals;
        await initModuleSafely('Maestros', () => window.MASTERS_MODULE.initMastersModule());
    }
    if (window.MOVEMENTS_MODULE) await initModuleSafely('Movimientos', () => window.MOVEMENTS_MODULE.initMovementsModule());
    if (window.CASH_MODULE) await initModuleSafely('Caja', () => window.CASH_MODULE.initCash());
    if (window.REPORTS_MODULE) await initModuleSafely('Reportes', () => window.REPORTS_MODULE.initReportsModule());
});

// Manejador global e infalible de cierre de ventanas emergentes (Modales)
function setupGlobalModalHandlers() {
    // A) Delegación de clics: botón X (.btn-modal-close), botón Cancelar (.btn-secondary dentro de modal), y clic fuera en el fondo oscuro
    document.addEventListener('click', (e) => {
        // Clic en botón cerrar o cancelar del modal de ticket específicamente (mantiene el historial abierto)
        if (e.target.closest('#modal-ticket-preview .btn-modal-close') || 
            e.target.closest('#modal-ticket-preview .modal-dialog-footer .btn-secondary') ||
            e.target.closest('#modal-ticket-preview [data-action="close"]')) {
            e.preventDefault();
            cerrarTicketPreview();
            return;
        }

        // Clic en el telón de fondo oscuro de modal-ticket-preview
        if (e.target.id === 'modal-ticket-preview') {
            e.preventDefault();
            cerrarTicketPreview();
            return;
        }

        // Clic en la cruz de cierre (X) general
        if (e.target.closest('.btn-modal-close')) {
            e.preventDefault();
            closeAllModals();
            return;
        }

        // Clic en botones "Cancelar" o "Cerrar" dentro del pie de cualquier modal
        const modalFooterCancelBtn = e.target.closest('.modal-dialog-footer .btn-secondary, .modal-dialog-box button[data-action="close"]');
        if (modalFooterCancelBtn) {
            e.preventDefault();
            closeAllModals();
            return;
        }

        // Clic en el telón de fondo oscuro exterior (fuera de la caja modal-dialog-box)
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target.id === 'modal-login' && (!window.AUTH_MODULE || !window.AUTH_MODULE.getCurrentUser())) {
                return; // Bloqueante obligatorio
            }
            e.preventDefault();
            closeAllModals();
            return;
        }
    });

    // B) Tecla ESCAPE: si el ticket está abierto sobre otro modal (ej. historial), cerrar solo el ticket primero
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const isAuth = window.AUTH_MODULE && window.AUTH_MODULE.getCurrentUser();
            const ticketModal = document.getElementById('modal-ticket-preview');
            if (ticketModal && ticketModal.classList.contains('active')) {
                e.preventDefault();
                cerrarTicketPreview();
                return;
            }

            const hasOpenModal = document.querySelector('.modal-overlay.active');
            if (hasOpenModal) {
                if (hasOpenModal.id === 'modal-login' && !isAuth) {
                    return; // Login obligatorio no se descarta con Esc
                }
                e.preventDefault();
                closeAllModals();
            }
        }
    });
}

// Reloj en vivo
function startLiveClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;

    const updateTime = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
}

// Navegación de pestañas principales (Mostrador POS, Almacén e Inventario, Caja, Configuración)
function setupMainTabNavigation() {
    const navButtons = document.querySelectorAll('.header-center-nav .nav-tab-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Validación de RBAC antes de cambiar de sección
            if (window.AUTH_MODULE && typeof window.AUTH_MODULE.canAccessTab === 'function') {
                if (!window.AUTH_MODULE.canAccessTab(targetTab)) {
                    if (window.POS_MODULE && typeof window.POS_MODULE.showToast === 'function') {
                        window.POS_MODULE.showToast('Acceso restringido: Esta sección requiere perfil de Supervisor o Administrador.', 'warning');
                    }
                    return;
                }
            }

            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.app-tab-section').forEach(sec => sec.classList.remove('active'));

            btn.classList.add('active');
            const targetSec = document.getElementById(targetTab);
            if (targetSec) targetSec.classList.add('active');

            // Acciones reactivas al cambiar de pestaña principal
            if (targetTab === 'tab-pos') {
                if (window.POS_MODULE) window.POS_MODULE.reloadCatalog();
            } else if (targetTab === 'tab-inventario') {
                if (window.INVENTORY_MODULE) window.INVENTORY_MODULE.reloadCatalogTable();
            } else if (targetTab === 'tab-caja') {
                if (window.CASH_MODULE) window.CASH_MODULE.renderCashDashboard();
            } else if (targetTab === 'tab-reportes') {
                if (window.REPORTS_MODULE) window.REPORTS_MODULE.cargarReportes();
            } else if (targetTab === 'tab-configuracion') {
                if (window.AUTH_MODULE) window.AUTH_MODULE.renderTablaUsuarios();
            } else if (targetTab === 'tab-documentacion') {
                if (window.DOCUMENTATION_MODULE) window.DOCUMENTATION_MODULE.init();
            }
        });
    });
}

// Navegación de sub-pestañas internas del módulo de almacén
function setupInventorySubTabNavigation() {
    const subTabButtons = document.querySelectorAll('.subtab-btn');
    subTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubTab = btn.getAttribute('data-subtab');

            subTabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.inventory-subtab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(targetSubTab);
            if (targetPane) targetPane.classList.add('active');

            // Recargas específicas
            if (targetSubTab === 'subtab-inv-catalogo') {
                if (window.INVENTORY_MODULE) window.INVENTORY_MODULE.reloadCatalogTable();
            } else if (targetSubTab === 'subtab-inv-masters') {
                if (window.MASTERS_MODULE) window.MASTERS_MODULE.reloadMasters();
            } else if (targetSubTab === 'subtab-inv-entradas' || targetSubTab === 'subtab-inv-mermas') {
                if (window.MOVEMENTS_MODULE) window.MOVEMENTS_MODULE.populateProductSelectors();
            } else if (targetSubTab === 'subtab-inv-kardex') {
                if (window.MOVEMENTS_MODULE) window.MOVEMENTS_MODULE.reloadKardexTable();
            }
        });
    });
}


window.cambiarPestanaPrincipal = function(tabId) {
    document.querySelectorAll('.header-center-nav .nav-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.app-tab-section').forEach(sec => sec.classList.remove('active'));

    const btn = document.querySelector('.header-center-nav .nav-tab-btn[data-tab="' + tabId + '"]');
    if (btn) btn.classList.add('active');

    const targetSec = document.getElementById(tabId);
    if (targetSec) targetSec.classList.add('active');

    if (tabId === 'tab-documentacion') {
        if (window.DOCUMENTATION_MODULE) window.DOCUMENTATION_MODULE.init();
    } else if (tabId === 'tab-pos') {
        if (window.POS_MODULE) window.POS_MODULE.reloadCatalog();
    } else if (tabId === 'tab-inventario') {
        if (window.INVENTORY_MODULE) window.INVENTORY_MODULE.reloadCatalogTable();
    } else if (tabId === 'tab-caja') {
        if (window.CASH_MODULE) window.CASH_MODULE.renderCashDashboard();
    } else if (tabId === 'tab-reportes') {
        if (window.REPORTS_MODULE) window.REPORTS_MODULE.cargarReportes();
    } else if (tabId === 'tab-configuracion') {
        if (window.AUTH_MODULE) window.AUTH_MODULE.renderTablaUsuarios();
    }
};
