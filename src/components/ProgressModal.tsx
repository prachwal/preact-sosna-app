import { h } from 'preact';

interface ProgressModalProps {
  isOpen: boolean;
  progress: {
    current: number;
    total: number;
    stage: string;
  };
}

function ProgressModal({ isOpen, progress }: ProgressModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="progress-modal-overlay">
      <div className="progress-modal">
        <div className="progress-modal-header">
          <h3>Processing Document</h3>
        </div>
        <div className="progress-modal-content">
          <div className="progress-stage">
            {progress.stage}
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
        </div>
      </div>
    </div>
  );
}

export default ProgressModal;