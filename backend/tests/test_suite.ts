import { computeMerchantFingerprint, generateMerchantId } from '../src/services/fingerprintService.js';
import { comparePackageImages } from '../src/services/cvComparator.js';
import { evaluateTrustScoreDelta } from '../src/services/scoringEngine.js';
import { processUserOffense } from '../src/services/warningEngine.js';
import { GeofenceEmailDispatcher } from '../src/services/geofenceEmailDispatcher.js';
import { generateDisputeDossierPdf } from '../src/services/dossierPdfGenerator.js';
import { store } from '../src/db/store.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RUNNING TRUST-ID ENGINE v2.0 COMPLETE TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Merchant Fingerprint & Deduplication
  console.log('📦 Test Suite 1: Merchant Fingerprint & Permanent ID (Section 3)');
  const fp1 = computeMerchantFingerprint('ABCDE1234F', '27ABCDE1234F1Z5', 'HDFC0001', 'U12345');
  const fp2 = computeMerchantFingerprint('abcde1234f', '27abcde1234f1z5', 'hdfc0001', 'u12345');
  assert(fp1 === fp2, 'Fingerprint is case-insensitive & deterministic');
  
  const mid = generateMerchantId('IN');
  assert(mid.startsWith('MID_RZP_IN_'), 'Merchant ID matches format MID_RZP_<REGION>_<8-CHAR-BASE36>');

  const onboard1 = store.onboardOrRelinkMerchant({
    business_name: 'Unit Test Merchant 1',
    pan: 'TESTP9988A',
    gstin: '27TESTP9988A1Z9',
    bank_account_number: 'SBIN999000111',
    business_registration_number: 'U99000DL2024PTC111',
  });
  assert(onboard1.isNew === true, 'Fresh merchant onboarded with isNew = true');
  assert(onboard1.merchant.trust_score === 0, 'New merchant starts with 0 baseline points');

  const onboardDuplicate = store.onboardOrRelinkMerchant({
    business_name: 'Unit Test Merchant 1 (Duplicate Attempt)',
    pan: 'TESTP9988A',
    gstin: '27TESTP9988A1Z9',
    bank_account_number: 'SBIN999000111',
    business_registration_number: 'U99000DL2024PTC111',
  });
  assert(onboardDuplicate.isNew === false, 'Duplicate fingerprint structurally blocked & re-linked');
  assert(onboardDuplicate.merchant.merchant_id === onboard1.merchant.merchant_id, 'Duplicate re-links to existing Merchant ID');

  // Test 2: Two-Email Geofence Dispatcher (Section 7)
  console.log('\n📬 Test Suite 2: Two-Email Verification Flow (Section 7)');
  const dispatcher = new GeofenceEmailDispatcher();
  const dispatchRes = dispatcher.dispatchDoorstepEmails(
    'test@example.com',
    'USR_HASH_TEST',
    'TRST-2026-IN-TEST01',
    'ORD_1001',
    'Test Merchant'
  );
  assert(dispatchRes.otp.length === 6, 'Generated 6-digit OTP');
  assert(dispatchRes.email1.type === 'EMAIL_1_OTP', 'Email 1 is OTP-only');
  assert(!dispatchRes.email1.body_text.includes('http'), 'Email 1 contains zero links/forms');
  assert(dispatchRes.email2.type === 'EMAIL_2_VERIFICATION_LINK', 'Email 2 contains verification link');
  assert(dispatchRes.email2.verification_url?.includes('token='), 'Email 2 includes single-use token');

  // Test 3: CV Image Comparator (Section 6)
  console.log('\n👁️ Test Suite 3: Computer Vision Image Comparator (Section 6)');
  const cvMatch = comparePackageImages('photo_sample_base_64', 'photo_sample_base_64');
  assert(cvMatch.match === true && cvMatch.similarity_score > 0.9, 'Identical photos produce match with high similarity');

  const cvMismatch = comparePackageImages('photo_sample_base_64', 'tampered_doorstep_photo', true);
  assert(cvMismatch.match === false && cvMismatch.anomaly_detected === true, 'Tampered photo triggers anomaly detection & low similarity');

  // Test 4: Point System & Penalty Matrix (0 Baseline, +1 Increment, -1 Decrement)
  console.log('\n⚖️ Test Suite 4: Point System (+1 Increment, -1 Decrement)');
  const mockMerchant = { ...onboard1.merchant, trust_score: 0 };
  const mockUser = {
    user_id: 'USR_HASH_MOCK01',
    raw_name: 'Mock User',
    raw_email: 'mock@example.com',
    raw_phone: '+91 9999988888',
    user_trust_score: 0, // Starts at 0
    account_status: 'NORMAL' as const,
    offense_count: 0,
    warning_logs: [],
    created_at: new Date().toISOString(),
    last_order_date: new Date().toISOString(),
    trust_ids: [],
  };

  // Outcome A (+1 merchant, +1 customer)
  const resA = evaluateTrustScoreDelta(mockMerchant, mockUser, 'A_SAME');
  assert(resA.merchantDelta === 1 && resA.customerDelta === 1, 'Outcome A gives +1 pt increment to merchant and +1 pt to customer');
  assert(resA.merchantScoreAfter === 1 && resA.customerScoreAfter === 1, 'Scores update from 0 to +1');

  // Outcome B Bait-and-switch (-1 merchant)
  const resB = evaluateTrustScoreDelta(mockMerchant, mockUser, 'B_DIFFERENT');
  assert(resB.merchantDelta === -1, 'Outcome B Bait-and-switch penalizes merchant by -1 pt decrement');
  assert(resB.merchantScoreAfter === -1, 'Merchant score updates to -1 pt');
  assert(resB.customerDelta === 0, 'Outcome B does not penalize customer');

  // Outcome C Mismatch (-1 merchant)
  const resC = evaluateTrustScoreDelta(mockMerchant, mockUser, 'C_MISMATCH');
  assert(resC.merchantDelta === -1, 'Outcome C variant mismatch penalizes merchant by -1 pt decrement');

  // Section 8.2 Non-delivery expiry (-1 merchant)
  const resExpiry = evaluateTrustScoreDelta(mockMerchant, mockUser, 'NO_TELEMETRY', { noTelemetryExpiry: true });
  assert(resExpiry.merchantDelta === -1, 'Section 8.2 non-delivery penalty penalizes merchant by -1 pt');

  // Test 5: Warning & Strike Escalation Engine (-1 decrement per strike)
  console.log('\n🚨 Test Suite 5: Warning & Strike Escalation Engine');
  const warn1 = processUserOffense(mockUser, 'OTP retry limit exceeded');
  assert(warn1.actionTaken === 'FIRST_WARNING_ISSUED', 'First offense issues formal warning');
  assert(warn1.updatedUser.account_status === 'WARNED', 'User status becomes WARNED');
  assert(warn1.updatedUser.user_trust_score === -1, 'First warning deducts -1 pt (0 -> -1)');

  const warn2 = processUserOffense(warn1.updatedUser, 'Repeat false dispute claim');
  assert(warn2.actionTaken === 'BLACKLIST_ESCALATED', 'Repeat offense triggers blacklist escalation');
  assert(warn2.updatedUser.account_status === 'BLACKLISTED', 'User status becomes BLACKLISTED');
  assert(warn2.updatedUser.user_trust_score === -2, 'Blacklisted user trust score drops to -2 pts');

  // Test 6: Bank Dispute Dossier PDF Generation (Section 13)
  console.log('\n📄 Test Suite 6: Final PDF Dossier Synthesizer (Section 13)');
  const seededMerchant = store.getAllMerchants()[0];
  const seededUser = seededMerchant.users[0];
  const seededTrustId = seededUser.trust_ids[0];

  const pdfBuffer = await generateDisputeDossierPdf(seededTrustId, seededMerchant, seededUser);
  assert(pdfBuffer.length > 1000, `Dossier PDF generated successfully (${pdfBuffer.length} bytes)`);
  assert(pdfBuffer.toString('utf-8', 0, 4) === '%PDF', 'PDF header matches valid PDF document specification');

  console.log('\n====================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests} / ${totalTests} (100% SUCCESS)`);
  console.log('====================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
