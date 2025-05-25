
import React, { useState } from 'react';
import { IngredientList } from './IngredientList';
import { IngredientForm } from './IngredientForm';
import Modal from '../../components/Modal';
import { PlusIcon, LoadingSpinner, WarningIcon } from '../../components/icons/Icons';
import { Ingredient } from '../../types';
import { useInventory } from '../../contexts/InventoryContext'; // Import useInventory

const InventoryManagementPage: React.FC = () => {
  const { isLoading, error, refreshIngredients } = useInventory(); // Get loading and error states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | undefined>(undefined);

  const handleOpenModal = (ingredient?: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(undefined);
  };

  if (isLoading && !isModalOpen) { // Show full page loader only if not interacting with modal
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12 text-primary" />
        <p className="ml-3 text-lg text-textSecondary">Loading inventory data...</p>
      </div>
    );
  }

  if (error && !isModalOpen) { // Show full page error only if not interacting with modal
    return (
      <div className="container mx-auto p-4 text-center">
        <WarningIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Error Loading Inventory</h2>
        <p className="text-textSecondary mb-4">{error}</p>
        <button
          onClick={() => refreshIngredients()}
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
        <h1 className="text-4xl font-bold text-primary">Inventory Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105"
          aria-label="Add New Ingredient"
          disabled={isLoading} // Disable if context is busy
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add Ingredient
        </button>
      </div>

      {error && isModalOpen && ( // Show error as a dismissible alert if modal is open
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
             <WarningIcon className="w-5 h-5 inline mr-2" /> Error: {error}
          </div>
      )}

      <IngredientList onEditIngredient={handleOpenModal} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
        size="lg" 
      >
        <IngredientForm ingredientToEdit={editingIngredient} onFormSubmit={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default InventoryManagementPage;
