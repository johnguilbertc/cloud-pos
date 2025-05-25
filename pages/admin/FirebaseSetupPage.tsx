
import React, { useState, useEffect } from 'react';
import { useFirebaseConfig, FIRESTORE_UNAVAILABLE_ERROR_PREFIX } from '../../contexts/FirebaseConfigContext';
import { FirebaseConfig, defaultConfig, PLACEHOLDER_API_KEY, PLACEHOLDER_PROJECT_ID } from '../../firebase-config';
import { CafeIcon, LoadingSpinner, CheckCircleIcon, WarningIcon } from '../../components/icons/Icons'; 
import { APP_NAME } from '../../constants';

const CopyIconSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.75 9.25c0-.621-.504-1.125-1.125-1.125H18v-3.125c0-.621-.504-1.125-1.125-1.125H13.5v.001z" />
  </svg>
);


export default function FirebaseSetupPage(): JSX.Element {
  const { firebaseConfig: currentGlobalConfig, saveAndInitializeFirebase, isLoading, error: contextError, clearFirebaseConfig } = useFirebaseConfig();
  const [localConfig, setLocalConfig] = useState<FirebaseConfig>(currentGlobalConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(currentGlobalConfig);
  }, [currentGlobalConfig]);
  
  useEffect(() => {
    if(contextError) {
        setFormError(contextError); 
    } else {
        setFormError(null);
    }
  }, [contextError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalConfig(prev => ({ ...prev, [name]: value }));
    setFormError(null); 
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsTesting(true);

    const requiredFields: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    for (const field of requiredFields) {
        if (!localConfig[field]?.trim()) {
            setFormError(`Field "${field}" is required.`);
            setIsTesting(false);
            return;
        }
    }
    
    const success = await saveAndInitializeFirebase(localConfig);
    if (success) {
      setSuccessMessage("Firebase connected successfully! The application will now load.");
    }
    setIsTesting(false);
  };

  const handleResetToPlaceholders = () => {
    if (window.confirm("Are you sure you want to clear the current Firebase configuration and reset to placeholders? This will disconnect the app from Firebase.")) {
        clearFirebaseConfig(); 
        setLocalConfig(defaultConfig); 
        setSuccessMessage("Configuration cleared. Please enter new Firebase details.");
        setFormError(null);
    }
  };
  
  const isFirestoreUnavailableError = formError && formError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX);
  // Simplified: formError from context already has placeholders filled.
  const firestoreUnavailableErrorMessage = isFirestoreUnavailableError 
    ? formError!.replace(FIRESTORE_UNAVAILABLE_ERROR_PREFIX, '')
    : null;


  if (isLoading && !isTesting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary p-4 text-white">
        <LoadingSpinner className="w-12 h-12 mb-4" />
        <p className="text-xl">Loading Firebase Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-surface p-6 md:p-10 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <CafeIcon className="w-16 h-16 md:w-20 md:h-20 text-primary mb-3 md:mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center">{APP_NAME}</h1>
          <p className="text-textSecondary mt-2 text-center text-lg md:text-xl">Firebase Connection Setup</p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" /> {successMessage}
          </div>
        )}
        
        {isFirestoreUnavailableError && firestoreUnavailableErrorMessage ? (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
            <div className="flex items-start">
              <WarningIcon className="w-6 h-6 mr-3 text-red-500 flex-shrink-0 mt-1"/>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-800">Action Required in Firebase Console: Firestore Service Unavailable</h3>
                <div className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: firestoreUnavailableErrorMessage }} />
              </div>
            </div>
          </div>
        ) : formError && !isFirestoreUnavailableError && ( 
             <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
                <div className="flex items-start">
                    <WarningIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"/>
                    {/* Display general errors as plain text */}
                    <p className="break-words">{formError.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
                </div>
            </div>
        )}

        {formError && ( // This section for "Verify Your Entered Configuration" can remain as is.
            <div className="mt-4 mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md shadow">
            <h4 className="font-semibold mb-2 text-yellow-900">Verify Your Entered Configuration:</h4>
            <p className="text-xs mb-3">
                Please meticulously compare each value below with the corresponding value in your&nbsp;
                <a 
                href={`https://console.firebase.google.com/project/${localConfig.projectId || PLACEHOLDER_PROJECT_ID}/settings/general`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium hover:text-yellow-900"
                >
                Firebase Project Settings
                </a>. 
                Even a single incorrect character (e.g., in Project ID, API Key) or a mismatch with the project where Firestore is *actually* enabled and region-selected can cause connection issues.
            </p>
            <ul className="space-y-1.5 text-xs">
                {(Object.keys(localConfig) as Array<keyof FirebaseConfig>).map(key => (
                <li key={key} className="flex justify-between items-center py-1 border-b border-yellow-200 last:border-b-0">
                    <span className="font-medium capitalize min-w-[150px]">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <div className="flex items-center ml-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={localConfig[key] || ''} 
                        className="p-1 text-xs bg-yellow-100 border-yellow-300 rounded-sm w-auto flex-grow min-w-[180px] sm:min-w-[250px] truncate"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        aria-label={`Value for ${key}`}
                    />
                    <button 
                        type="button" 
                        onClick={() => navigator.clipboard.writeText(localConfig[key] || '')} 
                        className="ml-2 p-1 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-200 rounded"
                        title={`Copy ${key}`}
                        aria-label={`Copy ${key} to clipboard`}
                    >
                        <CopyIconSvg className="w-3.5 h-3.5" />
                    </button>
                    </div>
                </li>
                ))}
            </ul>
            </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-textSecondary mb-3">
            Enter your Firebase project configuration details below. You can find these in your Firebase project settings 
            (usually under Project settings &gt; General &gt; Your apps &gt; Firebase SDK snippet &gt; Config).
          </p>
          {(Object.keys(defaultConfig) as Array<keyof FirebaseConfig>).map((key) => (
            <div key={key}>
              <label htmlFor={`firebase-${key}`} className="block text-sm font-medium text-textPrimary mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                <span className="text-red-500">*</span>
              </label>
              <input
                type={key === 'apiKey' ? 'password' : 'text'}
                id={`firebase-${key}`}
                name={key}
                value={localConfig[key] || ''}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
                placeholder={`Enter Firebase ${key}`}
                required
                autoComplete="off"
              />
            </div>
          ))}
          <div className="pt-3 space-y-3">
            <button
              type="submit"
              disabled={isTesting || isLoading}
              className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg shadow-md flex items-center justify-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-60"
            >
              {isTesting ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
              {isTesting ? 'Connecting to Firebase...' : 'Connect & Save Configuration'}
            </button>
             <button
              type="button"
              onClick={handleResetToPlaceholders}
              disabled={isTesting || isLoading}
              className="w-full bg-gray-200 hover:bg-gray-300 text-textPrimary font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              Clear Configuration & Reset
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-6 text-center">
          This configuration is stored locally in your browser. Ensure these details are correct to enable backend features.
        </p>
      </div>
    </div>
  );
}
