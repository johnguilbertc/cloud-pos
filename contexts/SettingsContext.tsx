
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { CafeSettings } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { CAFE_DETAILS, DEFAULT_LOGO_URL } from '../constants'; // For initial default values

interface SettingsContextType {
  settings: CafeSettings;
  updateSettings: (newSettings: Partial<CafeSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialSettings: CafeSettings = {
  companyName: CAFE_DETAILS.name,
  address: CAFE_DETAILS.address,
  phone: CAFE_DETAILS.phone,
  email: CAFE_DETAILS.email,
  tin: CAFE_DETAILS.tin,
  logoUrl: DEFAULT_LOGO_URL, // Initialize with default logo
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<CafeSettings>('cafeSettings', initialSettings);

  const updateSettings = useCallback((newSettings: Partial<CafeSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  }, [setSettings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};