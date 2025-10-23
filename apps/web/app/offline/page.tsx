'use client';

import { WifiOff } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import CyberButton from '../components/CyberButton';
import PageNav from '../components/PageNav';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-950 transition-colors duration-300">
      <PageNav />
      
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        <CyberCard className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            You're Offline
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            It looks like you've lost your internet connection. 
            Please check your connection and try again.
          </p>
          
          <div className="space-y-3">
            <CyberButton 
              onClick={handleRetry} 
              variant="primary" 
              className="w-full"
            >
              Try Again
            </CyberButton>
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Some cached content may still be available
            </p>
          </div>
        </CyberCard>
      </div>
    </div>
  );
}

