import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import StatusPage from "@/pages/StatusPage";
import CallsPage from "@/pages/CallsPage";
import SettingsPage from "@/pages/SettingsPage";
import BottomNav, { type TabId } from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";

// Simple AI responses
const AI_RESPONSES: Record<string, string> = {
  hello: "Hey there! 👋 I'm ZIVOX AI. How can I help you today?",
  hi: "Hi! 👋 I'm ZIVOX AI assistant. Ask me anything!",
  hey: "Hey! 😊 What can I do for you?",
  help: "I can help you with:\n• Chatting tips\n• App features info\n• General questions\nJust ask away!",
  "how are you": "I'm doing great, thanks for asking! 😊 How about you?",
  thanks: "You're welcome! 😊 Happy to help!",
  "thank you": "You're welcome! Let me know if you need anything else! 🙌",
  bye: "Goodbye! 👋 Have a great day!",
  features: "ZIVOX has these features:\n• Real-time messaging\n• Voice notes\n• Image & video sharing\n• Status stories\n• Voice & video calls\n• Profile customization",
  name: "I'm ZIVOX AI, your personal assistant built right into the app! 🤖",
  who: "I'm ZIVOX AI — a smart assistant here to help you navigate and use this app! ✨",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  const fallbacks = [
    "That's interesting! Tell me more 🤔",
    "I'm still learning! Try asking about app features or say 'help' 😊",
    "Hmm, I'm not sure about that. But I'm here to chat! 💬",
    "Great question! I'll get smarter over time. For now, try asking about features or say 'help'! 🚀",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

interface AIMessage {
  id: number;
  text: string;
  from: "user" | "ai";
  time: string;
}

const ChatPage = () => {
  const { user, profile } = useAuthStore();
  const { activeChat, subscribeChats, cleanup, setActiveChat } = useChatStore();
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("chats");

  // Meta AI state
  const [showAI, setShowAI] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    { id: 0, text: "Hey! I'm ZIVOX AI ✨\nHow can I help you today?", from: "ai", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [aiInput, setAiInput] = useState("");

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

  const handleAISend = () => {
    const text = aiInput.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: AIMessage = { id: Date.now(), text, from: "user", time: now };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setTimeout(() => {
      const reply = getAIResponse(text);
      const aiMsg: AIMessage = { id: Date.now() + 1, text: reply, from: "ai", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setAiMessages((prev) => [...prev, aiMsg]);
    }, 600 + Math.random() * 800);
  };

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
            {/* Sidebar — always visible when no active chat, or on desktop */}
            {(showSidebar || !activeChat) && (
              <div
                className={`h-full flex-shrink-0 border-r border-border bg-background ${
                  activeChat
                    ? "hidden md:block md:w-[380px] lg:w-[420px]"
                    : "w-full"
                }`}
              >
                <ChatSidebar onChatSelect={handleChatSelect} />
              </div>
            )}
            {activeChat && (
              <div className="flex-1 h-full min-w-0">
                <ChatWindow onBack={handleBack} />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col relative">
        {renderTabContent()}

        {/* AI Meta FAB */}
        {activeTab === "chats" && !activeChat && !showAI && (
          <button
            onClick={() => setShowAI(true)}
            className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-10"
            title="ZIVOX AI"
          >
            <Bot className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* AI Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">ZIVOX AI</h3>
                <p className="text-xs text-primary">Online · Ask me anything</p>
              </div>
              <button onClick={() => setShowAI(false)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {aiMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.from === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAISend()}
                  placeholder="Ask ZIVOX AI..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-secondary text-foreground placeholder:text-muted-foreground text-sm outline-none"
                />
                <button onClick={handleAISend} disabled={!aiInput.trim()} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default ChatPage;
