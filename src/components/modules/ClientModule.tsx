import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit2,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  DollarSign,
  X,
  FileCheck
} from 'lucide-react';
import { Client, ChileanZone, ConfirmationModalConfig } from '../../types';
import { formatCLP, formatRUT, validateRUT } from '../../utils/chileanUtils';

interface ClientModuleProps {
  clients: Client[];
  onSaveClient: (client: Client) => void;
  onRequestConfirm: (config: ConfirmationModalConfig) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const ClientModule: React.FC<ClientModuleProps> = ({
  clients,
  onSaveClient,
  onRequestConfirm,
  showToast
}) => {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields
  const [rutInput, setRutInput] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [giro, setGiro] = useState('');
  const [direccionDespacho, setDireccionDespacho] = useState('');
  const [comuna, setComuna] = useState('Temuco');
  const [zona, setZona] = useState<ChileanZone>('Temuco');
  const [vendedorAsignado, setVendedorAsignado] = useState('Juan Pablo Morales');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [lineaCreditoCLP, setLineaCreditoCLP] = useState<number>(5000000);
  const [plazoPagoDias, setPlazoPagoDias] = useState<number>(30);
  const [estadoCredito, setEstadoCredito] = useState<'Al día' | 'Observado' | 'Bloqueado'>('Al día');

  // Detailed View modal
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // Chilean Zones and Sellers
  const availableZones: ChileanZone[] = ['Temuco', 'Angol', 'Cautín', 'Malleco'];
  const availableSellers = [
    'Juan Pablo Morales',
    'Carolina Sandoval',
    'Marcela Henríquez',
    'Rodrigo Nahuelpan'
  ];

  // Open Form to Add New Client
  const handleOpenAdd = () => {
    setEditingClient(null);
    setRutInput('');
    setRazonSocial('');
    setGiro('');
    setDireccionDespacho('');
    setComuna('Temuco');
    setZona('Temuco');
    setVendedorAsignado('Juan Pablo Morales');
    setContactoNombre('');
    setContactoCargo('Encargado de Compras');
    setContactoTelefono('+56 9 ');
    setContactoEmail('');
    setLineaCreditoCLP(5000000);
    setPlazoPagoDias(30);
    setEstadoCredito('Al día');
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setRutInput(client.rut);
    setRazonSocial(client.razonSocial);
    setGiro(client.giro);
    setDireccionDespacho(client.direccionDespacho);
    setComuna(client.comuna);
    setZona(client.zona);
    setVendedorAsignado(client.vendedorAsignado);
    setContactoNombre(client.contacto.nombre);
    setContactoCargo(client.contacto.cargo);
    setContactoTelefono(client.contacto.telefono);
    setContactoEmail(client.contacto.email);
    setLineaCreditoCLP(client.lineaCreditoCLP);
    setPlazoPagoDias(client.plazoPagoDias);
    setEstadoCredito(client.estadoCredito);
    setIsFormOpen(true);
  };

  // Handle RUT input format on blur or change
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRutInput(formatRUT(raw));
  };

  const isRUTValid = useMemo(() => {
    if (!rutInput) return true; // not filled yet
    return validateRUT(rutInput);
  }, [rutInput]);

