import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('LearnMate AI Full End-to-End System Integration Flow', () => {
  const app = createApp();
  let token = '';
  let materialId = '';
  let quizId = '';
  let cardId = '';
  let planId = '';

  // 1. Auth
  it('1. should register a new student', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Sarah Connor',
        email: `sarah_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    token = res.body.data.tokens.accessToken;
  });

  // 2. Material Ingestion
  it('2. should upload lecture notes for DBMS Normalization', async () => {
    const res = await request(app)
      .post('/api/v1/materials/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'DBMS Normalization Notes')
      .attach(
        'file',
        Buffer.from('# Database Normalization\nNormalization reduces duplicate data and anomalies. 1NF, 2NF, and 3NF are core forms.'),
        'dbms_normalization.txt'
      );

    expect(res.status).toBe(201);
    expect(res.body.data.material.status).toBe('READY');
    materialId = res.body.data.material.id;
  });

  // 3. AI Tutor & Agent Q&A with Citation
  it('3. should ask AI Tutor and receive grounded response with citation', async () => {
    const res = await request(app)
      .post('/api/v1/conversations/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'What is normalization in DBMS?',
        mode: 'simple',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assistantMessage.content).toBeDefined();
    expect(res.body.data.toolActions.length).toBeGreaterThan(0);
  });

  // 4. Quiz Generation & Attempt Evaluation
  it('4. should generate and complete practice quiz', async () => {
    const genRes = await request(app)
      .post('/api/v1/quizzes/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Database Normalization',
        difficulty: 'MEDIUM',
        numQuestions: 3,
      });

    expect(genRes.status).toBe(201);
    quizId = genRes.body.data.quiz.id;
    const questions = genRes.body.data.quiz.questions;

    const subRes = await request(app)
      .post(`/api/v1/quizzes/${quizId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        timeSpentSeconds: 90,
        answers: questions.map((q: any) => ({
          questionId: q.id,
          userAnswer: q.options[0],
        })),
      });

    expect(subRes.status).toBe(200);
    expect(subRes.body.data.attempt.score).toBeDefined();
  });

  // 5. Flashcards & SM-2 Review
  it('5. should generate flashcards and review with SM-2', async () => {
    const genRes = await request(app)
      .post('/api/v1/flashcards/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Database Normalization',
        numCards: 3,
      });

    expect(genRes.status).toBe(201);
    cardId = genRes.body.data.flashcards[0].id;

    const revRes = await request(app)
      .post(`/api/v1/flashcards/${cardId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        quality: 4,
        isKnown: true,
      });

    expect(revRes.status).toBe(200);
    expect(revRes.body.data.flashcard.repetition).toBe(1);
  });

  // 6. Study Plan
  it('6. should generate adaptive study plan', async () => {
    const res = await request(app)
      .post('/api/v1/study-plans/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        targetSubject: 'Database Management Systems',
        availableHoursPerDay: 2.0,
        currentLevel: 'Beginner',
        weakTopics: ['3NF Transitive Dependencies'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.plan.items.length).toBeGreaterThanOrEqual(4);
    planId = res.body.data.plan.id;
  });

  // 7. Analytics & AI Insights
  it('7. should query updated learning analytics and AI insights', async () => {
    const res = await request(app)
      .get('/api/v1/progress/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overallMastery).toBeGreaterThan(0);
    expect(res.body.data.insights.length).toBeGreaterThan(0);
  });
});
