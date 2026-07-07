import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBgnq4IPwYcxG7a3NCixNN1vxyX5XQ_Q3Y",
  authDomain: "subtle-keyword-mdckx.firebaseapp.com",
  projectId: "subtle-keyword-mdckx",
  storageBucket: "subtle-keyword-mdckx.firebasestorage.app",
  messagingSenderId: "385069958741",
  appId: "1:385069958741:web:702007b8129948f96f36dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-automanager-64d7f017-328c-4fb9-add6-ffeea630ebd3");
export { GoogleAuthProvider, signInWithPopup, signOut };
