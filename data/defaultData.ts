
import { v4 as uuidv4 } from 'uuid';
import { Category, MenuItem, Ingredient, Recipe, User, UserRole, Order, OrderItem, OrderStatus, OrderItemStatus, MenuItemModifierGroup, MenuItemModifierOption, SelectedModifierOption } from '../types';

// --- DEFAULT CATEGORIES ---
export const defaultCategories: Category[] = [
  { id: 'cat_food_1', name: 'Food', description: 'Delicious meals and tasty snacks.' },
  { id: 'cat_drinks_2', name: 'Drinks', description: 'Refreshing beverages, hot and cold.' },
  { id: 'cat_others_3', name: 'Others', description: 'Miscellaneous items and sides.' },
];

// --- DEFAULT INGREDIENTS ---
export const defaultIngredients: Ingredient[] = [
  { id: 'ing_coffee_beans_1', name: 'Premium Coffee Beans', unit: 'grams (g)', stock: 2000, lowStockThreshold: 500 },
  { id: 'ing_milk_fresh_2', name: 'Fresh Milk', unit: 'milliliters (ml)', stock: 10000, lowStockThreshold: 2000 },
  { id: 'ing_milk_soy_16', name: 'Soy Milk', unit: 'milliliters (ml)', stock: 2000, lowStockThreshold: 500 },
  { id: 'ing_milk_almond_17', name: 'Almond Milk', unit: 'milliliters (ml)', stock: 2000, lowStockThreshold: 500 },
  { id: 'ing_sugar_white_3', name: 'White Sugar', unit: 'grams (g)', stock: 1000, lowStockThreshold: 200 },
  { id: 'ing_bread_slice_4', name: 'Sliced Bread', unit: 'pieces (pcs)', stock: 100, lowStockThreshold: 20 },
  { id: 'ing_cheese_cheddar_5', name: 'Cheddar Cheese Slices', unit: 'pieces (pcs)', stock: 80, lowStockThreshold: 15 },
  { id: 'ing_ham_cooked_6', name: 'Cooked Ham Slices', unit: 'pieces (pcs)', stock: 70, lowStockThreshold: 15 },
  { id: 'ing_pasta_spaghetti_7', name: 'Spaghetti Pasta', unit: 'grams (g)', stock: 3000, lowStockThreshold: 500 },
  { id: 'ing_tomato_sauce_8', name: 'Classic Tomato Sauce', unit: 'milliliters (ml)', stock: 2000, lowStockThreshold: 400 },
  { id: 'ing_tea_leaves_black_9', name: 'Black Tea Leaves', unit: 'grams (g)', stock: 500, lowStockThreshold: 100 },
  { id: 'ing_water_filtered_10', name: 'Filtered Water', unit: 'milliliters (ml)', stock: 20000, lowStockThreshold: 5000 },
  { id: 'ing_chocolate_syrup_11', name: 'Chocolate Syrup', unit: 'milliliters (ml)', stock: 500, lowStockThreshold: 100 },
  { id: 'ing_vanilla_syrup_12', name: 'Vanilla Syrup', unit: 'milliliters (ml)', stock: 500, lowStockThreshold: 100 },
  { id: 'ing_ice_cubes_13', name: 'Ice Cubes', unit: 'grams (g)', stock: 5000, lowStockThreshold: 1000 },
  { id: 'ing_croissant_dough_14', name: 'Croissant Dough (frozen)', unit: 'pieces (pcs)', stock: 50, lowStockThreshold: 10 },
  { id: 'ing_cookie_dough_15', name: 'Cookie Dough (frozen)', unit: 'grams (g)', stock: 1000, lowStockThreshold: 200 },
  { id: 'ing_espresso_shot_18', name: 'Espresso Shot (for add-ons)', unit: 'pcs', stock: 1000, lowStockThreshold: 100 },
];

// --- DEFAULT MENU ITEMS ---
const foodCategoryId = defaultCategories.find(c => c.name === 'Food')?.id || 'cat_food_1';
const drinksCategoryId = defaultCategories.find(c => c.name === 'Drinks')?.id || 'cat_drinks_2';
const othersCategoryId = defaultCategories.find(c => c.name === 'Others')?.id || 'cat_others_3';

