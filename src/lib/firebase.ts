import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCrsCZ32QhxAJb7W4htJXW0XW7rd8CMuU0",
  authDomain: "zivox-70de2.firebaseapp.com",
  projectId: "zivox-70de2",
  storageBucket: "zivox-70de2.firebasestorage.app",
  messagingSenderId: "136274815343",
  appId: "1:136274815343:web:e06373cef02f4ac814a09a",
  measurementId: "G-D14QF1BGL5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence failed: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence not available");
  }
});
