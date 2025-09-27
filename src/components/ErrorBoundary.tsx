import React from 'react';

interface State { hasError: boolean; error?: Error }

// Enhanced ErrorBoundary: in dev mode surfaces the actual error message & stack (collapsed)
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta?.env?.DEV) console.error('ErrorBoundary caught', error, info);
    // TODO: hook into a remote logging service here if desired
  }
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };
  render() {
    if (this.state.hasError) {
      const dev = import.meta?.env?.DEV;
      return (
        <div className="card ff-stack" style={{color:'var(--danger)', fontSize:'.7rem', gap:'.5rem'}}>
          <strong>Something went wrong loading this section.</strong>
          {dev && this.state.error && (
            <details style={{whiteSpace:'pre-wrap', fontSize:'.6rem'}} open>
              <summary style={{cursor:'pointer'}}>Error detail (dev only)</summary>
              {this.state.error.message}\n\n{this.state.error.stack}
            </details>
          )}
          <button onClick={this.handleReset} style={{alignSelf:'flex-start'}} className="btn subtle" type="button">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
