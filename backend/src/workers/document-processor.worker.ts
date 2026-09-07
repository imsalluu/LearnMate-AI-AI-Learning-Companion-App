import { QUEUES } from '../../config/constants';
import { logger } from '../../utils/logger';
import { MaterialService } from '../materials/material.service';
import { EmbeddingsService } from '../ai/embeddings.service';

export interface DocumentJobPayload {
  materialId: string;
  userId: string;
  filePath: string;
  mimetype: string;
  originalName: string;
}

export class DocumentProcessorWorker {
  static async processJob(payload: DocumentJobPayload): Promise<void> {
    logger.info(`🔄 Processing document job for material: ${payload.materialId}`);
    try {
      // Chunking and embedding generation pipeline
      const chunks = MaterialService.getChunksForMaterial(payload.materialId);
      if (chunks.length > 0) {
        logger.info(`✨ Generating embeddings for ${chunks.length} chunks...`);
        for (const chunk of chunks) {
          await EmbeddingsService.generateEmbedding(chunk.content);
        }
      }
      logger.info(`✅ Successfully processed material: ${payload.materialId}`);
    } catch (error) {
      logger.error(`❌ Ingestion failed for material ${payload.materialId}:`, error);
    }
  }

  static getQueueName(): string {
    return QUEUES.DOCUMENT_INGESTION;
  }
}
