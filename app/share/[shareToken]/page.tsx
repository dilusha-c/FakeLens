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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading shared chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800">{chat?.title}</h1>
            <p className="text-sm text-gray-600">Shared by {chat?.user?.name}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            {chat?.messages.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
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
          <p className="text-gray-600">
            This is a read-only shared chat. To interact with FakeLens, create your own account.
          </p>
        </div>
      </div>
    </div>
  );
}
