import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-900 border-2 border-red-500 rounded-xl text-white font-mono z-[9999] relative">
          <h1 className="text-2xl font-bold mb-4">CRASH DETECTED</h1>
          <p className="mb-4">Please screenshot this and send to developer:</p>
          <div className="bg-black p-4 rounded text-sm overflow-auto max-h-96">
            <p className="font-bold text-red-400">{this.state.error?.name}: {this.state.error?.message}</p>
            <pre className="mt-2 text-xs opacity-80 whitespace-pre-wrap">{this.state.error?.stack}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
