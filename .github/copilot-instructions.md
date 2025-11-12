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
npm run dev  # Runs on port 3000
```

**Build & Deploy:**
```bash
npm run build  # Vite production build
docker-compose up --build  # Full stack deployment
```

**Service URLs (configurable via settings):**
- Qdrant: `http://localhost:6333`
- Polish BERT API: `http://localhost:8082`

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

**Component State Management:**
- Use `useCollections` hook for all collection operations
- Props drilling for complex state (loading, progress, modals)
- Separate state for UI concerns (selectedPoint, navigation)

## UI Patterns

**SCSS Structure:**
- Variables imported via `@use 'variables' as *`
- Component-specific styles in `_qdrant-gui.scss`
- Responsive design with mobile-first breakpoints
- Consistent spacing using `$spacing-*` variables

**Modal Management:**
```typescript
const [showModal, setShowModal] = useState(false);
// Always provide onClose handler
<Modal isOpen={showModal} onClose={() => setShowModal(false)} />
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

**Default Configuration:**
```typescript
{
  qdrantUrl: 'http://localhost:6333',
  embeddingUrl: 'http://localhost:8082',
  openRouterToken: '',
  selectedModel: 'anthropic/claude-3-haiku',
  selectedProvider: 'openrouter'
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

## Testing Strategy

Currently no test suite implemented. When adding tests:
- Mock services using interfaces
- Test components with `useCollections` hook
- Integration tests should use Docker Compose setup</content>
<parameter name="filePath">/home/prachwal/src/preact/preact-sosna-app/.github/copilot-instructions.md