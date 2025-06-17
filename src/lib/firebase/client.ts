// This is a MOCK Firebase client initialization.
// In a real app, you would initialize Firebase here using the Firebase SDK.
// For example:
// import { initializeApp, getApp, getApps } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);
// const db = getFirestore(app);

// export { app, auth, db };

// Mock implementations:
const mockApp = {};
const mockAuth = {
  // Mock auth functions as needed by useAuth or components
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate async auth state check
    setTimeout(() => {
      try {
        const storedUser = localStorage.getItem('authUser');
        if (storedUser) {
          callback(JSON.parse(storedUser));
        } else {
          callback(null);
        }
      } catch (error) {
        // Handle cases where localStorage is not available (e.g. server-side during SSR pre-useEffect)
        callback(null);
      }
    }, 100);
    return () => {}; // Unsubscribe function
  },
  // Add other mock auth methods if directly called from client components
};

const mockDb = {}; // Mock Firestore instance

export { mockApp as app, mockAuth as auth, mockDb as db };
