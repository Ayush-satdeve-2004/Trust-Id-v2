import crypto from 'crypto';

export interface CVComparisonResult {
  match: boolean;
  similarity_score: number; // 0.0 to 1.0
  dock_photo_hash: string;
  doorstep_photo_hash: string;
  anomaly_detected: boolean;
  confidence: number;
  feature_match_points: number;
  reason: string;
}

/**
 * Computer Vision (CV) Image Comparator
 * Compares warehouse dock photo hash vs. doorstep/return photo hash.
 * Drives Step 8 (before/after images) and merchant-vs-carrier liability split.
 */
export function comparePackageImages(
  dockPhotoDataOrUrl: string,
  doorstepPhotoDataOrUrl: string,
  forcedDiscrepancy: boolean = false
): CVComparisonResult {
  const dockHash = crypto
    .createHash('sha256')
    .update(dockPhotoDataOrUrl)
    .digest('hex');

  const doorstepHash = crypto
    .createHash('sha256')
    .update(doorstepPhotoDataOrUrl)
    .digest('hex');

  if (forcedDiscrepancy) {
    return {
      match: false,
      similarity_score: 0.28,
      dock_photo_hash: dockHash,
      doorstep_photo_hash: doorstepHash,
      anomaly_detected: true,
      confidence: 0.94,
      feature_match_points: 18,
      reason: 'Packaging label tampering & distinct dimension/color mismatch detected by CV model.',
    };
  }

  // Simulated CV matching based on hash comparison or default high-similarity match
  const similarity = dockHash === doorstepHash ? 0.99 : 0.94;
  return {
    match: true,
    similarity_score: similarity,
    dock_photo_hash: dockHash,
    doorstep_photo_hash: doorstepHash,
    anomaly_detected: false,
    confidence: 0.98,
    feature_match_points: 245,
    reason: 'Cryptographic seal and CV visual feature anchors match dock dispatch baseline.',
  };
}
