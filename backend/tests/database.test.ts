import { describe, it, expect } from 'vitest';
import { prisma } from '../src/database/db';

describe('Database & Schema Verification', () => {
  it('should instantiate Prisma client with all models defined', () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.material).toBeDefined();
    expect(prisma.materialChunk).toBeDefined();
    expect(prisma.quiz).toBeDefined();
    expect(prisma.flashcard).toBeDefined();
    expect(prisma.studyPlan).toBeDefined();
    expect(prisma.topicProgress).toBeDefined();
  });
});
