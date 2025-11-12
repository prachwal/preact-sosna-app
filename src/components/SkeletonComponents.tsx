import { h } from 'preact';

/**
 * Loading skeleton components for better perceived performance
 */

export function CollectionSkeleton() {
  return (
    <div className="collection-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-text skeleton-title"></div>
        <div className="skeleton-text skeleton-subtitle"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-item">
          <div className="skeleton-text skeleton-name"></div>
          <div className="skeleton-text skeleton-count"></div>
        </div>
        <div className="skeleton-item">
          <div className="skeleton-text skeleton-name"></div>
          <div className="skeleton-text skeleton-count"></div>
        </div>
        <div className="skeleton-item">
          <div className="skeleton-text skeleton-name"></div>
          <div className="skeleton-text skeleton-count"></div>
        </div>
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="search-result-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-text skeleton-rank"></div>
        <div className="skeleton-text skeleton-score"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line short"></div>
        <div className="skeleton-metadata">
          <div className="skeleton-text skeleton-meta"></div>
          <div className="skeleton-text skeleton-meta"></div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="chat-message-skeleton">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-content">
        <div className="skeleton-text skeleton-line"></div>
        <div className="skeleton-text skeleton-line short"></div>
        <div className="skeleton-text skeleton-line"></div>
      </div>
    </div>
  );
}