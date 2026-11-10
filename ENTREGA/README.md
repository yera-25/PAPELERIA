# PAPELERIA A B C - SISTEMA DE ADMINISTRACION Y PUNTO DE VENTA (POS)
## ENTREGABLE OFICIAL DE LA FASE 9: EVALUACION FINAL Y EXPOSICION (CIERRE TOTAL DEL PROYECTO)

### Informacion General del Proyecto
* **Establecimiento:** Papeleria A B C
* **Fase Contractual:** Fase 9 (Semana 9: 23 de Noviembre al 04 de Diciembre de 2026)
* **Hito Contractual Final:** **Presentacion de Diapositivas + Codigo Fuente Certificado + Cierre del Proyecto**
* **Inversion Global Consolidada:** **$197,000.00 MXN devengados al 100.0%** (Cumplimiento presupuestal total sin sobrecostos).
* **Equipo de Desarrollo:**
  * **Gerardo Cabrera Morales** (Lider Tecnico & Desarrollador Fullstack)
  * **Astrid Garcia Ramirez** (Analista de Datos, DBA & QA Lead)
  * **Daniel Parada Gonzalez** (Arquitecto de Persistencia, Seguridad & UI/UX)
* **Estado Tecnico de Calidad:**
  * **Tasa de Aprobacion de Requerimientos:** 100.0% (RF-01 a RF-10 y RNF-01 a RNF-08 verificados en produccion).
  * **Pruebas QA:** 20 / 20 Casos de Prueba Aprobados (100% PASS).
  * **Politica de Cero Emojis:** 100% libre de emojis en codigo fuente, base de datos, interfaz y documentacion.
  * **Latencia Transaccional:** 1.35 ms promedio (meta contractual: < 5.0 ms).
  * **Autonomia:** 100% Offline-First sin dependencias en la nube ni pagos recurrentes.

---

### Entregables Oficiales de la Fase 9

1. **Diapositivas Oficiales para Defensa del Proyecto (Presentacion Final):**
   * [PRESENTACION_DEFENSA_PROYECTO_FINAL.pdf](PRESENTACION_DEFENSA_PROYECTO_FINAL.pdf) (12 diapositivas ejecutivas en formato horizontal 16:9).
   * [PRESENTACION_DEFENSA_PROYECTO_FINAL.md](PRESENTACION_DEFENSA_PROYECTO_FINAL.md) (Guion tecnico y contenido de apoyo).
2. **Documento Maestro de la Fase 9 (Evaluacion Final y Cierre):**
   * [DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.pdf](DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.pdf) (Reporte formal de 4 paginas con informe financiero, rubrica de cumplimiento y firmas).
   * [DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.md](DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.md) (Texto integro en Markdown).
3. **Plan de Capacitacion y Transferencia Tecnologica:**
   * [PLAN_DE_CAPACITACION_Y_TRANSFERENCIA_TECNOLOGICA.md](PLAN_DE_CAPACITACION_Y_TRANSFERENCIA_TECNOLOGICA.md) (14 horas de capacitacion segmentadas por perfil: Cajeros, Supervisores y Administradores).
4. **Acta Formal de Entrega - Recepcion a Conformidad:**
   * [ACTA_DE_ENTREGA_RECEPCION_FINAL.md](ACTA_DE_ENTREGA_RECEPCION_FINAL.md) (Certificacion formal de aceptacion operativa y garantia tecnica de 60 dias).
5. **Manuales de Operacion y Despliegue Actualizados:**
   * [Manual de Usuario (8 Paginas)](MANUAL_DE_USUARIO.pdf) | [MANUAL_DE_USUARIO.md](MANUAL_DE_USUARIO.md)
   * [Manual de Instalacion (5 Paginas)](MANUAL_DE_INSTALACION.pdf) | [MANUAL_DE_INSTALACION.md](MANUAL_DE_INSTALACION.md)
6. **Credenciales Maestras Iniciales:**
   * Archivo [CLAVES](CLAVES) en la raiz del proyecto con cuentas preconfiguradas seguras (`admin`, `supervisor`, `usuario`).

---

### Funcionalidades y Modificaciones Consolidadas

