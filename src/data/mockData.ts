import {
  Client,
  InventoryLot,
  PurchaseOrder,
  Supplier,
  DTEInvoice,
  SalesRecord,
  SellerCommissionData,
  UserProfile
} from '../types';

export const SIMULATED_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Carlos Venegas',
    role: 'gerencia',
    title: 'Gerente Zonal de Operaciones',
    avatar: 'CV',
    location: 'Casa Matriz Temuco'
  },
  {
    id: 'u2',
    name: 'Juan Pablo Morales',
    role: 'vendedor',
    title: 'Ejecutivo de Ventas en Terreno',
    avatar: 'JM',
    location: 'Ruta Cautín Centro (Temuco / PLC)'
  },
  {
    id: 'u3',
    name: 'Rodrigo Nahuelpan',
    role: 'bodega',
    title: 'Jefe de Bodega y Logística',
    avatar: 'RN',
    location: 'Centro de Distribución Temuco Norte'
  },
  {
    id: 'u4',
    name: 'Patricia Albornoz',
    role: 'finanzas',
    title: 'Encargada de Finanzas y Crédito',
    avatar: 'PA',
    location: 'Administración Angol'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-001',
    rut: '76.842.190-4',
    razonSocial: 'Supermercados El Trébol Temuco SpA',
    giro: 'Supermercados y Venta al por Menor de Alimentos',
    direccionDespacho: 'Av. Alemania 01420',
    comuna: 'Temuco',
    zona: 'Temuco',
    vendedorAsignado: 'Juan Pablo Morales',
    contacto: {
      nombre: 'Rodrigo Fuentes Soto',
      cargo: 'Jefe de Adquisiciones',
      telefono: '+56 9 8451 2290',
      email: 'adquisiciones@eltreboltemuco.cl'
    },
    lineaCreditoCLP: 15000000,
    creditoUtilizadoCLP: 6420000,
    plazoPagoDias: 30,
    estadoCredito: 'Al día',
    fechaRegistro: '2023-04-12'
  },
  {
    id: 'cli-002',
    rut: '77.304.821-K',
    razonSocial: 'Minimarket Los Colonos Angol Limitada',
    giro: 'Almacenes y Abarrotes Regionales',
    direccionDespacho: 'Calle Bunster 450',
    comuna: 'Angol',
    zona: 'Angol',
    vendedorAsignado: 'Marcela Henríquez',
    contacto: {
      nombre: 'Clara Montecinos Valdés',
      cargo: 'Administradora General',
      telefono: '+56 9 9123 7741',
      email: 'contacto@loscolonosangol.cl'
    },
    lineaCreditoCLP: 4500000,
    creditoUtilizadoCLP: 3890000,
    plazoPagoDias: 15,
    estadoCredito: 'Observado',
    fechaRegistro: '2023-08-19'
  },
  {
    id: 'cli-003',
    rut: '78.112.940-2',
    razonSocial: 'Distribuidora y Almacenes Cautín SpA',
    giro: 'Distribución Mayorista de Confites y Abarrotes',
    direccionDespacho: 'Ruta 5 Sur Km 670, Parque Industrial',
    comuna: 'Padre Las Casas',
    zona: 'Cautín',
    vendedorAsignado: 'Carolina Sandoval',
    contacto: {
      nombre: 'Héctor Carrillo Parra',
      cargo: 'Gerente Comercial',
      telefono: '+56 9 7632 1109',
      email: 'hcarrillo@almacenescautin.cl'
    },
    lineaCreditoCLP: 22000000,
    creditoUtilizadoCLP: 8900000,
    plazoPagoDias: 45,
    estadoCredito: 'Al día',
    fechaRegistro: '2022-11-05'
  },
  {
    id: 'cli-004',
    rut: '76.519.830-7',
    razonSocial: 'Rotisería y Cecinas Nahuelbuta Ltda',
    giro: 'Fiambrería, Carnicería y Lácteos',
    direccionDespacho: 'Av. O\'Higgins 890',
    comuna: 'Angol',
    zona: 'Angol',
    vendedorAsignado: 'Marcela Henríquez',
    contacto: {
      nombre: 'Esteban Sepúlveda Lagos',
      cargo: 'Propietario',
      telefono: '+56 9 6554 9812',
      email: 'cecinasnahuelbuta@gmail.com'
    },
    lineaCreditoCLP: 3000000,
    creditoUtilizadoCLP: 2950000,
    plazoPagoDias: 15,
    estadoCredito: 'Bloqueado',
    fechaRegistro: '2024-01-14'
  },
  {
    id: 'cli-005',
    rut: '15.489.201-3',
    razonSocial: 'Comercializadora La Frontera (Don Aurelio)',
    giro: 'Comercio Minorista de Provisiones',
    direccionDespacho: 'Calle Huichahue 1120',
    comuna: 'Padre Las Casas',
    zona: 'Cautín',
    vendedorAsignado: 'Juan Pablo Morales',
    contacto: {
      nombre: 'Aurelio Painemal Coña',
      cargo: 'Dueño',
      telefono: '+56 9 9876 5432',
      email: 'aurelio.lafrontera@gmail.com'
    },
    lineaCreditoCLP: 2000000,
    creditoUtilizadoCLP: 450000,
    plazoPagoDias: 30,
    estadoCredito: 'Al día',
    fechaRegistro: '2024-03-02'
  },
  {
    id: 'cli-006',
    rut: '76.994.120-8',
    razonSocial: 'Comercial Villarrica Express SpA',
    giro: 'Minimarket y Estación de Servicio',
    direccionDespacho: 'Av. Pedro de Valdivia 1024',
    comuna: 'Villarrica',
    zona: 'Cautín',
    vendedorAsignado: 'Carolina Sandoval',
    contacto: {
      nombre: 'Matías Bórquez R.',
      cargo: 'Encargado de Compras',
      telefono: '+56 9 5431 8890',
      email: 'compras@villarricaexpress.cl'
    },
    lineaCreditoCLP: 8000000,
    creditoUtilizadoCLP: 3100000,
    plazoPagoDias: 30,
    estadoCredito: 'Al día',
    fechaRegistro: '2023-09-20'
  },
  {
    id: 'cli-007',
    rut: '14.238.940-6',
    razonSocial: 'Provisiones Los Notros de Victoria',
    giro: 'Abarrotes y Bebidas al por Mayor',
    direccionDespacho: 'Av. Confederación Suiza 610',
    comuna: 'Victoria',
    zona: 'Malleco',
    vendedorAsignado: 'Rodrigo Nahuelpan',
    contacto: {
      nombre: 'Rosa María Sanhueza',
      cargo: 'Administradora',
      telefono: '+56 9 4321 0098',
      email: 'losnotros.victoria@live.cl'
    },
    lineaCreditoCLP: 5000000,
    creditoUtilizadoCLP: 1800000,
    plazoPagoDias: 30,
    estadoCredito: 'Al día',
    fechaRegistro: '2023-12-01'
  }
];

