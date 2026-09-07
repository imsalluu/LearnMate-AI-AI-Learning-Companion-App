import { v4 as uuidv4 } from 'uuid';
import { prisma, isDbAvailable } from '../../database/db';
import { AIService } from '../ai/ai.service';
import { RagService } from '../rag/rag.service';
import { GenerateFlashcardsInput, CreateFlashcardInput, ReviewFlashcardInput } from './flashcard.dto';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface FlashcardRecord {
  id: string;
  userId: string;
  subjectId?: string | null;
  materialId?: string | null;
  topic?: string | null;
  front: string;
  back: string;
  difficulty: string;
  repetition: number;
  interval: number;
  easeFactor: number;
  isFavorite: boolean;
  nextReviewDate: Date;
  lastReviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mockFlashcards: Map<string, FlashcardRecord> = new Map();

export class FlashcardService {
  /**
   * Generates flashcards automatically using AI and grounded materials
   */
  static async generateFlashcards(userId: string, input: GenerateFlashcardsInput) {
    logger.info(`🃏 Generating flashcards for "${input.topic}" for user: ${userId}`);

    const rag = await RagService.retrieve(input.topic, {
      userId,
      materialId: input.materialId,
      subjectId: input.subjectId,
      topK: 4,
    });

    const provider = AIService.getProvider();
    const generated = await provider.generateFlashcards(
      input.topic,
      rag.context,
      input.numCards,
      input.difficulty as any
    );

    const createdCards: FlashcardRecord[] = [];

    for (const card of generated) {
      const cardId = uuidv4();
      const cardRecord: FlashcardRecord = {
        id: cardId,
        userId,
        subjectId: input.subjectId || null,
        materialId: input.materialId || null,
        topic: input.topic,
        front: card.front,
        back: card.back,
        difficulty: card.difficulty,
        repetition: 0,
        interval: 1,
        easeFactor: 2.5,
        isFavorite: false,
        nextReviewDate: new Date(),
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (isDbAvailable()) {
        await prisma.flashcard.create({
          data: {
            id: cardId,
            userId,
            subjectId: input.subjectId || null,
            materialId: input.materialId || null,
            topic: input.topic,
            front: card.front,
            back: card.back,
            difficulty: card.difficulty as any,
            repetition: 0,
            interval: 1,
            easeFactor: 2.5,
            isFavorite: false,
          },
        });
      } else {
        mockFlashcards.set(cardId, cardRecord);
      }

      createdCards.push(cardRecord);
    }

    return createdCards;
  }

  static async createManual(userId: string, input: CreateFlashcardInput) {
    const cardId = uuidv4();
    const cardRecord: FlashcardRecord = {
      id: cardId,
      userId,
      subjectId: input.subjectId || null,
      topic: input.topic || 'Custom Topic',
      front: input.front,
      back: input.back,
      difficulty: input.difficulty,
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      isFavorite: false,
      nextReviewDate: new Date(),
      lastReviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDbAvailable()) {
      return await prisma.flashcard.create({
        data: {
          id: cardId,
          userId,
          subjectId: input.subjectId || null,
          topic: input.topic || 'Custom Topic',
          front: input.front,
          back: input.back,
          difficulty: input.difficulty as any,
        },
      });
    }

    mockFlashcards.set(cardId, cardRecord);
    return cardRecord;
  }

  static async listDue(userId: string, subjectId?: string) {
    const now = new Date();

    if (isDbAvailable()) {
      const where: any = {
        userId,
        nextReviewDate: { lte: now },
      };
      if (subjectId) where.subjectId = subjectId;

      return await prisma.flashcard.findMany({
        where,
        orderBy: { nextReviewDate: 'asc' },
      });
    }

    return Array.from(mockFlashcards.values())
      .filter((fc) => fc.userId === userId && (!subjectId || fc.subjectId === subjectId))
      .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());
  }

  static async listAll(userId: string, topic?: string) {
    if (isDbAvailable()) {
      const where: any = { userId };
      if (topic) where.topic = { contains: topic, mode: 'insensitive' };
      return await prisma.flashcard.findMany({ where, orderBy: { createdAt: 'desc' } });
    }

    let cards = Array.from(mockFlashcards.values()).filter((fc) => fc.userId === userId);
    if (topic) {
      cards = cards.filter((fc) => fc.topic?.toLowerCase().includes(topic.toLowerCase()));
    }
    return cards;
  }

  /**
   * Processes a review rating using SuperMemo SM-2 spaced repetition logic
   */
  static async reviewCard(userId: string, flashcardId: string, input: ReviewFlashcardInput) {
    let card: any = null;

    if (isDbAvailable()) {
      card = await prisma.flashcard.findFirst({ where: { id: flashcardId, userId } });
    } else {
      card = mockFlashcards.get(flashcardId);
    }

    if (!card || card.userId !== userId) {
      throw new NotFoundError('Flashcard not found');
    }

    const { quality, responseTimeMs, isKnown } = input;
    let repetition = card.repetition;
    let interval = card.interval;
    let easeFactor = card.easeFactor;

    // SM-2 Spaced Repetition Algorithm
    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    const lastReviewedAt = new Date();

    if (isDbAvailable()) {
      const updated = await prisma.flashcard.update({
        where: { id: flashcardId },
        data: {
          repetition,
          interval,
          easeFactor,
          nextReviewDate,
          lastReviewedAt,
        },
      });

      await prisma.flashcardReview.create({
        data: {
          id: uuidv4(),
          flashcardId,
          userId,
          quality,
          responseTimeMs,
          isKnown,
          reviewedAt: lastReviewedAt,
        },
      });

      return updated;
    }

    card.repetition = repetition;
    card.interval = interval;
    card.easeFactor = Number(easeFactor.toFixed(3));
    card.nextReviewDate = nextReviewDate;
    card.lastReviewedAt = lastReviewedAt;
    card.updatedAt = lastReviewedAt;

    mockFlashcards.set(flashcardId, card);
    return card;
  }

  static async toggleFavorite(userId: string, flashcardId: string) {
    if (isDbAvailable()) {
      const card = await prisma.flashcard.findFirst({ where: { id: flashcardId, userId } });
      if (!card) throw new NotFoundError('Flashcard not found');
      return await prisma.flashcard.update({
        where: { id: flashcardId },
        data: { isFavorite: !card.isFavorite },
      });
    }

    const card = mockFlashcards.get(flashcardId);
    if (!card || card.userId !== userId) throw new NotFoundError('Flashcard not found');
    card.isFavorite = !card.isFavorite;
    return card;
  }

  static async deleteCard(userId: string, flashcardId: string) {
    if (isDbAvailable()) {
      await prisma.flashcard.delete({ where: { id: flashcardId } });
      return { success: true };
    }
    mockFlashcards.delete(flashcardId);
    return { success: true };
  }
}
