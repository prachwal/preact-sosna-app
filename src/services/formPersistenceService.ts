/**
 * Universal localStorage service for form state persistence
 * Provides serialization/deserialization with type safety
 */

export interface FormState {
  [key: string]: any;
}

export interface FormStateOptions {
  prefix?: string;
  version?: string;
}

export class FormPersistenceService {
  private prefix: string;
  private version: string;

  constructor(options: FormStateOptions = {}) {
    this.prefix = options.prefix || 'form_state';
    this.version = options.version || '1.0';
  }

  /**
   * Generate storage key with prefix and version
   */
  private getStorageKey(formId: string): string {
    return `${this.prefix}_${formId}_v${this.version}`;
  }

  /**
   * Serialize form state to localStorage
   */
  saveFormState<T extends FormState>(formId: string, state: T): void {
    try {
      const serializedState = JSON.stringify({
        data: state,
        timestamp: Date.now(),
        version: this.version
      });
      localStorage.setItem(this.getStorageKey(formId), serializedState);
    } catch (error) {
      console.warn(`Failed to save form state for ${formId}:`, error);
    }
  }

  /**
   * Deserialize form state from localStorage
   */
  loadFormState<T extends FormState>(formId: string, defaultState: T): T {
    try {
      const stored = localStorage.getItem(this.getStorageKey(formId));
      if (!stored) {
        return defaultState;
      }

      const parsed = JSON.parse(stored);

      // Version check - if versions don't match, return default
      if (parsed.version !== this.version) {
        console.info(`Form state version mismatch for ${formId}, using defaults`);
        return defaultState;
      }

      // Merge with defaults to handle missing properties
      return { ...defaultState, ...parsed.data };
    } catch (error) {
      console.warn(`Failed to load form state for ${formId}:`, error);
      return defaultState;
    }
  }

  /**
   * Clear form state from localStorage
   */
  clearFormState(formId: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(formId));
    } catch (error) {
      console.warn(`Failed to clear form state for ${formId}:`, error);
    }
  }

  /**
   * Check if form state exists in localStorage
   */
  hasFormState(formId: string): boolean {
    return localStorage.getItem(this.getStorageKey(formId)) !== null;
  }

  /**
   * Get metadata about stored form state
   */
  getFormStateMetadata(formId: string): { timestamp: number; version: string } | null {
    try {
      const stored = localStorage.getItem(this.getStorageKey(formId));
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        timestamp: parsed.timestamp || 0,
        version: parsed.version || 'unknown'
      };
    } catch {
      return null;
    }
  }
}

// Singleton instance for global use
export const formPersistenceService = new FormPersistenceService();