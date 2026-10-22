import React, { useState, useMemo } from 'react';
import { UserRole, Client, InventoryLot, PurchaseOrder, Supplier, DTEInvoice, SalesRecord, SellerCommissionData, ToastMessage, ConfirmationModalConfig } from './types';
import {
  INITIAL_CLIENTS,
  INITIAL_INVENTORY,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS,
  INITIAL_DTE_INVOICES,
  INITIAL_SALES_RECORDS,
  INITIAL_SELLER_COMMISSIONS
} from './data/mockData';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ExecutiveOverview } from './components/modules/ExecutiveOverview';
import { ClientModule } from './components/modules/ClientModule';
import { InventoryModule } from './components/modules/InventoryModule';
import { BillingModule } from './components/modules/BillingModule';
import { SupplierModule } from './components/modules/SupplierModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { evaluateInventoryAlert } from './utils/chileanUtils';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentRole, setCurrentRole] = useState<UserRole>('gerencia');

  // Online / Offline Simulation State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);

  // Application Data States (in-memory)
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [inventory, setInventory] = useState<InventoryLot[]>(INITIAL_INVENTORY);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [dteInvoices, setDteInvoices] = useState<DTEInvoice[]>(INITIAL_DTE_INVOICES);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(INITIAL_SALES_RECORDS);
  const [sellerCommissions, setSellerCommissions] = useState<SellerCommissionData[]>(INITIAL_SELLER_COMMISSIONS);

  // Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmationModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper to show toasts
  const showToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Critical Inventory Alerts Count
  const criticalAlertCount = useMemo(() => {
    return inventory.filter((l) => {
      const evalAlert = evaluateInventoryAlert(l);
      return evalAlert.status === 'red' || evalAlert.status === 'yellow';
    }).length;
  }, [inventory]);

  // Online / Offline Toggle
  const handleToggleOnline = () => {
    if (isOnline) {
      setIsOnline(false);
      showToast(
        'warning',
        'Modo Offline Activado',
        'El sistema ha entrado en modo desconectado (simulando falta de cobertura en ruta rural entre Temuco y Angol). Las operaciones se guardarán localmente.'
      );
    } else {
      setIsOnline(true);
      showToast(
        'success',
        'Conexión Restablecida',
        'Reconectado exitosamente con el servidor central de Temuco y enlace SII.'
      );
      if (offlineQueue.length > 0) {
        handleSyncOfflineQueue();
      }
    }
  };

  // Sync Offline Queue
  const handleSyncOfflineQueue = () => {
    const count = offlineQueue.length;
    setOfflineQueue([]);
    showToast(
      'success',
      'Sincronización Exitosa',
      `Se sincronizaron ${count} transacciones pendientes con la base central regional.`
    );
  };

  // Record an offline event if not online
  const registerAction = (actionDesc: string) => {
    if (!isOnline) {
      setOfflineQueue((prev) => [...prev, actionDesc]);
    }
  };

  // Client updates
  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
    registerAction(`Registro cliente ${client.razonSocial}`);
  };

  // Inventory update
  const handleUpdateInventory = (updatedLots: InventoryLot[]) => {
    setInventory(updatedLots);
    registerAction('Actualización de lotes de inventario');
  };

  // Purchase Order update
  const handleUpdatePurchaseOrder = (updatedOC: PurchaseOrder) => {
    setPurchaseOrders((prev) =>
      prev.map((oc) => (oc.id === updatedOC.id ? updatedOC : oc))
    );
    registerAction(`Recepción OC ${updatedOC.numeroOC}`);
  };

  // Supplier update
  const handleSaveSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === supplier.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = supplier;
        return copy;
      }
      return [supplier, ...prev];
    });
    registerAction(`Proveedor ${supplier.razonSocial}`);
  };

  // DTE Invoice Emission
  const handleEmitDTE = (invoice: DTEInvoice) => {
    setDteInvoices((prev) => [invoice, ...prev]);

    // Also deduct stock from inventory for sold products
    setInventory((prev) => {
      const newInv = [...prev];
      invoice.items.forEach((item) => {
        const lotIndex = newInv.findIndex((l) => l.sku === item.sku);
        if (lotIndex >= 0) {
          const current = newInv[lotIndex];
          newInv[lotIndex] = {
            ...current,
            stockActual: Math.max(0, current.stockActual - item.cantidad)
          };
        }
      });
      return newInv;
    });

    // Also append to sales records for analytics
    const newSales: SalesRecord[] = invoice.items.map((item, idx) => ({
      id: `sale-${invoice.folio}-${idx}`,
      fecha: invoice.fechaEmision,
      folioDTE: invoice.folio,
      clienteNombre: invoice.clienteNombre,
      clienteRUT: invoice.clienteRUT,
      zona:
        invoice.clienteComuna.toLowerCase().includes('angol') ||
        invoice.clienteComuna.toLowerCase().includes('victoria')
          ? 'Angol'
          : 'Temuco',
      vendedor: invoice.vendedor,
      productoSKU: item.sku,
      productoNombre: item.descripcion,
      categoria: 'Abarrotes',
      cantidad: item.cantidad,
      montoTotalCLP: item.subtotalCLP,
      costoTotalCLP: Math.round(item.subtotalCLP * 0.72),
      margenCLP: Math.round(item.subtotalCLP * 0.28)
    }));

    setSalesRecords((prev) => [...newSales, ...prev]);
    registerAction(`Emisión DTE Folio ${invoice.folio}`);
  };

  // Commission updates
  const handleUpdateCommissions = (updated: SellerCommissionData[]) => {
    setSellerCommissions(updated);
    registerAction('Liquidación de comisiones de venta');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Fixed / Sticky Header with Role & Offline Indicator */}
      <Header
        currentRole={currentRole}
        onRoleChange={(role) => {
          setCurrentRole(role);
          showToast('info', 'Rol de Usuario Cambiado', `Ahora está visualizando como: ${role.toUpperCase()}`);
        }}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        offlineQueueCount={offlineQueue.length}
        onSyncOfflineQueue={handleSyncOfflineQueue}
        alertCount={criticalAlertCount}
        onNavigateToAlerts={() => setActiveTab('inventory')}
      />

      {/* Main Layout: Fixed Sidebar + Main Content Viewport */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Fixed Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          currentRole={currentRole}
          alertCount={criticalAlertCount}
        />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeTab === 'overview' && (
            <ExecutiveOverview
              currentRole={currentRole}
              clients={clients}
              inventory={inventory}
              dteInvoices={dteInvoices}
              sellerCommissions={sellerCommissions}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientModule
              clients={clients}
              onSaveClient={handleSaveClient}
              onRequestConfirm={(cfg) => setConfirmModalConfig(cfg)}
              showToast={showToast}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryModule
              inventory={inventory}
              purchaseOrders={purchaseOrders}
              onUpdateInventory={handleUpdateInventory}
              onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
              onRequestConfirm={(cfg) => setConfirmModalConfig(cfg)}
              showToast={showToast}
            />
          )}

          {activeTab === 'billing' && (
            <BillingModule
              clients={clients}
              inventory={inventory}
              dteInvoices={dteInvoices}
              onEmitDTE={handleEmitDTE}
              onRequestConfirm={(cfg) => setConfirmModalConfig(cfg)}
              showToast={showToast}
            />
          )}

          {activeTab === 'suppliers' && (
            <SupplierModule
              suppliers={suppliers}
              onSaveSupplier={handleSaveSupplier}
              onRequestConfirm={(cfg) => setConfirmModalConfig(cfg)}
              showToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsModule
              salesRecords={salesRecords}
              sellerCommissions={sellerCommissions}
              onUpdateCommissions={handleUpdateCommissions}
              onRequestConfirm={(cfg) => setConfirmModalConfig(cfg)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Confirmation Modal */}
      <ConfirmModal
        config={confirmModalConfig}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
