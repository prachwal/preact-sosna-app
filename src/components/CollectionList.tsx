import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { Collection } from '../types/types';
import ProgressModal from './ProgressModal';

interface CollectionListProps {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  browsing: string | null;
  exporting: string | null;
  creating: string | null;
  deleting: string | null;
  uploading: string | null;
  uploadProgress: {
    current: number;
    total: number;
    stage: string;
  } | null;
  onBrowse: (collectionName: string) => void;
  onExport: (collectionName: string) => void;
  onCreate: (collectionName: string, vectorSize: number) => void;
  onDelete: (collectionName: string) => void;
  onUpload: (file: File, collectionName: string, chunkSize: number, chunkOverlap: number) => void;
}

function CollectionList({
  collections,
  loading,
  error,
  browsing,
  exporting,
  creating,
  deleting,
  uploading,
  uploadProgress,
  onBrowse,
  onExport,
  onCreate,
  onDelete,
  onUpload
}: CollectionListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [vectorSize, setVectorSize] = useState(1024);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCollectionName, setUploadCollectionName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const handleCreateSubmit = (e: Event) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      onCreate(newCollectionName.trim(), vectorSize);
      setNewCollectionName('');
      setVectorSize(1024);
      setShowCreateForm(false);
    }
  };

  const handleUploadSubmit = (e: Event) => {
    e.preventDefault();
    if (selectedFile && uploadCollectionName.trim()) {
      onUpload(selectedFile, uploadCollectionName.trim(), chunkSize, chunkOverlap);
      setSelectedFile(null);
      setUploadCollectionName('');
      setChunkSize(1000);
      setChunkOverlap(200);
      setShowUploadForm(false);
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="qdrant-gui">
      <div className="collections-header">
        <h2>Qdrant Collections</h2>
        <div className="header-actions">
          <button
            className="create-collection-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Collection'}
          </button>
          <button
            className="upload-file-btn"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? 'Cancel Upload' : 'Upload & Process File'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form className="create-collection-form" onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label htmlFor="collectionName">Collection Name:</label>
            <input
              id="collectionName"
              type="text"
              value={newCollectionName}
              onInput={(e) => setNewCollectionName((e.target as HTMLInputElement).value)}
              placeholder="Enter collection name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="vectorSize">Vector Size:</label>
            <input
              id="vectorSize"
              type="number"
              value={vectorSize}
              onInput={(e) => setVectorSize(parseInt((e.target as HTMLInputElement).value) || 1024)}
              min="1"
              max="4096"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={creating !== null}>
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {showUploadForm && (
        <form className="upload-file-form" onSubmit={handleUploadSubmit}>
          <h3>Upload and Process Document</h3>
          <div className="form-group">
            <label htmlFor="uploadFile">Select File:</label>
            <input
              id="uploadFile"
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              required
            />
            {selectedFile && (
              <div className="file-info">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="uploadCollectionName">Collection Name:</label>
            <select
              id="uploadCollectionName"
              value={uploadCollectionName}
              onChange={(e) => setUploadCollectionName((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">Select existing collection...</option>
              {collections.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} (Vectors: {collection.vectors_count}, Points: {collection.points_count})
                </option>
              ))}
            </select>
            <small>Choose an existing collection to add documents to</small>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="chunkSize">Chunk Size:</label>
              <input
                id="chunkSize"
                type="number"
                value={chunkSize}
                onInput={(e) => setChunkSize(parseInt((e.target as HTMLInputElement).value) || 1000)}
                min="100"
                max="5000"
              />
              <small>Characters per chunk</small>
            </div>
            <div className="form-group">
              <label htmlFor="chunkOverlap">Overlap:</label>
              <input
                id="chunkOverlap"
                type="number"
                value={chunkOverlap}
                onInput={(e) => setChunkOverlap(parseInt((e.target as HTMLInputElement).value) || 200)}
                min="0"
                max="1000"
              />
              <small>Characters of overlap between chunks</small>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={uploading !== null || !selectedFile}>
              {uploading ? 'Processing...' : 'Upload & Process'}
            </button>
            <button type="button" onClick={() => setShowUploadForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="loading">Loading collections...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && (
        <ul className="collections-list">
          {collections.length === 0 ? (
            <li>No collections found</li>
          ) : (
            collections.map((collection) => (
              <li key={collection.name}>
                <div className="collection-info">
                  <strong>{collection.name}</strong> - Vectors: {collection.vectors_count}, Points: {collection.points_count}
                </div>
                <div className="collection-actions">
                  <button
                    className="browse-btn"
                    onClick={() => onBrowse(collection.name)}
                    disabled={browsing === collection.name}
                  >
                    {browsing === collection.name ? 'Browsing...' : 'Browse'}
                  </button>
                  <button
                    className="export-btn"
                    onClick={() => onExport(collection.name)}
                    disabled={exporting === collection.name}
                  >
                    {exporting === collection.name ? 'Exporting...' : 'Export'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete collection "${collection.name}"? This action cannot be undone.`)) {
                        onDelete(collection.name);
                      }
                    }}
                    disabled={deleting === collection.name}
                  >
                    {deleting === collection.name ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
      <ProgressModal
        isOpen={uploading !== null && uploadProgress !== null}
        progress={uploadProgress!}
      />
    </div>
  );
}

export default CollectionList;