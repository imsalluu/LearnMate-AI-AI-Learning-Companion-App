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

export class OpenAIProvider implements IAIProvider {
  name = 'OpenAIProvider';
  private fallback = new MockAIProvider();

  private async callChatCompletion(messages: any[], temperature = 0.4): Promise<string> {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.LLM_MODEL || 'gpt-4o-mini',
        messages,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${err}`);
    }

    const data = (await res.json()) as any;
    return data.choices[0].message.content;
  }

  async generateResponse(prompt: string, context?: string, options?: AIResponseOptions): Promise<string> {
    try {
      const systemPrompt =
        options?.systemPrompt ||
        'You are LearnMate AI, a world-class personalized AI learning companion and tutor. Ground all answers strictly in the student learning context provided. Maintain clear citations.';

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(context ? [{ role: 'system', content: `Uploaded Study Materials Context:\n${context}` }] : []),
        { role: 'user', content: prompt },
      ];

      return await this.callChatCompletion(messages, options?.temperature);
    } catch (error) {
      logger.warn('OpenAI request failed, using fallback:', error);
      return this.fallback.generateResponse(prompt, context, options);
    }
  }

  async generateExplanation(
    concept: string,
    mode: ExplanationMode,
    context?: string,
    options?: AIResponseOptions
  ): Promise<{ explanation: string; examples: string[]; keyPoints: string[]; suggestedQuestions: string[] }> {
    try {
      const systemPrompt = `You are a learning tutor. Explain the concept "${concept}" in mode "${mode}". Return response in valid JSON with fields: explanation (string), examples (array of strings), keyPoints (array of strings), suggestedQuestions (array of strings).`;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
        { role: 'user', content: `Explain: ${concept}` },
      ];

      const raw = await this.callChatCompletion(messages, 0.3);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallback.generateExplanation(concept, mode, context, options);
    } catch {
      return this.fallback.generateExplanation(concept, mode, context, options);
    }
  }

  async generateQuiz(
    topic: string,
    context: string,
    numQuestions = 4,
    difficulty: DifficultyLevel = 'MEDIUM'
  ): Promise<GeneratedQuizQuestion[]> {
    try {
      const systemPrompt = `Generate a quiz with ${numQuestions} questions on "${topic}" at ${difficulty} level. Return JSON array of objects: question, type (MULTIPLE_CHOICE, TRUE_FALSE), options (array of 4 strings or 2 strings), correctAnswer, explanation, difficulty.`;
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(context ? [{ role: 'system', content: `Context:\n${context}` }] : []),
        { role: 'user', content: `Generate quiz on: ${topic}` },
      ];

      const raw = await this.callChatCompletion(messages, 0.2);
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallback.generateQuiz(topic, context, numQuestions, difficulty);
    } catch {
      return this.fallback.generateQuiz(topic, context, numQuestions, difficulty);
    }
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
