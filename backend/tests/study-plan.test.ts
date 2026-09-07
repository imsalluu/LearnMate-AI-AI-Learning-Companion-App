import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Personalized Study Plan APIs', () => {
  const app = createApp();
  let token = '';
  let planId = '';
  let firstItemId = '';

  it('should authenticate user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `plan_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Planner Student',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should generate personalized study plan', async () => {
    const res = await request(app)
      .post('/api/v1/study-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetSubject: 'Database Systems',
        availableHoursPerDay: 2.5,
        currentLevel: 'Beginner',
        weakTopics: ['Normalization', 'B+ Trees'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan.targetSubject).toBe('Database Systems');
    expect(res.body.data.plan.items.length).toBeGreaterThanOrEqual(4);

    planId = res.body.data.plan.id;
    firstItemId = res.body.data.plan.items[0].id;
  });

  it('should get active study plan', async () => {
    const res = await request(app)
      .get('/api/v1/study-plans/active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.plan.id).toBe(planId);
  });

  it('should toggle plan item completion status', async () => {
    const res = await request(app)
      .patch(`/api/v1/study-plans/${planId}/items/${firstItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isCompleted: true });

    expect(res.status).toBe(200);
    expect(res.body.data.item.isCompleted).toBe(true);
  });

  it('should reschedule study plan using AI instruction', async () => {
    const res = await request(app)
      .post(`/api/v1/study-plans/${planId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ instruction: 'Move tomorrow session to Friday' });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
  });
});
