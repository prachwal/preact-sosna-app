import { useState } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import CollectionList from './CollectionList';
import ModelSelectionTabs from './ModelSelectionTabs';
import DocumentExplorer from './DocumentExplorer';
import { useCollections } from '../hooks/useCollections';
import { usePointNavigation } from '../hooks/usePointNavigation';
import { useAppContext } from '../contexts/AppContext';

// Lazy load tabs for code splitting
const SearchTab = lazy(() => import('./SearchTab'));
const ChatTab = lazy(() => import('./ChatTab'));

// Lazy load modals to reduce initial bundle size
const SettingsModal = lazy(() => import('./SettingsModal'));

function QdrantGUI() {
  console.log('QdrantGUI component rendered');

  // Get global state from context
  const { selectedCollection, setSelectedCollection, collections: contextCollections } = useAppContext();

  const {
    collections,
    loading,
    error,
    exporting,
    browsing,
    creating,
    deleting,
    uploading,
    uploadProgress,
    uploadCompleted,
    uploadCompletionMessage,
    points,
    pointsLoading,
    browseCollection,
    exportCollection,
    createCollection,
    deleteCollection,
    uploadFile,
    closeUploadModal,
    closePointsViewer,
    selectCollection,
    // Search properties
    searchQuery,
    searchResults,
    searching,
    searchOptions,
    setSearchQuery,
    setSearchOptions,
    performSearch,
    clearSearchResults,
  } = useCollections();

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  // Tab state
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');

  // Point navigation logic
  const {
    currentPointIndex,
    selectedPoint,
    navigateToPoint,
    navigateToPrevious,
    navigateToNext,
    closePointNavigation,
    hasPrevious,
    hasNext,
  } = usePointNavigation(points);

  const handleClosePointsViewer = () => {
    closePointNavigation();
    closePointsViewer();
  };

  return (
    <div className="qdrant-gui">
      <CollectionList
        collections={contextCollections}
        loading={loading}
        error={error}
        browsing={browsing}
        exporting={exporting}
        creating={creating}
        deleting={deleting}
        uploading={uploading}
        uploadProgress={uploadProgress}
        uploadCompleted={uploadCompleted}
        uploadCompletionMessage={uploadCompletionMessage}
        onBrowse={browseCollection}
        onExport={exportCollection}
        onCreate={createCollection}
        onDelete={deleteCollection}
        onUpload={uploadFile}
        onCloseUploadModal={closeUploadModal}
        onCloseBrowsing={closePointsViewer}
        onOpenSettings={() => setShowSettings(true)}
        selectedCollection={selectedCollection}
        onSelectCollection={setSelectedCollection}
      />

      <ModelSelectionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'search' && (
        <Suspense fallback={<div>Loading search...</div>}>
          <SearchTab
            collections={contextCollections}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            searchOptions={searchOptions}
            selectedCollection={selectedCollection}
            onSearchQueryChange={setSearchQuery}
            onSearchOptionsChange={setSearchOptions}
            onPerformSearch={performSearch}
            onClearResults={clearSearchResults}
          />
        </Suspense>
      )}

      {activeTab === 'chat' && (
        <Suspense fallback={<div>Loading chat...</div>}>
          <ChatTab />
        </Suspense>
      )}

      <DocumentExplorer
        browsing={browsing}
        points={points}
        pointsLoading={pointsLoading}
        selectedPoint={selectedPoint}
        currentPointIndex={currentPointIndex}
        totalPoints={points.length}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onClosePointsViewer={handleClosePointsViewer}
        onViewPointDetails={navigateToPoint}
        onNavigatePrevious={navigateToPrevious}
        onNavigateNext={navigateToNext}
        onClosePointDetails={() => navigateToPoint(null)}
      />

      <Suspense fallback={<div>Loading...</div>}>
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </Suspense>
    </div>
  );
}

export default QdrantGUI;