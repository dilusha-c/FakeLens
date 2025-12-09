'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Signup failed');
        return;
      }

      router.push('/auth/login?message=Account created successfully. Please login.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a1645] to-[#1d2f5d] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(2,12,27,0.65)] overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 bg-gradient-to-br from-[#111b40] to-[#0b1630] px-10 py-12 text-white">
          <p className="text-xs tracking-[0.2em] text-indigo-200/70 uppercase">Create your identity</p>
          <h2 className="text-3xl font-bold mt-3">Start fact-checking with FakeLens</h2>
          <p className="mt-4 text-white/80">
            Build your first dashboard, keep an eye on media claims, and request AI-powered photo analysis with a single secure login.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Fast verification workflows</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Guest credit migration when you upgrade</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Analytics dashboard for every team</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white/90 p-10 flex flex-col justify-center">
          <p className="text-sm text-gray-500">All plans include AI-assisted fact checks</p>
          <h3 className="text-2xl font-semibold text-gray-900 mt-2">Create your account</h3>

          {error && (
            <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm text-gray-700">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 focus:border-blue-500 focus:ring-blue-100 focus:outline-none"
                placeholder="Your full name"
              />
            </label>

            <label className="block text-sm text-gray-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 focus:border-blue-500 focus:ring-blue-100 focus:outline-none"
                placeholder="you@fakelens.ai"
              />
            </label>

            <label className="block text-sm text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 focus:border-blue-500 focus:ring-blue-100 focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            <label className="block text-sm text-gray-700">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-2 focus:border-blue-500 focus:ring-blue-100 focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 shadow-lg shadow-blue-500/30 disabled:opacity-60 transition"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-4">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200/10" />
              <div className="text-xs text-gray-400">or continue with</div>
              <div className="flex-1 h-px bg-gray-200/10" />
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full rounded-2xl bg-white text-gray-900 font-medium py-3 shadow-sm hover:shadow-md transition flex items-center justify-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 533.5 544.3"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.5-37-4.4-54.7H272v103.5h146.9c-6.3 34.1-25.2 62.9-53.8 82.1v68.2h86.9c50.9-46.9 81.5-116.2 81.5-198.9z" />
                <path fill="#34A853" d="M272 544.3c72.6 0 133.6-24.1 178.2-65.5l-86.9-68.2c-24.2 16.2-55.3 25.8-91.3 25.8-70.1 0-129.6-47.3-150.8-111.1H33.7v69.8C78.1 483.2 166.2 544.3 272 544.3z" />
                <path fill="#FBBC05" d="M121.2 325.3c-10.9-32.8-10.9-68.6 0-101.4V154.1H33.7c-39 76.7-39 168.5 0 245.2l87.5-74z" />
                <path fill="#EA4335" d="M272 107.7c38.5-.6 75.3 13.9 103.3 40.6l77.6-77.6C405.6 24.1 344.6 0 272 0 166.2 0 78.1 61.1 33.7 154.1l87.5 69.8C142.4 155 201.9 107.7 272 107.7z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
