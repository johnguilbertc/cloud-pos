import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { defaultConfig, isConfigEffectivelyDefault, FirebaseConfig, PLACEHOLDER_PROJECT_ID } from '../firebase-config';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import { getDocs, collection } from 'firebase/firestore';
import { db, app } from '../firebase-config';

const FIREBASE_CONFIG_STORAGE_KEY = 'firebaseUserConfig';

export const FIRESTORE_UNAVAILABLE_ERROR_PREFIX = "ACTION_REQUIRED_FIRESTORE_UNAVAILABLE:";

interface FirebaseConfigContextType {
  firebaseConfig: FirebaseConfig;
  db: Firestore | null;
  app: FirebaseApp | null;
  isFirebaseEffectivelyConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  saveAndInitializeFirebase: (newConfig: FirebaseConfig) => Promise<boolean>;
  clearFirebaseConfig: () => void;
}

const FirebaseConfigContext = createContext<FirebaseConfigContextType | undefined>(undefined);

export const FirebaseConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(defaultConfig);
  const [isFirebaseEffectivelyConfigured, setIsFirebaseEffectivelyConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const tryInitializeFirebase = useCallback(async (configToTry: FirebaseConfig): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    if (isConfigEffectivelyDefault(configToTry)) {
      console.warn("Firebase configuration uses placeholder values. Skipping initialization.");
      setIsFirebaseEffectivelyConfigured(false);
      setIsLoading(false);
      setError("Firebase configuration is incomplete (using placeholder values). Please provide valid Firebase project details.");
      return false;
    }

    try {
      const validatedConfig = { ...configToTry };
      if (validatedConfig.storageBucket && !validatedConfig.storageBucket.endsWith('appspot.com')) {
        if (validatedConfig.storageBucket.endsWith('.firebasestorage.app')) {
          validatedConfig.storageBucket = validatedConfig.storageBucket.replace('.firebasestorage.app', '.appspot.com');
          console.warn("Corrected storageBucket format from .firebasestorage.app to .appspot.com.");
        } else if (validatedConfig.projectId && validatedConfig.storageBucket === validatedConfig.projectId && !validatedConfig.storageBucket.includes('.')) {
          validatedConfig.storageBucket = `${validatedConfig.projectId}.appspot.com`;
          console.warn(`Corrected storageBucket format from just projectId to ${validatedConfig.projectId}.appspot.com.`);
        }
      }

      if (validatedConfig.measurementId === "") {
        validatedConfig.measurementId = undefined;
      }

      console.log("Attempting to initialize Firebase with config:", JSON.parse(JSON.stringify(validatedConfig)));

      // Test the connection
      await getDocs(collection(db, "_test_connection_doc_"));

      console.log("Firebase initialized successfully with new config.");
      setFirebaseConfig(validatedConfig);
      setIsFirebaseEffectivelyConfigured(true);
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(validatedConfig));
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error("Failed to initialize Firebase with provided config:", e);
      let detailedError = "Failed to connect to Firebase. Check credentials and Firestore rules. Review the browser console for the exact configuration object used during the attempt.";
      const projectIdForLinks = configToTry.projectId || PLACEHOLDER_PROJECT_ID;

      if (e instanceof Error) {
        detailedError = e.message;
        const lowerEMessage = e.message.toLowerCase();

        if (lowerEMessage.includes("service firestore is not available") ||
          lowerEMessage.includes("firestore has not been started") ||
          lowerEMessage.includes("could not reach cloud firestore backend") ||
          (lowerEMessage.includes("cloud firestore api has not been used in project") && lowerEMessage.includes("or it is disabled")) ||
          (lowerEMessage.includes("failed to get document because the client is offline") && !isConfigEffectivelyDefault(configToTry))
        ) {
          detailedError = `${FIRESTORE_UNAVAILABLE_ERROR_PREFIX}
<strong style="color: #c0392b; font-size: 1.1em;">CRITICAL FINAL STEP: "Firestore Service Unavailable" - Meticulously Verify Your Configuration Values!</strong><br/>
We understand your frustration. This error message comes directly from Google's Firebase SDK. It means that when the SDK attempts to use the <strong style="color: #c0392b; text-decoration: underline;">exact configuration values your app is trying to use</strong>, Firestore is not reachable for Project ID '<strong style="text-decoration: underline;">{{PROJECT_ID}}</strong>'.
<br/><br/>
This error usually means that for Project ID '<strong style="text-decoration: underline;">{{PROJECT_ID}}</strong>', either Firestore has not been enabled, a region hasn't been selected, or there's a fundamental configuration mismatch preventing connection, even if you believe settings like security rules or API key restrictions are permissive.
<br/><br/>
<strong style="color: #c0392b; font-size: 1.05em;">The MOST LIKELY remaining cause is a subtle, CHARACTER-FOR-CHARACTER MISMATCH in your Firebase configuration values.</strong>
<br/><br/>
<strong style="color: #c0392b; font-size: 1.1em;">YOUR IMMEDIATE ACTION - EXTREME VERIFICATION:</strong>
<ol style="list-style-type: decimal; margin-left: 20px; margin-top: 10px; margin-bottom:10px; line-height: 1.7;">
  <li style="margin-bottom: 12px;">
    <strong style="color: #c0392b;">1. Identify the Source of Configuration:</strong>
    <ul style="list-style-type: disc; margin-left: 20px; margin-top: 5px;">
      <li>Your application first loads its Firebase configuration from the <code style='font-family: monospace; background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;'>defaultConfig</code> object in your <strong style="color: #c0392b; text-decoration: underline;">firebase-config.ts</strong> file.</li>
      <li>If you've previously saved settings via the app's setup page, it might be using values from your browser's local storage. The "Verify Your Entered Configuration" section on the Setup/Settings page shows what's currently being used.</li>
    </ul>
  </li>
  <li style="margin-bottom: 12px;">
    <strong style="color: #c0392b;">2. Meticulously Compare Your Config (especially <code style='font-family: monospace; background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;'>projectId</code> value):</strong> The <strong style="color: #c0392b; text-decoration: underline;">Project ID in your configuration ({{PROJECT_ID}}) MUST EXACTLY MATCH</strong> the Firebase project where you <strong style="color: #c0392b; text-decoration: underline;">have enabled Firestore and selected a region</strong>. A common mistake is using the Project Name or a different Project ID. Verify this in the <a href="https://console.firebase.google.com/project/{{PROJECT_ID_LINK_PART}}/firestore" target="_blank" rel="noopener noreferrer" style="color: #2980b9; text-decoration: underline;">Firebase Console for project '{{PROJECT_ID}}'</a>.
  </li>
</ol>
If after this EXTREME verification, the issue persists, the problem likely lies in your Firebase project's state (e.g., billing issues, service outages, or very restrictive IAM permissions beyond standard API key usage – though API keys are typical for client-side SDKs).
Double-check for any typos in ANY configuration value.
`;
        } else if (lowerEMessage.includes("api key not valid") || lowerEMessage.includes("invalid api key")) {
          detailedError = `Firebase API Key Invalid: The API Key "{{API_KEY_PLACEHOLDER}}" used in the configuration is not valid for Project ID "{{PROJECT_ID}}". Please double-check it in your <a href="https://console.firebase.google.com/project/{{PROJECT_ID_LINK_PART}}/settings/general" target="_blank" rel="noopener noreferrer" style="color: #2980b9; text-decoration: underline;">Firebase Project Settings</a>. Ensure there are no typos and it's not from a different project. Also, check for API key restrictions (e.g., HTTP referrers, IP addresses, API restrictions) in the Google Cloud Console that might be blocking its use.`;
        } else if (lowerEMessage.includes("app not authorized to use firebase") || lowerEMessage.includes("authdomain mismatch")) {
          detailedError = `Firebase App Authorization Issue: The app is not authorized to use Firebase services for Project ID "{{PROJECT_ID}}" with Auth Domain "{{AUTH_DOMAIN_PLACEHOLDER}}". This often indicates a mismatch between your app's configured Auth Domain and the one registered in Firebase, or an issue with the App ID. Verify these in your <a href="https://console.firebase.google.com/project/{{PROJECT_ID_LINK_PART}}/settings/general" target="_blank" rel="noopener noreferrer" style="color: #2980b9; text-decoration: underline;">Firebase Project Settings</a>.`;
        }
      }

      detailedError = detailedError
        .replace(/\{\{PROJECT_ID\}\}/g, configToTry.projectId || "Not Entered")
        .replace(/\{\{PROJECT_ID_LINK_PART\}\}/g, projectIdForLinks)
        .replace(/\{\{API_KEY_PLACEHOLDER\}\}/g, configToTry.apiKey ? configToTry.apiKey.substring(0, 4) + '...' + configToTry.apiKey.substring(configToTry.apiKey.length - 4) : "Not Entered")
        .replace(/\{\{AUTH_DOMAIN_PLACEHOLDER\}\}/g, configToTry.authDomain || "Not Entered");

      setError(detailedError);
      setIsFirebaseEffectivelyConfigured(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const loadPersistedConfigAndInitialize = async () => {
      setIsLoading(true);
      const storedConfigJson = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      let configToUse = defaultConfig;
      let isPersistedConfig = false;

      if (storedConfigJson) {
        try {
          const parsedConfig = JSON.parse(storedConfigJson);
          if (parsedConfig.apiKey && parsedConfig.projectId) {
            configToUse = parsedConfig;
            isPersistedConfig = true;
          } else {
            console.warn("Stored Firebase config is invalid, using default.");
            localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
          }
        } catch (e) {
          console.error("Failed to parse stored Firebase config, using default:", e);
          localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
        }
      }

      if (!isPersistedConfig && isConfigEffectivelyDefault(configToUse)) {
        setFirebaseConfig(defaultConfig);
      }

      await tryInitializeFirebase(configToUse);
    };

    loadPersistedConfigAndInitialize();
  }, [tryInitializeFirebase]);

  const saveAndInitializeFirebase = useCallback(async (newConfig: FirebaseConfig): Promise<boolean> => {
    const success = await tryInitializeFirebase(newConfig);
    return success;
  }, [tryInitializeFirebase]);

  const clearFirebaseConfig = useCallback(() => {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    setFirebaseConfig(defaultConfig);
    setIsFirebaseEffectivelyConfigured(false);
    setError(null);
    setIsLoading(false);
    console.log("Firebase config cleared and reset to placeholders. App disconnected.");
  }, []);

  const contextValue: FirebaseConfigContextType = {
    firebaseConfig,
    db,
    app,
    isFirebaseEffectivelyConfigured,
    isLoading,
    error,
    saveAndInitializeFirebase,
    clearFirebaseConfig,
  };

  return (
    <FirebaseConfigContext.Provider value={contextValue}>
      {children}
    </FirebaseConfigContext.Provider>
  );
};

export const useFirebaseConfig = (): FirebaseConfigContextType => {
  const context = useContext(FirebaseConfigContext);
  if (context === undefined) {
    throw new Error('useFirebaseConfig must be used within a FirebaseConfigProvider');
  }
  return context;
};
