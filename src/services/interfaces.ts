// Types and interfaces for vector database operations following SOLID principles

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  pricing?: {
    prompt: number;
    completion: number;
  };
  provider: string;
  tags?: string[];
}

export interface Collection {
  name: string;
  vectors_count: number;
  points_count: number;
  status: string;
  config: {
    params: {
      vectors: {
        size: number;
        distance: string;
      };
    };
  };
}

export interface Point {
  id: number | string;
  vector?: number[];
  payload?: Record<string, any>;
}

export interface ChunkedDocument {
  chunks: string[];
  metadata?: {
    totalChunks: number;
    originalLength: number;
  };
}

export interface UploadResult {
  success: boolean;
  chunksProcessed: number;
  vectorsCreated: number;
  collectionName: string;
}

export interface ProgressCallback {
  (current: number, total: number, stage: string): void;
}

export interface SearchResult {
  id: number | string;
  score: number;
  payload?: Record<string, any>;
  vector?: number[];
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
}

// Vector Database Interface - defines operations for vector databases
export interface VectorDatabase {
  fetchCollections(): Promise<Collection[]>;
  browseCollection(collectionName: string): Promise<Point[]>;
  exportCollection(collectionName: string): Promise<void>;
  createCollection(collectionName: string, vectorSize?: number): Promise<void>;
  deleteCollection(collectionName: string): Promise<void>;
  uploadPoints(collectionName: string, points: Point[]): Promise<void>;
  search(collectionName: string, vector: number[], options?: SearchOptions): Promise<SearchResult[]>;
}

// Embedding Service Interface - defines operations for text embedding
export interface EmbeddingService {
  embedTexts(texts: string[]): Promise<number[][]>;
}

// Document Processor Interface - defines operations for document processing
export interface DocumentProcessor {
  processFile(
    file: File,
    chunkSize: number,
    chunkOverlap: number,
    onProgress?: ProgressCallback
  ): Promise<ChunkedDocument>;
}

// Configuration interfaces
export interface VectorDatabaseConfig {
  url: string;
}

export interface EmbeddingServiceConfig {
  url: string;
}

export interface DocumentProcessorConfig {
  // Add configuration options as needed
}

// Logger Interface - defines logging operations
export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

// Logger Configuration
export interface LoggerConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
}

// AI Service Interface - defines operations for AI/LLM providers
export interface AIService {
  generateResponse(prompt: string, options?: AIOptions): Promise<AIResponse>;
  generateStreamingResponse(prompt: string, options?: AIOptions, onChunk?: (chunk: string) => void): Promise<AIResponse>;
  validateToken(): Promise<boolean>;
  getAvailableModels(): Promise<ModelInfo[]>;
}

// AI Service configuration and types
export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}