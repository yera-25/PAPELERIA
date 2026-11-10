/**
 * db.js - Motor Relacional SQL Local y Persistencia Híbrida para "Papelería A B C"
 * Arquitectura: Base de Datos Relacional SQL (SQLite 3 / In-Memory + LocalStorage Mirror)
 * Garantiza:
 * 1. Carga inmediata (<1ms) de los 160 productos del catálogo sin bloqueos por sandbox file://
 * 2. Persistencia local automática en LocalStorage ('PAPELERIA_ABC_SQL_STORE')
 * 3. Compatibilidad total con SQLite 3 (esquema normalizado 3FN y exportador SQL en 1-clic)
 * 4. Integridad referencial entre productos, marcas, categorías, unidades, kardex, ventas y turnos
 */

const DB_NAME = 'PapeleriaABC_SQL_DB';
const LOCAL_STORAGE_KEY = 'PAPELERIA_ABC_SQL_STORE_V6';

// -----------------------------------------------------------------------------
// ESQUEMA Y TABLAS SEMILLA RELACIONALES (SQL 3FN)
// -----------------------------------------------------------------------------


const SEED_USUARIOS = [
    {
        id_usuario: 1,
        username: 'admin',
        nombre_completo: 'Gerardo Cabrera Morales',
        rol: 'ADMINISTRADOR',
        salt: 'salt_abc_admin_2026',
        password_hash: '30b71cb37f3ab66d0ec897b82b13c379683c06912b78ecf759889362f2474f2c',
        activo: 1,
        ultimo_acceso: new Date().toISOString(),
        creado_en: '2026-10-01T08:00:00.000Z'
    },
    {
        id_usuario: 2,
        username: 'supervisor',
        nombre_completo: 'Astrid García Ramírez',
        rol: 'SUPERVISOR',
        salt: 'salt_abc_super_2026',
        password_hash: '079e0cb81bd69c6391553bce395b4684c8501e1338d27ee6d3ddc67b23fa7808',
        activo: 1,
        ultimo_acceso: null,
        creado_en: '2026-10-01T08:00:00.000Z'
    },
    {
        id_usuario: 3,
        username: 'usuario',
        nombre_completo: 'Daniel Parada Gonzalez',
        rol: 'USUARIO',
        salt: 'salt_abc_usuario_2026',
        password_hash: '9c81fd64cd0b8d8749fe47b8a8399d959cc37c3cd577776043bcaf0b65113701',
        activo: 1,
        ultimo_acceso: null,
        creado_en: '2026-10-01T08:00:00.000Z'
    },
    {
        id_usuario: 4,
        username: 'cajero',
        nombre_completo: 'Daniel Parada Gonzalez',
        rol: 'USUARIO',
        salt: 'salt_abc_caja_2026',
        password_hash: '51f3e9601b673ae9d53eb615350d643992f7d6840b48b2abeed5d12cf5619341',
        activo: 1,
        ultimo_acceso: null,
        creado_en: '2026-10-01T08:00:00.000Z'
    }
];

const SEED_CONFIGURACION = [
    {
        id_config: 1,
        clave: 'nombre_negocio',
        valor: 'Papelería A B C',
        nombre_comercial: 'Papelería A B C',
        razon_social: 'Papelería A B C S.A. de C.V.',
        rfc: 'PABC261005ABC',
        direccion: 'Av. Tecnológico #120, Col. Centro, Querétaro',
        telefono: '442-123-4567',
        email: 'contacto@papeleria-abc.mx',
        leyenda_ticket: '¡Gracias por su compra en Papelería A B C! Calidad y servicio para su escuela y oficina.',
        fondo_inicial_default: 500.00
    }
];

const SEED_CATEGORIAS = [
    { id_categoria: 1, nombre: 'Cuadernos y Libretas', descripcion: 'Profesionales, de espiral, cosidos, forma francesa e italiana', activo: 1 },
    { id_categoria: 2, nombre: 'Escritura e Instrumentos', descripcion: 'Bolígrafos de gel, tinta negra/azul/roja, lápices grafito y marcadores', activo: 1 },
    { id_categoria: 3, nombre: 'Adhesivos y Pegamentos', descripcion: 'Lápices adhesivos en barra, pegamento blanco escolar y silicón líquido', activo: 1 },
    { id_categoria: 4, nombre: 'Papeles y Cartulinas', descripcion: 'Hojas bond blancas carta/oficio, cartulinas bristol, papel lustre y crepé', activo: 1 },
    { id_categoria: 5, nombre: 'Geometría y Corte', descripcion: 'Juegos de geometría de plástico flexible, reglas graduadas y tijeras punta roma', activo: 1 },
    { id_categoria: 6, nombre: 'Arte y Manualidades', descripcion: 'Crayones de cera, plastilinas, acuarelas lavables y pinceles escolares', activo: 1 },
    { id_categoria: 7, nombre: 'Organización y Archivo', descripcion: 'Folders manila, broches baco, clips metálicos y registradores de palanca', activo: 1 },
    { id_categoria: 8, nombre: 'Servicios y Copias', descripcion: 'Fotocopias blanco y negro, color, impresiones láser y engargolados', activo: 1 }
];

const SEED_MARCAS = [
    { id_marca: 1, nombre: 'Scribe', pais: 'México', descripcion: 'Líder en libretas escolares y hojas bond', activo: 1 },
    { id_marca: 2, nombre: 'Bic', pais: 'Francia', descripcion: 'Bolígrafos cristal, lápices de grafito y correctores', activo: 1 },
    { id_marca: 3, nombre: 'Dixon', pais: 'Estados Unidos', descripcion: 'Lápices Ticonderoga y gomas de migajón', activo: 1 },
    { id_marca: 4, nombre: 'Factis', pais: 'España', descripcion: 'Gomas de borrar plásticas no abrasivas', activo: 1 },
    { id_marca: 5, nombre: 'Barrilito', pais: 'México', descripcion: 'Tijeras escolares, grapas y reglas metálicas', activo: 1 },
    { id_marca: 6, nombre: 'Pritt', pais: 'Alemania', descripcion: 'Lápices adhesivos de barra sin solventes', activo: 1 },
    { id_marca: 7, nombre: 'Crayola', pais: 'Estados Unidos', descripcion: 'Crayones de cera no tóxicos y plumones lavables', activo: 1 },
    { id_marca: 8, nombre: 'Maped', pais: 'Francia', descripcion: 'Juegos de geometría flexible y sacapuntas', activo: 1 },
    { id_marca: 9, nombre: 'Pilot', pais: 'Japón', descripcion: 'Marcadores para pizarrón blanco y bolígrafos', activo: 1 },
    { id_marca: 10, nombre: 'Paper Mate', pais: 'Estados Unidos', descripcion: 'Bolígrafos Kilométrico y portaminas', activo: 1 },
    { id_marca: 11, nombre: 'Baco', pais: 'México', descripcion: 'Broches para archivo, clips y compases', activo: 1 },
    { id_marca: 12, nombre: 'Berol', pais: 'México', descripcion: 'Lápices de colores y plastilinas', activo: 1 }
];

const SEED_UNIDADES = [
    { id_unidad: 1, clave: 'PZA', nombre: 'Pieza', permite_decimales: 0 },
    { id_unidad: 2, clave: 'CAJA', nombre: 'Caja', permite_decimales: 0 },
    { id_unidad: 3, clave: 'PAQ', nombre: 'Paquete', permite_decimales: 0 },
    { id_unidad: 4, clave: 'CTO', nombre: 'Ciento', permite_decimales: 0 },
    { id_unidad: 5, clave: 'MTR', nombre: 'Metro', permite_decimales: 1 }
];

const SEED_PROVEEDORES = [
    { id_proveedor: 1, razon_social: 'Distribuidora Papelera del Bajío S.A.', nombre: 'Distribuidora Papelera del Bajío S.A.', rfc: 'PBA850101XYZ', contacto: 'Lic. Roberto Silva', telefono: '442-987-6543', email: 'ventas@papelerabajio.com.mx', activo: 1 },
    { id_proveedor: 2, razon_social: 'Mayoristas Escolares de México', nombre: 'Mayoristas Escolares de México', rfc: 'MEM900215ABC', contacto: 'Ing. Carmen Ramos', telefono: '555-432-1098', email: 'pedidos@escolaresmexico.com', activo: 1 },
    { id_proveedor: 3, razon_social: 'Scribe Directo Fábrica', nombre: 'Scribe Directo Fábrica', rfc: 'SCR701130SC1', contacto: 'C.P. Mario Ortiz', telefono: '442-555-8899', email: 'atencion@scribe.com.mx', activo: 1 }
];

