import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Voice AI Tutor APIs (STT & TTS)', () => {
  const app = createApp();
  let token = '';

  it('should authenticate user and obtain token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `voice_user_${Date.now()}@learnmate.ai`,
        password: 'Password123!',
        name: 'Voice Learner',
      });

    expect(res.status).toBe(201);
    token = res.body.data.tokens.accessToken;
  });

  it('should transcribe uploaded audio recording', async () => {
    const fakeAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
    const res = await request(app)
      .post('/api/v1/voice/transcribe')
      .set('Authorization', `Bearer ${token}`)
      .attach('audio', fakeAudioBuffer, 'voice_query.m4a');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcript).toBeDefined();
    expect(res.body.data.transcript.length).toBeGreaterThan(0);
  });

  it('should synthesize speech audio from text', async () => {
    const res = await request(app)
      .post('/api/v1/voice/synthesize')
      .set('Authorization', `Bearer ${token}`)
      .send({
        text: 'Normalization organizes tables to reduce redundancy and improve data integrity.',
        voiceId: 'alloy',
        speed: 1.0,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.audioUrl).toBeDefined();
    expect(res.body.data.durationEstimateSeconds).toBeGreaterThan(0);
  });

  it('should process full voice-to-voice interaction cycle', async () => {
    const fakeAudioBuffer = Buffer.from('RIFF....WAVEfmt ....data....');
    const res = await request(app)
      .post('/api/v1/voice/chat')
      .set('Authorization', `Bearer ${token}`)
      .field('mode', 'simple')
      .attach('audio', fakeAudioBuffer, 'voice_chat.m4a');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transcript).toBeDefined();
    expect(res.body.data.response).toBeDefined();
    expect(res.body.data.audioUrl).toBeDefined();
  });
});
