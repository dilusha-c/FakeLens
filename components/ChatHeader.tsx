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
  onToggleSidebar,
  isSidebarOpen,
}: ChatHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-primary)] h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile hamburger menu */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="min-w-0">
          <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">FakeLens</div>
          <div className="text-xs sm:text-sm text-[var(--text-secondary)] truncate hidden xs:block">Fact-Checking Assistant</div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Share removed per user request */}

        {/* User Profile Menu or Guest Login/Signup Buttons */}
        {userName ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition touch-manipulation"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] hidden sm:inline max-w-[100px] truncate">{userName}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-[var(--bg-primary)] rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-50">
                <div className="px-3 sm:px-4 py-2 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">Logged in</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{userName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 sm:px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition touch-manipulation"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition text-xs sm:text-sm font-medium border border-[var(--border-color)] touch-manipulation"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-xs sm:text-sm font-medium touch-manipulation"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
