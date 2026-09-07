import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Learning Agent & Conversation Chat Flow', () => {
  const app = createApp();
  let token = '';

  it('should authenticate user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `agent_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Agent Tester',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should process concept explanation request via agent workflow', async () => {
    const res = await request(app)
      .post('/api/v1/conversations/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'What is normalization in DBMS?',
        mode: 'simple',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assistantMessage.content).toBeDefined();
    expect(res.body.data.toolActions.length).toBeGreaterThan(0);
    expect(res.body.data.suggestedFollowUps.length).toBeGreaterThan(0);
  });

  it('should route quiz request to quiz generator tool via agent intent detection', async () => {
    const res = await request(app)
      .post('/api/v1/conversations/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'Create a practice quiz for Normalization',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.quiz).toBeDefined();
    expect(res.body.data.quiz.length).toBeGreaterThan(0);
  });
});
