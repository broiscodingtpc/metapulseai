'use client';

import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function ToastProvider() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  useEffect(() => {
    // Get theme from localStorage or default to dark
    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(storedTheme);
    
    // Listen for theme changes
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
      setTheme(newTheme);
    };
    
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: theme === 'dark' ? '#1a1e27' : '#ffffff',
          color: theme === 'dark' ? '#e6f1ff' : '#1a1a1a',
          border: `1px solid ${theme === 'dark' ? '#2a2e37' : '#e5e7eb'}`,
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: theme === 'dark' 
            ? '0 10px 40px rgba(0, 0, 0, 0.5)' 
            : '0 10px 40px rgba(0, 0, 0, 0.1)',
        },
        // Success style
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#00e5ff',
            secondary: theme === 'dark' ? '#1a1e27' : '#ffffff',
          },
          style: {
            border: `1px solid #00e5ff`,
          },
        },
        // Error style
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: theme === 'dark' ? '#1a1e27' : '#ffffff',
          },
          style: {
            border: `1px solid #ef4444`,
          },
        },
        // Loading style
        loading: {
          iconTheme: {
            primary: '#3fa9ff',
            secondary: theme === 'dark' ? '#1a1e27' : '#ffffff',
          },
        },
      }}
    />
  );
}