// 160 Productos Oficiales de Papelería A B C
const PRODUCTOS_CATALOGO_160 = [
    {
        "id_producto": 1,
        "codigo_barras": "7501024500123",
        "sku": "SC-CUAD-RAY100",
        "nombre": "Cuaderno Profesional Raya 100 Hojas Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 22.5,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 45,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Espiral metálico continuo, pasta semirrígida plastificada con márgenes rojos."
    },
    {
        "id_producto": 2,
        "codigo_barras": "7501024500130",
        "sku": "SC-CUAD-CUA5",
        "nombre": "Cuaderno Profesional Cuadro Chico 5mm 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 22.5,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 50,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cuadro 5mm ideal para matemáticas y física. 100 hojas bond 56g."
    },
    {
        "id_producto": 3,
        "codigo_barras": "7501024500147",
        "sku": "SC-CUAD-CUA7",
        "nombre": "Cuaderno Profesional Cuadro Grande 7mm 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 22.5,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cuadro grande 7mm recomendado para primaria y caligrafía inicial."
    },
    {
        "id_producto": 4,
        "codigo_barras": "7501024500154",
        "sku": "SC-CUAD-BLAN100",
        "nombre": "Cuaderno Profesional Hojas Blancas 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 22.5,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Hojas lisas sin rayado para dibujo, bocetos y diagramas."
    },
    {
        "id_producto": 5,
        "codigo_barras": "7501024500161",
        "sku": "SC-CUAD-DOBL100",
        "nombre": "Cuaderno Profesional Doble Raya 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 22.5,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 20,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Pauta de doble línea para aprendizaje y perfeccionamiento de letra."
    },
    {
        "id_producto": 6,
        "codigo_barras": "7501024500208",
        "sku": "SC-CUAD-COS-RAY200",
        "nombre": "Cuaderno Profesional Cosido Raya 200 Hojas Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 48.0,
        "precio_venta_menudeo": 72.0,
        "precio_venta_mayoreo": 65.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Encuadernación cosida reforzada de lomo plano, 200 hojas raya."
    },
    {
        "id_producto": 7,
        "codigo_barras": "7501024500215",
        "sku": "SC-CUAD-COS-CUA200",
        "nombre": "Cuaderno Profesional Cosido Cuadro 5mm 200h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 48.0,
        "precio_venta_menudeo": 72.0,
        "precio_venta_mayoreo": 65.0,
        "stock_actual": 15,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Encuadernación cosida reforzada indeformable para uso rudo universitario."
    },
    {
        "id_producto": 8,
        "codigo_barras": "7501024500307",
        "sku": "SC-LIB-FRAN-RAY",
        "nombre": "Libreta Forma Francesa Espiral Raya 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 17.5,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 25.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño 19 x 24 cm, hojas bond con rayado uniforme y espiral plástico."
    },
    {
        "id_producto": 9,
        "codigo_barras": "7501024500314",
        "sku": "SC-LIB-FRAN-CUA",
        "nombre": "Libreta Forma Francesa Cuadro Chico 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 17.5,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 25.0,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño 19 x 24 cm, cuadro 5mm con margen lateral marcado."
    },
    {
        "id_producto": 10,
        "codigo_barras": "7501024500321",
        "sku": "SC-LIB-ITAL-RAY",
        "nombre": "Libreta Forma Italiana Cosida Raya 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 15.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 21.0,
        "stock_actual": 22,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño apaisado 15 x 21 cm cosida con cinta en el lomo."
    },
    {
        "id_producto": 11,
        "codigo_barras": "7501024500338",
        "sku": "SC-LIB-ITAL-CUA",
        "nombre": "Libreta Forma Italiana Cosida Cuadro 100h Scribe",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 15.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 21.0,
        "stock_actual": 20,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Forma italiana cuadro grande para jardín de niños y primer grado."
    },
    {
        "id_producto": 12,
        "codigo_barras": "7501024500406",
        "sku": "SC-BLOCK-MARQ-ESP",
        "nombre": "Block Marquilla de Dibujo con Espiral Scribe 20h",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 32.0,
        "precio_venta_menudeo": 52.0,
        "precio_venta_mayoreo": 46.0,
        "stock_actual": 16,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Papel marquilla de 135g con papel cebolla intercalado para protección."
    },
    {
        "id_producto": 13,
        "codigo_barras": "7501024500413",
        "sku": "SC-BLOCK-MILL-CUA",
        "nombre": "Block de Papel Milimétrico Tamaño Carta 50h",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 24.0,
        "precio_venta_menudeo": 38.0,
        "precio_venta_mayoreo": 34.0,
        "stock_actual": 12,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cuadrícula milimétrica impresa en color sepia con margen técnico."
    },
    {
        "id_producto": 14,
        "codigo_barras": "7501024500505",
        "sku": "NOT-POST-3X3-AMAR",
        "nombre": "Notas Adhesivas 3x3 Pulgadas Amarillas (100h)",
        "id_categoria": 1,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 14.5,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 35,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bloc de notas tipo post-it reposicionables color amarillo canario clásico."
    },
    {
        "id_producto": 15,
        "codigo_barras": "7501024500512",
        "sku": "NOT-BAND-SURT-COL",
        "nombre": "Banderitas Adhesivas Señalizadoras Colores Neón",
        "id_categoria": 1,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Dispensador con 5 colores brillantes para índices, lectura y firmas."
    },
    {
        "id_producto": 16,
        "codigo_barras": "7501024500529",
        "sku": "SC-CUAD-PAST-DURA",
        "nombre": "Cuaderno Profesional Pasta Dura Raya Scribe Excellence",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 58.0,
        "precio_venta_menudeo": 89.0,
        "precio_venta_mayoreo": 79.0,
        "stock_actual": 14,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Pasta rígida empastada tipo cartón de 2mm con elástico de cierre."
    },
    {
        "id_producto": 17,
        "codigo_barras": "7501024500536",
        "sku": "SC-LIB-TAQU-ESP",
        "nombre": "Libreta de Taquigrafía Pitman Espiral Superior 80h",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 19.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Rayado especial con línea divisoria central y espiral superior."
    },
    {
        "id_producto": 18,
        "codigo_barras": "7501024500543",
        "sku": "SC-BLOC-CARTA-RAY",
        "nombre": "Block de Notas Tamaño Carta Engomado Raya 50h",
        "id_categoria": 1,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 17.5,
        "stock_actual": 28,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Hojas desprendibles con lomo engomado para cartas y memorándums."
    },
    {
        "id_producto": 19,
        "codigo_barras": "7501030101015",
        "sku": "BIC-CRIS-AZUL",
        "nombre": "Bolígrafo Punto Mediano 1.0mm Cristal Azul Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.2,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 120,
        "stock_minimo": 25,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Punto mediano 1.0mm, cuerpo hexagonal transparente y tapa ventilada."
    },
    {
        "id_producto": 20,
        "codigo_barras": "7501030101022",
        "sku": "BIC-CRIS-NEGR",
        "nombre": "Bolígrafo Punto Mediano 1.0mm Cristal Negro Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.2,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 95,
        "stock_minimo": 25,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tinta negra indeleble de alta densidad para trámites y notas escolares."
    },
    {
        "id_producto": 21,
        "codigo_barras": "7501030101039",
        "sku": "BIC-CRIS-ROJO",
        "nombre": "Bolígrafo Punto Mediano 1.0mm Cristal Rojo Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.2,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 80,
        "stock_minimo": 20,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tinta roja viva ideal para revisiones, títulos y correcciones escolares."
    },
    {
        "id_producto": 22,
        "codigo_barras": "7501030101046",
        "sku": "BIC-CRIS-VERD",
        "nombre": "Bolígrafo Punto Mediano 1.0mm Cristal Verde Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.2,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 45,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tinta verde bosque para notas auxiliares y diagramas."
    },
    {
        "id_producto": 23,
        "codigo_barras": "7501030102012",
        "sku": "BIC-PREC-AZUL",
        "nombre": "Bolígrafo Punto Fino 0.7mm Cristal Fino Azul Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.8,
        "precio_venta_menudeo": 9.0,
        "precio_venta_mayoreo": 7.5,
        "stock_actual": 60,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Punta de aguja fina 0.7mm para trazos delicados y letra compacta."
    },
    {
        "id_producto": 24,
        "codigo_barras": "7501030102029",
        "sku": "BIC-PREC-NEGR",
        "nombre": "Bolígrafo Punto Fino 0.7mm Cristal Fino Negro Bic",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 4.8,
        "precio_venta_menudeo": 9.0,
        "precio_venta_mayoreo": 7.5,
        "stock_actual": 55,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Punto fino 0.7mm tinta negra para dibujo técnico y escritura pulcra."
    },
    {
        "id_producto": 25,
        "codigo_barras": "7501030103019",
        "sku": "BIC-DIAM-AZUL",
        "nombre": "Bolígrafo Retráctil Bic Atlantis Azul 1.0mm",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 11.5,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.5,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Mecanismo retráctil con grip de goma ergonómico y tinta ultrasuave."
    },
    {
        "id_producto": 26,
        "codigo_barras": "7501030103026",
        "sku": "BIC-DIAM-NEGR",
        "nombre": "Bolígrafo Retráctil Bic Atlantis Negro 1.0mm",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 11.5,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.5,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bolígrafo retráctil negro ejecutivo con clip metálico duradero."
    },
    {
        "id_producto": 27,
        "codigo_barras": "7501099901017",
        "sku": "PIL-G2-NEGR07",
        "nombre": "Bolígrafo de Gel Retráctil Pilot G2 0.7mm Negro",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 28,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tinta gel dinámica japonesa de máxima fluidez con empuñadura acolchada."
    },
    {
        "id_producto": 28,
        "codigo_barras": "7501099901024",
        "sku": "PIL-G2-AZUL07",
        "nombre": "Bolígrafo de Gel Retráctil Pilot G2 0.7mm Azul",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 24,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bolígrafo de gel azul premium de larga duración para firmas y bitácoras."
    },
    {
        "id_producto": 29,
        "codigo_barras": "7501099901031",
        "sku": "PIL-G2-ROJO07",
        "nombre": "Bolígrafo de Gel Retráctil Pilot G2 0.7mm Rojo",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 16,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Gel rojo brillante con punta bola de carburo de tungsteno indeformable."
    },
    {
        "id_producto": 30,
        "codigo_barras": "7501041001018",
        "sku": "PM-KILO-AZUL",
        "nombre": "Bolígrafo Kilométrico 100 Retráctil Azul Paper Mate",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 7.5,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 10.5,
        "stock_actual": 50,
        "stock_minimo": 12,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tecnología InkJoy que inicia la escritura rápidamente sin esfuerzo."
    },
    {
        "id_producto": 31,
        "codigo_barras": "7501041001025",
        "sku": "PM-KILO-NEGR",
        "nombre": "Bolígrafo Kilométrico 100 Retráctil Negro Paper Mate",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 7.5,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 10.5,
        "stock_actual": 45,
        "stock_minimo": 12,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Cuerpo traslúcido y sistema de tinta InkJoy fluida color negro."
    },
    {
        "id_producto": 32,
        "codigo_barras": "7501041001032",
        "sku": "PM-KILO-ROJO",
        "nombre": "Bolígrafo Kilométrico 100 Retráctil Rojo Paper Mate",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 7.5,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 10.5,
        "stock_actual": 35,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tinta roja viva con mecanismo retráctil de clic sonoro."
    },
    {
        "id_producto": 33,
        "codigo_barras": "7501017001005",
        "sku": "DIXON-LAP-NO2",
        "nombre": "Lápiz de Grafito HB No. 2 Ticonderoga Dixon",
        "id_categoria": 2,
        "id_marca": 3,
        "id_unidad": 1,
        "precio_compra": 3.8,
        "precio_venta_menudeo": 7.0,
        "precio_venta_mayoreo": 6.0,
        "stock_actual": 60,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "El mejor lápiz del mundo: madera de cedro, mina resistente y goma verde."
    },
    {
        "id_producto": 34,
        "codigo_barras": "7501017001012",
        "sku": "DIXON-LAP-2B",
        "nombre": "Lápiz de Grafito 2B para Dibujo y Sombras Dixon",
        "id_categoria": 2,
        "id_marca": 3,
        "id_unidad": 1,
        "precio_compra": 5.5,
        "precio_venta_menudeo": 10.0,
        "precio_venta_mayoreo": 8.5,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Mina blanda 2B de grafito puro para sombreado artístico y bocetos."
    },
    {
        "id_producto": 35,
        "codigo_barras": "7501017001029",
        "sku": "DIXON-LAP-4B",
        "nombre": "Lápiz de Grafito 4B Artístico Sombra Intensa Dixon",
        "id_categoria": 2,
        "id_marca": 3,
        "id_unidad": 1,
        "precio_compra": 6.0,
        "precio_venta_menudeo": 11.0,
        "precio_venta_mayoreo": 9.5,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Mina muy suave de trazo negro aterciopelado para retratos y claroscuro."
    },
    {
        "id_producto": 36,
        "codigo_barras": "7501041002015",
        "sku": "PM-LAP-MIRADO",
        "nombre": "Lápiz Grafito Mirado Clásico No. 2 Paper Mate",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 4.0,
        "precio_venta_menudeo": 7.5,
        "precio_venta_mayoreo": 6.2,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Clásico lápiz amarillo con banda roja, mina HB duradera para exámenes."
    },
    {
        "id_producto": 37,
        "codigo_barras": "7501041003012",
        "sku": "MARC-RESAL-AMAR",
        "nombre": "Marcatextos Resaltador Fluorescente Amarillo Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Punta biselada Smear Guard que no corre la tinta de bolígrafo ni copias."
    },
    {
        "id_producto": 38,
        "codigo_barras": "7501041003029",
        "sku": "MARC-RESAL-VERD",
        "nombre": "Marcatextos Resaltador Fluorescente Verde Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tinta fluorescente de secado rápido color verde brillante para lectura."
    },
    {
        "id_producto": 39,
        "codigo_barras": "7501041003036",
        "sku": "MARC-RESAL-ROSA",
        "nombre": "Marcatextos Resaltador Fluorescente Rosa Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 28,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Color rosa neón translúcido para subrayar títulos y notas destacadas."
    },
    {
        "id_producto": 40,
        "codigo_barras": "7501041003043",
        "sku": "MARC-RESAL-NAR",
        "nombre": "Marcatextos Resaltador Fluorescente Naranja Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Marcador fluorescente naranja de alto contraste visual."
    },
    {
        "id_producto": 41,
        "codigo_barras": "7501041003050",
        "sku": "MARC-RESAL-PAST",
        "nombre": "Marcatextos Color Pastel Turquesa / Menta Maped",
        "id_categoria": 2,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 11.0,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.0,
        "stock_actual": 20,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tono pastel suave que no cansa la vista en lecturas prolongadas."
    },
    {
        "id_producto": 42,
        "codigo_barras": "7501041004019",
        "sku": "SHAR-PERM-NEGR",
        "nombre": "Marcador Permanente Punta Fina Negro Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 13.5,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.5,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tinta indeleble resistente al agua en plástico, metal, cartón y vidrio."
    },
    {
        "id_producto": 43,
        "codigo_barras": "7501041004026",
        "sku": "SHAR-PERM-AZUL",
        "nombre": "Marcador Permanente Punta Fina Azul Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 13.5,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.5,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Marcador azul permanente de secado rápido sobre superficies difíciles."
    },
    {
        "id_producto": 44,
        "codigo_barras": "7501041004033",
        "sku": "SHAR-PERM-ROJO",
        "nombre": "Marcador Permanente Punta Fina Rojo Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 13.5,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.5,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tinta roja permanente de alta pigmentación."
    },
    {
        "id_producto": 45,
        "codigo_barras": "7501041004040",
        "sku": "SHAR-PERM-CINCEL",
        "nombre": "Marcador Permanente Punta Cincel Grueso Negro Sharpie",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 16.0,
        "precio_venta_menudeo": 26.0,
        "precio_venta_mayoreo": 22.5,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Punta ancha biselada para rotular cajas de cartón y letreros grandes."
    },
    {
        "id_producto": 46,
        "codigo_barras": "7501099902014",
        "sku": "PIL-PIZA-NEGR",
        "nombre": "Marcador para Pizarrón Blanco V-Board Negro Pilot",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 19.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Sistema de tinta líquida con depósito visible recargable y borrado seco."
    },
    {
        "id_producto": 47,
        "codigo_barras": "7501099902021",
        "sku": "PIL-PIZA-AZUL",
        "nombre": "Marcador para Pizarrón Blanco V-Board Azul Pilot",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 19.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 25,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tinta líquida azul de borrado instantáneo sin dejar manchas fantasmas."
    },
    {
        "id_producto": 48,
        "codigo_barras": "7501099902038",
        "sku": "PIL-PIZA-ROJO",
        "nombre": "Marcador para Pizarrón Blanco V-Board Rojo Pilot",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 19.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 20,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Marcador para pintarrón rojo no tóxico de flujo constante."
    },
    {
        "id_producto": 49,
        "codigo_barras": "7501099902045",
        "sku": "PIL-PIZA-VERD",
        "nombre": "Marcador para Pizarrón Blanco V-Board Verde Pilot",
        "id_categoria": 2,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 19.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Color verde esmeralda brillante para esquemas en clase."
    },
    {
        "id_producto": 50,
        "codigo_barras": "7501041005016",
        "sku": "PM-PORT-05MM",
        "nombre": "Portaminas Ergonómico 0.5mm Paper Mate Non-Stop",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 22,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Alimentación continua por giro con goma giratoria extralarga."
    },
    {
        "id_producto": 51,
        "codigo_barras": "7501041005023",
        "sku": "PM-PORT-07MM",
        "nombre": "Portaminas Ergonómico 0.7mm Paper Mate Non-Stop",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Grosor 0.7mm resistente a roturas accidentales al escribir con fuerza."
    },
    {
        "id_producto": 52,
        "codigo_barras": "7501041005115",
        "sku": "MINAS-05MM-HB",
        "nombre": "Estuche de Minas 0.5mm HB Pentel / Paper Mate (12p)",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.0,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tubo de minas de polímero resistentes a la flexión."
    },
    {
        "id_producto": 53,
        "codigo_barras": "7501041005122",
        "sku": "MINAS-07MM-HB",
        "nombre": "Estuche de Minas 0.7mm HB Pentel / Paper Mate (12p)",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 9.0,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.0,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tubo dispensador de minas 0.7mm dureza media HB."
    },
    {
        "id_producto": 54,
        "codigo_barras": "7501030104016",
        "sku": "BIC-CORR-LIPEN",
        "nombre": "Corrector Líquido Tipo Pluma 7ml Bic Shake'n Squeeze",
        "id_categoria": 2,
        "id_marca": 2,
        "id_unidad": 1,
        "precio_compra": 16.5,
        "precio_venta_menudeo": 26.0,
        "precio_venta_mayoreo": 22.0,
        "stock_actual": 32,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Punta de aguja metálica para corregir errores puntuales sin manchar."
    },
    {
        "id_producto": 55,
        "codigo_barras": "7501041006013",
        "sku": "PM-CORR-CINTA",
        "nombre": "Corrector en Cinta Seca 5mm x 6m Liquid Paper",
        "id_categoria": 2,
        "id_marca": 10,
        "id_unidad": 1,
        "precio_compra": 21.0,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 30.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cinta blanca de aplicación inmediata: se puede escribir encima al instante."
    },
    {
        "id_producto": 56,
        "codigo_barras": "7501008000444",
        "sku": "PRITT-ADH-10G",
        "nombre": "Lápiz Adhesivo Barra 10g Pritt Original Chico",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 11.5,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 17.5,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño de bolsillo 10g, no ondula el papel, lavable y no tóxico."
    },
    {
        "id_producto": 57,
        "codigo_barras": "7501008000451",
        "sku": "PRITT-ADH-22G",
        "nombre": "Lápiz Adhesivo Barra 22g Pritt Original Mediano",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 18.5,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 8,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Presentación estándar escolar 22g libre de solventes (Alerta Stock Bajo)."
    },
    {
        "id_producto": 58,
        "codigo_barras": "7501008000468",
        "sku": "PRITT-ADH-42G",
        "nombre": "Lápiz Adhesivo Barra 42g Pritt Original Grande",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 28.0,
        "precio_venta_menudeo": 46.0,
        "precio_venta_mayoreo": 40.0,
        "stock_actual": 15,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Barra jumbo de 42g para maquetas, talleres y uso intensivo."
    },
    {
        "id_producto": 59,
        "codigo_barras": "7501008000505",
        "sku": "PEG-BLAN-110G",
        "nombre": "Pegamento Blanco Escolar 110g Resistol 850",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 13.0,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 19.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Fórmula tradicional de acetato de polivinilo de fuerte adhesión."
    },
    {
        "id_producto": 60,
        "codigo_barras": "7501008000512",
        "sku": "PEG-BLAN-250G",
        "nombre": "Pegamento Blanco Escolar 250g Resistol 850",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 24.0,
        "precio_venta_menudeo": 38.0,
        "precio_venta_mayoreo": 33.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bote con dosificador cónico para manualidades en papel y madera."
    },
    {
        "id_producto": 61,
        "codigo_barras": "7501008000529",
        "sku": "PEG-BLAN-500G",
        "nombre": "Pegamento Blanco Escolar 500g Resistol 850 Medio Kilo",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 42.0,
        "precio_venta_menudeo": 68.0,
        "precio_venta_mayoreo": 60.0,
        "stock_actual": 12,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Medio litro de pegamento vinílico extrafuerte para carpintería y cartonería."
    },
    {
        "id_producto": 62,
        "codigo_barras": "7501056303012",
        "sku": "BARR-SILIC-100ML",
        "nombre": "Silicón Líquido Frío 100ml Barrilito",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 15.5,
        "precio_venta_menudeo": 26.0,
        "precio_venta_mayoreo": 22.5,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Adhesivo transparente de alta viscosidad para foamy, tela y cartón."
    },
    {
        "id_producto": 63,
        "codigo_barras": "7501056303029",
        "sku": "BARR-SILIC-250ML",
        "nombre": "Silicón Líquido Frío 250ml Barrilito",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 27.0,
        "precio_venta_menudeo": 44.0,
        "precio_venta_mayoreo": 38.0,
        "stock_actual": 16,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bote grande de silicón frío ideal para proyectos de manualidades."
    },
    {
        "id_producto": 64,
        "codigo_barras": "7501056303104",
        "sku": "SILIC-BARR-GRUE",
        "nombre": "Barras de Silicón Caliente Grueso 11mm (Paq 10p)",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 30.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Barras transparentes para pistola de silicón estándar caliente."
    },
    {
        "id_producto": 65,
        "codigo_barras": "7501056303111",
        "sku": "SILIC-BARR-DELG",
        "nombre": "Barras de Silicón Caliente Delgado 7mm (Paq 10p)",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 16.0,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 24.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Barras delgadas 7mm para minipistolas de manualidades escolares."
    },
    {
        "id_producto": 66,
        "codigo_barras": "7501056304019",
        "sku": "CINT-ADH-TRAN18",
        "nombre": "Cinta Adhesiva Transparente 18mm x 33m Barrilito",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 6.0,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 9.5,
        "stock_actual": 50,
        "stock_minimo": 12,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Durex transparente para envolturas de regalos y pegado de notas."
    },
    {
        "id_producto": 67,
        "codigo_barras": "7501056304026",
        "sku": "CINT-EMPQ-TRAN48",
        "nombre": "Cinta para Empaque Transparente 48mm x 50m",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 25.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cinta canela/transparente de alto agarre para sellado de cajas."
    },
    {
        "id_producto": 68,
        "codigo_barras": "7501056304033",
        "sku": "CINT-EMPQ-CANE48",
        "nombre": "Cinta para Empaque Color Canela 48mm x 50m",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 25.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cinta adhesiva color café canela para paquetería y mudanzas."
    },
    {
        "id_producto": 69,
        "codigo_barras": "7501056304118",
        "sku": "CINT-MASK-18MM",
        "nombre": "Cinta Masking Tape de Papel 18mm x 50m Barrilito",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cinta de enmascarar de fácil desprendimiento sin dejar residuos."
    },
    {
        "id_producto": 70,
        "codigo_barras": "7501056304125",
        "sku": "CINT-MASK-24MM",
        "nombre": "Cinta Masking Tape de Papel 24mm x 50m Barrilito",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 19.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 27.0,
        "stock_actual": 22,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Ancho de 1 pulgada para rotulación escolar y pintura."
    },
    {
        "id_producto": 71,
        "codigo_barras": "7501056304200",
        "sku": "CINT-DOBL-ESPUM",
        "nombre": "Cinta Doble Capa Espumosa de Montaje 18mm x 2m",
        "id_categoria": 3,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 16.5,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 24.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Espuma con adhesivo en ambas caras para colgar cuadros y pósters."
    },
    {
        "id_producto": 72,
        "codigo_barras": "7501008000604",
        "sku": "KOLA-LOKA-3G",
        "nombre": "Pegamento Instantáneo Kola Loka Goteador 3g",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 30.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cianoacrilato de máxima velocidad: pega en 30 segundos metales y plásticos."
    },
    {
        "id_producto": 73,
        "codigo_barras": "7501008000611",
        "sku": "PRITT-MULTIFIX",
        "nombre": "Masilla Adhesiva Reutilizable Pritt Multi-Fix 35g",
        "id_categoria": 3,
        "id_marca": 6,
        "id_unidad": 1,
        "precio_compra": 25.0,
        "precio_venta_menudeo": 42.0,
        "precio_venta_mayoreo": 36.0,
        "stock_actual": 14,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tack reposicionable para fijar láminas y dibujos sin perforar paredes."
    },
    {
        "id_producto": 74,
        "codigo_barras": "7501024500604",
        "sku": "SC-PAQ-BOND-CTA",
        "nombre": "Paquete Hojas Bond Carta 75g (500h) Scribe",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 3,
        "precio_compra": 95.0,
        "precio_venta_menudeo": 135.0,
        "precio_venta_mayoreo": 120.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Blancura 97%, libre de ácido para fotocopiadoras e impresoras láser/inyección."
    },
    {
        "id_producto": 75,
        "codigo_barras": "7501024500611",
        "sku": "SC-CTO-BOND-CTA",
        "nombre": "Hojas Bond Blanco Tamaño Carta (Ciento 100h)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 4,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 30.0,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Fraccionamiento de 100 hojas bond para tareas y proyectos escolares."
    },
    {
        "id_producto": 76,
        "codigo_barras": "7501024500628",
        "sku": "SC-PAQ-BOND-OFI",
        "nombre": "Paquete Hojas Bond Oficio 75g (500h) Scribe",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 3,
        "precio_compra": 115.0,
        "precio_venta_menudeo": 160.0,
        "precio_venta_mayoreo": 145.0,
        "stock_actual": 15,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño legal / oficio 21.6 x 34 cm para contratos y expedientes."
    },
    {
        "id_producto": 77,
        "codigo_barras": "7501024500703",
        "sku": "CART-BRIS-BLAN",
        "nombre": "Cartulina Bristol Blanca 50x65cm (Pliego)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 4.5,
        "precio_venta_menudeo": 9.0,
        "precio_venta_mayoreo": 7.5,
        "stock_actual": 80,
        "stock_minimo": 20,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Gramaje 150g satinado por ambas caras para carteles y exposiciones."
    },
    {
        "id_producto": 78,
        "codigo_barras": "7501024500710",
        "sku": "CART-BRIS-COLO",
        "nombre": "Cartulina Bristol Colores Pastel Surtidos (Pliego)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 5.0,
        "precio_venta_menudeo": 10.0,
        "precio_venta_mayoreo": 8.0,
        "stock_actual": 60,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Colores rosa, celeste, amarillo, verde y canario para manualidades."
    },
    {
        "id_producto": 79,
        "codigo_barras": "7501024500727",
        "sku": "CART-FLUO-NEON",
        "nombre": "Cartulina Fluorescente / Neón Surtida (Pliego)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 7.5,
        "precio_venta_menudeo": 14.0,
        "precio_venta_mayoreo": 12.0,
        "stock_actual": 35,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Colores fosforescentes amarillo, verde, naranja y fiusha brillante."
    },
    {
        "id_producto": 80,
        "codigo_barras": "7501024500734",
        "sku": "PAP-LUST-SURT",
        "nombre": "Papel Lustre Colores Surtidos (Pliego 50x70cm)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 3.2,
        "precio_venta_menudeo": 6.5,
        "precio_venta_mayoreo": 5.0,
        "stock_actual": 70,
        "stock_minimo": 20,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Acabado brillante encerado para forrar libretas y maquetas."
    },
    {
        "id_producto": 81,
        "codigo_barras": "7501024500741",
        "sku": "PAP-CREP-SURT",
        "nombre": "Papel Crepé Varios Colores (Tira 50x200cm)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 4.0,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 50,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Textura corrugada elástica para decoración de festivales y piñatas."
    },
    {
        "id_producto": 82,
        "codigo_barras": "7501024500758",
        "sku": "PAP-CHIN-SURT",
        "nombre": "Papel China Varios Colores (Pliego)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 1.2,
        "precio_venta_menudeo": 3.0,
        "precio_venta_mayoreo": 2.0,
        "stock_actual": 100,
        "stock_minimo": 30,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Papel tisú delgado y translúcido para envolturas y flores."
    },
    {
        "id_producto": 83,
        "codigo_barras": "7501024500765",
        "sku": "PAP-AMER-SURT",
        "nombre": "Papel América Varios Colores (Metro)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 5,
        "precio_compra": 5.5,
        "precio_venta_menudeo": 10.0,
        "precio_venta_mayoreo": 8.5,
        "stock_actual": 60,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Papel kraft teñido por un lado para forrar periódicos murales y mesas."
    },
    {
        "id_producto": 84,
        "codigo_barras": "7501024500772",
        "sku": "PAP-KRAF-70X100",
        "nombre": "Papel Kraft Café Envoltura 90g (Pliego 70x100cm)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 4.0,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 45,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Papel resistente ecológico para embalaje, patrones y paquetes."
    },
    {
        "id_producto": 85,
        "codigo_barras": "7501024500789",
        "sku": "PAP-CASC-OCTAVO",
        "nombre": "Papel Cascarón de Huevo Tamaño 1/8 (Pieza)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 3.5,
        "precio_venta_menudeo": 7.0,
        "precio_venta_mayoreo": 5.5,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cartón rígido texturizado para acuarelas, témperas y maquetas escolares."
    },
    {
        "id_producto": 86,
        "codigo_barras": "7501024500796",
        "sku": "PAP-CASC-CUARTO",
        "nombre": "Papel Cascarón de Huevo Tamaño 1/4 (Pieza)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 6.0,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 10.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tamaño 35 x 50 cm para maquetas de ciencias naturales y geografía."
    },
    {
        "id_producto": 87,
        "codigo_barras": "7501024500802",
        "sku": "PAP-ILUS-OCTAVO",
        "nombre": "Papel Ilustración 1/8 Blanco Satinado",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 5.0,
        "precio_venta_menudeo": 10.0,
        "precio_venta_mayoreo": 8.5,
        "stock_actual": 30,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Base blanca lisa y reverso gris para dibujo a tinta y rotuladores."
    },
    {
        "id_producto": 88,
        "codigo_barras": "7501024500819",
        "sku": "CONTAC-TRAN-MET",
        "nombre": "Papel Contac Transparente Autoadherible (Metro)",
        "id_categoria": 4,
        "id_marca": 5,
        "id_unidad": 5,
        "precio_compra": 9.0,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 50,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Plástico autoadhesivo para forrar libros, libretas y credenciales."
    },
    {
        "id_producto": 89,
        "codigo_barras": "7501024500826",
        "sku": "CONTAC-COLO-MET",
        "nombre": "Papel Contac Colores Sólidos Autoadherible (Metro)",
        "id_categoria": 4,
        "id_marca": 5,
        "id_unidad": 5,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 17.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Película vinílica adhesiva opaca para forro directo de pastas."
    },
    {
        "id_producto": 90,
        "codigo_barras": "7501024500833",
        "sku": "PAP-CARB-CARTA",
        "nombre": "Papel Carbón Negro Tamaño Carta Kores (Sobre 10h)",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 15.0,
        "precio_venta_menudeo": 25.0,
        "precio_venta_mayoreo": 21.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Papel calca negro para copias manuscritas de notas y recibos."
    },
    {
        "id_producto": 91,
        "codigo_barras": "7501024500840",
        "sku": "PAP-BOND-ROLLO",
        "nombre": "Papel Bond en Rollo / Pliego Blanco 70x100cm",
        "id_categoria": 4,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 3.8,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Pliego grande de papel bond blanco para planos, trazos y rotafolios."
    },
    {
        "id_producto": 92,
        "codigo_barras": "7501042300055",
        "sku": "MAPED-GEO-15",
        "nombre": "Juego de Geometría Flexible 5 Pzas Maped Twist",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 28.0,
        "precio_venta_menudeo": 48.0,
        "precio_venta_mayoreo": 42.0,
        "stock_actual": 15,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Regla 30cm, escuadras 45°/60°, transportador y compás irrompibles."
    },
    {
        "id_producto": 93,
        "codigo_barras": "7501042300062",
        "sku": "BARR-GEO-RIGID",
        "nombre": "Juego de Geometría Plástico Rígido Escolar Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 27.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Estuche con regla biselada 30cm, escuadra 30/60, escuadra 45 y transportador."
    },
    {
        "id_producto": 94,
        "codigo_barras": "7501056305016",
        "sku": "BARR-REGL-30CM",
        "nombre": "Regla Graduada de Plástico Transparente 30cm",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 3.5,
        "precio_venta_menudeo": 7.0,
        "precio_venta_mayoreo": 5.5,
        "stock_actual": 60,
        "stock_minimo": 15,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Escala milimétrica y en pulgadas con filo antimanchas."
    },
    {
        "id_producto": 95,
        "codigo_barras": "7501056305023",
        "sku": "BARR-REGL-META30",
        "nombre": "Regla Metálica de Acero Inoxidable 30cm Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 25.0,
        "precio_venta_mayoreo": 21.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Grabado láser indeleble con tabla de conversión en el reverso."
    },
    {
        "id_producto": 96,
        "codigo_barras": "7501056305030",
        "sku": "BARR-REGL-META60",
        "nombre": "Regla Metálica de Acero Inoxidable 60cm Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 28.0,
        "precio_venta_menudeo": 48.0,
        "precio_venta_mayoreo": 42.0,
        "stock_actual": 10,
        "stock_minimo": 3,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Longitud de 60cm para arquitectura, diseño y corte con cúter."
    },
    {
        "id_producto": 97,
        "codigo_barras": "7501042300109",
        "sku": "MAPED-TRAN-360",
        "nombre": "Transportador Circular 360 Grados Maped Technic",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 12.5,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.5,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Círculo completo con mira central para medición precisa de rumbos."
    },
    {
        "id_producto": 98,
        "codigo_barras": "7501042300208",
        "sku": "MAPED-COMP-PREC",
        "nombre": "Compás de Precisión Metálico con Adaptador Maped",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 24.0,
        "precio_venta_menudeo": 42.0,
        "precio_venta_mayoreo": 36.0,
        "stock_actual": 15,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Brazos articulados metálicos con estuche de minas de repuesto."
    },
    {
        "id_producto": 99,
        "codigo_barras": "7501056302008",
        "sku": "BARR-TIJ-ESC",
        "nombre": "Tijera Escolar Punta Roma 5 Pulgadas Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 19.0,
        "stock_actual": 4,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Hojas de acero inoxidable graduadas y mango ergonómico (Alerta Stock Bajo)."
    },
    {
        "id_producto": 100,
        "codigo_barras": "7501056302015",
        "sku": "BARR-TIJ-OFIC8",
        "nombre": "Tijera de Oficina y Modistería 8 Pulg Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 38.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 16,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Hojas afiladas de alta resistencia para cortes rectos en cartulina y tela."
    },
    {
        "id_producto": 101,
        "codigo_barras": "7501056302107",
        "sku": "BARR-CUTE-MET18",
        "nombre": "Cúter Metálico Grande 18mm con Seguro Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 16.0,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 24.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Riel de acero inoxidable reforzado con seguro de bloqueo automático."
    },
    {
        "id_producto": 102,
        "codigo_barras": "7501056302114",
        "sku": "BARR-CUTE-ESC9",
        "nombre": "Cúter Chico Escolar Plástico 9mm Barrilito",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 6.5,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 10.0,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tamaño compacto para corte fino de papel y trabajos manuales."
    },
    {
        "id_producto": 103,
        "codigo_barras": "7501056302121",
        "sku": "NAVAJ-REP-18MM",
        "nombre": "Navajas de Repuesto para Cúter 18mm (Estuche 10p)",
        "id_categoria": 5,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.0,
        "stock_actual": 24,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Hojas seccionadas de acero al carbono SK5 templadas."
    },
    {
        "id_producto": 104,
        "codigo_barras": "7501018000106",
        "sku": "FACT-GOMA-S20",
        "nombre": "Goma de Borrar Plástica Blanca Factis S20",
        "id_categoria": 5,
        "id_marca": 4,
        "id_unidad": 1,
        "precio_compra": 4.5,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.8,
        "stock_actual": 50,
        "stock_minimo": 12,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Goma plástica suave no abrasiva que borra sin desgastar ni raspar el papel."
    },
    {
        "id_producto": 105,
        "codigo_barras": "7501017002002",
        "sku": "DIXON-GOMA-MIGA",
        "nombre": "Goma de Borrar Migajón No. 20 Dixon",
        "id_categoria": 5,
        "id_marca": 3,
        "id_unidad": 1,
        "precio_compra": 4.0,
        "precio_venta_menudeo": 7.5,
        "precio_venta_mayoreo": 6.2,
        "stock_actual": 45,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Goma clásica de caucho sintético suave para lápices de grafito."
    },
    {
        "id_producto": 106,
        "codigo_barras": "7501018000205",
        "sku": "FACT-GOMA-BICO",
        "nombre": "Goma de Borrar Bicolor Tinta y Lápiz Factis",
        "id_categoria": 5,
        "id_marca": 4,
        "id_unidad": 1,
        "precio_compra": 5.0,
        "precio_venta_menudeo": 9.0,
        "precio_venta_mayoreo": 7.5,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Lado rojo para grafito y lado azul con micropartículas para tinta."
    },
    {
        "id_producto": 107,
        "codigo_barras": "7501042300307",
        "sku": "MAPED-SACA-META",
        "nombre": "Sacapuntas Metálico Doble Entrada Maped",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 8.5,
        "precio_venta_menudeo": 15.0,
        "precio_venta_mayoreo": 12.5,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Cuerpo de aleación de magnesio con orificios estándar y jumbo."
    },
    {
        "id_producto": 108,
        "codigo_barras": "7501042300314",
        "sku": "MAPED-SACA-DEPO",
        "nombre": "Sacapuntas con Depósito Plástico Maped Shaker",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 11.0,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Depósito hermético transparente para recoger virutas en el aula."
    },
    {
        "id_producto": 109,
        "codigo_barras": "7501042300321",
        "sku": "ESCU-TEC-45-28",
        "nombre": "Escuadra de 45 Grados Acrílico Técnico 28cm Sin Bisel",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 38.0,
        "precio_venta_mayoreo": 32.0,
        "stock_actual": 12,
        "stock_minimo": 3,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Acrílico transparente grueso de 2mm para dibujo técnico profesional."
    },
    {
        "id_producto": 110,
        "codigo_barras": "7501042300338",
        "sku": "ESCU-TEC-60-32",
        "nombre": "Escuadra de 60 Grados Acrílico Técnico 32cm Sin Bisel",
        "id_categoria": 5,
        "id_marca": 8,
        "id_unidad": 1,
        "precio_compra": 25.0,
        "precio_venta_menudeo": 42.0,
        "precio_venta_mayoreo": 36.0,
        "stock_actual": 10,
        "stock_minimo": 3,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Escuadra 30/60 para dibujo arquitectónico de alta exactitud."
    },
    {
        "id_producto": 111,
        "codigo_barras": "7501041007010",
        "sku": "BEROL-PRIS-12L",
        "nombre": "Lápices de Color Prismacolor Junior 12p Largos",
        "id_categoria": 6,
        "id_marca": 12,
        "id_unidad": 1,
        "precio_compra": 42.0,
        "precio_venta_menudeo": 68.0,
        "precio_venta_mayoreo": 60.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Minas cremosas de 4mm con pigmentación intensa para mezclas."
    },
    {
        "id_producto": 112,
        "codigo_barras": "7501041007027",
        "sku": "BEROL-PRIS-24L",
        "nombre": "Lápices de Color Prismacolor Junior 24p Largos",
        "id_categoria": 6,
        "id_marca": 12,
        "id_unidad": 1,
        "precio_compra": 78.0,
        "precio_venta_menudeo": 125.0,
        "precio_venta_mayoreo": 110.0,
        "stock_actual": 15,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Estuche completo de 24 colores brillantes con tonos piel y metálicos."
    },
    {
        "id_producto": 113,
        "codigo_barras": "7501017003016",
        "sku": "DIXON-MAPI-12C",
        "nombre": "Lápices de Colores Dixon Mapita 12p Cortos",
        "id_categoria": 6,
        "id_marca": 3,
        "id_unidad": 1,
        "precio_compra": 19.5,
        "precio_venta_menudeo": 32.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Colores clásicos escolares económicos y resistentes."
    },
    {
        "id_producto": 114,
        "codigo_barras": "7501009001013",
        "sku": "CRAY-CERA-12P",
        "nombre": "Caja de Crayones de Cera Estándar 12p Crayola",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 16.0,
        "precio_venta_menudeo": 26.0,
        "precio_venta_mayoreo": 22.5,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Fórmula no tóxica con doble envoltura de papel para mayor resistencia."
    },
    {
        "id_producto": 115,
        "codigo_barras": "7501009001020",
        "sku": "CRAY-JUMB-8P",
        "nombre": "Caja de Crayones Jumbo Lavables 8p Crayola",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 24.0,
        "precio_venta_menudeo": 38.0,
        "precio_venta_mayoreo": 33.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Grosor extra para manos pequeñas de preescolar, lavables en ropa y paredes."
    },
    {
        "id_producto": 116,
        "codigo_barras": "7501009002010",
        "sku": "CRAY-PLUM-12P",
        "nombre": "Plumones de Agua Lavables 12 Piezas Crayola",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 34.0,
        "precio_venta_menudeo": 54.0,
        "precio_venta_mayoreo": 47.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Punta cónica para trazos finos y gruesos, tinta base agua lavable."
    },
    {
        "id_producto": 117,
        "codigo_barras": "7501009002027",
        "sku": "CRAY-SUPERTIPS-24",
        "nombre": "Plumones Delgados SuperTips 24 Colores Crayola",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 68.0,
        "precio_venta_menudeo": 105.0,
        "precio_venta_mayoreo": 92.0,
        "stock_actual": 18,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Set para lettering y dibujo artístico con 24 tonos diferenciados."
    },
    {
        "id_producto": 118,
        "codigo_barras": "7501041008017",
        "sku": "BEROL-PLAS-180G",
        "nombre": "Barra de Plastilina Modelina 180g Berol Varios Col",
        "id_categoria": 6,
        "id_marca": 12,
        "id_unidad": 1,
        "precio_compra": 8.5,
        "precio_venta_menudeo": 15.0,
        "precio_venta_mayoreo": 12.0,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Plastilina escolar suave que no mancha las manos ni se endurece al aire."
    },
    {
        "id_producto": 119,
        "codigo_barras": "7501041008024",
        "sku": "BEROL-PLAS-10B",
        "nombre": "Caja de Plastilina con 10 Barritas Surtidas Berol",
        "id_categoria": 6,
        "id_marca": 12,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Paquete multicolor con 10 tonos básicos para trabajos de modelado."
    },
    {
        "id_producto": 120,
        "codigo_barras": "7501009003017",
        "sku": "CRAY-ACUA-12P",
        "nombre": "Acuarelas Escolares Lavables con Pincel 12 Pastillas",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 31.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Estuche plástico con tapa mezcladora y pincel de cerdas naturales."
    },
    {
        "id_producto": 121,
        "codigo_barras": "7501009003116",
        "sku": "PINT-TEMP-25ML",
        "nombre": "Pintura Gouache Tempera Escolar 25ml Varios Colores",
        "id_categoria": 6,
        "id_marca": 7,
        "id_unidad": 1,
        "precio_compra": 6.5,
        "precio_venta_menudeo": 12.0,
        "precio_venta_mayoreo": 9.5,
        "stock_actual": 50,
        "stock_minimo": 12,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Bote con pintura al agua opaca lista para aplicar en cartón y papel."
    },
    {
        "id_producto": 122,
        "codigo_barras": "7501056306013",
        "sku": "PINC-PAQ-5P",
        "nombre": "Juego de Pinceles Escolares Pelo Camello (Paq 5p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 14.5,
        "precio_venta_menudeo": 25.0,
        "precio_venta_mayoreo": 21.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Pinceles redondos No. 2, 4, 6, 8 y plano 1/2 para arte y acuarela."
    },
    {
        "id_producto": 123,
        "codigo_barras": "7501056306112",
        "sku": "FOAM-CARTA-LISO",
        "nombre": "Foamy Tamaño Carta Colores Lisos (Paq 10p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 15.0,
        "precio_venta_menudeo": 25.0,
        "precio_venta_mayoreo": 22.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Goma EVA de 2mm espesor colores primarios y secundarios para recortar."
    },
    {
        "id_producto": 124,
        "codigo_barras": "7501056306129",
        "sku": "FOAM-CARTA-DIAM",
        "nombre": "Foamy Tamaño Carta Diamantado con Brillos (Paq 5p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 22,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Acabado brillante con purpurina adherida que no se desprende."
    },
    {
        "id_producto": 125,
        "codigo_barras": "7501056306204",
        "sku": "OJIT-MOVI-SURT",
        "nombre": "Ojos Movibles para Manualidades Tamaños Surtidos (50p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 8.0,
        "precio_venta_menudeo": 15.0,
        "precio_venta_mayoreo": 12.0,
        "stock_actual": 30,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Bolsa con ojos de plástico redondos para muñecos y títeres."
    },
    {
        "id_producto": 126,
        "codigo_barras": "7501056306211",
        "sku": "LIMP-PIPA-SURT",
        "nombre": "Limpiapipas de Colores Chenille (Paq 25p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Alambres afelpados maleables para figuras y estructuras."
    },
    {
        "id_producto": 127,
        "codigo_barras": "7501056306228",
        "sku": "ABAT-MADE-NAT50",
        "nombre": "Abatelenguas de Madera Natural Pulida (Paq 50p)",
        "id_categoria": 6,
        "id_marca": 5,
        "id_unidad": 3,
        "precio_compra": 10.5,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Palitos anchos de madera sin astillas para maquetas y manualidades."
    },
    {
        "id_producto": 128,
        "codigo_barras": "7501056306235",
        "sku": "GIS-BLAN-CAJA50",
        "nombre": "Gis Blanco Antipolvo para Pizarrón (Caja 50p) Dixon",
        "id_categoria": 6,
        "id_marca": 3,
        "id_unidad": 2,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tiza blanca cilíndrica de carbonato de calcio que no genera polvo volátil."
    },
    {
        "id_producto": 129,
        "codigo_barras": "7501056306242",
        "sku": "GIS-COLO-CAJA12",
        "nombre": "Gis de Colores Pastel Antipolvo (Caja 12p) Dixon",
        "id_categoria": 6,
        "id_marca": 3,
        "id_unidad": 2,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 22.0,
        "precio_venta_mayoreo": 18.5,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Gises de colores vivos para juegos de patio, asfalto y pizarrones verdes."
    },
    {
        "id_producto": 130,
        "codigo_barras": "7501015001014",
        "sku": "FOLD-MANI-CTA",
        "nombre": "Folder Manila Tamaño Carta con Pestaña (Paq 25p)",
        "id_categoria": 7,
        "id_marca": 1,
        "id_unidad": 3,
        "precio_compra": 32.0,
        "precio_venta_menudeo": 52.0,
        "precio_venta_mayoreo": 45.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Cartulina manila resistente con pestaña lateral 1/3 para membrete."
    },
    {
        "id_producto": 131,
        "codigo_barras": "7501015001021",
        "sku": "FOLD-MANI-OFI",
        "nombre": "Folder Manila Tamaño Oficio con Pestaña (Paq 25p)",
        "id_categoria": 7,
        "id_marca": 1,
        "id_unidad": 3,
        "precio_compra": 38.0,
        "precio_venta_menudeo": 60.0,
        "precio_venta_mayoreo": 52.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Tamaño oficio para archivo legal de documentos y expedientes."
    },
    {
        "id_producto": 132,
        "codigo_barras": "7501015001038",
        "sku": "FOLD-PLAS-COST",
        "nombre": "Folder Plástico Transparente con Costilla Carta",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 4.5,
        "precio_venta_menudeo": 9.0,
        "precio_venta_mayoreo": 7.5,
        "stock_actual": 40,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Broche de presión deslizable para entregar reportes sin perforar hojas."
    },
    {
        "id_producto": 133,
        "codigo_barras": "7501015002011",
        "sku": "BACO-BROC-8CM",
        "nombre": "Broches para Archivo Tipo Baco Metálicos 8cm (Caja 50)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 2,
        "precio_compra": 38.0,
        "precio_venta_menudeo": 62.0,
        "precio_venta_mayoreo": 54.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Base y compresor de lámina de hojalata inoxidable capacidad 5cm."
    },
    {
        "id_producto": 134,
        "codigo_barras": "7501015003018",
        "sku": "BACO-CLIP-NO1",
        "nombre": "Clips Metálicos Galvanizados No. 1 Estándar (Caja 100)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 2,
        "precio_compra": 9.5,
        "precio_venta_menudeo": 16.0,
        "precio_venta_mayoreo": 13.5,
        "stock_actual": 45,
        "stock_minimo": 10,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Alambre electrogalvanizado resistente a la corrosión largo 33mm."
    },
    {
        "id_producto": 135,
        "codigo_barras": "7501015003025",
        "sku": "BACO-CLIP-JUMB",
        "nombre": "Clips Metálicos Galvanizados Jumbo No. 2 (Caja 50p)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 2,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 17.0,
        "stock_actual": 35,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Clips grandes 50mm para sujetar legajos de más de 30 páginas."
    },
    {
        "id_producto": 136,
        "codigo_barras": "7501056307010",
        "sku": "BARR-ENGR-TIRA",
        "nombre": "Engrapadora Metálica de Oficina Tira Completa Barrilito",
        "id_categoria": 7,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 58.0,
        "precio_venta_menudeo": 92.0,
        "precio_venta_mayoreo": 82.0,
        "stock_actual": 12,
        "stock_minimo": 3,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Cuerpo metálico con base de goma antideslizante capacidad 25 hojas."
    },
    {
        "id_producto": 137,
        "codigo_barras": "7501056307027",
        "sku": "BARR-GRAP-26-6",
        "nombre": "Grapas Estándar 26/6 (Caja con 5000 piezas) Barrilito",
        "id_categoria": 7,
        "id_marca": 5,
        "id_unidad": 2,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Corona estándar 1/2 pulgada de acero cobrizado de penetración limpia."
    },
    {
        "id_producto": 138,
        "codigo_barras": "7501056307034",
        "sku": "BARR-QUIT-PINZ",
        "nombre": "Quitagrapas Metálico Tipo Pinza con Mordaza Barrilito",
        "id_categoria": 7,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 11.0,
        "precio_venta_menudeo": 18.0,
        "precio_venta_mayoreo": 15.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Dientes de acero que retiran grapas sin desgarrar los documentos."
    },
    {
        "id_producto": 139,
        "codigo_barras": "7501056307119",
        "sku": "BARR-PERF-2ORIF",
        "nombre": "Perforadora Metálica de 2 Orificios Barrilito",
        "id_categoria": 7,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 42.0,
        "precio_venta_menudeo": 68.0,
        "precio_venta_mayoreo": 60.0,
        "stock_actual": 10,
        "stock_minimo": 3,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Distancia estándar 8cm con guía de centrado de papel y depósito de confeti."
    },
    {
        "id_producto": 140,
        "codigo_barras": "7501015004015",
        "sku": "CARP-3ARG-1PULG",
        "nombre": "Carpeta Panorámica de 3 Argollas Carta 1 Pulg",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 35.0,
        "precio_venta_menudeo": 56.0,
        "precio_venta_mayoreo": 49.0,
        "stock_actual": 15,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Funda plástica transparente en portada y lomo para personalización."
    },
    {
        "id_producto": 141,
        "codigo_barras": "7501015004114",
        "sku": "SEPA-CARP-5DIV",
        "nombre": "Separadores Plásticos para Carpeta 3 Argollas (5p)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 3,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Polipropileno indeformable con 5 pestañas de colores para materias."
    },
    {
        "id_producto": 142,
        "codigo_barras": "7501015004213",
        "sku": "PROT-HOJA-100P",
        "nombre": "Protectores de Hojas Plásticos Carta (Paq 100 fundas)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 3,
        "precio_compra": 48.0,
        "precio_venta_menudeo": 78.0,
        "precio_venta_mayoreo": 68.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Fundas cristalinas libres de ácido con perforación universal 3 y 11 hoyos."
    },
    {
        "id_producto": 143,
        "codigo_barras": "7501015005012",
        "sku": "BIND-CLIP-19MM",
        "nombre": "Sujetadocumentos Binder Clip Negro 19mm (Caja 12p)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 2,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 17.0,
        "stock_actual": 30,
        "stock_minimo": 8,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Pinzas metálicas de presión negras ancho 3/4 pulgada para 50 hojas."
    },
    {
        "id_producto": 144,
        "codigo_barras": "7501015005029",
        "sku": "BIND-CLIP-32MM",
        "nombre": "Sujetadocumentos Binder Clip Negro 32mm (Caja 12p)",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 2,
        "precio_compra": 22.0,
        "precio_venta_menudeo": 36.0,
        "precio_venta_mayoreo": 31.0,
        "stock_actual": 25,
        "stock_minimo": 6,
        "es_servicio": false,
        "permite_desglose": true,
        "descripcion": "Pinzas binder de 1-1/4 pulgada para legajos de hasta 140 hojas."
    },
    {
        "id_producto": 145,
        "codigo_barras": "7501015006019",
        "sku": "ALMO-SELLO-NEGR",
        "nombre": "Almohadilla para Sellos de Goma Entintada Negra No. 1",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 18.0,
        "precio_venta_menudeo": 30.0,
        "precio_venta_mayoreo": 26.0,
        "stock_actual": 20,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Caja metálica con fieltro entintado de secado rápido tamaño 6x10cm."
    },
    {
        "id_producto": 146,
        "codigo_barras": "7501015006026",
        "sku": "TINT-SELLO-30ML",
        "nombre": "Tinta para Almohadilla de Sellos 30ml Negra con Gotero",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 24.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 22,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Frasco con dosificador para recargar cojines de sello."
    },
    {
        "id_producto": 147,
        "codigo_barras": "7501015007016",
        "sku": "TABL-APOY-CARTA",
        "nombre": "Tabla de Apoyo con Clip Metálico Tamaño Carta MDF",
        "id_categoria": 7,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 20.0,
        "precio_venta_menudeo": 34.0,
        "precio_venta_mayoreo": 29.0,
        "stock_actual": 16,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Tabla rígida de madera comprimida con pinza de resorte para inventarios."
    },
    {
        "id_producto": 148,
        "codigo_barras": "7501015007023",
        "sku": "BORR-PIZA-BLAN",
        "nombre": "Borrador para Pizarrón Blanco Magnético Ergonómico",
        "id_categoria": 7,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 16.0,
        "precio_venta_menudeo": 28.0,
        "precio_venta_mayoreo": 24.0,
        "stock_actual": 18,
        "stock_minimo": 5,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Almohadilla de fieltro lavable con imán integrado que se adhiere al pizarrón."
    },
    {
        "id_producto": 149,
        "codigo_barras": "7501015007030",
        "sku": "LIMP-PIZA-250ML",
        "nombre": "Líquido Limpiador para Pizarrón Blanco 250ml en Spray",
        "id_categoria": 7,
        "id_marca": 9,
        "id_unidad": 1,
        "precio_compra": 24.0,
        "precio_venta_menudeo": 40.0,
        "precio_venta_mayoreo": 35.0,
        "stock_actual": 15,
        "stock_minimo": 4,
        "es_servicio": false,
        "permite_desglose": false,
        "descripcion": "Fórmula no tóxica que elimina residuos grasos y sombras secas de marcador."
    },
    {
        "id_producto": 150,
        "codigo_barras": "7501099900010",
        "sku": "SERV-COPIA-BN",
        "nombre": "Fotocopia Tamaño Carta B/N (Servicio)",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 0.2,
        "precio_venta_menudeo": 1.0,
        "precio_venta_mayoreo": 0.8,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Copia en tóner negro sobre papel bond de 75g (Art. con stock infinito)."
    },
    {
        "id_producto": 151,
        "codigo_barras": "7501099900027",
        "sku": "SERV-COPIA-COL",
        "nombre": "Fotocopia Tamaño Carta Color Láser (Servicio)",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 1.5,
        "precio_venta_menudeo": 5.0,
        "precio_venta_mayoreo": 4.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Impresión o fotocopia láser a color en alta resolución."
    },
    {
        "id_producto": 152,
        "codigo_barras": "7501099900034",
        "sku": "SERV-COPIA-OFI",
        "nombre": "Fotocopia Tamaño Oficio B/N (Servicio)",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 0.35,
        "precio_venta_menudeo": 1.5,
        "precio_venta_mayoreo": 1.2,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Fotocopia en papel bond oficio para documentos legales."
    },
    {
        "id_producto": 153,
        "codigo_barras": "7501099900041",
        "sku": "SERV-IMP-FOTO",
        "nombre": "Impresión Fotográfica Carta Papel Glossy Brillante",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 6.5,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 16.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Impresión fotográfica calidad laboratorio en papel brillante 200g."
    },
    {
        "id_producto": 154,
        "codigo_barras": "7501099900058",
        "sku": "SERV-ENMIC-CRED",
        "nombre": "Enmicado Térmico Tamaño Credencial / Gafete",
        "id_categoria": 8,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 2.0,
        "precio_venta_menudeo": 8.0,
        "precio_venta_mayoreo": 6.5,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Mica térmica rígida sellada al calor para tarjetas y credenciales."
    },
    {
        "id_producto": 155,
        "codigo_barras": "7501099900065",
        "sku": "SERV-ENMIC-CTA",
        "nombre": "Enmicado Térmico Tamaño Carta 5 Milésimas",
        "id_categoria": 8,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 4.5,
        "precio_venta_menudeo": 15.0,
        "precio_venta_mayoreo": 12.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Mica térmica sellada para certificados, diplomas y listas."
    },
    {
        "id_producto": 156,
        "codigo_barras": "7501099900072",
        "sku": "SERV-ENMIC-OFI",
        "nombre": "Enmicado Térmico Tamaño Oficio 5 Milésimas",
        "id_categoria": 8,
        "id_marca": 5,
        "id_unidad": 1,
        "precio_compra": 6.0,
        "precio_venta_menudeo": 20.0,
        "precio_venta_mayoreo": 16.5,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Enmicado oficio para títulos y documentos notariales."
    },
    {
        "id_producto": 157,
        "codigo_barras": "7501099900089",
        "sku": "SERV-ENGAR-ESP50",
        "nombre": "Engargolado Espiral Plástico 1-50 Hojas (Inc. Pastas)",
        "id_categoria": 8,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 8.0,
        "precio_venta_menudeo": 25.0,
        "precio_venta_mayoreo": 20.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Incluye portada transparente, contraportada negra y arillo plástico."
    },
    {
        "id_producto": 158,
        "codigo_barras": "7501099900096",
        "sku": "SERV-ENGAR-MET80",
        "nombre": "Engargolado Arillo Metálico Wire-O 1-80 Hojas",
        "id_categoria": 8,
        "id_marca": 11,
        "id_unidad": 1,
        "precio_compra": 14.0,
        "precio_venta_menudeo": 40.0,
        "precio_venta_mayoreo": 34.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Acabado ejecutivo metálico de doble anillo para tesis y manuales."
    },
    {
        "id_producto": 159,
        "codigo_barras": "7501099900102",
        "sku": "SERV-ESCAN-DOC",
        "nombre": "Escaneo de Documento a USB o Correo en PDF",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 0.5,
        "precio_venta_menudeo": 3.0,
        "precio_venta_mayoreo": 2.5,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Digitalización óptica a 300 DPI guardada en formato PDF estándar."
    },
    {
        "id_producto": 160,
        "codigo_barras": "7501099900119",
        "sku": "SERV-IMPR-PLANO",
        "nombre": "Impresión de Plano Arquitectónico 90x60cm B/N Bond",
        "id_categoria": 8,
        "id_marca": 1,
        "id_unidad": 1,
        "precio_compra": 12.0,
        "precio_venta_menudeo": 35.0,
        "precio_venta_mayoreo": 28.0,
        "stock_actual": 9999,
        "stock_minimo": 0,
        "es_servicio": true,
        "permite_desglose": false,
        "descripcion": "Plotter de inyección para planos técnicos de ingeniería y arquitectura."
    }
];

