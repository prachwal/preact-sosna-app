import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import { configProvider, type AppConfig } from '../services/ConfigurationProvider';
import type { ModelInfo } from '../services/interfaces';
import { qdrantApi } from '../services/qdrantApi';
import { formPersistenceService, type FormState } from '../services/formPersistenceService';

// Lazy load modal to reduce bundle size
const ModelSelectionModal = lazy(() => import('./ModelSelectionModal'));

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsFormState extends FormState {
  qdrantUrl: string;
  embeddingUrl: string;
  openRouterToken: string;
  selectedModel: string;
  selectedProvider: string;
}

function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const formId = 'application_settings';

  const defaultFormState: SettingsFormState = {
    qdrantUrl: 'http://localhost:6333',
    embeddingUrl: 'http://localhost:8082',
    openRouterToken: '',
    selectedModel: '',
    selectedProvider: '',
  };

  const [formState, setFormState] = useState<SettingsFormState>(() =>
    formPersistenceService.loadFormState(formId, defaultFormState)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Extract state variables for easier access
  const {
    qdrantUrl,
    embeddingUrl,
    openRouterToken,
    selectedModel,
    selectedProvider
  } = formState;

  // Save form state whenever it changes
  useEffect(() => {
    formPersistenceService.saveFormState(formId, formState);
  }, [formId, formState]);

  useEffect(() => {
    if (isOpen) {
      // Sync with current config when modal opens
      const currentConfig = configProvider.getConfig();
      setFormState({
        qdrantUrl: currentConfig.qdrantUrl,
        embeddingUrl: currentConfig.embeddingUrl,
        openRouterToken: currentConfig.openRouterToken,
        selectedModel: currentConfig.selectedModel || '',
        selectedProvider: currentConfig.selectedProvider || '',
      });
      setTokenValid(null); // Reset validation state when modal opens
    }
  }, [isOpen]);

  const validateToken = async () => {
    console.log('[DEBUG] validateToken called');
    console.log('[DEBUG] openRouterToken:', openRouterToken);
    console.log('[DEBUG] openRouterToken.trim():', openRouterToken.trim());
    console.log('[DEBUG] openRouterToken.length:', openRouterToken.length);

    if (!openRouterToken.trim()) {
      console.log('[DEBUG] Token is empty, setting invalid');
      setTokenValid(false);
      return;
    }

    setIsValidatingToken(true);
    try {
      // Temporarily update configProvider with current token for validation
      console.log('[DEBUG] Temporarily updating configProvider with current token');
      configProvider.updateConfig({ openRouterToken });

      console.log('[DEBUG] Calling qdrantApi.validateToken()');
      const isValid = await qdrantApi.validateToken();
      console.log('[DEBUG] Token validation result:', isValid);
      setTokenValid(isValid);
    } catch (error) {
      console.error('[DEBUG] Token validation error:', error);
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
    setFormState(prev => ({
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
    console.log('[DEBUG] SettingsModal.handleSave called');
    console.log('[DEBUG] formState.openRouterToken:', formState.openRouterToken);
    setIsSaving(true);
    try {
      // Update the global configuration
      console.log('[DEBUG] Calling configProvider.updateConfig');
      configProvider.updateConfig({
        qdrantUrl: formState.qdrantUrl,
        embeddingUrl: formState.embeddingUrl,
        openRouterToken: formState.openRouterToken,
        selectedModel: formState.selectedModel,
        selectedProvider: formState.selectedProvider,
      });

      // Save to persistent storage
      console.log('[DEBUG] Calling formPersistenceService.saveFormState');
      await formPersistenceService.saveFormState(formId, formState);

      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof SettingsFormState, value: string) => {
    setFormState(prev => ({
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

        <form className="settings-modal-content" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="settings-section">
            <h4>Vector Database</h4>
            <div className="form-group">
              <label htmlFor="qdrantUrl">Qdrant URL:</label>
              <input
                id="qdrantUrl"
                type="url"
                value={formState.qdrantUrl}
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
                value={formState.embeddingUrl}
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
                  value={formState.openRouterToken}
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
                  disabled={isValidatingToken || !formState.openRouterToken.trim()}
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
                    {formState.selectedModel || 'No model selected'}
                  </span>
                  <span className="current-provider">
                    ({formState.selectedProvider || 'unknown provider'})
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
        </form>

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

        <Suspense fallback={<div>Loading...</div>}>
          <ModelSelectionModal
            isOpen={showModelSelection}
            onClose={() => setShowModelSelection(false)}
            onSelectModel={handleModelSelect}
            currentModel={formState.selectedModel || ''}
            models={availableModels}
            providerName="OpenRouter"
          />
        </Suspense>
      </div>
    </div>
  );
}

export default SettingsModal;