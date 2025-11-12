import type {
  VectorDatabase,
  EmbeddingService,
  DocumentProcessor,
  AIService,
  UploadResult,
  ProgressCallback,
  VectorDatabaseConfig,
  EmbeddingServiceConfig,
  DocumentProcessorConfig,
  AIServiceConfig,
  Logger,
  LoggerConfig,
  SearchResult,
  SearchOptions,
  Point,
  DocumentData,
  AIOptions,
  AIResponse
} from './interfaces';
import { QdrantDatabase } from './qdrantDatabase';
import { PolishEmbeddingService } from './polishEmbeddingService';
import { TextDocumentProcessor } from './textDocumentProcessor';
import { OpenRouterService } from './openRouterService';
import { ConsoleLogger } from './consoleLogger';
import { configProvider } from './ConfigurationProvider';

export class QdrantApi {
  private vectorDatabase: VectorDatabase;
  private embeddingService: EmbeddingService;
  private documentProcessor: DocumentProcessor;
  private aiService: AIService;
  private logger: Logger;

  constructor(
    vectorDb?: VectorDatabase,
    embeddingSvc?: EmbeddingService,
    docProcessor?: DocumentProcessor,
    aiSvc?: AIService,
    logger?: Logger
  ) {
    // Use provided dependencies or create defaults
    this.logger = logger || new ConsoleLogger({ prefix: 'QdrantApi' });
    this.vectorDatabase = vectorDb || new QdrantDatabase({ url: 'http://localhost:6333', logger: this.logger });
    this.embeddingService = embeddingSvc || new PolishEmbeddingService({ url: 'http://localhost:8082', logger: this.logger });
    this.documentProcessor = docProcessor || new TextDocumentProcessor({ logger: this.logger });
    this.aiService = aiSvc || new OpenRouterService({ 
      apiKey: configProvider.getOpenRouterToken(), 
      logger: this.logger 
    });
  }

  // Static factory method for easy configuration
  static create(
    vectorDbConfig?: VectorDatabaseConfig,
    embeddingConfig?: EmbeddingServiceConfig,
    docProcessorConfig?: DocumentProcessorConfig,
    aiConfig?: AIServiceConfig,
    loggerConfig?: LoggerConfig
  ): QdrantApi {
    const logger = loggerConfig ? new ConsoleLogger(loggerConfig) : new ConsoleLogger({ prefix: 'QdrantApi' });
    const vectorDb = vectorDbConfig ? new QdrantDatabase({ ...vectorDbConfig, logger }) : undefined;
    const embeddingSvc = embeddingConfig ? new PolishEmbeddingService({ ...embeddingConfig, logger }) : undefined;
    const docProcessor = docProcessorConfig ? new TextDocumentProcessor({ ...docProcessorConfig, logger }) : undefined;
    const aiSvc = aiConfig ? new OpenRouterService({ ...aiConfig, logger }) : undefined;

    return new QdrantApi(vectorDb, embeddingSvc, docProcessor, aiSvc, logger);
  }

  // Delegate methods to the vector database
  async fetchCollections() {
    return this.vectorDatabase.fetchCollections();
  }

  async browseCollection(collectionName: string) {
    return this.vectorDatabase.browseCollection(collectionName);
  }

  async exportCollection(collectionName: string) {
    return this.vectorDatabase.exportCollection(collectionName);
  }

  async createCollection(collectionName: string, vectorSize: number = 1024) {
    return this.vectorDatabase.createCollection(collectionName, vectorSize);
  }

  async deleteCollection(collectionName: string) {
    return this.vectorDatabase.deleteCollection(collectionName);
  }

  async search(collectionName: string, query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.logger.info(`Searching collection: ${collectionName} with query: "${query}"`);

    // First, embed the query text
    const queryEmbeddings = await this.embeddingService.embedTexts([query]);
    const queryVector = queryEmbeddings[0];

    if (!queryVector) {
      throw new Error('Failed to generate embedding for search query');
    }

    // Then search the vector database
    return this.vectorDatabase.search(collectionName, queryVector, options);
  }

  // Search in selected collection (for AI tools)
  async searchSelectedCollection(query: string, limit: number = 5): Promise<SearchResult[]> {
    const selectedCollection = configProvider.getSelectedCollection();
    if (!selectedCollection) {
      throw new Error('No collection selected. Please select a collection first.');
    }

    this.logger.info(`AI searching selected collection: ${selectedCollection} with query: "${query}"`);
    return this.search(selectedCollection, query, { limit });
  }

  // Get full document by ID from selected collection
  async getDocumentById(pointId: string | number): Promise<Point | null> {
    const selectedCollection = configProvider.getSelectedCollection();
    if (!selectedCollection) {
      throw new Error('No collection selected. Please select a collection first.');
    }

    this.logger.info(`Getting document by ID: ${pointId} from collection: ${selectedCollection}`);
    return this.vectorDatabase.getPointById(selectedCollection, pointId);
  }

