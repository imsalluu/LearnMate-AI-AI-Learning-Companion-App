import { prisma, isDbAvailable } from '../../database/db';
import { EmbeddingsService } from '../ai/embeddings.service';
import { MaterialService } from '../materials/material.service';
import { logger } from '../../utils/logger';

export interface SourceCitation {
  materialId?: string;
  materialTitle?: string;
  pageNumber: number;
  sectionTitle?: string;
  chunkIndex: number;
  snippet: string;
  score: number;
  source?: string;
}

export interface RagRetrievalResult {
  context: string;
  citations: SourceCitation[];
}

export interface RetrievalFilter {
  userId?: string;
  materialId?: string;
  subjectId?: string;
  topK?: number;
  minScore?: number;
}

export class RagService {
  /**
   * Retrieves relevant chunks using hybrid retrieval and re-ranking
   */
  static async retrieve(query: string, filter: RetrievalFilter = {}): Promise<RagRetrievalResult> {
    const topK = filter.topK || 4;
    const minScore = filter.minScore || 0.15;
    const queryVector = await EmbeddingsService.generateEmbedding(query);

    logger.debug(`🔎 RAG searching for: "${query}" (topK=${topK})`);

    // 1. If database with pgvector is active
    if (isDbAvailable()) {
      try {
        const vectorStr = `[${queryVector.join(',')}]`;
        const results = await prisma.$queryRaw<any[]>`
          SELECT 
            c.id,
            c."materialId",
            c."chunkIndex",
            c."pageNumber",
            c."sectionTitle",
            c.content,
            m.title as "materialTitle",
            m."fileName" as "fileName",
            1 - (c.embedding <=> ${vectorStr}::vector) as "vectorScore"
          FROM material_chunks c
          JOIN materials m ON m.id = c."materialId"
          WHERE 1=1
            ${filter.userId ? prisma.$queryRaw`AND m."userId" = ${filter.userId}::text` : prisma.$queryRaw``}
            ${filter.materialId ? prisma.$queryRaw`AND m.id = ${filter.materialId}::text` : prisma.$queryRaw``}
            ${filter.subjectId ? prisma.$queryRaw`AND m."subjectId" = ${filter.subjectId}::text` : prisma.$queryRaw``}
          ORDER BY "vectorScore" DESC
          LIMIT ${topK};
        `;

        if (results && results.length > 0) {
          const citations: SourceCitation[] = results.map((r) => ({
            materialId: r.materialId,
            materialTitle: r.materialTitle || r.fileName,
            pageNumber: r.pageNumber || 1,
            sectionTitle: r.sectionTitle,
            chunkIndex: r.chunkIndex,
            snippet: r.content.slice(0, 200) + '...',
            score: Number(r.vectorScore?.toFixed(3) || 0),
            source: r.fileName,
          }));

          const context = results.map((r, i) => `[Source ${i + 1} - ${r.materialTitle || 'Doc'}, Page ${r.pageNumber}]:\n${r.content}`).join('\n\n');

          return { context, citations };
        }
      } catch (dbErr) {
        logger.warn('pgvector query fallback to memory search:', (dbErr as Error).message);
      }
    }

    // 2. In-Memory Hybrid Retrieval & Re-ranking Fallback
    const allChunks = MaterialService.getAllChunks(filter.userId);
    if (allChunks.length === 0) {
      return { context: '', citations: [] };
    }

    const queryTokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

    const scored = allChunks.map((chunk) => {
      // Vector score
      const chunkVec = EmbeddingsService.generateDeterministicEmbedding(chunk.content);
      const vectorScore = EmbeddingsService.cosineSimilarity(queryVector, chunkVec);

      // Keyword BM25/TF-IDF style score
      const contentLower = chunk.content.toLowerCase();
      let matchedTokens = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) matchedTokens++;
      }
      const keywordScore = queryTokens.length > 0 ? matchedTokens / queryTokens.length : 0;

      // Hybrid Re-ranking score
      const hybridScore = 0.6 * vectorScore + 0.4 * keywordScore;

      return {
        chunk,
        score: Number(hybridScore.toFixed(3)),
      };
    });

    // Filter, sort by hybrid score descending, take topK
    const topScored = scored
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const citations: SourceCitation[] = topScored.map((item, idx) => ({
      materialId: item.chunk.metadata.materialId,
      materialTitle: item.chunk.metadata.source || `Document Chunk ${item.chunk.metadata.chunkIndex}`,
      pageNumber: item.chunk.metadata.pageNumber || 1,
      sectionTitle: item.chunk.metadata.sectionTitle,
      chunkIndex: item.chunk.metadata.chunkIndex,
      snippet: item.chunk.content.slice(0, 180) + '...',
      score: item.score,
      source: item.chunk.metadata.source,
    }));

    const context = topScored
      .map(
        (item, idx) =>
          `[Source ${idx + 1} - ${item.chunk.metadata.source || 'Material'}, Page ${item.chunk.metadata.pageNumber}${
            item.chunk.metadata.sectionTitle ? `, Section: ${item.chunk.metadata.sectionTitle}` : ''
          }]:\n${item.chunk.content}`
      )
      .join('\n\n');

    return { context, citations };
  }
}
