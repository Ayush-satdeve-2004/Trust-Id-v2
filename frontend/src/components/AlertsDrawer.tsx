import React from 'react';
import { AlertItem } from '../types';
import { Bell, X, ShieldAlert, CheckCircle, AlertTriangle, ShieldX, FileText, ChevronRight } from 'lucide-react';

interface AlertsDrawerProps {
  alerts: AlertItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMerchant: (merchantId: string) => void;
  onSelectTrustId: (trustId: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  alerts,
  isOpen,
  onClose,
  onSelectMerchant,
  onSelectTrustId,
}) => {
  if (!isOpen) return null;

  const getAlertIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'danger':
        return <ShieldX className="w-4 h-4 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBorderColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'danger':
        return 'border-rose-300 bg-rose-50/50';
      case 'warning':
        return 'border-amber-300 bg-amber-50/50';
      case 'success':
        return 'border-emerald-300 bg-emerald-50/50';
      default:
        return 'border-blue-200 bg-blue-50/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-10 animate-slideLeft">
        
        {/* Header */}
        <div className="p-5 bg-[#0C2340] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold">Real-Time Alerts Feed</h2>
              <p className="text-[11px] text-slate-400">Section 12 Engine Event Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No live telemetry alerts at this moment.
            </div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition ${getBorderColor(alt.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                    {getAlertIcon(alt.severity)}
                    <span>{alt.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed text-[11px]">{alt.message}</p>

                {/* Direct Action jump buttons */}
                <div className="pt-1 flex items-center gap-2">
                  {alt.merchant_id && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectMerchant(alt.merchant_id!);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                    >
                      Inspect Merchant <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  {alt.trust_id && (
                    <button
                      onClick={() => {
                        onClose();
                        onSelectTrustId(alt.trust_id!);
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                    >
                      Inspect Trust-ID <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
