import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RENTORA UI Runtime Exception Caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
          <div className="w-full max-w-lg p-8 rounded-xl bg-white border border-[#E2E8F0] shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#172033]">
                {this.props.fallbackTitle || 'A Client Interface Error Occurred'}
              </h2>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                The application encountered an unexpected runtime state. Your database transactions and session credentials remain fully intact.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-[#DC2626] text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload View
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-medium border border-[#E2E8F0] shadow-sm transition-colors flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
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
