import { Router } from 'express';
import { QuizController } from './quiz.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/generate', QuizController.generate);
router.get('/', QuizController.list);
router.get('/:id', QuizController.getById);
router.post('/:id/submit', QuizController.submitAttempt);

export const quizRoutes = router;
