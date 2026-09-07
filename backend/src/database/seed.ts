import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export async function seedDatabase() {
  logger.info('🌱 Starting database seeding...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Student123!', salt);

  try {
    const student = await prisma.user.upsert({
      where: { email: 'student@learnmate.ai' },
      update: {},
      create: {
        email: 'student@learnmate.ai',
        name: 'Alex Johnson',
        passwordHash,
        role: 'STUDENT',
        streakCount: 5,
        preference: {
          create: {
            preferredExplanationMode: 'SIMPLE',
            dailyGoalMinutes: 45,
          },
        },
      },
    });

    const subject = await prisma.subject.create({
      data: {
        userId: student.id,
        name: 'Database Management Systems',
        code: 'CS301',
        description: 'Core concepts in relational databases, indexing, and normalization',
        color: '#6366F1',
        icon: 'database',
      },
    });

    await prisma.topic.createMany({
      data: [
        { subjectId: subject.id, name: 'Relational Model', orderIndex: 1 },
        { subjectId: subject.id, name: 'Database Normalization', orderIndex: 2 },
        { subjectId: subject.id, name: 'SQL & Query Optimization', orderIndex: 3 },
        { subjectId: subject.id, name: 'Transactions & ACID', orderIndex: 4 },
      ],
    });

    logger.info('✅ Database seeded successfully!');
  } catch (error) {
    logger.warn('Seed note:', (error as Error).message);
  }
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
