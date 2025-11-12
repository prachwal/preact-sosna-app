# Plan Ulepszeń Preact Qdrant GUI - Checklista

**Data utworzenia:** 2025-11-12  
**Łączna liczba linii kodu:** ~8617  
**Status:** 🔴 Do wykonania

---

## 📊 Podsumowanie Analizy

### Statystyki Kodu
- **Komponenty:** 14 plików .tsx
- **Serwisy:** 13 plików .ts
- **Style:** 9 plików .scss
- **Największe pliki:**
  - `_qdrant-gui.scss`: 1288 linii (⚠️ wymaga refaktoryzacji)
  - `ModelSelectionModal.tsx`: ~586 linii
  - `qdrantApi.ts`: 328 linii
  - `ChatInterface.tsx`: 245 linii

### Zidentyfikowane Problemy
- ❌ **Krytyczne:** 8 problemów (security, stability)
- ⚠️ **Wysokie:** 12 problemów (performance, UX)
- 💡 **Średnie:** 15 problemów (code quality, a11y)
- ✨ **Nice-to-have:** 10 uleprzeń (features)

---

## 🔴 PRIORYTET 1 - KRYTYCZNE (Security & Stability)

### P1.1 - Security Issues
- [ ] **[KRYTYCZNE]** Dodać DOMPurify do sanityzacji HTML w `ChatMessages.tsx`
  - **Lokalizacja:** `src/components/ChatMessages.tsx:75`
  - **Problem:** Używanie `dangerouslySetInnerHTML` bez sanityzacji
  - **Rozwiązanie:** `npm install dompurify @types/dompurify` + sanityzacja przed renderowaniem
  - **Ryzyko:** XSS vulnerability
  
- [ ] **[KRYTYCZNE]** Szyfrowanie tokena w localStorage lub migracja do secure storage
  - **Lokalizacja:** `src/services/ConfigurationProvider.ts:67`
  - **Problem:** Token API przechowywany plain text
  - **Rozwiązanie:** Crypto API do szyfrowania lub ostrzeżenie użytkownika
  - **Ryzyko:** Credential exposure

- [ ] **[WYSOKIE]** Dodać HTTPS enforcement warning
  - **Lokalizacja:** `src/services/ConfigurationProvider.ts`
  - **Problem:** Brak walidacji czy URLe używają HTTPS
  - **Rozwiązanie:** Walidacja + warning dla HTTP URLs

### P1.2 - Error Handling & Stability
- [ ] **[KRYTYCZNE]** Dodać Error Boundary component
  - **Lokalizacja:** `src/App.tsx`
  - **Problem:** Brak global error catching
  - **Rozwiązanie:** Stwórz `ErrorBoundary.tsx` z fallback UI
  - **Benefit:** Zapobiega white screen of death

- [ ] **[KRYTYCZNE]** Usunąć nadmierne console.log z produkcji
  - **Lokalizacja:** `src/services/ConfigurationProvider.ts` (10+ wystąpień)
  - **Problem:** Debug logs w production build
  - **Rozwiązanie:** `if (import.meta.env.DEV)` wrapper lub logger service
  
- [ ] **[WYSOKIE]** Walidacja URL przed zapisem w ConfigurationProvider
  - **Lokalizacja:** `src/services/ConfigurationProvider.ts:78-85`
  - **Problem:** Brak walidacji formatów URL
  - **Rozwiązanie:** Dodać `validateUrl(url: string): boolean` helper

- [ ] **[WYSOKIE]** Retry mechanism dla failed API requests
  - **Lokalizacja:** `src/services/qdrantApi.ts`, `src/services/openRouterService.ts`
  - **Problem:** Single point of failure na network errors
  - **Rozwiązanie:** Exponential backoff retry logic
  - **Benefit:** Lepsza resilience

- [ ] **[ŚREDNIE]** Dodać timeout handling dla długich operacji
  - **Lokalizacja:** `src/services/qdrantApi.ts:176-291`
  - **Problem:** Brak timeout dla `uploadAndProcessFile`
  - **Rozwiązanie:** AbortController + timeout parameter

---

## ⚠️ PRIORYTET 2 - Performance & UX

