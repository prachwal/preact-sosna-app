import type { Logger, Point, SearchResult, SearchOptions } from './interfaces';

export class QdrantSearch {
  constructor(
    private baseUrl: string,
    private logger: Logger
  ) {}

  async search(collectionName: string, vector: number[], options?: SearchOptions): Promise<SearchResult[]> {
    this.logger.info(`Searching collection: ${collectionName} with vector of length: ${vector.length}`);

    const searchPayload = {
      vector: vector,
      limit: options?.limit || 10,
      with_payload: true,
      score_threshold: options?.scoreThreshold,
    };

    this.logger.debug('Search URL:', `${this.baseUrl}/collections/${collectionName}/points/search`);
    this.logger.debug('Search payload:', { ...searchPayload, vector: `[${vector.length} elements]` });

    const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchPayload),
    });

    this.logger.debug('Search response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Qdrant search error:', errorText);
      throw new Error(`Failed to search: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Search response data:', data);

    return data.result || [];
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
      this.logger.error('Qdrant browse error:', errorText);
      throw new Error(`Failed to browse collection: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Browse response data:', data);

    return data.result?.points || [];
  }

  async getPointById(collectionName: string, pointId: string | number): Promise<Point | null> {
    this.logger.info(`Getting point by ID: ${pointId} from collection: ${collectionName}`);

    const response = await fetch(`${this.baseUrl}/collections/${collectionName}/points/${pointId}`, {
      method: 'GET',
    });

    this.logger.debug('Get point response status:', response.status);

    if (response.status === 404) {
      this.logger.warn(`Point ${pointId} not found in collection ${collectionName}`);
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Qdrant get point error:', errorText);
      throw new Error(`Failed to get point: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Get point response data:', data);

    return data.result;
  }

  async getPointsByFileName(collectionName: string, fileName: string): Promise<Point[]> {
    this.logger.info(`Getting points by filename: ${fileName} from collection: ${collectionName}`);

    const url = `${this.baseUrl}/collections/${collectionName}/points/scroll`;
    const scrollPayload = {
      filter: {
        must: [
          {
            key: "fileName",
            match: { value: fileName }
          }
        ]
      },
      limit: 1000, // Assuming files won't have more than 1000 chunks
      with_payload: true,
      with_vectors: false,
    };

    this.logger.debug('Scroll URL:', url);
    this.logger.debug('Scroll payload:', scrollPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scrollPayload),
    });

    this.logger.debug('Scroll response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error('Qdrant scroll error response:', errorText);
      throw new Error(`Failed to get points by filename: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    this.logger.debug('Scroll response data:', data);

    return data.result?.points || [];
  }
}