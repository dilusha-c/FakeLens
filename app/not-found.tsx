import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a1645] to-[#1d2f5d] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white/90 mb-4">Page Not Found</h2>
        <p className="text-white/70 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-[var(--accent-green)] text-white rounded-xl font-semibold hover:bg-[var(--accent-green)]/90 transition"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
