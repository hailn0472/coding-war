# Middleware Documentation

This directory contains Express middleware for the Coding War backend API.

## Available Middleware

### 1. Authentication Middleware (`auth.ts`)

Validates JWT tokens and attaches user information to the request object.

**Requirements:** REQ-3.10, REQ-3.11

**Usage:**

```typescript
import { authenticate } from '../middleware/auth';
import { Router } from 'express';

const router = Router();

// Protect a route with authentication
router.get('/profile', authenticate, (req, res) => {
  // req.user is now available with { userId, role }
  res.json({ user: req.user });
});
```

**Behavior:**
- Extracts JWT token from `Authorization: Bearer <token>` header
- Validates token using `verifyToken()` from authService
- Attaches `req.user = { userId, role }` to request object
- Returns 401 if token is missing, invalid, or expired

### 2. Authorization Middleware (`authorize.ts`)

Implements role-based access control (RBAC) with role hierarchy.

**Requirements:** REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6, REQ-4.7

**Role Hierarchy:** ADMIN > USER > GUEST

**Usage:**

```typescript
import { authenticate } from '../middleware/auth';
import { authorize, adminOnly, userAndAbove } from '../middleware/authorize';
import { Router } from 'express';

const router = Router();

// Admin-only endpoint
router.delete('/users/:id', authenticate, adminOnly, (req, res) => {
  // Only ADMIN can access
});

// User and Admin endpoint
router.post('/submissions', authenticate, userAndAbove, (req, res) => {
  // USER and ADMIN can access, GUEST cannot
});

// Custom role combination
router.get('/contests', authenticate, authorize(['USER', 'ADMIN']), (req, res) => {
  // Specify exactly which roles can access
});
```

**Convenience Functions:**
- `adminOnly` - Only ADMIN role
- `userAndAbove` - USER and ADMIN roles
- `authenticated` - All authenticated users (GUEST, USER, ADMIN)

**Behavior:**
- Checks `req.user.role` against allowed roles
- Implements role hierarchy (higher roles can access lower role endpoints)
- Returns 403 if insufficient permissions
- Logs all authorization failures for security auditing

### 3. Error Handler (`errorHandler.ts`)

Global error handling middleware.

**Usage:**

```typescript
import { errorHandler } from '../middleware/errorHandler';
import express from 'express';

const app = express();

// ... routes ...

// Error handler must be last
app.use(errorHandler);
```

### 4. Request ID (`requestId.ts`)

Adds unique request ID to each request for tracing.

**Usage:**

```typescript
import { requestIdMiddleware } from '../middleware/requestId';
import express from 'express';

const app = express();

// Add early in middleware chain
app.use(requestIdMiddleware);
```

## Complete Example

```typescript
import express from 'express';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { adminOnly, userAndAbove } from './middleware/authorize';

const app = express();

// Global middleware
app.use(express.json());
app.use(requestIdMiddleware);

// Public routes
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/register', registerHandler);

// Protected routes - User and above
app.get('/api/problems', authenticate, userAndAbove, listProblems);
app.post('/api/submissions', authenticate, userAndAbove, createSubmission);

// Protected routes - Admin only
app.post('/api/problems', authenticate, adminOnly, createProblem);
app.delete('/api/users/:id', authenticate, adminOnly, deleteUser);

// Error handler (must be last)
app.use(errorHandler);

app.listen(3000);
```

## Testing

Run tests for middleware:

```bash
npm test src/middleware/auth.test.ts
npm test src/middleware/authorize.test.ts
```

## Type Extensions

The authentication middleware extends the Express Request type:

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}
```

This allows TypeScript to recognize `req.user` in route handlers.
