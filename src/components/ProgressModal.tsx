import { h } from 'preact';

interface ProgressModalProps {
  isOpen: boolean;
  progress: {
    current: number;
    total: number;
    stage: string;
  };
  isCompleted?: boolean;
  completionMessage?: string;
  onClose?: () => void;
}

function ProgressModal({ isOpen, progress, isCompleted = false, completionMessage, onClose }: ProgressModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="progress-modal-overlay">
      <div className="progress-modal">
        <div className="progress-modal-header">
          <h3>{isCompleted ? 'Processing Complete' : 'Processing Document'}</h3>
        </div>
        <div className="progress-modal-content">
          <div className="progress-stage">
            {isCompleted ? completionMessage : progress.stage}
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="progress-percentage">
            {percentage}%
          </div>
          <div className="progress-details">
            {progress.current} / {progress.total}
          </div>
          {isCompleted && onClose && (
            <div className="progress-modal-actions">
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressModal;