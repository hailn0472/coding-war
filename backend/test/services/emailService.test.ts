import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Mock } from 'jest-mock';

/**
 * Email Service Tests
 * Tests email sending, queueing, templates, and retry logic
 */

// Mock dependencies
jest.mock('nodemailer');
jest.mock('../../src/utils/logger');
jest.mock('../../src/../src/services/emailQueue');

describe('Email Service', () => {
  let sendEmail: (options: { to: string; subject: string; html: string }) => Promise<boolean>;
  let sendVerificationEmail: (email: string, token: string, username: string) => Promise<void>;
  let sendPasswordResetEmail: (email: string, token: string, username: string) => Promise<void>;
  let mockTransporter: { sendMail: Mock };
  let mockEmailQueue: { add: Mock };

  beforeEach(async () => {
    // Reset modules to get fresh instances
    jest.resetModules();

    // Setup nodemailer mock
    const nodemailer = await import('nodemailer');
    mockTransporter = {
      sendMail: jest.fn<any>().mockResolvedValue({ messageId: 'test-message-id' }),
    };
    (nodemailer.default.createTransport as Mock) = jest.fn<any>().mockReturnValue(mockTransporter);

    // Setup email queue mock
    const emailQueue = await import('./emailQueue');
    mockEmailQueue = {
      add: jest.fn<any>().mockResolvedValue({ id: 'test-job-id' }),
    };
    (emailQueue.emailQueue as any) = mockEmailQueue;

    // Set environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASSWORD = 'test-password';
    process.env.EMAIL_FROM = 'noreply@codingwar.com';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    // Import service functions
    const emailService = await import('./emailService');
    sendEmail = emailService.sendEmail;
    sendVerificationEmail = emailService.sendVerificationEmail;
    sendPasswordResetEmail = emailService.sendPasswordResetEmail;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send email successfully with valid configuration', async () => {
      const emailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      const result = await sendEmail(emailOptions);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@codingwar.com',
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });
    });

    it('should log email sending attempt', async () => {
      const logger = await import('../utils/logger');
      const emailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await sendEmail(emailOptions);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Attempting to send email',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Email',
        })
      );
    });

    it('should log successful email sending', async () => {
      const logger = await import('../utils/logger');
      const emailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await sendEmail(emailOptions);

      expect(logger.logger.info).toHaveBeenCalledWith(
        'Email sent successfully',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Email',
          messageId: 'test-message-id',
        })
      );
    });

    it('should throw error and log when email sending fails', async () => {
      const logger = await import('../utils/logger');
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail = jest.fn<any>().mockRejectedValue(error);

      const emailOptions = {
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      await expect(sendEmail(emailOptions)).rejects.toThrow('SMTP connection failed');

      expect(logger.logger.error).toHaveBeenCalledWith(
        'Failed to send email',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Email',
          error: 'SMTP connection failed',
        })
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should queue verification email with correct data', async () => {
      await sendVerificationEmail('user@example.com', 'test-token-123', 'testuser');

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify Your Email - Coding War',
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        })
      );
    });

    it('should include verification URL in email template', async () => {
      await sendVerificationEmail('user@example.com', 'test-token-123', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const emailData = callArgs[1] as { html: string };
      
      expect(emailData.html).toContain('http://localhost:5173/verify-email?token=test-token-123');
      expect(emailData.html).toContain('testuser');
      expect(emailData.html).toContain('24 hours');
    });

    it('should use proper email template structure', async () => {
      await sendVerificationEmail('user@example.com', 'test-token-123', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const emailData = callArgs[1] as { html: string };
      
      expect(emailData.html).toContain('<!DOCTYPE html>');
      expect(emailData.html).toContain('Welcome to Coding War');
      expect(emailData.html).toContain('Verify Email Address');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should queue password reset email with correct data', async () => {
      await sendPasswordResetEmail('user@example.com', 'reset-token-456', 'testuser');

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Password Reset Request - Coding War',
        }),
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        })
      );
    });

    it('should include reset URL in email template', async () => {
      await sendPasswordResetEmail('user@example.com', 'reset-token-456', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const emailData = callArgs[1] as { html: string };
      
      expect(emailData.html).toContain('http://localhost:5173/reset-password?token=reset-token-456');
      expect(emailData.html).toContain('testuser');
      expect(emailData.html).toContain('1 hour');
    });

    it('should include security warning in template', async () => {
      await sendPasswordResetEmail('user@example.com', 'reset-token-456', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const emailData = callArgs[1] as { html: string };
      
      expect(emailData.html).toContain('Security Notice');
      expect(emailData.html).toContain('If you didn\'t request a password reset');
    });

    it('should use proper email template structure', async () => {
      await sendPasswordResetEmail('user@example.com', 'reset-token-456', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const emailData = callArgs[1] as { html: string };
      
      expect(emailData.html).toContain('<!DOCTYPE html>');
      expect(emailData.html).toContain('Password Reset Request');
      expect(emailData.html).toContain('Reset Password');
    });
  });

  describe('Email Queue Integration', () => {
    it('should configure retry logic with 3 attempts', async () => {
      await sendVerificationEmail('user@example.com', 'test-token', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const options = callArgs[2];
      
      expect(options).toMatchObject({
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });
    });

    it('should remove completed jobs from queue', async () => {
      await sendVerificationEmail('user@example.com', 'test-token', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const options = callArgs[2] as any;
      
      expect(options.removeOnComplete).toBe(true);
    });

    it('should keep failed jobs in queue for inspection', async () => {
      await sendVerificationEmail('user@example.com', 'test-token', 'testuser');

      const callArgs = mockEmailQueue.add.mock.calls[0];
      const options = callArgs[2] as any;
      
      expect(options.removeOnFail).toBe(false);
    });
  });

  describe('Configuration Handling', () => {
    it('should handle missing SMTP credentials gracefully', async () => {
      // Reset modules and clear SMTP credentials
      jest.resetModules();
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      const nodemailer = await import('nodemailer');
      (nodemailer.default.createTransport as Mock) = jest.fn<any>().mockReturnValue(null);

      const emailService = await import('./emailService');
      const logger = await import('../utils/logger');

      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(false);
      expect(logger.logger.warn).toHaveBeenCalledWith(
        'Email not sent (no transporter configured)',
        expect.any(Object)
      );
    });
  });
});
