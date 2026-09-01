import React, { useState } from 'react';
import { Building2, X, Fingerprint, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface OnboardMerchantModalProps {
  onClose: () => void;
  onSuccess: (merchantId: string) => void;
}

export const OnboardMerchantModal: React.FC<OnboardMerchantModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [registrationNum, setRegistrationNum] = useState('');
  const [region, setRegion] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePreloadSample = (type: 'new' | 'duplicate') => {
    if (type === 'new') {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setBusinessName(`Nexus Retail Labs ${rand} Pvt Ltd`);
      setPan(`NEXUS${rand}K`);
      setGstin(`27NEXUS${rand}K1Z4`);
      setBankAccount(`SBIN000${rand}9981`);
      setRegistrationNum(`U72200MH2024PTC${rand}`);
    } else {
      // Preloads existing fingerprint from AeroCraft
      setBusinessName('AeroCraft Electronics Pvt Ltd (Re-connecting)');
      setPan('AABCE1234F');
      setGstin('27AABCE1234F1Z5');
      setBankAccount('HDFC0001234987654');
      setRegistrationNum('U72900KA2021PTC145000');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch('/api/webhooks/merchant-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          pan,
          gstin,
          bank_account_number: bankAccount,
          business_registration_number: registrationNum,
          region,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to onboard merchant');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Merchant Onboarding &amp; Fingerprint Engine</h2>
              <p className="text-xs text-slate-400">Section 3: Permanent ID Minting &amp; Structural Deduplication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Quick Preload buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Quick Test:</span>
            <button
              type="button"
              onClick={() => handlePreloadSample('new')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition"
            >
              Fill Fresh Merchant Credentials
            </button>
            <button
              type="button"
              onClick={() => handlePreloadSample('duplicate')}
              className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold px-2.5 py-1 rounded transition"
            >
              Test Duplicate Collision Block
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs space-y-2">
              <div className="font-bold text-sm flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {result.isNew ? 'New Permanent Merchant ID Issued!' : 'Duplicate Fingerprint Blocked & Re-linked!'}
              </div>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded border border-emerald-200 space-y-1">
                <div>Merchant ID: <strong className="text-blue-700">{result.merchant_id}</strong></div>
                <div>Fingerprint Hash: {result.merchant_fingerprint.substring(0, 32)}...</div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSuccess(result.merchant_id);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  View Merchant Profile →
                </button>
              </div>
            </div>
          )}

          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Business Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme HyperRetail India Pvt Ltd"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    required
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="e.g. AABCE1234F"
                    className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 27AABCE1234F1Z5"
                    className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Settlement Bank Account
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="e.g. HDFC0001234987654"
                    className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Business Registration / CIN
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNum}
                    onChange={(e) => setRegistrationNum(e.target.value.toUpperCase())}
                    placeholder="e.g. U72900KA2021PTC145000"
                    className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Computing SHA-256 Fingerprint...' : 'Compute Fingerprint & Issue Permanent ID'}</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
