export type UserRole = 'vendedor' | 'bodega' | 'finanzas' | 'gerencia';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  location: string;
}

export type ChileanZone = 'Temuco' | 'Angol' | 'Cautín' | 'Malleco';

export interface ClientContact {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}

export interface Client {
  id: string;
  rut: string;
  razonSocial: string;
  giro: string;
  direccionDespacho: string;
  comuna: string;
  zona: ChileanZone;
  vendedorAsignado: string;
  contacto: ClientContact;
  lineaCreditoCLP: number;
  creditoUtilizadoCLP: number;
  plazoPagoDias: number; // e.g. 15, 30, 45, 60
  estadoCredito: 'Al día' | 'Observado' | 'Bloqueado';
  fechaRegistro: string;
}

export interface InventoryLot {
  id: string;
  sku: string;
  nombreProducto: string;
  categoria: 'Lácteos' | 'Cecinas' | 'Bebidas' | 'Abarrotes' | 'Congelados' | 'Limpieza';
  unidadMedida: 'Unid' | 'Kg' | 'Caja x10' | 'Caja x12' | 'Caja x24' | 'Pack x6';
  lote: string;
  fechaVencimiento: string; // YYYY-MM-DD
  fechaIngreso: string;
  pasillo: string; // ej. Pasillo A
  estante: string; // ej. Estante 2
  nivel: string;   // ej. Nivel 3
  stockActual: number;
  stockMinimo: number;
  costoUnitarioCLP: number;
  precioVentaCLP: number;
  esPrioridadFEFO?: boolean;
}

export interface OCItem {
  sku: string;
  nombreProducto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  loteIngresado?: string;
  fechaVencimientoIngresada?: string;
  precioUnitarioCLP: number;
  diferencia?: number; // cantidadRecibida - cantidadPedida
  estadoItem: 'Pendiente' | 'Conforme' | 'Faltante' | 'Excedente' | 'Merma';
}

export interface PurchaseOrder {
  id: string;
  numeroOC: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorRUT: string;
  fechaEmision: string;
  fechaEsperadaEntrega: string;
  sucursalDestino: 'Bodega Central Temuco' | 'Bodega Zonal Angol';
  estado: 'Pendiente Recepción' | 'Recepcionado Parcial' | 'Recepcionado Conforme' | 'Recepcionado con Discrepancia';
  items: OCItem[];
  observaciones?: string;
  fechaRecepcionReal?: string;
  recibidoPor?: string;
}

export type DTEType = '33' | '52' | '61';

export interface DTEItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioCLP: number;
  subtotalCLP: number;
}

export interface DTEInvoice {
  id: string;
  folio: number;
  tipoDTE: DTEType;
  tipoNombre: 'Factura Electrónica' | 'Guía de Despacho' | 'Nota de Crédito';
  fechaEmision: string;
  clienteId: string;
  clienteNombre: string;
  clienteRUT: string;
  clienteGiro: string;
  clienteDireccion: string;
  clienteComuna: string;
  vendedor: string;
  items: DTEItem[];
  montoNetoCLP: number;
  montoIVACLP: number; // 19%
  montoTotalCLP: number;
  estadoSII: 'TIMBRE_ELECTRONICO_OK' | 'EN_PROCESO_SII' | 'RECHAZADO_SII';
  trackIdSII: string;
  codigoCAF: string;
  tedFirmaResumen: string;
  condicionPago: string;
}

export interface VolumeDiscount {
  rango: string;
  porcentaje: number;
}

export interface DeliveryLeadTime {
  diasTemuco: number;
  diasAngol: number;
}

export interface Supplier {
  id: string;
  rut: string;
  razonSocial: string;
  rubro: 'Lácteos' | 'Cecinas y Carnes' | 'Bebidas y Licores' | 'Abarrotes y Harinas' | 'Congelados' | 'Higiene';
  contactoNombre: string;
  telefono: string;
  email: string;
  direccion: string;
  comuna: string;
  plazoPago: 'Contado' | '30 días' | '60 días' | '90 días';
  descuentosVolumen: VolumeDiscount[];
  tiemposEntrega: DeliveryLeadTime;
  calificacionEntrega: number; // 1 to 5
}

export interface SalesRecord {
  id: string;
  fecha: string;
  folioDTE: number;
  clienteNombre: string;
  clienteRUT: string;
  zona: ChileanZone;
  vendedor: string;
  productoSKU: string;
  productoNombre: string;
  categoria: string;
  cantidad: number;
  montoTotalCLP: number;
  costoTotalCLP: number;
  margenCLP: number;
}

export interface SellerCommissionData {
  vendedorId: string;
  vendedorNombre: string;
  zona: ChileanZone;
  metaVentasCLP: number;
  ventasRealesCLP: number;
  porcentajeCumplimientoVentas: number;
  metaCobranzaCLP: number;
  cobranzaRecaudadaCLP: number;
  porcentajeCobranza: number;
  tasaComisionBase: number; // % base
  factorCastigoPremioCobranza: number; // e.g. 1.0, 0.8, 1.15
  tasaFinalAplicada: number;
  comisionTotalCLP: number;
  estadoLiquidacion: 'Pendiente' | 'Aprobada' | 'Pagada';
}

export interface CommissionRules {
  // Rule 1: Tiered Sales quota
  tasaTramoBajo: number;      // < 80% (ej. 0.5%)
  tasaTramoMedio: number;     // 80% - 99% (ej. 2.0%)
  tasaTramoMeta: number;      // 100% - 119% (ej. 3.5%)
  tasaTramoSuperMeta: number; // >= 120% (ej. 4.5%)
  // Rule 2: Cash collection factor
  umbralCobranzaCritica: number; // < 80% -> factor 0.75x
  umbralCobranzaOptima: number;   // >= 95% -> factor 1.15x
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

export interface ConfirmationModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  detailItems?: { label: string; value: string; isHighlight?: boolean }[];
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'warning' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
}
