'use client';

import { Message } from '@/types';
import ImageAnalysisCard from './ImageAnalysisCard';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
        isUser ? 'bg-blue-500' : 'bg-[var(--accent-green)]'
      }`}>
        {isUser ? 'U' : 'FL'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.imagePreview ? (
          // Image Preview Display (User Upload)
          <div className={`rounded-2xl p-4 ${
            isUser
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
          }`}>
            <div className="flex items-center gap-2 text-sm mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">{message.imagePreview.name}</div>
                <div className="text-xs opacity-75">
                  {(message.imagePreview.size / 1024).toFixed(1)} KB • {message.imagePreview.type}
                </div>
              </div>
            </div>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        ) : message.imageAnalysis ? (
          // Image Analysis Display
          <div className="w-full">
            <div className={`rounded-2xl p-3 mb-2 ${
              isUser
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
            }`}>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            </div>
            <ImageAnalysisCard
              imageData={message.imageAnalysis}
              textAnalysis={undefined}
            />
          </div>
        ) : (
          // Regular Text Message
          <div className={`rounded-2xl p-4 ${
            isUser
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
          }`}>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
