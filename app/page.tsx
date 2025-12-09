'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import ChatHeader from '@/components/ChatHeader';
import { Chat, Message, Analysis } from '@/types';
import { getGuestCredits, useGuestCredit, GuestCredits } from '@/lib/guestCredits';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [guestCredits, setGuestCredits] = useState<GuestCredits | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const pendingPrefillRef = useRef(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputHeight, setInputHeight] = useState(200); // sensible default padding

  // Track input container height so chat padding matches and nothing renders underneath
  useEffect(() => {
    if (!inputContainerRef.current) return;
    const measure = () => {
      const rect = inputContainerRef.current?.getBoundingClientRect();
      setInputHeight(rect?.height ?? 0);
    };
    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(inputContainerRef.current);

    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Update guest credits periodically
  useEffect(() => {
    if (!user) {
      setGuestCredits(getGuestCredits());
      const interval = setInterval(() => {
        setGuestCredits(getGuestCredits());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Load user session and chats from server on mount
  useEffect(() => {
    // Immediately create a new chat to show UI faster
    const tempId = `temp-${Date.now().toString(36)}`;
    setPendingNewChat(true);
    setPendingTempId(tempId);
    setCurrentChatId(tempId);
    setIsLoadingChats(false); // Show UI immediately
    
    const loadChats = async () => {
      try {
        // Load session (optional for guests)
        const sessionRes = await fetch('/api/auth/session');
        
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          if (session?.user) {
            setUser(session.user);
            
            // Load chats only for authenticated users
            const chatsRes = await fetch('/api/chats');
            if (chatsRes.ok) {
              const data = await chatsRes.json();
              const loadedChats = data.chats || [];
              setChats(loadedChats);

              // Check if a chatId is present in the URL and validate it
              let urlChatId: string | null = null;
              if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search);
                urlChatId = sp.get('chatId');
              }
              
              if (urlChatId && urlChatId !== tempId) {
                // Check if it's a temp chat ID or if it exists in loaded chats
                const isValidChat = urlChatId.startsWith('temp-') || loadedChats.some((chat: any) => chat.id === urlChatId);
                
                if (isValidChat) {
                  if (urlChatId.startsWith('temp-')) {
                    setPendingNewChat(true);
                    setPendingTempId(urlChatId);
                  } else {
                    setPendingNewChat(false);
                    setPendingTempId(null);
                  }
                  setCurrentChatId(urlChatId);
                  try { router.replace(`/?chatId=${urlChatId}`); } catch (e) {}
                } else {
                  // Invalid chatId in URL, show error but keep the temp chat
                  setErrorMessage('Invalid chat URL. Opening a new chat.');
                  setShowErrorToast(true);
                  setTimeout(() => setShowErrorToast(false), 4000);
                  try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
                }
              } else {
                // Use the temp chat we already created
                try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
              }
            }
          } else {
            // Guest user - just use temp chat
            try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
          }
        } else {
          // Not authenticated - guest mode
          try { router.replace(`/?chatId=${tempId}`); } catch (e) {}
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        // Keep the temp chat on error - user can still use the app
      } finally {
        setSessionResolved(true);
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
    // Update UI immediately for better UX
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

    // Delete from server in background
    try {
      await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Optionally: revert UI on error
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Check guest credits if not authenticated
    if (!user) {
      if (!useGuestCredit('message')) {
        setShowCreditModal(true);
        return;
      }
      setGuestCredits(getGuestCredits());
    }

    let chatToUpdate = currentChat;
    let chatId = currentChatId;

    // For authenticated users: handle chat persistence
    // For guests: skip database operations, keep in-memory only
    if (user) {
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
    } else {
      // Guest mode: ensure we have an in-memory chat
      if (!chatToUpdate || !chatId) {
        const guestChat = {
          id: 'guest-chat',
          title: 'Guest Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: 'guest',
        };
        chatToUpdate = guestChat;
        chatId = 'guest-chat';
        setChats([guestChat]);
        setCurrentChatId('guest-chat');
      }
    }

    const userMessage: Message = {
      role: 'user',
      content,
    };

    // Update local state immediately for instant feedback
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.title === 'New Chat' || chat.title === 'Guest Chat' ? content.substring(0, 50) : chat.title 
          }
        : chat
    ));

    setIsLoading(true);

    try {
      // Save user message to server in background (only for authenticated users)
      if (user) {
        fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'user',
            content,
          }),
        }).catch(error => {
          console.error('Failed to save message:', error);
        });
      }

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

      // Save assistant message to server (only for authenticated users)
      if (user) {
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
  }, [isLoading, user, pendingNewChat, pendingTempId, currentChat, currentChatId, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const queued = sessionStorage.getItem('fakelens_prefill_message');
    if (queued) {
      setQueuedMessage(queued);
      sessionStorage.removeItem('fakelens_prefill_message');
    }
  }, []);

  useEffect(() => {
    if (!queuedMessage || pendingPrefillRef.current || !sessionResolved) return;
    pendingPrefillRef.current = true;
    (async () => {
      try {
        await sendMessage(queuedMessage);
      } finally {
        setQueuedMessage(null);
        pendingPrefillRef.current = false;
      }
    })();
  }, [queuedMessage, sendMessage, sessionResolved]);

  const handleImageUpload = async (imageData: any, imageFile: File) => {
    // Check guest credits if not authenticated
    if (!user) {
      if (!useGuestCredit('image')) {
        setShowCreditModal(true);
        return;
      }
      setGuestCredits(getGuestCredits());
    }

    let chatToUpdate = currentChat;
    let chatId = currentChatId;
    
    // For authenticated users: handle chat persistence
    // For guests: use in-memory chat
    if (user) {
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
    } else {
      // Guest mode: ensure we have an in-memory chat
      if (!chatToUpdate || !chatId) {
        const guestChat = {
          id: 'guest-chat',
          title: 'Guest Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: 'guest',
        };
        chatToUpdate = guestChat;
        chatId = 'guest-chat';
        setChats([guestChat]);
        setCurrentChatId('guest-chat');
      }
    }

    // Add user message with image to server (only for authenticated users)
    if (user) {
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
            title: chat.title === 'New Chat' || chat.title === 'Guest Chat' ? '📸 Image Analysis' : chat.title
          }
        : chat
    ));

    // Add assistant message with image analysis
    const assistantImageMessage: Message = {
      role: 'assistant',
      content: '📸 Image Analysis Complete',
      imageAnalysis: imageData,
    };

    // Save assistant message with complete image analysis (only for authenticated users)
    if (user) {
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

  const handleDocumentUpload = async (documentData: any, documentFile: File) => {
    // Check guest credit first
    if (!user) {
      if (!useGuestCredit('document')) {
        setShowCreditModal(true);
        return;
      }
      setGuestCredits(getGuestCredits());
    }

    let chatToUpdate = currentChat;
    let chatId = currentChatId;
    
    // For authenticated users: handle chat persistence
    // For guests: use in-memory chat
    if (user) {
      // If there's a pending new chat, persist it first
      if (pendingNewChat && pendingTempId) {
        try {
          const createRes = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '📄 Document Analysis' }),
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
          console.error('Error creating chat for document upload:', error);
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
              title: '📄 Document Analysis',
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
    } else {
      // Guest mode: ensure we have an in-memory chat
      if (!chatToUpdate || !chatId) {
        const guestChat = {
          id: 'guest-chat',
          title: 'Guest Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: 'guest',
        };
        chatToUpdate = guestChat;
        chatId = 'guest-chat';
        setChats([guestChat]);
        setCurrentChatId('guest-chat');
      }
    }

    // Add user message with document to server (only for authenticated users)
    if (user) {
      try {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'user',
            content: `📄 Uploaded document: ${documentFile.name}`,
            documentMetadata: JSON.stringify({
              name: documentFile.name,
              size: documentFile.size,
              type: documentFile.type,
            }),
          }),
        });
      } catch (error) {
        console.error('Failed to save document message:', error);
      }
    }

    const userDocumentMessage: Message = {
      role: 'user',
      content: `📄 Uploaded document: ${documentFile.name}`,
      documentPreview: {
        name: documentFile.name,
        size: documentFile.size,
        type: documentFile.type,
      },
    };

    // Add user message to chat
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userDocumentMessage],
            title: chat.title === 'New Chat' || chat.title === 'Guest Chat' ? '📄 Document Analysis' : chat.title
          }
        : chat
    ));

    // Analyze the document text
    if (documentData.text && documentData.text.length > 15) {
      setIsLoading(true);

      try {
        // Get AI analysis for document content
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...(chatToUpdate?.messages || []), { role: 'user', content: documentData.text }],
            analysis: chatToUpdate?.analysis,
          }),
        });

        if (response.ok) {
          const analysisResult = await response.json();

          // Create document analysis message with full data
          const documentAnalysisData = {
            ...documentData,
            analysis: analysisResult.analysis,
          };

          const assistantDocumentMessage: Message = {
            role: 'assistant',
            content: '📄 Document Analysis Complete',
            documentAnalysis: documentAnalysisData,
          };

          // Save assistant message with analysis (only for authenticated users)
          if (user) {
            try {
              await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role: 'assistant',
                  content: '📄 Document Analysis Complete',
                  factCheck: analysisResult.analysis ? JSON.stringify(analysisResult.analysis) : null,
                  documentMetadata: JSON.stringify(documentData.metadata),
                  contentAnalysis: JSON.stringify(documentData),
                }),
              });
            } catch (error) {
              console.error('Failed to save document analysis:', error);
            }
          }

          // Update chat with analysis
          setChats(prev => prev.map(chat =>
            chat.id === chatId
              ? { 
                  ...chat, 
                  messages: [...chat.messages, assistantDocumentMessage],
                  analysis: analysisResult.analysis || chat.analysis,
                }
              : chat
          ));
        }
      } catch (error) {
        console.error('Error analyzing document:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#0b1224] via-[#0c1831] to-[#090f1a] text-white">
      <div className="flex h-full">
        {sidebarOpen ? (
          <ChatSidebar
            chats={chats}
            currentChatId={currentChatId}
            onNewChat={createNewChat}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            isLoading={isLoadingChats}
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={sidebarOpen}
          />
        ) : (
          <div className="w-16 h-full bg-white/5 border-r border-white/10 flex flex-col items-center py-3 gap-3 backdrop-blur-xl">
            <button
              onClick={createNewChat}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              title="New chat"
            >
              <img
                src="/logo.svg"
                alt="FakeLens logo"
                className="max-w-8 max-h-8"
              />
            </button>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Open sidebar"
            >
              ☰
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <ChatHeader
            chatTitle={currentChat?.title || 'New Chat'}
            chatId={currentChatId || undefined}
            userName={user?.name || user?.email}
            guestCredits={guestCredits}
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={sidebarOpen}
          />
          
          {isLoadingChats ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-green)] mx-auto mb-4"></div>
                <p className="text-lg text-white/70">Loading chats...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex-1 overflow-hidden">
                  {(!currentChat?.messages || currentChat.messages.length === 0) ? (
                    <div className="h-full overflow-y-auto scrollbar-hide" style={{ paddingBottom: inputHeight + 24 }}>
                      <div className="flex flex-col items-center justify-center h-full px-4">
                        <div className="w-full max-w-3xl">
                          {/* Welcome Message */}
                          <div className="mb-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-[var(--accent-green)]/15">
                              <svg className="w-8 h-8 text-[var(--accent-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                              Check the truth
                            </h2>
                            <p className="text-white/70 max-w-md mx-auto">
                              Paste a link, claim, or upload an image to detect fake content or AI generated images.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ChatMessages
                      messages={currentChat.messages}
                      isLoading={isLoading}
                      bottomOffset={inputHeight + 24}
                    />
                  )}
                </div>

                <div ref={inputContainerRef} className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                  <ChatInput
                    onSend={sendMessage}
                    onImageUpload={handleImageUpload}
                    onDocumentUpload={handleDocumentUpload}
                    disabled={isLoading}
                    hasAnalysis={!!currentChat?.analysis}
                    currentAnalysis={currentChat?.analysis}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1a2332] border border-white/10 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Chat Shared Successfully!</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-white/80 mb-4">Anyone with this link can view your chat and analysis results:</p>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 break-all text-sm text-white/90">
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
                className="flex-1 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green)]/90 transition font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Invalid URL</p>
              <p className="text-sm opacity-90">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Guest Credit Limit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowCreditModal(false)}>
          <div className="bg-[#1a2332] border border-white/10 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Guest Credits Exhausted</h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-white/80">
                You've used all your guest credits. Sign up or log in to continue using FakeLens with unlimited access!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/auth/signup')}
                className="flex-1 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green)]/90 transition font-medium"
              >
                Sign Up
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-medium"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
