import type {
  AIService,
  AIServiceConfig,
  AIResponse,
  AIOptions,
  Logger,
  ModelInfo
} from './interfaces';

export class OpenRouterService implements AIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly logger: Logger;

  constructor(config: AIServiceConfig & { logger?: Logger }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
    this.defaultModel = config.defaultModel || 'anthropic/claude-3-haiku';
    this.logger = config.logger || { info: console.log, warn: console.warn, error: console.error, debug: console.debug };
  }

  async generateResponse(prompt: string, options?: AIOptions): Promise<AIResponse> {
    this.logger.info(`Generating response with model: ${options?.model || this.defaultModel}`);

    const requestBody = {
      model: options?.model || this.defaultModel,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Preact Qdrant GUI',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenRouter API error: ${response.status} ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined;

    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model || options?.model || this.defaultModel,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    } as AIResponse;
  }

  async generateStreamingResponse(
    prompt: string,
    options?: AIOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    this.logger.info(`Generating streaming response with model: ${options?.model || this.defaultModel}`);

    const requestBody = {
      model: options?.model || this.defaultModel,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Preact Qdrant GUI',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenRouter API error: ${response.status} ${errorText}`);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let model = options?.model || this.defaultModel;
    let usage: AIResponse['usage'];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk?.(content);
              }

              if (parsed.model) {
                model = parsed.model;
              }

              if (parsed.usage) {
                usage = {
                  promptTokens: parsed.usage.prompt_tokens,
                  completionTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                };
              }
            } catch (e) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent,
      model,
      usage: usage,
    } as AIResponse;
  }

  async validateToken(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();

      return data.data.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description || 'No description available',
        contextLength: model.context_length || 4096,
        pricing: model.pricing ? {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion,
        } : undefined,
        provider: 'openrouter',
        tags: model.tags || [],
      }));
    } catch (error) {
      this.logger.error('Failed to fetch models:', error);
      // Return some default models if API fails
      return [
        {
          id: 'anthropic/claude-3-haiku',
          name: 'Claude 3 Haiku',
          description: 'Fast and efficient model by Anthropic',
          contextLength: 200000,
          pricing: { prompt: 0.25, completion: 1.25 },
          provider: 'openrouter',
          tags: ['fast', 'efficient'],
        },
        {
          id: 'anthropic/claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Balanced model by Anthropic with good performance',
          contextLength: 200000,
          pricing: { prompt: 3, completion: 15 },
          provider: 'openrouter',
          tags: ['balanced', 'powerful'],
        },
        {
          id: 'openai/gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Cost-effective GPT-4 level model by OpenAI',
          contextLength: 128000,
          pricing: { prompt: 0.15, completion: 0.6 },
          provider: 'openrouter',
          tags: ['cost-effective', 'fast'],
        },
      ];
    }
  }
}