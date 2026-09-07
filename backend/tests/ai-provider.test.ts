import { describe, it, expect } from 'vitest';
import { AIService } from '../src/modules/ai/ai.service';

describe('Unified AI Provider Abstraction', () => {
  const provider = AIService.getProvider();

  it('should initialize an AI provider instance', () => {
    expect(provider).toBeDefined();
    expect(provider.name).toBeDefined();
  });

  it('should generate multi-mode explanations with structured output', async () => {
    const modes = ['simple', 'detailed', 'exam-focused', 'beginner-friendly', 'example-based'] as const;

    for (const mode of modes) {
      const res = await provider.generateExplanation('Database Indexing', mode, 'Indexes speed up retrieval operations.');
      expect(res.explanation).toBeDefined();
      expect(res.examples.length).toBeGreaterThan(0);
      expect(res.keyPoints.length).toBeGreaterThan(0);
      expect(res.suggestedQuestions.length).toBeGreaterThan(0);
    }
  });

  it('should generate structured quiz questions with schema validation', async () => {
    const questions = await provider.generateQuiz('SQL Joins', 'Inner joins return matching records.', 3, 'MEDIUM');
    expect(questions.length).toBe(3);
    expect(questions[0].question).toBeDefined();
    expect(questions[0].options.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].correctAnswer).toBeDefined();
    expect(questions[0].explanation).toBeDefined();
  });

  it('should generate structured flashcards', async () => {
    const cards = await provider.generateFlashcards('ACID Properties', 'Atomicity, Consistency, Isolation, Durability', 4);
    expect(cards.length).toBeGreaterThanOrEqual(4);
    expect(cards[0].front).toBeDefined();
    expect(cards[0].back).toBeDefined();
  });

  it('should generate learning insights based on mastery and streak', async () => {
    const insights = await provider.generateLearningInsights(
      { 'Normalization': 45, 'SQL': 88 },
      ['Normalization'],
      0.75,
      5
    );

    expect(insights.length).toBeGreaterThan(0);
    const hasStreak = insights.some((i) => i.type === 'STREAK');
    expect(hasStreak).toBe(true);
  });
});