export const INITIAL_INVENTORY: InventoryLot[] = [
  // Lácteos - Multiple lots to showcase FEFO!
  {
    id: 'lot-001',
    sku: 'LAC-COL-001',
    nombreProducto: 'Leche Entera Colún 1L (Caja x12)',
    categoria: 'Lácteos',
    unidadMedida: 'Caja x12',
    lote: 'L-2401',
    fechaVencimiento: '2026-10-29', // <15 days -> CRITICAL RED FEFO #1
    fechaIngreso: '2026-08-10',
    pasillo: 'Pasillo A',
    estante: 'Estante 01',
    nivel: 'Nivel 1 (Piso)',
    stockActual: 18,
    stockMinimo: 30,
    costoUnitarioCLP: 11200,
    precioVentaCLP: 14800
  },
  {
    id: 'lot-002',
    sku: 'LAC-COL-001',
    nombreProducto: 'Leche Entera Colún 1L (Caja x12)',
    categoria: 'Lácteos',
    unidadMedida: 'Caja x12',
    lote: 'L-2415',
    fechaVencimiento: '2026-12-15', // Normal > 30 days
    fechaIngreso: '2026-09-25',
    pasillo: 'Pasillo A',
    estante: 'Estante 01',
    nivel: 'Nivel 2',
    stockActual: 85,
    stockMinimo: 30,
    costoUnitarioCLP: 11200,
    precioVentaCLP: 14800
  },
  {
    id: 'lot-003',
    sku: 'LAC-LON-002',
    nombreProducto: 'Queso Chanco Loncoleche trozo 500g',
    categoria: 'Lácteos',
    unidadMedida: 'Unid',
    lote: 'Q-882',
    fechaVencimiento: '2026-11-12', // ~22 days -> YELLOW CRITICAL
    fechaIngreso: '2026-09-01',
    pasillo: 'Pasillo A',
    estante: 'Estante 03',
    nivel: 'Nivel 1 (Cámara Frío)',
    stockActual: 42,
    stockMinimo: 40,
    costoUnitarioCLP: 3450,
    precioVentaCLP: 4790
  },
  {
    id: 'lot-004',
    sku: 'LAC-LON-002',
    nombreProducto: 'Queso Chanco Loncoleche trozo 500g',
    categoria: 'Lácteos',
    unidadMedida: 'Unid',
    lote: 'Q-910',
    fechaVencimiento: '2027-02-28', // Plenty of time
    fechaIngreso: '2026-10-10',
    pasillo: 'Pasillo A',
    estante: 'Estante 03',
    nivel: 'Nivel 2 (Cámara Frío)',
    stockActual: 120,
    stockMinimo: 40,
    costoUnitarioCLP: 3450,
    precioVentaCLP: 4790
  },
  // Cecinas
  {
    id: 'lot-005',
    sku: 'CEC-LLA-001',
    nombreProducto: 'Vienesa Sureña Llanquihue 500g',
    categoria: 'Cecinas',
    unidadMedida: 'Pack x6',
    lote: 'V-102',
    fechaVencimiento: '2026-10-26', // in 5 days! CRITICAL RED
    fechaIngreso: '2026-09-18',
    pasillo: 'Pasillo B',
    estante: 'Estante 01',
    nivel: 'Nivel 1 (Refrigerado)',
    stockActual: 14,
    stockMinimo: 25,
    costoUnitarioCLP: 12500,
    precioVentaCLP: 16900
  },
  {
    id: 'lot-006',
    sku: 'CEC-AGR-002',
    nombreProducto: 'Jamón Colonial Pierna Agrosuper 1Kg',
    categoria: 'Cecinas',
    unidadMedida: 'Kg',
    lote: 'JC-441',
    fechaVencimiento: '2026-11-08', // in 18 days -> YELLOW
    fechaIngreso: '2026-09-20',
    pasillo: 'Pasillo B',
    estante: 'Estante 02',
    nivel: 'Nivel 1 (Refrigerado)',
    stockActual: 28,
    stockMinimo: 20,
    costoUnitarioCLP: 7200,
    precioVentaCLP: 9800
  },
  // Quiebre de stock total
  {
    id: 'lot-007',
    sku: 'ABA-SEL-001',
    nombreProducto: 'Harina Selecta Especial Sin Polvos 1Kg',
    categoria: 'Abarrotes',
    unidadMedida: 'Caja x12',
    lote: 'H-901',
    fechaVencimiento: '2027-04-30',
    fechaIngreso: '2026-08-15',
    pasillo: 'Pasillo C',
    estante: 'Estante 04',
    nivel: 'Nivel 1 (Piso)',
    stockActual: 0, // QUIEBRE TOTAL! RED
    stockMinimo: 50,
    costoUnitarioCLP: 10400,
    precioVentaCLP: 13900
  },
  // Bebidas
  {
    id: 'lot-008',
    sku: 'BEB-CCU-001',
    nombreProducto: 'Bebida Bilz 1.5L Retornable',
    categoria: 'Bebidas',
    unidadMedida: 'Pack x6',
    lote: 'B-771',
    fechaVencimiento: '2027-05-15',
    fechaIngreso: '2026-10-02',
    pasillo: 'Pasillo D',
    estante: 'Estante 01',
    nivel: 'Nivel 1',
    stockActual: 140,
    stockMinimo: 40,
    costoUnitarioCLP: 6100,
    precioVentaCLP: 8400
  },
  {
    id: 'lot-009',
    sku: 'BEB-CCU-002',
    nombreProducto: 'Cerveza Cristal 350cc Lata (Pack x24)',
    categoria: 'Bebidas',
    unidadMedida: 'Caja x24',
    lote: 'CR-303',
    fechaVencimiento: '2027-08-20',
    fechaIngreso: '2026-10-05',
    pasillo: 'Pasillo D',
    estante: 'Estante 02',
    nivel: 'Nivel 2',
    stockActual: 76,
    stockMinimo: 30,
    costoUnitarioCLP: 14200,
    precioVentaCLP: 19500
  },
  // Abarrotes
  {
    id: 'lot-010',
    sku: 'ABA-TUC-002',
    nombreProducto: 'Arroz Grado 1 Tucapel Selección 1Kg',
    categoria: 'Abarrotes',
    unidadMedida: 'Caja x10',
    lote: 'ARR-401',
    fechaVencimiento: '2027-11-30',
    fechaIngreso: '2026-09-12',
    pasillo: 'Pasillo C',
    estante: 'Estante 02',
    nivel: 'Nivel 3',
    stockActual: 92,
    stockMinimo: 35,
    costoUnitarioCLP: 11800,
    precioVentaCLP: 15400
  },
  {
    id: 'lot-011',
    sku: 'ABA-ACE-003',
    nombreProducto: 'Aceite Maravilla Belmont 900ml',
    categoria: 'Abarrotes',
    unidadMedida: 'Caja x12',
    lote: 'AC-109',
    fechaVencimiento: '2027-09-15',
    fechaIngreso: '2026-10-01',
    pasillo: 'Pasillo C',
    estante: 'Estante 01',
    nivel: 'Nivel 2',
    stockActual: 64,
    stockMinimo: 25,
    costoUnitarioCLP: 19200,
    precioVentaCLP: 24900
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    rut: '76.220.300-K',
    razonSocial: 'Watt\'s Alimentos S.A.',
    rubro: 'Lácteos',
    contactoNombre: 'Bernardo Osses M.',
    telefono: '+56 2 2441 8000',
    email: 'contacto.ventas@watts.cl',
    direccion: 'Av. Presidente Riesco 5711, Piso 8',
    comuna: 'Las Condes, Santiago (Despacho a Temuco)',
    plazoPago: '30 días',
    descuentosVolumen: [
      { rango: '10 a 49 cajas', porcentaje: 3 },
      { rango: '50 a 199 cajas', porcentaje: 7 },
      { rango: '>= 200 cajas', porcentaje: 12 }
    ],
    tiemposEntrega: {
      diasTemuco: 2,
      diasAngol: 3
    },
    calificacionEntrega: 4.8
  },
  {
    id: 'sup-002',
    rut: '96.509.000-5',
    razonSocial: 'Agrosuper Comercial SpA',
    rubro: 'Cecinas y Carnes',
    contactoNombre: 'Valeria Moncada V.',
    telefono: '+56 72 260 5000',
    email: 'atenciondistribucion@agrosuper.com',
    direccion: 'Camino La Estrella 401',
    comuna: 'Rancagua (Centro Regional Temuco)',
    plazoPago: '30 días',
    descuentosVolumen: [
      { rango: '100 a 499 Kg', porcentaje: 5 },
      { rango: '>= 500 Kg', porcentaje: 10 }
    ],
    tiemposEntrega: {
      diasTemuco: 1,
      diasAngol: 2
    },
    calificacionEntrega: 4.9
  },
  {
    id: 'sup-003',
    rut: '91.543.000-2',
    razonSocial: 'CCU Distribución Chile S.A.',
    rubro: 'Bebidas y Licores',
    contactoNombre: 'Ignacio Valenzuela C.',
    telefono: '+56 45 220 7800',
    email: 'pedidos.araucania@ccu.cl',
    direccion: 'Ruta 5 Sur Km 675',
    comuna: 'Temuco',
    plazoPago: '60 días',
    descuentosVolumen: [
      { rango: '50 a 99 packs', porcentaje: 4 },
      { rango: '>= 100 packs', porcentaje: 9 }
    ],
    tiemposEntrega: {
      diasTemuco: 1,
      diasAngol: 1
    },
    calificacionEntrega: 4.7
  },
  {
    id: 'sup-004',
    rut: '76.452.190-3',
    razonSocial: 'Molino Luchsinger y Cía Ltda',
    rubro: 'Abarrotes y Harinas',
    contactoNombre: 'Kurt Luchsinger H.',
    telefono: '+56 45 233 4400',
    email: 'ventas@molinoluchsinger.cl',
    direccion: 'Calle General Mackenna 980',
    comuna: 'Temuco',
    plazoPago: 'Contado',
    descuentosVolumen: [
      { rango: '20 a 50 quintales', porcentaje: 6 },
      { rango: '> 50 quintales', porcentaje: 11 }
    ],
    tiemposEntrega: {
      diasTemuco: 1,
      diasAngol: 2
    },
    calificacionEntrega: 4.6
  },
  {
    id: 'sup-005',
    rut: '77.890.120-1',
    razonSocial: 'Empresas Carozzi S.A.',
    rubro: 'Abarrotes y Harinas',
    contactoNombre: 'Camila Pardo G.',
    telefono: '+56 2 2377 6400',
    email: 'ventas.sur@carozzi.cl',
    direccion: 'Longitudinal Sur Km 23',
    comuna: 'Nos, San Bernardo (Bodega Temuco)',
    plazoPago: '60 días',
    descuentosVolumen: [
      { rango: '50 a 149 bultos', porcentaje: 5 },
      { rango: '>= 150 bultos', porcentaje: 8.5 }
    ],
    tiemposEntrega: {
      diasTemuco: 2,
      diasAngol: 3
    },
    calificacionEntrega: 4.5
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'oc-001',
    numeroOC: 'OC-2024-0089',
    proveedorId: 'sup-001',
    proveedorNombre: 'Watt\'s Alimentos S.A.',
    proveedorRUT: '76.220.300-K',
    fechaEmision: '2026-10-18',
    fechaEsperadaEntrega: '2026-10-22',
    sucursalDestino: 'Bodega Central Temuco',
    estado: 'Pendiente Recepción',
    items: [
      {
        sku: 'LAC-LON-002',
        nombreProducto: 'Queso Chanco Loncoleche trozo 500g',
        cantidadPedida: 60,
        cantidadRecibida: 0,
        precioUnitarioCLP: 3450,
        estadoItem: 'Pendiente'
      },
      {
        sku: 'LAC-COL-001',
        nombreProducto: 'Leche Entera Colún 1L (Caja x12)',
        cantidadPedida: 80,
        cantidadRecibida: 0,
        precioUnitarioCLP: 11200,
        estadoItem: 'Pendiente'
      }
    ],
    observaciones: 'Despacho con camión refrigerado temperatura entre 2°C y 5°C. Entrega en andén 2.'
  },
  {
    id: 'oc-002',
    numeroOC: 'OC-2024-0090',
    proveedorId: 'sup-002',
    proveedorNombre: 'Agrosuper Comercial SpA',
    proveedorRUT: '96.509.000-5',
    fechaEmision: '2026-10-19',
    fechaEsperadaEntrega: '2026-10-21',
    sucursalDestino: 'Bodega Central Temuco',
    estado: 'Pendiente Recepción',
    items: [
      {
        sku: 'CEC-AGR-002',
        nombreProducto: 'Jamón Colonial Pierna Agrosuper 1Kg',
        cantidadPedida: 50,
        cantidadRecibida: 0,
        precioUnitarioCLP: 7200,
        estadoItem: 'Pendiente'
      },
      {
        sku: 'CEC-LLA-001',
        nombreProducto: 'Vienesa Sureña Llanquihue 500g',
        cantidadPedida: 40,
        cantidadRecibida: 0,
        precioUnitarioCLP: 12500,
        estadoItem: 'Pendiente'
      }
    ],
    observaciones: 'Prioridad alta para reposición por rotación en ruta Angol.'
  },
  {
    id: 'oc-003',
    numeroOC: 'OC-2024-0085',
    proveedorId: 'sup-004',
    proveedorNombre: 'Molino Luchsinger y Cía Ltda',
    proveedorRUT: '76.452.190-3',
    fechaEmision: '2026-10-15',
    fechaEsperadaEntrega: '2026-10-17',
    sucursalDestino: 'Bodega Zonal Angol',
    estado: 'Recepcionado con Discrepancia',
    items: [
      {
        sku: 'ABA-SEL-001',
        nombreProducto: 'Harina Selecta Especial Sin Polvos 1Kg',
        cantidadPedida: 100,
        cantidadRecibida: 92,
        loteIngresado: 'H-902',
        fechaVencimientoIngresada: '2027-05-10',
        precioUnitarioCLP: 10400,
        diferencia: -8,
        estadoItem: 'Faltante'
      }
    ],
    observaciones: 'Faltaron 8 cajas por rotura en pallet de carga durante el traslado desde Temuco.',
    fechaRecepcionReal: '2026-10-18',
    recibidoPor: 'Rodrigo Nahuelpan'
  }
];

