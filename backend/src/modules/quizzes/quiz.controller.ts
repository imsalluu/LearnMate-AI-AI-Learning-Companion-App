import { Request, Response, NextFunction } from 'express';
import { QuizService } from './quiz.service';
import { GenerateQuizDto, SubmitQuizAttemptDto } from './quiz.dto';
import { sendCreated, sendSuccess } from '../../utils/response';

export class QuizController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = GenerateQuizDto.parse(req.body);
      const quiz = await QuizService.generateQuiz(req.user!.id, validated);
      sendCreated(res, { quiz }, 'Quiz generated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quizzes = await QuizService.listQuizzes(req.user!.id);
      sendSuccess(res, { quizzes });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quiz = await QuizService.getQuizById(req.user!.id, req.params.id, true);
      sendSuccess(res, { quiz });
    } catch (error) {
      next(error);
    }
  }

  static async submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SubmitQuizAttemptDto.parse(req.body);
      const attempt = await QuizService.submitAttempt(req.user!.id, req.params.id, validated);
      sendSuccess(res, { attempt }, 'Quiz attempt submitted and evaluated');
    } catch (error) {
      next(error);
    }
  }
}