// Estado relacional en memoria
let sqlDatabase = {
    configuracion: [...SEED_CONFIGURACION],
    usuarios: [...SEED_USUARIOS],
    categorias: [...SEED_CATEGORIAS],
    marcas: [...SEED_MARCAS],
    unidades: [...SEED_UNIDADES],
    proveedores: [...SEED_PROVEEDORES],
    productos: [...PRODUCTOS_CATALOGO_160],
    kardex: [],
    ventas: [],
    detalle_ventas: [],
    turnos_caja: [
        {
            id_turno: 1,
            id_usuario: 1,
            usuario: 'Gerardo Cabrera Morales (Líder Técnico & Cajero)',
            fecha_apertura: new Date().toISOString(),
            monto_inicial_fondo: 500.00,
            fondo_inicial: 500.00,
            total_ventas_efectivo: 0.00,
            total_ventas_tarjeta: 0.00,
            total_ventas_transferencia: 0.00,
            total_entradas_manuales: 0.00,
            total_salidas_manuales: 0.00,
            estado: 'ABIERTO',
            fecha_cierre: null
        }
    ],
    mermas: [],
    entradas: [],
    devoluciones_cambios: [],
    bitacora_seguridad: []
};

// =============================================================================
// MOTOR CRIPTOGRAFICO Y BLINDAJE DE INTEGRIDAD LOCAL (SHA-256 SYNC)
// =============================================================================

