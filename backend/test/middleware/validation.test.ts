import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { 
  validateRequest, 
  sanitizeString, 
  sanitizeObject, 
  sanitizeBody 
} from '../../src/../src/middleware/validation';
import { AppError } from '../../src/../src/middleware/errorHandler';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    it('should validate request body successfully', () => {
      const schema = {
        body: z.object({
          username: z.string().min(3),
          email: z.string().email(),
        }),
      };

      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('should validate query parameters successfully', () => {
      const schema = {
        query: z.object({
          page: z.coerce.number().int().min(1),
          limit: z.coerce.number().int().min(1).max(100),
        }),
      };

      mockRequest.query = {
        page: '2',
        limit: '20',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        page: 2,
        limit: 20,
      });
    });

    it('should validate route parameters successfully', () => {
      const schema = {
        params: z.object({
          id: z.string().uuid(),
        }),
      };

      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass ZodError to next on validation failure', () => {
      const schema = {
        body: z.object({
          username: z.string().min(3),
          email: z.string().email(),
        }),
      };

      mockRequest.body = {
        username: 'ab', // Too short
        email: 'invalid-email',
      };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should validate multiple parts of request', () => {
      const schema = {
        body: z.object({
          title: z.string(),
        }),
        query: z.object({
          page: z.coerce.number(),
        }),
        params: z.object({
          id: z.string().uuid(),
        }),
      };

      mockRequest.body = { title: 'Test' };
      mockRequest.query = { page: '1' };
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle non-ZodError exceptions', () => {
      const schema = {
        body: z.object({}).transform(() => {
          throw new Error('Custom error');
        }),
      };

      mockRequest.body = {};

      const middleware = validateRequest(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).toBe('scriptalert("xss")/scriptHello');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")';
      const result = sanitizeString(input);
      expect(result).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeString(input);
      expect(result).toBe('hello world');
    });

    it('should handle empty strings', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should handle normal text without changes', () => {
      const input = 'This is normal text';
      const result = sanitizeString(input);
      expect(result).toBe('This is normal text');
    });

    it('should remove multiple dangerous patterns', () => {
      const input = '<img src=x onerror=alert("xss")>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('onerror=');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in object', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
      };
      const result = sanitizeObject(input);
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<script>alert("xss")</script>',
          profile: {
            bio: 'onclick=alert("xss")',
          },
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.profile.bio).not.toContain('onclick=');
    });

    it('should sanitize arrays of strings', () => {
      const input = {
        tags: ['<script>tag1</script>', 'tag2', 'onclick=tag3'],
      };
      const result = sanitizeObject(input);
      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[1]).toBe('tag2');
      expect(result.tags[2]).not.toContain('onclick=');
    });

    it('should sanitize arrays of objects', () => {
      const input = {
        items: [
          { name: '<script>item1</script>' },
          { name: 'item2' },
        ],
      };
      const result = sanitizeObject(input);
      expect(result.items[0].name).not.toContain('<script>');
      expect(result.items[1].name).toBe('item2');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        score: null,
        metadata: undefined,
      };
      const result = sanitizeObject(input);
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.score).toBeNull();
      expect(result.metadata).toBeUndefined();
    });

    it('should handle empty objects', () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it('should handle complex nested structures', () => {
      const input = {
        user: {
          name: '<script>John</script>',
          posts: [
            {
              title: 'onclick=Post 1',
              comments: [
                { text: 'javascript:Comment 1' },
              ],
            },
          ],
        },
      };
      const result = sanitizeObject(input);
      expect(result.user.name).not.toContain('<script>');
      expect(result.user.posts[0].title).not.toContain('onclick=');
      expect(result.user.posts[0].comments[0].text).not.toContain('javascript:');
    });
  });

  describe('sanitizeBody', () => {
    it('should sanitize request body', () => {
      mockRequest.body = {
        username: '<script>alert("xss")</script>testuser',
        email: 'test@example.com',
      };

      sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.username).not.toContain('<script>');
      expect(mockRequest.body.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-object body', () => {
      mockRequest.body = 'string body';

      sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toBe('string body');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null body', () => {
      mockRequest.body = null;

      sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined body', () => {
      mockRequest.body = undefined;

      sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize nested structures in body', () => {
      mockRequest.body = {
        problem: {
          title: '<script>Problem</script>',
          testCases: [
            { input: 'onclick=test', output: 'result' },
          ],
        },
      };

      sanitizeBody(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.problem.title).not.toContain('<script>');
      expect(mockRequest.body.problem.testCases[0].input).not.toContain('onclick=');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
