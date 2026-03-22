import prisma from '../utils/prisma';
import { Difficulty, Visibility } from '@prisma/client';

/**
 * Problem Service
 * Handles CRUD operations for problems including test cases
 */

interface CreateProblemInput {
  title: string;
  description: string;
  difficulty: Difficulty;
  timeLimit: number;
  memoryLimit: number;
  tags: string[];
  visibility: Visibility;
}

interface UpdateProblemInput {
  title?: string;
  description?: string;
  difficulty?: Difficulty;
  timeLimit?: number;
  memoryLimit?: number;
  tags?: string[];
  visibility?: Visibility;
}

interface ListProblemsFilter {
  difficulty?: Difficulty;
  tags?: string[];
  visibility?: Visibility;
  page?: number;
  limit?: number;
}

/**
 * Generate a URL-friendly slug from a title
 * @param title - Problem title
 * @returns URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .substring(0, 255);        // Limit to 255 characters
}

/**
 * Ensure slug is unique by appending a number if necessary
 * @param baseSlug - Base slug to make unique
 * @returns Unique slug
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.problem.findUnique({
      where: { slug },
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a new problem
 * @param data - Problem data
 * @returns Created problem
 */
export async function createProblem(data: CreateProblemInput) {
  const baseSlug = generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);
  
  return prisma.problem.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      memoryLimit: data.memoryLimit,
      tags: data.tags,
      visibility: data.visibility,
    },
  });
}

/**
 * Update an existing problem
 * @param id - Problem ID
 * @param data - Partial problem data to update
 * @returns Updated problem
 */
export async function updateProblem(id: string, data: UpdateProblemInput) {
  const updateData: any = { ...data };
  
  // If title is being updated, regenerate slug
  if (data.title) {
    const baseSlug = generateSlug(data.title);
    const slug = await ensureUniqueSlug(baseSlug);
    updateData.slug = slug;
  }
  
  return prisma.problem.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a problem and cascade delete test cases and submissions
 * @param id - Problem ID
 * @returns Deleted problem
 */
export async function deleteProblem(id: string) {
  // Prisma will handle cascade deletion based on schema
  return prisma.problem.delete({
    where: { id },
  });
}

/**
 * Get a problem by ID with test cases loaded
 * @param id - Problem ID
 * @returns Problem with test cases
 */
export async function getProblemById(id: string) {
  return prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        orderBy: {
          orderIndex: 'asc',
        },
      },
    },
  });
}

/**
 * List problems with filtering and pagination
 * @param filter - Filter options
 * @returns Paginated list of problems
 */
export async function listProblems(filter: ListProblemsFilter = {}) {
  const {
    difficulty,
    tags,
    visibility,
    page = 1,
    limit = 20,
  } = filter;
  
  // Build where clause
  const where: any = {};
  
  if (difficulty) {
    where.difficulty = difficulty;
  }
  
  if (tags && tags.length > 0) {
    where.tags = {
      hasSome: tags,
    };
  }
  
  if (visibility) {
    where.visibility = visibility;
  }
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.problem.count({ where }),
  ]);
  
  return {
    problems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
