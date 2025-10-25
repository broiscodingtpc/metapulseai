'use client';

import { useState, useEffect, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * AsyncErrorBoundary component to catch async errors and promise rejections
 * that are not caught by regular React error boundaries
 */
export default function AsyncErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      console.error('Unhandled promise rejection:', error);
      setAsyncError(error);
      
      if (onError) {
        onError(error);
      }
      
      // Prevent the default browser behavior
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      console.error('Unhandled error:', error);
      setAsyncError(error);
      
      if (onError) {
        onError(error);
      }
    };

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  // Reset async error when children change
  useEffect(() => {
    if (asyncError) {
      setAsyncError(null);
    }
  }, [children]);

  // If there's an async error, throw it so ErrorBoundary can catch it
  if (asyncError) {
    throw asyncError;
  }

  return (
    <ErrorBoundary 
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}