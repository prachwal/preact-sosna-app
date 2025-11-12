import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { SearchResult, SearchOptions } from '../services/interfaces';

interface SearchComponentProps {
  collections: Array<{ name: string; vectors_count: number }>;
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  searchOptions: SearchOptions;
  selectedCollection?: string;
  onSearchQueryChange: (query: string) => void;
  onSearchOptionsChange: (options: SearchOptions) => void;
  onPerformSearch: (collectionName: string) => void;
  onClearResults: () => void;
}

function SearchComponent({
  collections,
  searchQuery,
  searchResults,
  searching,
  searchOptions,
  selectedCollection = '',
  onSearchQueryChange,
  onSearchOptionsChange,
  onPerformSearch,
  onClearResults,
}: SearchComponentProps) {

  const handleSearch = () => {
    if (selectedCollection && searchQuery.trim()) {
      onPerformSearch(selectedCollection);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !searching) {
      handleSearch();
    }
  };

  return (
    <div className="search-component">
      <div className="search-header">
        <h2>Semantic Search</h2>
        <p>Search through your document collections using natural language</p>
        {selectedCollection && (
          <p className="selected-collection-info">
            <strong>Selected collection:</strong> {selectedCollection}
          </p>
        )}
      </div>

      <div className="search-controls">
        <div className="search-input-group">
          <select
            value={selectedCollection}
            className="search-collection-select"
            disabled
          >
            <option value="">No collection selected</option>
            {collections.map((collection) => (
              <option key={collection.name} value={collection.name}>
                {collection.name} ({collection.vectors_count} vectors)
              </option>
            ))}
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange((e.target as HTMLInputElement).value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your search query..."
            className="search-input"
            disabled={searching}
          />

          <button
            onClick={handleSearch}
            disabled={searching || !selectedCollection || !searchQuery.trim()}
            className="btn btn-primary search-button"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>

          {searchResults.length > 0 && (
            <button
              onClick={onClearResults}
              className="btn btn-secondary clear-button"
            >
              Clear
            </button>
          )}
        </div>

        <div className="search-options">
          <div className="option-group">
            <label>
              Max Results:
              <input
                type="number"
                min="1"
                max="100"
                value={searchOptions.limit || 10}
                onChange={(e) => onSearchOptionsChange({
                  ...searchOptions,
                  limit: parseInt((e.target as HTMLInputElement).value) || 10
                })}
                className="option-input"
              />
            </label>
          </div>

          <div className="option-group">
            <label>
              Similarity Threshold:
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={searchOptions.scoreThreshold || 0.0}
                onChange={(e) => onSearchOptionsChange({
                  ...searchOptions,
                  scoreThreshold: parseFloat((e.target as HTMLInputElement).value) || 0.0
                })}
                className="option-input"
              />
            </label>
            <small>0.0 = all results, higher = more similar</small>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Search Results ({searchResults.length})</h3>
          </div>

          <div className="results-list">
            {searchResults.map((result, index) => (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <span className="result-rank">#{index + 1}</span>
                  <span className="result-score">
                    Similarity: {(result.score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="result-content">
                  <div className="result-text">
                    {result.payload?.text || 'No text content'}
                  </div>

                  {result.payload && (
                    <div className="result-metadata">
                      {result.payload.fileName && (
                        <span className="metadata-item">
                          📄 {result.payload.fileName}
                        </span>
                      )}
                      {result.payload.chunkIndex !== undefined && (
                        <span className="metadata-item">
                          📍 Chunk {result.payload.chunkIndex + 1}
                        </span>
                      )}
                      {result.payload.timestamp && (
                        <span className="metadata-item">
                          🕒 {new Date(result.payload.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searching && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      )}
    </div>
  );
}

export default SearchComponent;