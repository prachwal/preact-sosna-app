import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Point } from '../types/types';

interface PointsViewerProps {
  collectionName: string;
  points: Point[];
  loading: boolean;
  onClose: () => void;
  onViewDetails: (point: Point) => void;
}

function PointsViewer({ collectionName, points, loading, onClose, onViewDetails }: PointsViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: points.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5,
  });

  // Render payload in structured format for table
  const renderPayloadForTable = (payload: Record<string, any>) => {
    if (!payload || Object.keys(payload).length === 0) {
      return 'No payload';
    }

    // Show fileName and chunk info in a compact format
    const fileName = payload.fileName;
    const chunkIndex = payload.chunkIndex;
    const totalChunks = payload.totalChunks;

    if (fileName && chunkIndex !== undefined && totalChunks) {
      return `${fileName} (${chunkIndex + 1}/${totalChunks})`;
    }

    // Fallback to structured format if specific fields not available
    const entries = Object.entries(payload);
    const displayText = entries
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
      .join(', ');

    // Truncate if too long
    return displayText.length > 100 ? displayText.slice(0, 100) + '...' : displayText;
  };

  // Handle URL pagination
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page') || '1');
    if (page > 0) {
      setCurrentPage(page);
    }
  }, []);

  useEffect(() => {
    // Update URL when page changes
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set('page', currentPage.toString());
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState({}, '', url.toString());
  }, [currentPage]);

  return (
    <div className="points-viewer">
      <h3>Points in collection: {collectionName}</h3>
      {loading ? (
        <p>Loading points...</p>
      ) : points.length === 0 ? (
        <p>No points found in this collection.</p>
      ) : (
        <div>
          <div className="points-table-container" ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
            <table className="points-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 1 }}>
                <tr>
                  <th>ID</th>
                  <th>Payload</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const point = points[virtualItem.index];
                  return (
                    <tr
                      key={point.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <td>{point.id}</td>
                      <td className="payload-cell">
                        {point.payload ?
                          renderPayloadForTable(point.payload) :
                          'No payload'
                        }
                      </td>
                      <td className="actions-cell">
                        <button
                          className="view-details-btn"
                          onClick={() => onViewDetails(point)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="points-count">
            Total points: {points.length}
          </div>
        </div>
      )}
      <button
        className="close-btn"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

export default PointsViewer;