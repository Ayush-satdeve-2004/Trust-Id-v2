import React from 'react';
import { Merchant, User } from '../types';
import { TrendingUp, ShieldCheck, AlertTriangle, ShieldX, UserCheck, PlusCircle, ArrowLeft, ChevronRight, PackageCheck, Banknote, Calendar } from 'lucide-react';

interface Screen2Props {
  merchant: Merchant;
  onBack: () => void;
  onSelectUser: (userId: string) => void;
  onOpenCreateOrder: (merchantId: string) => void;
}

export const Screen2MerchantProfile: React.FC<Screen2Props> = ({
  merchant,
  onBack,
  onSelectUser,
  onOpenCreateOrder,
}) => {
  const getScoreFormatted = (score: number) => {
    return score > 0 ? `+${score}` : `${score}`;
  };

  const getUserAccountBadge = (status: User['account_status']) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Normal
          </span>
        );
      case 'WARNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            Warned (1 Strike)
          </span>
        );
      case 'BLACKLISTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            Blacklisted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <button
              onClick={onBack}
              className="mt-1 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Back to Merchant Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{merchant.business_name}</h1>
                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200">
                  {merchant.merchant_id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Permanent Fingerprint: <span className="text-slate-700">{merchant.merchant_fingerprint}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Permanent onboard date: {new Date(merchant.connected_at).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Current Score & Points */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Trust Score (Points)</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-3xl font-black ${merchant.trust_score > 0 ? 'text-emerald-600' : merchant.trust_score === 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {getScoreFormatted(merchant.trust_score)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">pts (0 baseline)</span>
              </div>
            </div>
            
            {/* Sparkline */}
            <div className="h-10 w-28 flex items-end gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200">
              {merchant.score_trend_30d.map((pt, idx) => {
                const heightPct = Math.min(100, Math.max(20, (pt.score + 5) * 15));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end" title={`${pt.date}: ${getScoreFormatted(pt.score)} pts`}>
                    <div
                      className={`w-full rounded-xs transition-all ${
                        pt.score > 0 ? 'bg-emerald-500' : pt.score === 0 ? 'bg-blue-500' : 'bg-rose-500'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <PackageCheck className="w-4 h-4 text-blue-600" />
              Dock-Scan Compliance
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{merchant.dock_scan_compliance_pct}%</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Mandated for &gt;₹2,000</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Dispute Count
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">{merchant.dispute_count}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Bait-and-switch / Mismatch</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Banknote className="w-4 h-4 text-emerald-600" />
              Refunds This Month
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{merchant.refund_amount_this_month.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Settled via Razorpay</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Payout Status
            </div>
            <div className="mt-1.5">
              {merchant.payout_status === 'ACTIVE' && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Active
                </span>
              )}
              {merchant.payout_status === '30_DAY_HOLD' && (
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  30-Day Rolling Hold
                </span>
              )}
              {merchant.payout_status === 'BANNED' && (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  Banned
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Per Section 9 Matrix</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Customers (Users) of {merchant.business_name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict Drill-Down Level 2: Click a customer to inspect their scoped Trust-ID orders and warning history.
            </p>
          </div>
          <button
            onClick={() => onOpenCreateOrder(merchant.merchant_id)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Create Checkout Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">User ID (Hashed Identifier)</th>
                <th className="py-3.5 px-4">Customer Points</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Total Orders (Trust-IDs)</th>
                <th className="py-3.5 px-4">Last Order Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {merchant.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers have ordered from this merchant yet. Create an order to begin.
                  </td>
                </tr>
              ) : (
                merchant.users.map((user) => {
                  const ptsStr = user.user_trust_score > 0 ? `+${user.user_trust_score}` : `${user.user_trust_score}`;
                  return (
                    <tr
                      key={user.user_id}
                      onClick={() => onSelectUser(user.user_id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-600">{user.user_id}</div>
                        <div className="text-[10px] text-slate-400">Zero raw PII exposed in console UI</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
                          user.user_trust_score > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : user.user_trust_score === 0 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{ptsStr} pts</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getUserAccountBadge(user.account_status)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {user.trust_ids.length} orders
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(user.last_order_date).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                          View User Orders <ChevronRight className="w-4 h-4" />
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
