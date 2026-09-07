import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI Quiz Generation & Scoring APIs', () => {
  const app = createApp();
  let token = '';
  let quizId = '';
  let sampleQuestions: any[] = [];

  it('should register user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `quiz_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Quiz Master',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should generate a structured quiz on demand', async () => {
    const res = await request(app)
      .post('/api/v1/quizzes/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'SQL Joins & Subqueries',
        difficulty: 'MEDIUM',
        numQuestions: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quiz.topic).toBe('SQL Joins & Subqueries');
    expect(res.body.data.quiz.questions.length).toBe(4);

    quizId = res.body.data.quiz.id;
    sampleQuestions = res.body.data.quiz.questions;
  });

  it('should list quizzes for the user', async () => {
    const res = await request(app)
      .get('/api/v1/quizzes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quizzes.length).toBeGreaterThan(0);
  });

  it('should get quiz details with hidden correct answers', async () => {
    const res = await request(app)
      .get(`/api/v1/quizzes/${quizId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quiz.questions[0].correctAnswer).toBeUndefined();
  });

  it('should submit attempt and evaluate score and weak topics', async () => {
    const answers = sampleQuestions.map((q) => ({
      questionId: q.id,
      userAnswer: q.options[0],
    }));

    const res = await request(app)
      .post(`/api/v1/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        timeSpentSeconds: 120,
        answers,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attempt.score).toBeDefined();
    expect(res.body.data.attempt.answers.length).toBe(4);
    expect(res.body.data.attempt.recommendation).toBeDefined();
  });
});
