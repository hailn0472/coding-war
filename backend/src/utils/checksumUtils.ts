/**
 * Checksum Utility
 * SHA-256 integrity verification for testcase files
 * Requirements: SDD 3.2.4 (Resource Downloader — Verify SHA-256)
 */

import { createHash } from 'crypto';

/**
 * Compute SHA-256 hex digest of content
 * @param content - Buffer or string to hash
 * @returns Hex-encoded SHA-256 digest
 */
export function computeSHA256(content: Buffer | string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Verify SHA-256 checksum of content against expected value
 * @param content - Buffer or string to verify
 * @param expectedChecksum - Expected hex-encoded SHA-256 digest
 * @returns true if checksums match
 */
export function verifySHA256(content: Buffer | string, expectedChecksum: string): boolean {
  const actualChecksum = computeSHA256(content);
  // Use timing-safe comparison to prevent timing attacks
  if (actualChecksum.length !== expectedChecksum.length) {
    return false;
  }

  const actualBuf = Buffer.from(actualChecksum, 'hex');
  const expectedBuf = Buffer.from(expectedChecksum, 'hex');

  // Node.js crypto.timingSafeEqual prevents timing side-channel attacks
  const { timingSafeEqual } = require('crypto');
  return timingSafeEqual(actualBuf, expectedBuf);
}
