import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calculator,
  TrendingUp,
  DollarSign,
  Percent,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Award,
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  SalesRecord,
  SellerCommissionData,
  CommissionRules,
  ChileanZone,
  ConfirmationModalConfig
} from '../../types';
import { formatCLP } from '../../utils/chileanUtils';
import { downloadCSV } from '../../utils/csvExport';

interface ReportsModuleProps {
  salesRecords: SalesRecord[];
  sellerCommissions: SellerCommissionData[];
  onUpdateCommissions: (updated: SellerCommissionData[]) => void;
  onRequestConfirm: (config: ConfirmationModalConfig) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  salesRecords,
  sellerCommissions,
  onUpdateCommissions,
  onRequestConfirm,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'commissions'>('sales');

  // Filters for Sales Dynamic Table
  const [filterCliente, setFilterCliente] = useState('all');
  const [filterVendedor, setFilterVendedor] = useState('all');
  const [filterProducto, setFilterProducto] = useState('all');
  const [filterZona, setFilterZona] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Rules Configuration State
  const [rules, setRules] = useState<CommissionRules>({
    tasaTramoBajo: 0.5,      // < 80%
    tasaTramoMedio: 2.0,     // 80% - 99%
    tasaTramoMeta: 3.5,      // 100% - 119%
    tasaTramoSuperMeta: 4.5, // >= 120%
    umbralCobranzaCritica: 80, // < 80% -> factor 0.75x
    umbralCobranzaOptima: 95    // >= 95% -> factor 1.15x
  });

