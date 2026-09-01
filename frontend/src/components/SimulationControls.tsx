import React, { useState } from 'react';
import { Terminal, X, Zap, ShieldAlert, ShieldCheck, CheckCircle2, MapPin, Mail, AlertTriangle, ExternalLink, Bot, RefreshCw, Sparkles, Copy, Check } from 'lucide-react';
import { Merchant } from '../types';

interface SimulationControlsProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: Merchant[];
  onSelectTrustId: (trustId: string) => void;
  onOpenEmails: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isOpen,
  onClose,
  merchants,
  onSelectTrustId,
  onOpenEmails,
}) => {
  if (!isOpen) return null;

  const [selectedTrustId, setSelectedTrustId] = useState<string>('');
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; customerLink?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Collect all Trust-IDs across merchants
  const allTrustIds: { trust_id: string; order_id: string; merchant_name: string; state: string }[] = [];
  merchants.forEach(m => {
    m.users.forEach(u => {
      u.trust_ids.forEach(t => {
        allTrustIds.push({
          trust_id: t.trust_id,
          order_id: t.order_meta.order_id,
          merchant_name: m.business_name,
          state: t.state,
        });
      });
    });
  });

  const activeTid = selectedTrustId || (allTrustIds[0]?.trust_id || '');

  // AI Autonomous End-to-End Automation Pipeline
  const handleRunAiAutonomousFlow = async (outcome: 'A_SAME' | 'B_DIFFERENT' | 'C_MISMATCH' = 'A_SAME') => {
    if (!activeTid) return;
    setRunningAction(`ai_${outcome}`);
    setFeedback(null);

    try {
      const res = await fetch('/api/simulation/auto-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_id: activeTid,
          outcome,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const customerUrl = `${window.location.origin}/verify?token=${data.geofence.email2.verification_url?.split('token=')[1]}&trustId=${activeTid}`;
        setFeedback({
          type: 'success',
          message: data.message,
          customerLink: customerUrl,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Automation failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRunningAction(null);
    }
  };

  // 1. Simulate Geofence Entry Webhook
  const handleTriggerGeofence = async () => {
    if (!activeTid) return;
    setRunningAction('geofence');
    setFeedback(null);

    try {
      const res = await fetch('/api/webhooks/courier-gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_id: activeTid,
          lat: 12.9718,
          lng: 77.5948,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const token = data.email2?.verification_url ? new URL(data.email2.verification_url).searchParams.get('token') : '';
        const customerUrl = `${window.location.origin}/verify?token=${token}&trustId=${activeTid}`;
        setFeedback({
          type: 'success',
          message: `🎯 Geofence entry recorded (<800m)! Steps 4 & 5 turned Green. Email 1 (OTP: ${data.trustId.otp_meta.otp_code}) & Email 2 Link sent to customer.`,
          customerLink: customerUrl,
        });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to trigger geofence' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRunningAction(null);
    }
  };

  // 2. Submit Verification Option (A, B, or C) with is_simulation flag (Fixes 400 error)
  const handleSimulateOutcome = async (outcome: 'A_SAME' | 'B_DIFFERENT' | 'C_MISMATCH') => {
    if (!activeTid) return;
    setRunningAction(outcome);
    setFeedback(null);

    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trust_id: activeTid,
          outcome,
          is_simulation: true, // Simulation flag prevents 400 Bad Request error
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `✅ Outcome ${outcome} processed for ${activeTid}! Trust-ID state: ${data.trustId.state}. Reputation deltas applied & PDF synthesized.`,
        });
      } else {
        setFeedback({ type: 'error', message: data.message || data.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRunningAction(null);
    }
  };

  // 3. Section 8.2 Non-Delivery Expiry Timeout
  const handleTriggerNonDeliveryExpiry = async () => {
    if (!activeTid) return;
    setRunningAction('expiry');
    setFeedback(null);

    try {
      const res = await fetch('/api/simulation/trigger-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_id: activeTid }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `⏱ Trust-ID ${activeTid} timed out with 0 telemetry! Fault defaulted to merchant (-15 score) per Section 8.2.`,
        });
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-10 animate-slideLeft">
        
        {/* Header */}
        <div className="p-5 bg-[#0C2340] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Bot className="w-6 h-6 text-sky-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold">Autonomous AI Backend Engine &amp; Webhook Suite</h2>
              <p className="text-[11px] text-slate-400">Silent AI Engine (Layer B) · Customer Form URL Generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          
          {/* Target Selector */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Order (Trust-ID)
            </label>
            <select
              value={activeTid}
              onChange={(e) => setSelectedTrustId(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            >
              {allTrustIds.map((t) => (
                <option key={t.trust_id} value={t.trust_id}>
                  {t.trust_id} ({t.order_id} · {t.merchant_name} · {t.state})
                </option>
              ))}
            </select>
          </div>

          {/* Feedback & Customer Link Card */}
          {feedback && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-start gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{feedback.message}</p>
                </div>
              </div>

              {/* Email 2 Customer Dedicated Webpage Link */}
              {feedback.customerLink && (
                <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    Dedicated Customer Verification Webpage (Email 2 Link):
                  </span>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-emerald-200">
                    <span className="font-mono text-[10px] text-slate-700 truncate flex-1">{feedback.customerLink}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(feedback.customerLink!);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600"
                      title="Copy Customer Webpage Link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={feedback.customerLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] flex items-center gap-1"
                    >
                      Open Webpage <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Autonomous Full Automation Card */}
          <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl border border-indigo-700 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs">AI Autonomous Full Pipeline Automation</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-500/30">
                Layer B Silent AI
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Executes the complete autonomous sequence in 1 click: Geofence GPS (<span className="text-sky-300">800m</span>) → OTP generation → Email 1 &amp; 2 dispatch → Outcome verification → Score recalculation → PDF dossier synthesis.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleRunAiAutonomousFlow('A_SAME')}
                disabled={runningAction !== null}
                className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition"
              >
                {runningAction === 'ai_A_SAME' ? 'Running AI...' : 'Auto-Run Option A'}
              </button>
              <button
                onClick={() => handleRunAiAutonomousFlow('B_DIFFERENT')}
                disabled={runningAction !== null}
                className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg transition"
              >
                {runningAction === 'ai_B_DIFFERENT' ? 'Running AI...' : 'Auto-Run Option B'}
              </button>
              <button
                onClick={() => handleRunAiAutonomousFlow('C_MISMATCH')}
                disabled={runningAction !== null}
                className="py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg transition"
              >
                {runningAction === 'ai_C_MISMATCH' ? 'Running AI...' : 'Auto-Run Option C'}
              </button>
            </div>
          </div>

          {/* Individual Step Simulations */}
          <div className="space-y-4 pt-2">
            
            {/* Step 1: Geofence Entry */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  1. Courier GPS Geofence Webhook (~800m)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Module 7 / Step 4</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Simulates courier arriving at destination (<span className="font-mono text-slate-800">35m away</span>). Turns Steps 4 &amp; 5 Green, generates OTP, and dispatches Email 1 &amp; Email 2 Link.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleTriggerGeofence}
                  disabled={runningAction !== null}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{runningAction === 'geofence' ? 'Entering Geofence...' : 'Trigger Geofence Entry Webhook'}</span>
                </button>
                <button
                  onClick={onOpenEmails}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-lg transition flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>View Inbox</span>
                </button>
              </div>
            </div>

            {/* Step 2: Verification Outcomes */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                2. Simulate 3-Option Verification Outcomes
              </span>
              <p className="text-slate-600 text-[11px]">
                Simulates customer submitting their selection on the dedicated webpage. Updates 8-step matrix, resolves scores per Section 9, and auto-generates ISO/IEC Bank Dispute Dossier PDF.
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={() => handleSimulateOutcome('A_SAME')}
                  disabled={runningAction !== null}
                  className="p-2.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold rounded-lg text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-emerald-800 block">Option A — Product is the same</span>
                    <span className="text-[10px] text-slate-500">Clean handover: +2 pts merchant, +2 pts user, state VERIFIED.</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>

                <button
                  onClick={() => handleSimulateOutcome('B_DIFFERENT')}
                  disabled={runningAction !== null}
                  className="p-2.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-950 font-semibold rounded-lg text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-rose-800 block">Option B — Product is different (Bait-and-Switch)</span>
                    <span className="text-[10px] text-slate-500">Merchant liability: -15 pts, 100% shipping hold, user full refund.</span>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                </button>

                <button
                  onClick={() => handleSimulateOutcome('C_MISMATCH')}
                  disabled={runningAction !== null}
                  className="p-2.5 bg-white hover:bg-amber-50 border border-amber-300 text-amber-950 font-semibold rounded-lg text-left transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-amber-800 block">Option C — Variant / Spec Mismatch</span>
                    <span className="text-[10px] text-slate-500">Merchant -5 pts, return logistics assigned for replacement.</span>
                  </div>
                  <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                </button>
              </div>
            </div>

            {/* Step 3: Non-Delivery Timeout */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                3. Section 8.2 Non-Delivery Expiry Timeout
              </span>
              <p className="text-slate-600 text-[11px]">
                Simulates 132-day lifecycle expiry with zero telemetry received. Fault automatically defaults to merchant liability.
              </p>
              <button
                onClick={handleTriggerNonDeliveryExpiry}
                disabled={runningAction !== null}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition"
              >
                Trigger Non-Delivery Expiry Timeout
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
