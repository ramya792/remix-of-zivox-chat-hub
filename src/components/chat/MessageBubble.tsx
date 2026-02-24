import { memo, useState } from "react";
import { useChatStore, type Message } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { Check, CheckCheck, MoreHorizontal, Pencil, Trash2, Reply, Copy, Play } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  message: Message;
  isOwn: boolean;
  chatId: string;
  fontSize?: "small" | "medium" | "large";
}

const emojis = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

const MessageBubble = memo(({ message, isOwn, chatId, fontSize }: Props) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { deleteMessage, editMessage, addReaction } = useChatStore();
  const { user } = useAuthStore();

  if (message.deletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}>
        <div className="px-4 py-2 rounded-2xl bg-muted/50 text-muted-foreground text-sm italic">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const reactions = Object.entries(message.reactions || {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      <div className="max-w-[80%] md:max-w-[65%] relative">
        <div
          className={`px-3.5 py-2 leading-relaxed ${
            fontSize === "large" ? "text-base" : fontSize === "small" ? "text-xs" : "text-sm"
          } ${
            isOwn
              ? "bg-chat-bubble-own text-chat-bubble-own-foreground rounded-2xl rounded-br-md"
              : "bg-chat-bubble-other text-chat-bubble-other-foreground rounded-2xl rounded-bl-md"
          }`}
        >
          {/* Media content */}
          {message.mediaUrl && message.mediaType === "image" && (
            <div className="mb-1 -mx-1.5 -mt-0.5 overflow-hidden rounded-xl">
              <img
                src={message.mediaUrl}
                alt="Shared photo"
                className="max-w-full max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.mediaUrl, "_blank")}
              />
            </div>
          )}
          {message.mediaUrl && message.mediaType === "video" && (
            <div className="mb-1 -mx-1.5 -mt-0.5 overflow-hidden rounded-xl">
              <video
                src={message.mediaUrl}
                controls
                className="max-w-full max-h-64 rounded-xl"
              />
            </div>
          )}
          {message.mediaUrl && message.mediaType === "audio" && (
            <div className="mb-1 min-w-[200px]">
              <audio src={message.mediaUrl} controls className="w-full h-8" />
            </div>
          )}
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {message.edited && (
              <span className="text-[10px] opacity-60">edited</span>
            )}
            <span className="text-[10px] opacity-60">{formatTime(message.timestamp)}</span>
            {isOwn && (
              <span className="opacity-60">
                {message.seenBy?.length > 1 ? (
                  <CheckCheck className="w-3 h-3 text-accent" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className={`flex gap-0.5 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            {reactions.map(([uid, emoji]) => (
              <span key={uid} className="text-xs bg-card rounded-full px-1.5 py-0.5 border border-border shadow-sm">
                {emoji}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div
            className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} px-1 flex items-center gap-0.5`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 rounded-md hover:bg-secondary text-muted-foreground text-xs"
            >
              😊
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => {
                    const newText = prompt("Edit message:", message.text);
                    if (newText && newText !== message.text) editMessage(chatId, message.id, newText);
                  }}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteMessage(chatId, message.id, true)}
                  className="p-1 rounded-md hover:bg-secondary text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -top-10 ${isOwn ? "right-0" : "left-0"} bg-card border border-border rounded-full px-2 py-1 flex gap-1 shadow-lg z-10`}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  if (user) addReaction(chatId, message.id, user.uid, emoji);
                  setShowReactions(false);
                }}
                className="hover:scale-125 transition-transform text-sm"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = "MessageBubble";
export default MessageBubble;
