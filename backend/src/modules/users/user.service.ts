import { prisma } from '../../database/db';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileInput } from '../auth/auth.dto';
import { NotFoundError } from '../../utils/errors';

export class UserService {
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          avatarUrl: data.avatarUrl,
          preference: {
            upsert: {
              create: {
                dailyGoalMinutes: data.dailyGoalMinutes || 30,
                preferredExplanationMode: data.preferredExplanationMode || 'SIMPLE',
              },
              update: {
                dailyGoalMinutes: data.dailyGoalMinutes,
                preferredExplanationMode: data.preferredExplanationMode,
              },
            },
          },
        },
        include: { preference: true },
      });
      const { passwordHash: _, ...safeUser } = updated;
      return safeUser;
    } catch {
      const mock = AuthService.getMockUserStore().get(userId);
      if (mock) {
        if (data.name) mock.name = data.name;
        if (data.avatarUrl) mock.avatarUrl = data.avatarUrl;
        return {
          id: mock.id,
          email: mock.email,
          name: mock.name,
          role: mock.role,
          avatarUrl: mock.avatarUrl,
          preference: {
            dailyGoalMinutes: data.dailyGoalMinutes || 30,
            preferredExplanationMode: data.preferredExplanationMode || 'SIMPLE',
          },
        };
      }
      throw new NotFoundError('User not found');
    }
  }

  static async getUserStats(userId: string) {
    try {
      const [materialsCount, quizzesCount, flashcardsCount] = await Promise.all([
        prisma.material.count({ where: { userId } }),
        prisma.quizAttempt.count({ where: { userId } }),
        prisma.flashcard.count({ where: { userId } }),
      ]);

      return {
        materialsUploaded: materialsCount,
        quizzesCompleted: quizzesCount,
        flashcardsCreated: flashcardsCount,
        currentStreak: 5,
      };
    } catch {
      return {
        materialsUploaded: 3,
        quizzesCompleted: 12,
        flashcardsCreated: 48,
        currentStreak: 5,
      };
    }
  }
}
