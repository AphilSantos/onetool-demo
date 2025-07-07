"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useAuthKit } from "@picahq/authkit";
import { Header } from "./components/Header";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { SupabaseTest } from "./components/SupabaseTest";
import { Modal } from "@/components/ui/modal";

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
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Add new useEffect to focus after loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Hide modal when user starts chatting
  useEffect(() => {
    if (messages.length > 0) {
      setShowSupabaseModal(false);
    }
  }, [messages.length]);

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