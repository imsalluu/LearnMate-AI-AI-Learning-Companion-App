import { Request, Response, NextFunction } from 'express';
import { FlashcardService } from './flashcard.service';
import { GenerateFlashcardsDto, CreateFlashcardDto, ReviewFlashcardDto } from './flashcard.dto';
import { sendCreated, sendSuccess } from '../../utils/response';

export class FlashcardController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = GenerateFlashcardsDto.parse(req.body);
      const cards = await FlashcardService.generateFlashcards(req.user!.id, validated);
      sendCreated(res, { flashcards: cards }, 'Flashcards generated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateFlashcardDto.parse(req.body);
      const card = await FlashcardService.createManual(req.user!.id, validated);
      sendCreated(res, { flashcard: card }, 'Flashcard created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listDue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const dueCards = await FlashcardService.listDue(req.user!.id, subjectId);
      sendSuccess(res, { dueCards, count: dueCards.length });
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = req.query.topic as string | undefined;
      const flashcards = await FlashcardService.listAll(req.user!.id, topic);
      sendSuccess(res, { flashcards, count: flashcards.length });
    } catch (error) {
      next(error);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReviewFlashcardDto.parse(req.body);
      const updated = await FlashcardService.reviewCard(req.user!.id, req.params.id, validated);
      sendSuccess(res, { flashcard: updated }, 'Flashcard review recorded via SM-2');
    } catch (error) {
      next(error);
    }
  }

  static async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await FlashcardService.toggleFavorite(req.user!.id, req.params.id);
      sendSuccess(res, { flashcard: updated });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FlashcardService.deleteCard(req.user!.id, req.params.id);
      sendSuccess(res, null, 'Flashcard deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
