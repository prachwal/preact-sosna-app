import { h } from 'preact';

interface ModelSelectionTabsProps {
  activeTab: 'search' | 'chat';
  onTabChange: (tab: 'search' | 'chat') => void;
}

function ModelSelectionTabs({ activeTab, onTabChange }: ModelSelectionTabsProps) {
  return (
    <div className="model-selection-tabs">
      <button
        className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
        onClick={() => onTabChange('search')}
      >
        Semantic Search
      </button>
      <button
        className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
        onClick={() => onTabChange('chat')}
      >
        Chat with AI
      </button>
    </div>
  );
}

export default ModelSelectionTabs;