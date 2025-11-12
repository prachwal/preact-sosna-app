import { useState, useEffect, useRef } from 'preact/hooks';
import type { ModelInfo } from '../services/interfaces';
import { formPersistenceService } from '../services/formPersistenceService';
import type { ModelSelectionFormState } from '../types/types';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (model: ModelInfo) => void;
  currentModel?: string;
  models: ModelInfo[];
  providerName: string;
}

function ModelSelectionModal({
  isOpen,
  onClose,
  onSelectModel,
  currentModel,
  models,
  providerName
}: ModelSelectionModalProps) {
  const formId = `model_selection_${providerName.toLowerCase().replace(/\s+/g, '_')}`;

  const defaultFormState: ModelSelectionFormState = {
    searchTerm: '',
    selectedCategory: 'all',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    priceRange: { min: 0, max: 10000000 }, // 10 * 1000000
    contextRange: { min: 0, max: 200000 },
    searchField: 'all',
    conciseMode: false,
    currentPage: 1,
    pageSize: 10,
    showDebugInfo: false,
    filterToolUse: false,
    filterMultimodal: false,
    filterImageInput: false,
    filterImageOutput: false
  };

  const [formState, setFormState] = useState<ModelSelectionFormState>(() =>
    formPersistenceService.loadFormState(formId, defaultFormState)
  );

  // Tooltip state
  const [tooltipModel, setTooltipModel] = useState<ModelInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Extract state variables for easier access
  const {
    searchTerm,
    selectedCategory,
    sortBy,
    sortOrder,
    priceRange,
    contextRange,
    searchField,
    conciseMode,
    currentPage,
    pageSize,
    showDebugInfo,
    filterToolUse,
    filterMultimodal,
    filterImageInput,
    filterImageOutput
  } = formState;

  // Save form state whenever it changes
  useEffect(() => {
    formPersistenceService.saveFormState(formId, formState);
  }, [formId, formState]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > 1) {
      setFormState(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchTerm, selectedCategory, priceRange, contextRange, searchField]);

  // Get unique categories/tags from models
  const categories = ['all', ...new Set(models.flatMap(model => model.tags || []))];

  // Helper function to parse price strings
  const parsePrice = (price: number | string): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      // Remove currency symbols and parse
      const cleaned = price.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = parsePrice(price);
    if (numPrice === 0) return 'Free';

    // Format price per 1K tokens for better readability
    if (numPrice < 0.01) {
      // Very small prices (likely per million tokens), convert to per 1K
      return `$${(numPrice * 1000).toFixed(6)}/1K`;
    } else {
      // Normal prices (likely per 1K tokens)
      return `$${numPrice.toFixed(4)}/1K`;
    }
  };

  // Filter and sort models
  const filteredAndSortedModels = models
    .filter(model => {
      // Search filter
      let matchesSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        switch (searchField) {
          case 'name':
            matchesSearch = model.name.toLowerCase().includes(term);
            break;
          case 'description':
            matchesSearch = model.description.toLowerCase().includes(term);
            break;
          case 'tags':
            matchesSearch = model.tags?.some(tag => tag.toLowerCase().includes(term)) || false;
            break;
          case 'all':
          default:
            matchesSearch = model.name.toLowerCase().includes(term) ||
                           model.description.toLowerCase().includes(term) ||
                           model.tags?.some(tag => tag.toLowerCase().includes(term)) || false;
            break;
        }
      }

      // Category filter
      const matchesCategory = selectedCategory === 'all' ||
                             (model.tags && model.tags.includes(selectedCategory));

      // Price filter
      const avgPrice = model.pricing ?
        ((parsePrice(model.pricing.prompt) + parsePrice(model.pricing.completion)) / 2) * 1000000 : 999999999999;
      const matchesPrice = avgPrice >= priceRange.min && avgPrice <= priceRange.max;

      // Context length filter
      const matchesContext = model.contextLength >= contextRange.min &&
                            model.contextLength <= contextRange.max;

      // Capabilities filters
      const matchesToolUse = !filterToolUse || (model.capabilities?.toolUse === true);
      const matchesMultimodal = !filterMultimodal || (model.capabilities?.multimodal === true);
      const matchesImageInput = !filterImageInput || (model.capabilities?.inputModalities?.includes('image') === true);
      const matchesImageOutput = !filterImageOutput || (model.capabilities?.outputModalities?.includes('image') === true);

      return matchesSearch && matchesCategory && matchesPrice && matchesContext &&
             matchesToolUse && matchesMultimodal && matchesImageInput && matchesImageOutput;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'context':
          comparison = a.contextLength - b.contextLength;
          break;
        case 'price':
          const aPrice = a.pricing ? ((parsePrice(a.pricing.prompt) + parsePrice(a.pricing.completion)) / 2) * 1000000 : 999999999999;
          const bPrice = b.pricing ? ((parsePrice(b.pricing.prompt) + parsePrice(b.pricing.completion)) / 2) * 1000000 : 999999999999;
          comparison = aPrice - bPrice;
          console.log('Price sort debug:', a.name, 'price:', aPrice, 'vs', b.name, 'price:', bPrice);
          break;
        case 'provider':
          comparison = a.provider.localeCompare(b.provider);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalModels = filteredAndSortedModels.length;
  const totalPages = Math.ceil(totalModels / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedModels = filteredAndSortedModels.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setFormState(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFormState(prev => ({ ...prev, pageSize: newPageSize, currentPage: 1 }));
  };

  // Tooltip handlers
  const handleMouseEnter = (model: ModelInfo, event: MouseEvent) => {
    if (!conciseMode) return; // Only show tooltip in concise mode

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set timeout to show tooltip after 3 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setTooltipModel(model);
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // Position above the element
      });
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setTooltipModel(null);
    setTooltipPosition(null);
  };

  const handleSelectModel = (model: ModelInfo) => {
    onSelectModel(model);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="model-selection-modal-overlay">
      <div className="model-selection-modal">
        <div className="model-selection-modal-header">
          <h3>Select {providerName} Model</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="model-selection-modal-content">
          <div className="model-filters">
            <div className="search-group">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setFormState(prev => ({ ...prev, searchTerm: (e.target as HTMLInputElement).value.trim() }))}
                  className="model-search-input"
                />
                <select
                  value={searchField}
                  onChange={(e) => setFormState(prev => ({ ...prev, searchField: (e.target as HTMLSelectElement).value }))}
                  className="search-field-select"
                >
                  <option value="all">All fields</option>
                  <option value="name">Name</option>
                  <option value="description">Description</option>
                  <option value="tags">Tags</option>
                </select>
              </div>
            </div>

            <div className="sort-group">
              <label>Sort by:</label>
              <div className="sort-controls">
                <select
                  value={sortBy}
                  onChange={(e) => setFormState(prev => ({ ...prev, sortBy: (e.target as HTMLSelectElement).value }))}
                  className="sort-select"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="context">Context Length</option>
                  <option value="provider">Provider</option>
                </select>
                <button
                  onClick={() => setFormState(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                  className="sort-order-btn"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="range-filters">
              <div className="range-group">
                <label>Price range ($/1K token):</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={priceRange.min / 1000000}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: parseFloat((e.target as HTMLInputElement).value) * 1000000 || 0 }
                    }))}
                    className="range-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={priceRange.max / 1000000}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: parseFloat((e.target as HTMLInputElement).value) * 1000000 || 10000000 }
                    }))}
                    className="range-input"
                  />
                </div>
              </div>

              <div className="range-group">
                <label>Context length (tokens):</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    min="0"
                    max="200000"
                    step="1000"
                    value={contextRange.min}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      contextRange: { ...prev.contextRange, min: parseInt((e.target as HTMLInputElement).value) || 0 }
                    }))}
                    className="range-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="200000"
                    step="1000"
                    value={contextRange.max}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      contextRange: { ...prev.contextRange, max: parseInt((e.target as HTMLInputElement).value) || 200000 }
                    }))}
                    className="range-input"
                  />
                </div>
              </div>
            </div>

            <div className="category-filters">
              <div className="capabilities-row">
                <div className="capabilities-section">
                  <label>Capabilities:</label>
                  <div className="capability-filters">
                    <label className="capability-filter">
                      <input
                        type="checkbox"
                        checked={filterToolUse}
                        onChange={(e) => setFormState(prev => ({ ...prev, filterToolUse: (e.target as HTMLInputElement).checked }))}
                      />
                      🛠️ Tools
                    </label>
                    <label className="capability-filter">
                      <input
                        type="checkbox"
                        checked={filterMultimodal}
                        onChange={(e) => setFormState(prev => ({ ...prev, filterMultimodal: (e.target as HTMLInputElement).checked }))}
                      />
                      📸 Multimodal
                    </label>
                    <label className="capability-filter">
                      <input
                        type="checkbox"
                        checked={filterImageInput}
                        onChange={(e) => setFormState(prev => ({ ...prev, filterImageInput: (e.target as HTMLInputElement).checked }))}
                      />
                      🖼️ Image Input
                    </label>
                    <label className="capability-filter">
                      <input
                        type="checkbox"
                        checked={filterImageOutput}
                        onChange={(e) => setFormState(prev => ({ ...prev, filterImageOutput: (e.target as HTMLInputElement).checked }))}
                      />
                      🎨 Image Output
                    </label>
                  </div>
                </div>
              </div>

              <div className="category-filters-row">
                <div className="categories-section">
                  <label>Categories:</label>
                  <div className="category-buttons">
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setFormState(prev => ({ ...prev, selectedCategory: category }))}
                      >
                        {category === 'all' ? 'All Models' : category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="view-options">
                  <label className="view-options-label">
                    <input
                      type="checkbox"
                      checked={showDebugInfo}
                      onChange={(e) => setFormState(prev => ({ ...prev, showDebugInfo: (e.target as HTMLInputElement).checked }))}
                    />
                    Show debug info
                  </label>
                  <label className="view-options-label">
                    <input
                      type="checkbox"
                      checked={conciseMode}
                      onChange={(e) => setFormState(prev => ({ ...prev, conciseMode: (e.target as HTMLInputElement).checked }))}
                    />
                    Concise mode (hide descriptions)
                  </label>
                </div>
              </div>
            </div>

            {showDebugInfo && (
              <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '10px', fontSize: '12px', border: '1px solid #ccc' }}>
                <strong>Debug Info:</strong><br/>
                Search Term: "{searchTerm}" | Field: {searchField} | Category: {selectedCategory}<br/>
                Price Range: {priceRange.min} - {priceRange.max} (display: {priceRange.min / 1000000} - {priceRange.max / 1000000})<br/>
                Context: {contextRange.min} - {contextRange.max}<br/>
                Capabilities: ToolUse={filterToolUse ? 'yes' : 'no'} Multimodal={filterMultimodal ? 'yes' : 'no'} ImageIn={filterImageInput ? 'yes' : 'no'} ImageOut={filterImageOutput ? 'yes' : 'no'}<br/>
                Sort: {sortBy} ({sortOrder}) | Concise: {conciseMode ? 'yes' : 'no'}<br/>
                Total Models: {models.length} | Filtered: {filteredAndSortedModels.length} | Page: {currentPage} | Page Size: {pageSize}
                <br/>
                <button
                  onClick={() => setFormState(defaultFormState)}
                  style={{ marginTop: '5px', padding: '5px 10px', fontSize: '11px' }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          <div className="models-list">
            {paginatedModels.map((model: ModelInfo) => (
              <div
                key={model.id}
                className={`model-item ${currentModel === model.id ? 'selected' : ''}`}
                onClick={() => handleSelectModel(model)}
                onMouseEnter={(e) => handleMouseEnter(model, e)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="model-header">
                  <h4>{model.name}</h4>
                  {currentModel === model.id && <span className="current-badge">Current</span>}
                </div>

                {!conciseMode && <p className="model-description">{model.description}</p>}

                <div className="model-details">
                  <span className="context-length">Context: {model.contextLength.toLocaleString()} tokens</span>
                  {model.pricing && (
                    <span className="pricing">
                      {formatPrice(model.pricing.prompt)} prompt, {formatPrice(model.pricing.completion)} completion
                    </span>
                  )}
                </div>

                {model.tags && model.tags.length > 0 && (
                  <div className="model-tags">
                    {model.tags.map((tag: string) => (
                      <span key={tag} className="model-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {model.capabilities && (
                  <div className="model-capabilities">
                    {model.capabilities.toolUse && <span className="capability-badge tool-use">🛠️ Tools</span>}
                    {model.capabilities.multimodal && <span className="capability-badge multimodal">🎭 Multimodal</span>}
                    {model.capabilities.inputModalities?.includes('image') && <span className="capability-badge image-input">📷 Image Input</span>}
                    {model.capabilities.outputModalities?.includes('image') && <span className="capability-badge image-output">🎨 Image Output</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltipModel && tooltipPosition && (
            <div
              className="model-tooltip"
              style={{
                position: 'fixed',
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translate(-50%, -100%)',
                zIndex: 1000
              }}
            >
              <div className="model-tooltip-content">
                <h5>{tooltipModel.name}</h5>
                <p>{tooltipModel.description}</p>
              </div>
              <div className="model-tooltip-arrow"></div>
            </div>
          )}

          {totalModels > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, totalModels)} of {totalModels} models
              </div>

              <div className="pagination-buttons">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ‹ Previous
                </button>

                <div className="page-numbers">
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`page-number ${i + 1 === currentPage ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    ))
                  ) : (
                    // Show 5 pages with current page in center
                    Array.from({ length: 5 }, (_, i) => {
                      const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                      const pageNum = startPage + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next ›
                </button>
              </div>

              <div className="page-size-selector">
                <label>Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number((e.target as HTMLSelectElement).value))}
                  className="page-size-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
              </div>
            </div>
          )}

          {filteredAndSortedModels.length === 0 && (
            <div className="no-models">
              <p>No models found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelSelectionModal;