
import React, { useState, useCallback } from 'react';
import { useFirebaseConfig, FIRESTORE_UNAVAILABLE_ERROR_PREFIX } from '../../contexts/FirebaseConfigContext';
import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants';
import { LoadingSpinner, CheckCircleIcon, WarningIcon, CafeIcon as FirebaseIcon } from '../../components/icons/Icons';
import { FirebaseConfig, PLACEHOLDER_API_KEY } from '../../firebase-config'; 

const FirebaseTestPage: React.FC = () => {
  const { db, firebaseConfig, isFirebaseEffectivelyConfigured, isLoading: isConfigLoading, error: contextError } = useFirebaseConfig();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  const handleTestConnection = useCallback(async () => {
    setTestStatus('testing');
    setTestError(null);
    setTestSuccessMessage(null);

    if (!isFirebaseEffectivelyConfigured || !db) {
      setTestError("Firebase is not effectively configured or database instance is not available. Cannot perform test.");
      setTestStatus('failed');
      return;
    }

    try {
      const testDocRef = doc(db, '_app_connectivity_test_collection_', 'test_doc_id');
      await getDoc(testDocRef); 
      
      setTestSuccessMessage("Successfully communicated with Firestore. Basic connectivity is working. This does NOT mean specific data operations will succeed, as those depend on security rules and data existence.");
      setTestStatus('success');
    } catch (e) {
      console.error("Firestore connection test failed:", e);
      if (e instanceof Error) {
        // Check if the error message from the test itself is the detailed Firestore unavailable message
        if (e.message.toLowerCase().includes("service firestore is not available") || 
            e.message.toLowerCase().includes("firestore has not been started") ||
            e.message.toLowerCase().includes("could not reach cloud firestore backend")) {
            // Attempt to use the more detailed context error if available and relevant, otherwise use the direct error
            const detailedContextError = contextError && contextError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX) 
                                      ? contextError 
                                      : `Firestore Test Failed: ${e.message} (This usually indicates Firestore is not enabled or a region is not selected in your Firebase project for Project ID: ${firebaseConfig.projectId}). Please verify settings in the Firebase Console.`;
            setTestError(detailedContextError);
        } else {
            setTestError(`Firestore Test Failed: ${e.message}`);
        }
      } else {
        setTestError("Firestore Test Failed: An unknown error occurred.");
      }
      setTestStatus('failed');
    }
  }, [db, isFirebaseEffectivelyConfigured, firebaseConfig.projectId, contextError]);

  const sensitiveKeys: (keyof FirebaseConfig)[] = ['apiKey'];

  const renderContextError = () => {
    if (!contextError) return null;
    if (contextError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX)) {
      const htmlMessage = contextError.replace(FIRESTORE_UNAVAILABLE_ERROR_PREFIX, '');
      return <div className="text-sm" dangerouslySetInnerHTML={{ __html: htmlMessage }} />;
    }
    // General context error
    return <p className="text-sm break-words">{contextError.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>;
  };
  
  const renderTestError = () => {
    if (!testError) return null;
    if (testError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX)) {
      const htmlMessage = testError.replace(FIRESTORE_UNAVAILABLE_ERROR_PREFIX, '');
      return <div className="text-sm break-words" dangerouslySetInnerHTML={{ __html: htmlMessage }} />;
    }
    // General test error
    return <p className="text-sm break-words">{testError.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>;
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <FirebaseIcon className="w-16 h-16 text-primary mb-3" />
          <h1 className="text-3xl font-bold text-primary text-center">Firebase Connection Test</h1>
          <p className="text-textSecondary mt-2 text-center">
            This page attempts a direct Firestore read operation using the application's current Firebase configuration.
          </p>
        </div>

        {isConfigLoading && (
          <div className="flex flex-col items-center justify-center text-textSecondary p-6 bg-gray-50 rounded-md mb-6">
            <LoadingSpinner className="w-8 h-8 mb-3" />
            <p>Loading Firebase configuration...</p>
          </div>
        )}

        {contextError && !isConfigLoading && (
           <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
             <div className="flex items-start">
               <WarningIcon className="w-6 h-6 mr-3 text-red-500 flex-shrink-0 mt-1"/>
               <div>
                 <h3 className="text-lg font-semibold mb-1 text-red-800">Firebase Configuration Error (from Context):</h3>
                 {renderContextError()}
               </div>
             </div>
           </div>
        )}

        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold text-textPrimary mb-3">Current Firebase Configuration:</h2>
          {isFirebaseEffectivelyConfigured ? (
            <ul className="space-y-1.5 text-sm text-textSecondary">
              {Object.keys(firebaseConfig).map((keyString: string) => {
                const keyTyped = keyString as keyof FirebaseConfig;
                const value = firebaseConfig[keyTyped];
                return (
                  <li key={keyString} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium capitalize">{keyString.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <span className="ml-2 break-all text-right">
                      {sensitiveKeys.includes(keyTyped) && String(value) !== PLACEHOLDER_API_KEY && value !== "" ? '********' : (String(value || 'Not Set'))}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
              Firebase is not effectively configured or is using placeholder values. Test cannot proceed.
              Please configure Firebase via the <Link to={APP_ROUTES.ADMIN_SETTINGS} className="underline hover:text-amber-900">Settings Page</Link> or the initial setup page.
            </p>
          )}
        </div>

        <div className="mb-6 text-center">
          <button
            onClick={handleTestConnection}
            disabled={!isFirebaseEffectivelyConfigured || testStatus === 'testing' || isConfigLoading}
            className="bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-lg shadow-md flex items-center justify-center mx-auto transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === 'testing' ? (
              <LoadingSpinner className="w-5 h-5 mr-2" />
            ) : (
              <FirebaseIcon className="w-5 h-5 mr-2" />
            )}
            {testStatus === 'testing' ? 'Testing Connection...' : 'Test Firestore Read'}
          </button>
        </div>

        {testStatus !== 'idle' && testStatus !== 'testing' && (
          <div className={`mt-8 p-6 rounded-lg shadow-md ${
            testStatus === 'success' ? 'bg-green-50 border-green-300' : 
            testStatus === 'failed' ? 'bg-red-50 border-red-300' : ''
          }`}>
            <h3 className={`text-xl font-semibold mb-3 flex items-center ${
              testStatus === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {testStatus === 'success' ? <CheckCircleIcon className="w-6 h-6 mr-2" /> : <WarningIcon className="w-6 h-6 mr-2" />}
              Test Result: {testStatus.charAt(0).toUpperCase() + testStatus.slice(1)}
            </h3>
            {testSuccessMessage && <p className="text-green-800 text-sm">{testSuccessMessage}</p>}
            {testError && renderTestError()}
            
            {testStatus === 'failed' && testError && (testError.toLowerCase().includes("service firestore is not available") || testError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX) ) && (
                <div className="mt-4 pt-3 border-t border-red-200 text-sm text-red-700">
                    <p className="font-semibold">This "Service Firestore is not available" error means the application (even this simple test) could not connect to your Firestore database using the configuration displayed above.</p>
                    <p className="mt-2">Please meticulously re-verify:</p>
                    <ul className="list-disc list-inside ml-4 mt-1">
                        <li>The <strong className="underline">exact Project ID</strong> in the config matches the Firebase project where Firestore is enabled.</li>
                        <li>You have <strong className="underline">selected a region</strong> for Firestore in that Firebase project.</li>
                        <li>The <strong className="underline">API Key</strong> has necessary permissions (Cloud Firestore API enabled) and no IP/website restrictions blocking access.</li>
                        <li>All other configuration values (Auth Domain, Storage Bucket etc.) are <strong className="underline">character-for-character correct</strong>.</li>
                    </ul>
                     <p className="mt-2">If this test page fails, the main application will also fail. The issue lies in the Firebase project setup or the configuration details provided to the app.</p>
                </div>
            )}
          </div>
        )}
         <div className="mt-10 text-center">
          <Link 
            to={APP_ROUTES.ADMIN_SETTINGS} 
            className="text-sm text-primary hover:underline"
          >
            &larr; Back to Settings
          </Link>
         </div>
      </div>
    </div>
  );
};

export default FirebaseTestPage;
