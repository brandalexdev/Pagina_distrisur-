import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Warehouse,
  ShieldAlert,
  ClipboardList,
  Sparkles,
  PackageCheck,
  Check
} from 'lucide-react';
import {
  InventoryLot,
  PurchaseOrder,
  ConfirmationModalConfig,
  OCItem
} from '../../types';
import {
  formatCLP,
  evaluateInventoryAlert,
  annotateFEFOPriorities,
  getDaysUntilExpiration
} from '../../utils/chileanUtils';

interface InventoryModuleProps {
  inventory: InventoryLot[];
  purchaseOrders: PurchaseOrder[];
  onUpdateInventory: (updatedLots: InventoryLot[]) => void;
  onUpdatePurchaseOrder: (updatedOC: PurchaseOrder) => void;
  onRequestConfirm: (config: ConfirmationModalConfig) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
  initialTab?: 'alerts' | 'stock' | 'reception';
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  inventory,
  purchaseOrders,
  onUpdateInventory,
  onUpdatePurchaseOrder,
  onRequestConfirm,
  showToast,
  initialTab = 'alerts'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'stock' | 'reception'>(initialTab);

  // Filters for Matrix Stock Table (RF-10)
  const [stockSearch, setStockSearch] = useState('');
  const [filterPasillo, setFilterPasillo] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [showOnlyFEFO, setShowOnlyFEFO] = useState(false);

  // Reception State (RF-08)
  const [selectedOCId, setSelectedOCId] = useState<string>(
    purchaseOrders.find((oc) => oc.estado === 'Pendiente Recepción')?.id || purchaseOrders[0]?.id || ''
  );
  const selectedOC = useMemo(() => {
    return purchaseOrders.find((oc) => oc.id === selectedOCId);
  }, [purchaseOrders, selectedOCId]);

  // Reception input draft state: mapping sku -> { cantidadRecibida, lote, fechaVenc }
  const [receptionForm, setReceptionForm] = useState<
    Record<string, { cantidadRecibida: number; lote: string; fechaVenc: string; pasillo: string }>
  >({});

