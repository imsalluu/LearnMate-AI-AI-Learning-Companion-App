import { Router } from 'express';
import { ConversationController } from './conversation.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/messages', ConversationController.sendMessage);
router.get('/', ConversationController.list);
router.get('/:id', ConversationController.getById);

export const conversationRoutes = router;
