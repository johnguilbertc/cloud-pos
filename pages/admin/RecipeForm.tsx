import React, { useState, useEffect, useCallback } from 'react';
import { useRecipe } from '../../contexts/RecipeContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useMenu } from '../../contexts/MenuContext';
import { MenuItem, Recipe, RecipeItem, Ingredient } from '../../types';
import { PlusIcon, TrashIcon } from '../../components/icons/Icons';
import { v4 as uuidv4 } from 'uuid';


interface RecipeFormProps {
  menuItem: MenuItem; // The menu item for which the recipe is being created/edited
  existingRecipe?: Recipe;
  onFormSubmit: () => void; // To close the modal
}

interface RecipeItemFormState extends RecipeItem {
  localId: string; // For keying in lists before saving
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ menuItem, existingRecipe, onFormSubmit }) => {
  const { addRecipe, updateRecipe } = useRecipe();
  const { ingredients, getIngredientById } = useInventory();
  const { getMenuItemById } = useMenu(); // Just in case we need to refresh menu item details, though prop `menuItem` should be current

  const [recipeItems, setRecipeItems] = useState<RecipeItemFormState[]>([]);

  useEffect(() => {
    if (existingRecipe) {
      setRecipeItems(existingRecipe.items.map(item => ({ ...item, localId: uuidv4() })));
    } else {
      setRecipeItems([]); // Start with an empty list or one empty item
    }
  }, [existingRecipe]);
  
  const currentMenuItem = getMenuItemById(menuItem.id) || menuItem;


  const handleAddIngredientLine = () => {
    setRecipeItems(prev => [...prev, { localId: uuidv4(), ingredientId: '', quantity: 0 }]);
  };

  const handleRemoveIngredientLine = (localId: string) => {
    setRecipeItems(prev => prev.filter(item => item.localId !== localId));
  };

  const handleRecipeItemChange = (localId: string, field: keyof RecipeItem, value: string | number) => {
    setRecipeItems(prev => 
      prev.map(item => 
        item.localId === localId ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validRecipeItems = recipeItems.filter(item => item.ingredientId && item.quantity > 0);

    if (validRecipeItems.length === 0) {
      alert('Please add at least one ingredient with a valid quantity to the recipe.');
      return;
    }

    // Check for duplicate ingredients
    const ingredientCounts = validRecipeItems.reduce((acc, item) => {
      acc[item.ingredientId] = (acc[item.ingredientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicates = Object.entries(ingredientCounts).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
        const duplicateNames = duplicates.map(([id, _]) => getIngredientById(id)?.name || 'Unknown Ingredient').join(', ');
        alert(`Each ingredient can only be added once. Duplicate(s) found: ${duplicateNames}. Please consolidate them.`);
        return;
    }


    const finalItems: RecipeItem[] = validRecipeItems.map(({ localId, ...rest }) => rest);

    if (existingRecipe) {
      updateRecipe({ ...existingRecipe, items: finalItems });
    } else {
      addRecipe({ items: finalItems }, menuItem.id);
    }
    onFormSubmit();
  };
  
  const getIngredientUnit = (ingredientId: string): string => {
    const ingredient = getIngredientById(ingredientId);
    return ingredient ? `(${ingredient.unit})` : '';
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-textPrimary">
        Recipe for: <span className="text-primary">{currentMenuItem.name}</span>
      </h3>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {recipeItems.map((item, index) => (
          <div key={item.localId} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7">
                <label htmlFor={`ingredient-${item.localId}`} className="block text-sm font-medium text-textPrimary mb-1">
                  Ingredient <span className="text-red-500">*</span>
                </label>
                <select
                  id={`ingredient-${item.localId}`}
                  value={item.ingredientId}
                  onChange={(e) => handleRecipeItemChange(item.localId, 'ingredientId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white"
                  required
                >
                  <option value="" disabled>Select Ingredient</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label htmlFor={`quantity-${item.localId}`} className="block text-sm font-medium text-textPrimary mb-1">
                  Quantity <span className="text-red-500">*</span> <span className="text-xs text-gray-500">{getIngredientUnit(item.ingredientId)}</span>
                </label>
                <input
                  type="number"
                  id={`quantity-${item.localId}`}
                  value={item.quantity}
                  onChange={(e) => handleRecipeItemChange(item.localId, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  min="0.001" // Allow small quantities
                  step="any"
                  required
                />
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveIngredientLine(item.localId)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                  title="Remove Ingredient"
                  aria-label="Remove Ingredient from Recipe"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ingredients.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
            No ingredients found in your inventory. Please add ingredients in the Inventory Management section first.
        </p>
      )}

      <button
        type="button"
        onClick={handleAddIngredientLine}
        disabled={ingredients.length === 0}
        className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon className="w-5 h-5 mr-2" /> Add Ingredient to Recipe
      </button>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onFormSubmit}
          className="px-6 py-2 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={recipeItems.length === 0 || ingredients.length === 0}
          className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {existingRecipe ? 'Save Changes' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
};