  // Initialize or reset reception form when selected OC changes
  React.useEffect(() => {
    if (selectedOC) {
      const initialForm: Record<string, { cantidadRecibida: number; lote: string; fechaVenc: string; pasillo: string }> = {};
      selectedOC.items.forEach((item) => {
        initialForm[item.sku] = {
          cantidadRecibida: item.cantidadRecibida > 0 ? item.cantidadRecibida : item.cantidadPedida,
          lote: item.loteIngresado || `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          fechaVenc: item.fechaVencimientoIngresada || '2027-04-30',
          pasillo: 'Pasillo A'
        };
      });
      setReceptionForm(initialForm);
    }
  }, [selectedOC]);

  // Inventory annotated with FEFO rule
  const fefoAnnotatedLots = useMemo(() => {
    return annotateFEFOPriorities(inventory);
  }, [inventory]);

  // Filtered Stock Table
  const filteredStock = useMemo(() => {
    return fefoAnnotatedLots.filter((lot) => {
      const matchesSearch =
        lot.nombreProducto.toLowerCase().includes(stockSearch.toLowerCase()) ||
        lot.sku.toLowerCase().includes(stockSearch.toLowerCase()) ||
        lot.lote.toLowerCase().includes(stockSearch.toLowerCase());

      const matchesPasillo = filterPasillo === 'all' || lot.pasillo === filterPasillo;
      const matchesCategoria = filterCategoria === 'all' || lot.categoria === filterCategoria;
      const matchesFEFO = !showOnlyFEFO || lot.esPrioridadFEFO;

      return matchesSearch && matchesPasillo && matchesCategoria && matchesFEFO;
    });
  }, [fefoAnnotatedLots, stockSearch, filterPasillo, filterCategoria, showOnlyFEFO]);

  // Evaluate Alerts (RF-11)
  const alertEvaluations = useMemo(() => {
    return fefoAnnotatedLots.map((lot) => ({
      lot,
      evaluation: evaluateInventoryAlert(lot)
    }));
  }, [fefoAnnotatedLots]);

  const redAlerts = alertEvaluations.filter((a) => a.evaluation.status === 'red');
  const yellowAlerts = alertEvaluations.filter((a) => a.evaluation.status === 'yellow');

  // Handle reception input change
  const handleReceptionFieldChange = (
    sku: string,
    field: 'cantidadRecibida' | 'lote' | 'fechaVenc' | 'pasillo',
    value: any
  ) => {
    setReceptionForm((prev) => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: value
      }
    }));
  };

  // Submit Goods Reception (RF-08) with Confirmation Modal
  const handleConfirmReception = () => {
    if (!selectedOC) return;

    // Calculate differences
    let hasDiscrepancy = false;
    const discrepanciesList: { label: string; value: string; isHighlight?: boolean }[] = [];

    const updatedItems: OCItem[] = selectedOC.items.map((item) => {
      const formVal = receptionForm[item.sku] || {
        cantidadRecibida: item.cantidadPedida,
        lote: 'L-REC-01',
        fechaVenc: '2027-01-01',
        pasillo: 'Pasillo A'
      };
      const diff = formVal.cantidadRecibida - item.cantidadPedida;
      let estadoItem: OCItem['estadoItem'] = 'Conforme';

      if (diff < 0) {
        estadoItem = 'Faltante';
        hasDiscrepancy = true;
        discrepanciesList.push({
          label: `${item.nombreProducto} (Faltante)`,
          value: `Recibido: ${formVal.cantidadRecibida} / Pedido: ${item.cantidadPedida} (${diff} un)`,
          isHighlight: true
        });
      } else if (diff > 0) {
        estadoItem = 'Excedente';
        hasDiscrepancy = true;
        discrepanciesList.push({
          label: `${item.nombreProducto} (Excedente)`,
          value: `Recibido: ${formVal.cantidadRecibida} / Pedido: ${item.cantidadPedida} (+${diff} un)`
        });
      } else {
        discrepanciesList.push({
          label: `${item.nombreProducto}`,
          value: `${formVal.cantidadRecibida} un recibidas (Conforme)`
        });
      }

      return {
        ...item,
        cantidadRecibida: formVal.cantidadRecibida,
        loteIngresado: formVal.lote,
        fechaVencimientoIngresada: formVal.fechaVenc,
        diferencia: diff,
        estadoItem
      };
    });

    const modalTitle = hasDiscrepancy
      ? '¿Registrar recepción con diferencia de inventario?'
      : '¿Confirmar recepción conforme de Orden de Compra?';

    const modalMessage = hasDiscrepancy
      ? `Se han detectado discrepancias en las cantidades físicas recibidas respecto a la ${selectedOC.numeroOC} de ${selectedOC.proveedorNombre}. Al confirmar, se ingresarán los lotes al stock y se generará el acta de recepción con faltantes/mermas.`
      : `Se procederá a dar ingreso oficial al inventario de ${selectedOC.sucursalDestino} para los ítems de la ${selectedOC.numeroOC}.`;

    onRequestConfirm({
      isOpen: true,
      title: modalTitle,
      message: modalMessage,
      detailItems: [
        { label: 'Orden de Compra', value: selectedOC.numeroOC },
        { label: 'Proveedor', value: selectedOC.proveedorNombre },
        { label: 'Destino', value: selectedOC.sucursalDestino },
        ...discrepanciesList
      ],
      confirmText: hasDiscrepancy ? 'Confirmar Ingreso con Diferencias' : 'Confirmar Ingreso Conforme',
      cancelText: 'Revisar Cantidades',
      type: hasDiscrepancy ? 'warning' : 'primary',
      onConfirm: () => {
        // 1. Update purchase order state
        const updatedOC: PurchaseOrder = {
          ...selectedOC,
          estado: hasDiscrepancy ? 'Recepcionado con Discrepancia' : 'Recepcionado Conforme',
          items: updatedItems,
          fechaRecepcionReal: new Date().toISOString().split('T')[0],
          recibidoPor: 'Operario Bodega DistriSur'
        };
        onUpdatePurchaseOrder(updatedOC);

        // 2. Add or update stock lots in inventory
        const newLots: InventoryLot[] = [...inventory];
        updatedItems.forEach((item) => {
          const formVal = receptionForm[item.sku];
          if (formVal && formVal.cantidadRecibida > 0) {
            // Check if lot already exists or create new lot
            const existingLotIndex = newLots.findIndex(
              (l) => l.sku === item.sku && l.lote === formVal.lote
            );
            if (existingLotIndex >= 0) {
              newLots[existingLotIndex] = {
                ...newLots[existingLotIndex],
                stockActual: newLots[existingLotIndex].stockActual + formVal.cantidadRecibida
              };
            } else {
              newLots.push({
                id: `lot-rec-${Date.now()}-${item.sku}`,
                sku: item.sku,
                nombreProducto: item.nombreProducto,
                categoria: 'Lácteos',
                unidadMedida: 'Unid',
                lote: formVal.lote,
                fechaVencimiento: formVal.fechaVenc,
                fechaIngreso: new Date().toISOString().split('T')[0],
                pasillo: formVal.pasillo || 'Pasillo A',
                estante: 'Estante 01',
                nivel: 'Nivel 1 (Piso)',
                stockActual: formVal.cantidadRecibida,
                stockMinimo: 30,
                costoUnitarioCLP: item.precioUnitarioCLP,
                precioVentaCLP: Math.round(item.precioUnitarioCLP * 1.35)
              });
            }
          }
        });
        onUpdateInventory(newLots);

        showToast(
          hasDiscrepancy ? 'warning' : 'success',
          'Recepción Procesada',
          `La ${selectedOC.numeroOC} fue procesada exitosamente. Se actualizaron los lotes en la bodega central.`
        );
        setActiveSubTab('stock');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar between RF-11, RF-10, and RF-08 */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'alerts'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alertas y Semáforo FEFO</span>
          {(redAlerts.length > 0 || yellowAlerts.length > 0) && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeSubTab === 'alerts' ? 'bg-white text-blue-700' : 'bg-red-600 text-white'
              }`}
            >
              {redAlerts.length + yellowAlerts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'stock'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Control Matricial de Stock</span>
          <span className="text-[11px] font-normal opacity-75">({inventory.length} lotes)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reception')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeSubTab === 'reception'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Recepción contra OC</span>
          <span className="text-[11px] font-normal opacity-75">
            ({purchaseOrders.filter((o) => o.estado === 'Pendiente Recepción').length} pendientes)
          </span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: ALERTAS Y SEMÁFORO DE CRITICIDAD (RF-11)
          ======================================================== */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Panel de Alertas y Semáforo de Criticidad
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                    Regla FEFO &amp; Quiebres
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supervisión proactiva de lotes con caducidad inminente (&lt;15 días / &lt;30 días) y quiebres de stock en bodegas Temuco y Angol.
                </p>
              </div>

              {/* Summary Badges */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>Crítico / Quiebre: {redAlerts.length}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Atención: {yellowAlerts.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Light Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RED COLUMN: CRÍTICO (<15 días o Quiebre total) */}
            <div className="bg-white rounded-xl border border-red-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-red-50/80 border-b border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                  <span>Semáforo Rojo: &lt; 15 Días o Quiebre ({redAlerts.length})</span>
                </div>
                <span className="text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-sm">
                  Acción Urgente
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 space-y-3">
                {redAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No hay productos en estado crítico o quiebre de stock.
                  </p>
                ) : (
                  redAlerts.map(({ lot, evaluation }) => (
                    <div key={lot.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {lot.nombreProducto}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>SKU: {lot.sku}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-700">Lote: {lot.lote}</span>
                            <span>·</span>
                            <span>{lot.pasillo} - {lot.estante}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-sm bg-red-100 text-red-800 border border-red-200">
                            {evaluation.motivoTexto}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                        <div>
                          <span className="text-slate-500">Stock Actual: </span>
                          <span className="font-bold text-slate-900 font-mono">{lot.stockActual} un</span>
                          <span className="text-slate-400"> (Mín: {lot.stockMinimo})</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vencimiento: </span>
                          <span className="font-bold text-red-700 font-mono">{lot.fechaVencimiento}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab('stock');
                            setStockSearch(lot.sku);
                          }}
                          className="text-blue-700 font-semibold hover:underline cursor-pointer"
                        >
                          Ver en matriz →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* YELLOW COLUMN: ATENCIÓN (<30 días o Stock Bajo) */}
            <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Semáforo Amarillo: &lt; 30 Días o Stock Mínimo ({yellowAlerts.length})</span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                  Monitoreo Preventivo
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 space-y-3">
                {yellowAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No hay productos en estado de alerta amarilla.
                  </p>
                ) : (
                  yellowAlerts.map(({ lot, evaluation }) => (
                    <div key={lot.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {lot.nombreProducto}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>SKU: {lot.sku}</span>
                            <span>·</span>
                            <span className="font-semibold text-slate-700">Lote: {lot.lote}</span>
                            <span>·</span>
                            <span>{lot.pasillo} - {lot.estante}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-sm bg-amber-100 text-amber-900 border border-amber-200">
                            {evaluation.motivoTexto}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        <div>
                          <span className="text-slate-500">Stock Actual: </span>
                          <span className="font-bold text-slate-900 font-mono">{lot.stockActual} un</span>
                          <span className="text-slate-400"> (Mín: {lot.stockMinimo})</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vencimiento: </span>
                          <span className="font-bold text-amber-800 font-mono">{lot.fechaVencimiento}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubTab('stock');
                            setStockSearch(lot.sku);
                          }}
                          className="text-blue-700 font-semibold hover:underline cursor-pointer"
                        >
                          Ver en matriz →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: CONTROL MATRICIAL DE STOCK CON FEFO (RF-10)
          ======================================================== */}
      {activeSubTab === 'stock' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Control Matricial de Stock y Regla FEFO
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  First Expired, First Out
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualización detallada por SKU, lote y ubicación física en bodega. La insignia destaca el lote que debe prepararse en el picking para evitar mermas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOnlyFEFO(!showOnlyFEFO)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showOnlyFEFO
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Solo Prioridad FEFO #1</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label htmlFor="search-stock" className="block text-xs font-semibold text-slate-700 mb-1">
                Búsqueda por Producto, SKU o Lote
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-stock"
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Ej. Colún, L-2401, Pasillo A, CEC-LLA..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="filter-pasillo" className="block text-xs font-semibold text-slate-700 mb-1">
                Ubicación (Pasillo)
              </label>
              <select
                id="filter-pasillo"
                value={filterPasillo}
                onChange={(e) => setFilterPasillo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">Todos los Pasillos</option>
                <option value="Pasillo A">Pasillo A (Lácteos y Refrigerados)</option>
                <option value="Pasillo B">Pasillo B (Cecinas y Carnes)</option>
                <option value="Pasillo C">Pasillo C (Abarrotes y Harinas)</option>
                <option value="Pasillo D">Pasillo D (Bebidas y Licores)</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-cat" className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría de Producto
              </label>
              <select
                id="filter-cat"
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Cecinas">Cecinas</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Abarrotes">Abarrotes</option>
              </select>
            </div>
          </div>

          {/* Matrix Inventory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                    <th className="py-3 px-4">SKU / Producto</th>
                    <th className="py-3 px-4">Lote</th>
                    <th className="py-3 px-4">Ubicación Bodega</th>
                    <th className="py-3 px-4">Fecha Vencimiento</th>
                    <th className="py-3 px-4 text-center">Regla FEFO</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-center">Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                        No se encontraron lotes que coincidan con los criterios.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((lot) => {
                      const alert = evaluateInventoryAlert(lot);
                      const daysLeft = getDaysUntilExpiration(lot.fechaVencimiento);

                      return (
                        <tr
                          key={lot.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            lot.esPrioridadFEFO ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {lot.nombreProducto}
                            </div>
                            <div className="text-xs font-mono text-slate-500">
                              {lot.sku} · {lot.categoria} ({lot.unidadMedida})
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800">
                              {lot.lote}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-xs">
                            <div className="font-semibold text-slate-800">
                              {lot.pasillo}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              {lot.estante} · {lot.nivel}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-xs font-mono">
                            <div className="font-semibold text-slate-900">
                              {lot.fechaVencimiento}
                            </div>
                            <div className={`text-[11px] ${daysLeft < 15 ? 'text-red-600 font-bold' : daysLeft < 30 ? 'text-amber-700 font-bold' : 'text-slate-500'}`}>
                              {daysLeft < 0 ? 'Vencido' : `Restan ${daysLeft} días`}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {lot.esPrioridadFEFO ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-700 text-white shadow-xs animate-pulse">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>FEFO #1 Salir Primero</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                En cola
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                            <span className={lot.stockActual === 0 ? 'text-red-600' : 'text-slate-900'}>
                              {lot.stockActual}
                            </span>
                            <span className="text-xs font-normal text-slate-500 ml-1">
                              / {lot.stockMinimo} mín
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                            {formatCLP(lot.precioVentaCLP)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {alert.status === 'red' ? (
                              <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-md bg-red-100 text-red-800 border border-red-300">
                                Crítico
                              </span>
                            ) : alert.status === 'yellow' ? (
                              <span className="inline-block px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                Advertencia
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Nominal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: RECEPCIÓN DE MERCADERÍA CONTRA OC (RF-08)
          ======================================================== */}
      {activeSubTab === 'reception' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Recepción de Mercadería contra Orden de Compra
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Auditoría de Mermas y Faltantes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Seleccione una OC de un proveedor regional, registre el conteo físico real, asigne lote y fecha de vencimiento. El sistema calculará en pantalla diferencias y mermas antes de autorizar el ingreso al inventario.
            </p>
          </div>

          {/* Select OC */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="select-oc" className="block text-xs font-bold text-slate-800 mb-1">
                  Seleccionar Orden de Compra (OC) *
                </label>
                <select
                  id="select-oc"
                  value={selectedOCId}
                  onChange={(e) => setSelectedOCId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {purchaseOrders.map((oc) => (
                    <option key={oc.id} value={oc.id}>
                      {oc.numeroOC} - {oc.proveedorNombre} ({oc.estado})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOC && (
                <>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Proveedor &amp; RUT</span>
                    <span className="text-sm font-bold text-slate-900 block">{selectedOC.proveedorNombre}</span>
                    <span className="text-xs font-mono text-slate-600">{selectedOC.proveedorRUT}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium block">Destino y Estado</span>
                    <span className="text-sm font-semibold text-slate-900 block">{selectedOC.sucursalDestino}</span>
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-sm mt-0.5 ${
                      selectedOC.estado === 'Pendiente Recepción'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedOC.estado === 'Recepcionado Conforme'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedOC.estado}
                    </span>
                  </div>
                </>
              )}
            </div>

            {selectedOC?.observaciones && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
                <span className="font-bold">Instrucciones de recepción del proveedor: </span>
                {selectedOC.observaciones}
              </div>
            )}
          </div>

          {/* Reception Table with Live Differences Calculation */}
          {selectedOC && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Detalle de Ítems a Recibir en Andén
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Ingrese conteo real y valide diferencias
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                      <th className="py-3 px-4">Producto / SKU</th>
                      <th className="py-3 px-4 text-center">Cant. Pedida (OC)</th>
                      <th className="py-3 px-4 text-center">Cant. Recibida Real *</th>
                      <th className="py-3 px-4 text-center">Diferencia (Merma/Faltante)</th>
                      <th className="py-3 px-4">Lote Asignado *</th>
                      <th className="py-3 px-4">Fecha Vencimiento *</th>
                      <th className="py-3 px-4">Pasillo Destino</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOC.items.map((item) => {
                      const formVal = receptionForm[item.sku] || {
                        cantidadRecibida: item.cantidadPedida,
                        lote: 'L-NUEVO-01',
                        fechaVenc: '2027-03-31',
                        pasillo: 'Pasillo A'
                      };
                      const diff = formVal.cantidadRecibida - item.cantidadPedida;

                      return (
                        <tr key={item.sku} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{item.nombreProducto}</div>
                            <div className="text-xs font-mono text-slate-500">{item.sku}</div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-base">
                            {item.cantidadPedida}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              value={formVal.cantidadRecibida}
                              onChange={(e) =>
                                handleReceptionFieldChange(item.sku, 'cantidadRecibida', Number(e.target.value))
                              }
                              className="w-24 text-center py-1.5 px-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                            />
                          </td>

                          {/* Live Difference Badge */}
                          <td className="py-3 px-4 text-center">
                            {diff === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3.5 h-3.5" />
                                <span>Conforme (0)</span>
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Faltante ({diff} un)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <span>Excedente (+{diff} un)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={formVal.lote}
                              onChange={(e) =>
                                handleReceptionFieldChange(item.sku, 'lote', e.target.value)
                              }
                              placeholder="Ej. L-2450"
                              className="w-32 py-1.5 px-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="date"
                              value={formVal.fechaVenc}
                              onChange={(e) =>
                                handleReceptionFieldChange(item.sku, 'fechaVenc', e.target.value)
                              }
                              className="py-1.5 px-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={formVal.pasillo}
                              onChange={(e) =>
                                handleReceptionFieldChange(item.sku, 'pasillo', e.target.value)
                              }
                              className="py-1.5 px-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                            >
                              <option value="Pasillo A">Pasillo A (Lácteos)</option>
                              <option value="Pasillo B">Pasillo B (Cecinas)</option>
                              <option value="Pasillo C">Pasillo C (Abarrotes)</option>
                              <option value="Pasillo D">Pasillo D (Bebidas)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Nota de Control Interno:</span> Toda recepción generará automáticamente el registro de auditoría con sello de tiempo para el SII y control de mermas.
                </div>

                <button
                  type="button"
                  onClick={handleConfirmReception}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Procesar y Confirmar Recepción Física</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
