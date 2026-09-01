import React from 'react';
import { User, Merchant, TrustID } from '../types';
import { ArrowLeft, TrendingUp, AlertTriangle, ShieldCheck, ShieldX, Clock, ChevronRight, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface Screen3Props {
  merchant: Merchant;
  user: User;
  onBack: () => void;
  onSelectTrustId: (trustId: string) => void;
}

export const Screen3UserProfile: React.FC<Screen3Props> = ({
  merchant,
  user,
  onBack,
  onSelectTrustId,
}) => {
  const getScoreFormatted = (score: number) => {
    return score > 0 ? `+${score}` : `${score}`;
  };

  const getStateBadge = (state: TrustID['state']) => {
    switch (state) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Handover
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Disputed
          </span>
        );
      case 'EXPIRED_NOT_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
            Expired (Non-Delivery)
          </span>
        );
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d in Vault`;
  };

  return (
    <div className="space-y-6">

      {/* Header Profile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={onBack}
              className="mt-1 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Back to Merchant Profile"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{user.user_id}</h1>
                {user.account_status === 'NORMAL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Account Status: Normal
                  </span>
                )}
                {user.account_status === 'WARNED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Account Status: Warned (1 Strike)
                  </span>
                )}
                {user.account_status === 'BLACKLISTED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <ShieldX className="w-3.5 h-3.5 text-rose-600" />
                    Account Status: Blacklisted
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scoped to Merchant: <strong className="text-slate-800">{merchant.business_name}</strong> ({merchant.merchant_id})
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                🔒 PII Privacy Shield Active: Raw name/phone/email obscured from console operators.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customer Trust Points</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-3xl font-black ${user.user_trust_score > 0 ? 'text-emerald-600' : user.user_trust_score === 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {getScoreFormatted(user.user_trust_score)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8.1 Warning & Escalation History Drawer */}
        {user.warning_logs && user.warning_logs.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Section 8.1 Formal Warning & Escalation Audit Log
            </h3>
            <div className="space-y-2">
              {user.warning_logs.map((log) => (
                <div key={log.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs flex items-start justify-between">
                  <div>
                    <span className="font-bold text-rose-900">{log.level === 'BLACKLIST_ESCALATION' ? '🚨 BLACKLIST REPORTED' : '⚠️ FORMAL WARNING'}</span>
                    <p className="text-slate-700 mt-0.5">{log.reason}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">{new Date(log.timestamp).toLocaleString('en-IN')}</p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                    -{log.points_deducted} pt
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scoped Trust-IDs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Trust-ID Orders for this Merchant ({user.trust_ids.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Drill-Down Level 3: Select a Trust-ID to inspect its 8-step verification pipeline and PDF dossier.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Trust-ID (Order Token)</th>
                <th className="py-3.5 px-4">Order ID & Summary</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Vault Retention Countdown</th>
                <th className="py-3.5 px-4">Current State</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {user.trust_ids.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No Trust-IDs recorded for this user.
                  </td>
                </tr>
              ) : (
                user.trust_ids.map((tid) => {
                  const isExpired = tid.state === 'EXPIRED_NOT_VERIFIED';
                  return (
                    <tr
                      key={tid.trust_id}
                      onClick={() => onSelectTrustId(tid.trust_id)}
                      className={`cursor-pointer transition group ${
                        isExpired ? 'bg-slate-50/80 opacity-70 hover:opacity-100' : 'hover:bg-blue-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {tid.trust_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{tid.order_meta.order_id}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">{tid.order_meta.items_summary}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {tid.order_meta.currency} {tid.order_meta.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(tid.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] rounded border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {getDaysRemaining(tid.expires_at)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStateBadge(tid.state)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                          Inspect 8-Step Tracker <ChevronRight className="w-4 h-4" />
                        </span>
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
  );
};
