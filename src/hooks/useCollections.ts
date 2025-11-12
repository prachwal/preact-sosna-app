import { useState, useEffect } from 'preact/hooks';
import type { Collection, Point } from '../types/types';
import type { SearchResult, SearchOptions } from '../services/interfaces';
import { qdrantApi } from '../services/qdrantApi';
import { configProvider } from '../services/ConfigurationProvider';
import { showErrorToast, showSuccessToast, showInfoToast } from '../utils/toast';

export interface UseCollectionsReturn {
  // State
  collections: Collection[];
  loading: boolean;
  error: string | null;
  exporting: string | null;
  browsing: string | null;
  creating: string | null;
  deleting: string | null;
  uploading: string | null;
  uploadProgress: {
    current: number;
    total: number;
    stage: string;
    startTime?: number;
  } | null;
  uploadCompleted: boolean;
  uploadCompletionMessage: string | null;
  points: Point[];
  pointsLoading: boolean;
  selectedPoint: Point | null;
  selectedCollection: string;
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  searchOptions: SearchOptions;

  // Actions
  fetchCollections: () => Promise<void>;
  browseCollection: (collectionName: string) => Promise<void>;
  exportCollection: (collectionName: string) => Promise<void>;
  createCollection: (collectionName: string, vectorSize: number) => Promise<void>;
  deleteCollection: (collectionName: string) => Promise<void>;
  uploadFile: (
    file: File,
    collectionName: string,
    chunkSize: number,
    chunkOverlap: number
  ) => Promise<void>;
  closeUploadModal: () => void;
  setSelectedPoint: (point: Point | null) => void;
  closePointsViewer: () => void;
  selectCollection: (collectionName: string) => void;
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchOptions: (options: SearchOptions) => void;
  performSearch: (collectionName: string) => Promise<void>;
  clearSearchResults: () => void;
}

export function useCollections(): UseCollectionsReturn {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    stage: string;
    startTime?: number;
  } | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadCompletionMessage, setUploadCompletionMessage] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>(configProvider.getSelectedCollection());
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    limit: 10,
    scoreThreshold: 0.0,
  });

  const fetchCollectionsData = async () => {
    console.log('Fetching collections...');
    try {
      const collections = await qdrantApi.fetchCollections();
      setCollections(collections);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseCollection = async (collectionName: string) => {
    console.log(`Starting browse for collection: ${collectionName}`);
    setBrowsing(collectionName);
    setPointsLoading(true);
    try {
      const points = await qdrantApi.browseCollection(collectionName);
      setPoints(points);
    } catch (err) {
      console.error('Browse failed:', err);
      showErrorToast(`Browse failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPointsLoading(false);
    }
  };

  const handleExportCollection = async (collectionName: string) => {
    console.log(`Starting export for collection: ${collectionName}`);
    setExporting(collectionName);
    try {
      await qdrantApi.exportCollection(collectionName);
      showSuccessToast(`Collection "${collectionName}" exported successfully`);
    } catch (err) {
      console.error('Export failed:', err);
      showErrorToast(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
      console.log('Export process finished for:', collectionName);
    }
  };

  const handleCreateCollection = async (collectionName: string, vectorSize: number) => {
    console.log(`Creating collection: ${collectionName}`);
    setCreating(collectionName);
    try {
      await qdrantApi.createCollection(collectionName, vectorSize);
      // Refresh collections list
      await fetchCollectionsData();
      showSuccessToast(`Collection "${collectionName}" created successfully`);
    } catch (err) {
      console.error('Create collection failed:', err);
      showErrorToast(`Create collection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(null);
    }
  };

  const handleDeleteCollection = async (collectionName: string) => {
    console.log(`Deleting collection: ${collectionName}`);
    setDeleting(collectionName);
    try {
      await qdrantApi.deleteCollection(collectionName);
      // Refresh collections list
      await fetchCollectionsData();
      // Close points viewer if the deleted collection was being browsed
      if (browsing === collectionName) {
        setBrowsing(null);
        setPoints([]);
      }
      showSuccessToast(`Collection "${collectionName}" deleted successfully`);
    } catch (err) {
      console.error('Delete collection failed:', err);
      showErrorToast(`Delete collection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadFile = async (
    file: File,
    collectionName: string,
    chunkSize: number,
    chunkOverlap: number
  ) => {
    console.log(`Starting file upload for collection: ${collectionName}`);
    setUploading(collectionName);
    const startTime = Date.now();
    setUploadProgress({ current: 0, total: 100, stage: 'Initializing...', startTime });
    setUploadCompleted(false);
    setUploadCompletionMessage(null);
    try {
      const result = await qdrantApi.uploadAndProcessFile(
        file,
        collectionName,
        chunkSize,
        chunkOverlap,
        (current: number, total: number, stage: string) => {
          setUploadProgress({ current, total, stage });
        }
      );
      console.log('Upload result:', result);
      setUploadProgress({ current: 100, total: 100, stage: 'Completed' });
      setUploadCompleted(true);
      setUploadCompletionMessage(
        `File processed successfully! ${result.chunksProcessed} chunks created, ${result.vectorsCreated} vectors stored.`
      );
      // Refresh collections list to show updated counts
      await fetchCollectionsData();
      showSuccessToast(`File "${file.name}" uploaded successfully to "${collectionName}"`);
    } catch (err) {
      console.error('Upload failed:', err);
      showErrorToast(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(null);
    }
  };

  const selectCollection = (collectionName: string) => {
    setSelectedCollection(collectionName);
    configProvider.setSelectedCollection(collectionName);
  };

  const closePointsViewer = () => {
    setBrowsing(null);
    setPoints([]);
  };

  const closeUploadModal = () => {
    setUploadCompleted(false);
    setUploadCompletionMessage(null);
    setUploadProgress(null);
  };

  const performSearch = async (collectionName: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    console.log(`Starting search in collection: ${collectionName} with query: "${searchQuery}"`);
    setSearching(true);
    try {
      const results = await qdrantApi.search(collectionName, searchQuery.trim(), searchOptions);
      setSearchResults(results);
      console.log(`Search completed. Found ${results.length} results`);
    } catch (err) {
      console.error('Search failed:', err);
      showErrorToast(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  useEffect(() => {
    fetchCollectionsData();
  }, []);

  return {
    // State
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
    selectedPoint,
    selectedCollection,
    // Search state
    searchQuery,
    searchResults,
    searching,
    searchOptions,

    // Actions
    fetchCollections: fetchCollectionsData,
    browseCollection: handleBrowseCollection,
    exportCollection: handleExportCollection,
    createCollection: handleCreateCollection,
    deleteCollection: handleDeleteCollection,
    uploadFile: handleUploadFile,
    closeUploadModal,
    setSelectedPoint,
    closePointsViewer,
    selectCollection,
    // Search actions
    setSearchQuery,
    setSearchOptions,
    performSearch,
    clearSearchResults,
  };
}
