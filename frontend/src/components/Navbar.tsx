import React from 'react';
import { ShieldCheck, Bell, Terminal, Mail, Server } from 'lucide-react';
import { AlertItem } from '../types';

interface NavbarProps {
  alerts: AlertItem[];
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  onOpenEmails: () => void;
  onOpenSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  alerts: _alerts,
  unreadAlertCount,
  onOpenAlerts,
  onOpenEmails,
  onOpenSimulation,
}) => {
  return (
    <header className="bg-[#0C2340] border-b border-slate-700/60 sticky top-0 z-40 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">Razorpay</span>
              <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                TRUST-ID ENGINE v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Razorpay Ops Console · Silent Autonomous AI Backend
            </p>
          </div>
        </div>

        {/* Right Actions & Badges */}
        <div className="flex items-center space-x-3">
          
          {/* SSO Auth Badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-slate-800/80 rounded-md border border-slate-700 text-xs text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSO: <strong className="text-slate-100 font-mono">ops_internal@razorpay.com</strong></span>
            <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">mTLS</span>
          </div>

          {/* Email Inbox simulator toggle */}
          <button
            onClick={onOpenEmails}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            title="View simulated customer inbox (Email 1 OTP & Email 2 Link)"
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Customer Inbox</span>
          </button>

          {/* Simulation Playground launcher */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-xs font-semibold text-white shadow-sm border border-blue-400/40 transition"
          >
            <Terminal className="w-4 h-4 text-blue-200" />
            <span>Simulate / Webhooks</span>
          </button>

          {/* Real-time Alerts Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Real-time Alerts Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#0C2340]">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