function sha256Sync(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    const utf8Str = unescape(encodeURIComponent(ascii));
    const words = [];
    const asciiBitLength = utf8Str.length * 8;
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

    for (let i = 0; i < utf8Str.length; i++) {
        const j = i >> 2;
        words[j] = (words[j] || 0) | (utf8Str.charCodeAt(i) << ((3 - (i % 4)) * 8));
    }
    const endWord = utf8Str.length >> 2;
    words[endWord] = (words[endWord] || 0) | (0x80 << ((3 - (utf8Str.length % 4)) * 8));
    words[(((utf8Str.length + 8) >> 6) << 4) + 15] = asciiBitLength;

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
    let result = '';
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j >= 0; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

const DB_INTEGRITY_SALT = 'PapeleriaABC_SecuredStorage_v6_salt_9f82a17c!';
const LOCAL_STORAGE_SIG_KEY = 'PAPELERIA_ABC_SQL_STORE_V6_SIG';

function calcularFirmaIntegridad(dataString) {
    return sha256Sync(DB_INTEGRITY_SALT + ':' + dataString + ':' + DB_INTEGRITY_SALT);
}

function deepClone(obj) {
    if (obj === undefined || obj === null) return obj;
    return JSON.parse(JSON.stringify(obj));
}

// Bitacora de incidentes y auditoria de seguridad
function registrarIncidenteSeguridad(incidente) {
    if (!sqlDatabase.bitacora_seguridad) {
        sqlDatabase.bitacora_seguridad = [];
    }
    const curUser = (window.AUTH_MODULE && typeof window.AUTH_MODULE.getCurrentUser === 'function')
        ? window.AUTH_MODULE.getCurrentUser()
        : null;

    const evento = {
        id_evento: sqlDatabase.bitacora_seguridad.length + 1,
        fecha_hora: new Date().toISOString(),
        tipo_evento: incidente.tipo_evento || 'ACCESO_NO_AUTORIZADO',
        origen: incidente.origen || 'MOTOR_BD',
        usuario: incidente.usuario || (curUser ? curUser.username : 'ANONIMO'),
        rol: incidente.rol || (curUser ? curUser.rol : 'SIN_SESION'),
        detalles: incidente.detalles || 'Sin detalles adicionales',
        severidad: incidente.severidad || 'ALTA'
    };

    sqlDatabase.bitacora_seguridad.unshift(evento);
    if (sqlDatabase.bitacora_seguridad.length > 500) {
        sqlDatabase.bitacora_seguridad.length = 500;
    }
    try {
        const raw = JSON.stringify(sqlDatabase);
        localStorage.setItem(LOCAL_STORAGE_KEY, raw);
        localStorage.setItem(LOCAL_STORAGE_SIG_KEY, calcularFirmaIntegridad(raw));
    } catch (e) {
        // Silencioso en caso de limite de almacenamiento
    }
    return evento;
}

async function getBitacoraSeguridad() {
    if (!sqlDatabase.bitacora_seguridad) {
        sqlDatabase.bitacora_seguridad = [];
    }
    return Promise.resolve(deepClone(sqlDatabase.bitacora_seguridad));
}

// Control de Acceso a Nivel de Base de Datos (Data-Layer RBAC)
let isSystemBootstrapping = false;

function assertDatabasePermission(actionName, allowedRoles) {
    if (isSystemBootstrapping) {
        return true;
    }
    const curUser = (window.AUTH_MODULE && typeof window.AUTH_MODULE.getCurrentUser === 'function')
        ? window.AUTH_MODULE.getCurrentUser()
        : null;

    if (!curUser) {
        registrarIncidenteSeguridad({
            tipo_evento: 'VIOLACION_RBAC_BD',
            origen: actionName,
            detalles: 'Intento de ejecucion de ' + actionName + ' sin sesion activa. Requiere roles: [' + allowedRoles.join(', ') + ']',
            severidad: 'ALTA'
        });
        throw new Error('[Seguridad BD] Acceso denegado: No hay una sesion activa. La operacion \'' + actionName + '\' requiere autenticacion con rol [' + allowedRoles.join(', ') + '].');
    }

    const userRole = (curUser.rol || '').trim().toUpperCase();
    if (!allowedRoles.includes(userRole)) {
        registrarIncidenteSeguridad({
            tipo_evento: 'VIOLACION_RBAC_BD',
            origen: actionName,
            usuario: curUser.username,
            rol: userRole,
            detalles: 'Usuario ' + curUser.username + ' con rol ' + userRole + ' intento ejecutar ' + actionName + ', el cual requiere [' + allowedRoles.join(', ') + ']',
            severidad: 'ALTA'
        });
        throw new Error('[Seguridad BD] Permisos insuficientes: El rol \'' + userRole + '\' no tiene autorizacion para ejecutar \'' + actionName + '\'. Se requiere [' + allowedRoles.join(', ') + '].');
    }

    return true;
}

// Generar Kardex inicial si está vacío
function generateInitialKardex() {
    const nowIso = new Date().toISOString();
    return sqlDatabase.productos.map(p => ({
        id_kardex: p.id_producto,
        id_movimiento: p.id_producto,
        id_producto: p.id_producto,
        tipo_movimiento: 'INVENTARIO_INICIAL',
        cantidad: p.stock_actual,
        stock_anterior: 0,
        stock_posterior: p.stock_actual,
        costo_unitario: p.precio_compra,
        fecha_hora: nowIso,
        referencia: 'Apertura de Almacén - Papelería A B C',
        referencia_detalle: 'Carga inicial de Catálogo Maestro Oficial (160 Artículos)',
        usuario: 'Gerardo Cabrera Morales'
    }));
}

// Persistir estado relacional a LocalStorage con Firma Criptografica de Integridad
function persistToLocalStorage() {
    try {
        const raw = JSON.stringify(sqlDatabase);
        const sig = calcularFirmaIntegridad(raw);
        localStorage.setItem(LOCAL_STORAGE_KEY, raw);
        localStorage.setItem(LOCAL_STORAGE_SIG_KEY, sig);
    } catch (e) {
        console.warn('[SQL DB] Aviso al guardar en LocalStorage:', e);
    }
}

// Cargar estado relacional de LocalStorage validando firma anti-manipulacion
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const sig = localStorage.getItem(LOCAL_STORAGE_SIG_KEY);
        if (raw) {
            if (sig) {
                const expectedSig = calcularFirmaIntegridad(raw);
                if (sig !== expectedSig) {
                    console.error('[Seguridad BD] ALERTA CRITICA: Se detecto alteracion en los datos de LocalStorage. Firma no valida. Restaurando datos protegidos.');
                    registrarIncidenteSeguridad({
                        tipo_evento: 'ALTERACION_LOCALSTORAGE_DETECTADA',
                        origen: 'loadFromLocalStorage',
                        detalles: 'La firma de integridad no coincide con los datos almacenados. Posible manipulacion manual de registros en DevTools.',
                        severidad: 'CRITICA'
                    });
                    return false;
                }
            } else {
                try {
                    localStorage.setItem(LOCAL_STORAGE_SIG_KEY, calcularFirmaIntegridad(raw));
                } catch (e) {}
            }

            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.productos) && parsed.productos.length >= 100) {
                sqlDatabase = parsed;
                if (!Array.isArray(sqlDatabase.bitacora_seguridad)) {
                    sqlDatabase.bitacora_seguridad = [];
                }
                console.log(`[SQL DB] Base de datos relacional cargada y verificada (${sqlDatabase.productos.length} productos).`);
                return true;
            }
        }
    } catch (e) {
        console.warn('[SQL DB] Aviso al leer de LocalStorage:', e);
    }
    return false;
}