export const INITIAL_DTE_INVOICES: DTEInvoice[] = [
  {
    id: 'dte-001',
    folio: 38402,
    tipoDTE: '33',
    tipoNombre: 'Factura Electrónica',
    fechaEmision: '2026-10-20',
    clienteId: 'cli-001',
    clienteNombre: 'Supermercados El Trébol Temuco SpA',
    clienteRUT: '76.842.190-4',
    clienteGiro: 'Supermercados y Venta al por Menor de Alimentos',
    clienteDireccion: 'Av. Alemania 01420',
    clienteComuna: 'Temuco',
    vendedor: 'Juan Pablo Morales',
    items: [
      {
        sku: 'LAC-COL-001',
        descripcion: 'Leche Entera Colún 1L (Caja x12) - Lote L-2415',
        cantidad: 30,
        precioUnitarioCLP: 14800,
        subtotalCLP: 444000
      },
      {
        sku: 'CEC-LLA-001',
        descripcion: 'Vienesa Sureña Llanquihue 500g (Pack x6) - Lote V-102',
        cantidad: 20,
        precioUnitarioCLP: 16900,
        subtotalCLP: 338000
      }
    ],
    montoNetoCLP: 782000,
    montoIVACLP: 148580,
    montoTotalCLP: 930580,
    estadoSII: 'TIMBRE_ELECTRONICO_OK',
    trackIdSII: 'TRK-20261020-99412',
    codigoCAF: 'CAF-SII-DTE33-2026-N49102',
    tedFirmaResumen: 'TED-SHA256:d8b2fa31c0e9..OK',
    condicionPago: 'Crédito 30 días'
  },
  {
    id: 'dte-002',
    folio: 1409,
    tipoDTE: '52',
    tipoNombre: 'Guía de Despacho',
    fechaEmision: '2026-10-21',
    clienteId: 'cli-002',
    clienteNombre: 'Minimarket Los Colonos Angol Limitada',
    clienteRUT: '77.304.821-K',
    clienteGiro: 'Almacenes y Abarrotes Regionales',
    clienteDireccion: 'Calle Bunster 450',
    clienteComuna: 'Angol',
    vendedor: 'Marcela Henríquez',
    items: [
      {
        sku: 'BEB-CCU-001',
        descripcion: 'Bebida Bilz 1.5L Retornable (Pack x6)',
        cantidad: 25,
        precioUnitarioCLP: 8400,
        subtotalCLP: 210000
      },
      {
        sku: 'ABA-ACE-003',
        descripcion: 'Aceite Maravilla Belmont 900ml (Caja x12)',
        cantidad: 15,
        precioUnitarioCLP: 24900,
        subtotalCLP: 373500
      }
    ],
    montoNetoCLP: 583500,
    montoIVACLP: 110865,
    montoTotalCLP: 694365,
    estadoSII: 'TIMBRE_ELECTRONICO_OK',
    trackIdSII: 'TRK-20261021-01084',
    codigoCAF: 'CAF-SII-DTE52-2026-N11200',
    tedFirmaResumen: 'TED-SHA256:a1f948c39..OK',
    condicionPago: 'Traslado por venta (facturación posterior)'
  }
];

