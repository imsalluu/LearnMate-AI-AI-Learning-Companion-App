import { Router } from 'express';
import { ProgressController } from './progress.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/analytics', ProgressController.getAnalytics);
router.post('/sessions', ProgressController.recordSession);
router.post('/mastery', ProgressController.updateTopicMastery);

export const progressRoutes = router;
