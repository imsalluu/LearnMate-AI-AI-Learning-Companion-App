import { v4 as uuidv4 } from 'uuid';
import { prisma, isDbAvailable } from '../../database/db';
import { LearningAgent } from '../agents/learning-agent';
import { ExplanationMode } from '../../config/constants';
import { NotFoundError } from '../../utils/errors';

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  citations?: any;
  toolCalls?: any;
  quiz?: any;
  flashcards?: any;
  createdAt: Date;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  messages: MessageRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const mockConversations: Map<string, ConversationRecord> = new Map();

export class ConversationService {
  static async listConversations(userId: string) {
    if (isDbAvailable()) {
      return await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      });
    }

    return Array.from(mockConversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  static async getConversation(userId: string, conversationId: string) {
    if (isDbAvailable()) {
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conv) throw new NotFoundError('Conversation not found');
      return conv;
    }

    const conv = mockConversations.get(conversationId);
    if (!conv || conv.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }
    return conv;
  }

  static async sendMessage(
    userId: string,
    message: string,
    conversationId?: string,
    mode: ExplanationMode = 'simple',
    subjectId?: string
  ) {
    let convId = conversationId;

    if (!convId) {
      convId = uuidv4();
      const newConv: ConversationRecord = {
        id: convId,
        userId,
        subjectId: subjectId || null,
        title: message.slice(0, 40) + '...',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockConversations.set(convId, newConv);

      if (isDbAvailable()) {
        await prisma.conversation.create({
          data: {
            id: convId,
            userId,
            subjectId: subjectId || null,
            title: message.slice(0, 40) + '...',
          },
        });
      }
    }

    // Run Learning Agent workflow
    const agentRes = await LearningAgent.run(message, {
      userId,
      conversationId: convId,
      mode,
      subjectId,
    });

    const userMsg: MessageRecord = {
      id: uuidv4(),
      conversationId: convId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    };

    const assistantMsg: MessageRecord = {
      id: uuidv4(),
      conversationId: convId,
      role: 'assistant',
      content: agentRes.answer,
      mode,
      citations: agentRes.citations,
      toolCalls: agentRes.toolActions,
      quiz: agentRes.quiz,
      flashcards: agentRes.flashcards,
      createdAt: new Date(),
    };

    const conv = mockConversations.get(convId);
    if (conv) {
      conv.messages.push(userMsg, assistantMsg);
      conv.updatedAt = new Date();
    }

    if (isDbAvailable()) {
      await prisma.message.createMany({
        data: [
          {
            id: userMsg.id,
            conversationId: convId,
            role: 'user',
            content: message,
          },
          {
            id: assistantMsg.id,
            conversationId: convId,
            role: 'assistant',
            content: agentRes.answer,
            mode,
            citations: agentRes.citations as any,
            toolCalls: agentRes.toolActions as any,
          },
        ],
      });
      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations: agentRes.citations,
      suggestedFollowUps: agentRes.suggestedFollowUps,
      toolActions: agentRes.toolActions,
      quiz: agentRes.quiz,
      flashcards: agentRes.flashcards,
    };
  }
}
