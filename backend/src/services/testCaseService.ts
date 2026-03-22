import AdmZip from 'adm-zip';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * Test Case Service
 * Handles test case upload and management
 * Requirements: REQ-5.3, REQ-5.4
 */

interface TestCaseFile {
  input: string;
  output: string;
  orderIndex: number;
}

/**
 * Validate and extract test cases from a zip file
 * @param zipBuffer - Buffer containing the zip file
 * @returns Array of test case files with input/output pairs
 */
export function extractTestCasesFromZip(zipBuffer: Buffer): TestCaseFile[] {
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    
    // Group files by base name
    const fileMap = new Map<string, { input?: string; output?: string }>();
    
    for (const entry of zipEntries) {
      // Skip directories
      if (entry.isDirectory) {
        continue;
      }
      
      const fileName = entry.entryName;
      
      // Match .in and .out files
      const inMatch = fileName.match(/^(.+)\.in$/);
      const outMatch = fileName.match(/^(.+)\.out$/);
      
      if (inMatch) {
        const baseName = inMatch[1];
        const existing = fileMap.get(baseName) || {};
        existing.input = entry.getData().toString('utf8');
        fileMap.set(baseName, existing);
      } else if (outMatch) {
        const baseName = outMatch[1];
        const existing = fileMap.get(baseName) || {};
        existing.output = entry.getData().toString('utf8');
        fileMap.set(baseName, existing);
      }
    }
    
    // Validate that all test cases have both input and output
    const testCases: TestCaseFile[] = [];
    let orderIndex = 0;
    
    for (const [baseName, files] of fileMap.entries()) {
      if (!files.input || !files.output) {
        throw new AppError(
          400,
          'INVALID_TEST_CASE_STRUCTURE',
          `Test case "${baseName}" is missing ${!files.input ? 'input' : 'output'} file`
        );
      }
      
      testCases.push({
        input: files.input,
        output: files.output,
        orderIndex: orderIndex++,
      });
    }
    
    if (testCases.length === 0) {
      throw new AppError(
        400,
        'NO_TEST_CASES_FOUND',
        'No valid test case pairs (.in and .out files) found in zip file'
      );
    }
    
    // Sort by base name for consistent ordering
    testCases.sort((a, b) => a.orderIndex - b.orderIndex);
    
    return testCases;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    logger.error('Failed to extract test cases from zip', { error });
    throw new AppError(
      400,
      'INVALID_ZIP_FILE',
      'Failed to extract test cases from zip file. Ensure the file is a valid zip archive.'
    );
  }
}

/**
 * Upload test cases for a problem
 * @param problemId - Problem ID
 * @param zipBuffer - Buffer containing the zip file
 * @param sampleCount - Number of test cases to mark as non-hidden (samples)
 * @returns Number of test cases created
 */
export async function uploadTestCases(
  problemId: string,
  zipBuffer: Buffer,
  sampleCount: number = 0
): Promise<number> {
  // Validate problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });
  
  if (!problem) {
    throw new AppError(404, 'PROBLEM_NOT_FOUND', 'Problem not found');
  }
  
  // Extract test cases from zip
  const testCases = extractTestCasesFromZip(zipBuffer);
  
  // Delete existing test cases for this problem
  await prisma.testCase.deleteMany({
    where: { problemId },
  });
  
  // Create new test cases
  const createPromises = testCases.map((tc, index) => {
    return prisma.testCase.create({
      data: {
        problemId,
        inputFile: tc.input,
        outputFile: tc.output,
        isHidden: index >= sampleCount, // First sampleCount test cases are visible
        orderIndex: tc.orderIndex,
      },
    });
  });
  
  await Promise.all(createPromises);
  
  logger.info('Test cases uploaded successfully', {
    problemId,
    count: testCases.length,
    sampleCount,
  });
  
  return testCases.length;
}

/**
 * Get test cases for a problem
 * @param problemId - Problem ID
 * @param includeHidden - Whether to include hidden test cases
 * @returns Array of test cases
 */
export async function getTestCases(problemId: string, includeHidden: boolean = false) {
  const where: any = { problemId };
  
  if (!includeHidden) {
    where.isHidden = false;
  }
  
  return prisma.testCase.findMany({
    where,
    orderBy: {
      orderIndex: 'asc',
    },
  });
}
