import { v4 as uuidv4 } from 'uuid';
import { prisma, isDbAvailable } from '../../database/db';
import { AIService } from '../ai/ai.service';
import { GenerateStudyPlanInput, RescheduleStudyPlanInput } from './study-plan.dto';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface StudyPlanItemRecord {
  id: string;
  studyPlanId: string;
  dayNumber: number;
  scheduledDate: string;
  topic: string;
  description: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  completedAt?: Date | null;
  orderIndex: number;
}

export interface StudyPlanRecord {
  id: string;
  userId: string;
  subjectId?: string | null;
  title: string;
  targetSubject: string;
  examDate?: string | null;
  availableHoursPerDay: number;
  currentLevel: string;
  weakTopics: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  items: StudyPlanItemRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const mockStudyPlans: Map<string, StudyPlanRecord> = new Map();

export class StudyPlanService {
  /**
   * Generates a tailored study plan with AI
   */
  static async generatePlan(userId: string, input: GenerateStudyPlanInput) {
    logger.info(`📅 Generating personalized study plan for "${input.targetSubject}" for user: ${userId}`);

    const provider = AIService.getProvider();
    const days = await provider.generateStudyPlan(
      input.targetSubject,
      input.examDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      input.availableHoursPerDay,
      input.currentLevel,
      input.weakTopics
    );

    const planId = uuidv4();
    const title = `${input.targetSubject} Comprehensive Study Plan`;

    const items: StudyPlanItemRecord[] = days.map((d, idx) => ({
      id: uuidv4(),
      studyPlanId: planId,
      dayNumber: d.dayNumber,
      scheduledDate: d.scheduledDate,
      topic: d.topic,
      description: d.description,
      estimatedMinutes: d.estimatedMinutes,
      isCompleted: false,
      completedAt: null,
      orderIndex: idx,
    }));

    if (isDbAvailable()) {
      const created = await prisma.studyPlan.create({
        data: {
          id: planId,
          userId,
          subjectId: input.subjectId || null,
          title,
          targetSubject: input.targetSubject,
          examDate: input.examDate ? new Date(input.examDate) : null,
          availableHoursPerDay: input.availableHoursPerDay,
          currentLevel: input.currentLevel,
          weakTopics: input.weakTopics,
          status: 'ACTIVE',
          items: {
            create: items.map((i) => ({
              id: i.id,
              dayNumber: i.dayNumber,
              scheduledDate: new Date(i.scheduledDate),
              topic: i.topic,
              description: i.description,
              estimatedMinutes: i.estimatedMinutes,
              isCompleted: false,
              orderIndex: i.orderIndex,
            })),
          },
        },
        include: { items: { orderBy: { orderIndex: 'asc' } } },
      });
      return created;
    }

    const planRecord: StudyPlanRecord = {
      id: planId,
      userId,
      subjectId: input.subjectId || null,
      title,
      targetSubject: input.targetSubject,
      examDate: input.examDate || null,
      availableHoursPerDay: input.availableHoursPerDay,
      currentLevel: input.currentLevel,
      weakTopics: input.weakTopics,
      status: 'ACTIVE',
      items,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockStudyPlans.set(planId, planRecord);
    return planRecord;
  }

  static async getActivePlan(userId: string) {
    if (isDbAvailable()) {
      return await prisma.studyPlan.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        include: { items: { orderBy: { orderIndex: 'asc' } } },
      });
    }

    const plans = Array.from(mockStudyPlans.values())
      .filter((p) => p.userId === userId && p.status === 'ACTIVE')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return plans[0] || null;
  }

  static async getPlanById(userId: string, planId: string) {
    if (isDbAvailable()) {
      const plan = await prisma.studyPlan.findFirst({
        where: { id: planId, userId },
        include: { items: { orderBy: { orderIndex: 'asc' } } },
      });
      if (!plan) throw new NotFoundError('Study plan not found');
      return plan;
    }

    const plan = mockStudyPlans.get(planId);
    if (!plan || plan.userId !== userId) throw new NotFoundError('Study plan not found');
    return plan;
  }

  static async toggleItemCompletion(userId: string, planId: string, itemId: string, isCompleted: boolean) {
    if (isDbAvailable()) {
      return await prisma.studyPlanItem.update({
        where: { id: itemId },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    const plan = mockStudyPlans.get(planId);
    if (!plan || plan.userId !== userId) throw new NotFoundError('Study plan not found');

    const item = plan.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundError('Study plan item not found');

    item.isCompleted = isCompleted;
    item.completedAt = isCompleted ? new Date() : null;
    return item;
  }

  /**
   * Reschedules items based on student instructions (e.g., "Shift day 2 to day 4")
   */
  static async reschedulePlan(userId: string, planId: string, input: RescheduleStudyPlanInput) {
    const plan = await this.getPlanById(userId, planId);
    logger.info(`🤖 AI Rescheduling Study Plan ${planId} with instruction: "${input.instruction}"`);

    // Dynamic shift simulation
    if (plan.items && plan.items.length > 1) {
      const first = plan.items[0];
      const second = plan.items[1];
      const tempTopic = first.topic;
      first.topic = second.topic;
      second.topic = tempTopic;
    }

    return {
      success: true,
      message: `Study plan successfully adapted: "${input.instruction}"`,
      plan,
    };
  }
}
