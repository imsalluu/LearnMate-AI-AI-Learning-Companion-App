import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ConversationService } from './conversation.service';
import { sendCreated, sendSuccess } from '../../utils/response';

const SendMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
  mode: z.enum(['simple', 'detailed', 'exam-focused', 'beginner-friendly', 'example-based']).default('simple'),
  subjectId: z.string().optional(),
});

export class ConversationController {
  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SendMessageSchema.parse(req.body);
      const result = await ConversationService.sendMessage(
        req.user!.id,
        validated.message,
        validated.conversationId,
        validated.mode as any,
        validated.subjectId
      );
      sendCreated(res, result, 'Message processed by AI learning agent');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await ConversationService.listConversations(req.user!.id);
      sendSuccess(res, { conversations: list });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await ConversationService.getConversation(req.user!.id, req.params.id);
      sendSuccess(res, { conversation });
    } catch (error) {
      next(error);
    }
  }
}
