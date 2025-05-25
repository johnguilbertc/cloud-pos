
import React from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Ingredient } from '../../types';
import { EditIcon, TrashIcon, WarningIcon } from '../../components/icons/Icons';

interface IngredientListProps {
  onEditIngredient: (ingredient: Ingredient) => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({ onEditIngredient }) => {
  const { ingredients, deleteIngredient, isLoading } = useInventory(); // isLoading for context operations

  const handleDelete = async (ingredientId: string, ingredientName: string) => {
    if (window.confirm(`Are you sure you want to delete the ingredient "${ingredientName}"? This action cannot be undone.`)) {
      try {
        await deleteIngredient(ingredientId);
        // Optionally add success notification
      } catch (error) {
        alert(`Failed to delete ingredient: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (ingredients.length === 0 && !isLoading) { // Consider isLoading here too
    return (
      <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-textPrimary mb-4">Ingredients</h2>
        <p className="text-textSecondary">No ingredients found. Add some to manage your inventory.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-textPrimary mb-6">Ingredients</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Unit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Low Stock At</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ingredients.map((ingredient) => {
              const isLowStock = ingredient.stock <= ingredient.lowStockThreshold;
              return (
                <tr key={ingredient.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-textPrimary">{ingredient.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-textSecondary">{ingredient.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm flex items-center ${isLowStock ? 'text-red-600 font-semibold' : 'text-textSecondary'}`}>
                      {ingredient.stock}
                      {isLowStock && <WarningIcon className="w-4 h-4 ml-2 text-red-500" title="Stock is low!" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-textSecondary">{ingredient.lowStockThreshold}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEditIngredient(ingredient)}
                      className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-yellow-100 mr-2"
                      title={`Edit ${ingredient.name}`}
                      aria-label={`Edit ${ingredient.name}`}
                      disabled={isLoading} // Disable actions if context is busy
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ingredient.id, ingredient.name)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                      title={`Delete ${ingredient.name}`}
                      aria-label={`Delete ${ingredient.name}`}
                      disabled={isLoading} // Disable actions if context is busy
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
