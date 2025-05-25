import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { Recipe, RecipeItem } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { defaultRecipes } from '../data/defaultData'; // Import defaults

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipeData: Omit<Recipe, 'id' | 'menuItemId'>, menuItemId: string) => Recipe;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  deleteRecipesByMenuItemId: (menuItemId: string) => void;
  getRecipeById: (recipeId: string) => Recipe | undefined;
  getRecipeByMenuItemId: (menuItemId: string) => Recipe | undefined;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', defaultRecipes);

  const addRecipe = useCallback((recipeData: Omit<Recipe, 'id' | 'menuItemId'>, menuItemId: string) => {
    const newRecipe: Recipe = { ...recipeData, id: uuidv4(), menuItemId };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  }, [setRecipes]);

  const updateRecipe = useCallback((updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(rec => rec.id === updatedRecipe.id ? updatedRecipe : rec));
  }, [setRecipes]);

  const deleteRecipe = useCallback((recipeId: string) => {
    setRecipes(prev => prev.filter(rec => rec.id !== recipeId));
  }, [setRecipes]);

  const deleteRecipesByMenuItemId = useCallback((menuItemId: string) => {
    setRecipes(prev => prev.filter(rec => rec.menuItemId !== menuItemId));
  }, [setRecipes]);
  
  const getRecipeById = useCallback((recipeId: string) => {
    return recipes.find(rec => rec.id === recipeId);
  }, [recipes]);

  const getRecipeByMenuItemId = useCallback((menuItemId: string) => {
    return recipes.find(rec => rec.menuItemId === menuItemId);
  }, [recipes]);

  return (
    <RecipeContext.Provider value={{ 
      recipes,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      deleteRecipesByMenuItemId,
      getRecipeById,
      getRecipeByMenuItemId,
    }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};