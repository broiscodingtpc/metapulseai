'use client';

import React, { Component, ReactNode } from 'react';
import { AsciiFrame } from './ascii';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in the child component tree
 * and display a fallback UI instead of crashing the entire application
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console and external service if needed
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <AsciiFrame title="ERROR DETECTED" variant="highlight" className="border-red-500">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-lg font-bold">
              ⚠️ Something went wrong
            </div>
            
            <div className="text-console-dim text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left text-xs text-console-dim bg-console-bg p-3 rounded border">
                <summary className="cursor-pointer text-console-cyan mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-console-cyan text-console-bg rounded hover:bg-console-cyan/80 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-console-dim text-console-fg rounded hover:bg-console-dim/80 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </AsciiFrame>
      );
    }

    return this.props.children;
  }
}