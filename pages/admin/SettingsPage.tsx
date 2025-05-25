
import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { CafeSettings, UserRole } from '../../types';
import { Cog8ToothIcon, CheckCircleIcon, UploadIcon, TrashIcon, WarningIcon, LoadingSpinner, CafeIcon as FirebaseIcon } from '../../components/icons/Icons'; // Removed unused CopyIcon
import { DEFAULT_LOGO_URL } from '../../constants';
import { useFirebaseConfig, FIRESTORE_UNAVAILABLE_ERROR_PREFIX } from '../../contexts/FirebaseConfigContext';
import { FirebaseConfig, defaultConfig as placeholderFirebaseConfig, PLACEHOLDER_PROJECT_ID } from '../../firebase-config';
import { useUser } from '../../contexts/UserContext';

const CopyIconSvg: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m9.75 9.25c0-.621-.504-1.125-1.125-1.125H18v-3.125c0-.621-.504-1.125-1.125-1.125H13.5v.001z" />
  </svg>
);

const MAX_LOGO_SIZE_MB = 1;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];


export default function SettingsPage(): JSX.Element {
  const { settings, updateSettings } = useSettings();
  const { currentUser } = useUser();
  const { 
    firebaseConfig: currentGlobalFirebaseConfig, 
    saveAndInitializeFirebase, 
    isLoading: isFirebaseContextLoading, 
    error: firebaseContextError, 
    clearFirebaseConfig,
    isFirebaseEffectivelyConfigured
  } = useFirebaseConfig();

  const [localSettings, setLocalSettings] = useState<CafeSettings>(settings);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(settings.logoUrl || DEFAULT_LOGO_URL);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [localFirebaseConfig, setLocalFirebaseConfig] = useState<FirebaseConfig>(currentGlobalFirebaseConfig);
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseFormSuccessMessage, setFirebaseFormSuccessMessage] = useState<string | null>(null);
  const [firebaseFormError, setFirebaseFormError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setLogoPreview(settings.logoUrl || DEFAULT_LOGO_URL);
  }, [settings]);

  useEffect(() => {
    setLocalFirebaseConfig(currentGlobalFirebaseConfig);
  }, [currentGlobalFirebaseConfig]);
  
  useEffect(() => {
    if(firebaseContextError && !isTestingFirebase) {
        setFirebaseFormError(firebaseContextError); 
    }
  }, [firebaseContextError, isTestingFirebase]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLogoError(null);

    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setLogoError(`Invalid file type. Please select a JPG, PNG, SVG, or GIF image.`);
        e.target.value = ''; 
        return;
      }
      if (file.size > MAX_LOGO_SIZE_BYTES) {
        setLogoError(`Logo size should not exceed ${MAX_LOGO_SIZE_MB}MB.`);
        e.target.value = ''; 
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setLocalSettings(prev => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(DEFAULT_LOGO_URL);
    setLocalSettings(prev => ({ ...prev, logoUrl: DEFAULT_LOGO_URL }));
    const fileInput = document.getElementById('logoUrl') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setLogoError(null);
  };

  const handleSubmitCafeSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (logoError) {
        alert(`Cannot save cafe settings due to logo error: ${logoError}`);
        return;
    }
    updateSettings(localSettings);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleFirebaseConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFirebaseConfig(prev => ({ ...prev, [name]: value }));
    setFirebaseFormError(null);
    setFirebaseFormSuccessMessage(null);
  };

  const handleSubmitFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseFormError(null);
    setFirebaseFormSuccessMessage(null);
    setIsTestingFirebase(true);

    const requiredFields: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    for (const field of requiredFields) {
        if (!localFirebaseConfig[field]?.trim()) {
            setFirebaseFormError(`Firebase field "${field}" is required.`);
            setIsTestingFirebase(false);
            return;
        }
    }
    
    const success = await saveAndInitializeFirebase(localFirebaseConfig);
    if (success) {
      setFirebaseFormSuccessMessage("Firebase reconfigured successfully! Changes will apply across the app.");
    } else {
      setFirebaseFormError(firebaseContextError || "Failed to connect to Firebase with new settings. Check details and console.");
    }
    setIsTestingFirebase(false);
  };

  const handleResetFirebaseConfig = () => {
    if (window.confirm("Are you sure you want to clear the current Firebase configuration and reset to placeholders? This will disconnect the app from Firebase, requiring setup via the Firebase Setup Page on next load if not reconfigured here.")) {
        clearFirebaseConfig(); 
        setLocalFirebaseConfig(placeholderFirebaseConfig); 
        setFirebaseFormSuccessMessage("Firebase configuration cleared. The application is now disconnected from Firebase. You might need to refresh or re-setup.");
        setFirebaseFormError(null);
    }
  };

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const isFirestoreUnavailableErrorFirebaseSection = firebaseFormError && firebaseFormError.startsWith(FIRESTORE_UNAVAILABLE_ERROR_PREFIX);
  const firestoreUnavailableErrorMessageFirebaseSection = isFirestoreUnavailableErrorFirebaseSection 
    ? firebaseFormError!.replace(FIRESTORE_UNAVAILABLE_ERROR_PREFIX, '')
                       .replace(/\{\{PROJECT_ID\}\}/g, localFirebaseConfig.projectId || "Not Entered")
                       .replace(/\{\{PROJECT_ID_LINK_PART\}\}/g, localFirebaseConfig.projectId || PLACEHOLDER_PROJECT_ID)
    : null;

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-8 pb-4 border-b border-gray-300">
        <Cog8ToothIcon className="w-10 h-10 text-primary mr-3" />
        <h1 className="text-4xl font-bold text-primary">Application Settings</h1>
      </div>

      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center shadow">
          <CheckCircleIcon className="w-6 h-6 mr-3" />
          <span>Cafe settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmitCafeSettings} className="bg-surface p-6 sm:p-8 rounded-lg shadow-xl space-y-8 mb-10">
        <fieldset className="space-y-6">
          <legend className="text-xl font-semibold text-textPrimary mb-3">Cafe Details</legend>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-textPrimary mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input type="text" name="companyName" id="companyName" value={localSettings.companyName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors" required />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-textPrimary mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea name="address" id="address" value={localSettings.address} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label htmlFor="phone" className="block text-sm font-medium text-textPrimary mb-1">Phone Number <span className="text-red-500">*</span></label><input type="tel" name="phone" id="phone" value={localSettings.phone} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors" required /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-1">Email Address <span className="text-red-500">*</span></label><input type="email" name="email" id="email" value={localSettings.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors" required /></div>
          </div>
          <div><label htmlFor="tin" className="block text-sm font-medium text-textPrimary mb-1">Tax Identification Number (TIN) <span className="text-red-500">*</span></label><input type="text" name="tin" id="tin" value={localSettings.tin} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors" required /></div>
        </fieldset>

        <fieldset className="space-y-6 pt-6 border-t border-gray-200">
            <legend className="text-xl font-semibold text-textPrimary mb-3">Cafe Logo</legend>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {logoPreview && (<div className="flex-shrink-0"><p className="block text-sm font-medium text-textPrimary mb-1">Current Logo Preview:</p><img src={logoPreview} alt="Logo Preview" className="w-24 h-24 sm:w-32 sm:h-32 object-contain border border-gray-300 rounded-md bg-gray-50 p-1 shadow-sm" /></div>)}
                <div className="flex-grow">
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-textPrimary mb-1">Upload New Logo</label>
                    <div className="flex items-center space-x-3">
                        <div className="relative flex-grow">
                            <input 
                                type="file" 
                                name="logoUrl" 
                                id="logoUrl" 
                                onChange={handleLogoChange} 
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                className="block w-full text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90 cursor-pointer"
                            />
                            <span className="absolute -bottom-4 left-0 text-xs text-gray-500">Max {MAX_LOGO_SIZE_MB}MB. Accepted: JPG, PNG, SVG, GIF.</span>
                        </div>
                        {logoPreview && logoPreview !== DEFAULT_LOGO_URL && (
                            <button type="button" onClick={handleRemoveLogo} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors" title="Remove Custom Logo"><TrashIcon className="w-5 h-5" /></button>
                        )}
                    </div>
                    {logoError && <p className="text-red-500 text-xs mt-4">{logoError}</p>}
                </div>
            </div>
        </fieldset>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button type="submit" className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105">
            <CheckCircleIcon className="w-5 h-5 mr-2" /> Save Cafe Settings
          </button>
        </div>
      </form>

      {isSuperAdmin && (
        <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
          <div className="flex items-center mb-6">
            <FirebaseIcon className="w-8 h-8 text-secondary mr-3" />
            <h2 className="text-2xl font-bold text-secondary">Firebase Configuration (Super Admin)</h2>
          </div>
          <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-xl space-y-6">
            {firebaseFormSuccessMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md flex items-center">
                <CheckCircleIcon className="w-5 h-5 mr-2" /> {firebaseFormSuccessMessage}
              </div>
            )}
             {isFirestoreUnavailableErrorFirebaseSection ? (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-md">
                <div className="flex items-start">
                  <WarningIcon className="w-6 h-6 mr-3 text-red-500 flex-shrink-0 mt-1"/>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-red-800">Action Required in Firebase Console: Firestore Service Unavailable</h3>
                    <div className="text-sm space-y-1" dangerouslySetInnerHTML={{ __html: firestoreUnavailableErrorMessageFirebaseSection! }} />
                  </div>
                </div>
              </div>
            ) : firebaseFormError && !isFirestoreUnavailableErrorFirebaseSection && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
                  <div className="flex items-start">
                    <WarningIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"/>
                    <div dangerouslySetInnerHTML={{ __html: firebaseFormError }} />
                  </div>
                </div>
            )}

            {firebaseFormError && (
                <div className="mt-4 mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md shadow">
                <h4 className="font-semibold mb-2 text-yellow-900">Verify Your Entered Configuration:</h4>
                <p className="text-xs mb-3">
                    Please meticulously compare each value below with the corresponding value in your&nbsp;
                    <a 
                    href={`https://console.firebase.google.com/project/${localFirebaseConfig.projectId || PLACEHOLDER_PROJECT_ID}/settings/general`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-yellow-900"
                    >
                    Firebase Project Settings
                    </a>. 
                    Even a single incorrect character can cause issues.
                </p>
                <ul className="space-y-1.5 text-xs">
                    {(Object.keys(localFirebaseConfig) as Array<keyof FirebaseConfig>).map(key => (
                    <li key={key} className="flex justify-between items-center py-1 border-b border-yellow-200 last:border-b-0">
                        <span className="font-medium capitalize min-w-[150px]">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                        <div className="flex items-center ml-2">
                        <input 
                            type="text" 
                            readOnly 
                            value={localFirebaseConfig[key] || ''} 
                            className="p-1 text-xs bg-yellow-100 border-yellow-300 rounded-sm w-auto flex-grow min-w-[180px] sm:min-w-[250px] truncate"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            aria-label={`Value for ${key}`}
                        />
                        <button 
                            type="button" 
                            onClick={() => navigator.clipboard.writeText(localFirebaseConfig[key] || '')} 
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

            <form onSubmit={handleSubmitFirebaseConfig} className="space-y-5">
              {(Object.keys(placeholderFirebaseConfig) as Array<keyof FirebaseConfig>).map((key) => (
                <div key={key}>
                  <label htmlFor={`settings-firebase-${key}`} className="block text-sm font-medium text-textPrimary mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={key === 'apiKey' ? 'password' : 'text'}
                    id={`settings-firebase-${key}`}
                    name={key}
                    value={localFirebaseConfig[key] || ''}
                    onChange={handleFirebaseConfigChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-secondary focus:border-secondary transition-colors"
                    placeholder={`Enter Firebase ${key}`}
                    required
                    autoComplete="off"
                  />
                </div>
              ))}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isTestingFirebase || (isFirebaseContextLoading && !firebaseFormSuccessMessage && !firebaseFormError) }
                  className="w-full bg-secondary hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg shadow-md flex items-center justify-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 disabled:opacity-60"
                >
                  {isTestingFirebase || (isFirebaseContextLoading && !firebaseFormSuccessMessage && !firebaseFormError) ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
                  {(isTestingFirebase || (isFirebaseContextLoading && !firebaseFormSuccessMessage && !firebaseFormError)) ? 'Testing & Saving Firebase...' : 'Test & Save Firebase Config'}
                </button>
                {isFirebaseEffectivelyConfigured && (
                    <button
                        type="button"
                        onClick={handleResetFirebaseConfig}
                        disabled={isTestingFirebase || isFirebaseContextLoading}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-textPrimary font-medium py-2.5 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-60"
                    >
                        Clear Current Firebase Config & Reset App
                    </button>
                )}
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-4">
              This configuration is stored locally in your browser. Changes here will attempt to re-initialize the Firebase connection for the app.
              If the app is disconnected (e.g., after clearing), you will be redirected to the initial Firebase Setup Page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
