import type {
  EmbeddingService,
  EmbeddingServiceConfig,
  Logger
} from './interfaces';
import { configProvider } from './ConfigurationProvider';

export class PolishEmbeddingService implements EmbeddingService {
  private readonly baseUrl: string;
  private readonly logger: Logger;

  constructor(config?: EmbeddingServiceConfig & { logger?: Logger }) {
    // Use config if provided, otherwise use ConfigurationProvider
    const embeddingUrl = config?.url || configProvider.getEmbeddingUrl();
    this.baseUrl = embeddingUrl;
    this.logger = config?.logger || { info: console.log, warn: console.warn, error: console.error, debug: console.debug };
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    this.logger.info(`Sending ${texts.length} texts to embedding API`);

    if (texts.length === 0) {
      return [];
    }

    const embeddingResponse = await fetch(`${this.baseUrl}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding failed: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embeddings = embeddingData.embeddings;

    // Validate embeddings
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error(
        `Invalid embeddings response: expected ${texts.length} embeddings, got ${embeddings?.length || 'undefined'}`
      );
    }

    // Validate each embedding
    for (let i = 0; i < embeddings.length; i++) {
      const vector = embeddings[i];
      if (!Array.isArray(vector) || vector.length !== 1024) {
        throw new Error(
          `Invalid vector at index ${i}: expected 1024 dimensions, got ${vector?.length || 'undefined'}`
        );
      }

      // Check for invalid values
      const hasInvalidValues = vector.some(val => !isFinite(val));
      if (hasInvalidValues) {
        throw new Error(`Vector at index ${i} contains invalid values (NaN/Infinity)`);
      }
    }

    this.logger.info(`Successfully generated ${embeddings.length} embeddings`);
    return embeddings;
  }
}