import { Router } from 'express';
import { TutorController } from './tutor.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/explain', TutorController.explain);
router.post('/deep-dive', TutorController.deepDive);

export const tutorRoutes = router;
