import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  countdown: number;
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private timer: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, countdown: 5 };
  }

  static getDerivedStateFromError() {
    return { hasError: true, countdown: 5 };
  }

  componentDidCatch(error: Error) {
    console.error("Erro crítico capturado:", error);
  }

  componentDidUpdate() {
    if (!this.state.hasError || this.timer) return;

    this.timer = window.setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          window.clearInterval(this.timer!);
          this.timer = null;
          window.location.reload();
          return prev;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timer) window.clearInterval(this.timer);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-app-surface p-6">
          <p className="font-serif text-lg text-gold">✦ Bíblia Vive</p>
          <h1 className="mt-3 text-2xl text-app-text">Algo deu errado</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            Ocorreu um erro inesperado. A página será recarregada automaticamente em 5 segundos.
          </p>
          <p className="mt-3 font-micro text-sm text-app-text">{this.state.countdown}...</p>
          <button
            className="mt-4 min-h-11 rounded-full border border-border bg-app-raised px-4 text-sm text-app-text hover:bg-accent"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recarregar agora
          </button>
        </div>
      </div>
    );
  }
}