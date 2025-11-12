import type {
  DocumentProcessor,
  DocumentProcessorConfig,
  ChunkedDocument,
  ProgressCallback,
  Logger
} from './interfaces';
import { chunkingService } from './chunkingService';

export class TextDocumentProcessor implements DocumentProcessor {
  private readonly logger: Logger;

  constructor(config: DocumentProcessorConfig & { logger?: Logger } = {}) {
    this.logger = config.logger || { info: console.log, warn: console.warn, error: console.error, debug: console.debug };
  }

  async processFile(
    file: File,
    chunkSize: number,
    chunkOverlap: number,
    onProgress?: ProgressCallback
  ): Promise<ChunkedDocument> {
    this.logger.info(`Processing file: ${file.name} (${file.size} bytes)`);

    onProgress?.(0, 100, 'Reading file...');

    const text = await file.text();
    this.logger.debug(`File content length: ${text.length} characters`);

    onProgress?.(10, 100, 'Chunking text...');

    const chunkedDocument = await chunkingService.chunkText(text, chunkSize, chunkOverlap);
    const chunks = chunkedDocument.chunks;

    this.logger.info(`Created ${chunks.length} chunks`);
    chunks.forEach((chunk, index) => {
      this.logger.debug(
        `Chunk ${index + 1}: "${chunk.substring(0, 100).replace(/\n/g, '\\n')}..." (length: ${
          chunk.length
        }, trimmed length: ${chunk.trim().length})`
      );
    });

    onProgress?.(100, 100, 'Processing complete');

    return {
      chunks,
      metadata: {
        totalChunks: chunks.length,
        originalLength: text.length,
      },
    };
  }
}