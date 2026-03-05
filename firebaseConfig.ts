import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// REPLACE THESE VALUES WITH YOUR FIREBASE CONSOLE CONFIG
// OR USE ENVIRONMENT VARIABLES (Recommended: .env.local)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Check if config is valid (at least apiKey must exist and not be the placeholder)
const isValidConfig = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" &&
    !firebaseConfig.apiKey.includes("YOUR_");

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isValidConfig) {
  try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log("Firebase Initialized Successfully");
  } catch(e) {
      console.error("Firebase Initialization Failed:", e);
  }
} else {
    console.warn("Firebase Config missing or invalid. Cloud features disabled. (Update firebaseConfig.ts or .env to enable)");
}

export { auth, db };