  // Form submission with Confirmation Modal
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRUT(rutInput)) {
      showToast('error', 'RUT Inválido', 'El RUT ingresado no cumple con el algoritmo Módulo 11 del SII.');
      return;
    }

    if (!razonSocial.trim()) {
      showToast('warning', 'Campo Obligatorio', 'Debe ingresar la Razón Social del cliente.');
      return;
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      rut: rutInput,
      razonSocial,
      giro: giro || 'Comercio General',
      direccionDespacho,
      comuna,
      zona,
      vendedorAsignado,
      contacto: {
        nombre: contactoNombre || 'Contacto Comercial',
        cargo: contactoCargo || 'Administración',
        telefono: contactoTelefono || '+56 9 0000 0000',
        email: contactoEmail || 'contacto@empresa.cl'
      },
      lineaCreditoCLP: Number(lineaCreditoCLP) || 0,
      creditoUtilizadoCLP: editingClient ? editingClient.creditoUtilizadoCLP : 0,
      plazoPagoDias: Number(plazoPagoDias) || 30,
      estadoCredito,
      fechaRegistro: editingClient ? editingClient.fechaRegistro : new Date().toISOString().split('T')[0]
    };

    // Trigger critical confirmation modal (RF Usabilidad)
    onRequestConfirm({
      isOpen: true,
      title: editingClient ? '¿Confirmar actualización de Cliente?' : '¿Guardar nuevo Cliente en DistriGest?',
      message: `Está a punto de registrar las condiciones comerciales y línea de crédito para ${razonSocial} en la zona de ${zona}.`,
      detailItems: [
        { label: 'RUT Empresa', value: clientToSave.rut },
        { label: 'Razón Social', value: clientToSave.razonSocial },
        { label: 'Zona Geográfica', value: clientToSave.zona },
        { label: 'Vendedor Responsable', value: clientToSave.vendedorAsignado },
        { label: 'Línea de Crédito', value: formatCLP(clientToSave.lineaCreditoCLP), isHighlight: true },
        { label: 'Plazo Comercial', value: `${clientToSave.plazoPagoDias} días` }
      ],
      confirmText: editingClient ? 'Guardar Cambios' : 'Registrar Cliente',
      cancelText: 'Volver a Revisar',
      type: 'primary',
      onConfirm: () => {
        onSaveClient(clientToSave);
        setIsFormOpen(false);
        showToast(
          'success',
          'Cliente Guardado',
          `El cliente "${clientToSave.razonSocial}" (${clientToSave.rut}) fue registrado con éxito en la base regional.`
        );
      }
    });
  };

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        c.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.giro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.comuna.toLowerCase().includes(searchTerm.toLowerCase());

      const matchZone = selectedZone === 'all' || c.zona === selectedZone;
      const matchSeller = selectedSeller === 'all' || c.vendedorAsignado === selectedSeller;

      return matchSearch && matchZone && matchSeller;
    });
  }, [clients, searchTerm, selectedZone, selectedSeller]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Section Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Clientes, Precios y Crédito
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de cartera regional para Cautín y Malleco (Temuco, Padre Las Casas, Angol y comunas aledañas).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter Bar with Live Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label htmlFor="search-clients" className="block text-xs font-semibold text-slate-700 mb-1">
            Buscador en Tiempo Real (RUT, Razón Social, Comuna)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-clients"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej. El Trébol, 76.842.190, Angol, Villarrica..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* Filter Zone */}
        <div>
          <label htmlFor="filter-zone" className="block text-xs font-semibold text-slate-700 mb-1">
            Filtrar por Zona Geográfica
          </label>
          <select
            id="filter-zone"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Todas las Zonas ({clients.length})</option>
            {availableZones.map((z) => (
              <option key={z} value={z}>
                Zona {z}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Seller */}
        <div>
          <label htmlFor="filter-seller" className="block text-xs font-semibold text-slate-700 mb-1">
            Filtrar por Vendedor Asignado
          </label>
          <select
            id="filter-seller"
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Todos los Vendedores</option>
            {availableSellers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Interactive Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Cartera de Clientes ({filteredClients.length} encontrados)
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Mostrando resultados con disponibilidad de crédito y estado tributario
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                <th className="py-3 px-4">RUT / Razón Social</th>
                <th className="py-3 px-4">Giro Comercial</th>
                <th className="py-3 px-4">Zona / Comuna</th>
                <th className="py-3 px-4">Vendedor</th>
                <th className="py-3 px-4 text-right">Línea de Crédito</th>
                <th className="py-3 px-4 text-right">Crédito Ocupado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                    No se encontraron clientes que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const creditPercent = Math.min(
                    100,
                    Math.round((client.creditoUtilizadoCLP / client.lineaCreditoCLP) * 100)
                  );

                  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (client.estadoCredito === 'Observado') {
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                  } else if (client.estadoCredito === 'Bloqueado') {
                    badgeColor = 'bg-red-100 text-red-800 border-red-300';
                  }

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedClientDetail(client)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {client.razonSocial}
                        </div>
                        <div className="text-xs font-mono text-slate-500 font-medium">
                          {client.rut}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {client.giro}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{client.zona}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-5">
                          {client.comuna}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                        {client.vendedorAsignado}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCLP(client.lineaCreditoCLP)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className="text-slate-800 font-medium">
                          {formatCLP(client.creditoUtilizadoCLP)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {creditPercent}% ocupado
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md border ${badgeColor}`}>
                          {client.estadoCredito}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingClient ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Complete los datos legales, de contacto y condiciones comerciales en La Araucanía.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Row 1: RUT & Razón Social */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="client-rut" className="block text-xs font-bold text-slate-800 mb-1">
                    RUT Empresa (con dígito verificador) *
                  </label>
                  <input
                    id="client-rut"
                    type="text"
                    required
                    value={rutInput}
                    onChange={handleRutChange}
                    placeholder="76.123.456-7"
                    className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-hidden focus:ring-2 ${
                      isRUTValid
                        ? 'border-slate-300 focus:ring-blue-600'
                        : 'border-red-400 bg-red-50 focus:ring-red-500 text-red-900'
                    }`}
                  />
                  {!isRUTValid && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">
                      Dígito verificador inválido (Módulo 11)
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="client-razon" className="block text-xs font-bold text-slate-800 mb-1">
                    Razón Social Completa *
                  </label>
                  <input
                    id="client-razon"
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej. Distribuidora del Valle Limitada"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 2: Giro & Dirección Despacho */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="client-giro" className="block text-xs font-bold text-slate-800 mb-1">
                    Giro Comercial SII *
                  </label>
                  <input
                    id="client-giro"
                    type="text"
                    required
                    value={giro}
                    onChange={(e) => setGiro(e.target.value)}
                    placeholder="Ej. Venta al por menor de abarrotes y bebidas"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="client-dir" className="block text-xs font-bold text-slate-800 mb-1">
                    Dirección de Despacho (Calle y Número) *
                  </label>
                  <input
                    id="client-dir"
                    type="text"
                    required
                    value={direccionDespacho}
                    onChange={(e) => setDireccionDespacho(e.target.value)}
                    placeholder="Ej. Av. Balmaceda 1240"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Comuna, Zona Geográfica, Vendedor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="client-comuna" className="block text-xs font-bold text-slate-800 mb-1">
                    Comuna de Destino *
                  </label>
                  <input
                    id="client-comuna"
                    type="text"
                    required
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Temuco, Angol, Villarrica, etc."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label htmlFor="client-zona" className="block text-xs font-bold text-slate-800 mb-1">
                    Zona Geográfica DistriSur *
                  </label>
                  <select
                    id="client-zona"
                    value={zona}
                    onChange={(e) => setZona(e.target.value as ChileanZone)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    {availableZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="client-vendedor" className="block text-xs font-bold text-slate-800 mb-1">
                    Vendedor Asignado *
                  </label>
                  <select
                    id="client-vendedor"
                    value={vendedorAsignado}
                    onChange={(e) => setVendedorAsignado(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    {availableSellers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Contact Details */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Información del Contacto Comercial
                </span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="contacto-nombre" className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Contacto
                    </label>
                    <input
                      id="contacto-nombre"
                      type="text"
                      value={contactoNombre}
                      onChange={(e) => setContactoNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="contacto-cargo" className="block text-xs font-semibold text-slate-700 mb-1">
                      Cargo
                    </label>
                    <input
                      id="contacto-cargo"
                      type="text"
                      value={contactoCargo}
                      onChange={(e) => setContactoCargo(e.target.value)}
                      placeholder="Encargado de compras"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="contacto-telefono" className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      id="contacto-telefono"
                      type="text"
                      value={contactoTelefono}
                      onChange={(e) => setContactoTelefono(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="contacto-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      id="contacto-email"
                      type="email"
                      value={contactoEmail}
                      onChange={(e) => setContactoEmail(e.target.value)}
                      placeholder="contacto@negocio.cl"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Credit & Commercial Terms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="linea-credito" className="block text-xs font-bold text-slate-800 mb-1">
                    Línea de Crédito Autorizada ($ CLP) *
                  </label>
                  <input
                    id="linea-credito"
                    type="number"
                    min={0}
                    step={100000}
                    value={lineaCreditoCLP}
                    onChange={(e) => setLineaCreditoCLP(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Equivale a {formatCLP(lineaCreditoCLP)}
                  </p>
                </div>

                <div>
                  <label htmlFor="plazo-pago" className="block text-xs font-bold text-slate-800 mb-1">
                    Plazo de Pago (Días) *
                  </label>
                  <select
                    id="plazo-pago"
                    value={plazoPagoDias}
                    onChange={(e) => setPlazoPagoDias(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={0}>Contado / Transferencia Inmediata</option>
                    <option value={15}>Crédito 15 días</option>
                    <option value={30}>Crédito 30 días</option>
                    <option value={45}>Crédito 45 días</option>
                    <option value={60}>Crédito 60 días</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="estado-credito" className="block text-xs font-bold text-slate-800 mb-1">
                    Estado de Cuenta Corriente *
                  </label>
                  <select
                    id="estado-credito"
                    value={estadoCredito}
                    onChange={(e) => setEstadoCredito(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Al día">Al día (Habilitado para pedidos)</option>
                    <option value="Observado">Observado (Requiere autorización)</option>
                    <option value="Bloqueado">Bloqueado (Mora o morosidad)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Continuar y Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClientDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedClientDetail.razonSocial}
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  RUT: {selectedClientDetail.rut} · Giro: {selectedClientDetail.giro}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Dirección y Logística
                  </span>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedClientDetail.direccionDespacho}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Comuna: {selectedClientDetail.comuna} · Zona: {selectedClientDetail.zona}
                  </div>
                  <div className="text-xs text-blue-700 font-semibold mt-1">
                    Vendedor: {selectedClientDetail.vendedorAsignado}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Contacto Directo
                  </span>
                  <div className="text-sm font-medium text-slate-900">
                    {selectedClientDetail.contacto.nombre} ({selectedClientDetail.contacto.cargo})
                  </div>
                  <div className="text-xs font-mono text-slate-700 mt-1">
                    {selectedClientDetail.contacto.telefono}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedClientDetail.contacto.email}
                  </div>
                </div>
              </div>

              {/* Credit Status Box */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Situación Crediticia
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white text-blue-800 border border-blue-300">
                    Plazo: {selectedClientDetail.plazoPagoDias} días
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center pt-2">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">Línea Total</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatCLP(selectedClientDetail.lineaCreditoCLP)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">Crédito Ocupado</span>
                    <span className="text-sm font-bold font-mono text-amber-700">
                      {formatCLP(selectedClientDetail.creditoUtilizadoCLP)}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block">Saldo Disponible</span>
                    <span className="text-sm font-bold font-mono text-emerald-700">
                      {formatCLP(
                        Math.max(
                          0,
                          selectedClientDetail.lineaCreditoCLP - selectedClientDetail.creditoUtilizadoCLP
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClientDetail(null);
                  handleOpenEdit(selectedClientDetail);
                }}
                className="px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
              >
                Editar Cliente
              </button>
              <button
                type="button"
                onClick={() => setSelectedClientDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
