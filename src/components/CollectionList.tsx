import { h } from 'preact';
import { useState } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import type { Collection } from '../types/types';
import { CollectionSkeleton } from './SkeletonComponents';

// Lazy load modal to reduce bundle size
const ProgressModal = lazy(() => import('./ProgressModal'));

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
  uploadCompleted: boolean;
  uploadCompletionMessage: string | null;
  onBrowse: (collectionName: string) => void;
  onExport: (collectionName: string) => void;
  onCreate: (collectionName: string, vectorSize: number) => void;
  onDelete: (collectionName: string) => void;
  onUpload: (file: File, collectionName: string, chunkSize: number, chunkOverlap: number) => void;
  onCloseUploadModal: () => void;
  onCloseBrowsing: () => void;
  onOpenSettings: () => void;
  selectedCollection?: string;
  onSelectCollection?: (collectionName: string) => void;
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
  uploadCompleted,
  uploadCompletionMessage,
  onBrowse,
  onExport,
  onCreate,
  onDelete,
  onUpload,
  onCloseUploadModal,
  onCloseBrowsing,
  onOpenSettings,
  selectedCollection,
  onSelectCollection,
}: CollectionListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [vectorSize, setVectorSize] = useState(1024);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCollectionName, setUploadCollectionName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
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
            className="settings-btn"
            onClick={onOpenSettings}
            title="Application Settings"
          >
            ⚙️ Settings
          </button>
          <button
            className="create-collection-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Collection'}
          </button>
          <button className="upload-file-btn" onClick={() => setShowUploadForm(!showUploadForm)}>
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
              onInput={e => setNewCollectionName((e.target as HTMLInputElement).value)}
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
              onInput={e => setVectorSize(parseInt((e.target as HTMLInputElement).value) || 1024)}
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
              onChange={e => setUploadCollectionName((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">Select existing collection...</option>
              {collections.map(collection => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} (Vectors: {collection.vectors_count}, Points:{' '}
                  {collection.points_count})
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
                onInput={e => setChunkSize(parseInt((e.target as HTMLInputElement).value) || 1000)}
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
                onInput={e =>
                  setChunkOverlap(parseInt((e.target as HTMLInputElement).value) || 200)
                }
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

      {loading && <CollectionSkeleton />}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && (
        <ul className="collections-list">
          {collections.length === 0 ? (
            <li className="empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">📚</div>
                <h3>No collections found</h3>
                <p>Get started by creating your first collection to store and search your documents.</p>
                <button 
                  className="btn btn-primary create-first-btn"
                  onClick={() => {
                    // Focus on the create collection form
                    const createForm = document.querySelector('.create-collection-form input[type="text"]') as HTMLInputElement;
                    if (createForm) {
                      createForm.focus();
                      createForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  Create Your First Collection
                </button>
              </div>
            </li>
          ) : (
            collections.map(collection => (
              <li key={collection.name}>
                <div className="collection-info">
                  <strong>{collection.name}</strong> - Vectors: {collection.vectors_count}, Points:{' '}
                  {collection.points_count}
                </div>
                <div className="collection-actions">
                  {onSelectCollection && (
                    <button
                      className={`select-btn ${selectedCollection === collection.name ? 'selected' : ''}`}
                      onClick={() => onSelectCollection(collection.name)}
                    >
                      {selectedCollection === collection.name ? '✓ Selected' : 'Select'}
                    </button>
                  )}
                  {browsing === collection.name ? (
                    <button
                      className="stop-browse-btn"
                      onClick={onCloseBrowsing}
                    >
                      Stop Browsing
                    </button>
                  ) : (
                    <button
                      className="browse-btn"
                      onClick={() => onBrowse(collection.name)}
                    >
                      Browse
                    </button>
                  )}
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
                      setCollectionToDelete(collection);
                      setShowDeleteConfirm(true);
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && collectionToDelete && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-header">
              <h3>Delete Collection</h3>
            </div>
            <div className="delete-confirm-content">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete this collection? This action cannot be undone.</p>
              </div>
              <div className="collection-preview">
                <h4>Collection Details:</h4>
                <div className="preview-details">
                  <strong>Name:</strong> {collectionToDelete.name}<br />
                  <strong>Vectors:</strong> {collectionToDelete.vectors_count}<br />
                  <strong>Points:</strong> {collectionToDelete.points_count}
                </div>
              </div>
            </div>
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCollectionToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (collectionToDelete) {
                    onDelete(collectionToDelete.name);
                  }
                  setShowDeleteConfirm(false);
                  setCollectionToDelete(null);
                }}
                disabled={deleting === collectionToDelete.name}
              >
                {deleting === collectionToDelete.name ? 'Deleting...' : 'Delete Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <ProgressModal
          isOpen={(uploading !== null && uploadProgress !== null) || uploadCompleted}
          progress={uploadProgress || { current: 100, total: 100, stage: 'Completed' }}
          isCompleted={uploadCompleted}
          {...(uploadCompletionMessage && { completionMessage: uploadCompletionMessage })}
          onClose={onCloseUploadModal}
        />
      </Suspense>
    </div>
  );
}

export default CollectionList;
