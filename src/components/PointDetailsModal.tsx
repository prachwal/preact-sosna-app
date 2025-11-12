import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import type { Point } from '../types/types';
import VectorVisualization from './VectorVisualization';

interface PointDetailsModalProps {
  point: Point;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}

function PointDetailsModal({ point, onClose, onPrevious, onNext, hasPrevious, hasNext, chunkIndex, totalChunks }: PointDetailsModalProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && onPrevious && hasPrevious) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === 'ArrowRight' && onNext && hasNext) {
        event.preventDefault();
        onNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, hasPrevious, hasNext, onClose]);
  const renderPayload = (payload: Record<string, any>) => {
    if (!payload || Object.keys(payload).length === 0) {
      return <span className="no-data">No payload data</span>;
    }

    // Filter out chunkIndex and totalChunks as they're displayed in the header
    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== 'chunkIndex' && key !== 'totalChunks')
    );

    if (Object.keys(filteredPayload).length === 0) {
      return <span className="no-data">No payload data</span>;
    }

    return (
      <div className="payload-grid">
        {Object.entries(filteredPayload).map(([key, value]) => (
          <div key={key} className="payload-grid-item">
            <div className="payload-grid-key">{key}:</div>
            <div className="payload-grid-value">
              {typeof value === 'object' ?
                JSON.stringify(value, null, 2) :
                String(value)
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-navigation">
            <button
              className="nav-btn prev-btn"
              onClick={onPrevious}
              disabled={!hasPrevious}
              title="Previous chunk"
            >
              ‹
            </button>
            <button
              className="nav-btn next-btn"
              onClick={onNext}
              disabled={!hasNext}
              title="Next chunk"
            >
              ›
            </button>
          </div>
          {chunkIndex !== undefined && totalChunks !== undefined && (
            <div className="chunk-info">
              <span className="chunk-index">{chunkIndex + 1}</span>
              <span className="chunk-separator">/</span>
              <span className="chunk-total">{totalChunks}</span>
            </div>
          )}
          <h3>Point Details - ID: {point.id}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        {/* Payload at the top */}
        <div className="point-payload-top">
          <div className="detail-section">
            <h4>Payload</h4>
            <div className="detail-content">
              {point.payload ? renderPayload(point.payload) : 'No payload data'}
            </div>
          </div>
        </div>

        {/* Vector visualization below */}
        <div className="point-details">
          <div className="point-details-full">
            <div className="detail-section">
              <h4>Vector Visualization</h4>
              <div className="detail-content">
                {point.vector ? <VectorVisualization vector={point.vector} /> : 'No vector data'}
              </div>
            </div>
          </div>
        </div>

        {/* Dots at the bottom */}
        <div className="modal-footer-dots">
          <div className="dots-container">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PointDetailsModal;