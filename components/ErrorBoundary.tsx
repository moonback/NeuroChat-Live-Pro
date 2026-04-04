import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Isolates render crashes — prevents a 3D/visualizer failure from killing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'unknown'}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center text-zinc-500 space-y-1 px-4">
          <p className="text-xs font-mono opacity-60">
            [{this.props.label ?? 'component'} crashed]
          </p>
          <p className="text-[10px] opacity-40">{this.state.error?.message}</p>
          <button
            className="mt-2 text-[10px] text-zinc-400 underline underline-offset-2 hover:text-white"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            retry
          </button>
        </div>
      </div>
    );
  }
}
