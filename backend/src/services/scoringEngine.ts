import { Merchant, User, VerificationOutcome, PayoutStatus } from '../types/index.js';

export interface ScoreResolutionResult {
  merchantScoreAfter: number;
  merchantDelta: number;
  customerScoreAfter: number;
  customerDelta: number;
  merchantPayoutStatus: PayoutStatus;
  userAccountStatus: User['account_status'];
  reason: string;
  disputeLiability?: string;
}

/**
 * Trust Score & Point System (v2.0 Revision):
 * - Initially everyone starts with 0 points.
 * - Points can be positive (+ve), negative (-ve), or 0.
 * - Increments increase score by exactly +1.
 * - Decrements decrease score by exactly -1.
 */
export function evaluateTrustScoreDelta(
  merchant: Merchant,
  user: User,
  outcome: VerificationOutcome,
  additionalContext?: {
    isFalseClaimDisproved?: boolean;
    isDiscretionaryReturn?: boolean;
    noTelemetryExpiry?: boolean;
  }
): ScoreResolutionResult {
  let mDelta = 0;
  let uDelta = 0;
  let reason = '';
  let disputeLiability: string | undefined = undefined;
  let payoutStatus: PayoutStatus = merchant.payout_status;
  let userAccountStatus: User['account_status'] = user.account_status;

  if (additionalContext?.isFalseClaimDisproved) {
    mDelta = +1; // +1 increment to restore merchant
    uDelta = -1; // -1 decrement to customer
    reason = 'Disputed claim disproved by CV seal comparison. Merchant score (+1) restored. Customer (-1) flagged.';
    disputeLiability = 'Customer (fraudulent dispute claim)';
    if (user.offense_count >= 1) {
      userAccountStatus = 'BLACKLISTED';
    } else {
      userAccountStatus = 'WARNED';
    }
  } else if (additionalContext?.isDiscretionaryReturn) {
    mDelta = 0;
    uDelta = 0;
    reason = 'Discretionary customer return (remorse/wrong size). ₹120 reverse logistics auto-deducted.';
    disputeLiability = 'Customer (Discretionary return fee)';
  } else if (additionalContext?.noTelemetryExpiry || outcome === 'NO_TELEMETRY') {
    mDelta = -1; // -1 decrement
    uDelta = 0;
    reason = 'Expired with zero doorstep telemetry. Defaulted to merchant non-delivery liability (-1).';
    disputeLiability = 'Merchant (Full refund + non-delivery penalty)';
    if (merchant.dispute_count >= 2) {
      payoutStatus = '30_DAY_HOLD';
    }
  } else {
    switch (outcome) {
      case 'A_SAME':
        mDelta = +1; // +1 increment
        uDelta = +1; // +1 increment
        reason = 'Handover verified with matching OTP & physical item confirmation (Option A: +1 merchant, +1 customer).';
        disputeLiability = 'None (Clean delivery)';
        break;

      case 'B_DIFFERENT':
        mDelta = -1; // -1 decrement
        uDelta = 0;
        reason = 'Bait-and-switch reported (Option B). Merchant assessed forward+return shipping liability (-1).';
        disputeLiability = 'Merchant (100% forward+return logistics)';
        if (merchant.dispute_count + 1 >= 3) {
          payoutStatus = '30_DAY_HOLD';
        }
        break;

      case 'C_MISMATCH':
        mDelta = -1; // -1 decrement
        uDelta = 0;
        reason = 'Variant/spec mismatch reported (Option C). Return shipping liability assigned to merchant (-1).';
        disputeLiability = 'Merchant (Return shipping for exchange)';
        break;

      default:
        break;
    }
  }

  // Scores can be positive (+ve), negative (-ve), or 0
  const merchantScoreAfter = merchant.trust_score + mDelta;
  const customerScoreAfter = user.user_trust_score + uDelta;

  return {
    merchantScoreAfter,
    merchantDelta: mDelta,
    customerScoreAfter,
    customerDelta: uDelta,
    merchantPayoutStatus: payoutStatus,
    userAccountStatus,
    reason,
    disputeLiability,
  };
}
