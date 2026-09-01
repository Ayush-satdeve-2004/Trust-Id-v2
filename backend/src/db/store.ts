import { Merchant, User, TrustID, AlertItem, StepsStatus, VerificationOutcome } from '../types/index.js';
import { computeMerchantFingerprint, generateMerchantId } from '../services/fingerprintService.js';
import { evaluateTrustScoreDelta } from '../services/scoringEngine.js';
import { processUserOffense } from '../services/warningEngine.js';
import { emailDispatcher } from '../services/geofenceEmailDispatcher.js';
import { generateDisputeDossierPdf } from '../services/dossierPdfGenerator.js';
import crypto from 'crypto';

class TrustStore {
  private merchants: Map<string, Merchant> = new Map();
  private alerts: AlertItem[] = [];
  private listeners: ((event: { type: string; payload: any }) => void)[] = [];

  constructor() {
    this.seedInitialData();
  }

  public subscribe(listener: (event: { type: string; payload: any }) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private broadcast(type: string, payload: any) {
    this.listeners.forEach(cb => {
      try {
        cb({ type, payload });
      } catch (err) {
        console.error('Broadcast error:', err);
      }
    });
  }

  // --- Seed Data ---
  private seedInitialData() {
    const m1Id = 'MID_RZP_IN_9K21XZ4Q';
    const m1Fp = computeMerchantFingerprint('AABCE1234F', '27AABCE1234F1Z5', 'HDFC0001234987654', 'U72900KA2021PTC145000');
    
    const m1: Merchant = {
      merchant_id: m1Id,
      business_name: 'AeroCraft Electronics Pvt Ltd',
      pan: 'AABCE1234F',
      gstin: '27AABCE1234F1Z5',
      bank_account_number: 'HDFC0001234987654',
      business_registration_number: 'U72900KA2021PTC145000',
      merchant_fingerprint: m1Fp,
      connected_at: '2026-08-30T09:00:00Z',
      trust_score: 1, // Started at 0, +1 from clean verified order
      payout_status: 'ACTIVE',
      dock_scan_compliance_pct: 98.4,
      dispute_count: 0,
      refund_amount_this_month: 0,
      active_orders_count: 2,
      score_trend_30d: [
        { date: '2026-08-01', score: 0 },
        { date: '2026-08-10', score: 0 },
        { date: '2026-08-20', score: 1 },
        { date: '2026-08-30', score: 1 },
      ],
      users: [
        {
          user_id: 'USR_HASH_7F3A9C12',
          raw_name: 'Rohit Sharma',
          raw_email: 'rohit.s@example.com',
          raw_phone: '+91 98765 43210',
          user_trust_score: 1, // Started at 0, +1 from verified order
          account_status: 'NORMAL',
          offense_count: 0,
          warning_logs: [],
          created_at: '2026-08-15T11:20:00Z',
          last_order_date: '2026-08-30T10:15:00Z',
          trust_ids: [
            {
              trust_id: 'TRST-2026-IN-9842X1',
              merchant_id: m1Id,
              user_id: 'USR_HASH_7F3A9C12',
              order_meta: {
                order_id: 'ORD_88920194',
                amount: 4999.00,
                currency: 'INR',
                items_summary: 'Sony WH-1000XM5 Wireless Headphones (Black)',
                delivery_address: 'Flat 402, Skyline Residency, Indiranagar, Bengaluru, 560038',
                created_at: '2026-08-30T09:15:00Z',
              },
              warehouse_dock_telemetry: {
                dock_id: 'DOCK_BLR_04',
                timestamp: '2026-08-30T10:45:00Z',
                scanned_barcode: 'BC9842019488',
                package_weight_kg: 0.85,
                photo_hash: 'd6a8f5c3e981b2a4073e2185c7f891e4a2c1b9d8e7f601a2b3c4d5e6f7a8b9c0',
                operator_id: 'OP_BLR_881',
                dock_seal_verified: true,
              },
              doorstep_telemetry: {
                courier_id: 'CR_BLR_4412',
                courier_name: 'Vikas Kumar',
                carrier: 'BlueDart Express',
                gps_lat: 12.9716,
                gps_lng: 77.5946,
                target_lat: 12.9719,
                target_lng: 77.5950,
                distance_to_dest_m: 48,
                in_geofence: true,
                geofence_entered_at: '2026-08-30T14:12:00Z',
                handover_timestamp: '2026-08-30T14:32:05Z',
                doorstep_photo_hash: 'd6a8f5c3e981b2a4073e2185c7f891e4a2c1b9d8e7f601a2b3c4d5e6f7a8b9c0',
                cv_similarity_score: 0.99,
                rsa_signature: 'RSA4096:SIG:8a7c6f01e239bca4...',
              },
              otp_meta: {
                otp_code: '749201',
                form_token: 'tok_demo_verified_9842',
                dispatched_at: '2026-08-30T14:12:05Z',
                expires_at: '2026-08-30T14:32:05Z',
                attempts: 1,
                max_attempts: 3,
                verified: true,
              },
              verification_outcome: 'A_SAME',
              steps_status: {
                order_id: 'GREEN',
                amount: 'GREEN',
                address: 'GREEN',
                tracking: 'GREEN',
                sla_days: 'GREEN',
                points: 'GREEN',
                digital_signature: 'GREEN',
                before_after_images: 'GREEN',
              },
              state: 'VERIFIED',
              expires_at: '2027-01-10T14:32:05Z',
              reputation_delta: {
                merchant_score_before: 0,
                merchant_score_after: 1,
                merchant_delta: 1,
                customer_score_before: 0,
                customer_score_after: 1,
                customer_delta: 1,
                reason: 'Verified handover with matching OTP & physical item confirmation.',
                dispute_liability: 'None (Clean delivery)',
              },
              created_at: '2026-08-30T09:15:00Z',
            },
            {
              trust_id: 'TRST-2026-IN-1452A9',
              merchant_id: m1Id,
              user_id: 'USR_HASH_7F3A9C12',
              order_meta: {
                order_id: 'ORD_71092831',
                amount: 1299.00,
                currency: 'INR',
                items_summary: '65W GaN Fast Charger Dual USB-C',
                delivery_address: 'Flat 402, Skyline Residency, Indiranagar, Bengaluru, 560038',
                created_at: '2026-08-31T14:00:00Z',
              },
              warehouse_dock_telemetry: {
                dock_id: 'DOCK_BLR_04',
                timestamp: '2026-08-31T15:20:00Z',
                scanned_barcode: 'BC7109283100',
                package_weight_kg: 0.22,
                photo_hash: '9f8e7d6c5b4a3928172635445566778899aabbccddeeff001122334455667788',
                operator_id: 'OP_BLR_881',
                dock_seal_verified: true,
              },
              doorstep_telemetry: {
                courier_id: 'CR_BLR_1109',
                courier_name: 'Anand Verma',
                carrier: 'Delhivery',
                gps_lat: 12.9650,
                gps_lng: 77.5800,
                target_lat: 12.9719,
                target_lng: 77.5950,
                distance_to_dest_m: 1650,
                in_geofence: false,
              },
              otp_meta: {
                otp_code: '381940',
                form_token: 'tok_pending_1452a9',
                attempts: 0,
                max_attempts: 3,
                verified: false,
              },
              verification_outcome: 'PENDING',
              steps_status: {
                order_id: 'GREEN',
                amount: 'GREEN',
                address: 'GREEN',
                tracking: 'AMBER',
                sla_days: 'GREY',
                points: 'GREY',
                digital_signature: 'GREY',
                before_after_images: 'GREY',
              },
              state: 'PENDING',
              expires_at: '2027-01-11T14:00:00Z',
              reputation_delta: {
                merchant_score_before: 1,
                merchant_score_after: 1,
                merchant_delta: 0,
                customer_score_before: 1,
                customer_score_after: 1,
                customer_delta: 0,
              },
              created_at: '2026-08-31T14:00:00Z',
            }
          ]
        },
        {
          user_id: 'USR_HASH_3B88FE01',
          raw_name: 'Priya Nambiar',
          raw_email: 'priya.n@example.com',
          raw_phone: '+91 91234 56789',
          user_trust_score: 0, // Starts at 0
          account_status: 'NORMAL',
          offense_count: 0,
          warning_logs: [],
          created_at: '2026-08-20T08:00:00Z',
          last_order_date: '2026-08-31T09:00:00Z',
          trust_ids: [
            {
              trust_id: 'TRST-2026-IN-5521C4',
              merchant_id: m1Id,
              user_id: 'USR_HASH_3B88FE01',
              order_meta: {
                order_id: 'ORD_33910244',
                amount: 18499.00,
                currency: 'INR',
                items_summary: '27-inch 4K IPS Ergonomic Monitor',
                delivery_address: 'Villa 18, Palm Meadows, Whitefield, Bengaluru, 560066',
                created_at: '2026-08-31T09:00:00Z',
              },
              warehouse_dock_telemetry: {
                dock_id: 'DOCK_BLR_02',
                timestamp: '2026-08-31T10:00:00Z',
                scanned_barcode: 'BC3391024499',
                package_weight_kg: 5.4,
                photo_hash: '123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0',
                operator_id: 'OP_BLR_202',
                dock_seal_verified: true,
              },
              doorstep_telemetry: {
                courier_id: 'CR_BLR_5521',
                courier_name: 'Suresh Patil',
                carrier: 'BlueDart Express',
                gps_lat: 12.9690,
                gps_lng: 77.7480,
                target_lat: 12.9692,
                target_lng: 77.7485,
                distance_to_dest_m: 60,
                in_geofence: true,
                geofence_entered_at: '2026-08-31T16:00:00Z',
              },
              otp_meta: {
                otp_code: '592814',
                form_token: 'tok_geofence_active_5521',
                dispatched_at: '2026-08-31T16:00:05Z',
                expires_at: '2026-08-31T16:20:05Z',
                attempts: 0,
                max_attempts: 3,
                verified: false,
              },
              verification_outcome: 'PENDING',
              steps_status: {
                order_id: 'GREEN',
                amount: 'GREEN',
                address: 'GREEN',
                tracking: 'GREEN',
                sla_days: 'GREEN',
                points: 'GREY',
                digital_signature: 'AMBER',
                before_after_images: 'AMBER',
              },
              state: 'PENDING',
              expires_at: '2027-01-11T09:00:00Z',
              reputation_delta: {
                merchant_score_before: 1,
                merchant_score_after: 1,
                merchant_delta: 0,
                customer_score_before: 0,
                customer_score_after: 0,
                customer_delta: 0,
              },
              created_at: '2026-08-31T09:00:00Z',
            }
          ]
        }
      ]
    };

    const m2Id = 'MID_RZP_IN_4M89TY2W';
    const m2Fp = computeMerchantFingerprint('CCDPK9981G', '29CCDPK9981G1Z1', 'ICIC0003412998811', 'U18101DL2019PTC342110');
    const m2: Merchant = {
      merchant_id: m2Id,
      business_name: 'LuxeAura Fashion Hub',
      pan: 'CCDPK9981G',
      gstin: '29CCDPK9981G1Z1',
      bank_account_number: 'ICIC0003412998811',
      business_registration_number: 'U18101DL2019PTC342110',
      merchant_fingerprint: m2Fp,
      connected_at: '2026-08-25T14:30:00Z',
      trust_score: -1, // Started at 0, had 1 dispute -> -1
      payout_status: 'ACTIVE',
      dock_scan_compliance_pct: 89.2,
      dispute_count: 1,
      refund_amount_this_month: 3450.00,
      active_orders_count: 1,
      score_trend_30d: [
        { date: '2026-08-01', score: 0 },
        { date: '2026-08-15', score: 0 },
        { date: '2026-08-28', score: -1 },
      ],
      users: [
        {
          user_id: 'USR_HASH_99A10DE4',
          raw_name: 'Meera Iyer',
          raw_email: 'meera.iyer@example.com',
          raw_phone: '+91 99887 76655',
          user_trust_score: -1, // Started at 0, -1 from warning strike
          account_status: 'WARNED',
          offense_count: 1,
          warning_logs: [
            {
              id: 'WRN_INIT_01',
              timestamp: '2026-08-28T18:40:00Z',
              reason: 'Excessive invalid OTP attempts during doorstep delivery.',
              level: 'FORMAL_WARNING',
              trust_id: 'TRST-2026-IN-7719D2',
              points_deducted: 1,
            }
          ],
          created_at: '2026-08-10T12:00:00Z',
          last_order_date: '2026-08-28T17:15:00Z',
          trust_ids: [
            {
              trust_id: 'TRST-2026-IN-7719D2',
              merchant_id: m2Id,
              user_id: 'USR_HASH_99A10DE4',
              order_meta: {
                order_id: 'ORD_99182301',
                amount: 3450.00,
                currency: 'INR',
                items_summary: 'Pure Mulberry Silk Evening Gown (Navy / Size M)',
                delivery_address: 'Apt 12B, Ocean Crest, Marine Drive, Mumbai, 400020',
                created_at: '2026-08-28T17:15:00Z',
              },
              warehouse_dock_telemetry: {
                dock_id: 'DOCK_BOM_01',
                timestamp: '2026-08-28T18:00:00Z',
                scanned_barcode: 'BC9918230100',
                package_weight_kg: 0.65,
                photo_hash: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                operator_id: 'OP_BOM_101',
                dock_seal_verified: true,
              },
              doorstep_telemetry: {
                courier_id: 'CR_BOM_991',
                courier_name: 'Rajesh K',
                carrier: 'Shadowfax',
                gps_lat: 18.9438,
                gps_lng: 72.8232,
                target_lat: 18.9440,
                target_lng: 72.8235,
                distance_to_dest_m: 35,
                in_geofence: true,
                geofence_entered_at: '2026-08-29T11:00:00Z',
                handover_timestamp: '2026-08-29T11:18:00Z',
                doorstep_photo_hash: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                cv_similarity_score: 0.95,
              },
              otp_meta: {
                otp_code: '419820',
                form_token: 'tok_mismatch_7719d2',
                dispatched_at: '2026-08-29T11:00:05Z',
                expires_at: '2026-08-29T11:20:05Z',
                attempts: 1,
                max_attempts: 3,
                verified: true,
              },
              verification_outcome: 'C_MISMATCH',
              steps_status: {
                order_id: 'GREEN',
                amount: 'GREEN',
                address: 'GREEN',
                tracking: 'GREEN',
                sla_days: 'GREEN',
                points: 'GREEN',
                digital_signature: 'GREEN',
                before_after_images: 'GREEN',
              },
              state: 'DISPUTED',
              expires_at: '2027-01-08T17:15:00Z',
              reputation_delta: {
                merchant_score_before: 0,
                merchant_score_after: -1,
                merchant_delta: -1,
                customer_score_before: 0,
                customer_score_after: -1,
                customer_delta: -1,
                reason: 'Option C reported: Right item, wrong size/specification. Merchant score -1.',
                dispute_liability: 'Merchant (Return shipping for exchange)',
              },
              created_at: '2026-08-28T17:15:00Z',
            }
          ]
        }
      ]
    };

    const m3Id = 'MID_RZP_IN_1X72LK88';
    const m3Fp = computeMerchantFingerprint('ZZZPT4455H', '07ZZZPT4455H1Z9', 'KKBK0008899112233', 'U31900DL2018PTC112233');
    const m3: Merchant = {
      merchant_id: m3Id,
      business_name: 'VoltGear Sports Equipment',
      pan: 'ZZZPT4455H',
      gstin: '07ZZZPT4455H1Z9',
      bank_account_number: 'KKBK0008899112233',
      business_registration_number: 'U31900DL2018PTC112233',
      merchant_fingerprint: m3Fp,
      connected_at: '2026-08-10T10:00:00Z',
      trust_score: -3, // Started at 0, 3 disputes -> -3
      payout_status: '30_DAY_HOLD',
      dock_scan_compliance_pct: 74.0,
      dispute_count: 3,
      refund_amount_this_month: 24900.00,
      active_orders_count: 1,
      score_trend_30d: [
        { date: '2026-08-01', score: 0 },
        { date: '2026-08-15', score: -1 },
        { date: '2026-08-30', score: -3 },
      ],
      users: [
        {
          user_id: 'USR_HASH_E420C77B',
          raw_name: 'Karan Malhotra',
          raw_email: 'karan.m@example.com',
          raw_phone: '+91 98112 33445',
          user_trust_score: -2, // Started at 0, 2 offenses -> -2
          account_status: 'BLACKLISTED',
          offense_count: 2,
          warning_logs: [
            {
              id: 'WRN_INIT_02',
              timestamp: '2026-08-12T14:00:00Z',
              reason: 'False bait-and-switch claim disproved by tamper-proof dock seal verification.',
              level: 'FORMAL_WARNING',
              points_deducted: 1,
            },
            {
              id: 'BLK_INIT_01',
              timestamp: '2026-08-29T16:20:00Z',
              reason: 'Repeat fraudulent chargeback attempt. Escalated to full network blacklist.',
              level: 'BLACKLIST_ESCALATION',
              points_deducted: 1,
            }
          ],
          created_at: '2026-08-05T09:00:00Z',
          last_order_date: '2026-08-29T15:00:00Z',
          trust_ids: [
            {
              trust_id: 'TRST-2026-IN-3301F9',
              merchant_id: m3Id,
              user_id: 'USR_HASH_E420C77B',
              order_meta: {
                order_id: 'ORD_66541902',
                amount: 12999.00,
                currency: 'INR',
                items_summary: 'Carbon Fiber Badminton Racket Pro Kit',
                delivery_address: 'House 55, Sector 14, Gurugram, Haryana, 122001',
                created_at: '2026-08-29T15:00:00Z',
              },
              warehouse_dock_telemetry: {
                dock_id: 'DOCK_DEL_03',
                timestamp: '2026-08-29T15:30:00Z',
                scanned_barcode: 'BC6654190200',
                package_weight_kg: 1.1,
                photo_hash: '33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122',
                operator_id: 'OP_DEL_502',
                dock_seal_verified: true,
              },
              doorstep_telemetry: {
                courier_id: 'CR_DEL_8801',
                courier_name: 'Deepak Rao',
                carrier: 'Xpressbees',
                gps_lat: 28.4595,
                gps_lng: 77.0266,
                target_lat: 28.4598,
                target_lng: 77.0270,
                distance_to_dest_m: 45,
                in_geofence: true,
                geofence_entered_at: '2026-08-30T12:00:00Z',
                handover_timestamp: '2026-08-30T12:15:00Z',
                doorstep_photo_hash: '33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122',
                cv_similarity_score: 0.97,
              },
              otp_meta: {
                otp_code: '882104',
                form_token: 'tok_disputed_3301f9',
                dispatched_at: '2026-08-30T12:00:05Z',
                expires_at: '2026-08-30T12:20:05Z',
                attempts: 1,
                max_attempts: 3,
                verified: true,
              },
              verification_outcome: 'B_DIFFERENT',
              steps_status: {
                order_id: 'GREEN',
                amount: 'GREEN',
                address: 'GREEN',
                tracking: 'GREEN',
                sla_days: 'GREEN',
                points: 'GREEN',
                digital_signature: 'GREEN',
                before_after_images: 'GREEN',
              },
              state: 'DISPUTED',
              expires_at: '2027-01-09T15:00:00Z',
              reputation_delta: {
                merchant_score_before: -2,
                merchant_score_after: -3,
                merchant_delta: -1,
                customer_score_before: -2,
                customer_score_after: -2,
                customer_delta: 0,
                reason: 'Option B Bait-and-switch: User reported completely different item delivered (-1 merchant).',
                dispute_liability: 'Merchant (100% forward + return logistics hold)',
              },
              created_at: '2026-08-29T15:00:00Z',
            }
          ]
        }
      ]
    };

    this.merchants.set(m1Id, m1);
    this.merchants.set(m2Id, m2);
    this.merchants.set(m3Id, m3);

    // Initial Alerts
    this.alerts.push(
      {
        id: 'ALT_001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'NEW_MERCHANT',
        title: 'New Merchant Onboarded',
        message: `Merchant MID_RZP_IN_9K21XZ4Q (AeroCraft Electronics) integrated with initial 0 pts baseline.`,
        severity: 'info',
        merchant_id: m1Id,
      },
      {
        id: 'ALT_002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'PAYOUT_FREEZE',
        title: '30-Day Rolling Payout Hold Applied',
        message: `Merchant MID_RZP_IN_1X72LK88 reached 3 dispute strikes (-3 pts). Payout placed on 30-day hold.`,
        severity: 'danger',
        merchant_id: m3Id,
      },
      {
        id: 'ALT_003',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'BLACKLIST_ESCALATION',
        title: 'Customer Blacklisted Across Gateway',
        message: `User USR_HASH_E420C77B escalated to Blacklist (-2 pts).`,
        severity: 'danger',
        user_id: 'USR_HASH_E420C77B',
      }
    );
  }

  // --- Merchant Operations ---
  public getAllMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  public getMerchant(merchantId: string): Merchant | undefined {
    return this.merchants.get(merchantId);
  }

  public onboardOrRelinkMerchant(input: {
    business_name: string;
    pan: string;
    gstin: string;
    bank_account_number: string;
    business_registration_number: string;
    region?: string;
  }): { merchant: Merchant; isNew: boolean; alert: AlertItem } {
    const fingerprint = computeMerchantFingerprint(
      input.pan,
      input.gstin,
      input.bank_account_number,
      input.business_registration_number
    );

    for (const existing of this.merchants.values()) {
      if (existing.merchant_fingerprint === fingerprint) {
        const alert: AlertItem = {
          id: `ALT_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'MERCHANT_RECONNECTED',
          title: 'Duplicate Merchant Re-linked',
          message: `Integration for "${input.business_name}" matched existing fingerprint; securely re-linked to ${existing.merchant_id}.`,
          severity: 'warning',
          merchant_id: existing.merchant_id,
        };
        this.alerts.unshift(alert);
        this.broadcast('ALERT_ADDED', alert);
        this.broadcast('MERCHANT_UPDATED', existing);
        return { merchant: existing, isNew: false, alert };
      }
    }

    const merchantId = generateMerchantId(input.region || 'IN');
    const now = new Date().toISOString();
    const newMerchant: Merchant = {
      merchant_id: merchantId,
      business_name: input.business_name,
      pan: input.pan.toUpperCase(),
      gstin: input.gstin.toUpperCase(),
      bank_account_number: input.bank_account_number,
      business_registration_number: input.business_registration_number.toUpperCase(),
      merchant_fingerprint: fingerprint,
      connected_at: now,
      trust_score: 0, // Starts at 0 points
      payout_status: 'ACTIVE',
      dock_scan_compliance_pct: 100.0,
      dispute_count: 0,
      refund_amount_this_month: 0,
      active_orders_count: 0,
      score_trend_30d: [{ date: now.split('T')[0], score: 0 }],
      users: [],
    };

    this.merchants.set(merchantId, newMerchant);

    const alert: AlertItem = {
      id: `ALT_${Date.now()}`,
      timestamp: now,
      type: 'NEW_MERCHANT',
      title: 'New Merchant Connected',
      message: `New merchant onboarded with 0 points: ${newMerchant.business_name} (${merchantId}).`,
      severity: 'info',
      merchant_id: merchantId,
    };
    this.alerts.unshift(alert);
    this.broadcast('ALERT_ADDED', alert);
    this.broadcast('MERCHANT_ADDED', newMerchant);

    return { merchant: newMerchant, isNew: true, alert };
  }

  // --- Order & Trust-ID Operations ---
  public createOrderAndTrustId(
    merchantId: string,
    orderInput: {
      order_id: string;
      amount: number;
      currency: string;
      items_summary: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      delivery_address: string;
    }
  ): { merchant: Merchant; user: User; trustId: TrustID } {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) throw new Error(`Merchant ${merchantId} not found`);

    const userHashPayload = `${orderInput.customer_phone}:${orderInput.customer_email}`;
    const userHashedId = 'USR_HASH_' + crypto.createHash('sha256').update(userHashPayload).digest('hex').substring(0, 8).toUpperCase();

    let user = merchant.users.find(u => u.user_id === userHashedId);
    const now = new Date().toISOString();

    if (!user) {
      user = {
        user_id: userHashedId,
        raw_name: orderInput.customer_name,
        raw_email: orderInput.customer_email,
        raw_phone: orderInput.customer_phone,
        user_trust_score: 0, // Starts at 0 points
        account_status: 'NORMAL',
        offense_count: 0,
        warning_logs: [],
        created_at: now,
        last_order_date: now,
        trust_ids: [],
      };
      merchant.users.push(user);
    } else {
      user.last_order_date = now;
    }

    const trustIdStr = `TRST-${new Date().getFullYear()}-IN-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const expiryDate = new Date(Date.now() + 132 * 24 * 3600 * 1000).toISOString();

    const trustIdRecord: TrustID = {
      trust_id: trustIdStr,
      merchant_id: merchantId,
      user_id: userHashedId,
      order_meta: {
        order_id: orderInput.order_id,
        amount: orderInput.amount,
        currency: orderInput.currency || 'INR',
        items_summary: orderInput.items_summary,
        customer_name: orderInput.customer_name,
        delivery_address: orderInput.delivery_address,
        created_at: now,
      },
      warehouse_dock_telemetry: {
        dock_id: 'DOCK_MAIN_01',
        timestamp: now,
        scanned_barcode: `BC${orderInput.order_id.replace(/\D/g, '') || '881290'}`,
        package_weight_kg: 1.25,
        photo_hash: crypto.createHash('sha256').update(orderInput.order_id + '_dock').digest('hex'),
        operator_id: 'OP_AUTO_01',
        dock_seal_verified: true,
      },
      doorstep_telemetry: {
        courier_id: 'CR_AGENT_01',
        courier_name: 'Pawan Singh',
        carrier: 'Razorpay Logistics Partner',
        gps_lat: 12.9716,
        gps_lng: 77.5946,
        target_lat: 12.9718,
        target_lng: 77.5948,
        distance_to_dest_m: 1200,
        in_geofence: false,
      },
      otp_meta: {
        otp_code: '000000',
        form_token: '',
        attempts: 0,
        max_attempts: 3,
        verified: false,
      },
      verification_outcome: 'PENDING',
      steps_status: {
        order_id: 'GREEN',
        amount: 'GREEN',
        address: 'GREEN',
        tracking: 'AMBER',
        sla_days: 'GREY',
        points: 'GREY',
        digital_signature: 'GREY',
        before_after_images: 'GREY',
      },
      state: 'PENDING',
      expires_at: expiryDate,
      reputation_delta: {
        merchant_score_before: merchant.trust_score,
        merchant_score_after: merchant.trust_score,
        merchant_delta: 0,
        customer_score_before: user.user_trust_score,
        customer_score_after: user.user_trust_score,
        customer_delta: 0,
      },
      created_at: now,
    };

    user.trust_ids.unshift(trustIdRecord);
    merchant.active_orders_count += 1;

    this.broadcast('ORDER_CREATED', { merchantId, user, trustId: trustIdRecord });
    return { merchant, user, trustId: trustIdRecord };
  }

  // --- Trigger Geofence Entry & Dispatch 2 Emails ---
  public triggerGeofenceEntry(
    trustIdStr: string,
    currentLat: number = 12.9718,
    currentLng: number = 77.5948
  ): { trustId: TrustID; email1: any; email2: any } {
    const { merchant, user, trustId } = this.findTrustId(trustIdStr);
    if (!trustId || !merchant || !user) throw new Error(`Trust-ID ${trustIdStr} not found`);

    trustId.doorstep_telemetry.gps_lat = currentLat;
    trustId.doorstep_telemetry.gps_lng = currentLng;
    trustId.doorstep_telemetry.distance_to_dest_m = 35;
    trustId.doorstep_telemetry.in_geofence = true;
    trustId.doorstep_telemetry.geofence_entered_at = new Date().toISOString();

    trustId.steps_status.tracking = 'GREEN';
    trustId.steps_status.sla_days = 'GREEN';
    trustId.steps_status.digital_signature = 'AMBER';
    trustId.steps_status.before_after_images = 'AMBER';

    const dispatchResult = emailDispatcher.dispatchDoorstepEmails(
      user.raw_email || 'customer@example.com',
      user.user_id,
      trustId.trust_id,
      trustId.order_meta.order_id,
      merchant.business_name
    );

    trustId.otp_meta.otp_code = dispatchResult.otp;
    trustId.otp_meta.form_token = dispatchResult.formToken;
    trustId.otp_meta.dispatched_at = new Date().toISOString();
    trustId.otp_meta.expires_at = dispatchResult.expiresAt;

    this.broadcast('GEOFENCE_TRIGGERED', { trustId, email1: dispatchResult.email1, email2: dispatchResult.email2 });

    return {
      trustId,
      email1: dispatchResult.email1,
      email2: dispatchResult.email2,
    };
  }

  // --- Submit Verification Form (Option A, B, C) ---
  public async submitVerificationForm(
    formToken: string,
    trustIdStr: string,
    enteredOtp: string,
    outcome: VerificationOutcome,
    isSimulation: boolean = false
  ): Promise<{ success: boolean; message: string; trustId: TrustID; error?: string }> {
    const { merchant, user, trustId } = this.findTrustId(trustIdStr);
    if (!trustId || !merchant || !user) throw new Error(`Trust-ID ${trustIdStr} not found`);

    const effectiveToken = isSimulation ? (trustId.otp_meta.form_token || formToken) : formToken;
    const effectiveOtp = isSimulation ? (trustId.otp_meta.otp_code || enteredOtp) : enteredOtp;

    if (!isSimulation && trustId.otp_meta.form_token && trustId.otp_meta.form_token !== effectiveToken) {
      return { success: false, message: 'Invalid or expired single-use token', trustId, error: 'INVALID_TOKEN' };
    }

    if (!isSimulation && trustId.otp_meta.verified) {
      return { success: false, message: 'This delivery has already been verified', trustId, error: 'ALREADY_VERIFIED' };
    }

    if (!isSimulation && trustId.otp_meta.otp_code !== effectiveOtp.trim()) {
      trustId.otp_meta.attempts += 1;
      if (trustId.otp_meta.attempts >= trustId.otp_meta.max_attempts) {
        const warningRes = processUserOffense(user, 'Failed OTP verification attempts exceeded limit (3 tries)', trustId.trust_id);
        const alert: AlertItem = {
          id: `ALT_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: warningRes.actionTaken === 'BLACKLIST_ESCALATED' ? 'BLACKLIST_ESCALATION' : 'EXPIRING_NO_TELEMETRY',
          title: warningRes.actionTaken === 'BLACKLIST_ESCALATED' ? 'Customer Blacklisted' : 'Customer Warning Issued',
          message: warningRes.alertMessage,
          severity: 'danger',
          user_id: user.user_id,
          trust_id: trustId.trust_id,
        };
        this.alerts.unshift(alert);
        this.broadcast('ALERT_ADDED', alert);
        this.broadcast('USER_UPDATED', user);
        return { success: false, message: 'Max OTP attempts exceeded. Link invalidated and security notice logged.', trustId, error: 'MAX_ATTEMPTS_EXCEEDED' };
      }
      return { success: false, message: `Incorrect OTP. Attempts remaining: ${trustId.otp_meta.max_attempts - trustId.otp_meta.attempts}`, trustId, error: 'INVALID_OTP' };
    }

    trustId.otp_meta.verified = true;
    trustId.verification_outcome = outcome;
    trustId.doorstep_telemetry.handover_timestamp = new Date().toISOString();
    trustId.doorstep_telemetry.doorstep_photo_hash = trustId.warehouse_dock_telemetry.photo_hash;
    trustId.doorstep_telemetry.cv_similarity_score = outcome === 'B_DIFFERENT' ? 0.28 : outcome === 'C_MISMATCH' ? 0.72 : 0.99;
    trustId.doorstep_telemetry.rsa_signature = `RSA4096:SIG:${crypto.randomBytes(16).toString('hex')}`;

    trustId.steps_status.tracking = 'GREEN';
    trustId.steps_status.sla_days = 'GREEN';
    trustId.steps_status.digital_signature = 'GREEN';
    trustId.steps_status.before_after_images = 'GREEN';
    trustId.steps_status.points = 'GREEN';

    const scoreRes = evaluateTrustScoreDelta(merchant, user, outcome);
    trustId.reputation_delta = {
      merchant_score_before: merchant.trust_score,
      merchant_score_after: scoreRes.merchantScoreAfter,
      merchant_delta: scoreRes.merchantDelta,
      customer_score_before: user.user_trust_score,
      customer_score_after: scoreRes.customerScoreAfter,
      customer_delta: scoreRes.customerDelta,
      reason: scoreRes.reason,
      dispute_liability: scoreRes.disputeLiability,
      applied_at: new Date().toISOString(),
    };

    merchant.trust_score = scoreRes.merchantScoreAfter;
    merchant.payout_status = scoreRes.merchantPayoutStatus;
    user.user_trust_score = scoreRes.customerScoreAfter;
    user.account_status = scoreRes.userAccountStatus;

    if (outcome === 'A_SAME') {
      trustId.state = 'VERIFIED';
    } else {
      trustId.state = 'DISPUTED';
      merchant.dispute_count += 1;
      merchant.refund_amount_this_month += trustId.order_meta.amount;
    }

    if (merchant.active_orders_count > 0) {
      merchant.active_orders_count -= 1;
    }

    try {
      await generateDisputeDossierPdf(trustId, merchant, user);
      trustId.dossier_pdf_url = `/api/trust-id/${trustId.trust_id}/dossier.pdf`;
      trustId.dossier_generated_at = new Date().toISOString();
    } catch (err) {
      console.error('Error generating PDF dossier:', err);
    }

    this.broadcast('TRUST_ID_VERIFIED', { trustId, merchant, user });
    return { success: true, message: 'Order verification successfully recorded', trustId };
  }

  // --- Non-Delivery Expiry Timeout (Section 8.2) ---
  public triggerNonDeliveryExpiry(trustIdStr: string): TrustID {
    const { merchant, user, trustId } = this.findTrustId(trustIdStr);
    if (!trustId || !merchant || !user) throw new Error(`Trust-ID ${trustIdStr} not found`);

    trustId.state = 'EXPIRED_NOT_VERIFIED';
    trustId.verification_outcome = 'NO_TELEMETRY';

    const scoreRes = evaluateTrustScoreDelta(merchant, user, 'NO_TELEMETRY', { noTelemetryExpiry: true });
    trustId.reputation_delta = {
      merchant_score_before: merchant.trust_score,
      merchant_score_after: scoreRes.merchantScoreAfter,
      merchant_delta: scoreRes.merchantDelta,
      customer_score_before: user.user_trust_score,
      customer_score_after: scoreRes.customerScoreAfter,
      customer_delta: scoreRes.customerDelta,
      reason: scoreRes.reason,
      dispute_liability: scoreRes.disputeLiability,
      applied_at: new Date().toISOString(),
    };

    merchant.trust_score = scoreRes.merchantScoreAfter;
    merchant.payout_status = scoreRes.merchantPayoutStatus;
    merchant.dispute_count += 1;
    merchant.refund_amount_this_month += trustId.order_meta.amount;

    const alert: AlertItem = {
      id: `ALT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EXPIRING_NO_TELEMETRY',
      title: 'Non-Delivery Expiry Penalty',
      message: `Trust-ID ${trustId.trust_id} expired with zero doorstep telemetry. Defaulted liability to merchant ${merchant.merchant_id} (-1 point).`,
      severity: 'warning',
      merchant_id: merchant.merchant_id,
      trust_id: trustId.trust_id,
    };
    this.alerts.unshift(alert);

    this.broadcast('ALERT_ADDED', alert);
    this.broadcast('TRUST_ID_UPDATED', { trustId, merchant, user });
    return trustId;
  }

  public getAlerts(): AlertItem[] {
    return this.alerts;
  }

  public findTrustId(trustIdStr: string): { merchant?: Merchant; user?: User; trustId?: TrustID } {
    for (const merchant of this.merchants.values()) {
      for (const user of merchant.users) {
        const found = user.trust_ids.find(t => t.trust_id === trustIdStr);
        if (found) {
          return { merchant, user, trustId: found };
        }
      }
    }
    return {};
  }
}

export const store = new TrustStore();
