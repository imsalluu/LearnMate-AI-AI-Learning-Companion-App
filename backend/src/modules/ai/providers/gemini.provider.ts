import {
  IAIProvider,
  AIResponseOptions,
  GeneratedQuizQuestion,
  GeneratedFlashcard,
  GeneratedStudyPlanDay,
  LearningInsight,
} from '../ai.interface';
import { ExplanationMode, DifficultyLevel } from '../../../config/constants';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { MockAIProvider } from './mock.provider';

export class GeminiProvider implements IAIProvider {
  name = 'GeminiProvider';
  private fallback = new MockAIProvider();

  async generateResponse(prompt: string, context?: string, options?: AIResponseOptions): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      return this.fallback.generateResponse(prompt, context, options);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
      const fullPrompt = context
        ? `Context from learning materials:\n${context}\n\nStudent Query: ${prompt}`
        : prompt;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        return data.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      logger.warn('Gemini request failed, using fallback:', err);
    }

    return this.fallback.generateResponse(prompt, context, options);
  }

  async generateExplanation(
    concept: string,
    mode: ExplanationMode,
    context?: string,
    options?: AIResponseOptions
  ): Promise<{ explanation: string; examples: string[]; keyPoints: string[]; suggestedQuestions: string[] }> {
    return this.fallback.generateExplanation(concept, mode, context, options);
  }

  async generateQuiz(
    topic: string,
    context: string,
    numQuestions = 4,
    difficulty: DifficultyLevel = 'MEDIUM'
  ): Promise<GeneratedQuizQuestion[]> {
    return this.fallback.generateQuiz(topic, context, numQuestions, difficulty);
  }

  async generateFlashcards(
    topic: string,
    context: string,
    numCards = 5,
    difficulty: DifficultyLevel = 'MEDIUM'
  ): Promise<GeneratedFlashcard[]> {
    return this.fallback.generateFlashcards(topic, context, numCards, difficulty);
  }

  async generateStudyPlan(
    targetSubject: string,
    examDate: string,
    availableHoursPerDay: number,
    currentLevel: string,
    weakTopics: string[],
    context?: string
  ): Promise<GeneratedStudyPlanDay[]> {
    return this.fallback.generateStudyPlan(
      targetSubject,
      examDate,
      availableHoursPerDay,
      currentLevel,
      weakTopics,
      context
    );
  }

  async generateLearningInsights(
    masteryScores: Record<string, number>,
    weakTopics: string[],
    quizAccuracy: number,
    streakCount: number
  ): Promise<LearningInsight[]> {
    return this.fallback.generateLearningInsights(masteryScores, weakTopics, quizAccuracy, streakCount);
  }
}
