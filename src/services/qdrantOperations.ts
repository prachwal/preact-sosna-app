import type { Logger, Collection, Point } from './interfaces';

export class QdrantOperations {
  constructor(
    private baseUrl: string,
    private logger: Logger
  ) {}

  async createCollection(collectionName: string, vectorSize: number = 1024): Promise<void> {
    this.logger.info(`Creating collection: ${collectionName} with vector size: ${vectorSize}`);

    const createPayload = {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    };

    this.logger.debug('Create collection URL:', `${this.baseUrl}/collections/${collectionName}`);
    this.logger.debug('Create payload:', createPayload);

    const response = await fetch(`${this.baseUrl}/collections/${collectionName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    this.logger.debug('Create response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Qdrant create collection error:', errorText);
      throw new Error(`Failed to create collection: ${response.status}, body: ${errorText}`);
    }

    this.logger.info(`Collection ${collectionName} created successfully`);
  }

  async deleteCollection(collectionName: string): Promise<void> {
    this.logger.info(`Deleting collection: ${collectionName}`);

    const response = await fetch(`${this.baseUrl}/collections/${collectionName}`, {
      method: 'DELETE',
    });

    this.logger.debug('Delete response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Qdrant delete collection error:', errorText);
      throw new Error(`Failed to delete collection: ${response.status}, body: ${errorText}`);
    }

    this.logger.info(`Collection ${collectionName} deleted successfully`);
  }

  async uploadPoints(collectionName: string, points: Point[]): Promise<void> {
    this.logger.info(`Uploading ${points.length} points to collection: ${collectionName}`);

    // Upload in batches to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      this.logger.debug(`Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)} (${batch.length} points)`);

      const uploadPayload = {
        points: batch.map(point => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        })),
      };

      const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload),
      });

      this.logger.debug('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Qdrant upload error:', errorText);
        throw new Error(`Failed to upload points: ${response.status}, body: ${errorText}`);
      }
    }

    this.logger.info(`Successfully uploaded ${points.length} points to collection: ${collectionName}`);
  }

  async exportCollection(collectionName: string): Promise<void> {
    this.logger.info(`Exporting collection: ${collectionName}`);

    // For now, just log that export is not implemented
    // In a real implementation, this would export the collection data
    this.logger.warn('Export functionality not yet implemented');
    throw new Error('Export functionality not yet implemented');
  }
}