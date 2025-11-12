import { lazy, Suspense } from 'preact/compat';
import type { Point } from '../types/types';
import PointsViewer from './PointsViewer';

// Lazy load modal to reduce bundle size
const PointDetailsModal = lazy(() => import('./PointDetailsModal'));

interface DocumentExplorerProps {
  browsing: string | null;
  points: Point[];
  pointsLoading: boolean;
  selectedPoint: Point | null;
  currentPointIndex: number;
  totalPoints: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onClosePointsViewer: () => void;
  onViewPointDetails: (point: Point | null) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onClosePointDetails: () => void;
}

export default function DocumentExplorer({
  browsing,
  points,
  pointsLoading,
  selectedPoint,
  currentPointIndex,
  totalPoints,
  hasPrevious,
  hasNext,
  onClosePointsViewer,
  onViewPointDetails,
  onNavigatePrevious,
  onNavigateNext,
  onClosePointDetails,
}: DocumentExplorerProps) {
  return (
    <>
      {browsing && (
        <PointsViewer
          key={browsing}
          collectionName={browsing}
          points={points}
          loading={pointsLoading}
          onClose={onClosePointsViewer}
          onViewDetails={onViewPointDetails}
        />
      )}
      {selectedPoint && (
        <Suspense fallback={<div>Loading...</div>}>
          <PointDetailsModal
            point={selectedPoint}
            onClose={onClosePointDetails}
            onPrevious={onNavigatePrevious}
            onNext={onNavigateNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            chunkIndex={currentPointIndex}
            totalChunks={totalPoints}
          />
        </Suspense>
      )}
    </>
  );
}