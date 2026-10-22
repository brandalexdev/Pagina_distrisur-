import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Building2,
  Clock,
  Percent,
  Edit2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  X,
  Star
} from 'lucide-react';
import { Supplier, VolumeDiscount, ConfirmationModalConfig } from '../../types';
import { formatRUT, validateRUT } from '../../utils/chileanUtils';

interface SupplierModuleProps {
  suppliers: Supplier[];
  onSaveSupplier: (supplier: Supplier) => void;
  onRequestConfirm: (config: ConfirmationModalConfig) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const SupplierModule: React.FC<SupplierModuleProps> = ({
  suppliers,
  onSaveSupplier,
  onRequestConfirm,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubro, setSelectedRubro] = useState<string>('all');
  const [selectedPlazo, setSelectedPlazo] = useState<string>('all');

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form fields
  const [rutInput, setRutInput] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [rubro, setRubro] = useState<Supplier['rubro']>('Lácteos');
  const [contactoNombre, setContactoNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [comuna, setComuna] = useState('Temuco');
  const [plazoPago, setPlazoPago] = useState<Supplier['plazoPago']>('30 días');
  const [diasTemuco, setDiasTemuco] = useState<number>(2);
  const [diasAngol, setDiasAngol] = useState<number>(3);
  const [descuentoRango1, setDescuentoRango1] = useState('50 a 99 unidades');
  const [descuentoPct1, setDescuentoPct1] = useState<number>(4);
  const [descuentoRango2, setDescuentoRango2] = useState('>= 100 unidades');
  const [descuentoPct2, setDescuentoPct2] = useState<number>(8);

  // Available rubros
  const rubrosList: Supplier['rubro'][] = [
    'Lácteos',
    'Cecinas y Carnes',
    'Bebidas y Licores',
    'Abarrotes y Harinas',
    'Congelados',
    'Higiene'
  ];

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setRutInput('');
    setRazonSocial('');
    setRubro('Lácteos');
    setContactoNombre('');
    setTelefono('+56 2 ');
    setEmail('');
    setDireccion('');
    setComuna('Santiago (Despacho a Región)');
    setPlazoPago('30 días');
    setDiasTemuco(2);
    setDiasAngol(3);
    setDescuentoRango1('50 a 99 bultos');
    setDescuentoPct1(4);
    setDescuentoRango2('>= 100 bultos');
    setDescuentoPct2(8);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setRutInput(sup.rut);
    setRazonSocial(sup.razonSocial);
    setRubro(sup.rubro);
    setContactoNombre(sup.contactoNombre);
    setTelefono(sup.telefono);
    setEmail(sup.email);
    setDireccion(sup.direccion);
    setComuna(sup.comuna);
    setPlazoPago(sup.plazoPago);
    setDiasTemuco(sup.tiemposEntrega.diasTemuco);
    setDiasAngol(sup.tiemposEntrega.diasAngol);
    setDescuentoRango1(sup.descuentosVolumen[0]?.rango || 'Tramo 1');
    setDescuentoPct1(sup.descuentosVolumen[0]?.porcentaje || 3);
    setDescuentoRango2(sup.descuentosVolumen[1]?.rango || 'Tramo 2');
    setDescuentoPct2(sup.descuentosVolumen[1]?.porcentaje || 7);
    setIsFormOpen(true);
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRutInput(formatRUT(e.target.value));
  };

  const isRUTValid = useMemo(() => {
    if (!rutInput) return true;
    return validateRUT(rutInput);
  }, [rutInput]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRUT(rutInput)) {
      showToast('error', 'RUT Inválido', 'El RUT ingresado del proveedor no es válido.');
      return;
    }

    if (!razonSocial.trim()) {
      showToast('warning', 'Campo Requerido', 'Ingrese la Razón Social del proveedor.');
      return;
    }

    const supplierToSave: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      rut: rutInput,
      razonSocial,
      rubro,
      contactoNombre,
      telefono,
      email,
      direccion,
      comuna,
      plazoPago,
      descuentosVolumen: [
        { rango: descuentoRango1, porcentaje: Number(descuentoPct1) },
        { rango: descuentoRango2, porcentaje: Number(descuentoPct2) }
      ],
      tiemposEntrega: {
        diasTemuco: Number(diasTemuco),
        diasAngol: Number(diasAngol)
      },
      calificacionEntrega: editingSupplier ? editingSupplier.calificacionEntrega : 4.8
    };