const defaultMilkOptions: MenuItemModifierGroup = {
  id: 'mg_milk_1',
  name: 'Milk Options',
  selectionType: 'single',
  options: [
    { id: 'mo_fresh_1', name: 'Fresh Milk', priceChange: 0 },
    { id: 'mo_soy_2', name: 'Soy Milk', priceChange: 20 },
    { id: 'mo_almond_3', name: 'Almond Milk', priceChange: 25 },
  ]
};

const defaultCoffeeSizeOptions: MenuItemModifierGroup = {
  id: 'mg_size_coffee_1',
  name: 'Size',
  selectionType: 'single',
  options: [
    { id: 'mso_regular_1', name: 'Regular', priceChange: 0 },
    { id: 'mso_large_2', name: 'Large', priceChange: 30 },
  ]
};

const defaultCoffeeAddons: MenuItemModifierGroup = {
    id: 'mg_addons_coffee_1',
    name: 'Add-ons',
    selectionType: 'multiple',
    options: [
        { id: 'mao_xtra_shot_1', name: 'Extra Espresso Shot', priceChange: 50 },
        { id: 'mao_vanilla_syrup_2', name: 'Vanilla Syrup', priceChange: 20 },
        { id: 'mao_choco_syrup_3', name: 'Chocolate Syrup', priceChange: 20 },
    ]
};

export const defaultMenuItems: MenuItem[] = [
  { 
    id: 'item_latte_1', 
    name: 'Classic Latte', 
    description: 'A perfect blend of rich espresso and steamed milk, topped with a thin layer of foam.', 
    price: 150, 
    categoryId: drinksCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?q=80&w=300&h=200&auto=format&fit=crop',
    modifierGroups: [defaultMilkOptions, defaultCoffeeSizeOptions, defaultCoffeeAddons]
  },
  { 
    id: 'item_cappuccino_2', 
    name: 'Frothy Cappuccino', 
    description: 'Espresso, steamed milk, and a thick layer of airy foam. A true Italian classic.', 
    price: 160, 
    categoryId: drinksCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc730e0?q=80&w=300&h=200&auto=format&fit=crop',
    modifierGroups: [defaultMilkOptions, defaultCoffeeSizeOptions]
  },
  { 
    id: 'item_iced_tea_3', 
    name: 'Refreshing Iced Tea', 
    description: 'Chilled black tea, lightly sweetened and served over ice. Perfect for a hot day.', 
    price: 100, 
    categoryId: drinksCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c787a86?q=80&w=300&h=200&auto=format&fit=crop' 
  },
  { 
    id: 'item_ham_cheese_sandwich_4', 
    name: 'Ham & Cheese Sandwich', 
    description: 'Classic comfort food: savory ham and melted cheddar cheese between toasted bread slices.', 
    price: 180, 
    categoryId: foodCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1620258780436-be1f35b4093a?q=80&w=300&h=200&auto=format&fit=crop' 
  },
  { 
    id: 'item_spaghetti_bolognese_5', 
    name: 'Spaghetti Bolognese', 
    description: 'Al dente spaghetti tossed in a rich, savory tomato and meat sauce. A hearty meal.', 
    price: 250, 
    categoryId: foodCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?q=80&w=300&h=200&auto=format&fit=crop' 
  },
  { 
    id: 'item_croissant_6', 
    name: 'Buttery Croissant', 
    description: 'A flaky, golden-brown croissant, perfect with coffee or on its own.', 
    price: 90, 
    categoryId: foodCategoryId, 
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?q=80&w=300&h=200&auto=format&fit=crop' 
  },
  { 
    id: 'item_choco_chip_cookies_7', 
    name: 'Chocolate Chip Cookies (3pcs)', 
    description: 'Three soft and chewy cookies, generously packed with milk chocolate chips.', 
    price: 70, 
    categoryId: othersCategoryId, // Changed to others
    isAvailable: true, 
    imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=300&h=200&auto=format&fit=crop' 
  },
  {
    id: 'item_mocha_8',
    name: 'Mocha Delight',
    description: 'A luscious combination of espresso, steamed milk, and rich chocolate syrup, topped with whipped cream.',
    price: 170,
    categoryId: drinksCategoryId,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1542302049-8795671859d6?q=80&w=300&h=200&auto=format&fit=crop',
    modifierGroups: [defaultMilkOptions, defaultCoffeeSizeOptions, defaultCoffeeAddons]
  },
  {
    id: 'item_clubhouse_9',
    name: 'Clubhouse Sandwich',
    description: 'A triple-decker sandwich with toasted bread, chicken or turkey, bacon, lettuce, tomato, and mayonnaise.',
    price: 280,
    categoryId: foodCategoryId,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1592415486651-21f20133ac74?q=80&w=300&h=200&auto=format&fit=crop'
  }
];

