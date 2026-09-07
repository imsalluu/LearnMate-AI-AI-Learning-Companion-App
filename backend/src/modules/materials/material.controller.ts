import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { MaterialService } from './material.service';
import { QueryMaterialsDto } from './material.dto';
import { sendCreated, sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { env } from '../../config/env';

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt|md|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only PDF, DOCX, TXT, and Markdown files are supported'));
    }
  },
});

export class MaterialController {
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file provided for upload');
      }

      const { title, subjectId } = req.body;
      const material = await MaterialService.uploadAndProcess(
        req.user!.id,
        req.file,
        title,
        subjectId
      );

      sendCreated(res, { material }, 'Material uploaded and processed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = QueryMaterialsDto.parse(req.query);
      const result = await MaterialService.listMaterials(req.user!.id, query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await MaterialService.getMaterialById(req.user!.id, req.params.id);
      sendSuccess(res, { material });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MaterialService.deleteMaterial(req.user!.id, req.params.id);
      sendSuccess(res, null, 'Material deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
