'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a1645] to-[#1d2f5d] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-white/90 mb-4">Something went wrong!</h2>
        <p className="text-white/70 mb-8">
          An error occurred while processing your request.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-xl font-semibold hover:bg-[var(--accent-green)]/90 transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
