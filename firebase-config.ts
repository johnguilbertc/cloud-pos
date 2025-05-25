// firebase-config.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Define a type for the Firebase config object for clarity
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string; // Added measurementId as optional, as it's in user's config
}

// Placeholder for API key, used to check if config is default
export const PLACEHOLDER_API_KEY = "YOUR_FIREBASE_API_KEY_HERE";
export const PLACEHOLDER_PROJECT_ID = "YOUR_FIREBASE_PROJECT_ID_HERE";

// Default configuration object with environment variables
export const defaultConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || PLACEHOLDER_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PLACEHOLDER_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app: FirebaseApp = initializeApp(defaultConfig);
export const db: Firestore = getFirestore(app);

// Helper function to check if the current config is just placeholders
export const isConfigEffectivelyDefault = (config: FirebaseConfig): boolean => {
  return config.apiKey === PLACEHOLDER_API_KEY || config.projectId === PLACEHOLDER_PROJECT_ID;
};
