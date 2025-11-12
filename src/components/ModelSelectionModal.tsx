import { useState, useEffect, useRef } from 'preact/hooks';
import type { ModelInfo } from '../services/interfaces';
import { formPersistenceService } from '../services/formPersistenceService';
import type { ModelSelectionFormState } from '../types/types';
import { ModelFilters } from './ModelFilters';
import { ModelList } from './ModelList';

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

  // Helper functions for updating form state
  const updateFormState = (updates: Partial<ModelSelectionFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const setSearchTerm = (term: string) => updateFormState({ searchTerm: term });
  const setSelectedCategory = (category: string) => updateFormState({ selectedCategory: category });
  const setSortBy = (sort: string) => updateFormState({ sortBy: sort });
  const setSortOrder = (order: 'asc' | 'desc') => updateFormState({ sortOrder: order });
  const setPriceRange = (range: { min: number; max: number }) => updateFormState({ priceRange: range });
  const setContextRange = (range: { min: number; max: number }) => updateFormState({ contextRange: range });
  const setSearchField = (field: string) => updateFormState({ searchField: field });
  const setConciseMode = (mode: boolean) => updateFormState({ conciseMode: mode });
  const setShowDebugInfo = (show: boolean) => updateFormState({ showDebugInfo: show });
  const setFilterToolUse = (filter: boolean) => updateFormState({ filterToolUse: filter });
  const setFilterMultimodal = (filter: boolean) => updateFormState({ filterMultimodal: filter });
  const setFilterImageInput = (filter: boolean) => updateFormState({ filterImageInput: filter });
  const setFilterImageOutput = (filter: boolean) => updateFormState({ filterImageOutput: filter });
  const setCurrentPage = (page: number) => updateFormState({ currentPage: page });
  const setPageSize = (size: number) => updateFormState({ pageSize: size });

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
          <ModelFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            contextRange={contextRange}
            setContextRange={setContextRange}
            searchField={searchField}
            setSearchField={setSearchField}
            conciseMode={conciseMode}
            setConciseMode={setConciseMode}
            showDebugInfo={showDebugInfo}
            setShowDebugInfo={setShowDebugInfo}
            filterToolUse={filterToolUse}
            setFilterToolUse={setFilterToolUse}
            filterMultimodal={filterMultimodal}
            setFilterMultimodal={setFilterMultimodal}
            filterImageInput={filterImageInput}
            setFilterImageInput={setFilterImageInput}
            filterImageOutput={filterImageOutput}
            setFilterImageOutput={setFilterImageOutput}
            categories={categories}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalModels={models.length}
          />

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

          <div className="models-list">
            <ModelList
              models={paginatedModels}
              currentModel={currentModel}
              onSelectModel={handleSelectModel}
              conciseMode={conciseMode}
              showDebugInfo={showDebugInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelSelectionModal;