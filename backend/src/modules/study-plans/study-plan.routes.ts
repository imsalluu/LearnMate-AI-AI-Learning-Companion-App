import { Router } from 'express';
import { StudyPlanController } from './study-plan.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/generate', StudyPlanController.generate);
router.get('/active', StudyPlanController.getActive);
router.get('/:id', StudyPlanController.getById);
router.patch('/:planId/items/:itemId', StudyPlanController.toggleItem);
router.post('/:id/reschedule', StudyPlanController.reschedule);

export const studyPlanRoutes = router;
