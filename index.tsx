import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MenuProvider } from './contexts/MenuContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { UserProvider } from './contexts/UserContext';
import { OrderProvider } from './contexts/OrderContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { FirebaseConfigProvider } from './contexts/FirebaseConfigContext'; // New import

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseConfigProvider> {/* FirebaseConfigProvider wraps everything */}
      <UserProvider>
        <SettingsProvider>
          <MenuProvider>
            <InventoryProvider>
              <RecipeProvider>
                <OrderProvider>
                  <App />
                </OrderProvider>
              </RecipeProvider>
            </InventoryProvider>
          </MenuProvider>
        </SettingsProvider>
      </UserProvider>
    </FirebaseConfigProvider>
  </React.StrictMode>
);
