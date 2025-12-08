'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';
import ResultCard from './ResultCard';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Welcome to FakeLens
            </h2>
            <p className="text-[var(--text-secondary)] max-w-md">
              Paste a news article, link, or claim below to verify whether it's likely fake, real, or uncertain.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => {
              return (
                <div key={index}>
                  <MessageBubble message={message} />
                  {message.analysis && <ResultCard analysis={message.analysis} />}
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] flex items-center justify-center text-white flex-shrink-0">
                  FL
                </div>
                <div className="flex-1 bg-[var(--bg-secondary)] rounded-2xl p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
