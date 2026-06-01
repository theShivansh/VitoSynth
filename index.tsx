import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ── Error Boundary ─────────────────────────────────────────────────────────────
// Catches any render crash and shows a readable error instead of a black screen.
interface EBState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[VitoSynth] Render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#020203', color: '#F3F4F6', fontFamily: 'Inter, sans-serif',
          padding: '2rem', textAlign: 'center'
        }}>
          <div style={{
            border: '1px solid rgba(0,245,225,0.2)', borderRadius: '16px',
            padding: '2rem', maxWidth: '480px',
            background: 'rgba(20,20,24,0.6)', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ color: '#00F5E1', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              VitoSynth failed to start
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p style={{ color: '#52525b', fontSize: '0.75rem' }}>
              If this says "GROQ_API_KEY" — set <code style={{ color: '#A78BFA' }}>VITE_GROQ_API_KEY</code> in
              Vercel → Settings → Environment Variables, then redeploy.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem', padding: '0.6rem 1.5rem',
                background: '#00F5E1', color: '#000', border: 'none',
                borderRadius: '99px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Mount ──────────────────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find #root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Hide the loading splash once React has mounted
if (typeof (window as any).__hideSplash === 'function') {
  (window as any).__hideSplash();
}