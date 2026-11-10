/**
 * import_export.js - Exportación e Importación de Catálogos en CSV y JSON (RF-06 / RNF-06)
 * Papelería A B C — Entregable Unificado
 */

// Exportar catálogo de productos a archivo CSV con BOM UTF-8 (compatible con Microsoft Excel)
async function exportarCatalogoCSV() {
    try {
        const productos = await window.POS_DB.getProductosCompletos();
        const headers = ['id_producto', 'codigo_barras', 'sku', 'nombre', 'categoria', 'marca', 'unidad', 'precio_compra', 'precio_venta_menudeo', 'precio_venta_mayoreo', 'stock_actual', 'stock_minimo', 'es_servicio', 'permite_desglose'];

        let csvContent = '\uFEFF'; // BOM para soporte de acentos en Microsoft Excel
        csvContent += headers.join(',') + '\r\n';

        productos.forEach(p => {
            const row = [
                p.id_producto,
                `"${p.codigo_barras}"`,
                `"${p.sku}"`,
                `"${p.nombre.replace(/"/g, '""')}"`,
                `"${p.categoria_nombre}"`,
                `"${p.marca_nombre}"`,
                `"${p.unidad_nombre}"`,
                p.precio_compra.toFixed(2),
                p.precio_venta_menudeo.toFixed(2),
                (p.precio_venta_mayoreo || p.precio_venta_menudeo).toFixed(2),
                p.stock_actual,
                p.stock_minimo,
                p.es_servicio ? 1 : 0,
                p.permite_desglose ? 1 : 0
            ];
            csvContent += row.join(',') + '\r\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fechaStr = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `Catalogo_Papeleria_ABC_${fechaStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        window.INVENTORY_MODULE.showToast('Catálogo CSV exportado correctamente', 'success');
    } catch (err) {
        alert('Error al exportar CSV: ' + err.message);
    }
}

// Descargar plantilla muestra CSV para importación masiva
function descargarPlantillaCSV() {
    const headers = ['codigo_barras', 'sku', 'nombre', 'id_categoria', 'id_marca', 'id_unidad', 'precio_compra', 'precio_venta_menudeo', 'stock_actual', 'stock_minimo'];
    const ejemplo = ['7501234567890', 'EJEM-SC-01', 'Cuaderno Profesional Raya Ejemplo', '1', '1', '1', '22.00', '35.00', '25', '5'];

    let content = '\uFEFF' + headers.join(',') + '\r\n' + ejemplo.join(',') + '\r\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Importar_Productos_Papeleria_ABC.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Importar catálogo desde archivo CSV seleccionado
function handleCSVFileInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        try {
            const text = evt.target.result;
            const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) {
                alert('El archivo CSV está vacío o no contiene filas de datos.');
                return;
            }

            let importadosCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
                if (values.length < 5) continue;

                const productoObj = {
                    codigo_barras: values[0] || 'GEN-' + Date.now().toString().slice(-6),
                    sku: values[1] || 'SKU-' + Date.now().toString().slice(-4),
                    nombre: values[2] || 'Producto Importado',
                    id_categoria: parseInt(values[3]) || 1,
                    id_marca: parseInt(values[4]) || 1,
                    id_unidad: parseInt(values[5]) || 1,
                    precio_compra: parseFloat(values[6]) || 0,
                    precio_venta_menudeo: parseFloat(values[7]) || 1,
                    precio_venta_mayoreo: parseFloat(values[7]) || 1,
                    stock_actual: parseFloat(values[8]) || 0,
                    stock_minimo: parseFloat(values[9]) || 3,
                    es_servicio: false,
                    permite_desglose: false,
                    descripcion: 'Importado vía archivo CSV'
                };

                await window.POS_DB.guardarProducto(productoObj);
                importadosCount++;
            }

            window.INVENTORY_MODULE.showToast(`Se importaron exitosamente ${importadosCount} productos.`, 'success');
            await window.INVENTORY_MODULE.reloadCatalogTable();
            await window.MOVEMENTS_MODULE.populateProductSelectors();
            if (window.POS_MODULE) await window.POS_MODULE.reloadCatalog();
        } catch (err) {
            alert('Error procesando el archivo CSV: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// Exportar base de datos completa a JSON (Respaldo en 1-Clic - RNF-06)
async function exportarRespaldoJSON() {
    try {
        const db = await window.POS_DB.initDB();
        const stores = [
            'configuracion_negocio', 'categorias', 'marcas', 'unidades_medida',
            'proveedores', 'productos', 'entradas_mercancia', 'mermas',
            'kardex_movimientos', 'conversiones_empaque', 'ventas', 'detalle_ventas', 'turnos_caja'
        ];
        const backupData = {
            sistema: 'Sistema POS y Gestión Papelería A B C',
            modulo: 'Entregable Unificado (Fase 1 a 4)',
            fecha_respaldo: new Date().toISOString(),
            data: {}
        };

        const tx = db.transaction(stores, 'readonly');
        stores.forEach(sName => {
            const req = tx.objectStore(sName).getAll();
            req.onsuccess = () => { backupData.data[sName] = req.result; };
        });

        tx.oncomplete = () => {
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const fechaStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `Respaldo_Total_Papeleria_ABC_${fechaStr}.json`;
            a.click();
            URL.revokeObjectURL(url);
            window.INVENTORY_MODULE.showToast('Respaldo Snapshot descargado exitosamente (1-Clic)', 'success');
        };
    } catch (err) {
        alert('Error al exportar respaldo JSON: ' + err.message);
    }
}

window.IMPORT_EXPORT_MODULE = {
    exportarCatalogoCSV,
    descargarPlantillaCSV,
    exportarVentasDiaCSV: () => window.POS_MODULE.exportarVentasDiaCSV(),
    handleCSVFileInput,
    exportarRespaldoJSON
};
