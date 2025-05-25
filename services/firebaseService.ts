import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, DocumentData, DocumentReference, DocumentSnapshot, QueryDocumentSnapshot, Query, QuerySnapshot, serverTimestamp, Timestamp, QueryConstraint } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { Order, MenuItem, Category, Ingredient, Recipe, User as UserType, CafeSettings } from '../types';
import { logger } from '../utils/logger';

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const auth = getAuth(app);

// Helper function to convert dates to Firestore timestamps
const convertToFirestoreTimestamp = (date: Date | string | undefined): Timestamp | undefined => {
  if (!date) return undefined;
  return Timestamp.fromDate(new Date(date));
};

// Helper function to convert Firestore timestamps to Date objects
const convertFromFirestoreTimestamp = (timestamp: Timestamp | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  return timestamp.toDate();
};

// Helper function to convert dates to Firestore timestamps
const convertDatesToTimestamps = (data: any): any => {
  if (data instanceof Date) {
    return Timestamp.fromDate(data);
  }
  if (Array.isArray(data)) {
    return data.map(convertDatesToTimestamps);
  }
  if (data && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, convertDatesToTimestamps(value)])
    );
  }
  return data;
};

// Generic CRUD operations
const createDocument = async <T extends DocumentData>(
  collectionName: string, 
  data: Omit<T, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...convertDatesToTimestamps(data),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    logger.error(`Error creating document in ${collectionName}: ${error}`);
    throw error;
  }
};

const getDocument = async <T extends DocumentData>(
  collectionName: string, 
  id: string
): Promise<(T & { id: string }) | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    // Convert Firestore timestamps to Dates
    const convertedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof Timestamp ? value.toDate() : value
      ])
    );
    
    return { id: docSnap.id, ...convertedData } as T & { id: string };
  } catch (error) {
    logger.error(`Error getting document ${id} from ${collectionName}: ${error}`);
    throw error;
  }
};

const updateDocument = async <T extends DocumentData>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...convertDatesToTimestamps(data),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    logger.error(`Error updating document ${id} in ${collectionName}: ${error}`);
    throw error;
  }
};

const deleteDocument = async (
  collectionName: string, 
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`Error deleting document ${id} from ${collectionName}: ${error}`);
    throw error;
  }
};

const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore timestamps to Dates
      const convertedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value instanceof Timestamp ? value.toDate() : value
        ])
      );
      return { id: doc.id, ...convertedData } as T & { id: string };
    });
  } catch (error) {
    logger.error(`Error querying documents from ${collectionName}: ${error}`);
    throw error;
  }
};

// Category Operations
export const categoryService = {
  create: (data: Omit<Category, 'id'>) => createDocument<Category>('categories', data),
  get: (id: string) => getDocument<Category>('categories', id),
  update: (id: string, data: Partial<Category>) => updateDocument('categories', id, data),
  delete: (id: string) => deleteDocument('categories', id),
  getAll: () => queryDocuments<Category>('categories', [orderBy('name')]),
};

// Menu Item Operations
export const menuItemService = {
  create: (data: Omit<MenuItem, 'id'>) => createDocument<MenuItem>('menuItems', data),
  get: (id: string) => getDocument<MenuItem>('menuItems', id),
  update: (id: string, data: Partial<MenuItem>) => updateDocument('menuItems', id, data),
  delete: (id: string) => deleteDocument('menuItems', id),
  getAll: () => queryDocuments<MenuItem>('menuItems', [orderBy('name')]),
  getByCategory: (categoryId: string) => 
    queryDocuments<MenuItem>('menuItems', [where('categoryId', '==', categoryId)]),
};

// Ingredient Operations
export const ingredientService = {
  create: (data: Omit<Ingredient, 'id'>) => createDocument<Ingredient>('ingredients', data),
  get: (id: string) => getDocument<Ingredient>('ingredients', id),
  update: (id: string, data: Partial<Ingredient>) => updateDocument('ingredients', id, data),
  delete: (id: string) => deleteDocument('ingredients', id),
  getAll: () => queryDocuments<Ingredient>('ingredients', [orderBy('name')]),
  getLowStock: () => 
    queryDocuments<Ingredient>('ingredients', [where('stock', '<', 'lowStockThreshold')]),
};

// Recipe Operations
export const recipeService = {
  create: (data: Omit<Recipe, 'id'>) => createDocument<Recipe>('recipes', data),
  get: (id: string) => getDocument<Recipe>('recipes', id),
  update: (id: string, data: Partial<Recipe>) => updateDocument('recipes', id, data),
  delete: (id: string) => deleteDocument('recipes', id),
  getByMenuItem: (menuItemId: string) => 
    queryDocuments<Recipe>('recipes', [where('menuItemId', '==', menuItemId)]),
};

// Order Operations
export const orderService = {
  create: (data: Omit<Order, 'id'>) => createDocument<Order>('orders', data),
  get: (id: string) => getDocument<Order>('orders', id),
  update: (id: string, data: Partial<Order>) => updateDocument('orders', id, data),
  delete: (id: string) => deleteDocument('orders', id),
  getAll: () => queryDocuments<Order>('orders', [orderBy('orderTime', 'desc')]),
  getByStatus: (status: string) => 
    queryDocuments<Order>('orders', [
      where('status', '==', status),
      orderBy('orderTime', 'desc')
    ]),
  getByDateRange: (startDate: Date, endDate: Date) => 
    queryDocuments<Order>('orders', [
      where('orderTime', '>=', Timestamp.fromDate(startDate)),
      where('orderTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('orderTime', 'desc')
    ]),
};

// User Operations
export const userService = {
  create: (data: Omit<UserType, 'id'>) => createDocument<UserType>('users', data),
  get: (id: string) => getDocument<UserType>('users', id),
  update: (id: string, data: Partial<UserType>) => updateDocument('users', id, data),
  delete: (id: string) => deleteDocument('users', id),
  getAll: () => queryDocuments<UserType>('users', [orderBy('username')]),
  getByRole: (role: string) => 
    queryDocuments<UserType>('users', [where('role', '==', role)]),
};

// Settings Operations
export const settingsService = {
  get: () => getDocument<CafeSettings>('settings', 'cafe_settings'),
  update: (data: Partial<CafeSettings>) => 
    updateDocument('settings', 'cafe_settings', data),
}; 