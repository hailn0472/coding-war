# Authentication Service Documentation

## Overview

The authentication service provides secure password hashing, JWT token management, and verification token generation for the Coding War platform.

## Features

- **Password Hashing**: Secure password hashing using bcrypt with cost factor 12
- **JWT Tokens**: Access and refresh token generation with configurable expiration
- **Verification Tokens**: Email verification and password reset token generation
- **Token Validation**: Secure token verification and decoding

## API Reference

### Password Management

#### `hashPassword(password: string): Promise<string>`

Hashes a password using bcrypt with cost factor 12.

**Parameters:**
- `password` (string): Plain text password to hash

**Returns:**
- Promise<string>: Hashed password

**Example:**
```typescript
import { hashPassword } from './services/authService';

const hashedPassword = await hashPassword('MySecurePassword123!');
// Store hashedPassword in database
```

#### `verifyPassword(password: string, hash: string): Promise<boolean>`

Verifies a password against a stored hash.

**Parameters:**
- `password` (string): Plain text password to verify
- `hash` (string): Hashed password from database

**Returns:**
- Promise<boolean>: True if password matches, false otherwise

**Example:**
```typescript
import { verifyPassword } from './services/authService';

const isValid = await verifyPassword('MySecurePassword123!', storedHash);
if (isValid) {
  // Password is correct
}
```

### JWT Token Management

#### `generateAccessToken(userId: string, role: string): string`

Generates a JWT access token with 7-day expiration.

**Parameters:**
- `userId` (string): User's unique identifier
- `role` (string): User's role (admin, user, guest)

**Returns:**
- string: JWT access token

**Example:**
```typescript
import { generateAccessToken } from './services/authService';

const token = generateAccessToken('user-123', 'user');
// Send token to client
```

#### `generateRefreshToken(userId: string): string`

Generates a JWT refresh token with 30-day expiration.

**Parameters:**
- `userId` (string): User's unique identifier

**Returns:**
- string: JWT refresh token

**Example:**
```typescript
import { generateRefreshToken } from './services/authService';

const refreshToken = generateRefreshToken('user-123');
// Store refresh token securely
```

#### `verifyToken(token: string): { userId: string; role: string } | null`

Verifies and decodes a JWT access token.

**Parameters:**
- `token` (string): JWT access token to verify

**Returns:**
- Object with userId and role if valid, null if invalid or expired

**Example:**
```typescript
import { verifyToken } from './services/authService';

const decoded = verifyToken(token);
if (decoded) {
  console.log(`User ID: ${decoded.userId}, Role: ${decoded.role}`);
} else {
  // Token is invalid or expired
}
```

#### `verifyRefreshToken(token: string): { userId: string } | null`

Verifies and decodes a JWT refresh token.

**Parameters:**
- `token` (string): JWT refresh token to verify

**Returns:**
- Object with userId if valid, null if invalid or expired

**Example:**
```typescript
import { verifyRefreshToken } from './services/authService';

const decoded = verifyRefreshToken(refreshToken);
if (decoded) {
  // Generate new access token
  const newAccessToken = generateAccessToken(decoded.userId, userRole);
}
```

### Verification Tokens

#### `generateEmailVerificationToken(): { token: string; expiry: Date }`

Generates a unique email verification token with 24-hour expiration.

**Returns:**
- Object containing:
  - `token` (string): UUID verification token
  - `expiry` (Date): Expiration timestamp (24 hours from now)

**Example:**
```typescript
import { generateEmailVerificationToken } from './services/authService';

const { token, expiry } = generateEmailVerificationToken();
// Store token and expiry in database
// Send verification email with token
```

#### `generatePasswordResetToken(): { token: string; expiry: Date }`

Generates a unique password reset token with 1-hour expiration.

**Returns:**
- Object containing:
  - `token` (string): UUID reset token
  - `expiry` (Date): Expiration timestamp (1 hour from now)

**Example:**
```typescript
import { generatePasswordResetToken } from './services/authService';

const { token, expiry } = generatePasswordResetToken();
// Store token and expiry in database
// Send password reset email with token
```

## Environment Variables

The authentication service requires the following environment variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

**Security Notes:**
- Use strong, randomly generated secrets in production
- Never commit secrets to version control
- Rotate secrets periodically
- Use different secrets for different environments

## Security Considerations

### Password Hashing
- Uses bcrypt with cost factor 12 (recommended by OWASP)
- Automatically generates unique salt for each password
- Resistant to rainbow table attacks
- Computationally expensive to prevent brute force attacks

### JWT Tokens
- Access tokens expire after 7 days
- Refresh tokens expire after 30 days
- Tokens include userId and role in payload
- Tokens are signed with secret keys
- Invalid or expired tokens are rejected

### Verification Tokens
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Tokens are UUIDs (cryptographically random)
- Tokens should be single-use and invalidated after use

## Testing

The authentication service includes comprehensive unit tests covering:
- Password hashing and verification
- JWT token generation and validation
- Verification token generation
- Edge cases (long passwords, special characters, unicode)
- Security scenarios (expired tokens, wrong secrets)

Run tests with:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **REQ-3.2**: Password hashing with bcrypt (cost factor 12)
- **REQ-3.4**: JWT token generation with 7-day expiration
- **REQ-3.7**: JWT token validation and decoding
- **REQ-3.8**: Email verification token generation (24-hour expiration)
- **REQ-3.10**: Password reset token generation

## Usage in Routes

Example integration with Express routes:

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
} from './services/authService';

const router = express.Router();
const prisma = new PrismaClient();

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Generate verification token
  const { token, expiry } = generateEmailVerificationToken();
  
  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      emailVerifyToken: token,
      emailVerifyExpiry: expiry,
    },
  });
  
  // Send verification email (not shown)
  
  res.status(201).json({ message: 'User registered', userId: user.id });
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;
  
  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    },
  });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
```

## Performance Considerations

- **Password Hashing**: Bcrypt is intentionally slow (cost factor 12). Consider:
  - Running in worker threads for high-traffic applications
  - Implementing rate limiting on authentication endpoints
  - Using async/await to prevent blocking

- **JWT Verification**: Fast operation, but consider:
  - Caching decoded tokens for repeated requests
  - Using middleware to verify tokens once per request

## Future Enhancements

Potential improvements for future versions:
- Support for multiple JWT signing algorithms
- Token blacklisting for logout functionality
- Two-factor authentication (2FA) support
- Biometric authentication integration
- OAuth2/OpenID Connect support
