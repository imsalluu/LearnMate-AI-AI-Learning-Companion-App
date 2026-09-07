import { Router } from 'express';
import { FlashcardController } from './flashcard.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/generate', FlashcardController.generate);
router.post('/manual', FlashcardController.create);
router.get('/due', FlashcardController.listDue);
router.get('/', FlashcardController.listAll);
router.post('/:id/review', FlashcardController.review);
router.post('/:id/favorite', FlashcardController.toggleFavorite);
router.delete('/:id', FlashcardController.delete);

export const flashcardRoutes = router;
