import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  listProblems,
  generateSlug,
} from '../../src/../src/services/problemService';
import prisma from '../../src/utils/prisma';
import { Difficulty, Visibility } from '@prisma/client';

describe('Problem Service', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.testCase.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.problem.deleteMany({});
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      const slug = generateSlug('Hello World');
      expect(slug).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const slug = generateSlug('Two Sum Problem');
      expect(slug).toBe('two-sum-problem');
    });

    it('should remove special characters', () => {
      const slug = generateSlug('Problem #1: A+B');
      expect(slug).toBe('problem-1-ab');
    });

    it('should handle multiple consecutive spaces', () => {
      const slug = generateSlug('Multiple    Spaces');
      expect(slug).toBe('multiple-spaces');
    });

    it('should handle leading and trailing spaces', () => {
      const slug = generateSlug('  Trimmed  ');
      expect(slug).toBe('trimmed');
    });

    it('should handle empty string', () => {
      const slug = generateSlug('');
      expect(slug).toBe('');
    });

    it('should limit slug length to 255 characters', () => {
      const longTitle = 'a'.repeat(300);
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(255);
    });

    it('should handle unicode characters', () => {
      const slug = generateSlug('Bài toán 测试');
      expect(slug).toBe('bi-ton-');
    });
  });

  describe('createProblem', () => {
    it('should create a problem with all fields', async () => {
      const problemData = {
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['array', 'hash-table'],
        visibility: Visibility.PUBLIC,
      };

      const problem = await createProblem(problemData);

      expect(problem).toBeDefined();
      expect(problem.id).toBeDefined();
      expect(problem.title).toBe(problemData.title);
      expect(problem.slug).toBe('two-sum');
      expect(problem.description).toBe(problemData.description);
      expect(problem.difficulty).toBe(problemData.difficulty);
      expect(problem.timeLimit).toBe(problemData.timeLimit);
      expect(problem.memoryLimit).toBe(problemData.memoryLimit);
      expect(problem.tags).toEqual(problemData.tags);
      expect(problem.visibility).toBe(problemData.visibility);
      expect(problem.createdAt).toBeInstanceOf(Date);
      expect(problem.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique slug for duplicate titles', async () => {
      const problemData = {
        title: 'Duplicate Title',
        description: 'First problem',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 2000,
        memoryLimit: 512,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      };

      const problem1 = await createProblem(problemData);
      const problem2 = await createProblem({
        ...problemData,
        description: 'Second problem',
      });

      expect(problem1.slug).toBe('duplicate-title');
      expect(problem2.slug).toBe('duplicate-title-1');
    });

    it('should handle empty tags array', async () => {
      const problemData = {
        title: 'No Tags Problem',
        description: 'Problem without tags',
        difficulty: Difficulty.HARD,
        timeLimit: 3000,
        memoryLimit: 1024,
        tags: [],
        visibility: Visibility.PRIVATE,
      };

      const problem = await createProblem(problemData);

      expect(problem.tags).toEqual([]);
    });

    it('should create problem with CONTEST_ONLY visibility', async () => {
      const problemData = {
        title: 'Contest Problem',
        description: 'Only for contests',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 1500,
        memoryLimit: 512,
        tags: ['contest'],
        visibility: Visibility.CONTEST_ONLY,
      };

      const problem = await createProblem(problemData);

      expect(problem.visibility).toBe(Visibility.CONTEST_ONLY);
    });
  });

  describe('updateProblem', () => {
    it('should update problem title and regenerate slug', async () => {
      const problem = await createProblem({
        title: 'Original Title',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        title: 'Updated Title',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.slug).toBe('updated-title');
    });

    it('should update difficulty', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        difficulty: Difficulty.HARD,
      });

      expect(updated.difficulty).toBe(Difficulty.HARD);
    });

    it('should update time and memory limits', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Description',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        timeLimit: 2000,
        memoryLimit: 512,
      });

      expect(updated.timeLimit).toBe(2000);
      expect(updated.memoryLimit).toBe(512);
    });

    it('should update tags', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['old-tag'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        tags: ['new-tag-1', 'new-tag-2'],
      });

      expect(updated.tags).toEqual(['new-tag-1', 'new-tag-2']);
    });

    it('should update visibility', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        visibility: Visibility.PRIVATE,
      });

      expect(updated.visibility).toBe(Visibility.PRIVATE);
    });

    it('should update multiple fields at once', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Old description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['old'],
        visibility: Visibility.PUBLIC,
      });

      const updated = await updateProblem(problem.id, {
        title: 'New Title',
        description: 'New description',
        difficulty: Difficulty.HARD,
        tags: ['new'],
      });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New description');
      expect(updated.difficulty).toBe(Difficulty.HARD);
      expect(updated.tags).toEqual(['new']);
    });

    it('should throw error for non-existent problem', async () => {
      await expect(
        updateProblem('non-existent-id', { title: 'New Title' })
      ).rejects.toThrow();
    });
  });

  describe('deleteProblem', () => {
    it('should delete a problem', async () => {
      const problem = await createProblem({
        title: 'To Delete',
        description: 'Will be deleted',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const deleted = await deleteProblem(problem.id);

      expect(deleted.id).toBe(problem.id);

      // Verify it's actually deleted
      const found = await prisma.problem.findUnique({
        where: { id: problem.id },
      });
      expect(found).toBeNull();
    });

    it('should cascade delete test cases', async () => {
      const problem = await createProblem({
        title: 'With Test Cases',
        description: 'Has test cases',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      // Create test cases
      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: '1 2',
          outputFile: '3',
          isHidden: false,
          orderIndex: 0,
        },
      });

      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: '5 10',
          outputFile: '15',
          isHidden: true,
          orderIndex: 1,
        },
      });

      await deleteProblem(problem.id);

      // Verify test cases are deleted
      const testCases = await prisma.testCase.findMany({
        where: { problemId: problem.id },
      });
      expect(testCases).toHaveLength(0);
    });

    it('should throw error for non-existent problem', async () => {
      await expect(deleteProblem('non-existent-id')).rejects.toThrow();
    });
  });

  describe('getProblemById', () => {
    it('should get problem with test cases', async () => {
      const problem = await createProblem({
        title: 'Test Problem',
        description: 'Description',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 1500,
        memoryLimit: 512,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      // Create test cases
      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: '1 2',
          outputFile: '3',
          isHidden: false,
          orderIndex: 0,
        },
      });

      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: '5 10',
          outputFile: '15',
          isHidden: true,
          orderIndex: 1,
        },
      });

      const found = await getProblemById(problem.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(problem.id);
      expect(found?.testCases).toHaveLength(2);
      expect(found?.testCases[0].orderIndex).toBe(0);
      expect(found?.testCases[1].orderIndex).toBe(1);
    });

    it('should return null for non-existent problem', async () => {
      const found = await getProblemById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should return problem with empty test cases array', async () => {
      const problem = await createProblem({
        title: 'No Test Cases',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      const found = await getProblemById(problem.id);

      expect(found).toBeDefined();
      expect(found?.testCases).toHaveLength(0);
    });

    it('should order test cases by orderIndex', async () => {
      const problem = await createProblem({
        title: 'Ordered Test Cases',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      // Create test cases in reverse order
      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: 'third',
          outputFile: '3',
          isHidden: false,
          orderIndex: 2,
        },
      });

      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: 'first',
          outputFile: '1',
          isHidden: false,
          orderIndex: 0,
        },
      });

      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          inputFile: 'second',
          outputFile: '2',
          isHidden: false,
          orderIndex: 1,
        },
      });

      const found = await getProblemById(problem.id);

      expect(found?.testCases[0].inputFile).toBe('first');
      expect(found?.testCases[1].inputFile).toBe('second');
      expect(found?.testCases[2].inputFile).toBe('third');
    });
  });

  describe('listProblems', () => {
    beforeEach(async () => {
      // Create test problems
      await createProblem({
        title: 'Easy Problem 1',
        description: 'Easy problem',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['array', 'easy'],
        visibility: Visibility.PUBLIC,
      });

      await createProblem({
        title: 'Medium Problem 1',
        description: 'Medium problem',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 2000,
        memoryLimit: 512,
        tags: ['graph', 'medium'],
        visibility: Visibility.PUBLIC,
      });

      await createProblem({
        title: 'Hard Problem 1',
        description: 'Hard problem',
        difficulty: Difficulty.HARD,
        timeLimit: 3000,
        memoryLimit: 1024,
        tags: ['dp', 'hard'],
        visibility: Visibility.PUBLIC,
      });

      await createProblem({
        title: 'Private Problem',
        description: 'Private problem',
        difficulty: Difficulty.MEDIUM,
        timeLimit: 2000,
        memoryLimit: 512,
        tags: ['private'],
        visibility: Visibility.PRIVATE,
      });
    });

    it('should list all problems without filters', async () => {
      const result = await listProblems();

      expect(result.problems).toHaveLength(4);
      expect(result.total).toBe(4);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by difficulty', async () => {
      const result = await listProblems({
        difficulty: Difficulty.EASY,
      });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].difficulty).toBe(Difficulty.EASY);
      expect(result.total).toBe(1);
    });

    it('should filter by tags', async () => {
      const result = await listProblems({
        tags: ['array'],
      });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].tags).toContain('array');
    });

    it('should filter by visibility', async () => {
      const result = await listProblems({
        visibility: Visibility.PRIVATE,
      });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].visibility).toBe(Visibility.PRIVATE);
    });

    it('should filter by multiple criteria', async () => {
      const result = await listProblems({
        difficulty: Difficulty.MEDIUM,
        visibility: Visibility.PUBLIC,
      });

      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].difficulty).toBe(Difficulty.MEDIUM);
      expect(result.problems[0].visibility).toBe(Visibility.PUBLIC);
    });

    it('should paginate results', async () => {
      const page1 = await listProblems({
        page: 1,
        limit: 2,
      });

      expect(page1.problems).toHaveLength(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBe(4);
      expect(page1.totalPages).toBe(2);

      const page2 = await listProblems({
        page: 2,
        limit: 2,
      });

      expect(page2.problems).toHaveLength(2);
      expect(page2.page).toBe(2);
    });

    it('should handle empty results', async () => {
      const result = await listProblems({
        tags: ['non-existent-tag'],
      });

      expect(result.problems).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should order by createdAt descending', async () => {
      const result = await listProblems();

      // Most recent first
      expect(result.problems[0].title).toBe('Private Problem');
      expect(result.problems[3].title).toBe('Easy Problem 1');
    });

    it('should handle page beyond total pages', async () => {
      const result = await listProblems({
        page: 10,
        limit: 20,
      });

      expect(result.problems).toHaveLength(0);
      expect(result.page).toBe(10);
    });

    it('should use default pagination values', async () => {
      const result = await listProblems({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle long problem title within limit', async () => {
      const longTitle = 'A'.repeat(250); // Within 255 char limit
      const problem = await createProblem({
        title: longTitle,
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      expect(problem.title).toBe(longTitle);
      expect(problem.slug.length).toBeLessThanOrEqual(255);
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(10000);
      const problem = await createProblem({
        title: 'Test',
        description: longDescription,
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      expect(problem.description).toBe(longDescription);
    });

    it('should handle many tags', async () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
      const problem = await createProblem({
        title: 'Many Tags',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 1000,
        memoryLimit: 256,
        tags: manyTags,
        visibility: Visibility.PUBLIC,
      });

      expect(problem.tags).toHaveLength(50);
    });

    it('should handle zero time limit', async () => {
      const problem = await createProblem({
        title: 'Zero Time',
        description: 'Description',
        difficulty: Difficulty.EASY,
        timeLimit: 0,
        memoryLimit: 256,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      expect(problem.timeLimit).toBe(0);
    });

    it('should handle very large time and memory limits', async () => {
      const problem = await createProblem({
        title: 'Large Limits',
        description: 'Description',
        difficulty: Difficulty.HARD,
        timeLimit: 999999,
        memoryLimit: 999999,
        tags: ['test'],
        visibility: Visibility.PUBLIC,
      });

      expect(problem.timeLimit).toBe(999999);
      expect(problem.memoryLimit).toBe(999999);
    });
  });
});