### P2.1 - Performance Optimization
- [ ] **[WYSOKIE]** Virtual scrolling dla `PointsViewer`
  - **Lokalizacja:** `src/components/PointsViewer.tsx`
  - **Problem:** Rendering wszystkich punktów naraz (może być 1000+)
  - **Rozwiązanie:** `@tanstack/react-virtual` lub `react-window`
  - **Benefit:** 10x faster rendering dla dużych dataset

- [ ] **[WYSOKIE]** Virtual scrolling dla `SearchResults`
  - **Lokalizacja:** `src/components/SearchComponent.tsx:144-179`
  - **Problem:** Brak paginacji/wirtualizacji
  - **Rozwiązanie:** Virtual list lub pagination

- [ ] **[WYSOKIE]** Debounce w search input
  - **Lokalizacja:** `src/components/SearchComponent.tsx:70-78`
  - **Problem:** Potencjalnie za dużo API calls przy typing
  - **Rozwiązanie:** `useDebouncedValue` hook (300ms delay)

- [ ] **[ŚREDNIE]** Optymalizacja re-renderów w ChatInterface
  - **Lokalizacja:** `src/components/ChatInterface.tsx`
  - **Problem:** Brak memoizacji callbacks
  - **Rozwiązanie:** `useCallback` dla handlers, `useMemo` dla derived state

- [ ] **[ŚREDNIE]** Lazy loading dla modali
  - **Lokalizacja:** `src/components/QdrantGUI.tsx`
  - **Problem:** Wszystkie modale wczytywane od razu
  - **Rozwiązanie:** `lazy(() => import('./SettingsModal'))` + Suspense

- [ ] **[ŚREDNIE]** Code splitting per route/tab
  - **Lokalizacja:** `src/components/QdrantGUI.tsx:130-147`
  - **Problem:** Cała aplikacja w jednym bundle
  - **Rozwiązanie:** Dynamic imports dla tabs

### P2.2 - UX Improvements
- [ ] **[WYSOKIE]** Loading skeletons zamiast spinners
  - **Lokalizacja:** Multiple (CollectionList, SearchComponent, ChatMessages)
  - **Problem:** Generic spinners - słaby UX
  - **Rozwiązanie:** Content-aware skeleton screens
  - **Benefit:** Perceived performance +30%

- [ ] **[WYSOKIE]** Toast notifications zamiast `alert()`
  - **Lokalizacja:** `src/hooks/useCollections.ts` (8 wystąpień `alert()`)
  - **Problem:** Blocking alerts
  - **Rozwiązanie:** Toast library (np. `react-hot-toast`) lub custom component

- [ ] **[ŚREDNIE]** Progress indicators dla długich operacji
  - **Lokalizacja:** `src/components/CollectionList.tsx`
  - **Problem:** Tylko spinner, brak progressu
  - **Rozwiązanie:** Real progress bars z ETA

- [ ] **[ŚREDNIE]** Empty states z actionable CTAs
  - **Lokalizacja:** `src/components/CollectionList.tsx:233-234`
  - **Problem:** "No collections found" - brak guidance
  - **Rozwiązanie:** Ilustracja + "Create your first collection" button

- [ ] **[ŚREDNIE]** Confirm dialogs z preview
  - **Lokalizacja:** `src/components/CollectionList.tsx:276-280`
  - **Problem:** Generic confirm() - brak context
  - **Rozwiązanie:** Custom modal z preview collection details

---

## 💡 PRIORYTET 3 - Code Quality & Maintainability

### P3.1 - Style Refactoring
- [ ] **[WYSOKIE]** Podział `_qdrant-gui.scss` (1288 linii!)
  - **Lokalizacja:** `src/styles/_qdrant-gui.scss`
  - **Problem:** Monolityczny plik, trudny w utrzymaniu
  - **Rozwiązanie:** Split na:
    - `_collections.scss` (collection list styles)
    - `_search.scss` (search component styles)
    - `_settings-modal.scss` (settings modal - już zdefiniowany osobno?)
    - `_forms.scss` (reusable form styles)
  - **Benefit:** Lepszy maintainability, tree-shaking

- [ ] **[WYSOKIE]** Usunięcie duplikacji CSS dla settings modal
  - **Lokalizacja:** `src/styles/_qdrant-gui.scss:842-1092` i `1093-1249`
  - **Problem:** Settings modal defined twice
  - **Rozwiązanie:** Merge & deduplicate

