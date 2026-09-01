import React from 'react';
import { ChevronRight, Home, Building2, User, FileText } from 'lucide-react';

interface BreadcrumbsProps {
  currentScreen: number; // 1 | 2 | 3 | 4
  merchantId?: string;
  merchantName?: string;
  userId?: string;
  trustId?: string;
  onNavigate: (screen: number) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentScreen,
  merchantId,
  merchantName,
  userId,
  trustId,
  onNavigate,
}) => {
  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium py-3 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-xs">
      {/* Root: Razorpay Directory */}
      <button
        onClick={() => onNavigate(1)}
        className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
          currentScreen === 1 ? 'text-blue-600 font-semibold' : 'text-slate-600'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Razorpay</span>
      </button>

      {/* Level 2: Merchant */}
      {currentScreen >= 2 && merchantId && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => onNavigate(2)}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              currentScreen === 2 ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate max-w-[140px] sm:max-w-[220px]" title={merchantName || merchantId}>
              {merchantName || merchantId}
            </span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">
              {merchantId.split('_').slice(-1)[0]}
            </span>
          </button>
        </>
      )}

      {/* Level 3: User */}
      {currentScreen >= 3 && userId && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => onNavigate(3)}
            className={`flex items-center gap-1.5 hover:text-blue-600 transition ${
              currentScreen === 3 ? 'text-blue-600 font-semibold' : 'text-slate-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{userId}</span>
          </button>
        </>
      )}

      {/* Level 4: Trust-ID */}
      {currentScreen === 4 && trustId && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-[11px]">{trustId}</span>
          </div>
        </>
      )}
    </nav>
  );
};
