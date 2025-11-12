import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { configProvider, type AppConfig } from '../services/ConfigurationProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<AppConfig>(configProvider.getConfig());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(configProvider.getConfig());
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      configProvider.updateConfig(config);
      // Small delay to show saving state
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof AppConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h3>Application Settings</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-section">
            <h4>Vector Database</h4>
            <div className="form-group">
              <label htmlFor="qdrantUrl">Qdrant URL:</label>
              <input
                id="qdrantUrl"
                type="url"
                value={config.qdrantUrl}
                onChange={(e) => handleInputChange('qdrantUrl', (e.target as HTMLInputElement).value)}
                placeholder="http://localhost:6333"
                className="settings-input"
              />
              <small>URL of your Qdrant vector database instance</small>
            </div>
          </div>

          <div className="settings-section">
            <h4>Text Embedding</h4>
            <div className="form-group">
              <label htmlFor="embeddingUrl">Embedding Service URL:</label>
              <input
                id="embeddingUrl"
                type="url"
                value={config.embeddingUrl}
                onChange={(e) => handleInputChange('embeddingUrl', (e.target as HTMLInputElement).value)}
                placeholder="http://localhost:8082"
                className="settings-input"
              />
              <small>URL of your text embedding service (Polish BERT API)</small>
            </div>
          </div>

          <div className="settings-section">
            <h4>AI Integration</h4>
            <div className="form-group">
              <label htmlFor="openRouterToken">OpenRouter API Token:</label>
              <input
                id="openRouterToken"
                type="password"
                value={config.openRouterToken}
                onChange={(e) => handleInputChange('openRouterToken', (e.target as HTMLInputElement).value)}
                placeholder="sk-or-v1-..."
                className="settings-input"
              />
              <small>API token for OpenRouter (optional, for future AI features)</small>
            </div>
          </div>

          <div className="settings-info">
            <p><strong>Note:</strong> Changes will take effect after restarting the application or refreshing the page.</p>
          </div>
        </div>

        <div className="settings-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;