- [ ] **[ŚREDNIE]** Standaryzacja units (px vs rem)
  - **Lokalizacja:** Wszystkie pliki SCSS
  - **Problem:** Mix px i rem - inconsistent
  - **Rozwiązanie:** Migrate wszystko do rem dla better accessibility

- [ ] **[ŚREDNIE]** CSS Variables zamiast SCSS variables dla themable colors
  - **Lokalizacja:** `src/styles/_variables.scss`
  - **Problem:** SCSS vars nie są runtime-changeable
  - **Rozwiązanie:** CSS custom properties dla colors
  - **Benefit:** Dynamic theming bez rebuild

### P3.2 - TypeScript & Type Safety
- [ ] **[ŚREDNIE]** Enable TypeScript strict mode
  - **Lokalizacja:** `tsconfig.json`
  - **Problem:** Potencjalne type errors nie są catchowane
  - **Rozwiązanie:** `"strict": true` + fix violations

- [ ] **[ŚREDNIE]** Dodać proper typing dla API responses
  - **Lokalizacja:** `src/services/qdrantApi.ts`
  - **Problem:** `any` types w niektórych miejscach
  - **Rozwiązanie:** Define proper interfaces

- [ ] **[NISKIE]** Extract magic strings do constants
  - **Lokalizacja:** Multiple files
  - **Problem:** Hardcoded strings ('app-config', 'chat-enabled-tools')
  - **Rozwiązanie:** Constants file

### P3.3 - Component Architecture
- [ ] **[WYSOKIE]** Rozbić `QdrantGUI` component
  - **Lokalizacja:** `src/components/QdrantGUI.tsx` (180 linii)
  - **Problem:** Too many responsibilities
  - **Rozwiązanie:** Extract:
    - `CollectionManager.tsx` (collections CRUD)
    - `DocumentExplorer.tsx` (browsing/viewing)
    - `SearchTab.tsx` (search functionality)

- [ ] **[ŚREDNIE]** Extract reusable `Button` component
  - **Lokalizacja:** Multiple files
  - **Problem:** Inconsistent button styles/props
  - **Rozwiązanie:** Shared `Button.tsx` with variants

- [ ] **[ŚREDNIE]** Extract reusable `Modal` component
  - **Lokalizacja:** Multiple modal implementations
  - **Problem:** Code duplication
  - **Rozwiązanie:** Base `Modal.tsx` component

### P3.4 - State Management
- [ ] **[ŚREDNIE]** Consider context API dla global state
  - **Lokalizacja:** Props drilling w `QdrantGUI.tsx`
  - **Problem:** Passing selectedCollection przez wiele levels
  - **Rozwiązanie:** `AppContext` provider

- [ ] **[NISKIE]** Migrate localStorage logic do hooks
  - **Lokalizacja:** Scattered localStorage calls
  - **Problem:** Direct localStorage access w components
  - **Rozwiązanie:** `useLocalStorage` hook

---

## ♿ PRIORYTET 4 - Accessibility (a11y)

### P4.1 - Keyboard Navigation
- [ ] **[WYSOKIE]** Keyboard navigation w modalach
  - **Lokalizacja:** All modals
  - **Problem:** Brak Esc to close, Tab trapping
  - **Rozwiązanie:** `useKeyboardNavigation` hook + focus trap

- [ ] **[ŚREDNIE]** Focus management po modal open/close
  - **Lokalizacja:** All modals
  - **Problem:** Focus nie wraca do triggering element
  - **Rozwiązanie:** `useFocusReturn` hook

- [ ] **[ŚREDNIE]** Keyboard shortcuts
  - **Lokalizacja:** Global app
  - **Problem:** Brak shortcuts dla power users
  - **Rozwiązanie:** 
    - `Ctrl+K` - Search
    - `Ctrl+N` - New collection
    - `Esc` - Close modals

### P4.2 - ARIA & Screen Readers
- [ ] **[WYSOKIE]** Dodać aria-labels do buttons
  - **Lokalizacja:** `src/components/CollectionList.tsx`, wszystkie buttony
  - **Problem:** Buttons bez descriptive labels (tylko ikony)
  - **Rozwiązanie:** `aria-label="Export collection"` etc.

