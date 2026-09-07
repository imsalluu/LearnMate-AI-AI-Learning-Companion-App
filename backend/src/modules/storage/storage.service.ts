import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class StorageService {
  private static uploadDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);

  static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`📁 Upload directory created at: ${this.uploadDir}`);
    }
  }

  static async saveFile(file: Express.Multer.File): Promise<{ fileUrl: string; filePath: string }> {
    this.init();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    const fileName = `${uniqueSuffix}${extension}`;
    const destinationPath = path.join(this.uploadDir, fileName);

    if (file.buffer) {
      await fs.promises.writeFile(destinationPath, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, destinationPath);
    }

    const fileUrl = `/uploads/${fileName}`;
    return { fileUrl, filePath: destinationPath };
  }

  static async deleteFile(fileUrl: string): Promise<void> {
    const fileName = path.basename(fileUrl);
    const fullPath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  static getFilePath(fileUrl: string): string {
    const fileName = path.basename(fileUrl);
    return path.join(this.uploadDir, fileName);
  }
}
