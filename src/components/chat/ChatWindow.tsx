import { useState, useRef, useEffect, memo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore, type Message } from "@/stores/chatStore";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Paperclip, Mic, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Props {
  onBack: () => void;
}

const ChatWindow = memo(({ onBack }: Props) => {
  const { user } = useAuthStore();
  const { activeChat, messages, sendMessage, loadingMessages, loadMoreMessages, hasMoreMessages } = useChatStore();
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    // Load more when scrolled to top
    if (el.scrollTop < 50 && hasMoreMessages && activeChat) {
      loadMoreMessages(activeChat.id);
    }
    // Auto scroll detection
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  const handleSend = async () => {
    if (!text.trim() || !activeChat || !user) return;
    const msg = text;
    setText("");
    setAutoScroll(true);
    await sendMessage(activeChat.id, user.uid, msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChat) return null;

  const otherUser = activeChat.otherUser;

  return (
    <div className="h-full flex flex-col bg-chat-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {otherUser?.profilePic ? (
              <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-semibold text-sm">
                {otherUser?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>
          {otherUser?.onlineStatus && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{otherUser?.name || "Unknown"}</h3>
          <p className="text-xs text-muted-foreground">
            {otherUser?.onlineStatus ? "Online" : "Offline"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 chat-pattern"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.uid}
                chatId={activeChat.id}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0 mb-0.5">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0 mb-0.5">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 rounded-2xl bg-secondary text-foreground placeholder:text-muted-foreground border-none outline-none text-sm resize-none max-h-32"
              style={{ minHeight: "40px" }}
            />
          </div>
          {text.trim() ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleSend}
              className="p-2.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          ) : (
            <button className="p-2.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity">
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
export default ChatWindow;