export const INITIAL_SALES_RECORDS: SalesRecord[] = [
  {
    id: 's-01',
    fecha: '2026-10-20',
    folioDTE: 38402,
    clienteNombre: 'Supermercados El Trébol Temuco SpA',
    clienteRUT: '76.842.190-4',
    zona: 'Temuco',
    vendedor: 'Juan Pablo Morales',
    productoSKU: 'LAC-COL-001',
    productoNombre: 'Leche Entera Colún 1L (Caja x12)',
    categoria: 'Lácteos',
    cantidad: 30,
    montoTotalCLP: 444000,
    costoTotalCLP: 336000,
    margenCLP: 108000
  },
  {
    id: 's-02',
    fecha: '2026-10-20',
    folioDTE: 38402,
    clienteNombre: 'Supermercados El Trébol Temuco SpA',
    clienteRUT: '76.842.190-4',
    zona: 'Temuco',
    vendedor: 'Juan Pablo Morales',
    productoSKU: 'CEC-LLA-001',
    productoNombre: 'Vienesa Sureña Llanquihue 500g (Pack x6)',
    categoria: 'Cecinas',
    cantidad: 20,
    montoTotalCLP: 338000,
    costoTotalCLP: 250000,
    margenCLP: 88000
  },
  {
    id: 's-03',
    fecha: '2026-10-19',
    folioDTE: 38399,
    clienteNombre: 'Distribuidora y Almacenes Cautín SpA',
    clienteRUT: '78.112.940-2',
    zona: 'Cautín',
    vendedor: 'Carolina Sandoval',
    productoSKU: 'BEB-CCU-002',
    productoNombre: 'Cerveza Cristal 350cc Lata (Caja x24)',
    categoria: 'Bebidas',
    cantidad: 40,
    montoTotalCLP: 780000,
    costoTotalCLP: 568000,
    margenCLP: 212000
  },
  {
    id: 's-04',
    fecha: '2026-10-18',
    folioDTE: 38390,
    clienteNombre: 'Minimarket Los Colonos Angol Limitada',
    clienteRUT: '77.304.821-K',
    zona: 'Angol',
    vendedor: 'Marcela Henríquez',
    productoSKU: 'LAC-LON-002',
    productoNombre: 'Queso Chanco Loncoleche trozo 500g',
    categoria: 'Lácteos',
    cantidad: 50,
    montoTotalCLP: 239500,
    costoTotalCLP: 172500,
    margenCLP: 67000
  },
  {
    id: 's-05',
    fecha: '2026-10-17',
    folioDTE: 38382,
    clienteNombre: 'Provisiones Los Notros de Victoria',
    clienteRUT: '14.238.940-6',
    zona: 'Malleco',
    vendedor: 'Rodrigo Nahuelpan',
    productoSKU: 'ABA-ACE-003',
    productoNombre: 'Aceite Maravilla Belmont 900ml (Caja x12)',
    categoria: 'Abarrotes',
    cantidad: 20,
    montoTotalCLP: 498000,
    costoTotalCLP: 384000,
    margenCLP: 114000
  },
  {
    id: 's-06',
    fecha: '2026-10-16',
    folioDTE: 38375,
    clienteNombre: 'Comercial Villarrica Express SpA',
    clienteRUT: '76.994.120-8',
    zona: 'Cautín',
    vendedor: 'Carolina Sandoval',
    productoSKU: 'ABA-TUC-002',
    productoNombre: 'Arroz Grado 1 Tucapel Selección 1Kg',
    categoria: 'Abarrotes',
    cantidad: 35,
    montoTotalCLP: 539000,
    costoTotalCLP: 413000,
    margenCLP: 126000
  }
];

