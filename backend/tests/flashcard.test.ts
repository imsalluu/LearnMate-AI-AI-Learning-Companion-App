import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI Flashcards & Spaced Repetition (SM-2) APIs', () => {
  const app = createApp();
  let token = '';
  let cardId = '';

  it('should authenticate user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `flashcard_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Flashcard Pro',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should generate AI flashcards from topic', async () => {
    const res = await request(app)
      .post('/api/v1/flashcards/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'ACID Transactions',
        numCards: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flashcards.length).toBeGreaterThanOrEqual(4);

    cardId = res.body.data.flashcards[0].id;
  });

  it('should create a custom manual flashcard', async () => {
    const res = await request(app)
      .post('/api/v1/flashcards/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({
        front: 'What does ACID stand for?',
        back: 'Atomicity, Consistency, Isolation, Durability',
        topic: 'DBMS Transactions',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should record review quality using SM-2 algorithm', async () => {
    const res = await request(app)
      .post(`/api/v1/flashcards/${cardId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        quality: 4, // Good recall
        responseTimeMs: 2500,
        isKnown: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flashcard.repetition).toBe(1);
    expect(res.body.data.flashcard.interval).toBeGreaterThanOrEqual(1);
  });

  it('should toggle favorite status', async () => {
    const res = await request(app)
      .post(`/api/v1/flashcards/${cardId}/favorite`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.flashcard.isFavorite).toBe(true);
  });
});