    onRequestConfirm({
      isOpen: true,
      title: editingSupplier ? '¿Actualizar acuerdo comercial con Proveedor?' : '¿Registrar nuevo Proveedor en DistriGest?',
      message: `Se guardarán las condiciones comerciales para ${razonSocial} (Plazo ${plazoPago}, tiempos de entrega: ${diasTemuco} días Temuco, ${diasAngol} días Angol).`,
      detailItems: [
        { label: 'RUT Proveedor', value: supplierToSave.rut },
        { label: 'Razón Social', value: supplierToSave.razonSocial },
        { label: 'Rubro Comercial', value: supplierToSave.rubro },
        { label: 'Plazo Comercial', value: supplierToSave.plazoPago, isHighlight: true },
        { label: 'Descuento Escala', value: `Hasta ${descuentoPct2}% por volumen` }
      ],
      confirmText: 'Confirmar y Guardar Proveedor',
      cancelText: 'Volver a Editar',
      type: 'primary',
      onConfirm: () => {
        onSaveSupplier(supplierToSave);
        setIsFormOpen(false);
        showToast(
          'success',
          'Proveedor Registrado',
          `El proveedor "${supplierToSave.razonSocial}" fue incorporado con éxito a la red de abastecimiento.`
        );
      }
    });
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rubro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactoNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRubro = selectedRubro === 'all' || s.rubro === selectedRubro;
      const matchPlazo = selectedPlazo === 'all' || s.plazoPago === selectedPlazo;

