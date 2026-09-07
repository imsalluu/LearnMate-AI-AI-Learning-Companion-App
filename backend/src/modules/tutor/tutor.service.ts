import { AIService } from '../ai/ai.service';
import { RagService, SourceCitation } from '../rag/rag.service';
import { ExplanationMode } from '../../config/constants';
import { logger } from '../../utils/logger';

export interface TutorExplanationResult {
  concept: string;
  mode: ExplanationMode;
  explanation: string;
  examples: string[];
  keyPoints: string[];
  suggestedQuestions: string[];
  citations: SourceCitation[];
}

export class TutorService {
  static async explainConcept(
    userId: string,
    concept: string,
    mode: ExplanationMode = 'simple',
    materialId?: string,
    subjectId?: string
  ): Promise<TutorExplanationResult> {
    const cleanConcept = AIService.sanitizePrompt(concept);
    logger.info(`🧑‍🏫 AI Tutor explaining "${cleanConcept}" in [${mode}] mode for user: ${userId}`);

    // 1. Retrieve grounded study material context
    const ragResult = await RagService.retrieve(cleanConcept, {
      userId,
      materialId,
      subjectId,
      topK: 4,
    });

    // 2. Generate structured explanation with the AI provider
    const provider = AIService.getProvider();
    const explanationData = await provider.generateExplanation(cleanConcept, mode, ragResult.context);

    return {
      concept: cleanConcept,
      mode,
      explanation: explanationData.explanation,
      examples: explanationData.examples,
      keyPoints: explanationData.keyPoints,
      suggestedQuestions: explanationData.suggestedQuestions,
      citations: ragResult.citations,
    };
  }

  static async deepDive(userId: string, concept: string, subjectId?: string): Promise<TutorExplanationResult> {
    return this.explainConcept(userId, concept, 'detailed', undefined, subjectId);
  }
}
