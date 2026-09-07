import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.patch('/profile', UserController.updateProfile);
router.get('/stats', UserController.getStats);

export const userRoutes = router;
