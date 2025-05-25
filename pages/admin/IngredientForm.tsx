
import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Ingredient } from '../../types';
import { COMMON_UNITS } from '../../constants';
import { LoadingSpinner } from '../../components/icons/Icons'; // For loading state

interface IngredientFormProps {
  ingredientToEdit?: Ingredient;
  onFormSubmit: () => void;
}

export const IngredientForm: React.FC<IngredientFormProps> = ({ ingredientToEdit, onFormSubmit }) => {
  const { addIngredient, updateIngredient, isLoading: isContextLoading } = useInventory();
  
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(COMMON_UNITS[0] || '');
  const [stock, setStock] = useState<number | ''>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local submitting state
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (ingredientToEdit) {
      setName(ingredientToEdit.name);
      setUnit(ingredientToEdit.unit);
      setStock(ingredientToEdit.stock);
      setLowStockThreshold(ingredientToEdit.lowStockThreshold);
    } else {
      setName('');
      setUnit(COMMON_UNITS[0] || '');
      setStock('');
      setLowStockThreshold('');
    }
    setFormError(null); // Reset error when ingredientToEdit changes
  }, [ingredientToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || unit.trim() === '' || stock === '' || lowStockThreshold === '') {
      setFormError('All fields are required.');
      return;
    }

    const numericStock = Number(stock);
    const numericLowStockThreshold = Number(lowStockThreshold);

    if (isNaN(numericStock) || numericStock < 0 || isNaN(numericLowStockThreshold) || numericLowStockThreshold < 0) {
      setFormError('Stock and Low Stock Threshold must be valid positive numbers.');
      return;
    }

    const ingredientData = { 
      name: name.trim(),
      unit, 
      stock: numericStock, 
      lowStockThreshold: numericLowStockThreshold,
    };

    setIsSubmitting(true);
    try {
      if (ingredientToEdit) {
        await updateIngredient({ ...ingredientToEdit, ...ingredientData });
      } else {
        await addIngredient(ingredientData);
      }
      onFormSubmit(); 
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save ingredient. Please try again.');
      console.error("Error saving ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formIsLoading = isContextLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
          {formError}
        </div>
      )}
      <div>
        <label htmlFor="ingredientName" className="block text-sm font-medium text-textPrimary mb-1">
          Ingredient Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="ingredientName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
          required
          aria-required="true"
          disabled={formIsLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="ingredientUnit" className="block text-sm font-medium text-textPrimary mb-1">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            id="ingredientUnit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white transition-colors"
            required
            aria-required="true"
            disabled={formIsLoading}
          >
            {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ingredientStock" className="block text-sm font-medium text-textPrimary mb-1">
            Current Stock <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="ingredientStock"
            value={stock}
            onChange={(e) => setStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
            min="0"
            step="any"
            required
            aria-required="true"
            disabled={formIsLoading}
          />
        </div>
        <div>
          <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-textPrimary mb-1">
            Low Stock Threshold <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="lowStockThreshold"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
            min="0"
            step="any"
            required
            aria-required="true"
            disabled={formIsLoading}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onFormSubmit}
          className="px-6 py-2 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100 transition-colors"
          disabled={formIsLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center"
          disabled={formIsLoading}
        >
          {formIsLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
          {ingredientToEdit ? 'Save Changes' : 'Add Ingredient'}
        </button>
      </div>
    </form>
  );
};