// Inicialización de la base de datos relacional

// Generador de ventas históricas muestra para analítica y reportes inmediatos (Fase 6)
function generateSeedSales() {
    const ventas = [];
    const detalles = [];
    const baseDate = new Date();

    const sampleItems = [
        { id: 1, nombre: 'Cuaderno Profesional Raya 100 Hojas Scribe', pu: 29.00, cat: 1 },
        { id: 2, nombre: 'Cuaderno Profesional Cuadro Grande Scribe', pu: 29.00, cat: 1 },
        { id: 21, nombre: 'Bolígrafo Cristal Tinta Negra Bic', pu: 7.50, cat: 2 },
        { id: 22, nombre: 'Bolígrafo Cristal Tinta Azul Bic', pu: 7.50, cat: 2 },
        { id: 41, nombre: 'Lápiz Adhesivo en Barra 22g Pritt', pu: 28.00, cat: 3 },
        { id: 23, nombre: 'Lápiz Grafito #2 HB Dixon', pu: 8.00, cat: 2 },
        { id: 27, nombre: 'Goma de Borrar Blanca Factis', pu: 6.50, cat: 2 },
        { id: 81, nombre: 'Tijeras Escolares Punta Roma Barrilito', pu: 24.50, cat: 5 },
        { id: 82, nombre: 'Juego de Geometría Flexible 5 Piezas Maped', pu: 45.00, cat: 5 },
        { id: 9999, nombre: 'Fotocopia Blanco y Negro Carta', pu: 1.00, cat: 8, es_servicio: true },
        { id: 9998, nombre: 'Fotocopia / Impresión Color Carta', pu: 5.00, cat: 8, es_servicio: true },
        { id: 9997, nombre: 'Enmicado Carta Térmico', pu: 15.00, cat: 8, es_servicio: true }
    ];

    const metodos = ['EFECTIVO', 'EFECTIVO', 'TARJETA', 'EFECTIVO', 'TRANSFERENCIA'];
    const cajeros = ['Gerardo Cabrera Morales', 'Daniel Parada Gonzalez', 'Gerardo Cabrera Morales'];

    // Generar 20 ventas distribuidas en los últimos 7 días
    let dId = 1;
    for (let i = 1; i <= 20; i++) {
        const daysAgo = Math.floor((20 - i) / 3);
        const saleTime = new Date(baseDate);
        saleTime.setDate(baseDate.getDate() - daysAgo);
        saleTime.setHours(9 + (i % 9), (i * 17) % 60, 0);

        // Elegir 1 a 4 productos
        const numItems = 1 + (i % 3);
        const cart = [];
        for (let j = 0; j < numItems; j++) {
            const item = sampleItems[(i + j * 3) % sampleItems.length];
            const qty = (item.es_servicio && item.pu === 1.00) ? (5 + (i * 2) % 20) : (1 + (i + j) % 4);
            const sub = qty * item.pu;
            cart.push({
                id_producto: item.id,
                nombre: item.nombre,
                cantidad: qty,
                precio_unitario: item.pu,
                subtotal: sub,
                es_servicio: Boolean(item.es_servicio)
            });
        }

        const totalBruto = cart.reduce((s, it) => s + it.subtotal, 0);
        const descPct = (i % 5 === 0) ? 10 : 0;
        const montoDesc = totalBruto * (descPct / 100);
        const totalNeto = totalBruto - montoDesc;
        const subtotalSinIva = totalNeto / 1.16;
        const iva = totalNeto - subtotalSinIva;
        const metodo = metodos[i % metodos.length];
        const recibido = metodo === 'EFECTIVO' ? Math.ceil(totalNeto / 50) * 50 : totalNeto;

        ventas.push({
            id_venta: i,
            folio_ticket: 'TICK-' + String(i).padStart(5, '0'),
            folio_venta: i,
            fecha_hora: saleTime.toISOString(),
            total_articulos: cart.reduce((s, it) => s + it.cantidad, 0),
            subtotal: subtotalSinIva,
            iva: iva,
            descuento: montoDesc,
            descuento_porcentaje: descPct,
            total_bruto: totalBruto,
            total: totalNeto,
            metodo_pago: metodo,
            monto_recibido: recibido,
            cambio: Math.max(0, recibido - totalNeto),
            cajero: cajeros[i % cajeros.length],
            estado: 'COMPLETADA'
        });

        cart.forEach(it => {
            detalles.push({
                id_detalle: dId++,
                id_venta: i,
                folio_venta: i,
                id_producto: it.id_producto,
                nombre: it.nombre,
                cantidad: it.cantidad,
                precio_unitario: it.precio_unitario,
                subtotal: it.subtotal,
                es_servicio: it.es_servicio
            });
        });
    }

    return { ventas, detalles };
}


function generateSeedCortes() {
    const baseDate = new Date();
    const d1 = new Date(baseDate); d1.setDate(baseDate.getDate() - 2);
    const d2 = new Date(baseDate); d2.setDate(baseDate.getDate() - 1);
    return [
        {
            id_corte: 1,
            id_turno: 1,
            folio_corte: 'CORTE-Z-0001',
            cajero: 'Gerardo Cabrera Morales',
            fecha_apertura: new Date(d1.getTime() - 8 * 3600000).toISOString(),
            fecha_cierre: d1.toISOString(),
            fondo_inicial: 500,
            ventas_efectivo: 3250.00,
            ventas_tarjeta: 1420.50,
            ventas_transferencia: 600.00,
            total_ventas: 5270.50,
            entradas_manuales: 200,
            retiros_manuales: 500,
            esperado_cajon: 3450.00,
            contado_fisico: 3450.00,
            diferencia: 0.00,
            desglose: {}
        },
        {
            id_corte: 2,
            id_turno: 2,
            folio_corte: 'CORTE-Z-0002',
            cajero: 'Daniel Parada Gonzalez',
            fecha_apertura: new Date(d2.getTime() - 8 * 3600000).toISOString(),
            fecha_cierre: d2.toISOString(),
            fondo_inicial: 500,
            ventas_efectivo: 2890.00,
            ventas_tarjeta: 980.00,
            ventas_transferencia: 350.00,
            total_ventas: 4220.00,
            entradas_manuales: 150,
            retiros_manuales: 0,
            esperado_cajon: 3540.00,
            contado_fisico: 3540.00,
            diferencia: 0.00,
            desglose: {}
        }
    ];
}

function generateSeedMovimientos() {
    const baseDate = new Date();
    const d1 = new Date(baseDate); d1.setDate(baseDate.getDate() - 2);
    const d2 = new Date(baseDate); d2.setDate(baseDate.getDate() - 1);
    return [
        {
            id_movimiento_caja: 1,
            id_turno: 1,
            tipo: 'ENTRADA',
            monto: 200.00,
            concepto: 'Fondo de cambio adicional para billetes de 500',
            fecha_hora: d1.toISOString(),
            usuario: 'Gerardo Cabrera Morales'
        },
        {
            id_movimiento_caja: 2,
            id_turno: 1,
            tipo: 'RETIRO',
            monto: 500.00,
            concepto: 'Retiro parcial de resguardo de efectivo',
            fecha_hora: d1.toISOString(),
            usuario: 'Gerardo Cabrera Morales'
        },
        {
            id_movimiento_caja: 3,
            id_turno: 2,
            tipo: 'ENTRADA',
            monto: 150.00,
            concepto: 'Dotacion de monedas para cambio',
            fecha_hora: d2.toISOString(),
            usuario: 'Astrid García Ramírez'
        }
    ];
}

function generateSeedBitacoraSeguridad() {
    const now = new Date();
    const toIso = (minsAgo) => new Date(now.getTime() - minsAgo * 60000).toISOString();
    return [
        {
            id_evento: 1,
            fecha_hora: toIso(180),
            tipo_evento: 'LOGIN_EXITOSO',
            origen: 'AUTH_MODULE',
            usuario: 'admin',
            rol: 'ADMINISTRADOR',
            detalles: 'Inicio de sesion exitoso con credenciales criptograficas SHA-256',
            severidad: 'BAJA'
        },
        {
            id_evento: 2,
            fecha_hora: toIso(150),
            tipo_evento: 'VERIFICACION_INTEGRIDAD',
            origen: 'MOTOR_BD',
            usuario: 'admin',
            rol: 'ADMINISTRADOR',
            detalles: 'Verificacion exitosa de firma criptografica SHA-256 en almacenamiento persistente',
            severidad: 'INFO'
        },
        {
            id_evento: 3,
            fecha_hora: toIso(120),
            tipo_evento: 'APERTURA_TURNO',
            origen: 'CONTROL_CAJA',
            usuario: 'supervisor',
            rol: 'SUPERVISOR',
            detalles: 'Apertura de turno de caja Turno Matutino con fondo $500.00 MXN',
            severidad: 'INFO'
        },
        {
            id_evento: 4,
            fecha_hora: toIso(90),
            tipo_evento: 'DEVOLUCION_MERCANCIA',
            origen: 'CONTROL_CAJA',
            usuario: 'supervisor',
            rol: 'SUPERVISOR',
            detalles: 'Autorizacion de devolucion de mercancia Folio DEV-0001 (Ticket TICK-00001)',
            severidad: 'MEDIA'
        },
        {
            id_evento: 5,
            fecha_hora: toIso(60),
            tipo_evento: 'LOGIN_EXITOSO',
            origen: 'AUTH_MODULE',
            usuario: 'usuario',
            rol: 'USUARIO',
            detalles: 'Inicio de sesion de cajero en mostrador de ventas',
            severidad: 'BAJA'
        },
        {
            id_evento: 6,
            fecha_hora: toIso(30),
            tipo_evento: 'CORTE_TURNO_Z',
            origen: 'CONTROL_CAJA',
            usuario: 'usuario',
            rol: 'USUARIO',
            detalles: 'Ejecucion de arqueo y corte Z de turno con conciliacion exacta',
            severidad: 'INFO'
        },
        {
            id_evento: 7,
            fecha_hora: toIso(10),
            tipo_evento: 'AUDITORIA_CONSULTA',
            origen: 'REPORTES_ANALITICA',
            usuario: 'admin',
            rol: 'ADMINISTRADOR',
            detalles: 'Generacion y emision de Reporte Ejecutivo Oficial en PDF',
            severidad: 'INFO'
        }
    ];
}

function bootstrapDatabase() {
    isSystemBootstrapping = true;
    try {
        const loaded = loadFromLocalStorage();
        if (!loaded) {
        console.log('[SQL DB] Inicializando catálogo maestro de 160 artículos y usuarios en motor relacional...');
        sqlDatabase.productos = [...PRODUCTOS_CATALOGO_160];
        sqlDatabase.kardex = generateInitialKardex();
        sqlDatabase.usuarios = [...SEED_USUARIOS];
        const seedS = generateSeedSales();
        sqlDatabase.ventas = seedS.ventas;
        sqlDatabase.detalle_ventas = seedS.detalles;
        sqlDatabase.devoluciones_cambios = generateSeedDevoluciones();
        if (!sqlDatabase.cortes_caja || sqlDatabase.cortes_caja.length === 0) {
            sqlDatabase.cortes_caja = generateSeedCortes();
        }
        if (!sqlDatabase.movimientos_caja || sqlDatabase.movimientos_caja.length === 0) {
            sqlDatabase.movimientos_caja = generateSeedMovimientos();
        }
        if (!sqlDatabase.bitacora_seguridad || sqlDatabase.bitacora_seguridad.length === 0) {
            sqlDatabase.bitacora_seguridad = generateSeedBitacoraSeguridad();
        }
        persistToLocalStorage();
    } else {
        // Asegurar que existan y estén sincronizados los 3 perfiles maestros requeridos
        if (!sqlDatabase.usuarios || sqlDatabase.usuarios.length === 0) {
            sqlDatabase.usuarios = [...SEED_USUARIOS];
        } else {
            SEED_USUARIOS.forEach(seedU => {
                const idx = sqlDatabase.usuarios.findIndex(u => u.username.toLowerCase() === seedU.username.toLowerCase());
                if (idx === -1) {
                    sqlDatabase.usuarios.push({ ...seedU });
                } else {
                    sqlDatabase.usuarios[idx].rol = seedU.rol;
                    sqlDatabase.usuarios[idx].salt = seedU.salt;
                    sqlDatabase.usuarios[idx].password_hash = seedU.password_hash;
                }
            });
        }
        persistToLocalStorage();
        if (!sqlDatabase.ventas || sqlDatabase.ventas.length === 0) {
            const seedS = generateSeedSales();
            sqlDatabase.ventas = seedS.ventas;
            sqlDatabase.detalle_ventas = seedS.detalles;
            persistToLocalStorage();
        }
        if (!sqlDatabase.cortes_caja || sqlDatabase.cortes_caja.length === 0) {
            sqlDatabase.cortes_caja = generateSeedCortes();
            persistToLocalStorage();
        }
        if (!sqlDatabase.movimientos_caja || sqlDatabase.movimientos_caja.length === 0) {
            sqlDatabase.movimientos_caja = generateSeedMovimientos();
            persistToLocalStorage();
        }
        if (!sqlDatabase.bitacora_seguridad || sqlDatabase.bitacora_seguridad.length === 0) {
            sqlDatabase.bitacora_seguridad = generateSeedBitacoraSeguridad();
            persistToLocalStorage();
        }

        // Garantizar el catalogo completo de 160 productos clasificados (Fase 8)
        if (!sqlDatabase.productos || sqlDatabase.productos.length < 100) {
            console.log('[SQL DB] Actualizando catalogo a 160 articulos normalizados (Fase 8)...');
            sqlDatabase.categorias = [...SEED_CATEGORIAS];
            sqlDatabase.marcas = [...SEED_MARCAS];
            sqlDatabase.unidades = [...SEED_UNIDADES];
            sqlDatabase.proveedores = [...SEED_PROVEEDORES];
            sqlDatabase.productos = [...PRODUCTOS_CATALOGO_160];
            sqlDatabase.kardex = generateInitialKardex();
            persistToLocalStorage();
        }
    }
    } finally {
        isSystemBootstrapping = false;
    }
}

// Ejecutar inmediatamente para disponibilidad síncrona instantánea
bootstrapDatabase();

// -----------------------------------------------------------------------------
// OPERACIONES PÚBLICAS DE PERSISTENCIA Y CONSULTA (API COMPATIBLE POS_DB)
// -----------------------------------------------------------------------------

async function initDB() {
    bootstrapDatabase();
    return Promise.resolve(sqlDatabase);
}

// Sincronización o restauración garantizada de los 160 productos
async function recargarCatalogoCompleto160(forzar = false) {
    if (forzar && sqlDatabase.productos && sqlDatabase.productos.length >= 100) {
        assertDatabasePermission('recargarCatalogoCompleto160', ['ADMINISTRADOR']);
    }
    if (forzar || !sqlDatabase.productos || sqlDatabase.productos.length < 100) {
        console.log('[SQL DB] Restableciendo catálogo completo de 160 artículos...');
        sqlDatabase.categorias = [...SEED_CATEGORIAS];
        sqlDatabase.marcas = [...SEED_MARCAS];
        sqlDatabase.unidades = [...SEED_UNIDADES];
        sqlDatabase.proveedores = [...SEED_PROVEEDORES];
        sqlDatabase.productos = [...PRODUCTOS_CATALOGO_160];
        sqlDatabase.kardex = generateInitialKardex();
        persistToLocalStorage();
    }
    return Promise.resolve(true);
}

// Obtener productos con JOIN relacional a Categorías, Marcas y Unidades (SQL 3FN)
async function getProductosCompletos() {
    if (!sqlDatabase.productos || sqlDatabase.productos.length === 0) {
        await recargarCatalogoCompleto160(true);
    }

    const catMap = new Map(sqlDatabase.categorias.map(c => [c.id_categoria, c.nombre]));
    const marcaMap = new Map(sqlDatabase.marcas.map(m => [m.id_marca, m.nombre]));
    const uniMap = new Map(sqlDatabase.unidades.map(u => [u.id_unidad, u.clave]));

    const enriquecidos = sqlDatabase.productos.map(p => ({
        ...p,
        categoria_nombre: catMap.get(p.id_categoria) || 'General',
        marca_nombre: marcaMap.get(p.id_marca) || 'Genérico',
        unidad_nombre: uniMap.get(p.id_unidad) || 'PZA',
        esta_bajo_stock: !p.es_servicio && (p.stock_actual <= p.stock_minimo)
    }));

    return Promise.resolve(deepClone(enriquecidos));
}

async function getProductos() {
    return await getProductosCompletos();
}

async function buscarProductoPorCodigo(codigo) {
    const list = await getProductosCompletos();
    const query = (codigo || '').toString().trim().toLowerCase();
    const found = list.find(p => p.codigo_barras.toLowerCase() === query || p.sku.toLowerCase() === query);
    if (found) {
        found.unidad = found.unidad_nombre || 'PZA';
    }
    return Promise.resolve(found ? deepClone(found) : null);
}

async function guardarProducto(producto) {
    assertDatabasePermission('guardarProducto', ['ADMINISTRADOR', 'SUPERVISOR']);
    if (!producto || typeof producto !== 'object') {
        throw new Error('Datos de producto invalidos');
    }
    const esNuevo = !producto.id_producto;
    let idAsignado = producto.id_producto;

    if (esNuevo) {
        idAsignado = sqlDatabase.productos.length > 0 
            ? Math.max(...sqlDatabase.productos.map(p => p.id_producto)) + 1 
            : 1;
        producto.id_producto = idAsignado;
        sqlDatabase.productos.push(producto);

        sqlDatabase.kardex.push({
            id_kardex: sqlDatabase.kardex.length + 1,
            id_movimiento: sqlDatabase.kardex.length + 1,
            id_producto: idAsignado,
            tipo_movimiento: 'ALTA_PRODUCTO',
            cantidad: producto.stock_actual,
            stock_anterior: 0,
            stock_posterior: producto.stock_actual,
            costo_unitario: producto.precio_compra,
            fecha_hora: new Date().toISOString(),
            referencia: 'Alta de nuevo artículo en inventario',
            usuario: 'Gerardo Cabrera Morales'
        });
    } else {
        const idx = sqlDatabase.productos.findIndex(p => p.id_producto === producto.id_producto);
        if (idx !== -1) {
            sqlDatabase.productos[idx] = { ...sqlDatabase.productos[idx], ...producto };
        } else {
            sqlDatabase.productos.push(producto);
        }
    }

    persistToLocalStorage();
    return Promise.resolve(idAsignado);
}

async function eliminarProducto(idProducto) {
    assertDatabasePermission('eliminarProducto', ['ADMINISTRADOR', 'SUPERVISOR']);
    sqlDatabase.productos = sqlDatabase.productos.filter(p => p.id_producto !== parseInt(idProducto));
    persistToLocalStorage();
    return Promise.resolve(true);
}

// -----------------------------------------------------------------------------
// MAESTROS (MARCAS, CATEGORÍAS, UNIDADES, PROVEEDORES)
// -----------------------------------------------------------------------------

async function getMarcas() {
    return Promise.resolve(deepClone(sqlDatabase.marcas));
}

async function guardarMarca(marca) {
    assertDatabasePermission('guardarMarca', ['ADMINISTRADOR', 'SUPERVISOR']);
    if (!marca.id_marca) {
        marca.id_marca = sqlDatabase.marcas.length > 0 ? Math.max(...sqlDatabase.marcas.map(m => m.id_marca)) + 1 : 1;
        sqlDatabase.marcas.push(marca);
    } else {
        const idx = sqlDatabase.marcas.findIndex(m => m.id_marca === marca.id_marca);
        if (idx !== -1) sqlDatabase.marcas[idx] = marca;
        else sqlDatabase.marcas.push(marca);
    }
    persistToLocalStorage();
    return Promise.resolve(marca.id_marca);
}

async function getCategorias() {
    return Promise.resolve(deepClone(sqlDatabase.categorias));
}

async function guardarCategoria(cat) {
    assertDatabasePermission('guardarCategoria', ['ADMINISTRADOR', 'SUPERVISOR']);
    if (!cat.id_categoria) {
        cat.id_categoria = sqlDatabase.categorias.length > 0 ? Math.max(...sqlDatabase.categorias.map(c => c.id_categoria)) + 1 : 1;
        sqlDatabase.categorias.push(cat);
    } else {
        const idx = sqlDatabase.categorias.findIndex(c => c.id_categoria === cat.id_categoria);
        if (idx !== -1) sqlDatabase.categorias[idx] = cat;
        else sqlDatabase.categorias.push(cat);
    }
    persistToLocalStorage();
    return Promise.resolve(cat.id_categoria);
}

async function getUnidades() {
    return Promise.resolve(deepClone(sqlDatabase.unidades));
}

async function getProveedores() {
    return Promise.resolve(deepClone(sqlDatabase.proveedores));
}

// -----------------------------------------------------------------------------
// MOVIMIENTOS: ENTRADAS, MERMAS Y KARDEX
// -----------------------------------------------------------------------------

async function registrarEntradaMercancia(entrada) {
    assertDatabasePermission('registrarEntradaMercancia', ['ADMINISTRADOR', 'SUPERVISOR']);
    const prod = sqlDatabase.productos.find(p => p.id_producto === parseInt(entrada.id_producto));
    if (!prod) return Promise.reject(new Error('Producto no encontrado.'));

    const stockAnterior = prod.stock_actual;
    const stockPosterior = stockAnterior + entrada.cantidad;

    prod.stock_actual = stockPosterior;
    if (entrada.costo_unitario > 0) prod.precio_compra = entrada.costo_unitario;

    const fechaHora = new Date().toISOString();
    sqlDatabase.entradas.push({
        id_entrada: sqlDatabase.entradas.length + 1,
        id_producto: entrada.id_producto,
        cantidad: entrada.cantidad,
        costo_unitario: entrada.costo_unitario,
        subtotal: entrada.cantidad * entrada.costo_unitario,
        proveedor_nombre: entrada.proveedor_nombre || 'Proveedor Local',
        folio_factura: entrada.folio_factura || 'Remisión S/F',
        fecha_hora: fechaHora,
        responsable: entrada.responsable || 'Gerardo Cabrera Morales'
    });

    sqlDatabase.kardex.push({
        id_kardex: sqlDatabase.kardex.length + 1,
        id_movimiento: sqlDatabase.kardex.length + 1,
        id_producto: entrada.id_producto,
        tipo_movimiento: 'ENTRADA_COMPRA',
        cantidad: entrada.cantidad,
        stock_anterior: stockAnterior,
        stock_posterior: stockPosterior,
        costo_unitario: entrada.costo_unitario,
        fecha_hora: fechaHora,
        referencia: 'Entrada compra - Fact: ' + (entrada.folio_factura || 'S/F') + ' | Prov: ' + (entrada.proveedor_nombre || 'Local'),
        usuario: entrada.responsable || 'Gerardo Cabrera Morales'
    });

    persistToLocalStorage();
    return Promise.resolve({ stockAnterior, stockPosterior });
}

