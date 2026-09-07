import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { VoiceService } from './voice.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export const audioUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const SynthesizeDto = z.object({
  text: z.string().min(1),
  voiceId: z.string().optional().default('alloy'),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
});

export class VoiceController {
  static async transcribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('Audio file is required for transcription');
      }
      const transcript = await VoiceService.transcribeAudio(req.file);
      sendSuccess(res, { transcript });
    } catch (error) {
      next(error);
    }
  }

  static async synthesize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SynthesizeDto.parse(req.body);
      const result = await VoiceService.synthesizeSpeech(
        validated.text,
        validated.voiceId,
        validated.speed
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async voiceChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('Audio file is required for voice chat');
      }
      const mode = (req.body.mode || 'simple') as any;
      const subjectId = req.body.subjectId as string | undefined;

      const result = await VoiceService.processVoiceInteraction(
        req.user!.id,
        req.file,
        mode,
        subjectId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
