
export interface Category {
  id: string;
  name: string;
  description?: string;
}

// --- Menu Item Modifiers ---
export interface MenuItemModifierOption {
  id: string;
  name: string;
  priceChange: number; // Positive for added cost, negative for discount
}

export interface MenuItemModifierGroup {
  id: string;
  name: string; // e.g., "Milk Options", "Size", "Add-ons"
  selectionType: 'single' | 'multiple'; // Defines if user can select one or many options from this group
  options: MenuItemModifierOption[];
}
// --- End Menu Item Modifiers ---

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string; // Foreign key to Category
  imageUrl?: string; // Optional image URL
  isAvailable: boolean;
  modifierGroups?: MenuItemModifierGroup[]; // Optional: For items like coffee with milk choices, sizes, etc.
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string; // e.g., 'grams', 'ml', 'pcs'
  stock: number;
  lowStockThreshold: number;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string; // Unique ID for the recipe itself
  menuItemId: string; // Foreign key to MenuItem
  items: RecipeItem[];
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BRANCH_ADMIN = 'branch_admin',
  CASHIER = 'cashier',
  KITCHEN_STAFF = 'kitchen_staff',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  passwordHash?: string; 
  assignedCategoryIds?: string[];
}

export enum OrderItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready', // Ready by KDS, implies AWAITING_DELIVERY for Bar
  CANCELLED = 'cancelled',
  AWAITING_DELIVERY = 'awaiting_delivery', // From Bar's perspective, same as KDS READY
  DELIVERED_TO_CUSTOMER = 'delivered_to_customer', // Served by Bar staff
}

export enum OrderStatus {
  PENDING = 'pending', // New order, KDS needs to acknowledge
  PREPARING = 'preparing', // KDS is working on at least one item
  PARTIALLY_READY = 'partially_ready', // Some items READY by KDS, others PENDING/PREPARING
  READY_FOR_DELIVERY = 'ready_for_delivery', // All KDS items are READY, Bar needs to act
  DELIVERY_IN_PROGRESS = 'delivery_in_progress', // Some items delivered by Bar, others awaiting
  COMPLETED = 'completed', // All items served, payment processed
  CANCELLED = 'cancelled', // Order cancelled
  ON_HOLD = 'on_hold', // Order suspended by POS
}

// --- Selected Modifier for OrderItem ---
export interface SelectedModifierOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceChange: number;
}
// --- End Selected Modifier ---

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string; 
  quantity: number;
  priceAtOrder: number; 
  status: OrderItemStatus;
  selectedModifiers?: SelectedModifierOption[]; // Stores chosen modifiers for this item instance
}

export interface Order {
  id:string;
  orderNumber: string;
  tokenNumber: string; 
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  orderTime: Date;
  tableNumber?: string;
  pax?: number; 
  paymentMethod?: 'cash' | 'card' | 'gcash';
  amountReceived?: number; 
  changeGiven?: number; 
  isPaid: boolean;
  lastKDSNotifiedTime?: number; // For KDS sound notification
}


export enum AdminSection {
  DASHBOARD = 'Dashboard',
  MENU_MANAGEMENT = 'Menu Management',
  INVENTORY_MANAGEMENT = 'Inventory Management',
  RECIPE_MANAGEMENT = 'Recipe Management',
  ORDER_HISTORY = 'Order History',
  USER_MANAGEMENT = 'User Management',
  SETTINGS = 'Settings',
  AI_REPORTS = 'AI Reports', // New admin section
}

export enum POSSection {
  ORDER = 'Point of Sale',
}

export enum KDSSection {
  KITCHEN = 'Kitchen Display',
  BAR_DISPLAY = 'Bar Display',
}

export interface CafeSettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  tin: string; // Tax Identification Number
  logoUrl?: string; // Optional: URL or Base64 string for the cafe logo
  // We can add more tax-related settings here later, e.g., taxRate, currencySymbol
}