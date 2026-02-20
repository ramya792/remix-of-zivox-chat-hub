import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import EmptyChat from "@/components/chat/EmptyChat";
import StatusPage from "@/pages/StatusPage";
import CallsPage from "@/pages/CallsPage";
import SettingsPage from "@/pages/SettingsPage";
import BottomNav, { type TabId } from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

const ChatPage = () => {
  const { user, profile } = useAuthStore();
  const { activeChat, subscribeChats, cleanup, setActiveChat } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("chats");

  useEffect(() => {
    if (user) {
      subscribeChats(user.uid);
    }
    return () => cleanup();
  }, [user]);

  const handleChatSelect = useCallback(() => {
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setActiveChat(null);
    setShowSidebar(true);
  }, [setActiveChat]);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tab !== "chats") {
      setActiveChat(null);
    }
  }, [setActiveChat]);

  if (!user || !profile) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "status":
        return <StatusPage />;
      case "calls":
        return <CallsPage />;
      case "settings":
        return <SettingsPage />;
      case "chats":
      default:
        return (
          <div className="flex-1 flex min-h-0">
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
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 flex flex-col"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>

        {/* AI Meta Button */}
        {activeTab === "chats" && !activeChat && (
          <button
            className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-10"
            title="AI Meta"
          >
            <Bot className="w-6 h-6" />
          </button>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default ChatPage;
