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
- `src/services/tools.ts` - Tool definitions, implementations, and execution logic
- `src/components/SettingsModal.tsx` - Settings with token validation and model selection
- `src/components/ModelSelectionModal.tsx` - Universal model picker for different providers
- `src/components/ChatInterface.tsx` - Chat with tool management and execution
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

// With tools
const response = await api.generateResponse("Calculate 5!", {
  model: "anthropic/claude-3-haiku",
  tools: [factorialTool],
  systemPrompt: "You are a helpful AI assistant with access to various tools."
});

// Streaming response
const streamingResponse = await api.generateStreamingResponse(
  "Tell me a story",
  { model: "anthropic/claude-3-haiku" },
  (chunk) => console.log("Received:", chunk)
);
```

**Tool System:**
```typescript
// Define tools in src/services/tools.ts
export const factorialTool: Tool = {
  type: 'function',
  function: {
    name: 'calculate_factorial',
    description: 'Calculate the factorial of a number (n!). Only works for integers from 0 to 10.',
    parameters: {
      type: 'object',
      properties: {
        n: {
          type: 'integer',
          description: 'The number to calculate factorial for (0-10)',
          minimum: 0,
          maximum: 10
        }
      },
      required: ['n']
    }
  }
};

export const searchVectorDatabaseTool: Tool = {
  type: 'function',
  function: {
    name: 'search_vector_database',
    description: 'Search the vector database using semantic search. Provide a natural language query to find relevant documents.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query in natural language'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return (default: 5)',
          minimum: 1,
          maximum: 20,
          default: 5
        }
      },
      required: ['query']
    }
  }
};

export const getFullDocumentTool: Tool = {
  type: 'function',
  function: {
    name: 'get_full_document',
    description: 'Retrieve the full content of a document by its ID from the vector database.',
    parameters: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'The ID of the document to retrieve'
        }
      },
      required: ['document_id']
    }
  }
};

// Execute tool calls
const result = executeTool(toolCall); // Returns calculated result

// Tool management in ChatInterface
const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(availableTools.map(t => t.function.name)));
const toggleTool = (toolName: string) => { /* toggle logic */ };
const getEnabledTools = (): Tool[] => availableTools.filter(tool => enabledTools.has(tool.function.name));
```

**Chat Interface Patterns:**
```typescript
// Tool state management with localStorage persistence
const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(availableTools.map(t => t.function.name)));
const [showToolManager, setShowToolManager] = useState(false);

// Load/save tool preferences
useEffect(() => {
  const stored = localStorage.getItem('chat-enabled-tools');
  if (stored) setEnabledTools(new Set(JSON.parse(stored)));
}, []);

useEffect(() => {
  localStorage.setItem('chat-enabled-tools', JSON.stringify(Array.from(enabledTools)));
}, [enabledTools]);

// Only pass enabled tools to AI
const enabledToolList = getEnabledTools();
const response = await qdrantApi.generateResponse(prompt, {
  model: selectedModel,
  ...(enabledToolList.length > 0 && { tools: enabledToolList }),
  systemPrompt: "You are a helpful AI assistant with access to various tools."
});
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

**Tool Management UI:**
```tsx
// Collapsible tool manager in ChatInterface
<div className="tool-manager">
  <button className="tool-manager-toggle" onClick={() => setShowToolManager(!showToolManager)}>
    {showToolManager ? '▼' : '▶'} Tools ({enabledTools.size}/{availableTools.length})
  </button>

  {showToolManager && (
    <div className="tool-manager-content">
      {availableTools.map(tool => (
        <div key={tool.function.name} className="tool-item">
          <label className="tool-label">
            <input
              type="checkbox"
              checked={enabledTools.has(tool.function.name)}
              onChange={() => toggleTool(tool.function.name)}
            />
            <div className="tool-info">
              <strong>{tool.function.name}</strong>
              <p>{tool.function.description}</p>
            </div>
          </label>
        </div>
      ))}
    </div>
  )}
</div>
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
- **Persist tool preferences** - use localStorage with 'chat-enabled-tools' key
- **Filter enabled tools** - always use `getEnabledTools()` instead of passing all availableTools
- **Handle tool execution errors** - wrap executeTool() calls in try-catch blocks
- **Ensure collection is selected** - vector database tools require selected collection in ConfigurationProvider
- **Handle async tool execution** - search and document retrieval tools are asynchronous

## Testing Strategy

Currently no test suite implemented. When adding tests:
- Mock services using interfaces
- Test components with `useCollections` hook
- Integration tests should use Docker Compose setup</content>
<parameter name="filePath">/home/prachwal/src/preact/preact-sosna-app/.github/copilot-instructions.md