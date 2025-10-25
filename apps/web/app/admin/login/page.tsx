'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AsciiFrame } from '../../components/ascii';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        // Set cookie and redirect
        document.cookie = 'admin-session=authenticated; path=/; max-age=86400'; // 24 hours
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AsciiFrame>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">
              ╔══════════════════════╗<br />
              ║   ADMIN ACCESS       ║<br />
              ║   METAPULSE AI       ║<br />
              ╚══════════════════════╝
            </h1>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Admin Password:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded focus:outline-none focus:border-green-300"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              
              {error && (
                <div className="text-red-400 text-sm">
                  ⚠ {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-green-400 text-black font-bold rounded hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'ACCESS ADMIN'}
              </button>
            </form>
            
            <div className="mt-6 text-xs text-green-600 text-center">
              <p>Unauthorized access is prohibited.</p>
              <p>All activities are logged and monitored.</p>
            </div>
          </div>
        </AsciiFrame>
      </div>
    </div>
  );
}