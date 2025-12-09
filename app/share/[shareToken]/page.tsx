'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SharedChatPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  
  const [chat, setChat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        const res = await fetch(`/api/chats/shared/${shareToken}`);
        
        if (!res.ok) {
          setError('Chat not found or no longer shared');
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setChat(data.chat);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (shareToken) {
      fetchSharedChat();
    }
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1224] via-[#0c1831] to-[#090f1a] flex items-center justify-center">
        <div className="text-xl text-white/80">Loading shared chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1224] via-[#0c1831] to-[#090f1a] flex items-center justify-center">
        <div className="bg-[#1a2332] border border-white/10 rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-white/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1224] via-[#0c1831] to-[#090f1a]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#0f1724] border-b border-white/5 shadow">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">{chat?.title}</h1>
            <p className="text-sm text-white/70">Shared by {chat?.user?.name}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6">
          <div className="bg-white/5 rounded-lg shadow-lg p-6 space-y-4 border border-white/10">
            {chat?.messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[var(--accent-green)] text-white'
                      : 'bg-white/5 text-white'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="text-center py-6">
          <p className="text-white/70">
            This is a read-only shared chat. To interact with FakeLens, create your own account.
          </p>
        </div>
      </div>
    </div>
  );
}
