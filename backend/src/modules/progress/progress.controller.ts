import { Request, Response, NextFunction } from 'express';
import { ProgressService } from './progress.service';
import { RecordLearningSessionDto, UpdateTopicProgressDto } from './progress.dto';
import { sendCreated, sendSuccess } from '../../utils/response';

export class ProgressController {
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await ProgressService.getAnalytics(req.user!.id);
      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  static async recordSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RecordLearningSessionDto.parse(req.body);
      const session = await ProgressService.recordSession(req.user!.id, validated);
      sendCreated(res, { session }, 'Learning session recorded');
    } catch (error) {
      next(error);
    }
  }

  static async updateTopicMastery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateTopicProgressDto.parse(req.body);
      const updated = await ProgressService.updateTopicMastery(req.user!.id, validated);
      sendSuccess(res, { topicProgress: updated });
    } catch (error) {
      next(error);
    }
  }
}
