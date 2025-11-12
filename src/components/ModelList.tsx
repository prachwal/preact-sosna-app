import { h } from 'preact';
import type { ModelInfo } from '../services/interfaces';

interface ModelListProps {
  models: ModelInfo[];
  currentModel?: string | undefined;
  onSelectModel: (model: ModelInfo) => void;
  conciseMode: boolean;
  showDebugInfo: boolean;
}

export function ModelList({
  models,
  currentModel,
  onSelectModel,
  conciseMode,
  showDebugInfo
}: ModelListProps) {
  const parsePrice = (price: number | string): number => {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = parsePrice(price);
    if (numPrice === 0) return 'Free';

    // Format price per 1K tokens for better readability
    if (numPrice < 0.01) {
      // Very small prices (likely per million tokens), convert to per 1K
      return `$${(numPrice * 1000).toFixed(6)}/1K`;
    } else {
      // Normal prices (likely per 1K tokens)
      return `$${numPrice.toFixed(4)}/1K`;
    }
  };

  return (
    <div className="model-list">
      {models.length === 0 ? (
        <div className="no-models">
          <p>Brak modeli spełniających kryteria filtrowania.</p>
        </div>
      ) : (
        models.map(model => (
          <div
            key={model.id}
            className={`model-item ${currentModel === model.id ? 'selected' : ''}`}
            onClick={() => onSelectModel(model)}
          >
            <div className="model-header">
              <h4>{model.name}</h4>
              {currentModel === model.id && <span className="current-badge">✓ Aktualny</span>}
            </div>

            {!conciseMode && (
              <div className="model-description">
                <p>{model.description}</p>
              </div>
            )}

            <div className="model-details">
              <div className="model-pricing">
                <span className="label">💰 Cena:</span>
                <span className="value">
                  {model.pricing ? (
                    <>
                      Input: {formatPrice(model.pricing.prompt)} |
                      Output: {formatPrice(model.pricing.completion)}
                    </>
                  ) : (
                    'Nieznana'
                  )}
                </span>
              </div>

              <div className="model-context">
                <span className="label">📏 Kontekst:</span>
                <span className="value">{model.contextLength?.toLocaleString() || 'Nieznany'} tokens</span>
              </div>

              <div className="model-provider">
                <span className="label">🏢 Provider:</span>
                <span className="value">{model.provider}</span>
              </div>

              {model.tags && model.tags.length > 0 && (
                <div className="model-tags">
                  <span className="label">🏷️ Tagi:</span>
                  <div className="tags">
                    {model.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {model.capabilities && (
                <div className="model-capabilities">
                  <span className="label">⚙️ Możliwości:</span>
                  <div className="capabilities">
                    {model.capabilities.toolUse && <span className="capability">🔧 Narzędzia</span>}
                    {model.capabilities.multimodal && <span className="capability">🎭 Multimodal</span>}
                    {model.capabilities.inputModalities?.includes('image') && <span className="capability">📷 Obrazy wej.</span>}
                    {model.capabilities.outputModalities?.includes('image') && <span className="capability">🖼️ Obrazy wyj.</span>}
                  </div>
                </div>
              )}
            </div>

            {showDebugInfo && (
              <div className="debug-info">
                <details>
                  <summary>Debug Info</summary>
                  <pre>{JSON.stringify(model, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}