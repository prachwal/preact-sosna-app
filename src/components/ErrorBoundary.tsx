import { Component, h } from 'preact';
import type { ComponentChildren } from 'preact';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Wystąpił błąd aplikacji</h2>
            <p>Przepraszamy za niedogodności. Spróbuj odświeżyć stronę.</p>
            <details className="error-details">
              <summary>Szczegóły błędu (dla developerów)</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button
              className="error-retry-btn"
              onClick={() => window.location.reload()}
            >
              🔄 Odśwież stronę
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}