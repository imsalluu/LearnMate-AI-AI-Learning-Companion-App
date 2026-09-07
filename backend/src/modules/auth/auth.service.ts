import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { prisma, isDbAvailable } from '../../database/db';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.dto';
import { UserRole } from '../../config/constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

// In-memory fallback user store for testing and offline development
const mockUserStore: Map<string, any> = new Map();

export class AuthService {
  private static generateTokens(user: UserPayload): AuthTokens {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: '1h',
    };
  }

  static async register(input: RegisterInput): Promise<{ user: UserPayload; tokens: AuthTokens }> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const email = input.email.toLowerCase();

    if (isDbAvailable()) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new ConflictError('A user with this email already exists');
      }

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: input.name,
          role: (input.role as any) || 'STUDENT',
          preference: {
            create: {
              preferredExplanationMode: 'SIMPLE',
              dailyGoalMinutes: 30,
            },
          },
        },
      });

      const userPayload: UserPayload = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as UserRole,
        name: newUser.name,
      };

      const tokens = this.generateTokens(userPayload);
      return { user: userPayload, tokens };
    }

    // Fallback in-memory store
    if (mockUserStore.has(email)) {
      throw new ConflictError('A user with this email already exists');
    }

    const mockId = uuidv4();
    const mockUser = {
      id: mockId,
      email,
      passwordHash,
      name: input.name,
      role: input.role || 'STUDENT',
      streakCount: 1,
      createdAt: new Date(),
    };
    mockUserStore.set(mockUser.email, mockUser);
    mockUserStore.set(mockUser.id, mockUser);

    const userPayload: UserPayload = {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role as UserRole,
      name: mockUser.name,
    };

    const tokens = this.generateTokens(userPayload);
    return { user: userPayload, tokens };
  }

  static async login(input: LoginInput): Promise<{ user: UserPayload; tokens: AuthTokens }> {
    const email = input.email.toLowerCase();
    let userRecord: any = null;

    if (isDbAvailable()) {
      userRecord = await prisma.user.findUnique({ where: { email } });
    } else {
      userRecord = mockUserStore.get(email);
    }

    if (!userRecord) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, userRecord.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userPayload: UserPayload = {
      id: userRecord.id,
      email: userRecord.email,
      role: userRecord.role as UserRole,
      name: userRecord.name,
    };

    const tokens = this.generateTokens(userPayload);
    return { user: userPayload, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string; email: string };
      let userRecord: any = null;

      if (isDbAvailable()) {
        userRecord = await prisma.user.findUnique({ where: { id: decoded.id } });
      } else {
        userRecord = mockUserStore.get(decoded.id);
      }

      if (!userRecord) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const userPayload: UserPayload = {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role as UserRole,
        name: userRecord.name,
      };

      return this.generateTokens(userPayload);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static async getProfile(userId: string) {
    if (isDbAvailable()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { preference: true },
      });
      if (user) {
        const { passwordHash: _, ...safeUser } = user;
        return safeUser;
      }
    }

    const mock = mockUserStore.get(userId);
    if (mock) {
      const { passwordHash: _, ...safeUser } = mock;
      return {
        ...safeUser,
        preference: {
          preferredExplanationMode: 'SIMPLE',
          dailyGoalMinutes: 30,
        },
      };
    }

    throw new BadRequestError('User not found');
  }

  static getMockUserStore() {
    return mockUserStore;
  }
}
