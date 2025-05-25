
import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { Ingredient } from '../types';
import { 
  fetchIngredientsAPI, addIngredientAPI, updateIngredientAPI, deleteIngredientAPI, deductIngredientStockAPI
} from '../services/inventoryService'; // Import new service

interface InventoryContextType {
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => Promise<void>;
  updateIngredient: (ingredient: Ingredient) => Promise<void>;
  deleteIngredient: (ingredientId: string) => Promise<void>;
  getIngredientById: (ingredientId: string) => Ingredient | undefined;
  deductIngredientStock: (ingredientId: string, quantityToDeduct: number) => Promise<void>;
  refreshIngredients: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadIngredients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedIngredients = await fetchIngredientsAPI();
      setIngredients(fetchedIngredients);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load ingredients";
      setError(errorMessage);
      console.error("Error loading ingredients:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const addIngredient = useCallback(async (ingredientData: Omit<Ingredient, 'id'>) => {
    setIsLoading(true);
    try {
      const newIngredient = await addIngredientAPI(ingredientData);
      setIngredients(prev => [...prev, newIngredient]);
      setError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add ingredient";
      setError(errorMessage);
      console.error("Error adding ingredient:", e);
      throw e; // Re-throw for component-level handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateIngredient = useCallback(async (updatedIngredient: Ingredient) => {
    setIsLoading(true);
    try {
      const savedIngredient = await updateIngredientAPI(updatedIngredient);
      setIngredients(prev => prev.map(ing => ing.id === savedIngredient.id ? savedIngredient : ing));
      setError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update ingredient";
      setError(errorMessage);
      console.error("Error updating ingredient:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteIngredient = useCallback(async (ingredientId: string) => {
    setIsLoading(true);
    try {
      await deleteIngredientAPI(ingredientId);
      setIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
      setError(null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to delete ingredient";
      setError(errorMessage);
      console.error("Error deleting ingredient:", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const getIngredientById = useCallback((ingredientId: string) => {
    return ingredients.find(ing => ing.id === ingredientId);
  }, [ingredients]);

  const deductIngredientStock = useCallback(async (ingredientId: string, quantityToDeduct: number) => {
    // No global loading state change for this, could be frequent. 
    // Error handling might be more localized or logged.
    try {
      const updatedIngredient = await deductIngredientStockAPI(ingredientId, quantityToDeduct);
      setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing));
    } catch (e) {
      // This error is more critical for data integrity. Log it prominently.
      console.error(`Critical error deducting stock for ${ingredientId}:`, e);
      // Potentially set a global error or a specific inventory alert state
      setError(e instanceof Error ? `Stock deduction error: ${e.message}` : "Unknown stock deduction error");
      throw e; // Allow callers to handle if needed
    }
  }, []);

  return (
    <InventoryContext.Provider value={{ 
      ingredients,
      isLoading,
      error,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      getIngredientById,
      deductIngredientStock,
      refreshIngredients: loadIngredients,
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
