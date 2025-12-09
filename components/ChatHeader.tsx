'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface GuestCredits {
  totalCredits: number;
  resetDate: string;
}

interface ChatHeaderProps {
  chatTitle: string;
  chatId?: string;
  userName?: string;
  guestCredits?: GuestCredits | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function ChatHeader({
  chatTitle,
  chatId,
  userName,
  guestCredits,
}: ChatHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] h-16 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle moved to the left collapsed bar; no button here to avoid duplicate controls */}

        <div className="pl-1">
          <div className="text-lg font-semibold text-[var(--text-primary)]">FakeLens</div>
          <div className="text-sm text-[var(--text-secondary)]">Fact-Checking Assistant</div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Share removed per user request */}

        {/* User Profile Menu or Guest Login/Signup Buttons */}
        {userName ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{userName}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-50">
                <div className="px-4 py-2 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">Logged in</p>
                  <p className="text-xs text-[var(--text-secondary)]">{userName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition text-sm font-medium border border-[var(--border-color)]"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
