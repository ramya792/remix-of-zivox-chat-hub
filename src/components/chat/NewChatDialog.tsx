import { useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { X, Search, Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
}

interface UserResult {
  uid: string;
  name: string;
  email: string;
  profilePic: string;
}

const NewChatDialog = ({ onClose }: Props) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const { user } = useAuthStore();
  const { startChat, setActiveChat, subscribeChats } = useChatStore();

  const handleSearch = async () => {
    if (!search.trim() || !user) return;
    setSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", search.trim().toLowerCase()),
        limit(10)
      );
      const snap = await getDocs(q);
      const users: UserResult[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.uid !== user.uid) {
          users.push({
            uid: data.uid,
            name: data.name,
            email: data.email,
            profilePic: data.profilePic || "",
          });
        }
      });
      setResults(users);
    } catch (e) {
      console.error("Search error:", e);
    }
    setSearching(false);
  };

  const handleStartChat = async (otherUid: string) => {
    if (!user) return;
    setStarting(true);
    try {
      const chatId = await startChat(user.uid, otherUid);
      subscribeChats(user.uid);
      // Find or wait for the chat to appear
      setTimeout(() => {
        const { chats } = useChatStore.getState();
        const chat = chats.find((c) => c.id === chatId);
        if (chat) setActiveChat(chat);
        onClose();
      }, 1000);
    } catch (e) {
      console.error("Start chat error:", e);
    }
    setStarting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">New Chat</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border-none outline-none text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>

          <div className="mt-4 max-h-60 overflow-y-auto">
            {results.length === 0 && !searching && (
              <p className="text-center text-muted-foreground text-sm py-8">
                Search for a user by their email address
              </p>
            )}
            {results.map((u) => (
              <button
                key={u.uid}
                onClick={() => handleStartChat(u.uid)}
                disabled={starting}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-semibold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewChatDialog;
