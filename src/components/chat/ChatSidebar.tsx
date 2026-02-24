import { useState, memo, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore, type Chat } from "@/stores/chatStore";
import { Search, Plus, LogOut, MessageCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import NewChatDialog from "./NewChatDialog";
import { formatDistanceToNow } from "date-fns";

interface Props {
  onChatSelect: () => void;
}

const ChatSidebar = memo(({ onChatSelect }: Props) => {
  const { profile, logout } = useAuthStore();
  const { chats, loadingChats, setActiveChat, activeChat } = useChatStore();
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  const filteredChats = chats.filter((chat) => {
    if (!search) return true;
    const name = chat.otherUser?.name || "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = useCallback((chat: Chat) => {
    setActiveChat(chat);
    onChatSelect();
  }, [setActiveChat, onChatSelect]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: false });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {profile?.profilePic ? (
              <img src={profile.profilePic} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-semibold text-sm">
                {profile?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">ZIVOX</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-none outline-none text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingChats ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "No chats found" : "No conversations yet"}
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-3 text-primary text-sm font-medium hover:underline"
            >
              Start a conversation
            </button>
          </div>
        ) : (
          filteredChats.map((chat, i) => (
            <motion.button
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left ${
                activeChat?.id === chat.id ? "bg-secondary" : ""
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {chat.otherUser?.profilePic ? (
                    <img src={chat.otherUser.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold">
                      {chat.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                {chat.otherUser?.onlineStatus && chat.otherUser?.onlineStatusVisible !== false && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground truncate">
                    {chat.otherUser?.name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {showNewChat && <NewChatDialog onClose={() => setShowNewChat(false)} />}
    </div>
  );
});

ChatSidebar.displayName = "ChatSidebar";
export default ChatSidebar;
