import { Component } from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "40px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>Something went wrong</div>
          <div style={{ maxWidth: "420px", lineHeight: 1.7, fontSize: "13px" }}>
            Try disconnecting and reconnecting the device.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: "8px", padding: "8px 24px", borderRadius: "24px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontFamily: "'Roboto',sans-serif", fontSize: "14px" }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
