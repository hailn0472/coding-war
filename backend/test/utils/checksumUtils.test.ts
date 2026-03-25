import { describe, it, expect } from '@jest/globals';
import { computeSHA256, verifySHA256 } from '../../src/utils/checksumUtils';

describe('checksumUtils', () => {
  // Known SHA-256 test vector: SHA-256 of empty string
  const EMPTY_STRING_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  // Known SHA-256 test vector: SHA-256 of "hello"
  const HELLO_SHA256 = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';

  describe('computeSHA256', () => {
    it('should compute SHA-256 of empty string', () => {
      expect(computeSHA256('')).toBe(EMPTY_STRING_SHA256);
    });

    it('should compute SHA-256 of a known string', () => {
      expect(computeSHA256('hello')).toBe(HELLO_SHA256);
    });

    it('should compute SHA-256 of a Buffer', () => {
      const buffer = Buffer.from('hello', 'utf8');
      expect(computeSHA256(buffer)).toBe(HELLO_SHA256);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = computeSHA256('input1');
      const hash2 = computeSHA256('input2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hashes for the same input', () => {
      const hash1 = computeSHA256('test data');
      const hash2 = computeSHA256('test data');
      expect(hash1).toBe(hash2);
    });

    it('should return a 64-character hex string', () => {
      const hash = computeSHA256('any content');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('verifySHA256', () => {
    it('should return true for matching checksum', () => {
      expect(verifySHA256('hello', HELLO_SHA256)).toBe(true);
    });

    it('should return false for non-matching checksum', () => {
      expect(verifySHA256('hello', EMPTY_STRING_SHA256)).toBe(false);
    });

    it('should return true for Buffer with matching checksum', () => {
      const buffer = Buffer.from('hello', 'utf8');
      expect(verifySHA256(buffer, HELLO_SHA256)).toBe(true);
    });

    it('should return false for tampered content', () => {
      // Simulates an attacker modifying testcase content in S3
      const originalChecksum = computeSHA256('original test input');
      expect(verifySHA256('tampered test input', originalChecksum)).toBe(false);
    });

    it('should return false for wrong-length checksum', () => {
      expect(verifySHA256('hello', 'tooshort')).toBe(false);
    });
  });
});
