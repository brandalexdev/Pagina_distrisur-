import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { UserRole, UserProfile } from '../../types';
import { SIMULATED_USERS } from '../../data/mockData';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  offlineQueueCount: number;
  onSyncOfflineQueue: () => void;
  alertCount: number;
  onNavigateToAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  isOnline,
  onToggleOnline,
  offlineQueueCount,
  onSyncOfflineQueue,
  alertCount,
  onNavigateToAlerts
}) => {
  const currentUser = SIMULATED_USERS.find((u) => u.role === currentRole) || SIMULATED_USERS[0];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Corporate Brand Logo & Name (No description) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white flex items-center justify-center shadow-sm shrink-0 border border-blue-600/30">
          <svg
            className="w-5 h-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Geometric distribution cube & route symbol */}
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 12v10" />
            <path d="m8 5 8 4.5" stroke="#93c5fd" strokeWidth="2.5" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            DistriSur <span className="text-blue-700 font-extrabold">DistriGest</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 hidden sm:inline-block">
            Araucanía
          </span>
        </div>
      </div>

      {/* Right controls: Online/Offline Toggle + Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Offline / Online state toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={onToggleOnline}
            title={isOnline ? "Haga clic para simular pérdida de red en ruta rural" : "Haga clic para reconectar en línea"}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              isOnline
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-amber-600 text-white shadow-xs animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Online (Central Temuco)</span>
                <span className="md:hidden">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Modo Offline</span>
              </>
            )}
          </button>

          {!isOnline && (
            <button
              type="button"
              onClick={onSyncOfflineQueue}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Sincronizar cambios locales acumulados"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Sincronizar ({offlineQueueCount})</span>
            </button>
          )}

          {isOnline && (
            <span className="text-[11px] text-slate-600 font-medium px-2 hidden lg:inline">
              Sincronizado 100%
            </span>
          )}
        </div>

        {/* Inventory Critical Alert notification button */}
        <button
          type="button"
          onClick={onNavigateToAlerts}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Ver panel de alertas de inventario y vencimiento"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full ring-2 ring-white">
              {alertCount}
            </span>
          )}
        </button>

        {/* Role Selector dropdown / switcher */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <label htmlFor="role-select" className="sr-only">
            Seleccionar Rol Simulado
          </label>
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-tight">
              {currentUser.title}
            </span>
          </div>

          <div className="relative">
            <select
              id="role-select"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer pr-7"
            >
              <option value="gerencia">Rol: Gerencia</option>
              <option value="vendedor">Rol: Vendedor en Terreno</option>
              <option value="bodega">Rol: Operario de Bodega</option>
              <option value="finanzas">Rol: Finanzas / Crédito</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
