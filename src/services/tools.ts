import type { Tool } from './interfaces';
import { qdrantApi } from './qdrantApi';

// Tool definitions
export const factorialTool: Tool = {
  type: 'function',
  function: {
    name: 'calculate_factorial',
    description: 'Calculate the factorial of a number (n!). Only works for integers from 0 to 10.',
    parameters: {
      type: 'object',
      properties: {
        n: {
          type: 'integer',
          description: 'The number to calculate factorial for (0-10)',
          minimum: 0,
          maximum: 10
        }
      },
      required: ['n']
    }
  }
};

export const searchVectorDatabaseTool: Tool = {
  type: 'function',
  function: {
    name: 'search_vector_database',
    description: 'Search the vector database using semantic search. Provide a natural language query to find relevant documents.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query in natural language'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return (default: 5)',
          minimum: 1,
          maximum: 20,
          default: 5
        }
      },
      required: ['query']
    }
  }
};

export const getFullDocumentTool: Tool = {
  type: 'function',
  function: {
    name: 'get_full_document',
    description: 'Retrieve the full content of a document by its filename. Returns all chunks sorted by chunk index as a complete document.',
    parameters: {
      type: 'object',
      properties: {
        file_name: {
          type: 'string',
          description: 'The filename of the document to retrieve (e.g., "transcript_OmIK2RgXt_U_clean.txt")'
        }
      },
      required: ['file_name']
    }
  }
};

// Tool implementations
export function calculateFactorial(n: number): number {
  if (n < 0 || n > 10) {
    throw new Error('Factorial calculation only supported for numbers 0-10');
  }

  if (n === 0 || n === 1) {
    return 1;
  }

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

// Execute tool calls
export async function executeTool(toolCall: any): Promise<any> {
  const { name, arguments: args } = toolCall.function;

  switch (name) {
    case 'calculate_factorial':
      const { n } = JSON.parse(args);
      return calculateFactorial(n);

    case 'search_vector_database':
      const { query, limit = 5 } = JSON.parse(args);
      return await executeSearchVectorDatabase(query, limit);

    case 'get_full_document':
      const { file_name } = JSON.parse(args);
      return executeGetFullDocument(file_name);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Tool implementations
export async function executeSearchVectorDatabase(query: string, limit: number = 5) {
  try {
    const results = await qdrantApi.searchSelectedCollection(query, limit);
    return results.map(result => ({
      id: result.id,
      score: result.score,
      text: result.payload?.text || '',
      metadata: {
        chunkIndex: result.payload?.chunkIndex,
        totalChunks: result.payload?.totalChunks,
        fileName: result.payload?.fileName,
        timestamp: result.payload?.timestamp,
        collectionName: result.payload?.collectionName
      }
    }));
  } catch (error) {
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function executeGetFullDocument(fileName: string) {
  try {
    const documentData = await qdrantApi.getDocumentByFileName(fileName);

    return {
      fileName: documentData.fileName,
      fullText: documentData.fullText,
      chunkCount: documentData.chunkCount,
      chunks: documentData.chunks.map(chunk => ({
        id: chunk.id,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        metadata: chunk.metadata
      }))
    };
  } catch (error) {
    throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Available tools list
export const availableTools: Tool[] = [factorialTool, searchVectorDatabaseTool, getFullDocumentTool];

// Tool descriptions for AI
export function getToolDescriptions(): string {
  return availableTools.map(tool =>
    `- ${tool.function.name}: ${tool.function.description}`
  ).join('\n');
}