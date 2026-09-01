export type StepColor = 'GREY' | 'AMBER' | 'GREEN';

export interface StepsStatus {
  order_id: StepColor;
  amount: StepColor;
  address: StepColor;
  tracking: StepColor;
  sla_days: StepColor;
  points: StepColor;
  digital_signature: StepColor;
  before_after_images: StepColor;
}

export type TrustIDState = 'PENDING' | 'VERIFIED' | 'EXPIRED_NOT_VERIFIED' | 'DISPUTED';

export type VerificationOutcome = 
  | 'A_SAME' 
  | 'B_DIFFERENT' 
  | 'C_MISMATCH' 
  | 'NO_TELEMETRY' 
  | 'PENDING';

export type PayoutStatus = 'ACTIVE' | '30_DAY_HOLD' | 'BANNED';
export type UserAccountStatus = 'NORMAL' | 'WARNED' | 'BLACKLISTED';

export interface OrderMeta {
  order_id: string;
  amount: number;
  currency: string;
  items_summary: string;
  customer_name?: string;
  delivery_address?: string;
  created_at: string;
}

export interface WarehouseDockTelemetry {
  dock_id: string;
  timestamp: string;
  scanned_barcode: string;
  package_weight_kg: number;
  photo_hash: string;
  photo_preview?: string;
  operator_id: string;
  dock_seal_verified: boolean;
}

export interface DoorstepTelemetry {
  courier_id: string;
  courier_name: string;
  carrier: string;
  gps_lat: number;
  gps_lng: number;
  target_lat: number;
  target_lng: number;
  distance_to_dest_m: number;
  in_geofence: boolean;
  geofence_entered_at?: string;
  handover_timestamp?: string;
  doorstep_photo_hash?: string;
  doorstep_photo_preview?: string;
  rsa_signature?: string;
  cv_similarity_score?: number;
}

export interface OtpMeta {
  otp_code: string;
  form_token: string;
  dispatched_at?: string;
  expires_at?: string;
  attempts: number;
  max_attempts: number;
  verified: boolean;
}

export interface ReputationDelta {
  merchant_score_before: number;
  merchant_score_after: number;
  merchant_delta: number;
  customer_score_before: number;
  customer_score_after: number;
  customer_delta: number;
  reason?: string;
  dispute_liability?: string;
  applied_at?: string;
}

export interface TrustID {
  trust_id: string;
  merchant_id: string;
  user_id: string;
  order_meta: OrderMeta;
  warehouse_dock_telemetry: WarehouseDockTelemetry;
  doorstep_telemetry: DoorstepTelemetry;
  otp_meta: OtpMeta;
  verification_outcome: VerificationOutcome;
  steps_status: StepsStatus;
  state: TrustIDState;
  expires_at: string;
  reputation_delta: ReputationDelta;
  created_at: string;
  dossier_pdf_url?: string | null;
  dossier_generated_at?: string | null;
  notes?: string;
}

export interface UserWarningLog {
  id: string;
  timestamp: string;
  reason: string;
  level: 'FORMAL_WARNING' | 'BLACKLIST_ESCALATION';
  trust_id?: string;
  points_deducted: number;
}

export interface User {
  user_id: string; // USR_HASH_...
  raw_name: string; // kept private from console
  raw_email: string; // kept private
  raw_phone: string; // kept private
  user_trust_score: number;
  account_status: UserAccountStatus;
  offense_count: number;
  warning_logs: UserWarningLog[];
  created_at: string;
  last_order_date: string;
  trust_ids: TrustID[];
}

export interface MerchantScoreTrend {
  date: string;
  score: number;
}

export interface Merchant {
  merchant_id: string; // MID_RZP_<REGION>_<8-CHAR-BASE36>
  business_name: string;
  pan: string;
  gstin: string;
  bank_account_number: string;
  business_registration_number: string;
  merchant_fingerprint: string;
  connected_at: string;
  trust_score: number;
  payout_status: PayoutStatus;
  dock_scan_compliance_pct: number;
  dispute_count: number;
  refund_amount_this_month: number;
  score_trend_30d: MerchantScoreTrend[];
  active_orders_count: number;
  users: User[];
}

export interface AlertItem {
  id: string;
  timestamp: string;
  type: 'NEW_MERCHANT' | 'MERCHANT_RECONNECTED' | 'EXPIRING_NO_TELEMETRY' | 'BLACKLIST_ESCALATION' | 'PAYOUT_FREEZE' | 'DOSSIER_GENERATED';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  merchant_id?: string;
  user_id?: string;
  trust_id?: string;
  acknowledged?: boolean;
}
