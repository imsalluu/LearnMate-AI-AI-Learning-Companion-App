import { Router } from 'express';
import { VoiceController, audioUploadMiddleware } from './voice.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/transcribe', audioUploadMiddleware.single('audio'), VoiceController.transcribe);
router.post('/synthesize', VoiceController.synthesize);
router.post('/chat', audioUploadMiddleware.single('audio'), VoiceController.voiceChat);

export const voiceRoutes = router;
