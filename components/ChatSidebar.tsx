'use client';

import { Chat } from '@/types';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export default function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">FakeLens</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Fact-Checking Assistant</p>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-4 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`group relative px-3 py-2 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
              currentChatId === chat.id
                ? 'bg-[var(--bg-tertiary)]'
                : 'hover:bg-[var(--bg-tertiary)]'
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {chat.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {(chat.messages?.length || 0)} message{(chat.messages?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                title="Delete chat"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] text-center">
        <p>Automated fact-checking</p>
        <p className="mt-1">Verify with official sources</p>
      </div>
    </div>
  );
}
