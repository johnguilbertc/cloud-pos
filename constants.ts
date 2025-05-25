export const APP_NAME = "Cafe POS System";

// IMPORTANT: In a real application, API keys should NEVER be hardcoded.
// This is here for demonstration purposes for the Gemini API.
// It's expected to be set as an environment variable: VITE_GEMINI_API_KEY
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; // Fallback for local dev if not set

export const APP_ROUTES = {
  LOGIN: '/login',
  POS: '/pos',
  KDS: '/kds',
  BAR_DISPLAY: '/bar-display', 
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MENU_MANAGEMENT: '/admin/menu',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_RECIPES: '/admin/recipes',
  ADMIN_ORDER_HISTORY: '/admin/orders', 
  ADMIN_USERS: '/admin/users', 
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AI_REPORTS: '/admin/ai-reports', // New route for AI Reports
  FIREBASE_TEST: '/firebase-test', // New route for Firebase Test Page
};

export const DEFAULT_MENU_IMAGE = 'https://picsum.photos/seed/food/300/200';

export const COMMON_UNITS = [
  'grams (g)',
  'kilograms (kg)',
  'milliliters (ml)',
  'liters (L)',
  'pieces (pcs)',
  'units',
  'bottles',
  'cans',
  'packs',
  'boxes',
];

// Default SVG logo (Coffee Cup) as a Base64 data URL
export const DEFAULT_LOGO_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNDggMjhWMjJDNDggMTkuNzkwOSA0Ni4yMDkxIDE4IDQ0IDE4SDIwQzE3Ljc5MDkgMTggMTYgMTkuNzkwOSAxNiAyMlY0MkMxNiA0NC4yMDkxIDE3Ljc5MDkgNDYgMjAgNDZINDJDNDYuMjA5MSA0NiA0OCA0NC4yMDkxIDQ4IDQyVjM2IiBzdHJva2U9IiM3MDQyMTQiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTQ4IDI4SDUyQzU0LjIwOTEgMjggNTYgMjkuNzkwOSA1NiAzMkM1NiAzNC4yMDkxIDU0LjIwOTEgMzYgNTIgMzZINDgiIHN0cm9rZT0iIzcwNDIxNCIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1maW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjQgMzBDMjQgMzAgMjYgMjYgMzIgMjZDMzggMjYgNDAgMzAgNDAgMzAiIHN0cm9rZT0iIzcwNDIxNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1maW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMjYgMzZDMjYgMzYgMjcgMzQgMzIgMzRDMzcgMzQgMzggMzYgMzggMzYiIHN0cm9rZT0iIzcwNDIxNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1maW5lam9pbj0icm91bmQiLz48L3N2Zz4=';


// CAFE_DETAILS will now serve as initial default values for the SettingsContext.
// The application will primarily use settings from SettingsContext.
export const CAFE_DETAILS = {
  name: "The Cozy Corner Cafe",
  address: "123 Coffee Bean Street, Lipa City, Batangas",
  phone: "(043) 123-4567",
  email: "info@cozycorner.com",
  tin: "000-111-222-000 VAT Registered" 
};