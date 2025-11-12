import type {
  VectorDatabase,
  VectorDatabaseConfig,
  Collection,
  Point,
  Logger
} from './interfaces';

export class QdrantDatabase implements VectorDatabase {
  private readonly baseUrl: string;
  private readonly logger: Logger;

  constructor(config: VectorDatabaseConfig & { logger?: Logger }) {
    this.baseUrl = config.url;
    this.logger = config.logger || { info: console.log, warn: console.warn, error: console.error, debug: console.debug };
  }

  async fetchCollections(): Promise<Collection[]> {
    this.logger.info('Fetching collections from Qdrant...');
    const response = await fetch(`${this.baseUrl}/collections`);
    this.logger.debug('Collections response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    this.logger.debug('Collections data:', data);
    const collections = data.result?.collections || [];
    this.logger.info('Collections loaded:', collections.length);
    return collections;
  }

  async browseCollection(collectionName: string): Promise<Point[]> {
    this.logger.info(`Starting browse for collection: ${collectionName}`);
    const url = `${this.baseUrl}/collections/${collectionName}/points/scroll`;
    this.logger.debug('Browse URL:', url);
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
    this.logger.debug('Browse response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Browse error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Browse data received:', data);
    return data.result?.points || [];
  }

  async exportCollection(collectionName: string): Promise<void> {
    this.logger.info(`Starting export for collection: ${collectionName}`);
    const url = `${this.baseUrl}/collections/${collectionName}/points/scroll`;
    this.logger.debug('Export URL:', url);
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
    this.logger.debug('Export response status:', response.status);
    this.logger.debug('Export response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Export error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Export data received, size:', JSON.stringify(data).length);
    this.logger.debug('Export data preview:', JSON.stringify(data).slice(0, 500) + '...');

    // Create a blob with the JSON data
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    this.logger.debug('Blob created, URL:', blobUrl);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${collectionName}_export.json`;
    document.body.appendChild(link);
    this.logger.debug('Download link created, triggering click...');
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(blobUrl);
    this.logger.info('Export completed successfully for:', collectionName);
  }

  async createCollection(
    collectionName: string,
    vectorSize: number = 1024
  ): Promise<void> {
    this.logger.info(`Creating collection: ${collectionName}`);
    const url = `${this.baseUrl}/collections/${collectionName}`;
    this.logger.debug('Create collection URL:', url);
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
    this.logger.debug('Create collection response status:', response.status);

    if (!response.ok) {
      // 409 Conflict means collection already exists, which is fine
      if (response.status === 409) {
        this.logger.info(`Collection ${collectionName} already exists, continuing...`);
        return;
      }

      const errorText = await response.text();
      this.logger.error('Create collection error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    this.logger.info('Collection created successfully:', collectionName);
  }

  async deleteCollection(collectionName: string): Promise<void> {
    this.logger.info(`Deleting collection: ${collectionName}`);
    const url = `${this.baseUrl}/collections/${collectionName}`;
    this.logger.debug('Delete collection URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
    });
    this.logger.debug('Delete collection response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Delete collection error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    this.logger.info('Collection deleted successfully:', collectionName);
  }

  async uploadPoints(collectionName: string, points: Point[]): Promise<void> {
    this.logger.info(`Uploading ${points.length} points to collection: ${collectionName}`);

    if (points.length === 0) {
      this.logger.info('No points to upload');
      return;
    }

    const uploadData = { points };
    this.logger.debug(
      'Upload data preview:',
      JSON.stringify({
        pointsCount: points.length,
        samplePoint: points[0],
      })
    );

    const uploadResponse = await fetch(
      `${this.baseUrl}/collections/${collectionName}/points`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      }
    );

    this.logger.debug('Upload response status:', uploadResponse.status);
    this.logger.debug('Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      this.logger.error('Qdrant upload error response:', errorText);
      this.logger.error('Upload data that failed:', JSON.stringify(uploadData).slice(0, 500) + '...');
      throw new Error(`Batch upload failed: ${uploadResponse.status}, body: ${errorText}`);
    }

    this.logger.info(`Successfully uploaded ${points.length} points to Qdrant`);
  }
}