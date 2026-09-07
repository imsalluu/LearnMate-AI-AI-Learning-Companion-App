import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI Tutor Multi-Explanation APIs', () => {
  const app = createApp();
  let token = '';

  it('should authenticate user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tutor_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Tutor Student',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should generate simple explanation with examples and key points', async () => {
    const res = await request(app)
      .post('/api/v1/tutor/explain')
      .set('Authorization', `Bearer ${token}`)
      .send({
        concept: 'Database Normalization',
        mode: 'simple',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.concept).toBe('Database Normalization');
    expect(res.body.data.mode).toBe('simple');
    expect(res.body.data.explanation).toBeDefined();
    expect(res.body.data.examples.length).toBeGreaterThan(0);
    expect(res.body.data.keyPoints.length).toBeGreaterThan(0);
    expect(res.body.data.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it('should generate exam-focused explanation', async () => {
    const res = await request(app)
      .post('/api/v1/tutor/explain')
      .set('Authorization', `Bearer ${token}`)
      .send({
        concept: 'B-Tree Indexing',
        mode: 'exam-focused',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('exam-focused');
  });

  it('should support deep dive explanation', async () => {
    const res = await request(app)
      .post('/api/v1/tutor/deep-dive')
      .set('Authorization', `Bearer ${token}`)
      .send({
        concept: 'Two-Phase Locking (2PL)',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe('detailed');
  });
});
