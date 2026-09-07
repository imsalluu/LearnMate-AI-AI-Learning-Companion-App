import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Material Upload & Management APIs', () => {
  const app = createApp();
  let token = '';

  it('should authenticate user and obtain bearer token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `mat_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Material Tester',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should upload and process a text document', async () => {
    const res = await request(app)
      .post('/api/v1/materials/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'DBMS Normalization Notes')
      .attach('file', Buffer.from('# Database Normalization\nNormalization eliminates redundancy.'), 'normalization.txt');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.material.title).toBe('DBMS Normalization Notes');
    expect(res.body.data.material.status).toBe('READY');
  });

  it('should list uploaded materials for the user', async () => {
    const res = await request(app)
      .get('/api/v1/materials')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });
});