- [ ] **[ŚREDNIE]** ARIA live regions dla notifications
  - **Lokalizacja:** Toast/alert system
  - **Problem:** Screen readers nie announceują zmian
  - **Rozwiązanie:** `<div role="alert" aria-live="polite">`

- [ ] **[ŚREDNIE]** Semantic HTML improvements
  - **Lokalizacja:** Multiple components
  - **Problem:** Div soup
  - **Rozwiązanie:** Use `<nav>`, `<main>`, `<section>`, `<article>`

### P4.3 - Visual Accessibility
- [ ] **[ŚREDNIE]** Contrast ratio audit
  - **Lokalizacja:** All text/background combinations
  - **Problem:** Niektóre kombinacje nie spełniają WCAG AA
  - **Rozwiązanie:** Lighthouse audit + fix violations

- [ ] **[NISKIE]** Focus visible styles
  - **Lokalizacja:** All interactive elements
  - **Problem:** Słabo widoczny focus indicator
  - **Rozwiązanie:** Custom focus-visible styles z wysokim kontrastem

---

## ✨ PRIORYTET 5 - New Features

### P5.1 - Chat Enhancements
- [ ] **[WYSOKIE]** Export chat history
  - **Lokalizacja:** `src/components/ChatInterface.tsx`
  - **Problem:** Brak możliwości zapisu konwersacji
  - **Rozwiązanie:** Export to JSON/Markdown button

- [ ] **[ŚREDNIE]** Search in chat history
  - **Lokalizacja:** `src/components/ChatInterface.tsx`
  - **Problem:** Trudne znalezienie poprzednich odpowiedzi
  - **Rozwiązanie:** Search input z highlighting

- [ ] **[ŚREDNIE]** Auto-save chat drafts
  - **Lokalizacja:** `src/components/ChatInput.tsx`
  - **Problem:** Loss of unsent messages
  - **Rozwiązanie:** localStorage draft persistence

- [ ] **[NISKIE]** Code copy button w code blocks
  - **Lokalizacja:** `src/components/ChatMessages.tsx:30-47`
  - **Problem:** Trzeba manualnie select & copy
  - **Rozwiązanie:** Copy button overlay na hover

- [ ] **[NISKIE]** Regenerate response button
  - **Lokalizacja:** `src/components/ChatMessages.tsx`
  - **Problem:** Brak możliwości re-try
  - **Rozwiązanie:** Regenerate button przy AI messages

### P5.2 - Collection Management
- [ ] **[ŚREDNIE]** Batch operations na collections
  - **Lokalizacja:** `src/components/CollectionList.tsx`
  - **Problem:** Can't delete/export multiple collections
  - **Rozwiązanie:** Checkboxes + batch actions

- [ ] **[NISKIE]** Collection tagging/categorization
  - **Lokalizacja:** Collection metadata
  - **Problem:** Hard to organize many collections
  - **Rozwiązanie:** Tags system

- [ ] **[NISKIE]** Collection search/filter
  - **Lokalizacja:** `src/components/CollectionList.tsx`
  - **Problem:** Long list hard to navigate
  - **Rozwiązanie:** Search input

### P5.3 - Search Enhancements
- [ ] **[ŚREDNIE]** Search history
  - **Lokalizacja:** `src/components/SearchComponent.tsx`
  - **Problem:** Can't reuse previous queries
  - **Rozwiązanie:** Recent searches dropdown

- [ ] **[NISKIE]** Saved searches
  - **Lokalizacja:** `src/components/SearchComponent.tsx`
  - **Problem:** Repeating same searches
  - **Rozwiązanie:** Bookmark searches feature

---

## 🌍 PRIORYTET 6 - Internationalization & Localization

### P6.1 - Language Consistency
- [ ] **[WYSOKIE]** Unifikacja języka error messages
  - **Lokalizacja:** Cała aplikacja
  - **Problem:** Mix Polish & English
  - **Rozwiązanie:** Consistent Polish everywhere lub i18n

- [ ] **[ŚREDNIE]** i18n setup (opcjonalne)
  - **Lokalizacja:** Global
  - **Problem:** Hard-coded strings
  - **Rozwiązanie:** `preact-i18next` + translation files

---

