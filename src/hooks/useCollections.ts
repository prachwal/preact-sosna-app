import { useState, useEffect } from 'preact/hooks';
import type { Collection, Point } from '../types/types';
import { fetchCollections, browseCollection, exportCollection, createCollection, deleteCollection, uploadAndProcessFile } from '../services/qdrantApi';

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
  } | null;
  points: Point[];
  pointsLoading: boolean;
  selectedPoint: Point | null;

  // Actions
  fetchCollections: () => Promise<void>;
  browseCollection: (collectionName: string) => Promise<void>;
  exportCollection: (collectionName: string) => Promise<void>;
  createCollection: (collectionName: string, vectorSize: number) => Promise<void>;
  deleteCollection: (collectionName: string) => Promise<void>;
  uploadFile: (file: File, collectionName: string, chunkSize: number, chunkOverlap: number) => Promise<void>;
  setSelectedPoint: (point: Point | null) => void;
  closePointsViewer: () => void;
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
  } | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  const fetchCollectionsData = async () => {
    console.log('Fetching collections...');
    try {
      const collections = await fetchCollections();
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
      const points = await browseCollection(collectionName);
      setPoints(points);
    } catch (err) {
      console.error('Browse failed:', err);
      alert(`Browse failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPointsLoading(false);
    }
  };

  const handleExportCollection = async (collectionName: string) => {
    console.log(`Starting export for collection: ${collectionName}`);
    setExporting(collectionName);
    try {
      await exportCollection(collectionName);
    } catch (err) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
      console.log('Export process finished for:', collectionName);
    }
  };

  const handleCreateCollection = async (collectionName: string, vectorSize: number) => {
    console.log(`Creating collection: ${collectionName}`);
    setCreating(collectionName);
    try {
      await createCollection(collectionName, vectorSize);
      // Refresh collections list
      await fetchCollectionsData();
    } catch (err) {
      console.error('Create collection failed:', err);
      alert(`Create collection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(null);
    }
  };

  const handleDeleteCollection = async (collectionName: string) => {
    console.log(`Deleting collection: ${collectionName}`);
    setDeleting(collectionName);
    try {
      await deleteCollection(collectionName);
      // Refresh collections list
      await fetchCollectionsData();
      // Close points viewer if the deleted collection was being browsed
      if (browsing === collectionName) {
        setBrowsing(null);
        setPoints([]);
      }
    } catch (err) {
      console.error('Delete collection failed:', err);
      alert(`Delete collection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadFile = async (file: File, collectionName: string, chunkSize: number, chunkOverlap: number) => {
    console.log(`Starting file upload for collection: ${collectionName}`);
    setUploading(collectionName);
    setUploadProgress({ current: 0, total: 100, stage: 'Initializing...' });
    try {
      const result = await uploadAndProcessFile(
        file, 
        collectionName, 
        chunkSize, 
        chunkOverlap,
        (current: number, total: number, stage: string) => {
          setUploadProgress({ current, total, stage });
        }
      );
      console.log('Upload result:', result);
      alert(`File processed successfully! ${result.chunksProcessed} chunks created, ${result.vectorsCreated} vectors stored.`);
      // Refresh collections list to show updated counts
      await fetchCollectionsData();
    } catch (err) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(null);
      setUploadProgress(null);
    }
  };

  const closePointsViewer = () => {
    setBrowsing(null);
    setPoints([]);
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
    points,
    pointsLoading,
    selectedPoint,

    // Actions
    fetchCollections: fetchCollectionsData,
    browseCollection: handleBrowseCollection,
    exportCollection: handleExportCollection,
    createCollection: handleCreateCollection,
    deleteCollection: handleDeleteCollection,
    uploadFile: handleUploadFile,
    setSelectedPoint,
    closePointsViewer,
  };
}