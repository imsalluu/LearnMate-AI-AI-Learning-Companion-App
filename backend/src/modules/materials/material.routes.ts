import { Router } from 'express';
import { MaterialController, uploadMiddleware } from './material.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), MaterialController.upload);
router.get('/', MaterialController.list);
router.get('/:id', MaterialController.getById);
router.delete('/:id', MaterialController.delete);

export const materialRoutes = router;
