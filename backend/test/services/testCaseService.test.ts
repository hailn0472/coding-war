import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import AdmZip from 'adm-zip';
import { extractTestCasesFromZip, uploadTestCases } from '../../src/services/testCaseService';
import { AppError } from '../../src/middleware/errorHandler';
import prisma from '../../src/utils/prisma';

// Mock prisma
jest.mock('../../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    problem: {
      findUnique: jest.fn<any>(),
    },
    testCase: {
      deleteMany: jest.fn<any>(),
      create: jest.fn<any>(),
    },
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock S3 service
jest.mock('../../src/services/s3Service', () => ({
  uploadTestCaseFile: jest.fn<any>().mockResolvedValue(undefined),
  deleteTestCaseFiles: jest.fn<any>().mockResolvedValue(undefined),
  getTestCaseS3Key: jest.fn<any>().mockImplementation(
    (problemId: string, orderIndex: number, type: string) =>
      `testcases/${problemId}/${orderIndex}.${type}`
  ),
}));

describe('TestCaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTestCasesFromZip', () => {
    it('should extract valid test cases from zip', () => {
      // Create a zip with test cases
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      zip.addFile('test2.in', Buffer.from('5 10\n'));
      zip.addFile('test2.out', Buffer.from('15\n'));
      
      const zipBuffer = zip.toBuffer();
      const testCases = extractTestCasesFromZip(zipBuffer);
      
      expect(testCases).toHaveLength(2);
      expect(testCases[0].input).toBe('1 2\n');
      expect(testCases[0].output).toBe('3\n');
      expect(testCases[1].input).toBe('5 10\n');
      expect(testCases[1].output).toBe('15\n');
    });

    it('should throw error if test case is missing output file', () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      // Missing test1.out
      
      const zipBuffer = zip.toBuffer();
      
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow(AppError);
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow('missing output file');
    });

    it('should throw error if test case is missing input file', () => {
      const zip = new AdmZip();
      zip.addFile('test1.out', Buffer.from('3\n'));
      // Missing test1.in
      
      const zipBuffer = zip.toBuffer();
      
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow(AppError);
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow('missing input file');
    });

    it('should throw error if no test cases found', () => {
      const zip = new AdmZip();
      zip.addFile('readme.txt', Buffer.from('No test cases here'));
      
      const zipBuffer = zip.toBuffer();
      
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow(AppError);
      expect(() => extractTestCasesFromZip(zipBuffer)).toThrow('No valid test case pairs');
    });

    it('should ignore directories in zip', () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      zip.addFile('folder/', Buffer.from(''));
      
      const zipBuffer = zip.toBuffer();
      const testCases = extractTestCasesFromZip(zipBuffer);
      
      expect(testCases).toHaveLength(1);
    });

    it('should throw error for invalid zip file', () => {
      const invalidBuffer = Buffer.from('not a zip file');
      
      expect(() => extractTestCasesFromZip(invalidBuffer)).toThrow(AppError);
      
      try {
        extractTestCasesFromZip(invalidBuffer);
      } catch (error) {
        expect((error as AppError).code).toBe('INVALID_ZIP_FILE');
      }
    });
  });

  describe('uploadTestCases', () => {
    const mockProblemId = 'problem-123';
    
    beforeEach(() => {
      (prisma.problem.findUnique as jest.Mock<any>).mockResolvedValue({
        id: mockProblemId,
        title: 'Test Problem',
      });
      (prisma.testCase.deleteMany as jest.Mock<any>).mockResolvedValue({ count: 0 });
      (prisma.testCase.create as jest.Mock<any>).mockResolvedValue({});
    });

    it('should upload test cases successfully with S3 keys and checksums', async () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      zip.addFile('test2.in', Buffer.from('5 10\n'));
      zip.addFile('test2.out', Buffer.from('15\n'));
      
      const zipBuffer = zip.toBuffer();
      const count = await uploadTestCases(mockProblemId, zipBuffer, 1);
      
      expect(count).toBe(2);
      expect(prisma.problem.findUnique).toHaveBeenCalledWith({
        where: { id: mockProblemId },
      });
      expect(prisma.testCase.deleteMany).toHaveBeenCalledWith({
        where: { problemId: mockProblemId },
      });
      expect(prisma.testCase.create).toHaveBeenCalledTimes(2);
    });

    it('should store S3 keys instead of raw content', async () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer, 1);
      
      const createCalls = (prisma.testCase.create as jest.Mock).mock.calls;
      const data = (createCalls[0][0] as any).data;
      
      // inputFile should be an S3 key, not raw content
      expect(data.inputFile).toBe(`testcases/${mockProblemId}/0.in`);
      expect(data.outputFile).toBe(`testcases/${mockProblemId}/0.out`);
    });

    it('should compute and store SHA-256 checksums', async () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer, 1);
      
      const createCalls = (prisma.testCase.create as jest.Mock).mock.calls;
      const data = (createCalls[0][0] as any).data;
      
      // Should have checksum fields that are 64-char hex strings
      expect(data.inputChecksum).toBeDefined();
      expect(data.inputChecksum).toHaveLength(64);
      expect(data.inputChecksum).toMatch(/^[0-9a-f]{64}$/);
      
      expect(data.outputChecksum).toBeDefined();
      expect(data.outputChecksum).toHaveLength(64);
      expect(data.outputChecksum).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should upload files to S3', async () => {
      const { uploadTestCaseFile } = require('../../src/services/s3Service');
      
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer, 1);
      
      // Should upload 2 files (1 input + 1 output)
      expect(uploadTestCaseFile).toHaveBeenCalledTimes(2);
    });

    it('should delete existing S3 files before uploading new ones', async () => {
      const { deleteTestCaseFiles } = require('../../src/services/s3Service');
      
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer);
      
      expect(deleteTestCaseFiles).toHaveBeenCalledWith(mockProblemId);
    });

    it('should mark first sampleCount test cases as non-hidden', async () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      zip.addFile('test2.in', Buffer.from('5 10\n'));
      zip.addFile('test2.out', Buffer.from('15\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer, 1);
      
      const createCalls = (prisma.testCase.create as jest.Mock).mock.calls;
      
      // First test case should be visible (isHidden = false)
      expect((createCalls[0][0] as any).data.isHidden).toBe(false);
      
      // Second test case should be hidden (isHidden = true)
      expect((createCalls[1][0] as any).data.isHidden).toBe(true);
    });

    it('should throw error if problem not found', async () => {
      (prisma.problem.findUnique as jest.Mock<any>).mockResolvedValue(null);
      
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      
      await expect(uploadTestCases(mockProblemId, zipBuffer)).rejects.toThrow(AppError);
      await expect(uploadTestCases(mockProblemId, zipBuffer)).rejects.toThrow('Problem not found');
    });

    it('should delete existing test cases before creating new ones', async () => {
      const zip = new AdmZip();
      zip.addFile('test1.in', Buffer.from('1 2\n'));
      zip.addFile('test1.out', Buffer.from('3\n'));
      
      const zipBuffer = zip.toBuffer();
      await uploadTestCases(mockProblemId, zipBuffer);
      
      expect(prisma.testCase.deleteMany).toHaveBeenCalledWith({
        where: { problemId: mockProblemId },
      });
    });
  });
});
