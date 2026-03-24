import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger';
import { validateEnv } from './utils/env';
import { initializeExceptionHandlers } from './utils/exceptionHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import { initializeSocketServer } from './services/socketService';
import { initializeSubmissionSocketHandlers } from './services/submissionSocketService';
import { initializeScoreboardSocketHandlers } from './services/scoreboardSocketService';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Initialize global exception handlers (must be early in startup)
initializeExceptionHandlers();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(requestIdMiddleware);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map(o => o.trim());
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'The requested resource was not found',
    path: req.path,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.io server
initializeSocketServer(httpServer)
  .then(() => {
    logger.info('Socket.io server initialized successfully');
    // Initialize submission socket handlers
    initializeSubmissionSocketHandlers();
    logger.info('Submission socket handlers initialized');
    // Initialize scoreboard socket handlers
    initializeScoreboardSocketHandlers();
    logger.info('Scoreboard socket handlers initialized');
  })
  .catch((error) => {
    logger.error('Failed to initialize Socket.io server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

export default app;
