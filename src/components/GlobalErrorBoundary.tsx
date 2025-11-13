import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary Component
 * Catches errors in the component tree and displays fallback UI
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="card max-w-md w-full p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2" style={{color: 'var(--text)'}}>
              Something went wrong
            </h1>
            <p className="text-sm mb-4" style={{color: 'var(--text-muted)'}}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="btn primary"
                style={{fontSize: '.7rem', padding: '.5rem 1rem'}}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn outline"
                style={{fontSize: '.7rem', padding: '.5rem 1rem'}}
              >
                Go Home
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs cursor-pointer" style={{color: 'var(--text-muted)'}}>
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
