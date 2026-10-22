import React, { useState, useMemo } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  Trash2,
  Building,
  QrCode,
  ShieldCheck,
  Eye,
  X,
  FileCheck2,
  Printer,
  Download
} from 'lucide-react';
import {
  Client,
  InventoryLot,
  DTEInvoice,
  DTEType,
  DTEItem,
  ConfirmationModalConfig
} from '../../types';
import { formatCLP } from '../../utils/chileanUtils';

interface BillingModuleProps {
  clients: Client[];
  inventory: InventoryLot[];
  dteInvoices: DTEInvoice[];
  onEmitDTE: (invoice: DTEInvoice) => void;
  onRequestConfirm: (config: ConfirmationModalConfig) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const BillingModule: React.FC<BillingModuleProps> = ({
  clients,
  inventory,
  dteInvoices,
  onEmitDTE,
  onRequestConfirm,
  showToast
}) => {
  // DTE Form State
  const [tipoDTE, setTipoDTE] = useState<DTEType>('33');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [condicionPago, setCondicionPago] = useState<string>('Crédito 30 días');
  const [selectedLines, setSelectedLines] = useState<
    { sku: string; descripcion: string; cantidad: number; precioUnitarioCLP: number }[]
  >([
    {
      sku: 'LAC-COL-001',
      descripcion: 'Leche Entera Colún 1L (Caja x12) - Lote L-2415',
      cantidad: 20,
      precioUnitarioCLP: 14800
    },
    {
      sku: 'BEB-CCU-001',
      descripcion: 'Bebida Bilz 1.5L Retornable (Pack x6) - Lote B-771',
      cantidad: 15,
      precioUnitarioCLP: 8400
    }
  ]);

  // Selected DTE for full voucher view modal
  const [viewingDTE, setViewingDTE] = useState<DTEInvoice | null>(null);

  // Current client object
  const currentClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Available unique products from inventory
  const availableProducts = useMemo(() => {
    const map = new Map<string, InventoryLot>();
    inventory.forEach((item) => {
      if (!map.has(item.sku) && item.stockActual > 0) {
        map.set(item.sku, item);
      }
    });
    return Array.from(map.values());
  }, [inventory]);

  // Calculate Net, IVA 19%, and Total
  const montoNeto = useMemo(() => {
    return selectedLines.reduce(
      (sum, line) => sum + line.cantidad * line.precioUnitarioCLP,
      0
    );
  }, [selectedLines]);

  const montoIVA = Math.round(montoNeto * 0.19);
  const montoTotal = montoNeto + montoIVA;

  // Add Item Line
  const handleAddLine = () => {
    if (availableProducts.length === 0) return;
    const prod = availableProducts[0];
    setSelectedLines((prev) => [
      ...prev,
      {
        sku: prod.sku,
        descripcion: `${prod.nombreProducto} (Lote: ${prod.lote})`,
        cantidad: 10,
        precioUnitarioCLP: prod.precioVentaCLP
      }
    ]);
  };

  // Remove Line
  const handleRemoveLine = (index: number) => {
    setSelectedLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Update Line Field
  const handleUpdateLine = (
    index: number,
    field: 'sku' | 'cantidad' | 'precioUnitarioCLP',
    value: any
  ) => {
    setSelectedLines((prev) => {
      const copy = [...prev];
      if (field === 'sku') {
        const found = availableProducts.find((p) => p.sku === value);
        if (found) {
          copy[index] = {
            ...copy[index],
            sku: found.sku,
            descripcion: `${found.nombreProducto} (Lote: ${found.lote})`,
            precioUnitarioCLP: found.precioVentaCLP
          };
        }
      } else {
        copy[index] = {
          ...copy[index],
          [field]: value
        };
      }
      return copy;
    });
  };

  // DTE Document Label Helper
  const getDocumentName = (type: DTEType) => {
    switch (type) {
      case '33':
        return 'Factura Electrónica (DTE 33)';
      case '52':
        return 'Guía de Despacho Electrónica (DTE 52)';
      case '61':
        return 'Nota de Crédito Electrónica (DTE 61)';
    }
  };

  // Emit DTE with mandatory confirmation modal (RF Usabilidad)
  const handleEmitDTE = () => {
    if (!currentClient) {
      showToast('warning', 'Cliente Requerido', 'Debe seleccionar un cliente destinatario.');
      return;
    }

    if (selectedLines.length === 0 || montoNeto <= 0) {
      showToast('warning', 'Líneas Requeridas', 'Debe agregar al menos un ítem con monto mayor a $0.');
      return;
    }

    const docName = getDocumentName(tipoDTE);
    const folioAsignado = 38400 + dteInvoices.length + 1;

    onRequestConfirm({
      isOpen: true,
      title: `¿Confirmar emisión de ${docName} al SII?`,
      message: `Está a punto de timbrar y transmitir electrónicamente el documento tributario Folio N° ${folioAsignado} a nombre de "${currentClient.razonSocial}". Se consumirá un folio del CAF autorizado.`,
      detailItems: [
        { label: 'Documento SII', value: docName },
        { label: 'Folio a Emitir', value: `N° ${folioAsignado}` },
        { label: 'Cliente Receptor', value: currentClient.razonSocial },
        { label: 'RUT Receptor', value: currentClient.rut },
        { label: 'Subtotal Neto', value: formatCLP(montoNeto) },
        { label: 'IVA Crédito Fiscal (19%)', value: formatCLP(montoIVA) },
        { label: 'Total a Pagar (CLP)', value: formatCLP(montoTotal), isHighlight: true }
      ],
      confirmText: 'Timbrar y Transmitir al SII',
      cancelText: 'Cancelar y Revisar',
      type: 'primary',
      onConfirm: () => {
        const newDTE: DTEInvoice = {
          id: `dte-${Date.now()}`,
          folio: folioAsignado,
          tipoDTE,
          tipoNombre:
            tipoDTE === '33'
              ? 'Factura Electrónica'
              : tipoDTE === '52'
              ? 'Guía de Despacho'
              : 'Nota de Crédito',
          fechaEmision: new Date().toISOString().split('T')[0],
          clienteId: currentClient.id,
          clienteNombre: currentClient.razonSocial,
          clienteRUT: currentClient.rut,
          clienteGiro: currentClient.giro,
          clienteDireccion: currentClient.direccionDespacho,
          clienteComuna: currentClient.comuna,
          vendedor: currentClient.vendedorAsignado,
          items: selectedLines.map((l) => ({
            sku: l.sku,
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitarioCLP: l.precioUnitarioCLP,
            subtotalCLP: l.cantidad * l.precioUnitarioCLP
          })),
          montoNetoCLP: montoNeto,
          montoIVACLP: montoIVA,
          montoTotalCLP: montoTotal,
          estadoSII: 'TIMBRE_ELECTRONICO_OK',
          trackIdSII: `TRK-${new Date().getFullYear()}${Math.floor(100000 + Math.random() * 900000)}`,
          codigoCAF: `CAF-SII-DTE${tipoDTE}-2026-N${folioAsignado}`,
          tedFirmaResumen: `TED-SHA256:${Math.random().toString(36).substring(2, 12)}..OK`,
          condicionPago
        };

        onEmitDTE(newDTE);
        showToast(
          'success',
          'Documento Timbrado con Éxito',
          `${newDTE.tipoNombre} Folio N° ${newDTE.folio} fue autorizada por el SII con Timbre Electrónico OK.`
        );

        // Open Voucher viewer
        setViewingDTE(newDTE);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with SII Connection Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Facturación Electrónica y Cobranza DTE
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Emisión de DTE con validación tributaria directa según normativa del Servicio de Impuestos Internos (SII).
          </p>
        </div>

        {/* Visual SII Connection Status Indicator */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl shadow-xs shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                Timbre Electrónico OK
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-emerald-800 font-medium font-mono">
              Enlace SII: Activo · CAF Vigente
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form to Issue DTE (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emisión de Documento Tributario Electrónico
              </span>
              <span className="text-xs text-blue-700 font-semibold font-mono">
                RUT Emisor: 76.980.120-3 (DistriSur Araucanía SpA)
              </span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Tipo de Documento Tributario (DTE) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoDTE('33')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    tipoDTE === '33'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-mono text-blue-700">DTE 33</div>
                  <div className="text-sm font-bold mt-0.5">Factura Electrónica</div>
                  <div className="text-[11px] text-slate-500 mt-1">Afecta a IVA 19%</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoDTE('52')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    tipoDTE === '52'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-mono text-blue-700">DTE 52</div>
                  <div className="text-sm font-bold mt-0.5">Guía de Despacho</div>
                  <div className="text-[11px] text-slate-500 mt-1">Traslado de mercadería</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoDTE('61')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    tipoDTE === '61'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-mono text-blue-700">DTE 61</div>
                  <div className="text-sm font-bold mt-0.5">Nota de Crédito</div>
                  <div className="text-[11px] text-slate-500 mt-1">Anulación o descuento</div>
                </button>
              </div>
            </div>

            {/* Client Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="select-client-dte" className="block text-xs font-bold text-slate-800 mb-1">
                  Cliente Receptor *
                </label>
                <select
                  id="select-client-dte"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial} ({c.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cond-pago" className="block text-xs font-bold text-slate-800 mb-1">
                  Condición de Venta / Pago *
                </label>
                <select
                  id="cond-pago"
                  value={condicionPago}
                  onChange={(e) => setCondicionPago(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  <option value="Contado / Efectivo">Contado / Efectivo</option>
                  <option value="Transferencia Electrónica Inmediata">Transferencia Inmediata</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 45 días">Crédito 45 días</option>
                </select>
              </div>
            </div>

            {/* Client Autofill Info Card */}
            {currentClient && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">RUT Cliente:</span>
                  <span className="font-mono font-bold text-slate-900">{currentClient.rut}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Giro Comercial:</span>
                  <span className="font-semibold text-slate-900 truncate block">{currentClient.giro}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dirección Despacho:</span>
                  <span className="text-slate-900 truncate block">
                    {currentClient.direccionDespacho}, {currentClient.comuna}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vendedor Asignado:</span>
                  <span className="font-semibold text-blue-700">{currentClient.vendedorAsignado}</span>
                </div>
              </div>
            )}

            {/* Product Lines Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Detalle de Productos Facturados
                </span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Ítem</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Producto / Lote</th>
                      <th className="py-2.5 px-3 text-center w-20">Cantidad</th>
                      <th className="py-2.5 px-3 text-right w-28">Precio Unit. CLP</th>
                      <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                      <th className="py-2.5 px-3 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <select
                            value={line.sku}
                            onChange={(e) => handleUpdateLine(idx, 'sku', e.target.value)}
                            className="w-full py-1 px-2 border border-slate-300 rounded-md text-xs"
                          >
                            {availableProducts.map((p) => (
                              <option key={p.sku} value={p.sku}>
                                {p.nombreProducto} (Stock: {p.stockActual})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={line.cantidad}
                            onChange={(e) =>
                              handleUpdateLine(idx, 'cantidad', Math.max(1, Number(e.target.value)))
                            }
                            className="w-16 py-1 px-1.5 text-center font-mono font-bold border border-slate-300 rounded-md"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-800">
                          {formatCLP(line.precioUnitarioCLP)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatCLP(line.cantidad * line.precioUnitarioCLP)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Quitar ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Breakdown & Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-4">
              <div className="text-xs text-slate-500">
                <p>• Los folios son consumidos directamente del CAF timbrado por el SII.</p>
                <p>• El XML firmado es archivado con respaldo tributario digital de 6 años.</p>
              </div>

              <div className="w-full sm:w-72 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal Neto:</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCLP(montoNeto)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>IVA Débito Fiscal (19%):</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCLP(montoIVA)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Facturado:</span>
                  <span className="font-mono text-blue-700 text-base tabular-nums">
                    {formatCLP(montoTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleEmitDTE}
                  className="w-full mt-3 py-2.5 px-4 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Emitir y Timbrar al SII</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Emitted DTEs History */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Documentos Emitidos ({dteInvoices.length})
              </span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enviados al SII</span>
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {dteInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="pt-3 first:pt-0 space-y-2 group cursor-pointer"
                  onClick={() => setViewingDTE(inv)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          Folio #{inv.folio}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-sm bg-blue-50 text-blue-800 border border-blue-200">
                          {inv.tipoDTE === '33' ? 'Factura' : inv.tipoDTE === '52' ? 'Guía' : 'N.C.'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                        {inv.clienteNombre}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {inv.clienteRUT} · {inv.fechaEmision}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatCLP(inv.montoTotalCLP)}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Timbrado OK</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1.5 rounded-md">
                    <span className="font-mono text-slate-500 truncate max-w-[140px]">
                      {inv.trackIdSII}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDTE(inv);
                      }}
                      className="text-blue-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Comprobante</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DTE Official Voucher Modal (Voucher & Electronic Stamp Inspection) */}
      {viewingDTE && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm tracking-wide">
                  Comprobante DTE Oficial · DistriSur Araucanía SpA
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDTE(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-slate-900 text-xs">
              {/* Header Box mimicking real Chilean Electronic Tax Invoice */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900">
                    DISTRISUR ARAUCANÍA SpA
                  </h3>
                  <p className="text-slate-600">Giro: Distribuidora Mayorista de Alimentos y Abarrotes</p>
                  <p className="text-slate-600">Casa Matriz: Av. Rudecindo Ortega 02300, Temuco</p>
                  <p className="text-slate-600">Sucursal Zonal: Parque Industrial 440, Angol</p>
                </div>

                <div className="p-3 border-2 border-red-600 text-center rounded-md shrink-0 w-56">
                  <div className="text-xs font-bold text-red-600 font-mono">R.U.T.: 76.980.120-3</div>
                  <div className="text-sm font-extrabold text-red-600 uppercase my-1">
                    {viewingDTE.tipoNombre}
                  </div>
                  <div className="text-sm font-bold text-red-600 font-mono">
                    N° {viewingDTE.folio}
                  </div>
                  <div className="text-[10px] text-red-600 font-bold uppercase mt-1">
                    S.I.I. - TEMUCO
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Señor(es):</span>
                  <span className="font-bold text-slate-900">{viewingDTE.clienteNombre}</span>
                  <span className="text-slate-500 block mt-1">RUT Receptor:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingDTE.clienteRUT}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Giro:</span>
                  <span className="font-medium text-slate-900">{viewingDTE.clienteGiro}</span>
                  <span className="text-slate-500 block mt-1">Dirección:</span>
                  <span className="text-slate-900">{viewingDTE.clienteDireccion}, {viewingDTE.clienteComuna}</span>
                </div>
              </div>

              {/* Table of Items */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">Precio Unit.</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewingDTE.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium text-slate-900">{item.descripcion}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCLP(item.precioUnitarioCLP)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{formatCLP(item.subtotalCLP)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & TED (Timbre Electrónico DTE) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                {/* TED Barcode representation */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1">
                  <div className="flex justify-center items-center py-2 text-slate-700">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-semibold">
                    {viewingDTE.codigoCAF}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Timbre Electrónico DTE · Res. Ex. N° 80 del SII
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Monto Neto:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCLP(viewingDTE.montoNetoCLP)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>IVA (19%):</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCLP(viewingDTE.montoIVACLP)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total a Pagar:</span>
                    <span className="font-mono text-blue-700 text-base">{formatCLP(viewingDTE.montoTotalCLP)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast('info', 'Impresión DTE', 'Generando vista de impresión térmica y PDF para chofer de ruta.');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comprobante</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingDTE(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
