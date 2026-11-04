import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled ATM UI Error caught by RootErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0d14',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#111827',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontSize: '28px'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
              ATM 4.0 Application Recovered
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              The application encountered an unexpected runtime error and prevented a blank screen. Click below to reload cleanly.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                backgroundColor: '#030712',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#f87171',
                overflowX: 'auto',
                marginBottom: '20px',
                maxHeight: '140px'
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('active_student_session');
                  } catch {}
                  window.location.reload();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1f2937',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear Temp Session & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
