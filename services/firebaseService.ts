import { auth, db } from "../firebaseConfig";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { UserStats } from "../types";

// --- Authentication ---

export const initAuth = (onUserChange: (user: User | null) => void) => {
    if (!auth) {
        console.log("Auth not initialized (Offline/Local Mode)");
        return () => {}; // Return dummy unsubscribe function
    }

    // Listen for auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Firebase User:", user.uid);
            onUserChange(user);
        } else {
            // Auto-sign in anonymously if not signed in
            signInAnonymously(auth).catch((error) => {
                console.error("Auth Error", error);
            });
        }
    });
    return unsubscribe;
};

// --- User Stats Syncing ---

export const syncUserStats = async (user: User, stats: UserStats) => {
    if (!user || !db) return;
    try {
        const userRef = doc(db, "users", user.uid);
        // We merge: true so we don't overwrite other fields if they exist later
        await setDoc(userRef, { 
            stats, 
            lastUpdated: serverTimestamp() 
        }, { merge: true });
    } catch (e) {
        console.error("Firebase Sync Error:", e);
    }
};

export const loadUserStats = async (user: User): Promise<UserStats | null> => {
    if (!user || !db) return null;
    try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.stats as UserStats;
        }
    } catch (e) {
        console.error("Firebase Load Error:", e);
    }
    return null;
};

// --- Community Contributions ---

export const uploadContributedWord = async (user: User | null, topic: string, answer: string, clue: string) => {
    if (!db) {
        console.log("Cloud upload skipped (Offline/Local Mode)");
        return;
    }
    try {
        // We save to a global 'contributions' collection
        // This allows you (the dev) to review them or other users to download them later
        await addDoc(collection(db, "contributions"), {
            uid: user ? user.uid : 'anonymous',
            topic,
            answer,
            clue,
            timestamp: serverTimestamp(),
            status: 'pending' // You could add an approval workflow later
        });
        console.log("Uploaded to Firebase");
    } catch (e) {
        console.error("Upload Error:", e);
    }
};