import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CRITICAL UI ERROR BOUNDARY]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '24px'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              The application encountered an unexpected error. Your family data and financial records are safe.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} />
                Reload Application
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
                style={{ minHeight: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Home size={16} />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
