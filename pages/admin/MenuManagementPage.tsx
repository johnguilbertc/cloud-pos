import React, { useState, useEffect } from 'react';
import { CategoryList } from './CategoryList';
import { MenuItemList } from './MenuItemList';
import { CategoryForm } from './CategoryForm';
import { MenuItemForm } from './MenuItemForm';
import Modal from '../../components/Modal';
import { PlusIcon, LoadingSpinner, WarningIcon } from '../../components/icons/Icons'; // Added LoadingSpinner, WarningIcon
import { Category, MenuItem } from '../../types';
import { useMenu } from '../../contexts/MenuContext'; // Import useMenu to access loading/error states

const MenuManagementPage: React.FC = () => {
  const { isLoading, error, refreshMenuData } = useMenu(); // Get loading and error states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | undefined>(undefined);

  const handleOpenCategoryModal = (category?: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(undefined);
    // Consider refreshing data if an add/edit might have occurred.
    // Or, context can update its state internally, making this optional.
    // refreshMenuData(); 
  };

  const handleOpenMenuItemModal = (menuItem?: MenuItem) => {
    setEditingMenuItem(menuItem);
    setIsMenuItemModalOpen(true);
  };

  const handleCloseMenuItemModal = () => {
    setIsMenuItemModalOpen(false);
    setEditingMenuItem(undefined);
    // refreshMenuData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12 text-primary" />
        <p className="ml-3 text-lg text-textSecondary">Loading menu data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <WarningIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Error Loading Menu Data</h2>
        <p className="text-textSecondary mb-4">{error}</p>
        <button
          onClick={() => refreshMenuData()}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold text-primary">Menu Management</h1>
        <div className="space-x-3">
          <button
            onClick={() => handleOpenCategoryModal()}
            className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add Category
          </button>
          <button
            onClick={() => handleOpenMenuItemModal()}
            className="bg-secondary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add Menu Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CategoryList onEditCategory={handleOpenCategoryModal} />
        </div>
        <div className="lg:col-span-2">
          <MenuItemList onEditMenuItem={handleOpenMenuItemModal} />
        </div>
      </div>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <CategoryForm categoryToEdit={editingCategory} onFormSubmit={handleCloseCategoryModal} />
      </Modal>

      <Modal
        isOpen={isMenuItemModalOpen}
        onClose={handleCloseMenuItemModal}
        title={editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        size="xl"
      >
        <MenuItemForm menuItemToEdit={editingMenuItem} onFormSubmit={handleCloseMenuItemModal} />
      </Modal>
    </div>
  );
};

export default MenuManagementPage;
