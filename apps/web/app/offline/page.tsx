'use client';

import Link from 'next/link';
import { AsciiFrame } from '../components/ascii';

export default function OfflinePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Offline Mode</h1>
        <p className="text-console-dim mb-6">You are currently offline</p>
      </section>

      <section>
        <AsciiFrame title="Connection Status" variant="highlight">
          <div className="text-center py-8">
            <div className="text-console-red mb-4 text-2xl font-bold">
              CONNECTION LOST
            </div>
            <div className="text-console-dim mb-6">
              Please check your internet connection and try again.
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="ascii-button ascii-button-primary"
              >
                [ Retry Connection ]
              </button>
              <div>
                <Link href="/" className="ascii-button">
                  [ Back to Home ]
                </Link>
              </div>
            </div>
          </div>
        </AsciiFrame>
      </section>

      <section>
        <AsciiFrame title="Offline Features">
          <div className="space-y-4">
            <div className="text-console-fg font-bold mb-4">
              Available while offline:
            </div>
            <ul className="space-y-2 text-console-dim">
              <li>• View cached token data</li>
              <li>• Access saved watchlists</li>
              <li>• Browse offline documentation</li>
              <li>• Review historical analysis</li>
            </ul>
          </div>
        </AsciiFrame>
      </section>
    </div>
  );
}

