import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
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
          <div className="points-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Payload</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {points
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((point, index) => (
                  <tr key={(currentPage - 1) * itemsPerPage + index}>
                    <td>{point.id}</td>
                    <td className="payload-cell">
                      {point.payload ?
                        JSON.stringify(point.payload).slice(0, 100) + (JSON.stringify(point.payload).length > 100 ? '...' : '') :
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
                ))}
              </tbody>
            </table>
          </div>
          {points.length > itemsPerPage && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {Math.ceil(points.length / itemsPerPage)}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(points.length / itemsPerPage), prev + 1))}
                disabled={currentPage === Math.ceil(points.length / itemsPerPage)}
              >
                Next
              </button>
            </div>
          )}
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