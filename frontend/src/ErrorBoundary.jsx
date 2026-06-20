import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Al Hidayat Hospital frontend error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="center-screen" style={{ padding: 30 }}>
          <div className="panel" style={{ maxWidth: 720 }}>
            <h2>Al Hidayat Hospital could not load</h2>
            <p>Please check the browser console and terminal for the exact error.</p>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 14, borderRadius: 12 }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
