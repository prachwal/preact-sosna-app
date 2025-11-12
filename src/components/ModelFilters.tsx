import { h } from 'preact';
import type { ModelSelectionFormState } from '../types/types';

interface ModelFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  contextRange: { min: number; max: number };
  setContextRange: (range: { min: number; max: number }) => void;
  searchField: string;
  setSearchField: (field: string) => void;
  conciseMode: boolean;
  setConciseMode: (mode: boolean) => void;
  showDebugInfo: boolean;
  setShowDebugInfo: (show: boolean) => void;
  filterToolUse: boolean;
  setFilterToolUse: (filter: boolean) => void;
  filterMultimodal: boolean;
  setFilterMultimodal: (filter: boolean) => void;
  filterImageInput: boolean;
  setFilterImageInput: (filter: boolean) => void;
  filterImageOutput: boolean;
  setFilterImageOutput: (filter: boolean) => void;
  categories: string[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalModels: number;
}

export function ModelFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  priceRange,
  setPriceRange,
  contextRange,
  setContextRange,
  searchField,
  setSearchField,
  conciseMode,
  setConciseMode,
  showDebugInfo,
  setShowDebugInfo,
  filterToolUse,
  setFilterToolUse,
  filterMultimodal,
  setFilterMultimodal,
  filterImageInput,
  setFilterImageInput,
  filterImageOutput,
  setFilterImageOutput,
  categories,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalModels
}: ModelFiltersProps) {
  const totalPages = Math.ceil(totalModels / pageSize);

  return (
    <div className="model-filters">
      {/* Search */}
      <div className="filter-section">
        <h4>🔍 Wyszukiwanie</h4>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Szukaj modeli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            className="search-input"
          />
          <select
            value={searchField}
            onChange={(e) => setSearchField((e.target as HTMLSelectElement).value)}
          >
            <option value="all">Wszystkie pola</option>
            <option value="name">Nazwa</option>
            <option value="description">Opis</option>
            <option value="tags">Tagi</option>
          </select>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h4>📂 Kategoria</h4>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'Wszystkie' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Sorting */}
      <div className="filter-section">
        <h4>🔄 Sortowanie</h4>
        <div className="sort-controls">
          <select value={sortBy} onChange={(e) => setSortBy((e.target as HTMLSelectElement).value)}>
            <option value="name">Nazwa</option>
            <option value="pricing.prompt">Cena (prompt)</option>
            <option value="pricing.completion">Cena (completion)</option>
            <option value="contextLength">Długość kontekstu</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder((e.target as HTMLSelectElement).value as 'asc' | 'desc')}>
            <option value="asc">Rosnąco</option>
            <option value="desc">Malejąco</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <h4>💰 Zakres cenowy (per 1M tokens)</h4>
        <div className="range-controls">
          <label>Min: ${priceRange.min / 1000000}</label>
          <input
            type="range"
            min="0"
            max="10000000"
            step="100000"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: Number((e.target as HTMLInputElement).value) })}
          />
          <label>Max: ${priceRange.max / 1000000}</label>
          <input
            type="range"
            min="0"
            max="10000000"
            step="100000"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
      </div>

      {/* Context Length Range */}
      <div className="filter-section">
        <h4>📏 Długość kontekstu</h4>
        <div className="range-controls">
          <label>Min: {contextRange.min}</label>
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={contextRange.min}
            onChange={(e) => setContextRange({ ...contextRange, min: Number((e.target as HTMLInputElement).value) })}
          />
          <label>Max: {contextRange.max}</label>
          <input
            type="range"
            min="0"
            max="200000"
            step="1000"
            value={contextRange.max}
            onChange={(e) => setContextRange({ ...contextRange, max: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
      </div>

      {/* Feature Filters */}
      <div className="filter-section">
        <h4>⚙️ Funkcje</h4>
        <div className="checkbox-filters">
          <label>
            <input
              type="checkbox"
              checked={filterToolUse}
              onChange={(e) => setFilterToolUse((e.target as HTMLInputElement).checked)}
            />
            Obsługa narzędzi
          </label>
          <label>
            <input
              type="checkbox"
              checked={filterMultimodal}
              onChange={(e) => setFilterMultimodal((e.target as HTMLInputElement).checked)}
            />
            Multimodalny
          </label>
          <label>
            <input
              type="checkbox"
              checked={filterImageInput}
              onChange={(e) => setFilterImageInput((e.target as HTMLInputElement).checked)}
            />
            Wejście obrazów
          </label>
          <label>
            <input
              type="checkbox"
              checked={filterImageOutput}
              onChange={(e) => setFilterImageOutput((e.target as HTMLInputElement).checked)}
            />
            Wyjście obrazów
          </label>
        </div>
      </div>

      {/* Display Options */}
      <div className="filter-section">
        <h4>👁️ Wyświetlanie</h4>
        <div className="display-options">
          <label>
            <input
              type="checkbox"
              checked={conciseMode}
              onChange={(e) => setConciseMode((e.target as HTMLInputElement).checked)}
            />
            Tryb zwięzły
          </label>
          <label>
            <input
              type="checkbox"
              checked={showDebugInfo}
              onChange={(e) => setShowDebugInfo((e.target as HTMLInputElement).checked)}
            />
            Pokaż informacje debug
          </label>
        </div>
      </div>

      {/* Pagination */}
      <div className="filter-section">
        <h4>📄 Stronicowanie</h4>
        <div className="pagination-controls">
          <div className="page-size">
            <label>Elementów na stronie:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number((e.target as HTMLSelectElement).value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="page-navigation">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹ Poprzednia
            </button>
            <span>Strona {currentPage} z {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Następna ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}