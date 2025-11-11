import { useState } from 'preact/hooks';
import type { Point } from '../types/types';
import CollectionList from './CollectionList';
import PointsViewer from './PointsViewer';
import PointDetailsModal from './PointDetailsModal';
import { useCollections } from '../hooks/useCollections';

function QdrantGUI() {
  console.log('QdrantGUI component rendered');
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
    points,
    pointsLoading,
    selectedPoint,
    browseCollection,
    exportCollection,
    createCollection,
    deleteCollection,
    uploadFile,
    setSelectedPoint,
    closePointsViewer,
  } = useCollections();

  return (
    <div className="qdrant-gui">
      <CollectionList
        collections={collections}
        loading={loading}
        error={error}
        browsing={browsing}
        exporting={exporting}
        creating={creating}
        deleting={deleting}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onBrowse={browseCollection}
        onExport={exportCollection}
        onCreate={createCollection}
        onDelete={deleteCollection}
        onUpload={uploadFile}
      />
      {browsing && (
        <PointsViewer
          collectionName={browsing}
          points={points}
          loading={pointsLoading}
          onClose={closePointsViewer}
          onViewDetails={setSelectedPoint}
        />
      )}
      {selectedPoint && (
        <PointDetailsModal
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
        />
      )}
    </div>
  );
}

export default QdrantGUI;