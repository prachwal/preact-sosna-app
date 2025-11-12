import type { ToolCall } from '../services/interfaces';
import type { FormState } from '../services/formPersistenceService';

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

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  toolInfo?: {
    toolCalls: ToolCall[];
    results: any[];
    errors: string[];
  };
}

export interface ModelSelectionFormState extends FormState {
  searchTerm: string;
  selectedCategory: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  priceRange: { min: number; max: number };
  contextRange: { min: number; max: number };
  searchField: string;
  conciseMode: boolean;
  currentPage: number;
  pageSize: number;
  showDebugInfo: boolean;
  filterToolUse: boolean;
  filterMultimodal: boolean;
  filterImageInput: boolean;
  filterImageOutput: boolean;
}
