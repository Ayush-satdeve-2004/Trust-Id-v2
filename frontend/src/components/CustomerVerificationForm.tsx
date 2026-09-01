import React, { useState, useEffect } from 'react';
import { VerificationOutcome, TrustID } from '../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Clock, PackageCheck, ArrowRight, Lock, Key } from 'lucide-react';

interface CustomerVerificationFormProps {
  trustId: string;
  token?: string;
  onClose?: () => void;
  onVerificationSuccess?: (trustId: TrustID) => void;
}

export const CustomerVerificationForm: React.FC<CustomerVerificationFormProps> = ({
  trustId,
  token = '',
  onClose,
  onVerificationSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [otp, setOtp] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<VerificationOutcome | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [verifiedRecord, setVerifiedRecord] = useState<TrustID | null>(null);

  useEffect(() => {
    fetchSessionDetails();
  }, [trustId, token]);

  const fetchSessionDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // First fetch trustId info from console API to get token if not passed
      const res = await fetch(`/api/trust-id/${trustId}`);
      const data = await res.json();
      if (data.success) {
        setDetails({
          order_id: data.trustId.order_meta.order_id,
          merchant_name: data.merchant.business_name,
          amount: data.trustId.order_meta.amount,
          currency: data.trustId.order_meta.currency,
          items_summary: data.trustId.order_meta.items_summary,
          delivery_address: data.trustId.order_meta.delivery_address,
          form_token: token || data.trustId.otp_meta.form_token,
          is_verified: data.trustId.otp_meta.verified,
        });
        if (data.trustId.otp_meta.verified) {
          setVerifiedRecord(data.trustId);
          setSuccessMsg('This package has already been verified.');
        }
      } else {
        setErrorMsg(data.error || 'Failed to load verification session');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !selectedOutcome || !details?.form_token) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: details.form_token,
          trust_id: trustId,
          otp: otp.trim(),
          outcome: selectedOutcome,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifiedRecord(data.trustId);
        setSuccessMsg(
          selectedOutcome === 'A_SAME'
            ? '✅ Handover verified successfully! Product match confirmed.'
            : selectedOutcome === 'B_DIFFERENT'
            ? '⚠️ Bait-and-switch dispute logged. Merchant liability applied and refund triggered.'
            : '⚠️ Variant mismatch logged. Return shipping request issued to merchant.'
        );
        if (onVerificationSuccess) {
          onVerificationSuccess(data.trustId);
        }
      } else {
        setErrorMsg(data.message || data.error || 'Verification failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !otp.trim() || otp.trim().length < 6 || !selectedOutcome || loading || !!verifiedRecord;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
      
      {/* Header */}
      <div className="bg-[#0C2340] text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Razorpay Trust Handover</h2>
              <p className="text-xs text-blue-200 font-mono">Doorstep 3-Option Verification Form (Email 2 Link)</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        
        {/* Order Card */}
        {details && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-start text-xs">
              <div>
                <span className="text-slate-400 font-medium">Merchant:</span>
                <span className="font-bold text-slate-800 ml-1">{details.merchant_name}</span>
              </div>
              <div className="font-mono text-blue-600 font-bold">
                Order #{details.order_id}
              </div>
            </div>
            
            <div className="text-xs font-semibold text-slate-900">
              {details.items_summary}
            </div>

            <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
              <span>Payable Amount:</span>
              <strong className="text-slate-900">{details.currency} {Number(details.amount).toFixed(2)}</strong>
            </div>

            {/* Simulation convenience pill */}
            {details.otp_hint && !verifiedRecord && (
              <div className="mt-2 bg-blue-50 text-blue-800 text-[11px] p-2 rounded border border-blue-200 flex items-center justify-between">
                <span>💡 Email 1 OTP (Simulated Inbox): <strong className="font-mono text-blue-900">{details.otp_hint}</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(details.otp_hint)}
                  className="underline font-bold text-blue-700 hover:text-blue-900"
                >
                  Auto-fill
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs space-y-2">
            <div className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
            {verifiedRecord && (
              <p className="text-[11px] text-emerald-800">
                Audit verdict: <strong className="font-mono">{verifiedRecord.verification_outcome}</strong>. The Trust-ID console has updated in real-time.
              </p>
            )}
          </div>
        )}

        {/* Form Controls */}
        {!verifiedRecord && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Enter OTP from Email 1 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                Step 1: Enter 6-Digit OTP (From Email 1)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 749201"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                🔒 Validated server-side. Fails after 3 attempts with automated Section 8.1 escalation.
              </p>
            </div>

            {/* 2. Three 3-Option Outcome Choices (Section 7) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-blue-600" />
                Step 2: Choose Exactly One Outcome
              </label>

              <div className="space-y-2.5">
                
                {/* Option A */}
                <label
                  className={`flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    selectedOutcome === 'A_SAME'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="A_SAME"
                    checked={selectedOutcome === 'A_SAME'}
                    onChange={() => setSelectedOutcome('A_SAME')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="text-xs font-bold text-slate-900 block">
                      Option A — "Product is the same"
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Matches order & description perfectly. Clean delivery confirmed (+ve points).
                    </span>
                  </div>
                </label>

                {/* Option B */}
                <label
                  className={`flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    selectedOutcome === 'B_DIFFERENT'
                      ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="B_DIFFERENT"
                    checked={selectedOutcome === 'B_DIFFERENT'}
                    onChange={() => setSelectedOutcome('B_DIFFERENT')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="ml-3">
                    <span className="text-xs font-bold text-slate-900 block">
                      Option B — "Product is different"
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Wrong item entirely. Treated as bait-and-switch (100% merchant liability + payout hold).
                    </span>
                  </div>
                </label>

                {/* Option C */}
                <label
                  className={`flex items-start p-3.5 rounded-xl border-2 cursor-pointer transition ${
                    selectedOutcome === 'C_MISMATCH'
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="C_MISMATCH"
                    checked={selectedOutcome === 'C_MISMATCH'}
                    onChange={() => setSelectedOutcome('C_MISMATCH')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="ml-3">
                    <span className="text-xs font-bold text-slate-900 block">
                      Option C — "Same order, but size/description does not match"
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Right item, wrong variant/spec. Return shipping assigned to merchant for replacement.
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition ${
                isSubmitDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Validating Handover Cryptography...' : 'Submit Verification Handover'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>
        )}

      </div>

      {/* Footer Disclaimer */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 text-[11px] text-slate-500 text-center">
        🔒 Single-use signed session scoped strictly to this transaction. Zero external login required.
      </div>

    </div>
  );
};
