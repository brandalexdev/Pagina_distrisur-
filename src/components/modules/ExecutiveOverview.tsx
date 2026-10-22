import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Boxes,
  Users,
  FileText,
  Truck,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  UserRole,
  Client,
  InventoryLot,
  DTEInvoice,
  SellerCommissionData
} from '../../types';
import { formatCLP, evaluateInventoryAlert } from '../../utils/chileanUtils';
import { NavTab } from '../layout/Sidebar';

interface ExecutiveOverviewProps {
  currentRole: UserRole;
  clients: Client[];
  inventory: InventoryLot[];
  dteInvoices: DTEInvoice[];
  sellerCommissions: SellerCommissionData[];
  onNavigate: (tab: NavTab) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  currentRole,
  clients,
  inventory,
  dteInvoices,
  sellerCommissions,
  onNavigate
}) => {
  // Compute Critical Alerts
  const criticalLots = inventory.filter((l) => {
    const alert = evaluateInventoryAlert(l);
    return alert.status === 'red';
  });

  const warningLots = inventory.filter((l) => {
    const alert = evaluateInventoryAlert(l);
    return alert.status === 'yellow';
  });

  const totalDTEEmittedCLP = dteInvoices.reduce((sum, d) => sum + d.montoTotalCLP, 0);
  const totalCreditLimit = clients.reduce((sum, c) => sum + c.lineaCreditoCLP, 0);
  const totalCreditUsed = clients.reduce((sum, c) => sum + c.creditoUtilizadoCLP, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Invoicing */}
        <div
          onClick={() => onNavigate('billing')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Facturación DTE SII</span>
            <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCLP(totalDTEEmittedCLP)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{dteInvoices.length} DTEs emitidos</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Timbre OK</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Inventory & FEFO */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-red-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Alertas FEFO / Quiebre</span>
            <Boxes className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 flex items-center gap-2">
            <span className="text-red-600">{criticalLots.length} críticos</span>
            <span className="text-xs text-slate-400 font-sans">/ {warningLots.length} advertencia</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{inventory.length} lotes auditados</span>
            <span className="text-blue-700 font-semibold group-hover:underline">Revisar →</span>
          </div>
        </div>

        {/* KPI 3: Clients & Credit */}
        <div
          onClick={() => onNavigate('clients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cartera de Clientes</span>
            <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {clients.length} registrados
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Línea Total: {formatCLP(totalCreditLimit)}</span>
            <span className="text-slate-700 font-mono font-medium">
              {Math.round((totalCreditUsed / totalCreditLimit) * 100)}% ocupado
            </span>
          </div>
        </div>

        {/* KPI 4: Sales Commissions */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Comisiones de Venta</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCLP(sellerCommissions.reduce((sum, s) => sum + s.comisionTotalCLP, 0))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>4 Ejecutivos (Temuco/Angol)</span>
            <span className="text-emerald-700 font-semibold">Cálculo Biparamétrico</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Accesos Directos a los Módulos del Sistema
          </h2>
          <span className="text-xs text-slate-500">Navegue sin recargar la aplicación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Module A */}
          <div
            onClick={() => onNavigate('clients')}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                Clientes y Crédito
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Clientes, Precios y Crédito
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Catálogo regional de clientes en Temuco, Angol, Cautín y Malleco. Validador Módulo 11 de RUT chileno, fijación de líneas de crédito y plazos de pago.
            </p>
          </div>

          {/* Card Module C */}
          <div
            onClick={() => onNavigate('inventory')}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-red-100 text-red-800">
                Inventario y FEFO
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Inventario, Bodega y FEFO
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Semáforo de criticidad por fecha de vencimiento (&lt;15d / &lt;30d), matriz de stock con lote prioritario FEFO y recepción de OC con cálculo de mermas.
            </p>
          </div>

          {/* Card Module E */}
          <div
            onClick={() => onNavigate('billing')}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Facturación DTE
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Facturación DTE y SII
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Emisión de Factura 33, Guía 52 y Nota de Crédito 61. Desglose automático de Neto + IVA 19%, timbre electrónico CAF y previsualización de comprobante.
            </p>
          </div>

          {/* Card Module F */}
          <div
            onClick={() => onNavigate('suppliers')}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                Compras y Proveedores
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Compras y Proveedores
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gestión de convenios con Watt's, Agrosuper, CCU y Molino Luchsinger. Escalas de descuento por volumen y tiempos de entrega a Temuco y Angol.
            </p>
          </div>

          {/* Card Module G */}
          <div
            onClick={() => onNavigate('reports')}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2 group md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                Reportes y Liquidación
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
              Reportes de Ventas y Liquidación de Comisiones
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Panel analítico con filtros cruzados de ventas por zona y vendedor. Calculadora biparamétrica de comisiones: cruza % de cumplimiento de meta de ventas con % de recaudación de cobranza en $ CLP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
