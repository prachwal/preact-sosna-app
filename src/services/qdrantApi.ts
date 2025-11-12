import type { Collection, Point } from '../types/types';
import { chunkingService } from './chunkingService';

export const fetchCollections = async (): Promise<Collection[]> => {
  console.log('Fetching collections from Qdrant...');
  const response = await fetch('http://localhost:6333/collections');
  console.log('Collections response status:', response.status);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  console.log('Collections data:', data);
  const collections = data.result?.collections || [];
  console.log('Collections loaded:', collections.length);
  return collections;
};

export const browseCollection = async (collectionName: string): Promise<Point[]> => {
  console.log(`Starting browse for collection: ${collectionName}`);
  const url = `http://localhost:6333/collections/${collectionName}/points/scroll`;
  console.log('Browse URL:', url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 1000, // Show up to 1000 points for browsing
      with_payload: true,
      with_vectors: true,
    }),
  });
  console.log('Browse response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Browse error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  const data = await response.json();
  console.log('Browse data received:', data);
  return data.result?.points || [];
};

export const exportCollection = async (collectionName: string): Promise<void> => {
  console.log(`Starting export for collection: ${collectionName}`);
  const url = `http://localhost:6333/collections/${collectionName}/points/scroll`;
  console.log('Export URL:', url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: 100000, // Large limit to get all points
      with_payload: true,
      with_vectors: true,
    }),
  });
  console.log('Export response status:', response.status);
  console.log('Export response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Export error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  const data = await response.json();
  console.log('Export data received, size:', JSON.stringify(data).length);
  console.log('Export data preview:', JSON.stringify(data).slice(0, 500) + '...');

  // Create a blob with the JSON data
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(blob);
  console.log('Blob created, URL:', blobUrl);

  // Create a temporary link and trigger download
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${collectionName}_export.json`;
  document.body.appendChild(link);
  console.log('Download link created, triggering click...');
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(blobUrl);
  console.log('Export completed successfully for:', collectionName);
};

export const createCollection = async (
  collectionName: string,
  vectorSize: number = 1024
): Promise<void> => {
  console.log(`Creating collection: ${collectionName}`);
  const url = `http://localhost:6333/collections/${collectionName}`;
  console.log('Create collection URL:', url);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    }),
  });
  console.log('Create collection response status:', response.status);

  if (!response.ok) {
    // 409 Conflict means collection already exists, which is fine
    if (response.status === 409) {
      console.log(`Collection ${collectionName} already exists, continuing...`);
      return;
    }

    const errorText = await response.text();
    console.error('Create collection error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  console.log('Collection created successfully:', collectionName);
};

export const deleteCollection = async (collectionName: string): Promise<void> => {
  console.log(`Deleting collection: ${collectionName}`);
  const url = `http://localhost:6333/collections/${collectionName}`;
  console.log('Delete collection URL:', url);
  const response = await fetch(url, {
    method: 'DELETE',
  });
  console.log('Delete collection response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete collection error response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  console.log('Collection deleted successfully:', collectionName);
};

export const uploadAndProcessFile = async (
  file: File,
  collectionName: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<{
  success: boolean;
  chunksProcessed: number;
  vectorsCreated: number;
  collectionName: string;
}> => {
  console.log(`Starting file upload and processing for collection: ${collectionName}`);

  onProgress?.(0, 100, 'Reading file...');

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('collectionName', collectionName);
  formData.append('chunkSize', chunkSize.toString());
  formData.append('chunkOverlap', chunkOverlap.toString());

  // For now, we'll implement this as a client-side processing
  // In a real application, you'd want to do this server-side
  const text = await file.text();
  console.log(`File content length: ${text.length} characters`);

  onProgress?.(10, 100, 'Chunking text...');

  // Chunk the text using the proper ChunkingService with specified parameters
  const chunkedDocument = await chunkingService.chunkText(text, chunkSize, chunkOverlap);
  const chunks = chunkedDocument.chunks;
  console.log(`Created ${chunks.length} chunks`);
  chunks.forEach((chunk, index) => {
    console.log(
      `Chunk ${index + 1}: "${chunk.substring(0, 100).replace(/\n/g, '\\n')}..." (length: ${
        chunk.length
      }, trimmed length: ${chunk.trim().length})`
    );
  });

  onProgress?.(20, 100, 'Creating collection...');

  // Create collection (handles existing collections gracefully)
  console.log(`Ensuring collection exists: ${collectionName}`);
  await createCollection(collectionName, 1024);
  console.log(`Collection ${collectionName} ready for upload`);

  // Process chunks and create vectors
  console.log('Starting vectorization of all chunks...');
  const points: any[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progressPercent = 20 + Math.floor((i / chunks.length) * 70); // 20-90% for vectorization
    onProgress?.(progressPercent, 100, `Vectorizing chunk ${i + 1}/${chunks.length}`);

    try {
      // Skip empty chunks or chunks that are too short
      if (!chunk || !chunk.trim() || chunk.trim().length < 10) {
        console.log(
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
      console.log(
        `Sending chunk ${i + 1}/${chunks.length} to API: "${cleanChunk.substring(
          0,
          100
        )}..." (original length: ${chunk.length}, clean length: ${cleanChunk.length})`
      );
      const embeddingResponse = await fetch('http://localhost:8082/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: [cleanChunk] }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding failed: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const vector = embeddingData.embeddings[0];

      // Validate vector
      if (!Array.isArray(vector) || vector.length !== 1024) {
        throw new Error(
          `Invalid vector: expected 1024 dimensions, got ${vector?.length || 'undefined'}`
        );
      }

      // Check for invalid values
      const hasInvalidValues = vector.some(val => !isFinite(val));
      if (hasInvalidValues) {
        throw new Error(`Vector contains invalid values (NaN/Infinity)`);
      }

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
      console.error(`Failed to vectorize chunk ${i}:`, error);
      // Continue with other chunks
    }
  }

  onProgress?.(90, 100, 'Uploading to Qdrant...');

  console.log(
    `Vectorization complete. Created ${points.length} points. Now uploading to Qdrant...`
  );

  // Log sample point structure for debugging
  if (points.length > 0) {
    console.log('Sample point structure:', {
      id: points[0].id,
      vectorLength: points[0].vector.length,
      payloadKeys: Object.keys(points[0].payload),
      firstFewVectorValues: points[0].vector.slice(0, 5),
    });
  }

  // Upload all points to Qdrant in batch
  if (points.length > 0) {
    try {
      const uploadData = {
        points: points,
      };
      console.log(
        'Upload data preview:',
        JSON.stringify({
          pointsCount: points.length,
          samplePoint: {
            id: points[0].id,
            vectorLength: points[0].vector.length,
            payload: points[0].payload,
          },
        })
      );

      const uploadResponse = await fetch(
        `http://localhost:6333/collections/${collectionName}/points`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        }
      );

      console.log('Upload response status:', uploadResponse.status);
      console.log('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Qdrant upload error response:', errorText);
        console.error('Upload data that failed:', JSON.stringify(uploadData).slice(0, 500) + '...');
        throw new Error(`Batch upload failed: ${uploadResponse.status}, body: ${errorText}`);
      }

      console.log(`Successfully uploaded ${points.length} points to Qdrant`);
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw error;
    }
  }

  onProgress?.(100, 100, 'Complete!');

  return {
    success: true,
    chunksProcessed: chunks.length,
    vectorsCreated: points.length,
    collectionName,
  };
};
