'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function AboutPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ name?: string; email?: string } | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((sessionData) => {
        if (!active) return;
        setSessionUser(sessionData?.user ?? null);
        setHasSession(Boolean(sessionData?.user));
      })
      .catch(() => {
        if (!active) return;
        setHasSession(false);
        setSessionUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const userDisplayName = useMemo(() => {
    if (!sessionUser) return '';
    return sessionUser.name || sessionUser.email?.split('@')[0] || 'Member';
  }, [sessionUser]);

  const handleStartChat = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fakelens_prefill_message', message.trim());
    }

    setIsSubmitting(true);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0a1645] to-[#15263c] text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-indigo-300">FakeLens</p>
            <p className="text-sm text-white/80">Fact-Checking HQ</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white"
            >
              Try now
            </Link>
            {!hasSession && (
              <Link
                href="/auth/login"
                className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white"
              >
                Login
              </Link>
            )}
            {!hasSession && (
              <Link
                href="/auth/signup"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-90"
              >
                Sign Up
              </Link>
            )}
            {sessionUser && (
              <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90">
                Hi, {userDisplayName}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(2,12,27,0.65)]">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Instant chat</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Try a live chat</h2>
          <p className="mt-2 text-sm text-white/70 max-w-2xl">
            Type anything you want FakeLens to check. Once you submit, we launch the workspace with your message queued as a new chat so you can explore results instantly.
          </p>
          <div className="mt-6 w-full rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-3xl shadow-[0_25px_40px_rgba(2,12,27,0.6)]">
            <form onSubmit={handleStartChat} className="space-y-4">
              <textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Enter the claim, link, or prompt you want to verify..."
                className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-lg focus:border-blue-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? 'Launching chat...' : 'Start a new chat'}
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.65)]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-300">About FakeLens</p>
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white">Truth decoding, right in your browser</h1>
              <p className="mt-4 text-white/70">
                FakeLens blends AI, forensic image analysis, and human-readable insights to help you separate verified facts from misleading claims.
                Upload a document, paste a link, or share an image — every result includes a confidence score, source trace, and follow-up prompts.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_40px_rgba(2,12,27,0.5)]">
            <h3 className="text-2xl font-semibold text-white">What makes FakeLens different?</h3>
            <p className="mt-3 text-white/70">
              Built on Prisma and Neon, FakeLens is engineered for journalists, researchers, and truth seekers. Each chat session is stored securely when you're logged in, but you can still test the waters using guest credits.
              The interface is streamlined so you can upload files, paste URLs, or drag images in seconds, and our AI assistant walks you through each analysis step.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl bg-gradient-to-br from-black/70 to-white/5 p-4">
                <h4 className="text-sm font-semibold text-white">AI + Forensics</h4>
                <p className="mt-2 text-xs text-white/60">We combine OCR, metadata inspection, and AI detection to give you the full context.</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-black/70 to-white/5 p-4">
                <h4 className="text-sm font-semibold text-white">Secure Storage</h4>
                <p className="mt-2 text-xs text-white/60">Authenticated chats persist so you can revisit past investigations anytime.</p>
              </article>
              <article className="rounded-2xl bg-gradient-to-br from-black/70 to-white/5 p-4">
                <h4 className="text-sm font-semibold text-white">Community Trust</h4>
                <p className="mt-2 text-xs text-white/60">Share insights with a link, or invite collaborators to inspect the same claim.</p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
