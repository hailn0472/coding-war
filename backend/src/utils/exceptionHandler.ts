import { logger } from './logger';

/**
 * Centralized exception handler for process-level exceptions
 * Catches all unhandled exceptions globally and logs them with full context
 * Validates: REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6, REQ-17.7
 */

interface ExceptionContext {
  type: 'uncaughtException' | 'unhandledRejection';
  error: Error;
  origin?: string;
  timestamp: string;
}

/**
 * Alert administrators for critical errors (500 errors)
 * This is a placeholder implementation that logs to error channel
 * In production, this should integrate with:
 * - Email service (NodeMailer)
 * - Slack/Discord webhooks
 * - PagerDuty or similar alerting service
 * - Centralized logging service (ELK, Datadog, etc.)
 */
async function alertAdministrators(context: ExceptionContext): Promise<void> {
  // Log critical error with special marker for alerting systems
  logger.error('CRITICAL ERROR - Administrator alert triggered', {
    alert: true,
    severity: 'critical',
    type: context.type,
    error: context.error.message,
    stack: context.error.stack,
    timestamp: context.timestamp,
    origin: context.origin,
  });

  // TODO: Integrate with actual alerting mechanisms:
  // - Send email to administrators
  // - Post to Slack/Discord channel
  // - Trigger PagerDuty incident
  // - Send to centralized monitoring service
  
  // Example email integration (commented out):
  // try {
  //   await emailService.sendAdminAlert({
  //     subject: `CRITICAL: ${context.type} in Coding War API`,
  //     body: `
  //       Error: ${context.error.message}
  //       Type: ${context.type}
  //       Time: ${context.timestamp}
  //       Stack: ${context.error.stack}
  //     `,
  //   });
  // } catch (emailError) {
  //   logger.error('Failed to send admin alert email', { error: emailError });
  // }
}

/**
 * Handle uncaught exceptions
 * Logs the exception with full context and alerts administrators
 */
function handleUncaughtException(error: Error): void {
  const context: ExceptionContext = {
    type: 'uncaughtException',
    error,
    timestamp: new Date().toISOString(),
  };

  logger.error('Uncaught Exception detected', {
    type: context.type,
    error: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: context.timestamp,
  });

  // Alert administrators for critical errors
  alertAdministrators(context).catch((alertError) => {
    logger.error('Failed to alert administrators', {
      error: alertError instanceof Error ? alertError.message : 'Unknown error',
    });
  });

  // In production, we might want to gracefully shutdown
  // For now, we log and continue (process will exit by default)
  if (process.env.NODE_ENV === 'production') {
    logger.error('Process will exit due to uncaught exception');
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Handle unhandled promise rejections
 * Logs the rejection with full context and alerts administrators
 */
function handleUnhandledRejection(reason: any, _promise: Promise<any>): void {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  
  const context: ExceptionContext = {
    type: 'unhandledRejection',
    error,
    origin: 'Promise',
    timestamp: new Date().toISOString(),
  };

  logger.error('Unhandled Promise Rejection detected', {
    type: context.type,
    error: error.message,
    stack: error.stack,
    reason: String(reason),
    timestamp: context.timestamp,
  });

  // Alert administrators for critical errors
  alertAdministrators(context).catch((alertError) => {
    logger.error('Failed to alert administrators', {
      error: alertError instanceof Error ? alertError.message : 'Unknown error',
    });
  });

  // In production, we might want to gracefully shutdown
  if (process.env.NODE_ENV === 'production') {
    logger.error('Process will exit due to unhandled rejection');
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Initialize global exception handlers
 * Should be called once at application startup
 */
export function initializeExceptionHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);

  // Handle process termination signals
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    // Graceful shutdown logic would go here
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    // Graceful shutdown logic would go here
  });

  logger.info('Global exception handlers initialized');
}

/**
 * Cleanup exception handlers (for testing purposes)
 */
export function cleanupExceptionHandlers(): void {
  process.removeListener('uncaughtException', handleUncaughtException);
  process.removeListener('unhandledRejection', handleUnhandledRejection);
}
