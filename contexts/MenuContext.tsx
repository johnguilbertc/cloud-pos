import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { Category, MenuItem } from '../types';
import { categoryService, menuItemService } from '../services/firebaseService';
import { defaultCategories, defaultMenuItems } from '../data/defaultData';
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

interface MenuContextType {
  categories: Category[];
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<string[]>; 
  getCategoryById: (categoryId: string) => Category | undefined;
  addMenuItem: (item: Omit<MenuItem, 'id'> & { id?: string }) => Promise<MenuItem | undefined>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>; 
  getMenuItemById: (itemId: string) => MenuItem | undefined;
  getMenuItemsByCategoryId: (categoryId: string) => MenuItem[];
  refreshMenuData: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// --- One-time Data Seeding for Development ---
const seedInitialData = async () => {
  console.log("Checking if initial data seeding is required for menu...");
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (categoriesSnapshot.empty) {
      console.log("Firestore 'categories' collection is empty. Seeding default categories and menu items...");
      const batch = writeBatch(db);

      defaultCategories.forEach(category => {
        const categoryRef = doc(db, 'categories', category.id);
        batch.set(categoryRef, { name: category.name, description: category.description });
      });

      defaultMenuItems.forEach(menuItem => {
        const menuItemRef = doc(db, 'menuItems', menuItem.id);
        const { id, ...itemData } = menuItem; 
        batch.set(menuItemRef, itemData);
      });

      await batch.commit();
      console.log("Default categories and menu items seeded successfully to Firestore.");
      return true;
    } else {
      console.log("'categories' collection is not empty. Skipping seeding.");
      return false;
    }
  } catch (error) {
    console.error("Error during initial data seeding for menu:", error);
    throw new Error("Failed to seed initial menu data. Please check Firestore connection and permissions.");
  }
};
// --- End Seeding Logic ---

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && !isSeeding) setIsLoading(true);
    setError(null);
    try {
      const [fetchedCategories, fetchedMenuItems] = await Promise.all([
        categoryService.getAll(),
        menuItemService.getAll()
      ]);
      setCategories(fetchedCategories);
      setMenuItems(fetchedMenuItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu data from Firestore.");
      console.error("Error loading menu data from Firestore:", e);
    } finally {
      if (!forceRefresh && !isSeeding) setIsLoading(false);
    }
  }, [isSeeding]);

  useEffect(() => {
    const initializeAndLoad = async () => {
      setIsLoading(true);
      try {
        await seedInitialData();
      } catch (seedError) {
        setError(seedError instanceof Error ? seedError.message : "Data seeding failed.");
        setIsLoading(false);
        setIsSeeding(false);
        return;
      }
      setIsSeeding(false);
      await loadData(true);
      setIsLoading(false);
    };
    initializeAndLoad();
  }, [loadData]);

  const addCategory = useCallback(async (categoryData: Omit<Category, 'id'>) => {
    setIsLoading(true);
    try {
      await categoryService.create(categoryData);
      await loadData(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add category");
      console.error("Error adding category:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const updateCategory = useCallback(async (updatedCategory: Category) => {
    setIsLoading(true);
    try {
      await categoryService.update(updatedCategory.id, updatedCategory);
      await loadData(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
      console.error("Error updating category:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<string[]> => {
    setIsLoading(true);
    try {
      // Get menu items in this category before deleting
      const itemsInCategory = menuItems.filter(item => item.categoryId === categoryId);
      const affectedMenuItemIds = itemsInCategory.map(item => item.id);
      
      // Delete the category
      await categoryService.delete(categoryId);
      
      // Update affected menu items to remove category reference
      await Promise.all(
        itemsInCategory.map(item => 
          menuItemService.update(item.id, { categoryId: '' })
        )
      );
      
      await loadData(true);
      setError(null);
      return affectedMenuItemIds;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
      console.error("Error deleting category:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData, menuItems]);

  const getCategoryById = useCallback((categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  }, [categories]);

  const addMenuItem = useCallback(async (itemData: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem | undefined> => {
    setIsLoading(true);
    try {
      const newItemId = await menuItemService.create(itemData);
      await loadData(true);
      setError(null);
      return menuItems.find(item => item.id === newItemId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add menu item");
      console.error("Error adding menu item:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData, menuItems]);

  const updateMenuItem = useCallback(async (updatedItem: MenuItem) => {
    setIsLoading(true);
    try {
      await menuItemService.update(updatedItem.id, updatedItem);
      await loadData(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update menu item");
      console.error("Error updating menu item:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      await menuItemService.delete(itemId);
      await loadData(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete menu item");
      console.error("Error deleting menu item:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  const getMenuItemById = useCallback((itemId: string) => {
    return menuItems.find(item => item.id === itemId);
  }, [menuItems]);

  const getMenuItemsByCategoryId = useCallback((categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId);
  }, [menuItems]);

  const refreshMenuData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const value = {
    categories,
    menuItems,
    isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemById,
    getMenuItemsByCategoryId,
    refreshMenuData,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
