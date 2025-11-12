import { encryptToken, decryptToken, isTokenEncrypted } from '../utils/encryption';
import { validateUrl, getUrlSecurityWarning } from '../utils/validation';
import { logger } from '../utils/logger';

export interface AppConfig {
  qdrantUrl: string;
  embeddingUrl: string;
  openRouterToken: string;
  selectedModel?: string;
  selectedProvider?: string;
  selectedCollection?: string;
}

export class ConfigurationProvider {
  private static instance: ConfigurationProvider;
  private config: AppConfig;

  private constructor() {
    // Load from localStorage or use defaults
    this.config = this.loadFromLocalStorage();
  }

  static getInstance(): ConfigurationProvider {
    if (!ConfigurationProvider.instance) {
      ConfigurationProvider.instance = new ConfigurationProvider();
    }
    return ConfigurationProvider.instance;
  }

  private loadFromLocalStorage(): AppConfig {
    try {
      logger.debug('ConfigurationProvider.loadFromLocalStorage called');
      const stored = localStorage.getItem('app-config');
      logger.debug('stored value:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        logger.debug('parsed config:', parsed);
        
        // Decrypt token if it's encrypted
        let openRouterToken = parsed.openRouterToken || '';
        if (openRouterToken && isTokenEncrypted(openRouterToken)) {
          logger.debug('Decrypting stored token');
          openRouterToken = decryptToken(openRouterToken);
        }
        
        const result = {
          qdrantUrl: parsed.qdrantUrl || 'http://localhost:6333',
          embeddingUrl: parsed.embeddingUrl || 'http://localhost:8082',
          openRouterToken,
          selectedModel: parsed.selectedModel,
          selectedProvider: parsed.selectedProvider,
          selectedCollection: parsed.selectedCollection,
        };
        logger.debug('returning loaded config:', { ...result, openRouterToken: result.openRouterToken ? '[REDACTED]' : '' });
        return result;
      }
      logger.debug('no stored config, returning defaults');
    } catch (error) {
      logger.warn('Failed to load config from localStorage:', error);
    }

    // Default configuration
    const defaults = {
      qdrantUrl: 'http://localhost:6333',
      embeddingUrl: 'http://localhost:8082',
      openRouterToken: '',
      selectedModel: 'anthropic/claude-3-haiku',
      selectedProvider: 'openrouter',
      selectedCollection: '',
    };
    logger.debug('returning default config');
    return defaults;
  }

  private saveToLocalStorage(): void {
    try {
      logger.debug('ConfigurationProvider.saveToLocalStorage called');
      
      // Encrypt token before saving
      const configToSave = {
        ...this.config,
        openRouterToken: this.config.openRouterToken ? encryptToken(this.config.openRouterToken) : ''
      };
      
      logger.debug('saving config (token encrypted)');
      localStorage.setItem('app-config', JSON.stringify(configToSave));
      logger.debug('config saved to localStorage');
    } catch (error) {
      logger.warn('Failed to save config to localStorage:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    logger.debug('ConfigurationProvider.updateConfig called');
    logger.debug('newConfig:', { ...newConfig, openRouterToken: newConfig.openRouterToken ? '[REDACTED]' : undefined });
    
    // Validate URLs if provided
    if (newConfig.qdrantUrl && !validateUrl(newConfig.qdrantUrl)) {
      logger.error('Invalid Qdrant URL:', newConfig.qdrantUrl);
      throw new Error('Invalid Qdrant URL format');
    }
    if (newConfig.embeddingUrl && !validateUrl(newConfig.embeddingUrl)) {
      logger.error('Invalid Embedding URL:', newConfig.embeddingUrl);
      throw new Error('Invalid Embedding URL format');
    }
    
    // Check for security warnings
    if (newConfig.qdrantUrl) {
      const warning = getUrlSecurityWarning(newConfig.qdrantUrl);
      if (warning) logger.warn('Qdrant URL:', warning);
    }
    if (newConfig.embeddingUrl) {
      const warning = getUrlSecurityWarning(newConfig.embeddingUrl);
      if (warning) logger.warn('Embedding URL:', warning);
    }
    
    logger.debug('old config:', { ...this.config, openRouterToken: this.config.openRouterToken ? '[REDACTED]' : '' });
    this.config = { ...this.config, ...newConfig };
    logger.debug('new config after merge');
    this.saveToLocalStorage();
  }

  getQdrantUrl(): string {
    return this.config.qdrantUrl;
  }

  getEmbeddingUrl(): string {
    return this.config.embeddingUrl;
  }

  getOpenRouterToken(): string {
    logger.debug('ConfigurationProvider.getOpenRouterToken called');
    return this.config.openRouterToken;
  }

  setQdrantUrl(url: string): void {
    this.updateConfig({ qdrantUrl: url });
  }

  setEmbeddingUrl(url: string): void {
    this.updateConfig({ embeddingUrl: url });
  }

  setOpenRouterToken(token: string): void {
    this.updateConfig({ openRouterToken: token });
  }

  getSelectedModel(): string {
    return this.config.selectedModel || 'anthropic/claude-3-haiku';
  }

  getSelectedProvider(): string {
    return this.config.selectedProvider || 'openrouter';
  }

  setSelectedModel(model: string): void {
    this.updateConfig({ selectedModel: model });
  }

  setSelectedProvider(provider: string): void {
    this.updateConfig({ selectedProvider: provider });
  }

  getSelectedCollection(): string {
    return this.config.selectedCollection || '';
  }

  setSelectedCollection(collection: string): void {
    this.updateConfig({ selectedCollection: collection });
  }
}

// Export singleton instance
export const configProvider = ConfigurationProvider.getInstance();