## 📱 PRIORYTET 7 - Mobile & Responsive

### P7.1 - Mobile UX
- [ ] **[WYSOKIE]** Mobile navigation improvements
  - **Lokalizacja:** `src/components/QdrantGUI.tsx`
  - **Problem:** Horizontal scrolling na mobile
  - **Rozwiązanie:** Hamburger menu + better touch targets

- [ ] **[ŚREDNIE]** Touch-friendly button sizes
  - **Lokalizacja:** All buttons
  - **Problem:** Buttons < 44px touch target
  - **Rozwiązanie:** Minimum 44x44px for mobile

- [ ] **[ŚREDNIE]** Mobile-optimized modals
  - **Lokalizacja:** All modals
  - **Problem:** Modals overflow na małych ekranach
  - **Rozwiązanie:** Full-screen modals < 768px

---

## 🧪 PRIORYTET 8 - Testing & DevOps

### P8.1 - Testing
- [ ] **[WYSOKIE]** Unit tests dla critical services
  - **Lokalizacja:** `src/services/`
  - **Problem:** Brak testów
  - **Rozwiązanie:** Vitest + testy dla qdrantApi, ConfigurationProvider

- [ ] **[ŚREDNIE]** Component tests
  - **Lokalizacja:** `src/components/`
  - **Problem:** Brak testów UI
  - **Rozwiązanie:** Testing Library tests

- [ ] **[NISKIE]** E2E tests
  - **Lokalizacja:** Global
  - **Problem:** Manual testing only
  - **Rozwiązanie:** Playwright tests dla critical flows

### P8.2 - DevOps
- [ ] **[ŚREDNIE]** CI/CD pipeline
  - **Lokalizacja:** Repository root
  - **Problem:** Manual deployment
  - **Rozwiązanie:** GitHub Actions workflow

- [ ] **[NISKIE]** Performance monitoring
  - **Lokalizacja:** Global
  - **Problem:** No metrics
  - **Rozwiązanie:** Web Vitals tracking

---

## 📝 Tracking

### Overall Progress
- **Total Tasks:** 85
- **Completed:** 0
- **In Progress:** 0
- **Blocked:** 0
- **Progress:** ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0%

### By Priority
- **P1 - Critical:** 0/8 (0%)
- **P2 - High:** 0/17 (0%)
- **P3 - Medium:** 0/19 (0%)
- **P4 - Accessibility:** 0/11 (0%)
- **P5 - Features:** 0/10 (0%)
- **P6 - i18n:** 0/2 (0%)
- **P7 - Mobile:** 0/3 (0%)
- **P8 - Testing:** 0/5 (0%)

---

## 🎯 Rekomendowany Order Wykonania

### Sprint 1 (Week 1) - Security & Stability
1. P1.1 - Security fixes (DOMPurify, token encryption)
2. P1.2 - Error Boundary + retry logic
3. P2.2 - Toast notifications
4. P3.1 - CSS refactoring (partial)

### Sprint 2 (Week 2) - Performance & UX
5. P2.1 - Virtual scrolling
6. P2.1 - Debounce & optimization
7. P2.2 - Loading skeletons
8. P3.3 - Component refactoring

### Sprint 3 (Week 3) - Accessibility & Quality
9. P4.1 - Keyboard navigation
10. P4.2 - ARIA improvements
11. P3.2 - TypeScript strict mode
12. P6.1 - Language consistency

### Sprint 4 (Week 4) - Features & Polish
13. P5.1 - Chat enhancements
14. P5.2 - Collection management
15. P7.1 - Mobile improvements
16. P8.1 - Basic testing setup

---

## 📚 Resources & Dependencies

### New Dependencies Required
```json
{
  "dompurify": "^3.0.0",
  "@types/dompurify": "^3.0.0",
  "react-hot-toast": "^2.4.0",
  "@tanstack/react-virtual": "^3.0.0",
  "vitest": "^1.0.0",
  "@testing-library/preact": "^3.2.3"
}
```

### Documentation to Create
- [ ] CONTRIBUTING.md
- [ ] ARCHITECTURE.md
- [ ] TESTING.md
- [ ] DEPLOYMENT.md

---

**Last Updated:** 2025-11-12  
**Next Review:** Po zakończeniu Sprint 1
