import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { judgeSubmission } from '../../src/../src/services/judgeService';
import prisma from '../../src/../src/utils/prisma';
import { SubmissionStatus, Language } from '@prisma/client';
import type { SubmissionJobData } from '../../src/../src/services/submissionQueue';

/**
 * Judge Service Tests
 * Tests the main judge worker process
 */

describe('Judge Service', () => {
  let testUserId: string;
  let testProblemId: string;
  let testSubmissionId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        isEmailVerified: true,
      },
    });
    testUserId = user.id;

    // Create test problem
    const problem = await prisma.problem.create({
      data: {
        title: 'Test Problem',
        slug: `test-problem-${Date.now()}`,
        description: 'A simple test problem',
        difficulty: 'EASY',
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
      },
    });
    testProblemId = problem.id;

    // Create test cases (S3 keys + SHA-256 checksums)
    await prisma.testCase.createMany({
      data: [
        {
          problemId: testProblemId,
          inputFile: `testcases/${testProblemId}/0.in`,
          outputFile: `testcases/${testProblemId}/0.out`,
          inputChecksum: 'a3a2e5b668157da3e4309bab39eabb4902c86562e2b0e66b705ea920a2f9924e', // SHA-256 of '5 3'
          outputChecksum: '2c624232cdd221771294dfbb310aca000a0df6ac8b166e8b32c4bde471f07cbc', // SHA-256 of '8'
          isHidden: false,
          orderIndex: 0,
        },
        {
          problemId: testProblemId,
          inputFile: `testcases/${testProblemId}/1.in`,
          outputFile: `testcases/${testProblemId}/1.out`,
          inputChecksum: '64e604787cbf194841e7b68d7cd28786f6c9a0a3ab9f8b0a0e87cb4387ab0107', // SHA-256 of '10 20'
          outputChecksum: '624b60c58c9d8bfb6ff1886c2fd605d2adeb6ea4da576068201b6c6958ce93f4', // SHA-256 of '30'
          isHidden: false,
          orderIndex: 1,
        },
      ],
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (testSubmissionId) {
      await prisma.testCaseResult.deleteMany({
        where: { submissionId: testSubmissionId },
      });
      await prisma.submission.delete({
        where: { id: testSubmissionId },
      });
    }

    await prisma.testCase.deleteMany({
      where: { problemId: testProblemId },
    });

    await prisma.problem.delete({
      where: { id: testProblemId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('Successful Judging', () => {
    it('should judge C submission successfully and return ACCEPTED', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`;

      // Create submission
      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      // Verify submission was updated
      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission).not.toBeNull();
      expect(updatedSubmission!.status).toBe(SubmissionStatus.ACCEPTED);
      expect(updatedSubmission!.verdict).toBe('ACCEPTED');
      expect(updatedSubmission!.executionTime).toBeGreaterThan(0);
      expect(updatedSubmission!.memoryUsed).toBeGreaterThan(0);
      expect(updatedSubmission!.judgedAt).not.toBeNull();

      // Verify test case results were saved
      const testCaseResults = await prisma.testCaseResult.findMany({
        where: { submissionId: submission.id },
      });

      expect(testCaseResults).toHaveLength(2);
      expect(testCaseResults.every(r => r.status === SubmissionStatus.ACCEPTED)).toBe(true);
    }, 120000);

    it('should judge C++ submission successfully', async () => {
      const sourceCode = `
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.CPP,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'CPP',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.ACCEPTED);
    }, 120000);

    it('should judge Python submission successfully', async () => {
      const sourceCode = `
a, b = map(int, input().split())
print(a + b)
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.PYTHON,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'PYTHON',
        sourceCode,
        timeLimit: 2000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.ACCEPTED);
    }, 120000);

    it('should judge Java submission successfully', async () => {
      const sourceCode = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.JAVA,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'JAVA',
        sourceCode,
        timeLimit: 2000,
        memoryLimit: 512,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.ACCEPTED);
    }, 120000);
  });

  describe('Compilation Errors', () => {
    it('should handle compilation error and save error message', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Missing semicolon")
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.COMPILATION_ERROR);
      expect(updatedSubmission!.verdict).toBe('COMPILATION_ERROR');
      expect(updatedSubmission!.compilationError).toBeDefined();
      expect(updatedSubmission!.compilationError).toContain('error');
      expect(updatedSubmission!.judgedAt).not.toBeNull();
    }, 120000);
  });

  describe('Wrong Answer', () => {
    it('should return WRONG_ANSWER for incorrect output', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a - b);  // Wrong operation
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.WRONG_ANSWER);
      expect(updatedSubmission!.verdict).toBe('WRONG_ANSWER');

      // Check test case results
      const testCaseResults = await prisma.testCaseResult.findMany({
        where: { submissionId: submission.id },
      });

      expect(testCaseResults.some(r => r.status === SubmissionStatus.WRONG_ANSWER)).toBe(true);
    }, 120000);
  });

  describe('Runtime Errors', () => {
    it('should return RUNTIME_ERROR for program that crashes', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int *ptr = NULL;
    *ptr = 42;  // Segmentation fault
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.RUNTIME_ERROR);
      expect(updatedSubmission!.verdict).toBe('RUNTIME_ERROR');
    }, 120000);
  });

  describe('Time Limit Exceeded', () => {
    it('should return TIME_LIMIT_EXCEEDED for infinite loop', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    while(1) {
        // Infinite loop
    }
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.TIME_LIMIT_EXCEEDED);
      expect(updatedSubmission!.verdict).toBe('TIME_LIMIT_EXCEEDED');
    }, 120000);
  });

  describe('Test Case Results', () => {
    it('should save all test case results', async () => {
      const sourceCode = `
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("%d\\n", a + b);
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const testCaseResults = await prisma.testCaseResult.findMany({
        where: { submissionId: submission.id },
        orderBy: { testCase: { orderIndex: 'asc' } },
      });

      expect(testCaseResults).toHaveLength(2);

      // Check first test case
      expect(testCaseResults[0].status).toBe(SubmissionStatus.ACCEPTED);
      expect(testCaseResults[0].executionTime).toBeGreaterThan(0);
      expect(testCaseResults[0].memoryUsed).toBeGreaterThan(0);

      // Check second test case
      expect(testCaseResults[1].status).toBe(SubmissionStatus.ACCEPTED);
      expect(testCaseResults[1].executionTime).toBeGreaterThan(0);
      expect(testCaseResults[1].memoryUsed).toBeGreaterThan(0);
    }, 120000);
  });

  describe('Edge Cases', () => {
    it('should handle problem with no test cases', async () => {
      // Delete test cases
      await prisma.testCase.deleteMany({
        where: { problemId: testProblemId },
      });

      const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello\\n");
    return 0;
}
`;

      const submission = await prisma.submission.create({
        data: {
          userId: testUserId,
          problemId: testProblemId,
          language: Language.C,
          sourceCode,
          status: SubmissionStatus.QUEUED,
        },
      });
      testSubmissionId = submission.id;

      const jobData: SubmissionJobData = {
        submissionId: submission.id,
        userId: testUserId,
        problemId: testProblemId,
        language: 'C',
        sourceCode,
        timeLimit: 1000,
        memoryLimit: 256,
      };

      await judgeSubmission(jobData);

      const updatedSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
      });

      expect(updatedSubmission!.status).toBe(SubmissionStatus.RUNTIME_ERROR);
      expect(updatedSubmission!.compilationError).toContain('No test cases');
    }, 120000);
  });
});
