import React, { useState, useEffect } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { Category } from '../../types';
import { LoadingSpinner } from '../../components/icons/Icons'; // For loading state

interface CategoryFormProps {
  categoryToEdit?: Category;
  onFormSubmit: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ categoryToEdit, onFormSubmit }) => {
  const { addCategory, updateCategory, isLoading: isContextLoading } = useMenu();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local submitting state

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setDescription(categoryToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Category name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await updateCategory({ ...categoryToEdit, name, description });
      } else {
        await addCategory({ name, description });
      }
      onFormSubmit(); // Close modal or redirect
    } catch (error) {
      // Error is already logged by context, show user feedback
      alert(`Failed to save category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formIsLoading = isContextLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="categoryName" className="block text-sm font-medium text-textPrimary mb-1">
          Category Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="categoryName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
          required
          disabled={formIsLoading}
        />
      </div>
      <div>
        <label htmlFor="categoryDescription" className="block text-sm font-medium text-textPrimary mb-1">
          Description (Optional)
        </label>
        <textarea
          id="categoryDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
          disabled={formIsLoading}
        />
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
          {categoryToEdit ? 'Save Changes' : 'Add Category'}
        </button>
      </div>
    </form>
  );
};
