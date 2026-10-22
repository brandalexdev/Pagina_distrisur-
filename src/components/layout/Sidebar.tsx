import React from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  FileText,
  Truck,
  BarChart3,
  MapPin,
  ShieldCheck,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavTab = 'overview' | 'clients' | 'inventory' | 'billing' | 'suppliers' | 'reports';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  alertCount
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Resumen Ejecutivo',
      sublabel: 'KPIs y Operación General',
      icon: LayoutDashboard,
      roles: ['gerencia', 'vendedor', 'bodega', 'finanzas']
    },
    {
      id: 'clients' as NavTab,
      label: 'Clientes y Crédito',
      sublabel: 'Catálogo, Zonas y Límites',
      icon: Users,
      roles: ['gerencia', 'vendedor', 'finanzas']
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventario y Bodega',
      sublabel: 'Control de Stock, FEFO y OCs',
      icon: Boxes,
      badge: alertCount > 0 ? `${alertCount}` : undefined,
      badgeColor: 'bg-red-600 text-white',
      roles: ['gerencia', 'bodega', 'vendedor']
    },
    {
      id: 'billing' as NavTab,
      label: 'Facturación DTE',
      sublabel: 'Emisión SII (Facturas y Guías)',
      icon: FileText,
      roles: ['gerencia', 'finanzas', 'vendedor']
    },
    {
      id: 'suppliers' as NavTab,
      label: 'Compras y Proveedores',
      sublabel: 'Condiciones y Descuentos',
      icon: Truck,
      roles: ['gerencia', 'finanzas', 'bodega']
    },
    {
      id: 'reports' as NavTab,
      label: 'Reportes y Comisiones',
      sublabel: 'Ventas y Liquidación Mensual',
      icon: BarChart3,
      roles: ['gerencia', 'finanzas', 'vendedor']
    }
  ];

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'vendedor':
        return { label: 'Vendedor en Terreno', color: 'bg-emerald-100 text-emerald-800' };
      case 'bodega':
        return { label: 'Operario de Bodega', color: 'bg-amber-100 text-amber-800' };
      case 'finanzas':
        return { label: 'Finanzas y Crédito', color: 'bg-purple-100 text-purple-800' };
      case 'gerencia':
      default:
        return { label: 'Acceso Total: Gerencia', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <aside className="w-64 sm:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Context Notification Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>Vista de Rol Activa</span>
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1.5 flex-1" aria-label="Navegación principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHighlightedForRole = item.roles.includes(currentRole);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white font-medium shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-700'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                  <div
                    className={`text-[11px] truncate leading-normal mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {item.sublabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[11px] font-bold rounded-md ${
                      isActive ? 'bg-white text-blue-700' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-white" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer info: Regional Headquarters info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-blue-700" />
          <span>Red Zonal Araucanía</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          • Bodega Central: Temuco (Av. Rudecindo Ortega)
        </p>
        <p className="text-[11px] text-slate-500 leading-tight">
          • Sucursal Zonal: Angol (Parque Industrial)
        </p>
      </div>
    </aside>
  );
};
