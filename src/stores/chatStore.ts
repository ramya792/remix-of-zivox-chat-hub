import { create } from "zustand";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  startAfter,
  type Unsubscribe,
  type DocumentData,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  replyTo?: string;
  seenBy: string[];
  deliveredTo: string[];
  reactions: Record<string, string>;
  edited: boolean;
  deletedForEveryone: boolean;
  timestamp: any;
}

export interface Chat {
  id: string;
  type: "private" | "group";
  members: string[];
  lastMessage: string;
  lastMessageTime: any;
  pinnedBy: string[];
  mutedBy: string[];
  createdAt: any;
  // Populated client-side
  otherUser?: {
    uid: string;
    name: string;
    profilePic: string;
    onlineStatus: boolean;
    lastSeen: any;
  };
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  loadingChats: boolean;
  loadingMessages: boolean;
  typingUsers: Record<string, boolean>;
  chatListUnsub: Unsubscribe | null;
  messageUnsub: Unsubscribe | null;
  lastMessageDoc: DocumentData | null;
  hasMoreMessages: boolean;

  subscribeChats: (uid: string) => void;
  setActiveChat: (chat: Chat | null) => void;
  subscribeMessages: (chatId: string) => void;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<void>;
  loadMoreMessages: (chatId: string) => Promise<void>;
  setTyping: (chatId: string, uid: string, isTyping: boolean) => void;
  startChat: (currentUid: string, otherUid: string) => Promise<string>;
  deleteMessage: (chatId: string, messageId: string, forEveryone: boolean) => Promise<void>;
  editMessage: (chatId: string, messageId: string, newText: string) => Promise<void>;
  addReaction: (chatId: string, messageId: string, uid: string, emoji: string) => Promise<void>;
  cleanup: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  loadingChats: false,
  loadingMessages: false,
  typingUsers: {},
  chatListUnsub: null,
  messageUnsub: null,
  lastMessageDoc: null,
  hasMoreMessages: true,

  subscribeChats: (uid) => {
    const prev = get().chatListUnsub;
    if (prev) prev();
    set({ loadingChats: true });

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", uid),
      orderBy("lastMessageTime", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chats: Chat[] = [];
      for (const d of snap.docs) {
        const data = d.data();
        const chat: Chat = {
          id: d.id,
          type: data.type || "private",
          members: data.members || [],
          lastMessage: data.lastMessage || "",
          lastMessageTime: data.lastMessageTime,
          pinnedBy: data.pinnedBy || [],
          mutedBy: data.mutedBy || [],
          createdAt: data.createdAt,
        };

        if (chat.type === "private") {
          const otherUid = chat.members.find((m) => m !== uid);
          if (otherUid) {
            const { getDoc } = await import("firebase/firestore");
            const userSnap = await getDoc(doc(db, "users", otherUid));
            if (userSnap.exists()) {
              const u = userSnap.data();
              chat.otherUser = {
                uid: otherUid,
                name: u.name || "User",
                profilePic: u.profilePic || "",
                onlineStatus: u.onlineStatus || false,
                lastSeen: u.lastSeen,
              };
            }
          }
        }
        chats.push(chat);
      }
      set({ chats, loadingChats: false });
    });

    set({ chatListUnsub: unsub });
  },

  setActiveChat: (chat) => {
    const prev = get().messageUnsub;
    if (prev) prev();
    set({ activeChat: chat, messages: [], lastMessageDoc: null, hasMoreMessages: true });
    if (chat) {
      get().subscribeMessages(chat.id);
    }
  },

  subscribeMessages: (chatId) => {
    const prev = get().messageUnsub;
    if (prev) prev();
    set({ loadingMessages: true });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const messages: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      const last = snap.docs[snap.docs.length - 1] || null;
      set({
        messages: messages.reverse(),
        loadingMessages: false,
        lastMessageDoc: last,
        hasMoreMessages: snap.docs.length === 30,
      });
    });

    set({ messageUnsub: unsub });
  },

  sendMessage: async (chatId, senderId, text) => {
    if (!text.trim()) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId,
      text: text.trim(),
      seenBy: [senderId],
      deliveredTo: [senderId],
      reactions: {},
      edited: false,
      deletedForEveryone: false,
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
    });
  },

  loadMoreMessages: async (chatId) => {
    const { lastMessageDoc, hasMoreMessages } = get();
    if (!hasMoreMessages || !lastMessageDoc) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "desc"),
      startAfter(lastMessageDoc),
      limit(30)
    );

    const snap = await getDocs(q);
    const older: Message[] = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[];
    const last = snap.docs[snap.docs.length - 1] || null;

    set((s) => ({
      messages: [...older.reverse(), ...s.messages],
      lastMessageDoc: last || s.lastMessageDoc,
      hasMoreMessages: snap.docs.length === 30,
    }));
  },

  setTyping: async (chatId, uid, isTyping) => {
    const ref = doc(db, "chats", chatId, "typing", uid);
    if (isTyping) {
      await setDoc(ref, { isTyping: true, timestamp: serverTimestamp() });
    } else {
      await deleteDoc(ref).catch(() => {});
    }
  },

  startChat: async (currentUid, otherUid) => {
    // Check if chat exists
    const q = query(
      collection(db, "chats"),
      where("type", "==", "private"),
      where("members", "array-contains", currentUid)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      if (data.members?.includes(otherUid)) {
        return d.id;
      }
    }
    // Create new
    const ref = await addDoc(collection(db, "chats"), {
      type: "private",
      members: [currentUid, otherUid],
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      pinnedBy: [],
      mutedBy: [],
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  deleteMessage: async (chatId, messageId, forEveryone) => {
    if (forEveryone) {
      await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
        deletedForEveryone: true,
        text: "",
        mediaUrl: "",
      });
    }
  },

  editMessage: async (chatId, messageId, newText) => {
    await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
      text: newText,
      edited: true,
    });
  },

  addReaction: async (chatId, messageId, uid, emoji) => {
    const msgRef = doc(db, "chats", chatId, "messages", messageId);
    await updateDoc(msgRef, {
      [`reactions.${uid}`]: emoji,
    });
  },

  cleanup: () => {
    const { chatListUnsub, messageUnsub } = get();
    if (chatListUnsub) chatListUnsub();
    if (messageUnsub) messageUnsub();
    set({ chats: [], messages: [], activeChat: null, chatListUnsub: null, messageUnsub: null });
  },
}));
