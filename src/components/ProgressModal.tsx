import { h } from 'preact';

interface ProgressModalProps {
  isOpen: boolean;
  progress: {
    current: number;
    total: number;
    stage: string;
    startTime?: number;
  };
  isCompleted?: boolean;
  completionMessage?: string;
  onClose?: () => void;
}

function ProgressModal({ isOpen, progress, isCompleted = false, completionMessage, onClose }: ProgressModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round((progress.current / progress.total) * 100);

  // Calculate ETA
  const calculateETA = () => {
    if (!progress.startTime || progress.current === 0 || isCompleted) return null;
    
    const elapsed = Date.now() - progress.startTime;
    const progressRatio = progress.current / progress.total;
    const totalEstimated = elapsed / progressRatio;
    const remaining = totalEstimated - elapsed;
    
    if (remaining < 1000) return 'Almost done...';
    
    const seconds = Math.round(remaining / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s remaining`;
  };

  const eta = calculateETA();

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
          {eta && !isCompleted && (
            <div className="progress-eta">
              {eta}
            </div>
          )}
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