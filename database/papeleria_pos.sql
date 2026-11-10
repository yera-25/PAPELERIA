-- =============================================================================
-- PAPELERÍA A B C - BASE DE DATOS SQL COMPLETA (MIGRACIÓN OFICIAL)
-- Catálogo Maestro: 160 Productos Reales, 8 Categorías, 12 Marcas, Kardex y POS
-- Desarrolladores: Gerardo Cabrera Morales, Astrid García Ramírez, Daniel Parada Gonzalez
-- Generado para: SQLite 3 / MySQL / PostgreSQL / MariaDB / DBeaver / SQLiteStudio
-- =============================================================================

BEGIN TRANSACTION;
CREATE TABLE categorias (
        id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(80) NOT NULL UNIQUE,
        descripcion VARCHAR(255),
        activo BOOLEAN NOT NULL DEFAULT 1
    );
INSERT INTO "categorias" VALUES(1,'Cuadernos y Libretas','Profesionales, de espiral, cosidos, forma francesa e italiana',1);
INSERT INTO "categorias" VALUES(2,'Escritura e Instrumentos','Bolígrafos de gel, tinta negra/azul/roja, lápices grafito y marcadores',1);
INSERT INTO "categorias" VALUES(3,'Adhesivos y Pegamentos','Lápices adhesivos en barra, pegamento blanco escolar y silicón líquido',1);
INSERT INTO "categorias" VALUES(4,'Papeles y Cartulinas','Hojas bond blancas carta/oficio, cartulinas bristol, papel lustre y crepé',1);
INSERT INTO "categorias" VALUES(5,'Geometría y Corte','Juegos de geometría de plástico flexible, reglas graduadas y tijeras punta roma',1);
INSERT INTO "categorias" VALUES(6,'Arte y Manualidades','Crayones de cera, plastilinas, acuarelas lavables y pinceles escolares',1);
INSERT INTO "categorias" VALUES(7,'Organización y Archivo','Folders manila, broches baco, clips metálicos y registradores de palanca',1);
INSERT INTO "categorias" VALUES(8,'Servicios y Copias','Fotocopias blanco y negro, color, impresiones láser y engargolados',1);
CREATE TABLE configuracion_negocio (
        id_config INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_comercial VARCHAR(100) NOT NULL,
        razon_social VARCHAR(150),
        rfc VARCHAR(13),
        direccion TEXT,
        telefono VARCHAR(20),
        email VARCHAR(100),
        sitio_web VARCHAR(100),
        logo_url VARCHAR(255),
        leyenda_ticket VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO "configuracion_negocio" VALUES(1,'Papelería A B C','Papelería A B C S.A. de C.V.','PABC261005ABC','Av. Tecnológico #120, Col. Centro, Querétaro','442-123-4567','contacto@papeleria-abc.mx','www.papeleria-abc.mx','LOGO.jpg','¡Gracias por su compra en Papelería A B C! Calidad y servicio para su escuela y oficina.','2026-10-20 19:59:23');
CREATE TABLE detalle_ventas (
        id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
        id_venta INTEGER NOT NULL,
        id_producto INTEGER NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        es_servicio BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );
CREATE TABLE entradas_mercancia (
        id_entrada INTEGER PRIMARY KEY AUTOINCREMENT,
        id_producto INTEGER NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        costo_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        proveedor_nombre VARCHAR(150),
        folio_factura VARCHAR(50),
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responsable VARCHAR(100) NOT NULL,
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );
CREATE TABLE kardex_movimientos (
        id_kardex INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        id_producto INTEGER NOT NULL,
        tipo_movimiento VARCHAR(35) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        stock_anterior DECIMAL(10,2) NOT NULL,
        stock_posterior DECIMAL(10,2) NOT NULL,
        costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        referencia_tipo VARCHAR(30),
        referencia_detalle VARCHAR(255),
        usuario VARCHAR(100) DEFAULT 'Gerardo Cabrera Morales',
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );
INSERT INTO "kardex_movimientos" VALUES(1,'2026-10-20 19:59:23',1,'INVENTARIO_INICIAL',45,0,45,22.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(2,'2026-10-20 19:59:23',2,'INVENTARIO_INICIAL',50,0,50,22.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(3,'2026-10-20 19:59:23',3,'INVENTARIO_INICIAL',40,0,40,22.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(4,'2026-10-20 19:59:23',4,'INVENTARIO_INICIAL',25,0,25,22.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(5,'2026-10-20 19:59:23',5,'INVENTARIO_INICIAL',20,0,20,22.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(6,'2026-10-20 19:59:23',6,'INVENTARIO_INICIAL',18,0,18,48,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(7,'2026-10-20 19:59:23',7,'INVENTARIO_INICIAL',15,0,15,48,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(8,'2026-10-20 19:59:23',8,'INVENTARIO_INICIAL',30,0,30,17.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(9,'2026-10-20 19:59:23',9,'INVENTARIO_INICIAL',25,0,25,17.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(10,'2026-10-20 19:59:23',10,'INVENTARIO_INICIAL',22,0,22,15,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(11,'2026-10-20 19:59:23',11,'INVENTARIO_INICIAL',20,0,20,15,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(12,'2026-10-20 19:59:23',12,'INVENTARIO_INICIAL',16,0,16,32,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(13,'2026-10-20 19:59:23',13,'INVENTARIO_INICIAL',12,0,12,24,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(14,'2026-10-20 19:59:23',14,'INVENTARIO_INICIAL',35,0,35,14.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(15,'2026-10-20 19:59:23',15,'INVENTARIO_INICIAL',25,0,25,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(16,'2026-10-20 19:59:23',16,'INVENTARIO_INICIAL',14,0,14,58,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(17,'2026-10-20 19:59:23',17,'INVENTARIO_INICIAL',18,0,18,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(18,'2026-10-20 19:59:23',18,'INVENTARIO_INICIAL',28,0,28,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(19,'2026-10-20 19:59:23',19,'INVENTARIO_INICIAL',120,0,120,4.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(20,'2026-10-20 19:59:23',20,'INVENTARIO_INICIAL',95,0,95,4.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(21,'2026-10-20 19:59:23',21,'INVENTARIO_INICIAL',80,0,80,4.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(22,'2026-10-20 19:59:23',22,'INVENTARIO_INICIAL',45,0,45,4.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(23,'2026-10-20 19:59:23',23,'INVENTARIO_INICIAL',60,0,60,4.8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(24,'2026-10-20 19:59:23',24,'INVENTARIO_INICIAL',55,0,55,4.8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(25,'2026-10-20 19:59:23',25,'INVENTARIO_INICIAL',30,0,30,11.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(26,'2026-10-20 19:59:23',26,'INVENTARIO_INICIAL',25,0,25,11.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(27,'2026-10-20 19:59:23',27,'INVENTARIO_INICIAL',28,0,28,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(28,'2026-10-20 19:59:23',28,'INVENTARIO_INICIAL',24,0,24,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(29,'2026-10-20 19:59:23',29,'INVENTARIO_INICIAL',16,0,16,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(30,'2026-10-20 19:59:23',30,'INVENTARIO_INICIAL',50,0,50,7.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(31,'2026-10-20 19:59:23',31,'INVENTARIO_INICIAL',45,0,45,7.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(32,'2026-10-20 19:59:23',32,'INVENTARIO_INICIAL',35,0,35,7.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(33,'2026-10-20 19:59:23',33,'INVENTARIO_INICIAL',60,0,60,3.8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(34,'2026-10-20 19:59:23',34,'INVENTARIO_INICIAL',25,0,25,5.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(35,'2026-10-20 19:59:23',35,'INVENTARIO_INICIAL',18,0,18,6,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(36,'2026-10-20 19:59:23',36,'INVENTARIO_INICIAL',40,0,40,4,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(37,'2026-10-20 19:59:23',37,'INVENTARIO_INICIAL',35,0,35,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(38,'2026-10-20 19:59:23',38,'INVENTARIO_INICIAL',30,0,30,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(39,'2026-10-20 19:59:23',39,'INVENTARIO_INICIAL',28,0,28,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(40,'2026-10-20 19:59:23',40,'INVENTARIO_INICIAL',25,0,25,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(41,'2026-10-20 19:59:23',41,'INVENTARIO_INICIAL',20,0,20,11,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(42,'2026-10-20 19:59:23',42,'INVENTARIO_INICIAL',40,0,40,13.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(43,'2026-10-20 19:59:23',43,'INVENTARIO_INICIAL',30,0,30,13.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(44,'2026-10-20 19:59:23',44,'INVENTARIO_INICIAL',25,0,25,13.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(45,'2026-10-20 19:59:23',45,'INVENTARIO_INICIAL',20,0,20,16,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(46,'2026-10-20 19:59:23',46,'INVENTARIO_INICIAL',30,0,30,19,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(47,'2026-10-20 19:59:23',47,'INVENTARIO_INICIAL',25,0,25,19,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(48,'2026-10-20 19:59:23',48,'INVENTARIO_INICIAL',20,0,20,19,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(49,'2026-10-20 19:59:23',49,'INVENTARIO_INICIAL',18,0,18,19,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(50,'2026-10-20 19:59:23',50,'INVENTARIO_INICIAL',22,0,22,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(51,'2026-10-20 19:59:23',51,'INVENTARIO_INICIAL',25,0,25,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(52,'2026-10-20 19:59:23',52,'INVENTARIO_INICIAL',30,0,30,9,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(53,'2026-10-20 19:59:23',53,'INVENTARIO_INICIAL',35,0,35,9,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(54,'2026-10-20 19:59:23',54,'INVENTARIO_INICIAL',32,0,32,16.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(55,'2026-10-20 19:59:23',55,'INVENTARIO_INICIAL',25,0,25,21,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(56,'2026-10-20 19:59:23',56,'INVENTARIO_INICIAL',40,0,40,11.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(57,'2026-10-20 19:59:23',57,'INVENTARIO_INICIAL',8,0,8,18.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(58,'2026-10-20 19:59:23',58,'INVENTARIO_INICIAL',15,0,15,28,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(59,'2026-10-20 19:59:23',59,'INVENTARIO_INICIAL',30,0,30,13,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(60,'2026-10-20 19:59:23',60,'INVENTARIO_INICIAL',18,0,18,24,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(61,'2026-10-20 19:59:23',61,'INVENTARIO_INICIAL',12,0,12,42,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(62,'2026-10-20 19:59:23',62,'INVENTARIO_INICIAL',25,0,25,15.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(63,'2026-10-20 19:59:23',63,'INVENTARIO_INICIAL',16,0,16,27,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(64,'2026-10-20 19:59:23',64,'INVENTARIO_INICIAL',20,0,20,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(65,'2026-10-20 19:59:23',65,'INVENTARIO_INICIAL',25,0,25,16,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(66,'2026-10-20 19:59:23',66,'INVENTARIO_INICIAL',50,0,50,6,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(67,'2026-10-20 19:59:23',67,'INVENTARIO_INICIAL',25,0,25,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(68,'2026-10-20 19:59:23',68,'INVENTARIO_INICIAL',20,0,20,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(69,'2026-10-20 19:59:23',69,'INVENTARIO_INICIAL',30,0,30,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(70,'2026-10-20 19:59:23',70,'INVENTARIO_INICIAL',22,0,22,19,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(71,'2026-10-20 19:59:23',71,'INVENTARIO_INICIAL',18,0,18,16.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(72,'2026-10-20 19:59:23',72,'INVENTARIO_INICIAL',30,0,30,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(73,'2026-10-20 19:59:23',73,'INVENTARIO_INICIAL',14,0,14,25,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(74,'2026-10-20 19:59:23',74,'INVENTARIO_INICIAL',30,0,30,95,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(75,'2026-10-20 19:59:23',75,'INVENTARIO_INICIAL',40,0,40,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(76,'2026-10-20 19:59:23',76,'INVENTARIO_INICIAL',15,0,15,115,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(77,'2026-10-20 19:59:23',77,'INVENTARIO_INICIAL',80,0,80,4.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(78,'2026-10-20 19:59:23',78,'INVENTARIO_INICIAL',60,0,60,5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(79,'2026-10-20 19:59:23',79,'INVENTARIO_INICIAL',35,0,35,7.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(80,'2026-10-20 19:59:23',80,'INVENTARIO_INICIAL',70,0,70,3.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(81,'2026-10-20 19:59:23',81,'INVENTARIO_INICIAL',50,0,50,4,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(82,'2026-10-20 19:59:23',82,'INVENTARIO_INICIAL',100,0,100,1.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(83,'2026-10-20 19:59:23',83,'INVENTARIO_INICIAL',60,0,60,5.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(84,'2026-10-20 19:59:23',84,'INVENTARIO_INICIAL',45,0,45,4,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(85,'2026-10-20 19:59:23',85,'INVENTARIO_INICIAL',40,0,40,3.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(86,'2026-10-20 19:59:23',86,'INVENTARIO_INICIAL',30,0,30,6,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(87,'2026-10-20 19:59:23',87,'INVENTARIO_INICIAL',30,0,30,5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(88,'2026-10-20 19:59:23',88,'INVENTARIO_INICIAL',50,0,50,9,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(89,'2026-10-20 19:59:23',89,'INVENTARIO_INICIAL',25,0,25,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(90,'2026-10-20 19:59:23',90,'INVENTARIO_INICIAL',20,0,20,15,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(91,'2026-10-20 19:59:23',91,'INVENTARIO_INICIAL',40,0,40,3.8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(92,'2026-10-20 19:59:23',92,'INVENTARIO_INICIAL',15,0,15,28,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(93,'2026-10-20 19:59:23',93,'INVENTARIO_INICIAL',25,0,25,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(94,'2026-10-20 19:59:23',94,'INVENTARIO_INICIAL',60,0,60,3.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(95,'2026-10-20 19:59:23',95,'INVENTARIO_INICIAL',20,0,20,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(96,'2026-10-20 19:59:23',96,'INVENTARIO_INICIAL',10,0,10,28,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(97,'2026-10-20 19:59:23',97,'INVENTARIO_INICIAL',18,0,18,12.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(98,'2026-10-20 19:59:23',98,'INVENTARIO_INICIAL',15,0,15,24,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(99,'2026-10-20 19:59:23',99,'INVENTARIO_INICIAL',4,0,4,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(100,'2026-10-20 19:59:23',100,'INVENTARIO_INICIAL',16,0,16,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(101,'2026-10-20 19:59:23',101,'INVENTARIO_INICIAL',25,0,25,16,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(102,'2026-10-20 19:59:23',102,'INVENTARIO_INICIAL',35,0,35,6.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(103,'2026-10-20 19:59:23',103,'INVENTARIO_INICIAL',24,0,24,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(104,'2026-10-20 19:59:23',104,'INVENTARIO_INICIAL',50,0,50,4.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(105,'2026-10-20 19:59:23',105,'INVENTARIO_INICIAL',45,0,45,4,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(106,'2026-10-20 19:59:23',106,'INVENTARIO_INICIAL',30,0,30,5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(107,'2026-10-20 19:59:23',107,'INVENTARIO_INICIAL',35,0,35,8.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(108,'2026-10-20 19:59:23',108,'INVENTARIO_INICIAL',25,0,25,11,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(109,'2026-10-20 19:59:23',109,'INVENTARIO_INICIAL',12,0,12,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(110,'2026-10-20 19:59:23',110,'INVENTARIO_INICIAL',10,0,10,25,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(111,'2026-10-20 19:59:23',111,'INVENTARIO_INICIAL',20,0,20,42,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(112,'2026-10-20 19:59:23',112,'INVENTARIO_INICIAL',15,0,15,78,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(113,'2026-10-20 19:59:23',113,'INVENTARIO_INICIAL',30,0,30,19.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(114,'2026-10-20 19:59:23',114,'INVENTARIO_INICIAL',35,0,35,16,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(115,'2026-10-20 19:59:23',115,'INVENTARIO_INICIAL',20,0,20,24,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(116,'2026-10-20 19:59:23',116,'INVENTARIO_INICIAL',25,0,25,34,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(117,'2026-10-20 19:59:23',117,'INVENTARIO_INICIAL',18,0,18,68,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(118,'2026-10-20 19:59:23',118,'INVENTARIO_INICIAL',40,0,40,8.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(119,'2026-10-20 19:59:23',119,'INVENTARIO_INICIAL',25,0,25,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(120,'2026-10-20 19:59:23',120,'INVENTARIO_INICIAL',20,0,20,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(121,'2026-10-20 19:59:23',121,'INVENTARIO_INICIAL',50,0,50,6.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(122,'2026-10-20 19:59:23',122,'INVENTARIO_INICIAL',25,0,25,14.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(123,'2026-10-20 19:59:23',123,'INVENTARIO_INICIAL',30,0,30,15,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(124,'2026-10-20 19:59:23',124,'INVENTARIO_INICIAL',22,0,22,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(125,'2026-10-20 19:59:23',125,'INVENTARIO_INICIAL',30,0,30,8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(126,'2026-10-20 19:59:23',126,'INVENTARIO_INICIAL',25,0,25,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(127,'2026-10-20 19:59:23',127,'INVENTARIO_INICIAL',30,0,30,10.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(128,'2026-10-20 19:59:23',128,'INVENTARIO_INICIAL',20,0,20,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(129,'2026-10-20 19:59:23',129,'INVENTARIO_INICIAL',25,0,25,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(130,'2026-10-20 19:59:23',130,'INVENTARIO_INICIAL',30,0,30,32,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(131,'2026-10-20 19:59:23',131,'INVENTARIO_INICIAL',25,0,25,38,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(132,'2026-10-20 19:59:23',132,'INVENTARIO_INICIAL',40,0,40,4.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(133,'2026-10-20 19:59:23',133,'INVENTARIO_INICIAL',20,0,20,38,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(134,'2026-10-20 19:59:23',134,'INVENTARIO_INICIAL',45,0,45,9.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(135,'2026-10-20 19:59:23',135,'INVENTARIO_INICIAL',35,0,35,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(136,'2026-10-20 19:59:23',136,'INVENTARIO_INICIAL',12,0,12,58,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(137,'2026-10-20 19:59:23',137,'INVENTARIO_INICIAL',25,0,25,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(138,'2026-10-20 19:59:23',138,'INVENTARIO_INICIAL',20,0,20,11,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(139,'2026-10-20 19:59:23',139,'INVENTARIO_INICIAL',10,0,10,42,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(140,'2026-10-20 19:59:23',140,'INVENTARIO_INICIAL',15,0,15,35,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(141,'2026-10-20 19:59:23',141,'INVENTARIO_INICIAL',25,0,25,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(142,'2026-10-20 19:59:23',142,'INVENTARIO_INICIAL',20,0,20,48,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(143,'2026-10-20 19:59:23',143,'INVENTARIO_INICIAL',30,0,30,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(144,'2026-10-20 19:59:23',144,'INVENTARIO_INICIAL',25,0,25,22,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(145,'2026-10-20 19:59:23',145,'INVENTARIO_INICIAL',20,0,20,18,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(146,'2026-10-20 19:59:23',146,'INVENTARIO_INICIAL',22,0,22,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(147,'2026-10-20 19:59:23',147,'INVENTARIO_INICIAL',16,0,16,20,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(148,'2026-10-20 19:59:23',148,'INVENTARIO_INICIAL',18,0,18,16,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(149,'2026-10-20 19:59:23',149,'INVENTARIO_INICIAL',15,0,15,24,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(150,'2026-10-20 19:59:23',150,'INVENTARIO_INICIAL',9999,0,9999,0.2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(151,'2026-10-20 19:59:23',151,'INVENTARIO_INICIAL',9999,0,9999,1.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(152,'2026-10-20 19:59:23',152,'INVENTARIO_INICIAL',9999,0,9999,0.35,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(153,'2026-10-20 19:59:23',153,'INVENTARIO_INICIAL',9999,0,9999,6.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(154,'2026-10-20 19:59:23',154,'INVENTARIO_INICIAL',9999,0,9999,2,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(155,'2026-10-20 19:59:23',155,'INVENTARIO_INICIAL',9999,0,9999,4.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(156,'2026-10-20 19:59:23',156,'INVENTARIO_INICIAL',9999,0,9999,6,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(157,'2026-10-20 19:59:23',157,'INVENTARIO_INICIAL',9999,0,9999,8,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(158,'2026-10-20 19:59:23',158,'INVENTARIO_INICIAL',9999,0,9999,14,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(159,'2026-10-20 19:59:23',159,'INVENTARIO_INICIAL',9999,0,9999,0.5,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
INSERT INTO "kardex_movimientos" VALUES(160,'2026-10-20 19:59:23',160,'INVENTARIO_INICIAL',9999,0,9999,12,'APERTURA','Carga inicial de Catálogo Maestro Papelería A B C','Gerardo Cabrera Morales');
CREATE TABLE marcas (
        id_marca INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(80) NOT NULL UNIQUE,
        activo BOOLEAN NOT NULL DEFAULT 1
    );
INSERT INTO "marcas" VALUES(1,'Scribe',1);
INSERT INTO "marcas" VALUES(2,'Bic',1);
INSERT INTO "marcas" VALUES(3,'Dixon',1);
INSERT INTO "marcas" VALUES(4,'Factis',1);
INSERT INTO "marcas" VALUES(5,'Barrilito',1);
INSERT INTO "marcas" VALUES(6,'Pritt',1);
INSERT INTO "marcas" VALUES(7,'Crayola',1);
INSERT INTO "marcas" VALUES(8,'Maped',1);
INSERT INTO "marcas" VALUES(9,'Pilot',1);
INSERT INTO "marcas" VALUES(10,'Paper Mate',1);
INSERT INTO "marcas" VALUES(11,'Baco',1);
INSERT INTO "marcas" VALUES(12,'Berol',1);
CREATE TABLE mermas (
        id_merma INTEGER PRIMARY KEY AUTOINCREMENT,
        id_producto INTEGER NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        motivo VARCHAR(100) NOT NULL,
        justificacion TEXT NOT NULL,
        costo_perdida DECIMAL(10,2) NOT NULL,
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        responsable VARCHAR(100) NOT NULL,
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
    );
CREATE TABLE productos (
        id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_barras VARCHAR(50) NOT NULL UNIQUE,
        sku VARCHAR(30) NOT NULL UNIQUE,
        nombre VARCHAR(150) NOT NULL,
        descripcion TEXT,
        id_categoria INTEGER NOT NULL,
        id_marca INTEGER NOT NULL,
        id_unidad INTEGER NOT NULL,
        id_proveedor_habitual INTEGER DEFAULT 1,
        precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        precio_venta_menudeo DECIMAL(10,2) NOT NULL,
        precio_venta_mayoreo DECIMAL(10,2) NOT NULL,
        cantidad_mayoreo DECIMAL(10,2) NOT NULL DEFAULT 3.00,
        stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 5.00,
        stock_maximo DECIMAL(10,2) NOT NULL DEFAULT 100.00,
        ubicacion_anaquel VARCHAR(50) DEFAULT 'Pasillo Central',
        es_servicio BOOLEAN NOT NULL DEFAULT 0,
        permite_desglose BOOLEAN NOT NULL DEFAULT 0,
        activo BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
        FOREIGN KEY (id_marca) REFERENCES marcas(id_marca),
        FOREIGN KEY (id_unidad) REFERENCES unidades_medida(id_unidad),
        FOREIGN KEY (id_proveedor_habitual) REFERENCES proveedores(id_proveedor)
    );
INSERT INTO "productos" VALUES(1,'7501024500123','SC-CUAD-RAY100','Cuaderno Profesional Raya 100 Hojas Scribe','Espiral metálico continuo, pasta semirrígida plastificada con márgenes rojos.',1,1,1,1,22.5,35,32,3,45,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(2,'7501024500130','SC-CUAD-CUA5','Cuaderno Profesional Cuadro Chico 5mm 100h Scribe','Cuadro 5mm ideal para matemáticas y física. 100 hojas bond 56g.',1,1,1,1,22.5,35,32,3,50,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(3,'7501024500147','SC-CUAD-CUA7','Cuaderno Profesional Cuadro Grande 7mm 100h Scribe','Cuadro grande 7mm recomendado para primaria y caligrafía inicial.',1,1,1,1,22.5,35,32,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(4,'7501024500154','SC-CUAD-BLAN100','Cuaderno Profesional Hojas Blancas 100h Scribe','Hojas lisas sin rayado para dibujo, bocetos y diagramas.',1,1,1,1,22.5,35,32,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(5,'7501024500161','SC-CUAD-DOBL100','Cuaderno Profesional Doble Raya 100h Scribe','Pauta de doble línea para aprendizaje y perfeccionamiento de letra.',1,1,1,1,22.5,35,32,3,20,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(6,'7501024500208','SC-CUAD-COS-RAY200','Cuaderno Profesional Cosido Raya 200 Hojas Scribe','Encuadernación cosida reforzada de lomo plano, 200 hojas raya.',1,1,1,1,48,72,65,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(7,'7501024500215','SC-CUAD-COS-CUA200','Cuaderno Profesional Cosido Cuadro 5mm 200h Scribe','Encuadernación cosida reforzada indeformable para uso rudo universitario.',1,1,1,1,48,72,65,3,15,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(8,'7501024500307','SC-LIB-FRAN-RAY','Libreta Forma Francesa Espiral Raya 100h Scribe','Tamaño 19 x 24 cm, hojas bond con rayado uniforme y espiral plástico.',1,1,1,1,17.5,28,25,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(9,'7501024500314','SC-LIB-FRAN-CUA','Libreta Forma Francesa Cuadro Chico 100h Scribe','Tamaño 19 x 24 cm, cuadro 5mm con margen lateral marcado.',1,1,1,1,17.5,28,25,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(10,'7501024500321','SC-LIB-ITAL-RAY','Libreta Forma Italiana Cosida Raya 100h Scribe','Tamaño apaisado 15 x 21 cm cosida con cinta en el lomo.',1,1,1,1,15,24,21,3,22,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(11,'7501024500338','SC-LIB-ITAL-CUA','Libreta Forma Italiana Cosida Cuadro 100h Scribe','Forma italiana cuadro grande para jardín de niños y primer grado.',1,1,1,1,15,24,21,3,20,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(12,'7501024500406','SC-BLOCK-MARQ-ESP','Block Marquilla de Dibujo con Espiral Scribe 20h','Papel marquilla de 135g con papel cebolla intercalado para protección.',1,1,1,1,32,52,46,3,16,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(13,'7501024500413','SC-BLOCK-MILL-CUA','Block de Papel Milimétrico Tamaño Carta 50h','Cuadrícula milimétrica impresa en color sepia con margen técnico.',1,1,1,1,24,38,34,3,12,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(14,'7501024500505','NOT-POST-3X3-AMAR','Notas Adhesivas 3x3 Pulgadas Amarillas (100h)','Bloc de notas tipo post-it reposicionables color amarillo canario clásico.',1,10,1,1,14.5,24,20,3,35,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(15,'7501024500512','NOT-BAND-SURT-COL','Banderitas Adhesivas Señalizadoras Colores Neón','Dispensador con 5 colores brillantes para índices, lectura y firmas.',1,10,1,1,18,30,26,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(16,'7501024500529','SC-CUAD-PAST-DURA','Cuaderno Profesional Pasta Dura Raya Scribe Excellence','Pasta rígida empastada tipo cartón de 2mm con elástico de cierre.',1,1,1,1,58,89,79,3,14,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(17,'7501024500536','SC-LIB-TAQU-ESP','Libreta de Taquigrafía Pitman Espiral Superior 80h','Rayado especial con línea divisoria central y espiral superior.',1,1,1,1,14,22,19,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(18,'7501024500543','SC-BLOC-CARTA-RAY','Block de Notas Tamaño Carta Engomado Raya 50h','Hojas desprendibles con lomo engomado para cartas y memorándums.',1,1,1,1,12,20,17.5,3,28,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(19,'7501030101015','BIC-CRIS-AZUL','Bolígrafo Punto Mediano 1.0mm Cristal Azul Bic','Punto mediano 1.0mm, cuerpo hexagonal transparente y tapa ventilada.',2,2,1,1,4.2,8,6.5,3,120,25,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(20,'7501030101022','BIC-CRIS-NEGR','Bolígrafo Punto Mediano 1.0mm Cristal Negro Bic','Tinta negra indeleble de alta densidad para trámites y notas escolares.',2,2,1,1,4.2,8,6.5,3,95,25,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(21,'7501030101039','BIC-CRIS-ROJO','Bolígrafo Punto Mediano 1.0mm Cristal Rojo Bic','Tinta roja viva ideal para revisiones, títulos y correcciones escolares.',2,2,1,1,4.2,8,6.5,3,80,20,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(22,'7501030101046','BIC-CRIS-VERD','Bolígrafo Punto Mediano 1.0mm Cristal Verde Bic','Tinta verde bosque para notas auxiliares y diagramas.',2,2,1,1,4.2,8,6.5,3,45,15,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(23,'7501030102012','BIC-PREC-AZUL','Bolígrafo Punto Fino 0.7mm Cristal Fino Azul Bic','Punta de aguja fina 0.7mm para trazos delicados y letra compacta.',2,2,1,1,4.8,9,7.5,3,60,15,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(24,'7501030102029','BIC-PREC-NEGR','Bolígrafo Punto Fino 0.7mm Cristal Fino Negro Bic','Punto fino 0.7mm tinta negra para dibujo técnico y escritura pulcra.',2,2,1,1,4.8,9,7.5,3,55,15,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(25,'7501030103019','BIC-DIAM-AZUL','Bolígrafo Retráctil Bic Atlantis Azul 1.0mm','Mecanismo retráctil con grip de goma ergonómico y tinta ultrasuave.',2,2,1,1,11.5,18,15.5,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(26,'7501030103026','BIC-DIAM-NEGR','Bolígrafo Retráctil Bic Atlantis Negro 1.0mm','Bolígrafo retráctil negro ejecutivo con clip metálico duradero.',2,2,1,1,11.5,18,15.5,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(27,'7501099901017','PIL-G2-NEGR07','Bolígrafo de Gel Retráctil Pilot G2 0.7mm Negro','Tinta gel dinámica japonesa de máxima fluidez con empuñadura acolchada.',2,9,1,1,22,36,32,3,28,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(28,'7501099901024','PIL-G2-AZUL07','Bolígrafo de Gel Retráctil Pilot G2 0.7mm Azul','Bolígrafo de gel azul premium de larga duración para firmas y bitácoras.',2,9,1,1,22,36,32,3,24,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(29,'7501099901031','PIL-G2-ROJO07','Bolígrafo de Gel Retráctil Pilot G2 0.7mm Rojo','Gel rojo brillante con punta bola de carburo de tungsteno indeformable.',2,9,1,1,22,36,32,3,16,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(30,'7501041001018','PM-KILO-AZUL','Bolígrafo Kilométrico 100 Retráctil Azul Paper Mate','Tecnología InkJoy que inicia la escritura rápidamente sin esfuerzo.',2,10,1,1,7.5,12,10.5,3,50,12,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(31,'7501041001025','PM-KILO-NEGR','Bolígrafo Kilométrico 100 Retráctil Negro Paper Mate','Cuerpo traslúcido y sistema de tinta InkJoy fluida color negro.',2,10,1,1,7.5,12,10.5,3,45,12,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(32,'7501041001032','PM-KILO-ROJO','Bolígrafo Kilométrico 100 Retráctil Rojo Paper Mate','Tinta roja viva con mecanismo retráctil de clic sonoro.',2,10,1,1,7.5,12,10.5,3,35,10,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(33,'7501017001005','DIXON-LAP-NO2','Lápiz de Grafito HB No. 2 Ticonderoga Dixon','El mejor lápiz del mundo: madera de cedro, mina resistente y goma verde.',2,3,1,1,3.8,7,6,3,60,15,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(34,'7501017001012','DIXON-LAP-2B','Lápiz de Grafito 2B para Dibujo y Sombras Dixon','Mina blanda 2B de grafito puro para sombreado artístico y bocetos.',2,3,1,1,5.5,10,8.5,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(35,'7501017001029','DIXON-LAP-4B','Lápiz de Grafito 4B Artístico Sombra Intensa Dixon','Mina muy suave de trazo negro aterciopelado para retratos y claroscuro.',2,3,1,1,6,11,9.5,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(36,'7501041002015','PM-LAP-MIRADO','Lápiz Grafito Mirado Clásico No. 2 Paper Mate','Clásico lápiz amarillo con banda roja, mina HB duradera para exámenes.',2,10,1,1,4,7.5,6.2,3,40,10,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(37,'7501041003012','MARC-RESAL-AMAR','Marcatextos Resaltador Fluorescente Amarillo Sharpie','Punta biselada Smear Guard que no corre la tinta de bolígrafo ni copias.',2,10,1,1,9.5,16,13.5,3,35,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(38,'7501041003029','MARC-RESAL-VERD','Marcatextos Resaltador Fluorescente Verde Sharpie','Tinta fluorescente de secado rápido color verde brillante para lectura.',2,10,1,1,9.5,16,13.5,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(39,'7501041003036','MARC-RESAL-ROSA','Marcatextos Resaltador Fluorescente Rosa Sharpie','Color rosa neón translúcido para subrayar títulos y notas destacadas.',2,10,1,1,9.5,16,13.5,3,28,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(40,'7501041003043','MARC-RESAL-NAR','Marcatextos Resaltador Fluorescente Naranja Sharpie','Marcador fluorescente naranja de alto contraste visual.',2,10,1,1,9.5,16,13.5,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(41,'7501041003050','MARC-RESAL-PAST','Marcatextos Color Pastel Turquesa / Menta Maped','Tono pastel suave que no cansa la vista en lecturas prolongadas.',2,8,1,1,11,18,15,3,20,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(42,'7501041004019','SHAR-PERM-NEGR','Marcador Permanente Punta Fina Negro Sharpie','Tinta indeleble resistente al agua en plástico, metal, cartón y vidrio.',2,10,1,1,13.5,22,18.5,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(43,'7501041004026','SHAR-PERM-AZUL','Marcador Permanente Punta Fina Azul Sharpie','Marcador azul permanente de secado rápido sobre superficies difíciles.',2,10,1,1,13.5,22,18.5,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(44,'7501041004033','SHAR-PERM-ROJO','Marcador Permanente Punta Fina Rojo Sharpie','Tinta roja permanente de alta pigmentación.',2,10,1,1,13.5,22,18.5,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(45,'7501041004040','SHAR-PERM-CINCEL','Marcador Permanente Punta Cincel Grueso Negro Sharpie','Punta ancha biselada para rotular cajas de cartón y letreros grandes.',2,10,1,1,16,26,22.5,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(46,'7501099902014','PIL-PIZA-NEGR','Marcador para Pizarrón Blanco V-Board Negro Pilot','Sistema de tinta líquida con depósito visible recargable y borrado seco.',2,9,1,1,19,32,28,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(47,'7501099902021','PIL-PIZA-AZUL','Marcador para Pizarrón Blanco V-Board Azul Pilot','Tinta líquida azul de borrado instantáneo sin dejar manchas fantasmas.',2,9,1,1,19,32,28,3,25,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(48,'7501099902038','PIL-PIZA-ROJO','Marcador para Pizarrón Blanco V-Board Rojo Pilot','Marcador para pintarrón rojo no tóxico de flujo constante.',2,9,1,1,19,32,28,3,20,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(49,'7501099902045','PIL-PIZA-VERD','Marcador para Pizarrón Blanco V-Board Verde Pilot','Color verde esmeralda brillante para esquemas en clase.',2,9,1,1,19,32,28,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(50,'7501041005016','PM-PORT-05MM','Portaminas Ergonómico 0.5mm Paper Mate Non-Stop','Alimentación continua por giro con goma giratoria extralarga.',2,10,1,1,14,24,20,3,22,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(51,'7501041005023','PM-PORT-07MM','Portaminas Ergonómico 0.7mm Paper Mate Non-Stop','Grosor 0.7mm resistente a roturas accidentales al escribir con fuerza.',2,10,1,1,14,24,20,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(52,'7501041005115','MINAS-05MM-HB','Estuche de Minas 0.5mm HB Pentel / Paper Mate (12p)','Tubo de minas de polímero resistentes a la flexión.',2,10,1,1,9,16,13,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(53,'7501041005122','MINAS-07MM-HB','Estuche de Minas 0.7mm HB Pentel / Paper Mate (12p)','Tubo dispensador de minas 0.7mm dureza media HB.',2,10,1,1,9,16,13,3,35,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(54,'7501030104016','BIC-CORR-LIPEN','Corrector Líquido Tipo Pluma 7ml Bic Shake''n Squeeze','Punta de aguja metálica para corregir errores puntuales sin manchar.',2,2,1,1,16.5,26,22,3,32,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(55,'7501041006013','PM-CORR-CINTA','Corrector en Cinta Seca 5mm x 6m Liquid Paper','Cinta blanca de aplicación inmediata: se puede escribir encima al instante.',2,10,1,1,21,35,30,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(56,'7501008000444','PRITT-ADH-10G','Lápiz Adhesivo Barra 10g Pritt Original Chico','Tamaño de bolsillo 10g, no ondula el papel, lavable y no tóxico.',3,6,1,1,11.5,20,17.5,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(57,'7501008000451','PRITT-ADH-22G','Lápiz Adhesivo Barra 22g Pritt Original Mediano','Presentación estándar escolar 22g libre de solventes (Alerta Stock Bajo).',3,6,1,1,18.5,32,28,3,8,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(58,'7501008000468','PRITT-ADH-42G','Lápiz Adhesivo Barra 42g Pritt Original Grande','Barra jumbo de 42g para maquetas, talleres y uso intensivo.',3,6,1,1,28,46,40,3,15,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(59,'7501008000505','PEG-BLAN-110G','Pegamento Blanco Escolar 110g Resistol 850','Fórmula tradicional de acetato de polivinilo de fuerte adhesión.',3,6,1,1,13,22,19,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(60,'7501008000512','PEG-BLAN-250G','Pegamento Blanco Escolar 250g Resistol 850','Bote con dosificador cónico para manualidades en papel y madera.',3,6,1,1,24,38,33,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(61,'7501008000529','PEG-BLAN-500G','Pegamento Blanco Escolar 500g Resistol 850 Medio Kilo','Medio litro de pegamento vinílico extrafuerte para carpintería y cartonería.',3,6,1,1,42,68,60,3,12,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(62,'7501056303012','BARR-SILIC-100ML','Silicón Líquido Frío 100ml Barrilito','Adhesivo transparente de alta viscosidad para foamy, tela y cartón.',3,5,1,1,15.5,26,22.5,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(63,'7501056303029','BARR-SILIC-250ML','Silicón Líquido Frío 250ml Barrilito','Bote grande de silicón frío ideal para proyectos de manualidades.',3,5,1,1,27,44,38,3,16,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(64,'7501056303104','SILIC-BARR-GRUE','Barras de Silicón Caliente Grueso 11mm (Paq 10p)','Barras transparentes para pistola de silicón estándar caliente.',3,5,3,1,22,36,30,3,20,5,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(65,'7501056303111','SILIC-BARR-DELG','Barras de Silicón Caliente Delgado 7mm (Paq 10p)','Barras delgadas 7mm para minipistolas de manualidades escolares.',3,5,3,1,16,28,24,3,25,6,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(66,'7501056304019','CINT-ADH-TRAN18','Cinta Adhesiva Transparente 18mm x 33m Barrilito','Durex transparente para envolturas de regalos y pegado de notas.',3,5,1,1,6,12,9.5,3,50,12,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(67,'7501056304026','CINT-EMPQ-TRAN48','Cinta para Empaque Transparente 48mm x 50m','Cinta canela/transparente de alto agarre para sellado de cajas.',3,5,1,1,18,30,25,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(68,'7501056304033','CINT-EMPQ-CANE48','Cinta para Empaque Color Canela 48mm x 50m','Cinta adhesiva color café canela para paquetería y mudanzas.',3,5,1,1,18,30,25,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(69,'7501056304118','CINT-MASK-18MM','Cinta Masking Tape de Papel 18mm x 50m Barrilito','Cinta de enmascarar de fácil desprendimiento sin dejar residuos.',3,5,1,1,14,24,20,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(70,'7501056304125','CINT-MASK-24MM','Cinta Masking Tape de Papel 24mm x 50m Barrilito','Ancho de 1 pulgada para rotulación escolar y pintura.',3,5,1,1,19,32,27,3,22,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(71,'7501056304200','CINT-DOBL-ESPUM','Cinta Doble Capa Espumosa de Montaje 18mm x 2m','Espuma con adhesivo en ambas caras para colgar cuadros y pósters.',3,5,1,1,16.5,28,24,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(72,'7501008000604','KOLA-LOKA-3G','Pegamento Instantáneo Kola Loka Goteador 3g','Cianoacrilato de máxima velocidad: pega en 30 segundos metales y plásticos.',3,6,1,1,22,35,30,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(73,'7501008000611','PRITT-MULTIFIX','Masilla Adhesiva Reutilizable Pritt Multi-Fix 35g','Tack reposicionable para fijar láminas y dibujos sin perforar paredes.',3,6,1,1,25,42,36,3,14,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(74,'7501024500604','SC-PAQ-BOND-CTA','Paquete Hojas Bond Carta 75g (500h) Scribe','Blancura 97%, libre de ácido para fotocopiadoras e impresoras láser/inyección.',4,1,3,1,95,135,120,3,30,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(75,'7501024500611','SC-CTO-BOND-CTA','Hojas Bond Blanco Tamaño Carta (Ciento 100h)','Fraccionamiento de 100 hojas bond para tareas y proyectos escolares.',4,1,4,1,22,35,30,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(76,'7501024500628','SC-PAQ-BOND-OFI','Paquete Hojas Bond Oficio 75g (500h) Scribe','Tamaño legal / oficio 21.6 x 34 cm para contratos y expedientes.',4,1,3,1,115,160,145,3,15,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(77,'7501024500703','CART-BRIS-BLAN','Cartulina Bristol Blanca 50x65cm (Pliego)','Gramaje 150g satinado por ambas caras para carteles y exposiciones.',4,1,1,1,4.5,9,7.5,3,80,20,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(78,'7501024500710','CART-BRIS-COLO','Cartulina Bristol Colores Pastel Surtidos (Pliego)','Colores rosa, celeste, amarillo, verde y canario para manualidades.',4,1,1,1,5,10,8,3,60,15,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(79,'7501024500727','CART-FLUO-NEON','Cartulina Fluorescente / Neón Surtida (Pliego)','Colores fosforescentes amarillo, verde, naranja y fiusha brillante.',4,1,1,1,7.5,14,12,3,35,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(80,'7501024500734','PAP-LUST-SURT','Papel Lustre Colores Surtidos (Pliego 50x70cm)','Acabado brillante encerado para forrar libretas y maquetas.',4,1,1,1,3.2,6.5,5,3,70,20,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(81,'7501024500741','PAP-CREP-SURT','Papel Crepé Varios Colores (Tira 50x200cm)','Textura corrugada elástica para decoración de festivales y piñatas.',4,1,1,1,4,8,6.5,3,50,15,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(82,'7501024500758','PAP-CHIN-SURT','Papel China Varios Colores (Pliego)','Papel tisú delgado y translúcido para envolturas y flores.',4,1,1,1,1.2,3,2,3,100,30,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(83,'7501024500765','PAP-AMER-SURT','Papel América Varios Colores (Metro)','Papel kraft teñido por un lado para forrar periódicos murales y mesas.',4,1,5,1,5.5,10,8.5,3,60,15,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(84,'7501024500772','PAP-KRAF-70X100','Papel Kraft Café Envoltura 90g (Pliego 70x100cm)','Papel resistente ecológico para embalaje, patrones y paquetes.',4,1,1,1,4,8,6.5,3,45,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(85,'7501024500789','PAP-CASC-OCTAVO','Papel Cascarón de Huevo Tamaño 1/8 (Pieza)','Cartón rígido texturizado para acuarelas, témperas y maquetas escolares.',4,1,1,1,3.5,7,5.5,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(86,'7501024500796','PAP-CASC-CUARTO','Papel Cascarón de Huevo Tamaño 1/4 (Pieza)','Tamaño 35 x 50 cm para maquetas de ciencias naturales y geografía.',4,1,1,1,6,12,10,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(87,'7501024500802','PAP-ILUS-OCTAVO','Papel Ilustración 1/8 Blanco Satinado','Base blanca lisa y reverso gris para dibujo a tinta y rotuladores.',4,1,1,1,5,10,8.5,3,30,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(88,'7501024500819','CONTAC-TRAN-MET','Papel Contac Transparente Autoadherible (Metro)','Plástico autoadhesivo para forrar libros, libretas y credenciales.',4,5,5,1,9,16,13.5,3,50,15,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(89,'7501024500826','CONTAC-COLO-MET','Papel Contac Colores Sólidos Autoadherible (Metro)','Película vinílica adhesiva opaca para forro directo de pastas.',4,5,5,1,12,20,17,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(90,'7501024500833','PAP-CARB-CARTA','Papel Carbón Negro Tamaño Carta Kores (Sobre 10h)','Papel calca negro para copias manuscritas de notas y recibos.',4,1,1,1,15,25,21,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(91,'7501024500840','PAP-BOND-ROLLO','Papel Bond en Rollo / Pliego Blanco 70x100cm','Pliego grande de papel bond blanco para planos, trazos y rotafolios.',4,1,1,1,3.8,8,6.5,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(92,'7501042300055','MAPED-GEO-15','Juego de Geometría Flexible 5 Pzas Maped Twist','Regla 30cm, escuadras 45°/60°, transportador y compás irrompibles.',5,8,1,1,28,48,42,3,15,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(93,'7501042300062','BARR-GEO-RIGID','Juego de Geometría Plástico Rígido Escolar Barrilito','Estuche con regla biselada 30cm, escuadra 30/60, escuadra 45 y transportador.',5,5,1,1,18,32,27,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(94,'7501056305016','BARR-REGL-30CM','Regla Graduada de Plástico Transparente 30cm','Escala milimétrica y en pulgadas con filo antimanchas.',5,5,1,1,3.5,7,5.5,3,60,15,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(95,'7501056305023','BARR-REGL-META30','Regla Metálica de Acero Inoxidable 30cm Barrilito','Grabado láser indeleble con tabla de conversión en el reverso.',5,5,1,1,14,25,21,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(96,'7501056305030','BARR-REGL-META60','Regla Metálica de Acero Inoxidable 60cm Barrilito','Longitud de 60cm para arquitectura, diseño y corte con cúter.',5,5,1,1,28,48,42,3,10,3,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(97,'7501042300109','MAPED-TRAN-360','Transportador Circular 360 Grados Maped Technic','Círculo completo con mira central para medición precisa de rumbos.',5,8,1,1,12.5,22,18.5,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(98,'7501042300208','MAPED-COMP-PREC','Compás de Precisión Metálico con Adaptador Maped','Brazos articulados metálicos con estuche de minas de repuesto.',5,8,1,1,24,42,36,3,15,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(99,'7501056302008','BARR-TIJ-ESC','Tijera Escolar Punta Roma 5 Pulgadas Barrilito','Hojas de acero inoxidable graduadas y mango ergonómico (Alerta Stock Bajo).',5,5,1,1,12,22,19,3,4,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(100,'7501056302015','BARR-TIJ-OFIC8','Tijera de Oficina y Modistería 8 Pulg Barrilito','Hojas afiladas de alta resistencia para cortes rectos en cartulina y tela.',5,5,1,1,22,38,32,3,16,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(101,'7501056302107','BARR-CUTE-MET18','Cúter Metálico Grande 18mm con Seguro Barrilito','Riel de acero inoxidable reforzado con seguro de bloqueo automático.',5,5,1,1,16,28,24,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(102,'7501056302114','BARR-CUTE-ESC9','Cúter Chico Escolar Plástico 9mm Barrilito','Tamaño compacto para corte fino de papel y trabajos manuales.',5,5,1,1,6.5,12,10,3,35,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(103,'7501056302121','NAVAJ-REP-18MM','Navajas de Repuesto para Cúter 18mm (Estuche 10p)','Hojas seccionadas de acero al carbono SK5 templadas.',5,5,1,1,12,22,18,3,24,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(104,'7501018000106','FACT-GOMA-S20','Goma de Borrar Plástica Blanca Factis S20','Goma plástica suave no abrasiva que borra sin desgastar ni raspar el papel.',5,4,1,1,4.5,8,6.8,3,50,12,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(105,'7501017002002','DIXON-GOMA-MIGA','Goma de Borrar Migajón No. 20 Dixon','Goma clásica de caucho sintético suave para lápices de grafito.',5,3,1,1,4,7.5,6.2,3,45,10,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(106,'7501018000205','FACT-GOMA-BICO','Goma de Borrar Bicolor Tinta y Lápiz Factis','Lado rojo para grafito y lado azul con micropartículas para tinta.',5,4,1,1,5,9,7.5,3,30,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(107,'7501042300307','MAPED-SACA-META','Sacapuntas Metálico Doble Entrada Maped','Cuerpo de aleación de magnesio con orificios estándar y jumbo.',5,8,1,1,8.5,15,12.5,3,35,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(108,'7501042300314','MAPED-SACA-DEPO','Sacapuntas con Depósito Plástico Maped Shaker','Depósito hermético transparente para recoger virutas en el aula.',5,8,1,1,11,18,15,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(109,'7501042300321','ESCU-TEC-45-28','Escuadra de 45 Grados Acrílico Técnico 28cm Sin Bisel','Acrílico transparente grueso de 2mm para dibujo técnico profesional.',5,8,1,1,22,38,32,3,12,3,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(110,'7501042300338','ESCU-TEC-60-32','Escuadra de 60 Grados Acrílico Técnico 32cm Sin Bisel','Escuadra 30/60 para dibujo arquitectónico de alta exactitud.',5,8,1,1,25,42,36,3,10,3,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(111,'7501041007010','BEROL-PRIS-12L','Lápices de Color Prismacolor Junior 12p Largos','Minas cremosas de 4mm con pigmentación intensa para mezclas.',6,12,1,1,42,68,60,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(112,'7501041007027','BEROL-PRIS-24L','Lápices de Color Prismacolor Junior 24p Largos','Estuche completo de 24 colores brillantes con tonos piel y metálicos.',6,12,1,1,78,125,110,3,15,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(113,'7501017003016','DIXON-MAPI-12C','Lápices de Colores Dixon Mapita 12p Cortos','Colores clásicos escolares económicos y resistentes.',6,3,1,1,19.5,32,28,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(114,'7501009001013','CRAY-CERA-12P','Caja de Crayones de Cera Estándar 12p Crayola','Fórmula no tóxica con doble envoltura de papel para mayor resistencia.',6,7,1,1,16,26,22.5,3,35,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(115,'7501009001020','CRAY-JUMB-8P','Caja de Crayones Jumbo Lavables 8p Crayola','Grosor extra para manos pequeñas de preescolar, lavables en ropa y paredes.',6,7,1,1,24,38,33,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(116,'7501009002010','CRAY-PLUM-12P','Plumones de Agua Lavables 12 Piezas Crayola','Punta cónica para trazos finos y gruesos, tinta base agua lavable.',6,7,1,1,34,54,47,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(117,'7501009002027','CRAY-SUPERTIPS-24','Plumones Delgados SuperTips 24 Colores Crayola','Set para lettering y dibujo artístico con 24 tonos diferenciados.',6,7,1,1,68,105,92,3,18,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(118,'7501041008017','BEROL-PLAS-180G','Barra de Plastilina Modelina 180g Berol Varios Col','Plastilina escolar suave que no mancha las manos ni se endurece al aire.',6,12,1,1,8.5,15,12,3,40,10,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(119,'7501041008024','BEROL-PLAS-10B','Caja de Plastilina con 10 Barritas Surtidas Berol','Paquete multicolor con 10 tonos básicos para trabajos de modelado.',6,12,1,1,18,30,26,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(120,'7501009003017','CRAY-ACUA-12P','Acuarelas Escolares Lavables con Pincel 12 Pastillas','Estuche plástico con tapa mezcladora y pincel de cerdas naturales.',6,7,1,1,22,36,31,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(121,'7501009003116','PINT-TEMP-25ML','Pintura Gouache Tempera Escolar 25ml Varios Colores','Bote con pintura al agua opaca lista para aplicar en cartón y papel.',6,7,1,1,6.5,12,9.5,3,50,12,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(122,'7501056306013','PINC-PAQ-5P','Juego de Pinceles Escolares Pelo Camello (Paq 5p)','Pinceles redondos No. 2, 4, 6, 8 y plano 1/2 para arte y acuarela.',6,5,3,1,14.5,25,21,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(123,'7501056306112','FOAM-CARTA-LISO','Foamy Tamaño Carta Colores Lisos (Paq 10p)','Goma EVA de 2mm espesor colores primarios y secundarios para recortar.',6,5,3,1,15,25,22,3,30,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(124,'7501056306129','FOAM-CARTA-DIAM','Foamy Tamaño Carta Diamantado con Brillos (Paq 5p)','Acabado brillante con purpurina adherida que no se desprende.',6,5,3,1,18,30,26,3,22,5,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(125,'7501056306204','OJIT-MOVI-SURT','Ojos Movibles para Manualidades Tamaños Surtidos (50p)','Bolsa con ojos de plástico redondos para muñecos y títeres.',6,5,1,1,8,15,12,3,30,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(126,'7501056306211','LIMP-PIPA-SURT','Limpiapipas de Colores Chenille (Paq 25p)','Alambres afelpados maleables para figuras y estructuras.',6,5,3,1,9.5,18,15,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(127,'7501056306228','ABAT-MADE-NAT50','Abatelenguas de Madera Natural Pulida (Paq 50p)','Palitos anchos de madera sin astillas para maquetas y manualidades.',6,5,3,1,10.5,18,15,3,30,8,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(128,'7501056306235','GIS-BLAN-CAJA50','Gis Blanco Antipolvo para Pizarrón (Caja 50p) Dixon','Tiza blanca cilíndrica de carbonato de calcio que no genera polvo volátil.',6,3,2,1,18,30,26,3,20,5,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(129,'7501056306242','GIS-COLO-CAJA12','Gis de Colores Pastel Antipolvo (Caja 12p) Dixon','Gises de colores vivos para juegos de patio, asfalto y pizarrones verdes.',6,3,2,1,12,22,18.5,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(130,'7501015001014','FOLD-MANI-CTA','Folder Manila Tamaño Carta con Pestaña (Paq 25p)','Cartulina manila resistente con pestaña lateral 1/3 para membrete.',7,1,3,1,32,52,45,3,30,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(131,'7501015001021','FOLD-MANI-OFI','Folder Manila Tamaño Oficio con Pestaña (Paq 25p)','Tamaño oficio para archivo legal de documentos y expedientes.',7,1,3,1,38,60,52,3,25,6,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(132,'7501015001038','FOLD-PLAS-COST','Folder Plástico Transparente con Costilla Carta','Broche de presión deslizable para entregar reportes sin perforar hojas.',7,11,1,1,4.5,9,7.5,3,40,10,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(133,'7501015002011','BACO-BROC-8CM','Broches para Archivo Tipo Baco Metálicos 8cm (Caja 50)','Base y compresor de lámina de hojalata inoxidable capacidad 5cm.',7,11,2,1,38,62,54,3,20,5,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(134,'7501015003018','BACO-CLIP-NO1','Clips Metálicos Galvanizados No. 1 Estándar (Caja 100)','Alambre electrogalvanizado resistente a la corrosión largo 33mm.',7,11,2,1,9.5,16,13.5,3,45,10,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(135,'7501015003025','BACO-CLIP-JUMB','Clips Metálicos Galvanizados Jumbo No. 2 (Caja 50p)','Clips grandes 50mm para sujetar legajos de más de 30 páginas.',7,11,2,1,12,20,17,3,35,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(136,'7501056307010','BARR-ENGR-TIRA','Engrapadora Metálica de Oficina Tira Completa Barrilito','Cuerpo metálico con base de goma antideslizante capacidad 25 hojas.',7,5,1,1,58,92,82,3,12,3,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(137,'7501056307027','BARR-GRAP-26-6','Grapas Estándar 26/6 (Caja con 5000 piezas) Barrilito','Corona estándar 1/2 pulgada de acero cobrizado de penetración limpia.',7,5,2,1,18,30,26,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(138,'7501056307034','BARR-QUIT-PINZ','Quitagrapas Metálico Tipo Pinza con Mordaza Barrilito','Dientes de acero que retiran grapas sin desgarrar los documentos.',7,5,1,1,11,18,15,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(139,'7501056307119','BARR-PERF-2ORIF','Perforadora Metálica de 2 Orificios Barrilito','Distancia estándar 8cm con guía de centrado de papel y depósito de confeti.',7,5,1,1,42,68,60,3,10,3,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(140,'7501015004015','CARP-3ARG-1PULG','Carpeta Panorámica de 3 Argollas Carta 1 Pulg','Funda plástica transparente en portada y lomo para personalización.',7,11,1,1,35,56,49,3,15,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(141,'7501015004114','SEPA-CARP-5DIV','Separadores Plásticos para Carpeta 3 Argollas (5p)','Polipropileno indeformable con 5 pestañas de colores para materias.',7,11,3,1,14,24,20,3,25,6,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(142,'7501015004213','PROT-HOJA-100P','Protectores de Hojas Plásticos Carta (Paq 100 fundas)','Fundas cristalinas libres de ácido con perforación universal 3 y 11 hoyos.',7,11,3,1,48,78,68,3,20,5,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(143,'7501015005012','BIND-CLIP-19MM','Sujetadocumentos Binder Clip Negro 19mm (Caja 12p)','Pinzas metálicas de presión negras ancho 3/4 pulgada para 50 hojas.',7,11,2,1,12,20,17,3,30,8,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(144,'7501015005029','BIND-CLIP-32MM','Sujetadocumentos Binder Clip Negro 32mm (Caja 12p)','Pinzas binder de 1-1/4 pulgada para legajos de hasta 140 hojas.',7,11,2,1,22,36,31,3,25,6,100,'Pasillo Central',0,1,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(145,'7501015006019','ALMO-SELLO-NEGR','Almohadilla para Sellos de Goma Entintada Negra No. 1','Caja metálica con fieltro entintado de secado rápido tamaño 6x10cm.',7,11,1,1,18,30,26,3,20,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(146,'7501015006026','TINT-SELLO-30ML','Tinta para Almohadilla de Sellos 30ml Negra con Gotero','Frasco con dosificador para recargar cojines de sello.',7,11,1,1,14,24,20,3,22,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(147,'7501015007016','TABL-APOY-CARTA','Tabla de Apoyo con Clip Metálico Tamaño Carta MDF','Tabla rígida de madera comprimida con pinza de resorte para inventarios.',7,11,1,1,20,34,29,3,16,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(148,'7501015007023','BORR-PIZA-BLAN','Borrador para Pizarrón Blanco Magnético Ergonómico','Almohadilla de fieltro lavable con imán integrado que se adhiere al pizarrón.',7,9,1,1,16,28,24,3,18,5,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(149,'7501015007030','LIMP-PIZA-250ML','Líquido Limpiador para Pizarrón Blanco 250ml en Spray','Fórmula no tóxica que elimina residuos grasos y sombras secas de marcador.',7,9,1,1,24,40,35,3,15,4,100,'Pasillo Central',0,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(150,'7501099900010','SERV-COPIA-BN','Fotocopia Tamaño Carta B/N (Servicio)','Copia en tóner negro sobre papel bond de 75g (Art. con stock infinito).',8,1,1,1,0.2,1,0.8,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(151,'7501099900027','SERV-COPIA-COL','Fotocopia Tamaño Carta Color Láser (Servicio)','Impresión o fotocopia láser a color en alta resolución.',8,1,1,1,1.5,5,4,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(152,'7501099900034','SERV-COPIA-OFI','Fotocopia Tamaño Oficio B/N (Servicio)','Fotocopia en papel bond oficio para documentos legales.',8,1,1,1,0.35,1.5,1.2,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(153,'7501099900041','SERV-IMP-FOTO','Impresión Fotográfica Carta Papel Glossy Brillante','Impresión fotográfica calidad laboratorio en papel brillante 200g.',8,1,1,1,6.5,20,16,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(154,'7501099900058','SERV-ENMIC-CRED','Enmicado Térmico Tamaño Credencial / Gafete','Mica térmica rígida sellada al calor para tarjetas y credenciales.',8,5,1,1,2,8,6.5,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(155,'7501099900065','SERV-ENMIC-CTA','Enmicado Térmico Tamaño Carta 5 Milésimas','Mica térmica sellada para certificados, diplomas y listas.',8,5,1,1,4.5,15,12,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(156,'7501099900072','SERV-ENMIC-OFI','Enmicado Térmico Tamaño Oficio 5 Milésimas','Enmicado oficio para títulos y documentos notariales.',8,5,1,1,6,20,16.5,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(157,'7501099900089','SERV-ENGAR-ESP50','Engargolado Espiral Plástico 1-50 Hojas (Inc. Pastas)','Incluye portada transparente, contraportada negra y arillo plástico.',8,11,1,1,8,25,20,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(158,'7501099900096','SERV-ENGAR-MET80','Engargolado Arillo Metálico Wire-O 1-80 Hojas','Acabado ejecutivo metálico de doble anillo para tesis y manuales.',8,11,1,1,14,40,34,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(159,'7501099900102','SERV-ESCAN-DOC','Escaneo de Documento a USB o Correo en PDF','Digitalización óptica a 300 DPI guardada en formato PDF estándar.',8,1,1,1,0.5,3,2.5,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
INSERT INTO "productos" VALUES(160,'7501099900119','SERV-IMPR-PLANO','Impresión de Plano Arquitectónico 90x60cm B/N Bond','Plotter de inyección para planos técnicos de ingeniería y arquitectura.',8,1,1,1,12,35,28,3,9999,0,100,'Pasillo Central',1,0,1,'2026-10-20 19:59:23','2026-10-20 19:59:23');
CREATE TABLE proveedores (
        id_proveedor INTEGER PRIMARY KEY AUTOINCREMENT,
        razon_social VARCHAR(150) NOT NULL,
        rfc VARCHAR(13),
        contacto_nombre VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        activo BOOLEAN NOT NULL DEFAULT 1
    );
INSERT INTO "proveedores" VALUES(1,'Distribuidora Papelera del Bajío S.A.','PBA850101XYZ','Lic. Roberto Silva','442-987-6543','ventas@papelerabajio.com.mx','Av. 5 de Febrero #100, Querétaro',1);
INSERT INTO "proveedores" VALUES(2,'Mayoristas Escolares de México','MEM900215ABC','Ing. Carmen Ramos','555-432-1098','pedidos@escolaresmexico.com','Calzada Vallejo #450, CDMX',1);
INSERT INTO "proveedores" VALUES(3,'Scribe Directo Fábrica','SCR701130SC1','C.P. Mario Ortiz','442-555-8899','atencion@scribe.com.mx','Parque Industrial Bernardo Quintana, Qro',1);
CREATE TABLE roles (
        id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NOT NULL,
        permisos_json TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
INSERT INTO "roles" VALUES(1,'ADMINISTRADOR','Acceso total y configuración del sistema','{"all": true}','2026-10-20 19:59:23');
INSERT INTO "roles" VALUES(2,'CAJERO','Venta en mostrador y apertura/corte de turno','{"pos": true, "caja": true}','2026-10-20 19:59:23');
INSERT INTO "roles" VALUES(3,'ALMACENISTA','Control de stock, entradas y mermas','{"inventario": true, "kardex": true}','2026-10-20 19:59:23');
CREATE TABLE turnos_caja (
        id_turno INTEGER PRIMARY KEY AUTOINCREMENT,
        id_usuario INTEGER NOT NULL,
        fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fondo_inicial DECIMAL(10,2) NOT NULL DEFAULT 500.00,
        fecha_cierre DATETIME,
        total_ventas_efectivo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_ventas_tarjeta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_ventas_transferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_entradas_manuales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_salidas_manuales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    );
INSERT INTO "turnos_caja" VALUES(1,1,'2026-10-20 19:59:23',500,NULL,0,0,0,0,0,'ABIERTO');
CREATE TABLE unidades_medida (
        id_unidad INTEGER PRIMARY KEY AUTOINCREMENT,
        clave VARCHAR(10) NOT NULL UNIQUE,
        nombre VARCHAR(50) NOT NULL,
        permite_decimales BOOLEAN NOT NULL DEFAULT 0
    );
INSERT INTO "unidades_medida" VALUES(1,'PZA','Pieza',0);
INSERT INTO "unidades_medida" VALUES(2,'CAJA','Caja',0);
INSERT INTO "unidades_medida" VALUES(3,'PAQ','Paquete',0);
INSERT INTO "unidades_medida" VALUES(4,'CTO','Ciento',0);
INSERT INTO "unidades_medida" VALUES(5,'MTR','Metro',1);
CREATE TABLE usuarios (
        id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
        id_rol INTEGER NOT NULL,
        nombre_completo VARCHAR(120) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        pin_cajero VARCHAR(6),
        activo BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
    );
INSERT INTO "usuarios" VALUES(1,1,'Gerardo Cabrera Morales','gcabrera','hash_admin_abc_2026','1234',1,'2026-10-20 19:59:23');
INSERT INTO "usuarios" VALUES(2,2,'Astrid García Ramírez','agarcia','hash_cajero_abc_2026','4321',1,'2026-10-20 19:59:23');
INSERT INTO "usuarios" VALUES(3,3,'Daniel Parada Gonzalez','dparada','hash_almacen_abc_2026','5678',1,'2026-10-20 19:59:23');
CREATE TABLE ventas (
        id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
        folio_ticket VARCHAR(30) NOT NULL UNIQUE,
        fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        id_turno INTEGER NOT NULL DEFAULT 1,
        total_articulos INTEGER NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO',
        monto_recibido DECIMAL(10,2) NOT NULL,
        cambio DECIMAL(10,2) NOT NULL,
        cajero VARCHAR(100) DEFAULT 'Gerardo Cabrera Morales',
        estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA'
    );
CREATE INDEX idx_productos_cb ON productos(codigo_barras);
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_cat ON productos(id_categoria);
CREATE INDEX idx_productos_marca ON productos(id_marca);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('configuracion_negocio',1);
INSERT INTO "sqlite_sequence" VALUES('roles',3);
INSERT INTO "sqlite_sequence" VALUES('usuarios',3);
INSERT INTO "sqlite_sequence" VALUES('categorias',8);
INSERT INTO "sqlite_sequence" VALUES('marcas',12);
INSERT INTO "sqlite_sequence" VALUES('unidades_medida',5);
INSERT INTO "sqlite_sequence" VALUES('proveedores',3);
INSERT INTO "sqlite_sequence" VALUES('productos',160);
INSERT INTO "sqlite_sequence" VALUES('kardex_movimientos',160);
INSERT INTO "sqlite_sequence" VALUES('turnos_caja',1);
COMMIT;
