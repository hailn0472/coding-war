import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { emailQueue } from './emailQueue';

/**
 * Email Service
 * Handles email sending with NodeMailer, Bull queue, and retry logic
 * Validates: REQ-14.1, REQ-14.2, REQ-14.3, REQ-14.4, REQ-14.5, REQ-14.6, REQ-14.7
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Create NodeMailer transport with SMTP configuration
 */
function createTransport() {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // If SMTP credentials are not configured, use test account for development
  if (!config.auth.user || !config.auth.pass) {
    logger.warn('SMTP credentials not configured. Emails will be logged only.');
    return null;
  }

  return nodemailer.createTransport(config);
}

const transporter = createTransport();

/**
 * Send email directly (used by queue worker)
 * @param options - Email options
 * @returns Success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    logger.info('Attempting to send email', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
    });

    if (!transporter) {
      logger.warn('Email not sent (no transporter configured)', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@codingwar.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    const duration = Date.now() - startTime;
    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Queue email for asynchronous sending with retry logic
 * @param options - Email options
 */
async function queueEmail(options: EmailOptions): Promise<void> {
  await emailQueue.add('send-email', options, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  logger.info('Email queued for sending', {
    to: options.to,
    subject: options.subject,
  });
}

/**
 * Send verification email to user
 * @param email - User email address
 * @param token - Verification token
 * @param username - User username
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Verify Your Email - Coding War',
    html: getVerificationEmailTemplate(username, verificationUrl),
  };

  await queueEmail(emailOptions);
}

/**
 * Send password reset email to user
 * @param email - User email address
 * @param token - Password reset token
 * @param username - User username
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Password Reset Request - Coding War',
    html: getPasswordResetEmailTemplate(username, resetUrl),
  };

  await queueEmail(emailOptions);
}

/**
 * Email template for verification
 */
function getVerificationEmailTemplate(username: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Coding War!</h1>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>Thank you for registering with Coding War. Please verify your email address to activate your account.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with Coding War, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Coding War. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Email template for password reset
 */
function getPasswordResetEmailTemplate(username: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${username},</h2>
          <p>We received a request to reset your password for your Coding War account.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Coding War. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
