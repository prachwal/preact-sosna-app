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
      console.log('[DEBUG] ConfigurationProvider.loadFromLocalStorage called');
      const stored = localStorage.getItem('app-config');
      console.log('[DEBUG] stored value:', stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[DEBUG] parsed config:', parsed);
        const result = {
          qdrantUrl: parsed.qdrantUrl || 'http://localhost:6333',
          embeddingUrl: parsed.embeddingUrl || 'http://localhost:8082',
          openRouterToken: parsed.openRouterToken || '',
          selectedModel: parsed.selectedModel,
          selectedProvider: parsed.selectedProvider,
          selectedCollection: parsed.selectedCollection,
        };
        console.log('[DEBUG] returning loaded config:', result);
        return result;
      }
      console.log('[DEBUG] no stored config, returning defaults');
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
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
    console.log('[DEBUG] returning default config:', defaults);
    return defaults;
  }

  private saveToLocalStorage(): void {
    try {
      console.log('[DEBUG] ConfigurationProvider.saveToLocalStorage called');
      console.log('[DEBUG] saving config:', this.config);
      localStorage.setItem('app-config', JSON.stringify(this.config));
      console.log('[DEBUG] config saved to localStorage');
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    console.log('[DEBUG] ConfigurationProvider.updateConfig called');
    console.log('[DEBUG] newConfig:', newConfig);
    console.log('[DEBUG] old config:', this.config);
    this.config = { ...this.config, ...newConfig };
    console.log('[DEBUG] new config after merge:', this.config);
    this.saveToLocalStorage();
  }

  getQdrantUrl(): string {
    return this.config.qdrantUrl;
  }

  getEmbeddingUrl(): string {
    return this.config.embeddingUrl;
  }

  getOpenRouterToken(): string {
    console.log('[DEBUG] ConfigurationProvider.getOpenRouterToken called');
    console.log('[DEBUG] returning:', this.config.openRouterToken);
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