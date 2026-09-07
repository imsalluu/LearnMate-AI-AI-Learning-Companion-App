import { AIService } from '../ai/ai.service';
import { ToolRegistry } from '../tools/tool.registry';
import { SourceCitation } from '../rag/rag.service';
import { logger } from '../../utils/logger';
import { ExplanationMode } from '../../config/constants';

export interface AgentContext {
  userId: string;
  conversationId?: string;
  mode?: ExplanationMode;
  subjectId?: string;
}

export interface AgentActionLog {
  toolName: string;
  input: any;
  output: any;
}

export interface AgentResponse {
  answer: string;
  intent: string;
  mode: ExplanationMode;
  citations: SourceCitation[];
  toolActions: AgentActionLog[];
  suggestedFollowUps: string[];
  quiz?: any;
  flashcards?: any[];
}

export class LearningAgent {
  /**
   * Main multi-step Agentic Workflow
   */
  static async run(prompt: string, context: AgentContext): Promise<AgentResponse> {
    const cleanPrompt = AIService.sanitizePrompt(prompt);
    const mode = context.mode || 'simple';
    logger.info(`🤖 Agent starting workflow for User: ${context.userId}, Prompt: "${cleanPrompt}"`);

    const toolActions: AgentActionLog[] = [];
    let citations: SourceCitation[] = [];
    let retrievedContext = '';
    let quizData: any = null;
    let flashcardsData: any[] = [];

    // Step 1: Intent Classification & Routing
    const intent = this.classifyIntent(cleanPrompt);
    logger.debug(`🎯 Detected Intent: ${intent}`);

    // Step 2: Agent Action & Tool Calling
    if (intent === 'QUIZ_REQUEST') {
      const topicMatch = cleanPrompt.replace(/create|generate|give me|quiz on|quiz for/gi, '').trim() || 'General Subject';
      const toolRes = await ToolRegistry.executeTool('generate_quiz', { topic: topicMatch, numQuestions: 4 }, { userId: context.userId });
      toolActions.push({ toolName: 'generate_quiz', input: { topic: topicMatch }, output: toolRes });
      quizData = toolRes;
    } else if (intent === 'FLASHCARD_REQUEST') {
      const topicMatch = cleanPrompt.replace(/create|generate|flashcards for|flashcards on/gi, '').trim() || 'Core Concepts';
      const toolRes = await ToolRegistry.executeTool('generate_flashcards', { topic: topicMatch, numCards: 5 }, { userId: context.userId });
      toolActions.push({ toolName: 'generate_flashcards', input: { topic: topicMatch }, output: toolRes });
      flashcardsData = toolRes;
    } else if (intent === 'STUDY_PLAN_UPDATE') {
      const toolRes = await ToolRegistry.executeTool('update_study_plan', { dayNumber: 2, newTopic: 'Review Normalization & SQL' }, { userId: context.userId });
      toolActions.push({ toolName: 'update_study_plan', input: { dayNumber: 2 }, output: toolRes });
    } else if (intent === 'PROGRESS_QUERY') {
      const progress = await ToolRegistry.executeTool('get_student_progress', {}, { userId: context.userId });
      const weak = await ToolRegistry.executeTool('get_weak_topics', {}, { userId: context.userId });
      toolActions.push({ toolName: 'get_student_progress', input: {}, output: progress });
      toolActions.push({ toolName: 'get_weak_topics', input: {}, output: weak });
    }

    // Step 3: Retrieve Grounded Context via RAG Tool
    const ragResult = await ToolRegistry.executeTool(
      'search_materials',
      { query: cleanPrompt, subjectId: context.subjectId },
      { userId: context.userId }
    );
    toolActions.push({ toolName: 'search_materials', input: { query: cleanPrompt }, output: { citationCount: ragResult.citations.length } });

    citations = ragResult.citations || [];
    retrievedContext = ragResult.context || '';

    // Step 4: Generate Grounded Answer with Explanation Mode
    const provider = AIService.getProvider();
    const explanationData = await provider.generateExplanation(cleanPrompt, mode, retrievedContext);

    let answer = explanationData.explanation;
    if (explanationData.examples && explanationData.examples.length > 0) {
      answer += `\n\n### 💡 Real-World Examples:\n${explanationData.examples.map((e) => `- ${e}`).join('\n')}`;
    }
    if (explanationData.keyPoints && explanationData.keyPoints.length > 0) {
      answer += `\n\n### 📌 Key Takeaways:\n${explanationData.keyPoints.map((k) => `- ${k}`).join('\n')}`;
    }

    if (quizData) {
      answer += `\n\n🎯 **I have generated a practice quiz for you below with ${quizData.length} questions!**`;
    }
    if (flashcardsData.length > 0) {
      answer += `\n\n🃏 **I have generated ${flashcardsData.length} flashcards for spaced repetition study!**`;
    }

    return {
      answer,
      intent,
      mode,
      citations,
      toolActions,
      suggestedFollowUps: explanationData.suggestedQuestions || [
        'Can you give me another example?',
        'Generate a quiz on this topic',
        'How does this appear on exams?',
      ],
      quiz: quizData,
      flashcards: flashcardsData.length > 0 ? flashcardsData : undefined,
    };
  }

  private static classifyIntent(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('quiz') || lower.includes('test me') || lower.includes('practice questions')) {
      return 'QUIZ_REQUEST';
    }
    if (lower.includes('flashcard') || lower.includes('cards') || lower.includes('deck')) {
      return 'FLASHCARD_REQUEST';
    }
    if (lower.includes('study plan') || lower.includes('schedule') || lower.includes('reschedule') || lower.includes('move')) {
      return 'STUDY_PLAN_UPDATE';
    }
    if (lower.includes('progress') || lower.includes('weak') || lower.includes('mastery') || lower.includes('score')) {
      return 'PROGRESS_QUERY';
    }
    return 'EXPLANATION_QA';
  }
}