  // Unique Filter Lists
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(salesRecords.map((r) => r.clienteNombre)));
  }, [salesRecords]);

  const uniqueSellers = useMemo(() => {
    return Array.from(new Set(salesRecords.map((r) => r.vendedor)));
  }, [salesRecords]);

  const uniqueProducts = useMemo(() => {
    return Array.from(new Set(salesRecords.map((r) => r.productoNombre)));
  }, [salesRecords]);

  const uniqueZones: ChileanZone[] = ['Temuco', 'Angol', 'Cautín', 'Malleco'];

  // Filtered Sales Records
  const filteredSales = useMemo(() => {
    return salesRecords.filter((record) => {
      const matchSearch =
        record.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vendedor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClient = filterCliente === 'all' || record.clienteNombre === filterCliente;
      const matchSeller = filterVendedor === 'all' || record.vendedor === filterVendedor;
      const matchProduct = filterProducto === 'all' || record.productoNombre === filterProducto;
      const matchZone = filterZona === 'all' || record.zona === filterZona;

      return matchSearch && matchClient && matchSeller && matchProduct && matchZone;
    });
  }, [salesRecords, searchTerm, filterCliente, filterVendedor, filterProducto, filterZona]);

  // Aggregate Sales KPIs
  const totalVentas = useMemo(() => {
    return filteredSales.reduce((sum, r) => sum + r.montoTotalCLP, 0);
  }, [filteredSales]);

  const totalCosto = useMemo(() => {
    return filteredSales.reduce((sum, r) => sum + r.costoTotalCLP, 0);
  }, [filteredSales]);

  const totalMargen = totalVentas - totalCosto;
  const margenPorcentaje = totalVentas > 0 ? ((totalMargen / totalVentas) * 100).toFixed(1) : '0';

  // Zone Breakdown for Progress Chart
  const salesByZone = useMemo(() => {
    const data: Record<string, number> = { Temuco: 0, Angol: 0, Cautín: 0, Malleco: 0 };
    filteredSales.forEach((r) => {
      if (data[r.zona] !== undefined) {
        data[r.zona] += r.montoTotalCLP;
      }
    });
    return data;
  }, [filteredSales]);

  // Recalculate Commissions Dynamically
  const computedCommissions = useMemo(() => {
    return sellerCommissions.map((seller) => {
      const compliance = seller.porcentajeCumplimientoVentas;
      const collection = seller.porcentajeCobranza;

      // Rule 1: % de cumplimiento de meta de ventas
      let tasaBase = rules.tasaTramoBajo;
      if (compliance >= 120) {
        tasaBase = rules.tasaTramoSuperMeta;
      } else if (compliance >= 100) {
        tasaBase = rules.tasaTramoMeta;
      } else if (compliance >= 80) {
        tasaBase = rules.tasaTramoMedio;
      }

      // Rule 2: % de cobranza efectivamente recaudada
      let factorCobranza = 1.0;
      if (collection < rules.umbralCobranzaCritica) {
        factorCobranza = 0.75; // 25% penalización por mora
      } else if (collection >= rules.umbralCobranzaOptima) {
        factorCobranza = 1.15; // 15% premio por cartera al día
      }

      const tasaFinal = +(tasaBase * factorCobranza).toFixed(3);
      const comisionCLP = Math.round(seller.ventasRealesCLP * (tasaFinal / 100));

      return {
        ...seller,
        tasaComisionBase: tasaBase,
        factorCastigoPremioCobranza: factorCobranza,
        tasaFinalAplicada: tasaFinal,
        comisionTotalCLP: comisionCLP
      };
    });
  }, [sellerCommissions, rules]);

  // Total commissions amount to settle
  const totalComisionesCLP = useMemo(() => {
    return computedCommissions.reduce((sum, s) => sum + s.comisionTotalCLP, 0);
  }, [computedCommissions]);

  // Export Sales Table to CSV
  const handleExportSalesCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `distrisur_reporte_ventas_${today}.csv`;

    const headers = [
      'Fecha',
      'Folio DTE',
      'Cliente Receptor',
      'RUT Cliente',
      'Zona Geográfica',
      'Vendedor Asignado',
      'SKU Producto',
      'Descripción Producto',
      'Categoría',
      'Cantidad Vendida',
      'Monto Total Venta (CLP)',
      'Costo Total (CLP)',
      'Margen Bruto (CLP)'
    ];

    const rows = filteredSales.map((r) => [
      r.fecha,
      r.folioDTE,
      r.clienteNombre,
      r.clienteRUT,
      r.zona,
      r.vendedor,
      r.productoSKU,
      r.productoNombre,
      r.categoria,
      r.cantidad,
      r.montoTotalCLP,
      r.costoTotalCLP,
      r.margenCLP
    ]);

    downloadCSV(filename, headers, rows);
    showToast(
      'success',
      'Exportación Exitosa',
      `Se ha descargado el archivo "${filename}" con ${filteredSales.length} registros listos para Excel o Google Sheets.`
    );
  };

  // Export Commissions Settlement Table to CSV
  const handleExportCommissionsCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const filename = `distrisur_liquidacion_comisiones_${today}.csv`;

    const headers = [
      'ID Vendedor',
      'Ejecutivo de Ventas',
      'Zona Geográfica',
      'Meta de Ventas (CLP)',
      'Ventas Reales (CLP)',
      'Porcentaje Cumplimiento Ventas (%)',
      'Meta de Cobranza (CLP)',
      'Cobranza Recaudada (CLP)',
      'Porcentaje Cobranza Recaudada (%)',
      'Tasa Comisión Base (%)',
      'Factor Multiplicador Cobranza',
      'Tasa Efectiva Aplicada (%)',
      'Comisión Total Liquidada (CLP)',
      'Estado de Liquidación'
    ];

    const rows = computedCommissions.map((s) => [
      s.vendedorId,
      s.vendedorNombre,
      s.zona,
      s.metaVentasCLP,
      s.ventasRealesCLP,
      `${s.porcentajeCumplimientoVentas}%`,
      s.metaCobranzaCLP,
      s.cobranzaRecaudadaCLP,
      `${s.porcentajeCobranza}%`,
      `${s.tasaComisionBase}%`,
      `${s.factorCastigoPremioCobranza}x`,
      `${s.tasaFinalAplicada}%`,
      s.comisionTotalCLP,
      s.estadoLiquidacion
    ]);

    downloadCSV(filename, headers, rows);
    showToast(
      'success',
      'Planilla Exportada',
      `Se ha descargado la liquidación "${filename}" con el detalle completo de comisiones en formato compatible con planillas externas.`
    );
  };

  // Settle Commissions with Confirmation Modal
  const handleApproveCommissions = () => {
    onRequestConfirm({
      isOpen: true,
      title: '¿Confirmar liquidación mensual de comisiones?',
      message: `Se cerrará la planilla de comisiones del mes con un monto total a liquidar de ${formatCLP(totalComisionesCLP)} distribuido entre ${computedCommissions.length} ejecutivos de venta de Temuco y Angol.`,
      detailItems: [
        { label: 'Total Comisiones a Pagar', value: formatCLP(totalComisionesCLP), isHighlight: true },
        ...computedCommissions.map((s) => ({
          label: `${s.vendedorNombre} (${s.zona})`,
          value: `${formatCLP(s.comisionTotalCLP)} (Tasa: ${s.tasaFinalAplicada}%)`
        }))
      ],
      confirmText: 'Aprobar Planilla de Comisiones',
      cancelText: 'Volver a Revisar Parámetros',
      type: 'primary',
      onConfirm: () => {
        const approved = computedCommissions.map((c) => ({
          ...c,
          estadoLiquidacion: 'Aprobada' as const
        }));
        onUpdateCommissions(approved);
        showToast(
          'success',
          'Comisiones Liquidadas',
          `Planilla por ${formatCLP(totalComisionesCLP)} aprobada formalmente para pago a ejecutivos.`
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation between Sales Reports and Commissions */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reportes Analíticos de Ventas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'commissions'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculadora y Liquidación de Comisiones</span>
          <span className="text-[11px] font-normal opacity-75">
            (Total: {formatCLP(totalComisionesCLP)})
          </span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: REPORTES DE VENTAS
          ======================================================== */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card with Export to CSV Button */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Reportes de Ventas y Rendimiento Comercial
                </h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Indicadores clave de distribución regional para La Araucanía. Cruce multidimensional por cliente, vendedor, producto y zona geográfica.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportSalesCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer shrink-0"
              title="Descargar tabla filtrada en formato CSV para Excel o Google Sheets"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Exportar Reporte a CSV</span>
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Ventas Totales Filtradas</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatCLP(totalVentas)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4% vs mes anterior</span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Margen Bruto Comercial</span>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                {formatCLP(totalMargen)}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-1">
                Rentabilidad sobre venta: {margenPorcentaje}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Pedidos Despachados</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {filteredSales.length} transacciones
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-1">
                100% con Guía / DTE Timbrado
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block">Ticket Promedio por Venta</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {formatCLP(filteredSales.length > 0 ? Math.round(totalVentas / filteredSales.length) : 0)}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block mt-1">
                En rutas Temuco y Angol
              </span>
            </div>
          </div>

          {/* Zone Distribution Bar Visualizer */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Distribución Geográfica de Facturación ($ CLP)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              {uniqueZones.map((z) => {
                const zoneAmount = salesByZone[z] || 0;
                const zonePercent = totalVentas > 0 ? Math.round((zoneAmount / totalVentas) * 100) : 0;

                return (
                  <div key={z} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Zona {z}</span>
                      <span className="font-mono font-semibold text-slate-600">{zonePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${zonePercent}%` }}
                      />
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {formatCLP(zoneAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label htmlFor="filter-search" className="block text-xs font-semibold text-slate-700 mb-1">
                Búsqueda Rápida
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="filter-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cliente, producto..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="filter-c" className="block text-xs font-semibold text-slate-700 mb-1">
                Filtrar por Cliente
              </label>
              <select
                id="filter-c"
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="all">Todos los Clientes ({uniqueClients.length})</option>
                {uniqueClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-v" className="block text-xs font-semibold text-slate-700 mb-1">
                Filtrar por Vendedor
              </label>
              <select
                id="filter-v"
                value={filterVendedor}
                onChange={(e) => setFilterVendedor(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="all">Todos los Vendedores ({uniqueSellers.length})</option>
                {uniqueSellers.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-p" className="block text-xs font-semibold text-slate-700 mb-1">
                Filtrar por Producto
              </label>
              <select
                id="filter-p"
                value={filterProducto}
                onChange={(e) => setFilterProducto(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="all">Todos los Productos</option>
                {uniqueProducts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-z" className="block text-xs font-semibold text-slate-700 mb-1">
                Zona Geográfica
              </label>
              <select
                id="filter-z"
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
              >
                <option value="all">Todas las Zonas</option>
                {uniqueZones.map((z) => (
                  <option key={z} value={z}>
                    Zona {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Table of Sales Records */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ventas Registradas ({filteredSales.length})
              </span>
              <button
                type="button"
                onClick={handleExportSalesCSV}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Fecha / Folio</th>
                    <th className="py-2.5 px-3">Cliente Receptor</th>
                    <th className="py-2.5 px-3">Zona</th>
                    <th className="py-2.5 px-3">Vendedor</th>
                    <th className="py-2.5 px-3">Producto / SKU</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3 text-right">Venta Total</th>
                    <th className="py-2.5 px-3 text-right">Margen CLP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No hay ventas registradas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono">
                          <span className="font-semibold text-slate-900">#{sale.folioDTE}</span>
                          <span className="text-[11px] text-slate-500 block">{sale.fecha}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{sale.clienteNombre}</span>
                          <span className="font-mono text-[10px] text-slate-400">{sale.clienteRUT}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-800 font-medium">
                            {sale.zona}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {sale.vendedor}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-900">{sale.productoNombre}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{sale.productoSKU}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {sale.cantidad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatCLP(sale.montoTotalCLP)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                          {formatCLP(sale.margenCLP)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: CÁLCULO DE COMISIONES
          ======================================================== */}
      {activeTab === 'commissions' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card with Export to CSV & Settle Buttons */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Cálculo y Liquidación de Comisiones de Venta
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Modelo Biparamétrico
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Cálculo automatizado cruzando dos variables: <strong className="text-slate-800">1) % Cumplimiento de Meta de Ventas</strong> y <strong className="text-slate-800">2) % de Cobranza Efectivamente Recaudada</strong> (factor de penalización por mora o bono por pago al día).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCommissionsCSV}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer"
                title="Exportar planilla de liquidación a archivo CSV"
              >
                <Download className="w-4 h-4 text-blue-700" />
                <span>Exportar Planilla a CSV</span>
              </button>

              <button
                type="button"
                onClick={handleApproveCommissions}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar y Liquidar Planilla</span>
              </button>
            </div>
          </div>

          {/* Interactive Rules Configuration Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Configuración de Parámetros de Liquidación (Reglas 1 y 2)
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Edite los porcentajes para simular recálculos en tiempo real
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Regla 1: Cumplimiento de Metas */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Regla 1: Escala por % de Cumplimiento de Meta de Ventas
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="tramo-bajo" className="block text-slate-600 mb-1">
                      Tramo Bajo (&lt;80%):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="tramo-bajo"
                        type="number"
                        step={0.1}
                        value={rules.tasaTramoBajo}
                        onChange={(e) =>
                          setRules({ ...rules, tasaTramoBajo: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                      />
                      <span className="font-bold text-slate-600">% comisión</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tramo-medio" className="block text-slate-600 mb-1">
                      Tramo Medio (80% - 99%):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="tramo-medio"
                        type="number"
                        step={0.1}
                        value={rules.tasaTramoMedio}
                        onChange={(e) =>
                          setRules({ ...rules, tasaTramoMedio: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                      />
                      <span className="font-bold text-slate-600">% comisión</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tramo-meta" className="block text-slate-600 mb-1">
                      Meta Lograda (100% - 119%):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="tramo-meta"
                        type="number"
                        step={0.1}
                        value={rules.tasaTramoMeta}
                        onChange={(e) =>
                          setRules({ ...rules, tasaTramoMeta: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                      />
                      <span className="font-bold text-slate-600">% comisión</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tramo-super" className="block text-slate-600 mb-1">
                      Super Meta (&gt;=120%):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="tramo-super"
                        type="number"
                        step={0.1}
                        value={rules.tasaTramoSuperMeta}
                        onChange={(e) =>
                          setRules({ ...rules, tasaTramoSuperMeta: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                      />
                      <span className="font-bold text-slate-600">% comisión</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regla 2: Cobranza Efectiva */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Regla 2: Multiplicador por % de Cobranza Efectiva Recaudada
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold text-red-800">Penalización Mora: </span>
                      <span className="text-slate-600">Cobranza &lt; {rules.umbralCobranzaCritica}%</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                      Factor 0.75x (-25%)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-800">Rango Neutro: </span>
                      <span className="text-slate-600">{rules.umbralCobranzaCritica}% a {rules.umbralCobranzaOptima}%</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      Factor 1.00x (Sin ajuste)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="font-semibold text-emerald-800">Premio Excelencia: </span>
                      <span className="text-slate-600">Cobranza &gt;= {rules.umbralCobranzaOptima}%</span>
                    </div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Factor 1.15x (+15% bono)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settlement Table (Tabla de Liquidación) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Planilla de Liquidación de Comisiones por Vendedor
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-blue-700">
                  Fondo Total: {formatCLP(totalComisionesCLP)}
                </span>
                <button
                  type="button"
                  onClick={handleExportCommissionsCSV}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                    <th className="py-3 px-4">Ejecutivo de Ventas</th>
                    <th className="py-3 px-4">Zona</th>
                    <th className="py-3 px-4 text-right">Meta Ventas</th>
                    <th className="py-3 px-4 text-right">Ventas Reales</th>
                    <th className="py-3 px-4 text-center">% Cumplimiento</th>
                    <th className="py-3 px-4 text-center">% Cobranza</th>
                    <th className="py-3 px-4 text-center">Tasa Base / Factor</th>
                    <th className="py-3 px-4 text-right">Total Comisión ($ CLP)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {computedCommissions.map((s) => {
                    const isSuperQuota = s.porcentajeCumplimientoVentas >= 120;
                    const isGoodCollection = s.porcentajeCobranza >= 95;
                    const isBadCollection = s.porcentajeCobranza < 80;

                    return (
                      <tr key={s.vendedorId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.vendedorNombre}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {s.vendedorId}</div>
                        </td>

                        <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                          {s.zona}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-slate-600">
                          {formatCLP(s.metaVentasCLP)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-xs tabular-nums font-bold text-slate-900">
                          {formatCLP(s.ventasRealesCLP)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                              isSuperQuota
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : s.porcentajeCumplimientoVentas >= 100
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {s.porcentajeCumplimientoVentas}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                              isBadCollection
                                ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                                : isGoodCollection
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {s.porcentajeCobranza}%
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center text-xs font-mono">
                          <span className="font-semibold text-slate-800">{s.tasaComisionBase}%</span>
                          <span className="text-slate-400 mx-1">×</span>
                          <span
                            className={`font-bold ${
                              s.factorCastigoPremioCobranza > 1
                                ? 'text-emerald-700'
                                : s.factorCastigoPremioCobranza < 1
                                ? 'text-red-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {s.factorCastigoPremioCobranza}x
                          </span>
                          <div className="text-[10px] text-blue-700 font-bold">
                            = {s.tasaFinalAplicada}% efectivo
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-base text-blue-700 tabular-nums">
                          {formatCLP(s.comisionTotalCLP)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md ${
                              s.estadoLiquidacion === 'Aprobada'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {s.estadoLiquidacion}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800">Fórmula de Negocio DistriSur: </span>
                <span className="font-mono">Comisión = Ventas Reales × Tasa Tramo Base × Factor de Cobranza</span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-semibold block">Total a Pagar en Remuneraciones</span>
                <span className="text-lg font-bold font-mono text-blue-700">
                  {formatCLP(totalComisionesCLP)} CLP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
