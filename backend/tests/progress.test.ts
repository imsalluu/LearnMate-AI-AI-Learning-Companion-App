import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Learning Progress, Mastery & AI Insights APIs', () => {
  const app = createApp();
  let token = '';

  it('should authenticate user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `progress_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Mastery Tracker',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should record a learning session', async () => {
    const res = await request(app)
      .post('/api/v1/progress/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionType: 'QUIZ',
        durationMinutes: 25,
        topicsCovered: ['SQL Queries', 'Indexing'],
        score: 85,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.durationMinutes).toBe(25);
  });

  it('should update topic mastery score upon quiz answer', async () => {
    const res = await request(app)
      .post('/api/v1/progress/mastery')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicName: 'Database Normalization',
        isCorrect: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.topicProgress.masteryScore).toBeGreaterThan(0);
  });

  it('should fetch comprehensive learning analytics with AI insights', async () => {
    const res = await request(app)
      .get('/api/v1/progress/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallMastery).toBeGreaterThan(0);
    expect(res.body.data.topicMasteries.length).toBeGreaterThan(0);
    expect(res.body.data.insights.length).toBeGreaterThan(0);
  });
});
