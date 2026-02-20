import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import EmptyChat from "@/components/chat/EmptyChat";
import { motion, AnimatePresence } from "framer-motion";

const ChatPage = () => {
  const { user, profile } = useAuthStore();
  const { activeChat, subscribeChats, cleanup, setActiveChat } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (user) {
      subscribeChats(user.uid);
    }
    return () => cleanup();
  }, [user]);

  // On mobile, hide sidebar when chat is active
  const handleChatSelect = useCallback(() => {
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveChat(null);
    setShowSidebar(true);
  }, [setActiveChat]);

  if (!user || !profile) return null;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(showSidebar || window.innerWidth >= 768) && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full md:w-[380px] lg:w-[420px] h-full flex-shrink-0 border-r border-border md:relative absolute z-20 bg-background"
          >
            <ChatSidebar onChatSelect={handleChatSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 h-full min-w-0">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key={activeChat.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <ChatWindow onBack={handleBack} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full hidden md:flex"
            >
              <EmptyChat />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatPage;