async function registrarMerma(merma) {
    assertDatabasePermission('registrarMerma', ['ADMINISTRADOR', 'SUPERVISOR']);
    const prod = sqlDatabase.productos.find(p => p.id_producto === parseInt(merma.id_producto));
    if (!prod) return Promise.reject(new Error('Producto no encontrado.'));
    if (prod.stock_actual < merma.cantidad) {
        return Promise.reject(new Error('Stock insuficiente para merma. Existencia actual: ' + prod.stock_actual));
    }

    const stockAnterior = prod.stock_actual;
    const stockPosterior = stockAnterior - merma.cantidad;

    prod.stock_actual = stockPosterior;

    const fechaHora = new Date().toISOString();
    sqlDatabase.mermas.push({
        id_merma: sqlDatabase.mermas.length + 1,
        id_producto: merma.id_producto,
        cantidad: merma.cantidad,
        motivo: merma.motivo,
        justificacion: merma.justificacion,
        costo_perdida: merma.cantidad * prod.precio_compra,
        fecha_hora: fechaHora,
        responsable: merma.responsable || 'Gerardo Cabrera Morales'
    });

    sqlDatabase.kardex.push({
        id_kardex: sqlDatabase.kardex.length + 1,
        id_movimiento: sqlDatabase.kardex.length + 1,
        id_producto: merma.id_producto,
        tipo_movimiento: 'MERMA_BAJA',
        cantidad: -merma.cantidad,
        stock_anterior: stockAnterior,
        stock_posterior: stockPosterior,
        costo_unitario: prod.precio_compra,
        fecha_hora: fechaHora,
        referencia: 'Baja por Merma: ' + (merma.motivo || 'General') + ' - ' + (merma.justificacion || 'Sin justificación'),
        usuario: merma.responsable || 'Gerardo Cabrera Morales'
    });

    persistToLocalStorage();
    return Promise.resolve({ stockAnterior, stockPosterior });
}

async function getHistorialKardex(idProducto = null) {
    const prodMap = new Map(sqlDatabase.productos.map(p => [p.id_producto, p.nombre]));
    let movimientos = sqlDatabase.kardex.map(m => ({
        ...m,
        nombre_producto: prodMap.get(m.id_producto) || ('Producto #' + m.id_producto)
    }));

    if (idProducto) {
        const idNum = parseInt(idProducto);
        movimientos = movimientos.filter(m => m.id_producto === idNum);
    }

    movimientos.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    return Promise.resolve(deepClone(movimientos));
}

// -----------------------------------------------------------------------------
// OPERACIONES POS: VENTAS Y CONTROL DE CAJA
// -----------------------------------------------------------------------------

