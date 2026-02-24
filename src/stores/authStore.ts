import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { profilePicToBase64 } from "@/lib/imageUtils";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profilePic: string;
  bio: string;
  onlineStatus: boolean;
  lastSeen: any;
  // Privacy settings
  lastSeenVisibility?: "everyone" | "contacts" | "nobody";
  onlineStatusVisible?: boolean;
  profilePhotoVisibility?: "everyone" | "contacts" | "nobody";
  aboutVisibility?: "everyone" | "contacts" | "nobody";
  readReceipts?: boolean;
  groupsAddMe?: "everyone" | "contacts" | "nobody";
  // Chat settings
  enterIsSend?: boolean;
  fontSize?: "small" | "medium" | "large";
  archivedChats?: "keep" | "auto";
  // Notification settings
  muteAll?: boolean;
  messageSound?: boolean;
  messageVibrate?: boolean;
  messagePopup?: boolean;
  groupNotifications?: boolean;
  callNotifications?: boolean;
  // Data settings
  autoDownloadWifi?: boolean;
  autoDownloadMobile?: boolean;
  dataSaver?: boolean;
  // Status settings
  statusVisibility?: "everyone" | "contacts" | "nobody";
  statusAutoDelete?: boolean;
  // Appearance
  darkMode?: boolean;
  appLanguage?: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<Omit<UserProfile, "uid" | "email">>) => Promise<void>;
  updateProfilePic: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  clearError: () => void;
  init: () => () => void;
}

const createOrUpdateUser = async (user: User, name?: string) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: name || user.displayName || "User",
      email: user.email || "",
      profilePic: user.photoURL || "",
      bio: "",
      onlineStatus: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(userRef, { onlineStatus: true, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  }
  const updated = await getDoc(userRef);
  return updated.data() as UserProfile;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const profile = await createOrUpdateUser(cred.user, name);
      set({ user: cred.user, profile, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await createOrUpdateUser(cred.user);
      set({ user: cred.user, profile, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const profile = await createOrUpdateUser(cred.user);
      set({ user: cred.user, profile, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  logout: async () => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid), { onlineStatus: false, lastSeen: serverTimestamp() }, { merge: true });
    }
    await signOut(auth);
    set({ user: null, profile: null });
  },

  updateUserProfile: async (data) => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
    if (data.name) {
      await updateProfile(user, { displayName: data.name });
    }
    // Force profile refresh from Firestore
    const snap = await getDoc(userRef);
    set({ profile: { ...snap.data() } as UserProfile });
  },

  updateProfilePic: async (file) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    // Convert to base64 data URL (no Firebase Storage, no CORS issues)
    const dataUrl = await profilePicToBase64(file);
    await updateDoc(doc(db, "users", user.uid), { profilePic: dataUrl, updatedAt: serverTimestamp() });
    // Don't set photoURL on Firebase Auth — base64 data URLs are too long for Auth profile
    const snap = await getDoc(doc(db, "users", user.uid));
    set({ profile: snap.data() as UserProfile });
  },

  changePassword: async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No user");
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  },

  deleteAccount: async (password) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No user");
    const cred = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, cred);
    await deleteUser(user);
    set({ user: null, profile: null });
  },

  clearError: () => set({ error: null }),

  init: () => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await createOrUpdateUser(user);
        set({ user, profile, initialized: true, loading: false });
      } else {
        set({ user: null, profile: null, initialized: true, loading: false });
      }
    });
    return unsub;
  },
}));
