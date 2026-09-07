import { v4 as uuidv4 } from 'uuid';
import { prisma, isDbAvailable } from '../../database/db';
import { StorageService } from '../storage/storage.service';
import { DocumentParser } from './document-parser';
import { SemanticChunker, DocumentChunk } from './chunker';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { QueryMaterialsInput } from './material.dto';

// In-memory fallback store for materials & chunks
const mockMaterials: Map<string, any> = new Map();
const mockChunks: Map<string, DocumentChunk[]> = new Map();

export class MaterialService {
  static async uploadAndProcess(
    userId: string,
    file: Express.Multer.File,
    title?: string,
    subjectId?: string
  ) {
    const originalName = file.originalname;
    const materialTitle = title || originalName.replace(/\.[^/.]+$/, '');
    const { fileUrl, filePath } = await StorageService.saveFile(file);

    let materialId = uuidv4();
    let parsedDoc: any = null;
    let chunks: DocumentChunk[] = [];

    try {
      // 1. Parse document text
      parsedDoc = await DocumentParser.parse(filePath, file.mimetype, originalName);

      // 2. Split into semantic chunks
      chunks = SemanticChunker.chunkDocument(
        parsedDoc.text,
        { chunkSize: 800, chunkOverlap: 100 },
        {
          materialId,
          source: originalName,
          totalPages: parsedDoc.pageCount,
        }
      );

      // 3. Persist to DB or Memory
      if (isDbAvailable()) {
        const material = await prisma.material.create({
          data: {
            id: materialId,
            userId,
            subjectId: subjectId || null,
            title: materialTitle,
            fileName: originalName,
            fileType: file.mimetype,
            fileUrl,
            fileSize: file.size,
            status: 'READY',
            pageCount: parsedDoc.pageCount,
            chunkCount: chunks.length,
          },
        });

        if (chunks.length > 0) {
          await prisma.materialChunk.createMany({
            data: chunks.map((c) => ({
              materialId: material.id,
              chunkIndex: c.metadata.chunkIndex,
              pageNumber: c.metadata.pageNumber,
              sectionTitle: c.metadata.sectionTitle || null,
              content: c.content,
              tokenCount: c.metadata.tokenCount,
              metadata: c.metadata as any,
            })),
          });
        }

        return material;
      }

      // Memory store fallback
      const mockMaterial = {
        id: materialId,
        userId,
        subjectId: subjectId || null,
        title: materialTitle,
        fileName: originalName,
        fileType: file.mimetype,
        fileUrl,
        fileSize: file.size,
        status: 'READY',
        pageCount: parsedDoc.pageCount,
        chunkCount: chunks.length,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMaterials.set(materialId, mockMaterial);
      mockChunks.set(materialId, chunks);

      return mockMaterial;
    } catch (error: any) {
      logger.error(`Error processing material ${originalName}:`, error);

      if (isDbAvailable()) {
        return await prisma.material.create({
          data: {
            id: materialId,
            userId,
            subjectId: subjectId || null,
            title: materialTitle,
            fileName: originalName,
            fileType: file.mimetype,
            fileUrl,
            fileSize: file.size,
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }

      const failedMaterial = {
        id: materialId,
        userId,
        subjectId: subjectId || null,
        title: materialTitle,
        fileName: originalName,
        fileType: file.mimetype,
        fileUrl,
        fileSize: file.size,
        status: 'FAILED',
        errorMessage: error.message,
        createdAt: new Date(),
      };
      mockMaterials.set(materialId, failedMaterial);
      return failedMaterial;
    }
  }

  static async listMaterials(userId: string, query: QueryMaterialsInput) {
    if (isDbAvailable()) {
      const where: any = { userId };
      if (query.subjectId) where.subjectId = query.subjectId;
      if (query.status) where.status = query.status;
      if (query.search) {
        where.title = { contains: query.search, mode: 'insensitive' };
      }

      const [items, total] = await Promise.all([
        prisma.material.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
          include: { subject: true },
        }),
        prisma.material.count({ where }),
      ]);

      return { items, total, page: query.page, limit: query.limit };
    }

    // Memory fallback
    let items = Array.from(mockMaterials.values()).filter((m) => m.userId === userId);
    if (query.subjectId) items = items.filter((m) => m.subjectId === query.subjectId);
    if (query.status) items = items.filter((m) => m.status === query.status);
    if (query.search) {
      items = items.filter((m) =>
        m.title.toLowerCase().includes(query.search!.toLowerCase())
      );
    }

    const total = items.length;
    const paginated = items.slice((query.page - 1) * query.limit, query.page * query.limit);

    return { items: paginated, total, page: query.page, limit: query.limit };
  }

  static async getMaterialById(userId: string, materialId: string) {
    if (isDbAvailable()) {
      const material = await prisma.material.findFirst({
        where: { id: materialId, userId },
        include: { subject: true, chunks: { take: 50, orderBy: { chunkIndex: 'asc' } } },
      });
      if (!material) throw new NotFoundError('Material not found');
      return material;
    }

    const material = mockMaterials.get(materialId);
    if (!material || material.userId !== userId) {
      throw new NotFoundError('Material not found');
    }

    const chunks = mockChunks.get(materialId) || [];
    return { ...material, chunks };
  }

  static async deleteMaterial(userId: string, materialId: string) {
    if (isDbAvailable()) {
      const material = await prisma.material.findFirst({
        where: { id: materialId, userId },
      });
      if (!material) throw new NotFoundError('Material not found');

      await StorageService.deleteFile(material.fileUrl);
      await prisma.material.delete({ where: { id: materialId } });
      return { success: true };
    }

    const material = mockMaterials.get(materialId);
    if (!material || material.userId !== userId) {
      throw new NotFoundError('Material not found');
    }

    await StorageService.deleteFile(material.fileUrl);
    mockMaterials.delete(materialId);
    mockChunks.delete(materialId);
    return { success: true };
  }

  static getChunksForMaterial(materialId: string): DocumentChunk[] {
    return mockChunks.get(materialId) || [];
  }

  static getAllChunks(userId?: string): DocumentChunk[] {
    const result: DocumentChunk[] = [];
    for (const [matId, chunks] of mockChunks.entries()) {
      const mat = mockMaterials.get(matId);
      if (!userId || (mat && mat.userId === userId)) {
        result.push(...chunks);
      }
    }
    return result;
  }
}
