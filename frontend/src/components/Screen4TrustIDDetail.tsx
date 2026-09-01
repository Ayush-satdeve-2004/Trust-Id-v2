import React, { useState } from 'react';
import { TrustID, Merchant, User, StepColor } from '../types';
import { 
  ArrowLeft, 
  FileDown, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  MapPin, 
  Package, 
  Key, 
  Camera, 
  TrendingUp, 
  Lock,
  ExternalLink,
  Radio,
  FileCheck
} from 'lucide-react';

interface Screen4Props {
  trustId: TrustID;
  merchant: Merchant;
  user: User;
  onBack: () => void;
  onOpenCustomerVerification: (trustId: string) => void;
}

export const Screen4TrustIDDetail: React.FC<Screen4Props> = ({
  trustId,
  merchant,
  user,
  onBack,
  onOpenCustomerVerification,
}) => {
  const [downloading, setDownloading] = useState(false);

  const stepsMeta = [
    {
      id: 'order_id',
      stepNum: 1,
      title: 'Order ID Capture',
      desc: 'Captured from Razorpay checkout webhook',
      status: trustId.steps_status.order_id,
      value: trustId.order_meta.order_id,
    },
    {
      id: 'amount',
      stepNum: 2,
      title: 'Settled Amount',
      desc: 'Payment captured & settled amount confirmed',
      status: trustId.steps_status.amount,
      value: `${trustId.order_meta.currency} ${trustId.order_meta.amount.toFixed(2)}`,
    },
    {
      id: 'address',
      stepNum: 3,
      title: 'Delivery Address Lock',
      desc: 'Address locked at checkout, matched against courier manifest',
      status: trustId.steps_status.address,
      value: trustId.order_meta.delivery_address || 'Locked & Sealed',
    },
    {
      id: 'tracking',
      stepNum: 4,
      title: 'Order Location Tracking',
      desc: 'Live courier GPS webhook telemetry stream',
      status: trustId.steps_status.tracking,
      value: trustId.doorstep_telemetry.in_geofence ? 'Entered Delivery Geofence (<800m)' : `${Math.round(trustId.doorstep_telemetry.distance_to_dest_m)}m away`,
    },
    {
      id: 'sla_days',
      stepNum: 5,
      title: 'Delivery SLA (Days)',
      desc: 'Parcel handed over within the promised SLA window',
      status: trustId.steps_status.sla_days,
      value: 'Promised 2-day SLA compliant',
    },
    {
      id: 'points',
      stepNum: 6,
      title: 'Points & Reputation Matrix',
      desc: 'Reputation delta computed for merchant & customer (Section 9)',
      status: trustId.steps_status.points,
      value: `Merchant: ${trustId.reputation_delta.merchant_delta >= 0 ? '+' : ''}${trustId.reputation_delta.merchant_delta} | Customer: ${trustId.reputation_delta.customer_delta >= 0 ? '+' : ''}${trustId.reputation_delta.customer_delta}`,
    },
    {
      id: 'digital_signature',
      stepNum: 7,
      title: 'Digital Signature & OTP',
      desc: 'Doorstep OTP / proxy PIN successfully cryptographically verified',
      status: trustId.steps_status.digital_signature,
      value: trustId.otp_meta.verified ? `Verified (Code: ${trustId.otp_meta.otp_code})` : 'Pending Doorstep Confirmation',
    },
    {
      id: 'before_after_images',
      stepNum: 8,
      title: 'Before / After CV Images',
      desc: 'Dock photo hash vs. doorstep photo hash compared by CV model',
      status: trustId.steps_status.before_after_images,
      value: trustId.doorstep_telemetry.cv_similarity_score 
        ? `${((trustId.doorstep_telemetry.cv_similarity_score) * 100).toFixed(0)}% Visual Match` 
        : 'Dock Baseline Sealed (Step 8)',
    },
  ];

  const getStepBadge = (status: StepColor) => {
    switch (status) {
      case 'GREEN':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'AMBER':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending / In Progress
          </span>
        );
      case 'GREY':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Not Reached
          </span>
        );
    }
  };

  const handleDownloadDossier = async () => {
    setDownloading(true);
    try {
      window.open(`/api/trust-id/${trustId.trust_id}/dossier.pdf`, '_blank');
    } catch (err) {
      console.error('Failed to export dossier:', err);
    } finally {
      setDownloading(false);
    }
  };

  const allStepsGreen = Object.values(trustId.steps_status).every(s => s === 'GREEN');

  return (
    <div className="space-y-6">

      {/* Top Header & Dossier Action */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <button
              onClick={onBack}
              className="mt-1 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Back to User Profile"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{trustId.trust_id}</h1>
                
                {trustId.state === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Overall State: VERIFIED
                  </span>
                )}
                {trustId.state === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                    <Clock className="w-4 h-4" />
                    Overall State: PENDING
                  </span>
                )}
                {trustId.state === 'DISPUTED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                    <XCircle className="w-4 h-4" />
                    Overall State: DISPUTED
                  </span>
                )}
                {trustId.state === 'EXPIRED_NOT_VERIFIED' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-600 text-white shadow-xs">
                    Overall State: EXPIRED (Non-Delivery)
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-mono">
                <span>Order: <strong className="text-slate-800">{trustId.order_meta.order_id}</strong></span>
                <span>•</span>
                <span>Merchant: <strong className="text-slate-800">{merchant.business_name}</strong></span>
                <span>•</span>
                <span>User: <strong className="text-slate-800">{user.user_id}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {trustId.state === 'PENDING' && (
              <button
                onClick={() => onOpenCustomerVerification(trustId.trust_id)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition"
              >
                <ExternalLink className="w-4 h-4" />
                Open 3-Option Customer Form
              </button>
            )}

            <button
              onClick={handleDownloadDossier}
              disabled={downloading}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition ${
                allStepsGreen || trustId.state === 'VERIFIED' || trustId.state === 'DISPUTED'
                  ? 'bg-[#0C2340] hover:bg-[#031B33] text-white border border-slate-700'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>{allStepsGreen ? 'Generate Dossier PDF (Section 13)' : 'Export Bank Dispute Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Dispute / Outcome Resolution Banner if completed */}
        {trustId.reputation_delta && trustId.reputation_delta.dispute_liability && (
          <div className={`mt-5 p-4 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            trustId.state === 'VERIFIED'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                {trustId.state === 'VERIFIED' ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                Outcome Resolution: {trustId.verification_outcome}
              </div>
              <p className="mt-0.5 text-slate-700">{trustId.reputation_delta.reason}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">
                Assigned Liability: <strong className="text-slate-900">{trustId.reputation_delta.dispute_liability}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 bg-white/80 p-3 rounded-lg border border-slate-200/80">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Merchant Delta</span>
                <span className={`text-sm font-black ${trustId.reputation_delta.merchant_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trustId.reputation_delta.merchant_delta >= 0 ? '+' : ''}{trustId.reputation_delta.merchant_delta} pts
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer Delta</span>
                <span className={`text-sm font-black ${trustId.reputation_delta.customer_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trustId.reputation_delta.customer_delta >= 0 ? '+' : ''}{trustId.reputation_delta.customer_delta} pts
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8-Step Interactive Tracker (Section 5.4) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              8-Step Handwritten Trust-ID Verification Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each step remains Grey until machine-confirmed by the autonomous AI engine, then turns Green.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-400 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Grey = Waiting</span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Amber = Pending</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Green = Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stepsMeta.map((step) => {
            const isGreen = step.status === 'GREEN';
            const isAmber = step.status === 'AMBER';
            const cardBorder = isGreen ? 'border-emerald-200 bg-emerald-50/30' : isAmber ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-slate-50/50';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${cardBorder}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isGreen ? 'bg-emerald-600 text-white' : isAmber ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.stepNum}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{step.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                    <p className="text-[11px] font-mono font-medium text-slate-800 mt-2 bg-white/80 px-2 py-1 rounded border border-slate-200/80">
                      {step.value}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  {getStepBadge(step.status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Telemetry Deep-Dive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dock Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Warehouse Dock Telemetry (Step 1-3 Dispatch Baseline)
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Dock Station ID</span>
              <span className="font-mono font-bold text-slate-800">{trustId.warehouse_dock_telemetry.dock_id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Scanned Barcode</span>
              <span className="font-mono font-bold text-slate-800">{trustId.warehouse_dock_telemetry.scanned_barcode}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Package Net Weight</span>
              <span className="font-mono font-bold text-slate-800">{trustId.warehouse_dock_telemetry.package_weight_kg} kg</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cryptographic Seal</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED CRYPTO SEAL
              </span>
            </div>
            <div className="flex flex-col py-1.5">
              <span className="text-slate-500">Dock Photo SHA-256 Hash</span>
              <span className="font-mono text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1 break-all">
                {trustId.warehouse_dock_telemetry.photo_hash}
              </span>
            </div>
          </div>
        </div>

        {/* Doorstep & Geofence Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Doorstep Telemetry & Geofence GPS (Step 4, 5, 7, 8)
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Courier</span>
              <span className="font-semibold text-slate-800">{trustId.doorstep_telemetry.courier_name} ({trustId.doorstep_telemetry.carrier})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Geofence Proximity</span>
              <span className="font-mono font-bold text-slate-800">
                {Math.round(trustId.doorstep_telemetry.distance_to_dest_m)}m (Geofence Threshold: 800m)
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Geofence Status</span>
              <span className={`font-bold ${trustId.doorstep_telemetry.in_geofence ? 'text-emerald-600' : 'text-amber-600'}`}>
                {trustId.doorstep_telemetry.in_geofence ? 'INSIDE 800m GEOFENCE (ACTIVE)' : 'IN-TRANSIT'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">RSA-4096 Signature</span>
              <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                {trustId.doorstep_telemetry.rsa_signature || 'Awaiting Handover'}
              </span>
            </div>
            <div className="flex flex-col py-1.5">
              <span className="text-slate-500">Doorstep CV Image Hash</span>
              <span className="font-mono text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1 break-all">
                {trustId.doorstep_telemetry.doorstep_photo_hash || 'Awaiting Doorstep Scan Capture'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
