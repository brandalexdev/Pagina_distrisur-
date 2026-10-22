import { InventoryLot } from '../types';

/**
 * Formats number as Chilean Pesos (CLP)
 * Example: 1450000 -> "$1.450.000"
 */
export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  const rounded = Math.round(amount);
  return '$' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Formats a Chilean RUT string into standard format XX.XXX.XXX-X
 */
export function formatRUT(rut: string): string {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  
  const dv = clean.slice(-1);
  let cuerpo = clean.slice(0, -1);
  
  // Format body with dots
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${dv}`;
}

/**
 * Validates Chilean RUT using the Modulo 11 algorithm
 */
export function validateRUT(rut: string): boolean {
  if (!rut) return false;
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;
  
  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const resto = 11 - (suma % 11);
  let dvCalculado = '';
  if (resto === 11) dvCalculado = '0';
  else if (resto === 10) dvCalculado = 'K';
  else dvCalculado = resto.toString();
  
  return dvCalculado === dv;
}

/**
 * Calculates days remaining until expiration date
 */
export function getDaysUntilExpiration(expirationDateStr: string): number {
  const [year, month, day] = expirationDateStr.split('-').map(Number);
  const expDate = new Date(year, month - 1, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const diffTime = expDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export type ExpirationTrafficLight = 'red' | 'yellow' | 'green';

export interface AlertEvaluation {
  status: ExpirationTrafficLight;
  isExpired: boolean;
  daysRemaining: number;
  stockAlert: 'critico' | 'quiebre' | 'normal';
  motivoTexto: string;
}

/**
 * Evaluates criticality traffic light (RF-11)
 * Red: < 15 days or quiebre de stock (stock <= 0 or stock < stockMinimo / 2)
 * Yellow: < 30 days or stock crítico (stock <= stockMinimo)
 * Green: normal
 */
export function evaluateInventoryAlert(lot: InventoryLot): AlertEvaluation {
  const days = getDaysUntilExpiration(lot.fechaVencimiento);
  const isStockOut = lot.stockActual <= 0;
  const isSevereStock = lot.stockActual > 0 && lot.stockActual < lot.stockMinimo / 2;
  const isWarningStock = lot.stockActual <= lot.stockMinimo;

  if (days < 0) {
    return {
      status: 'red',
      isExpired: true,
      daysRemaining: days,
      stockAlert: isStockOut ? 'quiebre' : 'normal',
      motivoTexto: `¡VENCIDO hace ${Math.abs(days)} días!`
    };
  }

  if (days < 15 || isStockOut || isSevereStock) {
    const motivos: string[] = [];
    if (days < 15) motivos.push(`Vence en ${days} días`);
    if (isStockOut) motivos.push('Quiebre total de stock (0 un)');
    else if (isSevereStock) motivos.push(`Stock severo (${lot.stockActual}/${lot.stockMinimo})`);
    
    return {
      status: 'red',
      isExpired: false,
      daysRemaining: days,
      stockAlert: isStockOut ? 'quiebre' : 'critico',
      motivoTexto: motivos.join(' | ')
    };
  }

  if (days < 30 || isWarningStock) {
    const motivos: string[] = [];
    if (days < 30) motivos.push(`Vence en ${days} días`);
    if (isWarningStock) motivos.push(`Stock bajo mínimo (${lot.stockActual}/${lot.stockMinimo})`);

    return {
      status: 'yellow',
      isExpired: false,
      daysRemaining: days,
      stockAlert: 'critico',
      motivoTexto: motivos.join(' | ')
    };
  }

  return {
    status: 'green',
    isExpired: false,
    daysRemaining: days,
    stockAlert: 'normal',
    motivoTexto: `Estado nominal (${days} días vigencia)`
  };
}

/**
 * Sorts lots by FEFO (First Expired, First Out)
 * Earliest expiration date first.
 */
export function sortLotsByFEFO(lots: InventoryLot[]): InventoryLot[] {
  return [...lots].sort((a, b) => {
    return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
  });
}

/**
 * Helper to identify which lot is FEFO priority #1 per SKU
 */
export function annotateFEFOPriorities(lots: InventoryLot[]): InventoryLot[] {
  const skuGroups = new Map<string, InventoryLot[]>();
  
  lots.forEach(lot => {
    const group = skuGroups.get(lot.sku) || [];
    group.push(lot);
    skuGroups.set(lot.sku, group);
  });

  const markedLots: InventoryLot[] = [];

  skuGroups.forEach(group => {
    // sort by expiration
    const sorted = [...group].sort((a, b) => {
      // Prioritize active stock
      if (a.stockActual > 0 && b.stockActual <= 0) return -1;
      if (a.stockActual <= 0 && b.stockActual > 0) return 1;
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
    });

    sorted.forEach((lot, index) => {
      markedLots.push({
        ...lot,
        esPrioridadFEFO: index === 0 && lot.stockActual > 0
      });
    });
  });

  return markedLots;
}
