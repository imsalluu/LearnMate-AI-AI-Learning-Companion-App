import { env } from '../../config/env';
import { IAIProvider } from './ai.interface';
import { MockAIProvider } from './providers/mock.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { logger } from '../../utils/logger';

export class AIService {
  private static provider: IAIProvider;

  static getProvider(): IAIProvider {
    if (!this.provider) {
      switch (env.AI_PROVIDER) {
        case 'openai':
          this.provider = new OpenAIProvider();
          break;
        case 'gemini':
          this.provider = new GeminiProvider();
          break;
        case 'mock':
        default:
          this.provider = new MockAIProvider();
          break;
      }
      logger.info(`🤖 Initialized AI Provider: ${this.provider.name}`);
    }
    return this.provider;
  }

  /**
   * Sanitizes prompts to prevent prompt injection and unwanted instruction leaks
   */
  static sanitizePrompt(prompt: string): string {
    return prompt
      .replace(/ignore previous instructions/gi, '[filtered instruction]')
      .replace(/system prompt:/gi, '[filtered]')
      .trim();
  }
}
