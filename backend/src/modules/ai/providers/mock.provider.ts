import {
  IAIProvider,
  AIResponseOptions,
  GeneratedQuizQuestion,
  GeneratedFlashcard,
  GeneratedStudyPlanDay,
  LearningInsight,
} from '../ai.interface';
import { ExplanationMode, DifficultyLevel } from '../../../config/constants';

export class MockAIProvider implements IAIProvider {
  name = 'MockAIProvider';

  async generateResponse(prompt: string, context?: string, _options?: AIResponseOptions): Promise<string> {
    if (context && context.length > 0) {
      return `Based on your uploaded course materials:\n\n${prompt} is directly covered in the materials.\n\nKey takeaway:\n${context.slice(0, 300)}...`;
    }
    return `Here is an explanation for "${prompt}": It represents an essential concept in this field. It allows students to break down complex tasks and achieve mastery through structured practice.`;
  }

  async generateExplanation(
    concept: string,
    mode: ExplanationMode,
    context?: string,
    _options?: AIResponseOptions
  ): Promise<{ explanation: string; examples: string[]; keyPoints: string[]; suggestedQuestions: string[] }> {
    let modePrefix = '';
    switch (mode) {
      case 'simple':
        modePrefix = `In simple terms, ${concept} is like organizing your desk so you can find everything instantly.`;
        break;
      case 'beginner-friendly':
        modePrefix = `Imagine you are learning ${concept} for the very first time. Let's break it down into easy bite-sized pieces.`;
        break;
      case 'exam-focused':
        modePrefix = `For exam preparation on ${concept}, focus on definitions, key rules, and high-yield edge cases.`;
        break;
      case 'example-based':
        modePrefix = `Here is a concrete real-world example to illustrate how ${concept} operates in practice.`;
        break;
      case 'detailed':
      default:
        modePrefix = `${concept} is a foundational concept. When analyzing its internal mechanics, we observe structured relationships and functional guarantees.`;
        break;
    }

    const contextSnippet = context ? `\n\nDerived from your lecture notes:\n${context.slice(0, 200)}...` : '';

    return {
      explanation: `${modePrefix}${contextSnippet}`,
      examples: [
        `Example 1: Applying ${concept} to eliminate data redundancy in relational tables.`,
        `Example 2: How top software systems utilize ${concept} to ensure data integrity.`,
      ],
      keyPoints: [
        `Core definition and purpose of ${concept}`,
        `Differences between standard application and edge cases`,
        `Best practices when reviewing for exams`,
      ],
      suggestedQuestions: [
        `Can you give me another example of ${concept}?`,
        `What are the most common exam questions on this topic?`,
        `How does this compare to related alternative approaches?`,
      ],
    };
  }

  async generateQuiz(
    topic: string,
    _context: string,
    numQuestions = 4,
    difficulty: DifficultyLevel = 'MEDIUM'
  ): Promise<GeneratedQuizQuestion[]> {
    const questions: GeneratedQuizQuestion[] = [];
    for (let i = 1; i <= numQuestions; i++) {
      questions.push({
        question: `Question ${i}: Which of the following statements is true regarding ${topic}?`,
        type: i % 2 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE',
        options:
          i % 2 === 0
            ? ['True', 'False']
            : [
                `It ensures consistent data structure and eliminates redundancy.`,
                `It increases duplicate fields across all relations.`,
                `It is only applied during offline batch rendering.`,
                `None of the above.`,
              ],
        correctAnswer:
          i % 2 === 0 ? 'True' : 'It ensures consistent data structure and eliminates redundancy.',
        explanation: `According to standard principles in ${topic}, eliminating redundancy and ensuring integrity is paramount.`,
        difficulty,
      });
    }
    return questions;
  }

  async generateFlashcards(
    topic: string,
    _context: string,
    numCards = 5,
    difficulty: DifficultyLevel = 'MEDIUM'
  ): Promise<GeneratedFlashcard[]> {
    const cards: GeneratedFlashcard[] = [];
    const concepts = [
      { front: `What is the primary definition of ${topic}?`, back: `${topic} is a structured method designed to organize information and ensure consistency.` },
      { front: `What is the key advantage of ${topic}?`, back: `It prevents data anomalies, reduces storage overhead, and clarifies entity relationships.` },
      { front: `When should ${topic} be applied?`, back: `During design and analysis phases before implementing production schemas.` },
      { front: `What is a common pitfall in ${topic}?`, back: `Over-engineering without considering practical query performance requirements.` },
      { front: `How do you verify correctness in ${topic}?`, back: `By checking functional dependencies, lossless join conditions, and dependency preservation.` },
    ];

    for (let i = 0; i < Math.min(numCards, concepts.length); i++) {
      cards.push({
        front: concepts[i].front,
        back: concepts[i].back,
        topic,
        difficulty,
      });
    }

    return cards;
  }

  async generateStudyPlan(
    targetSubject: string,
    _examDate: string,
    availableHoursPerDay: number,
    currentLevel: string,
    weakTopics: string[],
    _context?: string
  ): Promise<GeneratedStudyPlanDay[]> {
    const days: GeneratedStudyPlanDay[] = [];
    const topics = [
      `${targetSubject} Fundamentals & Overview`,
      ...(weakTopics.length > 0 ? weakTopics : [`${targetSubject} Core Principles`, `${targetSubject} Advanced Applications`]),
      `${targetSubject} Practice Problems & Case Studies`,
      `${targetSubject} Exam Review & Self-Assessment`,
    ];

    const today = new Date();
    for (let i = 0; i < topics.length; i++) {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + i);

      days.push({
        dayNumber: i + 1,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        topic: topics[i],
        description: `Dedicated ${Math.round(availableHoursPerDay * 60)} min session focusing on ${topics[i]} tailored for ${currentLevel} level.`,
        estimatedMinutes: Math.round(availableHoursPerDay * 60),
      });
    }

    return days;
  }

  async generateLearningInsights(
    masteryScores: Record<string, number>,
    weakTopics: string[],
    quizAccuracy: number,
    streakCount: number
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    if (streakCount >= 3) {
      insights.push({
        type: 'STREAK',
        title: `${streakCount}-Day Learning Streak! 🔥`,
        description: `You are building great consistency. Keep up the momentum to maximize memory retention.`,
      });
    }

    if (weakTopics.length > 0) {
      insights.push({
        type: 'WEAK_AREA',
        title: `Focus Needed on ${weakTopics[0]}`,
        description: `Your quiz results suggest a review of ${weakTopics[0]} will significantly improve overall subject mastery.`,
        suggestedTopic: weakTopics[0],
      });
    }

    const masteryEntries = Object.entries(masteryScores);
    if (masteryEntries.length > 0) {
      const topMastery = masteryEntries.sort((a, b) => b[1] - a[1])[0];
      insights.push({
        type: 'IMPROVEMENT',
        title: `Strong Mastery in ${topMastery[0]} (${topMastery[1]}%) 🏆`,
        description: `Great job! You have demonstrated solid comprehension in this area.`,
      });
    }

    insights.push({
      type: 'RECOMMENDATION',
      title: `Recommended Next Step`,
      description: `Take a 5-minute practice quiz or review 10 flashcards to solidify today's concepts.`,
      suggestedTopic: weakTopics[0] || (masteryEntries[0] ? masteryEntries[0][0] : 'Core Concepts'),
    });

    return insights;
  }
}
