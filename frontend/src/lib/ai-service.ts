import { getMockResponse } from './mock-responses';
import { getAzureHealthResponse } from './azure-health-agent';

export type AIProvider = 'mock' | 'azure';

interface AIServiceConfig {
  provider: AIProvider;
  endpoint?: string;
  apiKey?: string;
}

export class AIService {
  private config: AIServiceConfig;
  private conversationHistory: string[] = [];

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async getResponse(message: string): Promise<string> {
    try {
      let response: string;

      switch (this.config.provider) {
        case 'azure':
          response = await getAzureHealthResponse(message);
          break;
        
        case 'mock':
        default:
          response = getMockResponse(message);
          break;
      }

      // Update conversation history
      this.conversationHistory.push(`User: ${message}`);
      this.conversationHistory.push(`Doctor: ${response}`);

      // Keep only last 10 messages for context
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return response;
    } catch (error) {
      console.error('AI Service Error:', error);
      return "I apologize, but I'm having trouble connecting to our medical system right now. Please try again shortly.";
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  setProvider(provider: AIProvider) {
    this.config.provider = provider;
  }
} 