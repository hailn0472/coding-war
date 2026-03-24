const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding problems...');

  const problems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]\n\nConstraints:\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9`,
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['Array', 'Hash Table'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Add Two Numbers',
      slug: 'add-two-numbers',
      description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.\n\nExample:\nInput: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807`,
      difficulty: 'MEDIUM',
      timeLimit: 2000,
      memoryLimit: 256,
      tags: ['Linked List', 'Math'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      slug: 'longest-substring-without-repeating',
      description: `Given a string s, find the length of the longest substring without repeating characters.\n\nExample 1:\nInput: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.\n\nExample 2:\nInput: s = "bbbbb"\nOutput: 1\n\nExample 3:\nInput: s = "pwwkew"\nOutput: 3\n\nConstraints:\n- 0 <= s.length <= 5 * 10^4\n- s consists of English letters, digits, symbols and spaces.`,
      difficulty: 'MEDIUM',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['String', 'Hash Table', 'Sliding Window'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Median of Two Sorted Arrays',
      slug: 'median-of-two-sorted-arrays',
      description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log (m+n)).\n\nExample 1:\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\n\nExample 2:\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.50000\n\nConstraints:\n- nums1.length == m\n- nums2.length == n\n- 0 <= m <= 1000\n- 0 <= n <= 1000`,
      difficulty: 'HARD',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['Array', 'Binary Search', 'Divide and Conquer'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nExample 1:\nInput: s = "()"\nOutput: true\n\nExample 2:\nInput: s = "()[]{}"\nOutput: true\n\nExample 3:\nInput: s = "(]"\nOutput: false`,
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['String', 'Stack'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Merge K Sorted Lists',
      slug: 'merge-k-sorted-lists',
      description: `You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.\n\nExample:\nInput: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]\n\nConstraints:\n- k == lists.length\n- 0 <= k <= 10^4\n- 0 <= lists[i].length <= 500\n- -10^4 <= lists[i][j] <= 10^4`,
      difficulty: 'HARD',
      timeLimit: 2000,
      memoryLimit: 512,
      tags: ['Linked List', 'Divide and Conquer', 'Heap'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Binary Search',
      slug: 'binary-search',
      description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.\n\nExample 1:\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\nExample 2:\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1`,
      difficulty: 'EASY',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['Array', 'Binary Search'],
      visibility: 'PUBLIC',
    },
    {
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      description: `Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nExample 1:\nInput: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.\n\nExample 2:\nInput: nums = [1]\nOutput: 1\n\nFollow up: If you have figured out the O(n) solution, try coding another solution using the divide and conquer approach.`,
      difficulty: 'MEDIUM',
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
      visibility: 'PUBLIC',
    },
  ];

  // Insert problems (upsert to avoid duplicates)
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`Seeded ${problems.length} problems.`);

  // Get all problem IDs for contest
  const allProblems = await prisma.problem.findMany({ select: { id: true }, take: 4 });

  console.log('Seeding contests...');

  const now = new Date();
  const contests = [
    {
      title: 'Weekly Contest #1 — Beginner',
      slug: 'weekly-contest-1',
      description: 'A beginner-friendly contest featuring easy and medium problems. Perfect for warming up your coding skills!',
      startTime: new Date(now.getTime() + 2 * 24 * 3600000), // 2 days from now
      endTime: new Date(now.getTime() + 2 * 24 * 3600000 + 3 * 3600000), // +3 hours
      scoringRule: 'ACM',
      visibility: 'PUBLIC',
    },
    {
      title: 'Coding War Challenge — Advanced',
      slug: 'coding-war-challenge-advanced',
      description: 'An advanced-level contest with hard problems. Prove your mastery of algorithms and data structures!',
      startTime: new Date(now.getTime() + 7 * 24 * 3600000), // 7 days from now
      endTime: new Date(now.getTime() + 7 * 24 * 3600000 + 5 * 3600000), // +5 hours
      freezeTime: 60,
      scoringRule: 'IOI',
      visibility: 'PUBLIC',
    },
    {
      title: 'Practice Round — Algorithms',
      slug: 'practice-round-algorithms',
      description: 'A practice round to help you prepare. No time pressure — solve at your own pace.',
      startTime: new Date(now.getTime() - 3600000), // started 1 hour ago
      endTime: new Date(now.getTime() + 48 * 3600000), // ends in 48 hours
      scoringRule: 'ACM',
      visibility: 'PUBLIC',
    },
  ];

  for (const c of contests) {
    const contest = await prisma.contest.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });

    // Add problems to contest
    const existingCP = await prisma.contestProblem.findMany({ where: { contestId: contest.id } });
    if (existingCP.length === 0 && allProblems.length > 0) {
      const problemsToAdd = allProblems.slice(0, Math.min(3, allProblems.length));
      await prisma.contestProblem.createMany({
        data: problemsToAdd.map((p, i) => ({
          contestId: contest.id,
          problemId: p.id,
          orderIndex: i,
          points: c.scoringRule === 'IOI' ? 100 : null,
        })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`Seeded ${contests.length} contests.`);

  // Add test cases for ALL problems
  const testCasesMap = {
    'two-sum': [
      { input: '4\n2 7 11 15\n9', output: '0 1', hidden: false },
      { input: '3\n3 2 4\n6', output: '1 2', hidden: false },
      { input: '2\n3 3\n6', output: '0 1', hidden: true },
    ],
    'add-two-numbers': [
      { input: '2 4 3\n5 6 4', output: '7 0 8', hidden: false },
      { input: '0\n0', output: '0', hidden: false },
      { input: '9 9 9\n1', output: '0 0 0 1', hidden: true },
    ],
    'longest-substring-without-repeating': [
      { input: 'abcabcbb', output: '3', hidden: false },
      { input: 'bbbbb', output: '1', hidden: false },
      { input: 'pwwkew', output: '3', hidden: true },
    ],
    'median-of-two-sorted-arrays': [
      { input: '1 3\n2', output: '2.00000', hidden: false },
      { input: '1 2\n3 4', output: '2.50000', hidden: false },
      { input: '0 0\n0 0', output: '0.00000', hidden: true },
    ],
    'valid-parentheses': [
      { input: '()', output: 'true', hidden: false },
      { input: '()[]{}', output: 'true', hidden: false },
      { input: '(]', output: 'false', hidden: true },
    ],
    'merge-k-sorted-lists': [
      { input: '3\n1 4 5\n1 3 4\n2 6', output: '1 1 2 3 4 4 5 6', hidden: false },
      { input: '0', output: '', hidden: false },
      { input: '1\n1', output: '1', hidden: true },
    ],
    'binary-search': [
      { input: '-1 0 3 5 9 12\n9', output: '4', hidden: false },
      { input: '-1 0 3 5 9 12\n2', output: '-1', hidden: false },
      { input: '5\n5', output: '0', hidden: true },
    ],
    'maximum-subarray': [
      { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6', hidden: false },
      { input: '1', output: '1', hidden: false },
      { input: '5 4 -1 7 8', output: '23', hidden: true },
    ],
  };

  for (const [slug, testCases] of Object.entries(testCasesMap)) {
    const problem = await prisma.problem.findUnique({ where: { slug } });
    if (!problem) continue;

    const existing = await prisma.testCase.findMany({ where: { problemId: problem.id } });
    if (existing.length > 0) continue;

    await prisma.testCase.createMany({
      data: testCases.map((tc, i) => ({
        problemId: problem.id,
        inputFile: tc.input,
        outputFile: tc.output,
        isHidden: tc.hidden,
        orderIndex: i,
      })),
    });
    console.log(`Added ${testCases.length} test cases for ${slug}.`);
  }

  console.log('Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
