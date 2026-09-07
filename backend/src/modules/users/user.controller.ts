import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { UpdateProfileDto } from '../auth/auth.dto';
import { sendSuccess } from '../../utils/response';

export class UserController {
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateProfileDto.parse(req.body);
      const user = await UserService.updateProfile(req.user!.id, validated);
      sendSuccess(res, { user }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await UserService.getUserStats(req.user!.id);
      sendSuccess(res, { stats });
    } catch (error) {
      next(error);
    }
  }
}
