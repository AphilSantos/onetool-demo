"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useAuthKit } from "@picahq/authkit";
import { Header } from "./components/Header";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { SupabaseTest } from "./components/SupabaseTest";
import { Modal } from "@/components/ui/modal";
import { AISessionManager } from "@/lib/ai-session";
import { Message } from "ai";

export default function Home() {
  const { open } = useAuthKit({
    token: {
      url: "http://localhost:3000/api/authkit",
      headers: {},
    },
    // appTheme: 'dark',
    selectedConnection: "GitHub",
    onSuccess: (connection) => {},
    onError: (error) => {},
    onClose: () => {},
  });

  // Generate a consistent user ID for this session
  const [userId] = useState(() => {
    if (typeof window !== 'undefined') {
      let storedUserId = localStorage.getItem('pica_user_id')
      if (!storedUserId) {
        storedUserId = `user_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('pica_user_id', storedUserId)
      }
      return storedUserId
    }
    return 'user_123' // fallback for SSR
  })

  // State for loading initial messages
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(true);

  // Load existing conversation history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const sessionManager = new AISessionManager(userId);
        const existingSession = await sessionManager.getSession();
        
        if (existingSession && existingSession.messages) {
          const messages = existingSession.messages as Message[];
          setInitialMessages(messages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsChatLoading(false);
      }
    };

    loadChatHistory();
  }, [userId]);

  const {
    messages,
    handleSubmit,
    input,
    handleInputChange,
    append,
    isLoading,
    stop,
    status,
  } = useChat({
    maxSteps: 20,
    initialMessages: initialMessages,
    body: {
      userId: userId
    }
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(true);

  useEffect(() => {
    if (!isChatLoading) {
      inputRef.current?.focus();
    }
  }, [isChatLoading]);

  // Add new useEffect to focus after loading completes
  useEffect(() => {
    if (!isLoading && !isChatLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, isChatLoading]);

  // Hide modal when user starts chatting
  useEffect(() => {
    if (messages.length > 0) {
      setShowSupabaseModal(false);
    }
  }, [messages.length]);

  // Don't render chat until we've loaded the initial messages
  if (isChatLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-dvh">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-dvh">
      <div className="flex flex-col h-full">
        <Header />
        
        {/* Supabase Test Modal */}
        <Modal 
          isOpen={showSupabaseModal && messages.length === 0}
          onClose={() => setShowSupabaseModal(false)}
          title="Supabase Connection Test"
        >
          <SupabaseTest />
        </Modal>
        
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput
          inputRef={inputRef}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          status={status}
          stop={stop}
          messages={messages}
          append={append}
        />
      </div>
    </div>
  );
}