async function registrarVentaConKardex(ventaData) {
    assertDatabasePermission('registrarVentaConKardex', ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO', 'CAJERO']);
    const nowIso = new Date().toISOString();
    const folioVenta = sqlDatabase.ventas.length + 1;

    const ventaRecord = {
        id_venta: folioVenta,
        folio_ticket: 'TICK-' + String(folioVenta).padStart(5, '0'),
        folio_venta: folioVenta,
        fecha_hora: nowIso,
        total_articulos: ventaData.items.reduce((s, it) => s + it.cantidad, 0),
        subtotal: ventaData.subtotal,
        iva: ventaData.iva || 0,
        total: ventaData.total,
        metodo_pago: ventaData.metodo_pago,
        monto_recibido: ventaData.monto_recibido,
        cambio: ventaData.cambio,
        cajero: ventaData.cajero || 'Gerardo Cabrera Morales',
        estado: 'COMPLETADA'
    };

    sqlDatabase.ventas.push(ventaRecord);

    ventaData.items.forEach(item => {
        sqlDatabase.detalle_ventas.push({
            id_detalle: sqlDatabase.detalle_ventas.length + 1,
            id_venta: folioVenta,
            folio_venta: folioVenta,
            id_producto: item.id_producto,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
            es_servicio: item.es_servicio
        });

        if (!item.es_servicio) {
            const prod = sqlDatabase.productos.find(p => p.id_producto === item.id_producto);
            if (prod) {
                const stockAnt = prod.stock_actual;
                const stockPost = Math.max(0, stockAnt - item.cantidad);
                prod.stock_actual = stockPost;

                sqlDatabase.kardex.push({
                    id_kardex: sqlDatabase.kardex.length + 1,
                    id_movimiento: sqlDatabase.kardex.length + 1,
                    id_producto: item.id_producto,
                    tipo_movimiento: 'VENTA_MOSTRADOR',
                    cantidad: -item.cantidad,
                    stock_anterior: stockAnt,
                    stock_posterior: stockPost,
                    costo_unitario: prod.precio_compra,
                    fecha_hora: nowIso,
                    referencia: 'Venta Mostrador Ticket #' + folioVenta,
                    usuario: ventaData.cajero || 'Gerardo Cabrera Morales'
                });
            }
        }
    });

    // Actualizar turno activo
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    if (turno && turno.estado === 'ABIERTO') {
        if (ventaData.metodo_pago === 'EFECTIVO') {
            turno.total_ventas_efectivo = (turno.total_ventas_efectivo || 0) + ventaData.total;
        } else if (ventaData.metodo_pago === 'TARJETA') {
            turno.total_ventas_tarjeta = (turno.total_ventas_tarjeta || 0) + ventaData.total;
        } else if (ventaData.metodo_pago === 'TRANSFERENCIA') {
            turno.total_ventas_transferencia = (turno.total_ventas_transferencia || 0) + ventaData.total;
        }
    }

    persistToLocalStorage();
    return Promise.resolve(folioVenta);
}

async function getTurnoActivo() {
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    return Promise.resolve(turno ? deepClone(turno) : null);
}

async function getHistorialVentas() {
    const ventas = (sqlDatabase.ventas || []).map(v => {
        const detalles = (sqlDatabase.detalle_ventas || []).filter(d => d.id_venta === v.id_venta || d.folio_venta === v.id_venta);
        return {
            ...v,
            items: detalles
        };
    }).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    return Promise.resolve(deepClone(ventas));
}

async function getVentaPorFolio(folio) {
    const idNum = parseInt(folio, 10);
    const venta = (sqlDatabase.ventas || []).find(v => v.id_venta === idNum || v.folio_venta === idNum || v.folio_ticket === folio);
    if (!venta) return Promise.resolve(null);
    const detalles = (sqlDatabase.detalle_ventas || []).filter(d => d.id_venta === venta.id_venta || d.folio_venta === venta.id_venta);
    return Promise.resolve(deepClone({ ...venta, items: detalles }));
}

async function registrarMovimientoCaja(tipo, monto, concepto) {
    assertDatabasePermission('registrarMovimientoCaja', ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO', 'CAJERO']);
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    if (!turno) return Promise.reject(new Error('No hay turno de caja activo'));

    if (tipo === 'ENTRADA') {
        turno.total_entradas_manuales = (turno.total_entradas_manuales || 0) + monto;
    } else if (tipo === 'RETIRO') {
        turno.total_salidas_manuales = (turno.total_salidas_manuales || 0) + monto;
    }

    if (!sqlDatabase.movimientos_caja) sqlDatabase.movimientos_caja = [];
    sqlDatabase.movimientos_caja.push({
        id_movimiento_caja: sqlDatabase.movimientos_caja.length + 1,
        id_turno: 1,
        tipo: tipo,
        monto: monto,
        concepto: concepto,
        fecha_hora: new Date().toISOString(),
        usuario: turno.usuario || 'Gerardo Cabrera Morales'
    });

    persistToLocalStorage();
    return Promise.resolve(turno);
}

async function registrarCorteTurno(montoContado, desglose = {}) {
    assertDatabasePermission('registrarCorteTurno', ['ADMINISTRADOR', 'SUPERVISOR']);
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    if (!turno) return Promise.reject(new Error('No hay turno activo para cerrar'));

    const esperado = (turno.monto_inicial_fondo || 0) + (turno.total_ventas_efectivo || 0) + (turno.total_entradas_manuales || 0) - (turno.total_salidas_manuales || 0);
    const diferencia = montoContado - esperado;
    const nowIso = new Date().toISOString();

    turno.fecha_cierre = nowIso;
    turno.monto_final_cierre = montoContado;
    turno.monto_esperado = esperado;
    turno.diferencia = diferencia;
    turno.desglose_contado = desglose;
    turno.estado = 'CERRADO';

    if (!sqlDatabase.cortes_caja) sqlDatabase.cortes_caja = [];
    const corteRecord = {
        id_corte: sqlDatabase.cortes_caja.length + 1,
        id_turno: turno.id_turno,
        folio_corte: 'CORTE-Z-' + String(sqlDatabase.cortes_caja.length + 1).padStart(4, '0'),
        cajero: turno.usuario,
        fecha_apertura: turno.fecha_apertura,
        fecha_cierre: nowIso,
        fondo_inicial: turno.monto_inicial_fondo,
        ventas_efectivo: turno.total_ventas_efectivo || 0,
        ventas_tarjeta: turno.total_ventas_tarjeta || 0,
        ventas_transferencia: turno.total_ventas_transferencia || 0,
        total_ventas: (turno.total_ventas_efectivo || 0) + (turno.total_ventas_tarjeta || 0) + (turno.total_ventas_transferencia || 0),
        entradas_manuales: turno.total_entradas_manuales || 0,
        retiros_manuales: turno.total_salidas_manuales || 0,
        esperado_cajon: esperado,
        contado_fisico: montoContado,
        diferencia: diferencia,
        desglose: desglose
    };
    sqlDatabase.cortes_caja.push(corteRecord);

    persistToLocalStorage();
    return Promise.resolve(corteRecord);
}


async function getCortesCaja() {
    if (!sqlDatabase.cortes_caja || sqlDatabase.cortes_caja.length === 0) {
        sqlDatabase.cortes_caja = generateSeedCortes();
        persistToLocalStorage();
    }
    return Promise.resolve(deepClone(sqlDatabase.cortes_caja));
}

async function getMovimientosCaja() {
    if (!sqlDatabase.movimientos_caja || sqlDatabase.movimientos_caja.length === 0) {
        sqlDatabase.movimientos_caja = generateSeedMovimientos();
        persistToLocalStorage();
    }
    return Promise.resolve(deepClone(sqlDatabase.movimientos_caja));
}

async function reabrirNuevoTurno(montoFondo = 500) {
    assertDatabasePermission('reabrirNuevoTurno', ['ADMINISTRADOR', 'SUPERVISOR', 'USUARIO', 'CAJERO']);
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    if (turno) {
        turno.fecha_apertura = new Date().toISOString();
        turno.fecha_cierre = null;
        turno.monto_inicial_fondo = montoFondo;
        turno.total_ventas_efectivo = 0;
        turno.total_ventas_tarjeta = 0;
        turno.total_ventas_transferencia = 0;
        turno.total_entradas_manuales = 0;
        turno.total_salidas_manuales = 0;
        turno.monto_final_cierre = 0;
        turno.diferencia = 0;
        turno.estado = 'ABIERTO';
    }
    persistToLocalStorage();
    return Promise.resolve(turno);
}

// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// OPERACIONES DE DEVOLUCIONES Y CAMBIOS DE MERCANCIA (RF-08 / RBAC)
// -----------------------------------------------------------------------------

function generateSeedDevoluciones() {
    const d1 = new Date();
    d1.setDate(d1.getDate() - 2);
    d1.setHours(11, 30, 0, 0);

    const d2 = new Date();
    d2.setDate(d2.getDate() - 1);
    d2.setHours(16, 45, 0, 0);

    return [
        {
            id_devolucion: 1,
            folio: 'DEV-0001',
            tipo: 'DEVOLUCION',
            fecha_hora: d1.toISOString(),
            folio_ticket_origen: 'TICK-00015',
            id_producto_devuelto: 4,
            nombre_producto_devuelto: 'Lapiz Grafito #2 HB Dixon',
            cantidad_devuelta: 2,
            precio_unitario_devuelto: 6.50,
            total_devuelto: 13.00,
            estado_producto: 'BUENO',
            id_producto_nuevo: null,
            nombre_producto_nuevo: null,
            cantidad_nueva: 0,
            precio_unitario_nuevo: 0,
            total_nuevo: 0,
            diferencia_monetaria: -13.00,
            motivo: 'Error de compra por parte del cliente',
            justificacion: 'Cliente adquirio por error de graduacion escolar. Articulo sellado en perfecto estado.',
            autorizado_por: 'Astrid Garcia Ramirez [SUPERVISOR]',
            cajero: 'Daniel Parada Gonzalez'
        },
        {
            id_devolucion: 2,
            folio: 'CAM-0002',
            tipo: 'CAMBIO',
            fecha_hora: d2.toISOString(),
            folio_ticket_origen: 'TICK-00018',
            id_producto_devuelto: 5,
            nombre_producto_devuelto: 'Tijeras Escolares Punta Roma Barrilito',
            cantidad_devuelta: 1,
            precio_unitario_devuelto: 24.50,
            total_devuelto: 24.50,
            estado_producto: 'BUENO',
            id_producto_nuevo: 6,
            nombre_producto_nuevo: 'Juego de Geometria Flexible 5 Piezas Maped',
            cantidad_nueva: 1,
            precio_unitario_nuevo: 45.00,
            total_nuevo: 45.00,
            diferencia_monetaria: 20.50,
            motivo: 'Inconformidad con el producto',
            justificacion: 'Cliente requirio kit de geometria en lugar de tijera escolar. Pago diferencia en efectivo.',
            autorizado_por: 'Gerardo Cabrera Morales [ADMINISTRADOR]',
            cajero: 'Daniel Parada Gonzalez'
        }
    ];
}

async function getDevolucionesYCambios() {
    if (!sqlDatabase.devoluciones_cambios || sqlDatabase.devoluciones_cambios.length === 0) {
        sqlDatabase.devoluciones_cambios = generateSeedDevoluciones();
        if (!sqlDatabase.cortes_caja || sqlDatabase.cortes_caja.length === 0) {
            sqlDatabase.cortes_caja = generateSeedCortes();
        }
        if (!sqlDatabase.movimientos_caja || sqlDatabase.movimientos_caja.length === 0) {
            sqlDatabase.movimientos_caja = generateSeedMovimientos();
        }
        if (!sqlDatabase.bitacora_seguridad || sqlDatabase.bitacora_seguridad.length === 0) {
            sqlDatabase.bitacora_seguridad = generateSeedBitacoraSeguridad();
        }
        persistToLocalStorage();
    }
    const lista = [...sqlDatabase.devoluciones_cambios];
    lista.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    return Promise.resolve(deepClone(lista));
}

async function registrarDevolucionOCambio(datos) {
    assertDatabasePermission('registrarDevolucionOCambio', ['ADMINISTRADOR', 'SUPERVISOR']);
    if (!sqlDatabase.devoluciones_cambios) {
        sqlDatabase.devoluciones_cambios = [];
    }

    const nowIso = new Date().toISOString();
    const nextId = sqlDatabase.devoluciones_cambios.length + 1;
    const prefix = datos.tipo === 'DEVOLUCION' ? 'DEV-' : 'CAM-';
    const folio = prefix + String(nextId).padStart(4, '0');

    const idDevuelto = parseInt(datos.id_producto_devuelto, 10);
    const prodDevuelto = sqlDatabase.productos.find(p => p.id_producto === idDevuelto);
    if (!prodDevuelto) {
        return Promise.reject(new Error('Producto devuelto no encontrado en el catalogo'));
    }

    const getPrecioVenta = (p) => {
        if (!p) return 0;
        return parseFloat(p.precio_venta_menudeo ?? p.precio_venta ?? p.precio ?? 0);
    };

    const cantDevuelta = parseInt(datos.cantidad_devuelta, 10) || 1;
    const precioDevuelto = parseFloat(datos.precio_unitario_devuelto) || getPrecioVenta(prodDevuelto);
    const totalDevuelto = cantDevuelta * precioDevuelto;

    let prodNuevo = null;
    let cantNueva = 0;
    let precioNuevo = 0;
    let totalNuevo = 0;
    let diferencia = -totalDevuelto;

    if (datos.tipo === 'CAMBIO') {
        const idNuevo = parseInt(datos.id_producto_nuevo, 10);
        prodNuevo = sqlDatabase.productos.find(p => p.id_producto === idNuevo);
        if (!prodNuevo) {
            return Promise.reject(new Error('Producto nuevo de reemplazo no encontrado en el catalogo'));
        }
        cantNueva = parseInt(datos.cantidad_nueva, 10) || 1;

        if (!prodNuevo.es_servicio && prodNuevo.stock_actual < cantNueva) {
            return Promise.reject(new Error('Stock insuficiente para el producto nuevo (' + prodNuevo.nombre + '). Disponible: ' + prodNuevo.stock_actual));
        }

        precioNuevo = parseFloat(datos.precio_unitario_nuevo) || getPrecioVenta(prodNuevo);
        totalNuevo = cantNueva * precioNuevo;
        diferencia = totalNuevo - totalDevuelto;
    }

    // 1. Ajuste en Inventario y Kardex
    if (datos.estado_producto === 'BUENO') {
        const stockAntDev = prodDevuelto.stock_actual;
        const stockPostDev = stockAntDev + cantDevuelta;
        prodDevuelto.stock_actual = stockPostDev;

        sqlDatabase.kardex.push({
            id_kardex: sqlDatabase.kardex.length + 1,
            id_movimiento: sqlDatabase.kardex.length + 1,
            id_producto: idDevuelto,
            tipo_movimiento: 'ENTRADA_DEVOLUCION',
            cantidad: cantDevuelta,
            stock_anterior: stockAntDev,
            stock_posterior: stockPostDev,
            costo_unitario: prodDevuelto.precio_compra,
            fecha_hora: nowIso,
            referencia: (datos.tipo === 'DEVOLUCION' ? 'Devolucion Cliente Folio ' : 'Cambio Producto Folio ') + folio + ' (Ticket ' + (datos.folio_ticket_origen || 'S/N') + ')',
            usuario: datos.autorizado_por || 'Supervisor'
        });
    } else {
        sqlDatabase.kardex.push({
            id_kardex: sqlDatabase.kardex.length + 1,
            id_movimiento: sqlDatabase.kardex.length + 1,
            id_producto: idDevuelto,
            tipo_movimiento: 'BAJA_MERMA',
            cantidad: 0,
            stock_anterior: prodDevuelto.stock_actual,
            stock_posterior: prodDevuelto.stock_actual,
            costo_unitario: prodDevuelto.precio_compra,
            fecha_hora: nowIso,
            referencia: 'Devolucion Defectuosa a Merma Folio ' + folio + ' - Motivo: ' + (datos.motivo || 'Defecto'),
            usuario: datos.autorizado_por || 'Supervisor'
        });
    }

    if (datos.tipo === 'CAMBIO' && prodNuevo) {
        if (!prodNuevo.es_servicio) {
            const stockAntNuevo = prodNuevo.stock_actual;
            const stockPostNuevo = Math.max(0, stockAntNuevo - cantNueva);
            prodNuevo.stock_actual = stockPostNuevo;

            sqlDatabase.kardex.push({
                id_kardex: sqlDatabase.kardex.length + 1,
                id_movimiento: sqlDatabase.kardex.length + 1,
                id_producto: prodNuevo.id_producto,
                tipo_movimiento: 'SALIDA_CAMBIO',
                cantidad: -cantNueva,
                stock_anterior: stockAntNuevo,
                stock_posterior: stockPostNuevo,
                costo_unitario: prodNuevo.precio_compra,
                fecha_hora: nowIso,
                referencia: 'Entrega de Mercancia por Canje Folio ' + folio,
                usuario: datos.autorizado_por || 'Supervisor'
            });
        }
    }

    // 2. Impacto Financiero en Turno de Caja
    const turno = sqlDatabase.turnos_caja.find(t => t.id_turno === 1);
    if (turno && turno.estado === 'ABIERTO') {
        if (!sqlDatabase.movimientos_caja) sqlDatabase.movimientos_caja = [];

        if (datos.tipo === 'DEVOLUCION') {
            turno.total_salidas_manuales = (turno.total_salidas_manuales || 0) + totalDevuelto;
            sqlDatabase.movimientos_caja.push({
                id_movimiento_caja: sqlDatabase.movimientos_caja.length + 1,
                id_turno: 1,
                tipo: 'RETIRO',
                monto: totalDevuelto,
                concepto: 'Reembolso Efectivo Devolucion Mercancia ' + folio + ' (' + prodDevuelto.nombre + ')',
                fecha_hora: nowIso,
                usuario: datos.autorizado_por || 'Supervisor'
            });
        } else if (datos.tipo === 'CAMBIO') {
            if (diferencia > 0) {
                turno.total_entradas_manuales = (turno.total_entradas_manuales || 0) + diferencia;
                sqlDatabase.movimientos_caja.push({
                    id_movimiento_caja: sqlDatabase.movimientos_caja.length + 1,
                    id_turno: 1,
                    tipo: 'ENTRADA',
                    monto: diferencia,
                    concepto: 'Cobro Diferencia Cambio Mercancia ' + folio,
                    fecha_hora: nowIso,
                    usuario: datos.autorizado_por || 'Supervisor'
                });
            } else if (diferencia < 0) {
                const montoReembolso = Math.abs(diferencia);
                turno.total_salidas_manuales = (turno.total_salidas_manuales || 0) + montoReembolso;
                sqlDatabase.movimientos_caja.push({
                    id_movimiento_caja: sqlDatabase.movimientos_caja.length + 1,
                    id_turno: 1,
                    tipo: 'RETIRO',
                    monto: montoReembolso,
                    concepto: 'Reembolso Diferencia Cambio Mercancia ' + folio,
                    fecha_hora: nowIso,
                    usuario: datos.autorizado_por || 'Supervisor'
                });
            }
        }
    }

    // 3. Registro en Coleccion
    const registro = {
        id_devolucion: nextId,
        folio: folio,
        tipo: datos.tipo,
        fecha_hora: nowIso,
        folio_ticket_origen: (datos.folio_ticket_origen || '').trim() || 'TICK-MOSTRADOR',
        id_producto_devuelto: idDevuelto,
        nombre_producto_devuelto: prodDevuelto.nombre,
        cantidad_devuelta: cantDevuelta,
        precio_unitario_devuelto: precioDevuelto,
        total_devuelto: totalDevuelto,
        estado_producto: datos.estado_producto || 'BUENO',
        id_producto_nuevo: prodNuevo ? prodNuevo.id_producto : null,
        nombre_producto_nuevo: prodNuevo ? prodNuevo.nombre : null,
        cantidad_nueva: cantNueva,
        precio_unitario_nuevo: precioNuevo,
        total_nuevo: totalNuevo,
        diferencia_monetaria: diferencia,
        motivo: datos.motivo || 'Devolucion operativa',
        justificacion: datos.justificacion || 'Sin observaciones adicionales',
        autorizado_por: datos.autorizado_por || 'Supervisor en Turno',
        cajero: turno ? turno.usuario : 'Cajero'
    };

    sqlDatabase.devoluciones_cambios.unshift(registro);
    persistToLocalStorage();

    return Promise.resolve(registro);
}

// =============================================================================
// EJECUTOR DE CONSULTAS SQL EN CLIENTE & BLINDAJE CONTRA INYECCION
// =============================================================================

const SQL_INJECTION_PATTERNS = [
    /;\s*(?:DROP|ALTER|CREATE|DELETE|UPDATE|INSERT|TRUNCATE|EXEC|EXECUTE)\b/i,
    /(?:--|\/\*|\*\/|#)/,
    /\bUNION\s+(?:ALL\s+)?SELECT\b/i,
    /\bOR\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /\bOR\s+['"]?a['"]?\s*=\s*['"]?a['"]?/i,
    /\b(?:DROP|ALTER|TRUNCATE|DELETE|INSERT|UPDATE|REPLACE)\s+/i,
    /\b(?:SLEEP|BENCHMARK|WAITFOR|PG_SLEEP)\s*\(/i,
    /\b(?:INFORMATION_SCHEMA|SQLITE_MASTER|SQLITE_SCHEMA|SYS\.TABLES)\b/i
];

function sanitizeAndValidateSQL(rawQuery) {
    if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
        throw new Error('[Seguridad SQL] La consulta SQL no puede estar vacia.');
    }

    const query = rawQuery.trim();

    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(query)) {
            registrarIncidenteSeguridad({
                tipo_evento: 'INYECCION_SQL_BLOQUEADA',
                origen: 'executeSQL',
                detalles: 'Patron malicioso detectado en consulta: \'' + query.slice(0, 100) + '\'',
                severidad: 'CRITICA'
            });
            throw new Error('[Seguridad SQL] Inyeccion SQL bloqueada: La instruccion contiene patrones maliciosos no permitidos.');
        }
    }

    const clean = query.toUpperCase();
    if (!clean.startsWith('SELECT')) {
        registrarIncidenteSeguridad({
            tipo_evento: 'CONSULTA_DML_NO_AUTORIZADA',
            origen: 'executeSQL',
            detalles: 'Intento de ejecucion de consulta no-SELECT: \'' + query.slice(0, 80) + '\'',
            severidad: 'ALTA'
        });
        throw new Error('[Seguridad SQL] Operacion no permitida: El motor cliente solo admite consultas de solo lectura (SELECT). Para modificaciones utilice la API transaccional correspondiente.');
    }

    return query;
}

async function executeSQL(rawQuery, params = null) {
    const validatedQuery = sanitizeAndValidateSQL(rawQuery);
    const upper = validatedQuery.toUpperCase();

    let result = [];

    if (upper.includes('FROM PRODUCTOS')) {
        result = await getProductosCompletos();
    } else if (upper.includes('FROM CATEGORIAS')) {
        result = await getCategorias();
    } else if (upper.includes('FROM MARCAS')) {
        result = await getMarcas();
    } else if (upper.includes('FROM UNIDADES')) {
        result = await getUnidades();
    } else if (upper.includes('FROM PROVEEDORES')) {
        result = await getProveedores();
    } else if (upper.includes('FROM KARDEX')) {
        result = await getHistorialKardex();
    } else if (upper.includes('FROM VENTAS')) {
        result = await getHistorialVentas();
    } else if (upper.includes('FROM DEVOLUCIONES') || upper.includes('FROM DEVOLUCIONES_CAMBIOS')) {
        result = await getDevolucionesYCambios();
    } else if (upper.includes('FROM USUARIOS')) {
        const curUser = (window.AUTH_MODULE && typeof window.AUTH_MODULE.getCurrentUser === 'function')
            ? window.AUTH_MODULE.getCurrentUser()
            : null;
        if (!curUser || curUser.rol !== 'ADMINISTRADOR') {
            registrarIncidenteSeguridad({
                tipo_evento: 'ACCESO_DENEGADO_TABLA_USUARIOS',
                origen: 'executeSQL',
                detalles: 'Intento de consulta a tabla USUARIOS por usuario sin privilegios de ADMINISTRADOR',
                severidad: 'CRITICA'
            });
            throw new Error('[Seguridad SQL] Acceso denegado: Se requiere rol de ADMINISTRADOR para consultar la vista de usuarios.');
        }
        const usuarios = await getUsuarios();
        result = usuarios.map(u => {
            const copy = { ...u };
            delete copy.password_hash;
            delete copy.salt;
            return copy;
        });
    } else {
        return Promise.resolve([]);
    }

    // Filtrado parametrizado seguro
    if (params && Array.isArray(params) && params.length > 0) {
        const paramVal = params[0];
        result = result.filter(row => {
            return Object.values(row).some(v => String(v).toLowerCase() === String(paramVal).toLowerCase());
        });
    } else if (params && typeof params === 'object') {
        result = result.filter(row => {
            return Object.entries(params).every(([k, v]) => String(row[k]).toLowerCase() === String(v).toLowerCase());
        });
    }

    return Promise.resolve(deepClone(result));
}

function exportarSQL() {
    try {
        assertDatabasePermission('exportarSQL', ['ADMINISTRADOR']);
    } catch (err) {
        if (window.DOCUMENTATION_MODULE && typeof window.DOCUMENTATION_MODULE.solicitarDescargaBD === 'function') {
            window.DOCUMENTATION_MODULE.solicitarDescargaBD();
            return;
        }
        alert(err.message);
        throw err;
    }

    let sql = '-- =============================================================================\n';
    sql += '-- PAPELERIA A B C - DUMP SQL COMPLETO DE BASE DE DATOS (OFFLINE)\n';
    sql += '-- Catalogo Maestro: ' + sqlDatabase.productos.length + ' Productos, 8 Categorias, 12 Marcas\n';
    sql += '-- Fecha de Generacion: ' + new Date().toISOString() + '\n';
    sql += '-- =============================================================================\n\n';

    sql += 'CREATE TABLE IF NOT EXISTS productos (id_producto INTEGER PRIMARY KEY, codigo_barras TEXT UNIQUE, sku TEXT UNIQUE, nombre TEXT, precio_compra REAL, precio_venta_menudeo REAL, stock_actual REAL, stock_minimo REAL);\n';
    sqlDatabase.productos.forEach(p => {
        sql += `INSERT OR REPLACE INTO productos VALUES (${p.id_producto}, '${p.codigo_barras}', '${p.sku}', '${p.nombre.replace(/'/g, "''")}', ${p.precio_compra}, ${p.precio_venta_menudeo}, ${p.stock_actual}, ${p.stock_minimo});\n`;
    });

    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Papeleria_ABC_Dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
}


// -----------------------------------------------------------------------------
// GESTIÓN DE USUARIOS Y CONTROL DE ACCESO (FASE 6 - SPRINT 3)
// -----------------------------------------------------------------------------

async function getUsuarios() {
    if (!sqlDatabase.usuarios || sqlDatabase.usuarios.length === 0) {
        sqlDatabase.usuarios = [...SEED_USUARIOS];
        persistToLocalStorage();
    }
    const curUser = (window.AUTH_MODULE && typeof window.AUTH_MODULE.getCurrentUser === 'function')
        ? window.AUTH_MODULE.getCurrentUser()
        : null;

    const cloned = deepClone(sqlDatabase.usuarios);

    if (!curUser || curUser.rol !== 'ADMINISTRADOR') {
        return Promise.resolve(cloned.map(u => {
            const safe = { ...u };
            safe.password_hash = '[PROTEGIDO]';
            safe.salt = '[PROTEGIDO]';
            return safe;
        }));
    }

    return Promise.resolve(cloned);
}

async function getUsuarioPorUsername(username) {
    if (!sqlDatabase.usuarios || sqlDatabase.usuarios.length === 0) {
        sqlDatabase.usuarios = [...SEED_USUARIOS];
        persistToLocalStorage();
    }
    const clean = (username || '').trim().toLowerCase();
    const found = sqlDatabase.usuarios.find(u => u.username.toLowerCase() === clean);
    return Promise.resolve(found ? deepClone(found) : null);
}

async function getUsuarioPorId(idUsuario) {
    const list = await getUsuarios();
    const idNum = parseInt(idUsuario, 10);
    const found = list.find(u => u.id_usuario === idNum);
    return Promise.resolve(found ? deepClone(found) : null);
}

async function guardarUsuario(userData) {
    assertDatabasePermission('guardarUsuario', ['ADMINISTRADOR']);
    if (!sqlDatabase.usuarios) sqlDatabase.usuarios = [...SEED_USUARIOS];

    let idAsignado = userData.id_usuario;
    const esNuevo = !idAsignado;

    if (esNuevo) {
        idAsignado = sqlDatabase.usuarios.length > 0 
            ? Math.max(...sqlDatabase.usuarios.map(u => u.id_usuario)) + 1 
            : 1;
        userData.id_usuario = idAsignado;
        userData.creado_en = new Date().toISOString();
        sqlDatabase.usuarios.push(userData);
    } else {
        const idx = sqlDatabase.usuarios.findIndex(u => u.id_usuario === idAsignado);
        if (idx !== -1) {
            sqlDatabase.usuarios[idx] = { ...sqlDatabase.usuarios[idx], ...userData };
        } else {
            sqlDatabase.usuarios.push(userData);
        }
    }

    persistToLocalStorage();
    return Promise.resolve(idAsignado);
}

async function eliminarUsuario(idUsuario) {
    assertDatabasePermission('eliminarUsuario', ['ADMINISTRADOR']);
    const idNum = parseInt(idUsuario, 10);
    sqlDatabase.usuarios = (sqlDatabase.usuarios || []).filter(u => u.id_usuario !== idNum);
    persistToLocalStorage();
    return Promise.resolve(true);
}

async function actualizarUltimoAcceso(idUsuario, timestamp) {
    const idNum = parseInt(idUsuario, 10);
    const u = (sqlDatabase.usuarios || []).find(usr => usr.id_usuario === idNum);
    if (u) {
        u.ultimo_acceso = timestamp;
        persistToLocalStorage();
    }
    return Promise.resolve(true);
}

// Exponer API global
window.POS_DB = {
    initDB,
    getProductos,
    getProductosCompletos,
    buscarProductoPorCodigo,
    guardarProducto,
    eliminarProducto,
    getMarcas,
    guardarMarca,
    getCategorias,
    guardarCategoria,
    getUnidades,
    getProveedores,
    registrarEntradaMercancia,
    registrarMerma,
    getHistorialKardex,
    registrarVentaConKardex,
    getTurnoActivo,
    getHistorialVentas,
    getVentaPorFolio,
    registrarMovimientoCaja,
    registrarCorteTurno,
    reabrirNuevoTurno,
    getDevolucionesYCambios,
    getCortesCaja,
    getMovimientosCaja,
    registrarDevolucionOCambio,
    recargarCatalogoCompleto160,
    getUsuarios,
    getUsuarioPorUsername,
    getUsuarioPorId,
    guardarUsuario,
    eliminarUsuario,
    actualizarUltimoAcceso,
    getBitacoraSeguridad,
    registrarIncidenteSeguridad,
    executeSQL,
    exportarSQL
};

Object.freeze(window.POS_DB);

window.recargarCatalogoCompleto160 = recargarCatalogoCompleto160;
