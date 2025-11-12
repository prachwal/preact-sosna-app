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

  // Navigation state
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(-1);

  // Navigation functions
  const navigateToPoint = (point: Point | null) => {
    if (point && points.length > 0) {
      const index = points.findIndex(p => p.id === point.id);
      setCurrentPointIndex(index);
    } else {
      setCurrentPointIndex(-1);
    }
    setSelectedPoint(point);
  };

  const navigateToPrevious = () => {
    if (currentPointIndex > 0) {
      const newIndex = currentPointIndex - 1;
      const point = points[newIndex];
      if (point) {
        setCurrentPointIndex(newIndex);
        setSelectedPoint(point);
      }
    }
  };

  const navigateToNext = () => {
    if (currentPointIndex < points.length - 1) {
      const newIndex = currentPointIndex + 1;
      const point = points[newIndex];
      if (point) {
        setCurrentPointIndex(newIndex);
        setSelectedPoint(point);
      }
    }
  };

  const handleClosePointsViewer = () => {
    setCurrentPointIndex(-1);
    setSelectedPoint(null);
    closePointsViewer();
  };

  const hasPrevious = currentPointIndex > 0;
  const hasNext = currentPointIndex < points.length - 1;

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
          key={browsing}
          collectionName={browsing}
          points={points}
          loading={pointsLoading}
          onClose={handleClosePointsViewer}
          onViewDetails={navigateToPoint}
        />
      )}
      {selectedPoint && (
        <PointDetailsModal
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          onPrevious={navigateToPrevious}
          onNext={navigateToNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          chunkIndex={currentPointIndex}
          totalChunks={points.length}
        />
      )}
    </div>
  );
}

export default QdrantGUI;