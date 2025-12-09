'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import MessageBubble from './MessageBubble';
import ResultCard from './ResultCard';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  bottomOffset?: number;
}

export default function ChatMessages({ messages, isLoading, bottomOffset }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const paddingBottom = typeof bottomOffset === 'number' ? bottomOffset : 192; // default ~pb-48

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide" style={{ paddingBottom }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to FakeLens
            </h2>
            <p className="text-white/70 max-w-md">
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
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white flex-shrink-0">
                  <div className="h-3 w-3 border-b-2 border-white/40 rounded-full animate-spin" />
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4">
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
