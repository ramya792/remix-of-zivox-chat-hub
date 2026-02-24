import { useState, useRef, useEffect, memo, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore, type Message } from "@/stores/chatStore";
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Paperclip, Mic, Check, CheckCheck, X, Square, UserCircle, Search as SearchIcon, Volume2, VolumeX, Ban, Trash2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface Props {
  onBack: () => void;
}

const ChatWindow = memo(({ onBack }: Props) => {
  const { user, profile } = useAuthStore();
  const fontSize = profile?.fontSize || "medium";
  const { activeChat, messages, sendMessage, sendMediaMessage, loadingMessages, loadMoreMessages, hasMoreMessages, muteChat, clearChat } = useChatStore();
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const callingRef = useRef(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleCall = useCallback(async (type: "voice" | "video") => {
    if (!user || !activeChat?.otherUser || callingRef.current) return;
    callingRef.current = true;
    const other = activeChat.otherUser;
    try {
      await addDoc(collection(db, "calls"), {
        callerId: user.uid,
        callerName: profile?.name || user.displayName || "You",
        callerPic: profile?.profilePic || "",
        receiverId: other.uid,
        receiverName: other.name,
        receiverPic: other.profilePic || "",
        type,
        status: "outgoing",
        duration: 0,
        participants: [user.uid, other.uid],
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Call record error:", e);
    } finally {
      setTimeout(() => { callingRef.current = false; }, 2000);
    }
  }, [user, profile, activeChat]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

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

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  const onEmojiClick = useCallback((emojiData: any) => {
    setText((prev) => prev + emojiData.emoji);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !user) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;
    setUploading(true);
    setUploadError("");
    try {
      await sendMediaMessage(activeChat.id, user.uid, file, isImage ? "image" : "video");
      setAutoScroll(true);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setUploadError("Failed to send. Check your connection and try again.");
      setTimeout(() => setUploadError(""), 4000);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 0 && activeChat && user) {
          const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
          setUploading(true);
          setUploadError("");
          try {
            await sendMediaMessage(activeChat.id, user.uid, file, "audio");
            setAutoScroll(true);
          } catch (err: any) {
            console.error("Voice upload failed:", err);
            setUploadError("Failed to send voice message. Try again.");
            setTimeout(() => setUploadError(""), 4000);
          }
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      stream?.getTracks().forEach((t) => t.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleViewContact = () => { setShowMenu(false); setShowContactInfo(true); };
  const handleSearchInChat = () => { setShowMenu(false); setSearchMode(true); };
  const handleMuteToggle = async () => {
    if (!activeChat || !user) return;
    setShowMenu(false);
    const muted = activeChat.mutedBy?.includes(user.uid);
    try { await muteChat(activeChat.id, user.uid, !muted); } catch (e) { console.error("Mute error:", e); }
  };
  const handleClearChat = () => { setShowMenu(false); setShowClearConfirm(true); };
  const confirmClearChat = async () => {
    if (!activeChat) return;
    try { await clearChat(activeChat.id); } catch (e) { console.error("Clear chat error:", e); }
    setShowClearConfirm(false);
  };

  const filteredMessages = searchMode && searchQuery.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!activeChat) return null;

  const otherUser = activeChat.otherUser;
  const isMuted = activeChat.mutedBy?.includes(user?.uid || "");
  const showOnline = otherUser?.onlineStatus && otherUser?.onlineStatusVisible !== false;
  const getStatusText = () => {
    if (otherUser?.onlineStatusVisible === false) return "";
    if (otherUser?.onlineStatus) return "Online";
    if (otherUser?.lastSeenVisibility === "nobody") return "";
    if (otherUser?.lastSeen) {
      try {
        const d = otherUser.lastSeen?.toDate ? otherUser.lastSeen.toDate() : new Date(otherUser.lastSeen);
        return `Last seen ${formatDistanceToNow(d, { addSuffix: true })}`;
      } catch { return "Offline"; }
    }
    return "Offline";
  };

  return (
    <div className={`h-full flex flex-col bg-chat-bg relative overflow-hidden ${fontSize === "large" ? "text-[18px]" : fontSize === "small" ? "text-[13px]" : "text-[15px]"}`}>
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
          {showOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {otherUser?.name || "Unknown"}
            {isMuted && <VolumeX className="inline w-3 h-3 ml-1 text-muted-foreground" />}
          </h3>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleCall("voice")} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <Phone className="w-4 h-4" />
          </button>
          <button onClick={() => handleCall("video")} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <Video className="w-4 h-4" />
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 w-52 bg-card rounded-xl shadow-xl border border-border py-1.5 z-50"
                >
                  <button onClick={handleViewContact} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left text-sm text-foreground">
                    <UserCircle className="w-4 h-4 text-muted-foreground" /> View contact
                  </button>
                  <button onClick={handleSearchInChat} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left text-sm text-foreground">
                    <SearchIcon className="w-4 h-4 text-muted-foreground" /> Search in chat
                  </button>
                  <button onClick={handleMuteToggle} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left text-sm text-foreground">
                    {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                    {isMuted ? "Unmute notifications" : "Mute notifications"}
                  </button>
                  <button onClick={() => setShowMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left text-sm text-foreground">
                    <Ban className="w-4 h-4 text-muted-foreground" /> Block user
                  </button>
                  <div className="border-t border-border my-1" />
                  <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/60 text-left text-sm text-destructive">
                    <Trash2 className="w-4 h-4" /> Clear chat
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {searchMode && (
        <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border flex-shrink-0">
          <SearchIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in chat..." className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" autoFocus />
          <span className="text-xs text-muted-foreground flex-shrink-0">{searchQuery.trim() ? `${filteredMessages.length} found` : ""}</span>
          <button onClick={() => { setSearchMode(false); setSearchQuery(""); }} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            {filteredMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.uid}
                chatId={activeChat.id}
                fontSize={fontSize}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload status bar */}
      {uploading && (
        <div className="px-4 py-2 bg-primary/10 border-t border-border flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-primary font-medium">Uploading...</span>
        </div>
      )}
      {uploadError && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-border flex items-center justify-between">
          <span className="text-xs text-destructive">{uploadError}</span>
          <button onClick={() => setUploadError("")} className="text-destructive p-0.5"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-card border-t border-border flex-shrink-0 relative">
        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-2 mb-2 z-30"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                width={320}
                height={400}
                searchDisabled={false}
                skinTonesDisabled
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isRecording ? (
          <div className="flex items-center gap-3">
            <button
              onClick={cancelRecording}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-destructive flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-foreground font-medium">{formatRecordingTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">Recording...</span>
            </div>
            <button
              onClick={stopRecording}
              className="p-2.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0 mb-0.5 ${showEmoji ? "text-primary" : "text-muted-foreground"}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0 mb-0.5"
            >
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
              <button
                onClick={startRecording}
                className="p-2.5 rounded-full bg-primary text-primary-foreground flex-shrink-0 hover:opacity-90 transition-opacity"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contact Info Panel */}
      <AnimatePresence>
        {showContactInfo && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2 }}
            className="absolute inset-0 z-40 bg-background flex flex-col"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
              <button onClick={() => setShowContactInfo(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-semibold text-foreground">Contact Info</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="flex flex-col items-center py-8">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {otherUser?.profilePic ? (
                    <img src={otherUser.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-3xl">{otherUser?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground">{otherUser?.name}</h2>
                {showOnline && <span className="text-xs text-green-400 mt-1">Online</span>}
                {!showOnline && getStatusText() && <span className="text-xs text-muted-foreground mt-1">{getStatusText()}</span>}
              </div>
              <div className="border-t border-border">
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                  <p className="text-sm text-foreground ml-7">{otherUser?.email || "Not available"}</p>
                </div>
                <div className="px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">About</p>
                  <p className="text-sm text-foreground">{otherUser?.bio || "Hey there! I'm using ZIVOX"}</p>
                </div>
              </div>
              <div className="border-t border-border mt-2">
                <button onClick={() => { setShowContactInfo(false); handleMuteToggle(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 text-left text-sm text-foreground">
                  {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                  {isMuted ? "Unmute notifications" : "Mute notifications"}
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 text-left text-sm text-destructive">
                  <Ban className="w-4 h-4" /> Block {otherUser?.name}
                </button>
                <button onClick={() => { setShowContactInfo(false); handleClearChat(); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 text-left text-sm text-destructive">
                  <Trash2 className="w-4 h-4" /> Clear chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Chat Confirmation */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl p-6 border border-border mx-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-foreground mb-2">Clear chat?</h3>
              <p className="text-sm text-muted-foreground mb-5">All messages will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:opacity-90">Cancel</button>
                <button onClick={confirmClearChat} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90">Clear</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ChatWindow.displayName = "ChatWindow";
export default ChatWindow;