// --- DEFAULT RECIPES ---
export const defaultRecipes: Recipe[] = [
  { id: 'recipe_latte_1', menuItemId: 'item_latte_1', items: [{ ingredientId: 'ing_coffee_beans_1', quantity: 18 }, { ingredientId: 'ing_milk_fresh_2', quantity: 180 }, { ingredientId: 'ing_water_filtered_10', quantity: 40 }] },
  { id: 'recipe_cappuccino_2', menuItemId: 'item_cappuccino_2', items: [{ ingredientId: 'ing_coffee_beans_1', quantity: 18 }, { ingredientId: 'ing_milk_fresh_2', quantity: 150 }, { ingredientId: 'ing_water_filtered_10', quantity: 40 }] },
  { id: 'recipe_iced_tea_3', menuItemId: 'item_iced_tea_3', items: [{ ingredientId: 'ing_tea_leaves_black_9', quantity: 5 }, { ingredientId: 'ing_sugar_white_3', quantity: 20 }, { ingredientId: 'ing_water_filtered_10', quantity: 250 }, { ingredientId: 'ing_ice_cubes_13', quantity: 100 }] },
  { id: 'recipe_ham_cheese_4', menuItemId: 'item_ham_cheese_sandwich_4', items: [{ ingredientId: 'ing_bread_slice_4', quantity: 2 }, { ingredientId: 'ing_cheese_cheddar_5', quantity: 2 }, { ingredientId: 'ing_ham_cooked_6', quantity: 2 }] },
  { id: 'recipe_spaghetti_5', menuItemId: 'item_spaghetti_bolognese_5', items: [{ ingredientId: 'ing_pasta_spaghetti_7', quantity: 120 }, { ingredientId: 'ing_tomato_sauce_8', quantity: 150 }] },
  { id: 'recipe_mocha_8', menuItemId: 'item_mocha_8', items: [{ ingredientId: 'ing_coffee_beans_1', quantity: 18 }, { ingredientId: 'ing_milk_fresh_2', quantity: 150 }, { ingredientId: 'ing_water_filtered_10', quantity: 40 }, { ingredientId: 'ing_chocolate_syrup_11', quantity: 30 }] },
  { id: 'recipe_clubhouse_9', menuItemId: 'item_clubhouse_9', items: [{ ingredientId: 'ing_bread_slice_4', quantity: 3 }, { ingredientId: 'ing_ham_cooked_6', quantity: 2 }, { ingredientId: 'ing_cheese_cheddar_5', quantity: 1 }] }
];

// --- DEFAULT USERS ---
export const defaultSuperAdminUser: User = {
  id: 'user_superadmin_1',
  username: 'superadmin',
  role: UserRole.SUPER_ADMIN,
  passwordHash: 'superadmin_pass',
};

export const defaultKitchenUserFood: User = {
  id: 'user_kitchen_food_1',
  username: 'kitchen_food',
  role: UserRole.KITCHEN_STAFF,
  passwordHash: 'kitchen_pass', 
  assignedCategoryIds: [foodCategoryId], 
};