      return matchSearch && matchRubro && matchPlazo;
    });
  }, [suppliers, searchTerm, selectedRubro, selectedPlazo]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Compras y Proveedores
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mantenedor de alianzas comerciales con fabricantes y distribuidoras matrices. Control de plazos, descuentos por escala y plazos de entrega en Temuco y Angol.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Proveedor</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label htmlFor="search-suppliers" className="block text-xs font-semibold text-slate-700 mb-1">
            Buscador de Proveedores (RUT, Razón Social, Contacto)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-suppliers"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej. Watt's, Agrosuper, CCU, 76.220..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-rubro" className="block text-xs font-semibold text-slate-700 mb-1">
            Rubro Comercial
          </label>
          <select
            id="filter-rubro"
            value={selectedRubro}
            onChange={(e) => setSelectedRubro(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Todos los Rubros</option>
            {rubrosList.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-plazo" className="block text-xs font-semibold text-slate-700 mb-1">
            Plazo de Pago
          </label>
          <select
            id="filter-plazo"
            value={selectedPlazo}
            onChange={(e) => setSelectedPlazo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Todos los Plazos</option>
            <option value="Contado">Contado</option>
            <option value="30 días">30 días</option>
            <option value="60 días">60 días</option>
            <option value="90 días">90 días</option>
          </select>
        </div>
      </div>

      {/* Supplier Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 text-xs font-semibold">
                <th className="py-3 px-4">Proveedor / RUT</th>
                <th className="py-3 px-4">Rubro</th>
                <th className="py-3 px-4">Contacto Directo</th>
                <th className="py-3 px-4 text-center">Plazo Comercial</th>
                <th className="py-3 px-4">Descuentos por Volumen</th>
                <th className="py-3 px-4 text-center">Plazo Entrega</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sup.razonSocial}</div>
                    <div className="text-xs font-mono text-slate-500">{sup.rut}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{sup.comuna}</div>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <span className="font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                      {sup.rubro}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div className="font-semibold text-slate-800">{sup.contactoNombre}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{sup.telefono}</div>
                    <div className="text-slate-500 text-[11px] truncate max-w-[160px]">{sup.email}</div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      {sup.plazoPago}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs">
                    <div className="space-y-1">
                      {sup.descuentosVolumen.map((dv, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-slate-700">
                          <span className="font-semibold text-emerald-700">-{dv.porcentaje}%</span>
                          <span className="text-slate-500 text-[11px]">({dv.rango})</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center text-xs">
                    <div className="font-bold text-slate-900 font-mono">
                      {sup.tiemposEntrega.diasTemuco}d Temuco
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {sup.tiemposEntrega.diasAngol}d Angol
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sup)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Editar proveedor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Supplier */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingSupplier ? 'Editar Acuerdo de Proveedor' : 'Registrar Nuevo Proveedor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="sup-rut" className="block text-xs font-bold text-slate-800 mb-1">
                    RUT Proveedor *
                  </label>
                  <input
                    id="sup-rut"
                    type="text"
                    required
                    value={rutInput}
                    onChange={handleRutChange}
                    placeholder="76.220.300-K"
                    className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 ${
                      isRUTValid ? 'border-slate-300 focus:ring-blue-600' : 'border-red-400 bg-red-50 text-red-900'
                    }`}
                  />
                  {!isRUTValid && (
                    <span className="text-[10px] text-red-600 font-medium">RUT no válido</span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="sup-razon" className="block text-xs font-bold text-slate-800 mb-1">
                    Razón Social *
                  </label>
                  <input
                    id="sup-razon"
                    type="text"
                    required
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej. Watt's Alimentos S.A."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sup-rubro" className="block text-xs font-bold text-slate-800 mb-1">
                    Rubro Principal *
                  </label>
                  <select
                    id="sup-rubro"
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    {rubrosList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sup-plazo" className="block text-xs font-bold text-slate-800 mb-1">
                    Plazo de Pago Negociado *
                  </label>
                  <select
                    id="sup-plazo"
                    value={plazoPago}
                    onChange={(e) => setPlazoPago(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Contado">Contado</option>
                    <option value="30 días">Crédito 30 días</option>
                    <option value="60 días">Crédito 60 días</option>
                    <option value="90 días">Crédito 90 días</option>
                  </select>
                </div>
              </div>

              {/* Delivery Lead Times */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Tiempos de Entrega / Despacho a Bodegas Regionales (Días hábiles)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dias-temuco" className="block text-xs font-medium text-slate-600 mb-1">
                      Días a Bodega Central Temuco
                    </label>
                    <input
                      id="dias-temuco"
                      type="number"
                      min={1}
                      max={30}
                      value={diasTemuco}
                      onChange={(e) => setDiasTemuco(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="dias-angol" className="block text-xs font-medium text-slate-600 mb-1">
                      Días a Bodega Zonal Angol
                    </label>
                    <input
                      id="dias-angol"
                      type="number"
                      min={1}
                      max={30}
                      value={diasAngol}
                      onChange={(e) => setDiasAngol(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Volume Discounts */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Escala de Descuentos por Volumen Negociada (%)
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label htmlFor="rango1" className="block font-medium text-slate-600 mb-1">
                      Rango Tramo 1 &amp; % Descuento
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="rango1"
                        type="text"
                        value={descuentoRango1}
                        onChange={(e) => setDescuentoRango1(e.target.value)}
                        placeholder="Ej. 20 a 50 bultos"
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={descuentoPct1}
                        onChange={(e) => setDescuentoPct1(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-center"
                      />
                      <span className="self-center font-bold text-slate-600">%</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rango2" className="block font-medium text-slate-600 mb-1">
                      Rango Tramo Mayor &amp; % Descuento
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="rango2"
                        type="text"
                        value={descuentoRango2}
                        onChange={(e) => setDescuentoRango2(e.target.value)}
                        placeholder="Ej. >= 100 bultos"
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={descuentoPct2}
                        onChange={(e) => setDescuentoPct2(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-center"
                      />
                      <span className="self-center font-bold text-slate-600">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="sup-contacto" className="block text-xs font-bold text-slate-800 mb-1">
                    Ejecutivo Comercial
                  </label>
                  <input
                    id="sup-contacto"
                    type="text"
                    value={contactoNombre}
                    onChange={(e) => setContactoNombre(e.target.value)}
                    placeholder="Ej. Rodrigo Lagos"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sup-fono" className="block text-xs font-bold text-slate-800 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="sup-fono"
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 2 2000 0000"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="sup-email" className="block text-xs font-bold text-slate-800 mb-1">
                    Email de Pedidos
                  </label>
                  <input
                    id="sup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pedidos@empresa.cl"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Condiciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
