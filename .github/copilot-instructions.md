# Preact Qdrant GUI - AI Coding Guidelines

## Architecture Overview

**Service-Oriented Architecture with SOLID Principles**
- Core services implement interfaces (`VectorDatabase`, `EmbeddingService`, `DocumentProcessor`) for dependency injection
- `QdrantApi` orchestrates all services as the main entry point
- Configuration managed via singleton `ConfigurationProvider` with localStorage persistence
- Services communicate via HTTP APIs (Qdrant: 6333, Polish BERT: 8082)

**Key Files:**
- `src/services/qdrantApi.ts` - Main orchestrator with factory methods
- `src/services/ConfigurationProvider.ts` - Singleton config with localStorage (includes AI model settings)
- `src/services/openRouterService.ts` - AI service implementation (easily replaceable)
- `src/components/SettingsModal.tsx` - Settings with token validation and model selection
- `src/components/ModelSelectionModal.tsx` - Universal model picker for different providers
- `src/hooks/useCollections.ts` - State management hook (400+ lines)
- `src/services/interfaces.ts` - All service contracts and data types

## Development Workflow

**Local Development:**
```bash
# Start all services (app, Qdrant, Polish BERT API)
docker-compose up --build

# Frontend only development
npm run dev  # Runs on port 5173/5174 (auto-increment)
```

**Build & Deploy:**
```bash
npm run build  # Vite production build
docker-compose up --build  # Full stack deployment
```

**Service URLs (configurable via settings):**
- Qdrant: `http://localhost:6333`
- Polish BERT API: `http://localhost:8082`

## Build System

**Vite + Preact + TypeScript:**
- Uses `@preact/preset-vite` for JSX transformation
- TypeScript with strict mode and Preact JSX pragma
- SCSS compilation with modular imports
- Auto-incrementing ports (5173/5174) when conflicts occur

**Docker Deployment:**
- Multi-service setup with health checks
- Volume mounting for data persistence (Qdrant storage, model cache)
- Python service with PyTorch CPU installation
- Nginx reverse proxy for production

## Code Patterns

**Service Instantiation:**
```typescript
// Use ConfigurationProvider for URLs instead of hardcoding
const qdrantDb = new QdrantDatabase({ logger });
const embeddingSvc = new PolishEmbeddingService({ logger });
const aiSvc = new OpenRouterService({ apiKey: configProvider.getOpenRouterToken(), logger });

// Or use QdrantApi factory
const api = QdrantApi.create(vectorConfig, embeddingConfig, aiConfig);
```

**Form State Persistence:**
```typescript
// Use formPersistenceService for complex form states (ModelSelectionModal, SettingsModal)
const formId = 'model_selection_openrouter';
const [formState, setFormState] = useState<FormState>(() =>
  formPersistenceService.loadFormState(formId, defaultState)
);

// Auto-save on state changes
useEffect(() => {
  formPersistenceService.saveFormState(formId, formState);
}, [formId, formState]);
```

**Collection Selection:**
```typescript
// Use selectedCollection from useCollections hook
const { selectedCollection, selectCollection } = useCollections();

// Select collection (persisted automatically)
selectCollection('my-collection-name');

// SearchComponent automatically uses selectedCollection
<SearchComponent selectedCollection={selectedCollection} />
```

**AI Service Usage:**
```typescript
// Generate response
const response = await api.generateResponse("Explain vector databases", {
  model: "anthropic/claude-3-haiku",
  temperature: 0.7,
  maxTokens: 1000
});

// Streaming response
const streamingResponse = await api.generateStreamingResponse(
  "Tell me a story",
  { model: "anthropic/claude-3-haiku" },
  (chunk) => console.log("Received:", chunk)
);
```

**Error Handling:**
```typescript
try {
  const result = await service.operation();
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
}
```

**Component Architecture:**
- Large, feature-rich components (ModelSelectionModal: 500+ lines)
- Custom hooks for complex state management (`useCollections`)
- Props drilling for shared state between components
- Modal-heavy interface with complex form states
- Extracted sub-components for reusability (ModelSelectionTabs, ChatInterface)

