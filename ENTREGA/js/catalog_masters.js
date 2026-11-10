/**
 * catalog_masters.js - Administración de Marcas, Categorías y Unidades
 * Papelería A B C — Entregable Unificado
 */

let marcasCache = [];
let categoriasCache = [];

async function initMastersModule() {
    await reloadMasters();
}

async function reloadMasters() {
    marcasCache = await window.POS_DB.getMarcas();
    categoriasCache = await window.POS_DB.getCategorias();

    renderMarcasTable(marcasCache);
    renderCategoriasTable(categoriasCache);
}

// -------------------------------------------------------------
// GESTIÓN DE MARCAS
// -------------------------------------------------------------

function renderMarcasTable(marcas) {
    const tbody = document.getElementById('marcas-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    marcas.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${escapeHTML(m.nombre)}</b></td>
            <td><span class="badge-tag">${escapeHTML(m.pais || 'N/A')}</span></td>
            <td><small class="text-muted">${escapeHTML(m.descripcion || '—')}</small></td>
            <td class="text-center">
                <button class="btn-table-action btn-edit" title="Editar marca" onclick="window.MASTERS_MODULE.openMarcaModal(${m.id_marca})">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openMarcaModal(idMarca = null) {
    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageMasters()) {
        alert('Acceso restringido: Los cajeros no tienen autorización para dar de alta ni modificar marcas. Operación exclusiva de Supervisor.');
        return;
    }
    const modal = document.getElementById('modal-marca-form');
    const title = document.getElementById('modal-marca-title');
    const form = document.getElementById('form-marca');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('marca-id').value = '';

    if (idMarca) {
        const marca = marcasCache.find(m => m.id_marca === idMarca);
        if (!marca) return;
        title.textContent = `Editar Marca: ${marca.nombre}`;
        document.getElementById('marca-id').value = marca.id_marca;
        document.getElementById('marca-nombre').value = marca.nombre;
        document.getElementById('marca-pais').value = marca.pais || '';
        document.getElementById('marca-descripcion').value = marca.descripcion || '';
    } else {
        title.textContent = 'Nueva Marca para Papelería A B C';
    }

    modal.classList.add('active');
}

async function handleMarcaFormSubmit(e) {
    if (e) e.preventDefault();

    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageMasters()) {
        alert('Acceso denegado: Operación exclusiva de Supervisor.');
        return;
    }

    const id = document.getElementById('marca-id').value;
    const nombre = document.getElementById('marca-nombre').value.trim();
    const pais = document.getElementById('marca-pais').value.trim();
    const descripcion = document.getElementById('marca-descripcion').value.trim();

    if (!nombre) {
        alert('El nombre de la marca es obligatorio.');
        return;
    }

    const marcaData = { nombre, pais, descripcion };
    if (id) marcaData.id_marca = parseInt(id);

    try {
        await window.POS_DB.guardarMarca(marcaData);
        window.INVENTORY_MODULE.closeAllModals();
        window.INVENTORY_MODULE.showToast('Marca guardada correctamente', 'success');
        await reloadMasters();
        await window.INVENTORY_MODULE.reloadCatalogTable();
    } catch (err) {
        alert('Error al guardar marca: ' + err.message);
    }
}

// -------------------------------------------------------------
// GESTIÓN DE CATEGORÍAS
// -------------------------------------------------------------

function renderCategoriasTable(categorias) {
    const tbody = document.getElementById('categorias-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    categorias.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${escapeHTML(c.nombre)}</b></td>
            <td><small class="text-muted">${escapeHTML(c.descripcion || '—')}</small></td>
            <td class="text-center">
                <button class="btn-table-action btn-edit" title="Editar categoría" onclick="window.MASTERS_MODULE.openCategoriaModal(${c.id_categoria})">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openCategoriaModal(idCategoria = null) {
    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageMasters()) {
        alert('Acceso restringido: Los cajeros no tienen autorización para dar de alta ni modificar categorías. Operación exclusiva de Supervisor.');
        return;
    }
    const modal = document.getElementById('modal-categoria-form');
    const title = document.getElementById('modal-categoria-title');
    const form = document.getElementById('form-categoria');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('cat-id').value = '';

    if (idCategoria) {
        const cat = categoriasCache.find(c => c.id_categoria === idCategoria);
        if (!cat) return;
        title.textContent = `Editar Categoría: ${cat.nombre}`;
        document.getElementById('cat-id').value = cat.id_categoria;
        document.getElementById('cat-nombre').value = cat.nombre;
        document.getElementById('cat-descripcion').value = cat.descripcion || '';
    } else {
        title.textContent = 'Nueva Categoría de Artículos';
    }

    modal.classList.add('active');
}

async function handleCategoriaFormSubmit(e) {
    if (e) e.preventDefault();

    if (window.AUTH_MODULE && !window.AUTH_MODULE.canManageMasters()) {
        alert('Acceso denegado: Operación exclusiva de Supervisor.');
        return;
    }

    const id = document.getElementById('cat-id').value;
    const nombre = document.getElementById('cat-nombre').value.trim();
    const descripcion = document.getElementById('cat-descripcion').value.trim();

    if (!nombre) {
        alert('El nombre de la categoría es obligatorio.');
        return;
    }

    const catData = { nombre, descripcion };
    if (id) catData.id_categoria = parseInt(id);

    try {
        await window.POS_DB.guardarCategoria(catData);
        window.INVENTORY_MODULE.closeAllModals();
        window.INVENTORY_MODULE.showToast('Categoría guardada correctamente', 'success');
        await reloadMasters();
        await window.INVENTORY_MODULE.reloadCatalogTable();
    } catch (err) {
        alert('Error al guardar categoría: ' + err.message);
    }
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

window.MASTERS_MODULE = {
    initMastersModule,
    reloadMasters,
    openMarcaModal,
    handleMarcaFormSubmit,
    openCategoriaModal,
    handleCategoriaFormSubmit
};
