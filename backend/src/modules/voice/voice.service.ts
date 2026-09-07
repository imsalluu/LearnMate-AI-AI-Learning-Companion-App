import { StorageService } from '../storage/storage.service';
import { LearningAgent } from '../agents/learning-agent';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { ExplanationMode } from '../../config/constants';

export class VoiceService {
  /**
   * Speech-to-Text: Transcribes audio into text
   */
  static async transcribeAudio(file: Express.Multer.File): Promise<string> {
    logger.info(`🎙️ Transcribing audio file (${file.originalname || 'voice.m4a'}, ${file.size} bytes)...`);

    if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
      try {
        const formData = new FormData();
        const blob = new Blob([file.buffer], { type: file.mimetype || 'audio/m4a' });
        formData.append('file', blob, file.originalname || 'audio.m4a');
        formData.append('model', 'whisper-1');

        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: formData,
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          return data.text;
        }
      } catch (err) {
        logger.warn('OpenAI Whisper STT failed, falling back to mock transcription:', err);
      }
    }

    // High quality mock transcription fallback
    return 'Explain normalization in DBMS and how it prevents data anomalies.';
  }

  /**
   * Text-to-Speech: Converts text into audio
   */
  static async synthesizeSpeech(
    text: string,
    voiceId = 'alloy',
    _speed = 1.0
  ): Promise<{ audioUrl: string; durationEstimateSeconds: number }> {
    logger.info(`🔊 Synthesizing speech for: "${text.slice(0, 50)}..." (voice: ${voiceId})`);

    const wordCount = text.split(/\s+/).length;
    const durationEstimateSeconds = Math.max(2, Math.round(wordCount / 2.5)); // ~150 words per minute

    if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text.slice(0, 4000),
            voice: voiceId,
          }),
        });

        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const fakeFile: any = {
            originalname: `tts_${Date.now()}.mp3`,
            mimetype: 'audio/mpeg',
            buffer,
            size: buffer.length,
          };
          const saved = await StorageService.saveFile(fakeFile);
          return { audioUrl: saved.fileUrl, durationEstimateSeconds };
        }
      } catch (err) {
        logger.warn('OpenAI TTS failed, falling back:', err);
      }
    }

    // Default audio artifact url
    return {
      audioUrl: '/uploads/sample_voice_tutor.mp3',
      durationEstimateSeconds,
    };
  }

  /**
   * Complete end-to-end voice conversation cycle:
   * Audio input -> STT -> Learning Agent -> TTS -> Audio output
   */
  static async processVoiceInteraction(
    userId: string,
    audioFile: Express.Multer.File,
    mode: ExplanationMode = 'simple',
    subjectId?: string
  ) {
    // 1. Speech-to-Text
    const transcript = await this.transcribeAudio(audioFile);

    // 2. Learning Agent Processing
    const agentResponse = await LearningAgent.run(transcript, {
      userId,
      mode,
      subjectId,
    });

    // 3. Text-to-Speech synthesis
    const speechResult = await this.synthesizeSpeech(agentResponse.answer);

    return {
      transcript,
      response: agentResponse.answer,
      mode,
      audioUrl: speechResult.audioUrl,
      durationEstimateSeconds: speechResult.durationEstimateSeconds,
      citations: agentResponse.citations,
      suggestedFollowUps: agentResponse.suggestedFollowUps,
    };
  }
}