export const defaultKitchenUserDrinks: User = {
  id: 'user_kitchen_drinks_1',
  username: 'kitchen_drinks',
  role: UserRole.KITCHEN_STAFF,
  passwordHash: 'kitchen_pass',
  assignedCategoryIds: [drinksCategoryId, othersCategoryId], // Also handles "others" like cookies
};

export const defaultCashierUser: User = {
  id: 'user_cashier_1',
  username: 'cashier',
  role: UserRole.CASHIER,
  passwordHash: 'cashier_pass',
};

export const defaultUsers: User[] = [
  defaultSuperAdminUser,
  defaultKitchenUserFood,
  defaultKitchenUserDrinks,
  defaultCashierUser,
];

// --- DEFAULT ORDERS ---
// Helper for consistent order number generation
function generateDefaultOrderNumber(date: Date, indexForDay: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const count = indexForDay + 1; // 1-based index for display
  return `${yyyy}${mm}${dd}-${String(count).padStart(4, '0')}`;
}

const now = new Date();
const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
const sevenMinutesAgo = new Date(now.getTime() - 7 * 60 * 1000);
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);


const sampleLatteModifiers: SelectedModifierOption[] = [
    { groupId: 'mg_milk_1', groupName: 'Milk Options', optionId: 'mo_soy_2', optionName: 'Soy Milk', priceChange: 20 },
    { groupId: 'mg_size_coffee_1', groupName: 'Size', optionId: 'mso_large_2', optionName: 'Large', priceChange: 30 }
];
const sampleMochaModifiers: SelectedModifierOption[] = [
    { groupId: 'mg_milk_1', groupName: 'Milk Options', optionId: 'mo_almond_3', optionName: 'Almond Milk', priceChange: 25 }
];

