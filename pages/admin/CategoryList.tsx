import React from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { Category } from '../../types';
import { EditIcon, TrashIcon } from '../../components/icons/Icons';

interface CategoryListProps {
  onEditCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ onEditCategory }) => {
  const { categories, deleteCategory, isLoading } = useMenu(); // isLoading can be used for UI feedback

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all associated menu items.')) {
      try {
        await deleteCategory(categoryId);
        // Optionally, add a success notification
      } catch (error) {
        // Error is already handled and logged in context, but can show specific UI error here
        alert(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-textPrimary mb-6">Categories</h2>
      {categories.length === 0 && !isLoading ? (
        <p className="text-textSecondary">No categories found. Add a new category to get started.</p>
      ) : (
        <ul className="space-y-4">
          {categories.map((category) => (
            <li
              key={category.id}
              className="p-4 bg-gray-50 rounded-lg shadow-sm flex justify-between items-center transition-all hover:shadow-md"
            >
              <div>
                <h3 className="text-lg font-medium text-primary">{category.name}</h3>
                {category.description && <p className="text-sm text-textSecondary mt-1">{category.description}</p>}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => onEditCategory(category)}
                  className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-yellow-100"
                  title="Edit Category"
                  disabled={isLoading}
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                  title="Delete Category"
                  disabled={isLoading}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