  // Get full document by filename from selected collection
  async getDocumentByFileName(fileName: string): Promise<DocumentData> {
    this.logger.info(`Getting document by filename: ${fileName}`);

    const collectionName = configProvider.getSelectedCollection();
    if (!collectionName) {
      throw new Error('No collection selected');
    }

    const points = await this.vectorDatabase.getPointsByFileName(collectionName, fileName);

    if (points.length === 0) {
      throw new Error(`Document with filename "${fileName}" not found`);
    }

    // Sort points by chunkIndex
    points.sort((a: Point, b: Point) => {
      const indexA = a.payload?.chunkIndex as number || 0;
      const indexB = b.payload?.chunkIndex as number || 0;
      return indexA - indexB;
    });

    // Combine all chunks into full text
    const fullText = points.map((point: Point) => point.payload?.text as string || '').join('');

    const documentData: DocumentData = {
      fileName: fileName,
      fullText: fullText,
      chunkCount: points.length,
      chunks: points.map((point: Point) => ({
        id: point.id,
        text: point.payload?.text as string || '',
        chunkIndex: point.payload?.chunkIndex as number || 0,
        metadata: point.payload?.metadata || {}
      }))
    };

    this.logger.info(`Retrieved document with ${points.length} chunks`);
    return documentData;
  }

  // Main file processing method that orchestrates all services
  async uploadAndProcessFile(
    file: File,
    collectionName: string,
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
    onProgress?: ProgressCallback
  ): Promise<UploadResult> {
    this.logger.info(`Starting file upload and processing for collection: ${collectionName}`);

    onProgress?.(0, 100, 'Reading file...');

    // Process the document into chunks
    const chunkedDocument = await this.documentProcessor.processFile(
      file,
      chunkSize,
      chunkOverlap,
      (current, total, stage) => {
        // Adjust progress for document processing phase (0-10%)
        const adjustedProgress = Math.floor((current / total) * 10);
        onProgress?.(adjustedProgress, 100, stage);
      }
    );

    const chunks = chunkedDocument.chunks;
    this.logger.info(`Created ${chunks.length} chunks`);

    onProgress?.(20, 100, 'Creating collection...');

    // Ensure collection exists
    this.logger.info(`Ensuring collection exists: ${collectionName}`);
    await this.vectorDatabase.createCollection(collectionName, 1024);
    this.logger.info(`Collection ${collectionName} ready for upload`);

    // Process chunks and create vectors
    this.logger.info('Starting vectorization of all chunks...');
    const points: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progressPercent = 20 + Math.floor((i / chunks.length) * 70); // 20-90% for vectorization
      onProgress?.(progressPercent, 100, `Vectorizing chunk ${i + 1}/${chunks.length}`);

      try {
        // Skip empty chunks or chunks that are too short
        if (!chunk || !chunk.trim() || chunk.trim().length < 10) {
          this.logger.debug(
            `Skipping chunk ${i + 1} - too short or empty (length: ${
              chunk?.length || 0
            }, trimmed: "${chunk?.trim()}")`
          );
          continue;
        }

        // Clean the chunk - remove excessive whitespace and normalize
        const cleanChunk = chunk
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[\r\n]+/g, ' ');

        // Get embedding for the chunk
        this.logger.debug(
          `Sending chunk ${i + 1}/${chunks.length} to API: "${cleanChunk.substring(
            0,
            100
          )}..." (original length: ${chunk.length}, clean length: ${cleanChunk.length})`
        );

        const embeddings = await this.embeddingService.embedTexts([cleanChunk]);
        const vector = embeddings[0];

        // Create point data
        const pointData = {
          id: i + 1, // Use simple numeric ID starting from 1
          vector: vector,
          payload: {
            text: cleanChunk,
            chunkIndex: i,
            totalChunks: chunks.length,
            fileName: file.name,
            fileSize: file.size,
            timestamp: new Date().toISOString(),
            collectionName: collectionName,
          },
        };

        points.push(pointData);
      } catch (error) {
        this.logger.error(`Failed to vectorize chunk ${i}:`, error);
        // Continue with other chunks
      }
    }

    onProgress?.(90, 100, 'Uploading to database...');

    this.logger.info(
      `Vectorization complete. Created ${points.length} points. Now uploading to database...`
    );

    // Log sample point structure for debugging
    if (points.length > 0) {
      this.logger.debug('Sample point structure:', {
        id: points[0].id,
        vectorLength: points[0].vector.length,
        payloadKeys: Object.keys(points[0].payload),
        firstFewVectorValues: points[0].vector.slice(0, 5),
      });
    }

    // Upload all points to the vector database
    if (points.length > 0) {
      await this.vectorDatabase.uploadPoints(collectionName, points);
    }

    onProgress?.(100, 100, 'Complete!');

    return {
      success: true,
      chunksProcessed: chunks.length,
      vectorsCreated: points.length,
      collectionName,
    };
  }

  // AI Service methods
  async generateResponse(prompt: string, options?: AIOptions): Promise<AIResponse> {
    return this.aiService.generateResponse(prompt, options);
  }

  async generateStreamingResponse(
    prompt: string,
    options?: AIOptions,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    return this.aiService.generateStreamingResponse(prompt, options, onChunk);
  }

  async validateToken(): Promise<boolean> {
    return this.aiService.validateToken();
  }

  async getAvailableModels() {
    return this.aiService.getAvailableModels();
  }
}

// Export a default instance for backward compatibility
export const qdrantApi = new QdrantApi();