export const defaultOrders: Order[] = [
  // Order 1: Fully Ready for Bar (Ready to Serve)
  {
    id: uuidv4(),
    orderNumber: generateDefaultOrderNumber(tenMinutesAgo, 0), // D01
    tokenNumber: 'A01',
    isPaid: true,
    items: [
      { 
        id: uuidv4(), 
        menuItemId: 'item_latte_1', 
        menuItemName: 'Classic Latte', 
        quantity: 1, 
        priceAtOrder: 150, 
        status: OrderItemStatus.AWAITING_DELIVERY, // KDS marked as READY -> AWAITING_DELIVERY
        selectedModifiers: sampleLatteModifiers 
      },
      { 
        id: uuidv4(), 
        menuItemId: 'item_ham_cheese_sandwich_4', // Food item
        menuItemName: 'Ham & Cheese Sandwich', 
        quantity: 1, 
        priceAtOrder: 180, 
        status: OrderItemStatus.AWAITING_DELIVERY // KDS marked as READY -> AWAITING_DELIVERY
      },
    ],
    status: OrderStatus.READY_FOR_DELIVERY, // Should auto-calculate to this
    totalAmount: (150 + 20 + 30) + 180, // Latte with modifiers + sandwich
    orderTime: tenMinutesAgo,
    tableNumber: 'T1',
    pax: 2,
    paymentMethod: 'card',
    lastKDSNotifiedTime: tenMinutesAgo.getTime(),
  },
  // Order 2: Partially Ready (one item for Bar, one for KDS)
  {
    id: uuidv4(),
    orderNumber: generateDefaultOrderNumber(fiveMinutesAgo, 1), // D02
    tokenNumber: 'A02',
    isPaid: false, // Not yet paid
    items: [
      { 
        id: uuidv4(), 
        menuItemId: 'item_cappuccino_2', // Drink
        menuItemName: 'Frothy Cappuccino', 
        quantity: 2, 
        priceAtOrder: 160, 
        status: OrderItemStatus.PREPARING // Still being made by KDS Drinks
      },
      { 
        id: uuidv4(), 
        menuItemId: 'item_croissant_6', // Food
        menuItemName: 'Buttery Croissant', 
        quantity: 1, 
        priceAtOrder: 90, 
        status: OrderItemStatus.AWAITING_DELIVERY // Ready from KDS Food, for Bar
      },
    ],
    status: OrderStatus.PARTIALLY_READY, // Auto-calculated
    totalAmount: (160 * 2) + 90,
    orderTime: fiveMinutesAgo,
    tableNumber: 'T5',
    pax: 1,
    lastKDSNotifiedTime: fiveMinutesAgo.getTime(),
  },
  // Order 3: All Pending for KDS
  {
    id: uuidv4(),
    orderNumber: generateDefaultOrderNumber(oneMinuteAgo, 0), // D03, different day for token reset
    tokenNumber: 'A03',
    isPaid: true,
    items: [
      { 
        id: uuidv4(), 
        menuItemId: 'item_spaghetti_bolognese_5', // Food
        menuItemName: 'Spaghetti Bolognese', 
        quantity: 1, 
        priceAtOrder: 250, 
        status: OrderItemStatus.PENDING 
      },
      { 
        id: uuidv4(), 
        menuItemId: 'item_iced_tea_3', // Drink
        menuItemName: 'Refreshing Iced Tea', 
        quantity: 1, 
        priceAtOrder: 100, 
        status: OrderItemStatus.PENDING 
      },
    ],
    status: OrderStatus.PENDING,
    totalAmount: 250 + 100,
    orderTime: oneMinuteAgo,
    paymentMethod: 'cash',
    amountReceived: 400,
    changeGiven: 50,
    lastKDSNotifiedTime: oneMinuteAgo.getTime(),
  },
  // Order 4: Bar Delivery in Progress
  {
    id: uuidv4(),
    orderNumber: generateDefaultOrderNumber(sevenMinutesAgo, 0), // D04
    tokenNumber: 'A04',
    isPaid: true, 
    paymentMethod: 'gcash',
    items: [
      { 
        id: uuidv4(), 
        menuItemId: 'item_mocha_8', // Drink
        menuItemName: 'Mocha Delight', 
        quantity: 1, 
        priceAtOrder: 170, 
        status: OrderItemStatus.DELIVERED_TO_CUSTOMER, // Served by Bar
        selectedModifiers: sampleMochaModifiers
      },
      { 
        id: uuidv4(), 
        menuItemId: 'item_choco_chip_cookies_7', // Other
        menuItemName: 'Chocolate Chip Cookies (3pcs)', 
        quantity: 1, 
        priceAtOrder: 70, 
        status: OrderItemStatus.AWAITING_DELIVERY // Ready from KDS, for Bar
      },
    ],
    status: OrderStatus.DELIVERY_IN_PROGRESS, // Auto-calculated
    totalAmount: (170 + 25) + 70, // Mocha with modifiers + cookies
    orderTime: sevenMinutesAgo, 
    tableNumber: 'Takeaway',
    lastKDSNotifiedTime: sevenMinutesAgo.getTime(),
  },
  // Order 5: Completed order
  {
    id: uuidv4(),
    orderNumber: generateDefaultOrderNumber(twentyMinutesAgo, 0), // D05
    tokenNumber: 'A05',
    isPaid: true,
    items: [
      { 
        id: uuidv4(), 
        menuItemId: 'item_latte_1', 
        menuItemName: 'Classic Latte', 
        quantity: 1, 
        priceAtOrder: 150, 
        status: OrderItemStatus.DELIVERED_TO_CUSTOMER
      },
      { 
        id: uuidv4(), 
        menuItemId: 'item_ham_cheese_sandwich_4', 
        menuItemName: 'Ham & Cheese Sandwich', 
        quantity: 1, 
        priceAtOrder: 180, 
        status: OrderItemStatus.DELIVERED_TO_CUSTOMER 
      },
    ],
    status: OrderStatus.COMPLETED, // Auto-calculated (or manually set by POS completion logic)
    totalAmount: 150 + 180,
    orderTime: twentyMinutesAgo,
    tableNumber: 'T3',
    pax: 1,
    paymentMethod: 'cash',
    amountReceived: 500,
    changeGiven: 500 - (150 + 180),
    lastKDSNotifiedTime: twentyMinutesAgo.getTime(),
  }
];
