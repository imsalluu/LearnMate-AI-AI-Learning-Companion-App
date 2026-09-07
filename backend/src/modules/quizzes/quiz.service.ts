import { v4 as uuidv4 } from 'uuid';
import { prisma, isDbAvailable } from '../../database/db';
import { AIService } from '../ai/ai.service';
import { RagService } from '../rag/rag.service';
import { GenerateQuizInput, SubmitQuizAttemptInput } from './quiz.dto';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface QuizQuestionRecord {
  id: string;
  quizId: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export interface QuizRecord {
  id: string;
  userId: string;
  title: string;
  topic: string;
  difficulty: string;
  timeLimitSeconds: number;
  materialId?: string | null;
  subjectId?: string | null;
  questions: QuizQuestionRecord[];
  createdAt: Date;
}

const mockQuizzes: Map<string, QuizRecord> = new Map();
const mockAttempts: Map<string, any[]> = new Map();

export class QuizService {
  static async generateQuiz(userId: string, input: GenerateQuizInput) {
    logger.info(`📝 Generating quiz on "${input.topic}" (${input.difficulty}) for user: ${userId}`);

    // 1. Retrieve grounded study content
    const rag = await RagService.retrieve(input.topic, {
      userId,
      materialId: input.materialId,
      subjectId: input.subjectId,
      topK: 4,
    });

    // 2. Generate structured questions via AI Provider
    const provider = AIService.getProvider();
    const generatedQuestions = await provider.generateQuiz(
      input.topic,
      rag.context,
      input.numQuestions,
      input.difficulty as any
    );

    const quizId = uuidv4();
    const quizTitle = `${input.topic} Mastery Quiz`;

    const questions: QuizQuestionRecord[] = generatedQuestions.map((q) => ({
      id: uuidv4(),
      quizId,
      question: q.question,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }));

    if (isDbAvailable()) {
      const dbQuiz = await prisma.quiz.create({
        data: {
          id: quizId,
          userId,
          title: quizTitle,
          topic: input.topic,
          difficulty: input.difficulty as any,
          timeLimitSeconds: input.timeLimitSeconds,
          materialId: input.materialId || null,
          subjectId: input.subjectId || null,
          questions: {
            create: questions.map((q) => ({
              id: q.id,
              question: q.question,
              type: q.type as any,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty as any,
            })),
          },
        },
        include: { questions: true },
      });
      return dbQuiz;
    }

    // Memory fallback
    const quizRecord: QuizRecord = {
      id: quizId,
      userId,
      title: quizTitle,
      topic: input.topic,
      difficulty: input.difficulty,
      timeLimitSeconds: input.timeLimitSeconds,
      materialId: input.materialId || null,
      subjectId: input.subjectId || null,
      questions,
      createdAt: new Date(),
    };

    mockQuizzes.set(quizId, quizRecord);
    return quizRecord;
  }

  static async listQuizzes(userId: string) {
    if (isDbAvailable()) {
      return await prisma.quiz.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true, attempts: true } } },
      });
    }

    return Array.from(mockQuizzes.values())
      .filter((q) => q.userId === userId)
      .map((q) => ({
        id: q.id,
        title: q.title,
        topic: q.topic,
        difficulty: q.difficulty,
        timeLimitSeconds: q.timeLimitSeconds,
        questionCount: q.questions.length,
        createdAt: q.createdAt,
      }));
  }

  static async getQuizById(userId: string, quizId: string, hideAnswers = true) {
    let quiz: any = null;

    if (isDbAvailable()) {
      quiz = await prisma.quiz.findFirst({
        where: { id: quizId, userId },
        include: { questions: true },
      });
    } else {
      quiz = mockQuizzes.get(quizId);
    }

    if (!quiz || quiz.userId !== userId) {
      throw new NotFoundError('Quiz not found');
    }

    if (hideAnswers) {
      // Return question payload without exposing the correct answer prior to submission
      const safeQuestions = quiz.questions.map((q: any) => {
        const { correctAnswer: _, explanation: __, ...safeQ } = q;
        return safeQ;
      });
      return { ...quiz, questions: safeQuestions };
    }

    return quiz;
  }

  static async submitAttempt(userId: string, quizId: string, input: SubmitQuizAttemptInput) {
    const fullQuiz = await this.getQuizById(userId, quizId, false);
    if (!fullQuiz) throw new NotFoundError('Quiz not found');

    let correctCount = 0;
    const evaluatedAnswers: any[] = [];
    const weakTopics: string[] = [];

    const questionMap = new Map(fullQuiz.questions.map((q: any) => [q.id, q]));

    for (const ans of input.answers) {
      const q = questionMap.get(ans.questionId) as QuizQuestionRecord | undefined;
      if (!q) continue;

      const isCorrect = ans.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else {
        weakTopics.push(fullQuiz.topic);
      }

      evaluatedAnswers.push({
        questionId: q.id,
        question: q.question,
        userAnswer: ans.userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      });
    }

    const totalQuestions = fullQuiz.questions.length || 1;
    const score = Number(((correctCount / totalQuestions) * 100).toFixed(1));
    const attemptId = uuidv4();

    const attemptResult = {
      id: attemptId,
      quizId,
      userId,
      score,
      totalQuestions,
      correctCount,
      timeSpentSeconds: input.timeSpentSeconds,
      answers: evaluatedAnswers,
      weakTopics: Array.from(new Set(weakTopics)),
      recommendation:
        score >= 80
          ? '🌟 Excellent mastery! Ready to move on to more advanced topics.'
          : score >= 60
          ? '👍 Good understanding. Review the explanations for missed questions.'
          : '📚 Needs review. Focus on the core definitions and study the flashcards for this topic.',
      createdAt: new Date(),
    };

    if (isDbAvailable()) {
      await prisma.quizAttempt.create({
        data: {
          id: attemptId,
          quizId,
          userId,
          score,
          totalQuestions,
          correctCount,
          timeSpentSeconds: input.timeSpentSeconds,
          answers: evaluatedAnswers,
          weakTopics: attemptResult.weakTopics,
        },
      });
    } else {
      const existing = mockAttempts.get(quizId) || [];
      existing.push(attemptResult);
      mockAttempts.set(quizId, existing);
    }

    return attemptResult;
  }
}
