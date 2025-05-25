// services/inventoryService.ts
import { Ingredient } from '../types';
import { defaultIngredients } from '../data/defaultData';
import { v4 as uuidv4 } from 'uuid';

// Simulate a delay to mimic network latency
const API_DELAY = 400;

// In-memory store, initialized with default data
let ingredientsStore: Ingredient[] = JSON.parse(JSON.stringify(defaultIngredients));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchIngredientsAPI = async (): Promise<Ingredient[]> => {
  await delay(API_DELAY);
  return JSON.parse(JSON.stringify(ingredientsStore)); // Return a copy
};

export const addIngredientAPI = async (ingredientData: Omit<Ingredient, 'id'>): Promise<Ingredient> => {
  await delay(API_DELAY);
  const newIngredient: Ingredient = { ...ingredientData, id: uuidv4() };
  ingredientsStore.push(newIngredient);
  return JSON.parse(JSON.stringify(newIngredient));
};

export const updateIngredientAPI = async (updatedIngredient: Ingredient): Promise<Ingredient> => {
  await delay(API_DELAY);
  const index = ingredientsStore.findIndex(ing => ing.id === updatedIngredient.id);
  if (index === -1) {
    throw new Error('Ingredient not found for update');
  }
  ingredientsStore[index] = updatedIngredient;
  return JSON.parse(JSON.stringify(updatedIngredient));
};

export const deleteIngredientAPI = async (ingredientId: string): Promise<{ deletedIngredientId: string }> => {
  await delay(API_DELAY);
  const initialLength = ingredientsStore.length;
  ingredientsStore = ingredientsStore.filter(ing => ing.id !== ingredientId);
  if (ingredientsStore.length === initialLength) {
    throw new Error('Ingredient not found for deletion');
  }
  return { deletedIngredientId: ingredientId };
};

// deductIngredientStock is a bit more complex to map directly to a simple CRUD API.
// In a real backend (e.g., with Firestore), this might be a transaction or a specific endpoint.
// For the mock service, we'll modify the store directly but still make it async.
export const deductIngredientStockAPI = async (ingredientId: string, quantityToDeduct: number): Promise<Ingredient> => {
  await delay(API_DELAY / 2); // Faster, as it might be part of a larger operation
  const index = ingredientsStore.findIndex(ing => ing.id === ingredientId);
  if (index === -1) {
    throw new Error(`Ingredient with ID ${ingredientId} not found for stock deduction.`);
  }
  
  const currentStock = ingredientsStore[index].stock;
  if (currentStock < quantityToDeduct) {
    console.warn(`Attempted to deduct ${quantityToDeduct} of ${ingredientsStore[index].name}, but only ${currentStock} available. Stock set to 0.`);
    ingredientsStore[index].stock = 0;
  } else {
    ingredientsStore[index].stock -= quantityToDeduct;
  }
  return JSON.parse(JSON.stringify(ingredientsStore[index]));
};
