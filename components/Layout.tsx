
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { CafeIcon, MenuIcon as MenuIconSvg, KdsIcon, AdminIcon, InventoryIcon, RecipeIcon, UsersIcon, LogoutIcon, OrderHistoryIcon, CocktailIcon, Cog8ToothIcon, PresentationChartBarIcon, ChartBarSquareIcon, WarningIcon as DebugIcon } from './icons/Icons'; // Added DebugIcon
import { APP_ROUTES } from '../constants'; 
import { User, UserRole } from '../types';
import { useSettings } from '../contexts/SettingsContext'; 

interface LayoutProps {
  onLogout: () => void;
  currentUser: User | null;
}

const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.BRANCH_ADMIN]: 'Branch Admin',
  [UserRole.CASHIER]: 'Cashier',
  [UserRole.KITCHEN_STAFF]: 'Kitchen Staff',
};

const Layout: React.FC<LayoutProps> = ({ onLogout, currentUser }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useSettings(); 

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatHeaderDateTime = (date: Date) => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);
    const formattedTime = date.toLocaleTimeString([], timeOptions);
    return `${formattedDate} - ${formattedTime}`;
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 my-1 rounded-lg hover:bg-secondary hover:text-white transition-colors duration-200 ${
      isActive ? 'bg-primary text-white shadow-md' : 'text-textPrimary'
    }`;

  const canViewAdminPanel = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.BRANCH_ADMIN;
  const canViewOrderHistory = canViewAdminPanel || currentUser?.role === UserRole.CASHIER;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-surface text-textPrimary p-6 shadow-lg flex flex-col">
        <div className="flex items-center mb-6">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={`${settings.companyName} Logo`} className="w-12 h-12 mr-3 object-contain rounded-sm" />
          ) : (
            <CafeIcon className="w-12 h-12 text-primary mr-3" />
          )}
          <h1 className="text-2xl font-bold text-primary">{settings.companyName}</h1>
        </div>

        {currentUser && (
          <div className="mb-6 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold text-textPrimary">
              Welcome, {currentUser.username}
            </p>
            <p className="text-xs text-gray-600">
              Role: {roleDisplayNames[currentUser.role] || currentUser.role}
            </p>
          </div>
        )}

        <nav className="flex-grow">
          <ul className="space-y-1">
            <li>
              <NavLink to={APP_ROUTES.POS} className={navLinkClass}>
                <PresentationChartBarIcon className="w-6 h-6 mr-3" /> Point of Sale
              </NavLink>
            </li>
            {canViewOrderHistory && (
              <li>
                <NavLink to={APP_ROUTES.ADMIN_ORDER_HISTORY} className={navLinkClass}>
                  <OrderHistoryIcon className="w-6 h-6 mr-3" /> Order History
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to={APP_ROUTES.KDS} className={navLinkClass}>
                <KdsIcon className="w-6 h-6 mr-3" /> Kitchen Display
              </NavLink>
            </li>
             <li>
              <NavLink to={APP_ROUTES.BAR_DISPLAY} className={navLinkClass}>
                <CocktailIcon className="w-6 h-6 mr-3" /> Bar Display
              </NavLink>
            </li>
            
            {canViewAdminPanel && (
              <>
                <li className="mt-6 mb-2 text-sm font-semibold text-gray-500 uppercase">Admin Panel</li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_DASHBOARD} className={navLinkClass}>
                    <AdminIcon className="w-6 h-6 mr-3" /> Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_MENU_MANAGEMENT} className={navLinkClass}>
                    <MenuIconSvg className="w-6 h-6 mr-3" /> Menu Management
                  </NavLink>
                </li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_INVENTORY} className={navLinkClass}>
                    <InventoryIcon className="w-6 h-6 mr-3" /> Inventory Mgt.
                  </NavLink>
                </li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_RECIPES} className={navLinkClass}>
                    <RecipeIcon className="w-6 h-6 mr-3" /> Recipe Management
                  </NavLink>
                </li>
                 <li>
                  <NavLink to={APP_ROUTES.ADMIN_USERS} className={navLinkClass}>
                    <UsersIcon className="w-6 h-6 mr-3" /> User Management
                  </NavLink>
                </li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_AI_REPORTS} className={navLinkClass}> {/* New Link */}
                    <ChartBarSquareIcon className="w-6 h-6 mr-3" /> AI Reports
                  </NavLink>
                </li>
                <li>
                  <NavLink to={APP_ROUTES.ADMIN_SETTINGS} className={navLinkClass}>
                    <Cog8ToothIcon className="w-6 h-6 mr-3" /> Settings
                  </NavLink>
                </li>
                {/* Temporary Debug Link */}
                 <li>
                  <NavLink to={APP_ROUTES.FIREBASE_TEST} className={navLinkClass + " bg-yellow-100 border border-yellow-400 hover:bg-yellow-200"}>
                    <DebugIcon className="w-6 h-6 mr-3 text-yellow-600" /> Firebase Test
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center p-3 my-1 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
          >
            <LogoutIcon className="w-6 h-6 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-0 flex flex-col overflow-hidden">
        <header className="bg-surface text-textPrimary shadow-md p-4 flex-shrink-0">
          <div className="container mx-auto flex justify-between items-center">
            <h2 className="text-xl font-semibold text-primary">{settings.companyName}</h2> {/* Use company name from settings */}
            <div className="text-sm font-medium text-textSecondary">
              {formatHeaderDateTime(currentTime)}
            </div>
          </div>
        </header>
        
        <div className="flex-grow p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;