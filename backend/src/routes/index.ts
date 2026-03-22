import { Router } from 'express';
import authRoutes from './auth.routes';
import problemRoutes from './problem.routes';
import submissionRoutes from './submission.routes';
import contestRoutes from './contest.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'Coding War API',
    version: '1.0.0',
    description: 'Backend API for Coding War - Online Judge Platform',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      problems: '/api/problems',
      submissions: '/api/submissions',
      contests: '/api/contests',
      users: '/api/users',
      admin: '/api/admin',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/problems', problemRoutes);
router.use('/submissions', submissionRoutes);
router.use('/contests', contestRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
