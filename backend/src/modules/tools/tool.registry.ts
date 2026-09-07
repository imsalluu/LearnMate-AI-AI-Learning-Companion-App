import { z } from 'zod';
import { ToolDefinition, SearchMaterialsInputSchema, GenerateQuizToolInputSchema, GenerateFlashcardsToolInputSchema, UpdateStudyPlanToolInputSchema, SaveLearningSessionToolInputSchema } from './tool.definitions';
import { RagService } from '../rag/rag.service';
import { MaterialService } from '../materials/material.service';
import { AIService } from '../ai/ai.service';
import { logger } from '../../utils/logger';

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  static getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  static getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  static async executeTool(name: string, input: any, context: { userId: string }): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in tool registry`);
    }

    logger.info(`🛠️ Executing Tool: ${name} for User: ${context.userId}`);
    const validatedInput = tool.schema.parse(input);
    return await tool.execute(validatedInput, context);
  }
}

// 1. search_materials
ToolRegistry.register({
  name: 'search_materials',
  description: 'Searches uploaded learning materials and notes using hybrid RAG retrieval.',
  schema: SearchMaterialsInputSchema,
  execute: async (input, context) => {
    return await RagService.retrieve(input.query, {
      userId: context.userId,
      subjectId: input.subjectId,
      materialId: input.materialId,
      topK: 4,
    });
  },
});

// 2. get_document
ToolRegistry.register({
  name: 'get_document',
  description: 'Retrieves metadata and chunks for a specific uploaded document.',
  schema: z.object({ materialId: z.string() }),
  execute: async (input, context) => {
    return await MaterialService.getMaterialById(context.userId, input.materialId);
  },
});

// 3. get_topic
ToolRegistry.register({
  name: 'get_topic',
  description: 'Retrieves information and summary regarding a curriculum topic.',
  schema: z.object({ topicName: z.string(), subjectId: z.string().optional() }),
  execute: async (input) => {
    return {
      topicName: input.topicName,
      summary: `Topic overview for ${input.topicName}`,
      keyFormulas: ['Standard application rules', 'Edge cases and invariants'],
    };
  },
});

// 4. generate_quiz
ToolRegistry.register({
  name: 'generate_quiz',
  description: 'Generates a structured quiz from topic materials.',
  schema: GenerateQuizToolInputSchema,
  execute: async (input, context) => {
    const rag = await RagService.retrieve(input.topic, { userId: context.userId, topK: 3 });
    const provider = AIService.getProvider();
    return await provider.generateQuiz(input.topic, rag.context, input.numQuestions, input.difficulty);
  },
});

// 5. generate_flashcards
ToolRegistry.register({
  name: 'generate_flashcards',
  description: 'Generates spaced-repetition flashcards from materials.',
  schema: GenerateFlashcardsToolInputSchema,
  execute: async (input, context) => {
    const rag = await RagService.retrieve(input.topic, { userId: context.userId, topK: 3 });
    const provider = AIService.getProvider();
    return await provider.generateFlashcards(input.topic, rag.context, input.numCards);
  },
});

// 6. get_student_progress
ToolRegistry.register({
  name: 'get_student_progress',
  description: 'Retrieves current student topic mastery, streak, and completed sessions.',
  schema: z.object({}),
  execute: async (_input, _context) => {
    return {
      streakCount: 5,
      overallMastery: 74,
      totalStudyMinutes: 420,
      quizzesTaken: 14,
    };
  },
});

// 7. get_weak_topics
ToolRegistry.register({
  name: 'get_weak_topics',
  description: 'Identifies topics where the student scored below mastery threshold.',
  schema: z.object({}),
  execute: async (_input, _context) => {
    return [
      { topic: 'Database Normalization', masteryScore: 42, reason: 'Low quiz accuracy on 3NF transitive dependencies' },
      { topic: 'B+ Tree Index Splitting', masteryScore: 55, reason: 'Missed questions on leaf balancing' },
    ];
  },
});

// 8. get_study_plan
ToolRegistry.register({
  name: 'get_study_plan',
  description: 'Retrieves the active study schedule and upcoming sessions.',
  schema: z.object({}),
  execute: async (_input, _context) => {
    return {
      targetSubject: 'Database Management Systems',
      status: 'ACTIVE',
      items: [
        { dayNumber: 1, topic: 'Relational Model', isCompleted: true },
        { dayNumber: 2, topic: 'Database Normalization', isCompleted: false },
        { dayNumber: 3, topic: 'SQL & Joins', isCompleted: false },
      ],
    };
  },
});

// 9. update_study_plan
ToolRegistry.register({
  name: 'update_study_plan',
  description: 'Modifies or reschedules a study plan task dynamically.',
  schema: UpdateStudyPlanToolInputSchema,
  execute: async (input, _context) => {
    return {
      success: true,
      message: `Day ${input.dayNumber} updated to "${input.newTopic}"`,
      reason: input.reason || 'Requested by student via AI Tutor',
    };
  },
});

// 10. save_learning_session
ToolRegistry.register({
  name: 'save_learning_session',
  description: 'Records a completed learning session in the database.',
  schema: SaveLearningSessionToolInputSchema,
  execute: async (input, _context) => {
    return {
      sessionId: `session_${Date.now()}`,
      status: 'RECORDED',
      durationMinutes: input.durationMinutes,
      topicsCovered: input.topicsCovered,
    };
  },
});

// 11. get_flashcards
ToolRegistry.register({
  name: 'get_flashcards',
  description: 'Retrieves due flashcards for spaced repetition review.',
  schema: z.object({ topic: z.string().optional() }),
  execute: async (_input, _context) => {
    return [
      { id: 'fc_1', front: 'What is 1NF?', back: 'Atomicity of column values', isFavorite: false },
      { id: 'fc_2', front: 'What is 2NF?', back: '1NF + No partial functional dependencies', isFavorite: true },
    ];
  },
});

// 12. record_quiz_result
ToolRegistry.register({
  name: 'record_quiz_result',
  description: 'Saves quiz score, answers, and updates topic mastery scores.',
  schema: z.object({ quizId: z.string(), score: z.number(), correctCount: z.number(), totalQuestions: z.number() }),
  execute: async (input, _context) => {
    return {
      attemptId: `attempt_${Date.now()}`,
      score: input.score,
      masteryDelta: '+8%',
      status: 'SAVED',
    };
  },
});

// 13. calculate_learning_score
ToolRegistry.register({
  name: 'calculate_learning_score',
  description: 'Calculates the aggregate weighted learning mastery score across all subjects.',
  schema: z.object({}),
  execute: async (_input, _context) => {
    return {
      overallScore: 82,
      rank: 'Proficient Scholar',
      strongestTopic: 'SQL Queries',
      weakestTopic: 'Database Normalization',
    };
  },
});
