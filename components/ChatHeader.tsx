'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  chatTitle: string;
  chatId?: string;
  isShared?: boolean;
  shareUrl?: string;
  userName?: string;
  onShare?: () => void;
  onUnshare?: () => void;
}

export default function ChatHeader({
  chatTitle,
  chatId,
  isShared = false,
  shareUrl,
  userName,
  onShare,
  onUnshare,
}: ChatHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleShare = async () => {
    if (onShare) {
      await onShare();
      // Modal is now shown by parent component
    }
  };

  const handleUnshare = async () => {
    if (onUnshare) {
      await onUnshare();
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">{chatTitle}</h1>

      <div className="flex items-center gap-4">
        {/* Share Button */}
        <div className="relative">
          {isShared ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-600 font-medium">🔗 Shared</span>
              <button
                onClick={handleShare}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition text-sm font-medium"
              >
                View Link
              </button>
              {onUnshare && (
                <button
                  onClick={handleUnshare}
                  className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition text-sm font-medium"
                >
                  Unshare
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleShare}
              disabled={!chatId}
              className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                chatId
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Share Chat
            </button>
          )}
        </div>

        {/* User Profile Menu */}
        {userName && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700">Logged in as</p>
                  <p className="text-xs text-gray-500">{userName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
