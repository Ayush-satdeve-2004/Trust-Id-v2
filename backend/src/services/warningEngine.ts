import { User, UserWarningLog } from '../types/index.js';

export interface WarningResult {
  updatedUser: User;
  actionTaken: 'FIRST_WARNING_ISSUED' | 'BLACKLIST_ESCALATED' | 'NO_CHANGE';
  newLog?: UserWarningLog;
  alertNeeded: boolean;
  alertMessage: string;
}

export function processUserOffense(
  user: User,
  reason: string,
  trustId?: string
): WarningResult {
  const isFirstOffense = user.offense_count === 0;
  const timestamp = new Date().toISOString();

  if (isFirstOffense) {
    const pointsDeducted = 1; // -1 decrement
    const newLog: UserWarningLog = {
      id: `WRN_${Date.now()}`,
      timestamp,
      reason: reason || 'OTP mismatch beyond retry limit or suspicious submission attempt.',
      level: 'FORMAL_WARNING',
      trust_id: trustId,
      points_deducted: pointsDeducted,
    };

    const updatedUser: User = {
      ...user,
      offense_count: user.offense_count + 1,
      account_status: 'WARNED',
      user_trust_score: user.user_trust_score - pointsDeducted,
      warning_logs: [newLog, ...user.warning_logs],
    };

    return {
      updatedUser,
      actionTaken: 'FIRST_WARNING_ISSUED',
      newLog,
      alertNeeded: true,
      alertMessage: `User ${user.user_id} issued formal warning (First offense). Score reduced by -${pointsDeducted}.`,
    };
  } else {
    // Repeat offense -> Escalate to blacklist
    const pointsDeducted = 1; // -1 decrement
    const newLog: UserWarningLog = {
      id: `BLK_${Date.now()}`,
      timestamp,
      reason: `Repeat offense: ${reason || 'Subsequent false claim / fraudulent verification attempt'}. Escalate to Blacklist & Cybercrime Database.`,
      level: 'BLACKLIST_ESCALATION',
      trust_id: trustId,
      points_deducted: pointsDeducted,
    };

    const updatedUser: User = {
      ...user,
      offense_count: user.offense_count + 1,
      account_status: 'BLACKLISTED',
      user_trust_score: user.user_trust_score - pointsDeducted,
      warning_logs: [newLog, ...user.warning_logs],
    };

    return {
      updatedUser,
      actionTaken: 'BLACKLIST_ESCALATED',
      newLog,
      alertNeeded: true,
      alertMessage: `CRITICAL: User ${user.user_id} blacklisted across Razorpay network. Payment fingerprint blacklisted & reported to merchant risk database.`,
    };
  }
}
