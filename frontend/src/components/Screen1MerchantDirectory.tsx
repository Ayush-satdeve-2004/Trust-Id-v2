import React, { useState } from 'react';
import { Merchant, AlertItem } from '../types';
import { Search, Building2, TrendingUp, CheckCircle, ArrowUpDown, ChevronRight, PlusCircle, AlertTriangle, ShieldX } from 'lucide-react';

interface Screen1Props {
  merchants: Merchant[];
  latestAlert?: AlertItem | null;
  onSelectMerchant: (merchantId: string) => void;
  onOpenOnboardModal: () => void;
}

export const Screen1MerchantDirectory: React.FC<Screen1Props> = ({
  merchants,
  latestAlert,
  onSelectMerchant,
  onOpenOnboardModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | '30_DAY_HOLD' | 'BANNED'>('ALL');
  const [sortField, setSortField] = useState<'trust_score' | 'business_name' | 'connected_at' | 'active_orders_count'>('trust_score');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredMerchants = merchants
    .filter(m => {
      const matchesSearch = 
        m.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.merchant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.merchant_fingerprint.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || m.payout_status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

  const getScoreBadge = (score: number) => {
    const formatted = score > 0 ? `+${score}` : `${score}`;
    if (score > 0) return { text: `${formatted} pts`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score === 0) return { text: `${formatted} pts`, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { text: `${formatted} pts`, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const getPayoutBadge = (status: Merchant['payout_status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Active
          </span>
        );
      case '30_DAY_HOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            30-Day Rolling Hold
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldX className="w-3 h-3 text-rose-600" />
            Banned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Live Badge/Toast alert */}
      {latestAlert && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-5 py-3.5 rounded-xl border border-blue-700 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Live Telemetry Alert · Section 12</p>
              <p className="text-sm font-medium text-slate-100">{latestAlert.title}: {latestAlert.message}</p>
            </div>
          </div>
          {latestAlert.merchant_id && (
            <button
              onClick={() => onSelectMerchant(latestAlert.merchant_id!)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-md transition shadow-xs flex items-center gap-1"
            >
              View Merchant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            Merchant Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Razorpay Controlling Authority · Point System (Baseline 0 · Increments +1 / Decrements -1)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenOnboardModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Onboard Merchant / Test Fingerprint
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Merchant ID, Business Name, or Fingerprint..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
          {(['ALL', 'ACTIVE', '30_DAY_HOLD', 'BANNED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === status
                  ? 'bg-[#0C2340] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Merchants' : status === 'ACTIVE' ? 'Active' : status === '30_DAY_HOLD' ? '30-Day Hold' : 'Banned'}
            </button>
          ))}
        </div>
      </div>

      {/* Merchant Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Merchant ID</th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => { setSortField('business_name'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    Business Name
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Date Connected</th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => { setSortField('trust_score'); setSortAsc(!sortAsc); }}>
                  <div className="flex items-center gap-1">
                    Trust Score Points
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Active Orders</th>
                <th className="py-3.5 px-4">Compliance / Disputes</th>
                <th className="py-3.5 px-4">Payout Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No merchants found matching your query.
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => {
                  const badge = getScoreBadge(merchant.trust_score);
                  return (
                    <tr
                      key={merchant.merchant_id}
                      onClick={() => onSelectMerchant(merchant.merchant_id)}
                      className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {merchant.merchant_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{merchant.business_name}</div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" title={merchant.merchant_fingerprint}>
                          FP: {merchant.merchant_fingerprint.substring(0, 16)}...
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(merchant.connected_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold ${badge.color}`}>
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{badge.text}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{merchant.active_orders_count}</span>
                        <span className="text-slate-400 text-[11px] ml-1">in flight</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{merchant.dock_scan_compliance_pct}% scan</div>
                        <div className="text-[11px] text-slate-400">{merchant.dispute_count} disputes logged</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getPayoutBadge(merchant.payout_status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                          View Profile <ChevronRight className="w-4 h-4" />
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
