import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { ConfirmationModalConfig } from '../../types';

interface ConfirmModalProps {
  config: ConfirmationModalConfig;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ config, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && config.isOpen) {
        if (config.onCancel) config.onCancel();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  if (!config.isOpen) return null;

  const getIcon = () => {
    switch (config.type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" aria-hidden="true" />;
      case 'primary':
      default:
        return <HelpCircle className="w-6 h-6 text-blue-600" aria-hidden="true" />;
    }
  };

  const getConfirmButtonClasses = () => {
    switch (config.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
      case 'primary':
      default:
        return 'bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-500';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-left transform transition-all">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 shrink-0">
              {getIcon()}
            </div>
            <div>
              <h3 id="modal-headline" className="text-lg font-semibold text-slate-900 tracking-tight">
                {config.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirmación de operación requerida
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (config.onCancel) config.onCancel();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {config.message}
          </p>

          {/* Optional Key Detail Breakdown */}
          {config.detailItems && config.detailItems.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              {config.detailItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">{item.label}:</span>
                  <span className={`font-semibold ${item.isHighlight ? 'text-blue-700 text-sm' : 'text-slate-800'} font-mono`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (config.onCancel) config.onCancel();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition-colors cursor-pointer"
          >
            {config.cancelText || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => {
              config.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer ${getConfirmButtonClasses()}`}
          >
            {config.confirmText || 'Confirmar Acción'}
          </button>
        </div>
      </div>
    </div>
  );
};
