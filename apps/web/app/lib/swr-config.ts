import { SWRConfiguration } from 'swr';

// Custom fetcher for SWR
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false, // Don't revalidate on window focus to save requests
  revalidateOnReconnect: true, // Revalidate when user comes back online
  refreshInterval: 10000, // Auto-refresh every 10 seconds (instead of 1 second)
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3, // Retry failed requests up to 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
  // Cache provider for better performance
  provider: () => new Map(),
  // Keep previous data while revalidating for smoother UX
  keepPreviousData: true,
};

// Hook for offline detection
export function useOnlineStatus() {
  if (typeof window === 'undefined') return true;
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
}

