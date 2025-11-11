import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface ChunkedDocument {
  chunks: string[];
  metadata: {
    totalChunks: number;
    originalLength: number;
    chunkSize: number;
    chunkOverlap: number;
  };
}

export class ChunkingService {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
    });
  }

  async chunkText(text: string, chunkSize?: number, chunkOverlap?: number): Promise<ChunkedDocument> {
    console.log('Starting text chunking...');
    console.log(`Original text length: ${text.length} characters`);

    // Create a new splitter with the provided parameters or use defaults
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: chunkSize ?? this.textSplitter.chunkSize,
      chunkOverlap: chunkOverlap ?? this.textSplitter.chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
    });

    const chunks = await splitter.splitText(text);

    console.log(`Created ${chunks.length} chunks`);

    return {
      chunks,
      metadata: {
        totalChunks: chunks.length,
        originalLength: text.length,
        chunkSize: splitter.chunkSize,
        chunkOverlap: splitter.chunkOverlap,
      },
    };
  }

  async chunkFile(file: File): Promise<ChunkedDocument> {
    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    const text = await this.readFileAsText(file);
    return this.chunkText(text);
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsText(file);
    });
  }
}

export const chunkingService = new ChunkingService();