import { describe, it, expect } from 'vitest';
import { EmbeddingsService } from '../src/modules/ai/embeddings.service';
import { RagService } from '../src/modules/rag/rag.service';
import { MaterialService } from '../src/modules/materials/material.service';

describe('Embeddings & Hybrid RAG Engine', () => {
  it('should generate normalized 1536-dimensional embedding vector', async () => {
    const text = 'Relational database normalization eliminates duplicate data.';
    const vector = await EmbeddingsService.generateEmbedding(text);

    expect(vector).toHaveLength(1536);
    // Unit vector norm should be close to 1
    let sumSquares = 0;
    for (const val of vector) sumSquares += val * val;
    expect(Math.sqrt(sumSquares)).toBeCloseTo(1.0, 1);
  });

  it('should calculate high cosine similarity for related texts', () => {
    const v1 = EmbeddingsService.generateDeterministicEmbedding('SQL database indexes speed up queries');
    const v2 = EmbeddingsService.generateDeterministicEmbedding('Database indexes improve SQL query speed');
    const v3 = EmbeddingsService.generateDeterministicEmbedding('Photosynthesis in green plant leaves');

    const simRelated = EmbeddingsService.cosineSimilarity(v1, v2);
    const simUnrelated = EmbeddingsService.cosineSimilarity(v1, v3);

    expect(simRelated).toBeGreaterThan(simUnrelated);
  });

  it('should retrieve relevant context and source citations from uploaded materials', async () => {
    const userId = 'user_rag_test_1';
    const fakeFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'DBMS_Notes.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 500,
      destination: '',
      filename: 'DBMS_Notes.txt',
      path: '',
      buffer: Buffer.from(
        '# Normalization in DBMS\nNormalization is the process of minimizing redundancy from a relation or set of relations. Normal forms include 1NF, 2NF, 3NF, and BCNF.'
      ),
      stream: null as any,
    };

    await MaterialService.uploadAndProcess(userId, fakeFile, 'DBMS Notes');

    const res = await RagService.retrieve('What is normalization in DBMS?', { userId });

    expect(res.context).toContain('Normalization');
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.citations[0].materialTitle).toBe('DBMS_Notes.txt');
    expect(res.citations[0].score).toBeGreaterThan(0.2);
  });
});