* **Punto de Venta POS:** Escaneo de codigo de barras USB, atajos universales `F1-F4`, multicarrito simultaneo (5 carritos), descuentos comerciales, cobro en efectivo con denominaciones y tickets termicos oficiales con logotipo corporativo `LOGO.jpg`.
* **Almacen e Inventarios:** Catalogo muestra realista de 160 articulos clasificados en 8 familias y 10 marcas, stock minimo con alertas visuales en rojo, bitacora Kardex y calculo automatico de precios menudeo y mayoreo.
* **Control de Caja y Turnos:** Apertura con fondo inicial, movimientos manuales de caja, arqueo ciego diario y ejecucion de **Corte Z** con firma electronica.
* **Modulo de Devoluciones y Cambios de Mercancia:** Soporte para devoluciones con reintegro de efectivo (**Reembolso**) y cambios por otros articulos con calculo de diferencias (**Canje**), afectacion automatica al Kardex (`ENTRADA_DEVOLUCION` / `SALIDA_CAMBIO`), emision de **Vales Termicos Oficiales**, tabla de auditoria inmutable y exportacion a formato plano CSV. Funcionalidad exclusiva para roles **Supervisor** y **Administrador**.
* **Reportes y Analitica Financiera:** Dashboard ejecutivo con scroll vertical responsivo independiente (`reports-workspace-container`), visualizacion integral de metricas clave, Top 15 productos mas vendidos, balance diario y exportacion a CSV con UTF-8 BOM.
* **Seguridad y Blindaje RBAC:** Supresion de botones rapidos en login, salting criptografico individual de 16 bytes y hash SHA-256 (Web Crypto API), delimitacion estricta de modulos por rol, y **autorizacion obligatoria de Administrador** para la descarga de la base de datos relacional SQLite (`papeleria_pos.db`).
* **Centro de Documentacion:** Seccion interactiva en la app con 10 pasos ilustrados y esquema DDL de 11 tablas relacionales en 3FN.

---

### Estructura del Codigo Fuente Entregado (`09/` y `ENTREGA/`)

```
ENTREGA/  (y  09/)
├── index.html                                        # Aplicacion SPA con 10 secciones y Centro de Ayuda
├── CLAVES                                            # Credenciales maestras iniciales por defecto
├── CLAVES.txt                                        # Copia en texto plano de credenciales
├── LOGO.jpg                                          # Logotipo oficial de Papeleria A B C
├── papeleria_pos.db                                  # Base de datos relacional SQLite 3 (160 articulos en 3FN)
├── css/
│   └── styles.css                                    # Estilos responsivos, soporte termico y scroll de reportes
├── js/
│   ├── db.js                                         # Motor SQLite WASM, Kardex y devoluciones/cambios
│   ├── auth.js                                       # Criptografia SHA-256 + salt y autorizacion RBAC
│   ├── pos.js                                        # Carrito multicliente, scanner USB y tickets
│   ├── cash.js                                       # Turnos de caja, arqueo Corte Z y modulo de devoluciones
│   ├── inventory.js                                  # Catalogo maestro, existencias y alertas de stock
│   ├── reports.js                                    # Analitica comercial, KPIs y exportacion CSV
│   ├── catalog_masters.js                            # Familias de categorias, marcas y unidades
│   ├── stock_movements.js                            # Entradas, salidas y mermas de almacen
│   ├── import_export.js                              # Respaldos snapshot JSON en 1 clic y restauracion
│   ├── documentation.js                              # Centro de manuales con autorizacion admin de BD
│   └── app.js                                        # Enrutador principal y atajos de teclado F1-F4
├── DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.pdf # Reporte oficial de evaluacion y cierre de Fase 9
├── DOCUMENTO_FASE_9_EVALUACION_FINAL_Y_EXPOSICION.md  # Documento maestro de Fase 9 en Markdown
├── PRESENTACION_DEFENSA_PROYECTO_FINAL.pdf            # Diapositivas oficiales para la defensa (12 diaps)
├── PRESENTACION_DEFENSA_PROYECTO_FINAL.md             # Guion tecnico de exposicion
├── PLAN_DE_CAPACITACION_Y_TRANSFERENCIA_TECNOLOGICA.md# Programa de capacitacion para personal (14 hrs)
├── ACTA_DE_ENTREGA_RECEPCION_FINAL.md                 # Acta legal de entrega y aceptacion a conformidad
├── MANUAL_DE_USUARIO.pdf                             # Manual de usuario operativo final (8 paginas)
├── MANUAL_DE_USUARIO.md                              # Manual de usuario en Markdown
├── MANUAL_DE_INSTALACION.pdf                         # Manual tecnico de instalacion y perifericos (5 pags)
└── MANUAL_DE_INSTALACION.md                          # Manual de instalacion en Markdown
```

---

### Instrucciones de Ejecucion y Acceso al Sistema

1. **Arranque Inmediato:**
   - Puede abrir directamente `index.html` en Microsoft Edge o Google Chrome (doble clic).
   - O iniciar el servidor web HTTP local en la terminal de PowerShell:
     ```powershell
     cd C:\Users\gerac\Desktop\ISA\ENTREGA
     python -m http.server 8000
     ```
     e ingresar a `http://localhost:8000`.
2. **Autenticacion Inicial:**
   - Ingrese su usuario y contrasena consultando el archivo `CLAVES` en la raiz del proyecto:
     - `admin` / `admin123` (Rol ADMINISTRADOR)
     - `supervisor` / `super123` (Rol SUPERVISOR)
     - `usuario` / `usuario123` (Rol USUARIO / CAJERO)
3. **Puesta en Marcha:**
   - Modifique las contrasenas maestras en la pestana **Perfiles y Contrasenas** al ingresar por primera vez.
   - En **Control de Caja**, aperture el turno con el fondo de morralla.
   - En **Punto de Venta POS**, conecte su lector USB y comience la atencion en mostrador.
   - Presione `F1` en cualquier momento para acceder a la documentacion interactiva y manuales en PDF.
