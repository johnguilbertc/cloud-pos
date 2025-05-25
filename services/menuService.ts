// services/menuService.ts
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, getDoc, Firestore, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
// Removed direct db import from firebase-config
import { Category, MenuItem } from '../types';

const CATEGORIES_COLLECTION = 'categories';
const MENU_ITEMS_COLLECTION = 'menuItems';

// Helper to convert Firestore doc to Category/MenuItem with ID
const docToCategory = (document: QueryDocumentSnapshot<DocumentData>): Category => ({ id: document.id, ...document.data() } as Category);
const docToMenuItem = (document: QueryDocumentSnapshot<DocumentData>): MenuItem => ({ id: document.id, ...document.data() } as MenuItem);


export const fetchCategoriesAPI = async (db: Firestore): Promise<Category[]> => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return categoriesSnapshot.docs.map(docToCategory);
  } catch (error) {
    console.error("Error fetching categories from Firestore:", error);
    throw error;
  }
};

export const addCategoryAPI = async (db: Firestore, categoryData: Omit<Category, 'id'>): Promise<Category> => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
    return { id: docRef.id, ...categoryData };
  } catch (error) {
    console.error("Error adding category to Firestore:", error);
    throw error;
  }
};

export const updateCategoryAPI = async (db: Firestore, updatedCategory: Category): Promise<Category> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, updatedCategory.id);
    const { id, ...dataToUpdate } = updatedCategory; 
    await updateDoc(categoryRef, dataToUpdate);
    return updatedCategory;
  } catch (error) {
    console.error("Error updating category in Firestore:", error);
    throw error;
  }
};

export const deleteCategoryAPI = async (db: Firestore, categoryId: string): Promise<{ deletedCategoryId: string, affectedMenuItemIds: string[] }> => {
  try {
    const batch = writeBatch(db);
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    
    const menuItemsQuery = query(collection(db, MENU_ITEMS_COLLECTION), where("categoryId", "==", categoryId));
    const menuItemsSnapshot = await getDocs(menuItemsQuery);
    const affectedMenuItemIds: string[] = [];

    menuItemsSnapshot.forEach(docSnap => {
      batch.delete(doc(db, MENU_ITEMS_COLLECTION, docSnap.id));
      affectedMenuItemIds.push(docSnap.id);
    });

    batch.delete(categoryRef);
    await batch.commit();
    
    return { deletedCategoryId: categoryId, affectedMenuItemIds };
  } catch (error) {
    console.error("Error deleting category and associated menu items from Firestore:", error);
    throw error;
  }
};


export const fetchMenuItemsAPI = async (db: Firestore): Promise<MenuItem[]> => {
  try {
    const menuItemsSnapshot = await getDocs(collection(db, MENU_ITEMS_COLLECTION));
    return menuItemsSnapshot.docs.map(docToMenuItem);
  } catch (error) {
    console.error("Error fetching menu items from Firestore:", error);
    throw error;
  }
};

export const addMenuItemAPI = async (db: Firestore, itemData: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> => {
  try {
    let dataToAdd: Omit<MenuItem, 'id'> = { ...itemData };
    delete (dataToAdd as any).id; 

    // If a specific ID was passed (e.g., for seeding with predefined IDs)
    if (itemData.id) {
        const menuItemRef = doc(db, MENU_ITEMS_COLLECTION, itemData.id);
        await writeBatch(db).set(menuItemRef, dataToAdd).commit(); // Using set to ensure the ID is used
        return { id: itemData.id, ...dataToAdd };
    } else {
        const docRef = await addDoc(collection(db, MENU_ITEMS_COLLECTION), dataToAdd);
        return { id: docRef.id, ...dataToAdd };
    }
  } catch (error) {
    console.error("Error adding menu item to Firestore:", error);
    throw error;
  }
};

export const updateMenuItemAPI = async (db: Firestore, updatedItem: MenuItem): Promise<MenuItem> => {
  try {
    const menuItemRef = doc(db, MENU_ITEMS_COLLECTION, updatedItem.id);
    const { id, ...dataToUpdate } = updatedItem; 
    await updateDoc(menuItemRef, dataToUpdate);
    return updatedItem;
  } catch (error) {
    console.error("Error updating menu item in Firestore:", error);
    throw error;
  }
};

export const deleteMenuItemAPI = async (db: Firestore, itemId: string): Promise<{ deletedMenuItemId: string }> => {
  try {
    const menuItemRef = doc(db, MENU_ITEMS_COLLECTION, itemId);
    await deleteDoc(menuItemRef);
    return { deletedMenuItemId: itemId };
  } catch (error) {
    console.error("Error deleting menu item from Firestore:", error);
    throw error;
  }
};

export const getCategoryDocAPI = async (db: Firestore, categoryId: string): Promise<Category | undefined> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(categoryRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Category : undefined;
  } catch (error) {
    console.error("Error fetching category doc:", error);
    throw error;
  }
};
