import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TutorService } from './tutor.service';
import { sendSuccess } from '../../utils/response';

const ExplainConceptSchema = z.object({
  concept: z.string().min(1),
  mode: z.enum(['simple', 'detailed', 'exam-focused', 'beginner-friendly', 'example-based']).default('simple'),
  materialId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
});

export class TutorController {
  static async explain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ExplainConceptSchema.parse(req.body);
      const result = await TutorService.explainConcept(
        req.user!.id,
        validated.concept,
        validated.mode as any,
        validated.materialId,
        validated.subjectId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deepDive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ExplainConceptSchema.parse(req.body);
      const result = await TutorService.deepDive(req.user!.id, validated.concept, validated.subjectId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
