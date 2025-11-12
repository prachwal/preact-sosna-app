import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { configProvider, type AppConfig } from '../services/ConfigurationProvider';
import ModelSelectionModal from './ModelSelectionModal';
import type { ModelInfo } from '../services/interfaces';
import { qdrantApi } from '../services/qdrantApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [config, setConfig] = useState<AppConfig>(configProvider.getConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(configProvider.getConfig());
      setTokenValid(null); // Reset validation state when modal opens
    }
  }, [isOpen]);

  const validateToken = async () => {
    if (!config.openRouterToken.trim()) {
      setTokenValid(false);
      return;
    }

    setIsValidatingToken(true);
    try {
      const isValid = await qdrantApi.validateToken();
      setTokenValid(isValid);
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
    } finally {
      setIsValidatingToken(false);
    }
  };

  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const models = await qdrantApi.getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleModelSelect = (model: ModelInfo) => {
    setConfig(prev => ({
      ...prev,
      selectedModel: model.id,
      selectedProvider: model.provider,
    }));
  };

  const handleOpenModelSelection = async () => {
    await loadAvailableModels();
    setShowModelSelection(true);
  };

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
              <div className="token-input-group">
                <input
                  id="openRouterToken"
                  type="password"
                  value={config.openRouterToken}
                  onChange={(e) => {
                    handleInputChange('openRouterToken', (e.target as HTMLInputElement).value);
                    setTokenValid(null); // Reset validation when token changes
                  }}
                  placeholder="sk-or-v1-..."
                  className="settings-input"
                />
                <button
                  type="button"
                  onClick={validateToken}
                  disabled={isValidatingToken || !config.openRouterToken.trim()}
                  className={`validate-token-btn ${tokenValid === true ? 'valid' : tokenValid === false ? 'invalid' : ''}`}
                >
                  {isValidatingToken ? '...' : tokenValid === true ? '✓' : tokenValid === false ? '✗' : 'Validate'}
                </button>
              </div>
              <small>API token for OpenRouter (optional, for future AI features)</small>
              {tokenValid === true && <small className="validation-success">✓ Token is valid</small>}
              {tokenValid === false && <small className="validation-error">✗ Token is invalid</small>}
            </div>

            <div className="form-group">
              <label>Selected AI Model:</label>
              <div className="model-selection-group">
                <div className="current-model-display">
                  <span className="current-model">
                    {config.selectedModel || 'No model selected'}
                  </span>
                  <span className="current-provider">
                    ({config.selectedProvider || 'unknown provider'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenModelSelection}
                  disabled={isLoadingModels}
                  className="select-model-btn"
                >
                  {isLoadingModels ? 'Loading...' : 'Select Model'}
                </button>
              </div>
              <small>Choose the AI model to use for text generation</small>
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

        <ModelSelectionModal
          isOpen={showModelSelection}
          onClose={() => setShowModelSelection(false)}
          onSelectModel={handleModelSelect}
          currentModel={config.selectedModel || ''}
          models={availableModels}
          providerName="OpenRouter"
        />
      </div>
    </div>
  );
}

export default SettingsModal;