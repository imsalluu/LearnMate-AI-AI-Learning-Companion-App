import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './auth.dto';
import { sendCreated, sendSuccess } from '../../utils/response';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterDto.parse(req.body);
      const result = await AuthService.register(validated);
      sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginDto.parse(req.body);
      const result = await AuthService.login(validated);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RefreshTokenDto.parse(req.body);
      const tokens = await AuthService.refreshToken(validated.refreshToken);
      sendSuccess(res, { tokens }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getProfile(req.user!.id);
      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, null, 'Logged out successfully');
  }
}
