import { Request, Response, NextFunction } from 'express';
import { StudyPlanService } from './study-plan.service';
import { GenerateStudyPlanDto, RescheduleStudyPlanDto, TogglePlanItemDto } from './study-plan.dto';
import { sendCreated, sendSuccess } from '../../utils/response';

export class StudyPlanController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = GenerateStudyPlanDto.parse(req.body);
      const plan = await StudyPlanService.generatePlan(req.user!.id, validated);
      sendCreated(res, { plan }, 'Personalized study plan created');
    } catch (error) {
      next(error);
    }
  }

  static async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await StudyPlanService.getActivePlan(req.user!.id);
      sendSuccess(res, { plan });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await StudyPlanService.getPlanById(req.user!.id, req.params.id);
      sendSuccess(res, { plan });
    } catch (error) {
      next(error);
    }
  }

  static async toggleItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = TogglePlanItemDto.parse(req.body);
      const updated = await StudyPlanService.toggleItemCompletion(
        req.user!.id,
        req.params.planId,
        req.params.itemId,
        validated.isCompleted
      );
      sendSuccess(res, { item: updated });
    } catch (error) {
      next(error);
    }
  }

  static async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RescheduleStudyPlanDto.parse(req.body);
      const result = await StudyPlanService.reschedulePlan(req.user!.id, req.params.id, validated);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
