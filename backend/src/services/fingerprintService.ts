import crypto from 'crypto';

export interface MerchantOnboardingInput {
  business_name: string;
  pan: string;
  gstin: string;
  bank_account_number: string;
  business_registration_number: string;
  region?: string;
}

/**
 * Computes Merchant Fingerprint Hash:
 * SHA256( PAN + GSTIN + bank_account_number_hash + business_registration_number )
 */
export function computeMerchantFingerprint(
  pan: string,
  gstin: string,
  bankAccountNumber: string,
  businessRegNumber: string
): string {
  const bankAccountHash = crypto
    .createHash('sha256')
    .update(bankAccountNumber.trim().toUpperCase())
    .digest('hex');

  const payload = [
    pan.trim().toUpperCase(),
    gstin.trim().toUpperCase(),
    bankAccountHash,
    businessRegNumber.trim().toUpperCase(),
  ].join(':');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generates permanent Merchant ID format:
 * MID_RZP_<REGION>_<8-CHAR-BASE36> e.g. MID_RZP_IN_9K21XZ4Q
 */
export function generateMerchantId(region: string = 'IN'): string {
  const randomBytes = crypto.randomBytes(5);
  const base36 = randomBytes.readUInt32BE(0).toString(36).toUpperCase().padStart(8, '0').slice(0, 8);
  return `MID_RZP_${region.toUpperCase()}_${base36}`;
}
