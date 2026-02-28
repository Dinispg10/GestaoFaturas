import React, { Component, ErrorInfo, ReactNode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "#600", background: "#fdd", fontFamily: "sans-serif", height: "100vh" }}>
          <h1>Erro Crítico 💥</h1>
          <p>Tira foto a isto e manda para o suporte:</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#fff", padding: 10 }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px", background: "#fff", padding: 10 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
