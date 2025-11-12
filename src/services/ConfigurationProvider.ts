export interface AppConfig {
  qdrantUrl: string;
  embeddingUrl: string;
  openRouterToken: string;
  selectedModel?: string;
  selectedProvider?: string;
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
      const stored = localStorage.getItem('app-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          qdrantUrl: parsed.qdrantUrl || 'http://localhost:6333',
          embeddingUrl: parsed.embeddingUrl || 'http://localhost:8082',
          openRouterToken: parsed.openRouterToken || '',
        };
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }

    // Default configuration
    return {
      qdrantUrl: 'http://localhost:6333',
      embeddingUrl: 'http://localhost:8082',
      openRouterToken: '',
      selectedModel: 'anthropic/claude-3-haiku',
      selectedProvider: 'openrouter',
    };
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('app-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveToLocalStorage();
  }

  getQdrantUrl(): string {
    return this.config.qdrantUrl;
  }

  getEmbeddingUrl(): string {
    return this.config.embeddingUrl;
  }

  getOpenRouterToken(): string {
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
}

// Export singleton instance
export const configProvider = ConfigurationProvider.getInstance();