export const INITIAL_SELLER_COMMISSIONS: SellerCommissionData[] = [
  {
    vendedorId: 'v-01',
    vendedorNombre: 'Juan Pablo Morales',
    zona: 'Temuco',
    metaVentasCLP: 22000000,
    ventasRealesCLP: 24500000, // 111.4%
    porcentajeCumplimientoVentas: 111.4,
    metaCobranzaCLP: 20000000,
    cobranzaRecaudadaCLP: 19400000, // 97.0%
    porcentajeCobranza: 97.0,
    tasaComisionBase: 3.5, // Tramo 100-119%
    factorCastigoPremioCobranza: 1.15, // >95% premio
    tasaFinalAplicada: 4.025,
    comisionTotalCLP: 986125,
    estadoLiquidacion: 'Pendiente'
  },
  {
    vendedorId: 'v-02',
    vendedorNombre: 'Carolina Sandoval',
    zona: 'Cautín',
    metaVentasCLP: 20000000,
    ventasRealesCLP: 20800000, // 104.0%
    porcentajeCumplimientoVentas: 104.0,
    metaCobranzaCLP: 18500000,
    cobranzaRecaudadaCLP: 17205000, // 93.0%
    porcentajeCobranza: 93.0,
    tasaComisionBase: 3.5, // Tramo 100-119%
    factorCastigoPremioCobranza: 1.0, // 85-95% neutral
    tasaFinalAplicada: 3.5,
    comisionTotalCLP: 728000,
    estadoLiquidacion: 'Aprobada'
  },
  {
    vendedorId: 'v-03',
    vendedorNombre: 'Marcela Henríquez',
    zona: 'Angol',
    metaVentasCLP: 16000000,
    ventasRealesCLP: 14200000, // 88.75%
    porcentajeCumplimientoVentas: 88.8,
    metaCobranzaCLP: 14000000,
    cobranzaRecaudadaCLP: 10500000, // 75.0% -> Castigo
    porcentajeCobranza: 75.0,
    tasaComisionBase: 2.0, // Tramo 80-99%
    factorCastigoPremioCobranza: 0.75, // <80% castigo
    tasaFinalAplicada: 1.5,
    comisionTotalCLP: 213000,
    estadoLiquidacion: 'Pendiente'
  },
  {
    vendedorId: 'v-04',
    vendedorNombre: 'Rodrigo Nahuelpan',
    zona: 'Malleco',
    metaVentasCLP: 18000000,
    ventasRealesCLP: 22100000, // 122.7%
    porcentajeCumplimientoVentas: 122.7,
    metaCobranzaCLP: 16000000,
    cobranzaRecaudadaCLP: 15680000, // 98.0%
    porcentajeCobranza: 98.0,
    tasaComisionBase: 4.5, // Super meta >=120%
    factorCastigoPremioCobranza: 1.15, // >95% premio
    tasaFinalAplicada: 5.175,
    comisionTotalCLP: 1143675,
    estadoLiquidacion: 'Pendiente'
  }
];
