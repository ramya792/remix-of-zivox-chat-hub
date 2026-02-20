import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profilePic: string;
  bio: string;
  onlineStatus: boolean;
  lastSeen: any;
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