## UI Patterns

**SCSS Structure:**
- Variables imported via `@use 'variables' as *`
- Component-specific styles in `_qdrant-gui.scss`
- Responsive design with mobile-first breakpoints
- Consistent spacing using `$spacing-*` variables
- Modular imports in `App.scss`

**Tab Navigation:**
```tsx
// Use ModelSelectionTabs for Semantic Search/Chat AI switching
<ModelSelectionTabs
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>

// Conditional rendering based on active tab
{activeTab === 'search' && <SearchComponent />}
{activeTab === 'chat' && <ChatInterface />}
```

**Modal Management:**
```typescript
const [showModal, setShowModal] = useState(false);
// Always provide onClose handler
<Modal isOpen={showModal} onClose={() => setShowModal(false)} />
```

**Collection Selection UI:**
```tsx
// CollectionList shows select button for each collection
<CollectionList
  selectedCollection={selectedCollection}
  onSelectCollection={selectCollection}
/>

// Selected collection is highlighted and persisted
<button className={`select-btn ${selectedCollection === collection.name ? 'selected' : ''}`}>
  {selectedCollection === collection.name ? '✓ Selected' : 'Select'}
</button>
```

## Data Flow

**File Upload Process:**
1. File → `TextDocumentProcessor.processFile()` → chunks
2. Chunks → `PolishEmbeddingService.embedTexts()` → vectors
3. Vectors → `QdrantDatabase.uploadPoints()` → stored

**Search Process:**
1. Query → `PolishEmbeddingService.embedTexts()` → query vector
2. Query vector → `QdrantDatabase.search()` → results with scores

## Configuration

**Settings Persistence:**
- All service URLs configurable via UI settings modal
- Persisted in localStorage via `ConfigurationProvider`
- Services automatically use updated URLs on next instantiation
- Selected collection persists across sessions

**Form State Persistence:**
- Complex form states (ModelSelectionModal, SettingsModal) use `formPersistenceService`
- Automatic save/load with versioning and error handling
- Prevents data loss during navigation/modal closing

**Default Configuration:**
```typescript
{
  qdrantUrl: 'http://localhost:6333',
  embeddingUrl: 'http://localhost:8082',
  openRouterToken: '',
  selectedModel: 'anthropic/claude-3-haiku',
  selectedProvider: 'openrouter',
  selectedCollection: ''
}
```

## Settings Features

**Token Validation:**
- Visual feedback with green checkmark (✓) for valid tokens
- Real-time validation on button click
- Error states for invalid tokens

**Model Selection:**
- Universal modal supporting different AI providers
- Advanced search with field-specific filtering (name, description, tags)
- Multiple filter options: categories, pricing range, context length range
- Sorting by name, pricing, context length, or provider
- Model details: pricing, context length, descriptions
- Automatic fallback to default models if API unavailable

## Common Pitfalls

- **Don't hardcode service URLs** - use `ConfigurationProvider`
- **Always handle progress callbacks** for long operations
- **Use interfaces for service dependencies** - enables testing/mock injection
- **Check Docker Compose logs** - services may fail silently
- **Validate vector dimensions** - Polish BERT returns 1024-dim vectors
- **Use formPersistenceService** for complex forms instead of localStorage directly
- **Import SCSS variables** via `@use 'variables' as *` for consistency
- **Use selectedCollection from useCollections** instead of managing collection state locally
- **Follow tab pattern** - conditional rendering based on activeTab state
- **Persist collection selection** via ConfigurationProvider for cross-session continuity

## Testing Strategy

Currently no test suite implemented. When adding tests:
- Mock services using interfaces
- Test components with `useCollections` hook
- Integration tests should use Docker Compose setup</content>
<parameter name="filePath">/home/prachwal/src/preact/preact-sosna-app/.github/copilot-instructions.md