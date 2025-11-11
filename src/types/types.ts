export interface Collection {
  name: string;
  vectors_count: number;
  points_count: number;
}

export interface Point {
  id: number | string;
  vector?: number[];
  payload?: Record<string, any>;
}