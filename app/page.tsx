'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import ChatHeader from '@/components/ChatHeader';
import { Chat, Message, Analysis } from '@/types';

export default function Home() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [pendingNewChat, setPendingNewChat] = useState(false);
  const [pendingTempId, setPendingTempId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  // Load user session and chats from server on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        // First check if user is authenticated
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          router.push('/auth/login');
          return;
        }
        
        const session = await sessionRes.json();
        setUser(session?.user);

        // Load chats from server
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          setChats(data.chats || []);

          // If a chatId is present in the URL, select it.
          // Otherwise open a pending (unsaved) chat in the UI — do NOT
          // add it to the sidebar history until the user sends the
          // first message.
          let urlChatId: string | null = null;
          if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            urlChatId = sp.get('chatId');
          }
          if (urlChatId) {
            setCurrentChatId(urlChatId);
          } else {
            const tempId = `temp-${Date.now().toString(36)}`;
            setPendingNewChat(true);
            setPendingTempId(tempId);
            setCurrentChatId(tempId);
            try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
          }

        } else if (res.status === 401) {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        // Fallback to localStorage
        const savedChats = localStorage.getItem('fakelens_chats');
        if (savedChats) {
          try {
            const parsed = JSON.parse(savedChats);
            setChats(parsed);
            if (parsed.length > 0) {
              setCurrentChatId(parsed[0].id);
            }
          } catch (e) {
            console.error('Failed to parse localStorage:', e);
          }
        }
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [router]);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  const createNewChat = async () => {
    // Create a pending local chat. It will be persisted to the server
    // only after the user sends the first message.
    const tempId = `temp-${Date.now().toString(36)}`;
    setPendingNewChat(true);
    setPendingTempId(tempId);
    setCurrentChatId(tempId);
    try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
  };

  const selectChat = (chatId: string) => {
    // If there was a pending new chat and user selects another chat,
    // discard the pending chat (it was never persisted).
    if (pendingNewChat && pendingTempId && chatId !== pendingTempId) {
      setPendingNewChat(false);
      setPendingTempId(null);
    }
    setCurrentChatId(chatId);
    // Update URL when selecting a chat
    try {
      router.replace(`/?chatId=${chatId}`);
    } catch (e) {
      // ignore
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }

    const updatedChats = chats.filter(chat => chat.id !== chatId);
    setChats(updatedChats);
    
    if (currentChatId === chatId) {
      const newCurrent = updatedChats.length > 0 ? updatedChats[0].id : null;
      setCurrentChatId(newCurrent);
      // Update URL when current chat changes due to deletion
      try {
        if (newCurrent) {
          router.replace(`/?chatId=${newCurrent}`);
        } else {
          router.replace(`/`);
        }
      } catch (e) {}
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let chatToUpdate = currentChat;
    let chatId = currentChatId;

    // If there's a pending (local) chat, persist it now using the first
    // message as the title and add it to the sidebar. Otherwise, if no
    // chat exists, create one as before.
    if (pendingNewChat && pendingTempId) {
      try {
        const createRes = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: content.substring(0, 50) }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          chatToUpdate = data.chat;
          chatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setCurrentChatId(data.chat.id);
          setPendingNewChat(false);
          setPendingTempId(null);
          try { router.replace(`/?chatId=${data.chat.id}`); } catch (e) {}
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        return;
      }
    }

    // Create new chat if none exists
    if (!chatToUpdate) {
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: content.substring(0, 50),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          chatToUpdate = data.chat;
          chatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setCurrentChatId(data.chat.id);
        } else {
          throw new Error('Failed to create chat');
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        return;
      }
    }

    const userMessage: Message = {
      role: 'user',
      content,
    };

    setIsLoading(true);

    try {
      // Save user message to server
      const messageRes = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'user',
          content,
        }),
      });

      if (!messageRes.ok) {
        throw new Error('Failed to save message');
      }

      // Update local state
      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              messages: [...chat.messages, userMessage],
              title: chat.title === 'New Chat' ? content.substring(0, 50) : chat.title 
            }
          : chat
      ));

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...(chatToUpdate?.messages || []), userMessage],
          analysis: chatToUpdate?.analysis,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to get response';
        
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          errorMessage = `Server error (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Save assistant message to server with full analysis
      const assistantMessageRes = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'assistant',
          content: data.message,
          factCheck: data.analysis ? JSON.stringify(data.analysis) : null,
          contentAnalysis: data.analysis?.contentAnalysis,
        }),
      });

      if (!assistantMessageRes.ok) {
        console.error('Failed to save assistant message');
      }

      // Add assistant message locally
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        analysis: data.analysis,
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              analysis: data.analysis || chat.analysis,
            }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (imageData: any, imageFile: File) => {
    let chatToUpdate = currentChat;
    let chatId = currentChatId;
    
    // If there's a pending new chat, persist it first
    if (pendingNewChat && pendingTempId) {
      try {
        const createRes = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: '📸 Image Analysis' }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          chatToUpdate = data.chat;
          chatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setCurrentChatId(data.chat.id);
          setPendingNewChat(false);
          setPendingTempId(null);
          try { router.replace(`/?chatId=${data.chat.id}`); } catch (e) {}
        }
      } catch (error) {
        console.error('Error creating chat for image upload:', error);
        return;
      }
    }

    // Create new chat if none exists
    if (!chatToUpdate) {
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '📸 Image Analysis',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          chatToUpdate = data.chat;
          chatId = data.chat.id;
          setChats(prev => [data.chat, ...prev]);
          setCurrentChatId(data.chat.id);
        } else {
          throw new Error('Failed to create chat');
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        return;
      }
    }

    // Add user message with image to server
    try {
      const messageRes = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'user',
          content: '📸 Uploaded image for analysis',
          imageUrl: imageData.imageUrl,
          imageMetadata: JSON.stringify({
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
          }),
        }),
      });

      if (!messageRes.ok) {
        throw new Error('Failed to save image message');
      }
    } catch (error) {
      console.error('Failed to save image message:', error);
    }

    const userImageMessage: Message = {
      role: 'user',
      content: '📸 Uploaded image for analysis',
      imagePreview: {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
      },
    };

    // Add user message to chat
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userImageMessage],
            title: chat.title === 'New Chat' ? '📸 Image Analysis' : chat.title
          }
        : chat
    ));

    // Add assistant message with image analysis
    const assistantImageMessage: Message = {
      role: 'assistant',
      content: '📸 Image Analysis Complete',
      imageAnalysis: imageData,
    };

    // Save assistant message with complete image analysis
    try {
      await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'assistant',
          content: '📸 Image Analysis Complete',
          imageUrl: imageData.imageUrl,
          aiDetection: JSON.stringify(imageData.aiDetection),
          ocrText: JSON.stringify(imageData.ocr),
          contentAnalysis: JSON.stringify(imageData.content),
        }),
      });
    } catch (error) {
      console.error('Failed to save analysis message:', error);
    }

    // Update chat with analysis - only add assistant message (user already added above)
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { 
            ...chat, 
            messages: [...chat.messages, assistantImageMessage]
          }
        : chat
    ));

    // If there's extracted text, auto-fact-check it
    if (imageData.ocr.hasText && imageData.ocr.text.length > 10) {
      await sendMessage(imageData.ocr.text);
    }
  };

  if (isLoadingChats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-xl text-gray-600">Loading chats...</div>
      </div>
    );
  }

  const handleShareChat = async () => {
    if (!currentChatId) return;

    try {
      const res = await fetch(`/api/chats/${currentChatId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isShared: true }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local chat with share info
        setChats(prev => prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, isShared: true, shareToken: data.shareToken }
            : chat
        ));
        
        // Show share modal with URL
        const url = `${window.location.origin}/share/${data.shareToken}`;
        setShareUrl(url);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Failed to share chat:', error);
    }
  };

  const handleUnshareChat = async () => {
    if (!currentChatId) return;

    try {
      const res = await fetch(`/api/chats/${currentChatId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isShared: false }),
      });

      if (res.ok) {
        // Update local chat
        setChats(prev => prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, isShared: false, shareToken: undefined }
            : chat
        ));
      }
    } catch (error) {
      console.error('Failed to unshare chat:', error);
    }
  };

  const currentShareUrl = currentChat?.shareToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/share/${currentChat.shareToken}`
    : undefined;

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={createNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatHeader
          chatTitle={currentChat?.title || 'New Chat'}
          chatId={currentChatId || undefined}
          isShared={currentChat?.isShared || false}
          shareUrl={currentShareUrl}
          userName={user?.name || user?.email}
          onShare={handleShareChat}
          onUnshare={handleUnshareChat}
        />
        
        <ChatMessages
          messages={currentChat?.messages || []}
          isLoading={isLoading}
        />
        
        <ChatInput
          onSend={sendMessage}
          onImageUpload={handleImageUpload}
          disabled={isLoading}
          hasAnalysis={!!currentChat?.analysis}
          currentAnalysis={currentChat?.analysis}
        />
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Chat Shared Successfully!</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">Anyone with this link can view your chat and analysis results:</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 break-all text-sm text-gray-700">
              {shareUrl}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = '✓ Copied!';
                    setTimeout(() => {
                      btn.textContent = originalText;
                    }, 2000);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
