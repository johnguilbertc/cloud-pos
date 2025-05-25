import React, { useState, useMemo } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { MenuItem } from '../../types';
import { EditIcon, TrashIcon, ChevronDownIcon } from '../../components/icons/Icons';
import { DEFAULT_MENU_IMAGE } from '../../constants';

interface MenuItemListProps {
  onEditMenuItem: (menuItem: MenuItem) => void;
}

export const MenuItemList: React.FC<MenuItemListProps> = ({ onEditMenuItem }) => {
  const { menuItems, deleteMenuItem, categories, getCategoryById, isLoading } = useMenu(); // isLoading
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await deleteMenuItem(itemId);
        // Optionally, add a success notification
      } catch (error) {
        alert(`Failed to delete menu item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const filteredMenuItems = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return menuItems;
    }
    return menuItems.filter(item => item.categoryId === selectedCategoryId);
  }, [menuItems, selectedCategoryId]);

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-textPrimary">Menu Items</h2>
        <div className="relative">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-300 text-textPrimary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8"
            disabled={isLoading}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDownIcon className="w-5 h-5 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {filteredMenuItems.length === 0 && !isLoading ? (
        <p className="text-textSecondary">
          {selectedCategoryId === 'all' ? 'No menu items found. Add some items to your menu.' : `No menu items found in ${getCategoryById(selectedCategoryId)?.name || 'this category'}.`}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredMenuItems.map((item) => {
            const category = getCategoryById(item.categoryId);
            return (
              <div
                key={item.id}
                className="flex items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img 
                  src={item.imageUrl || DEFAULT_MENU_IMAGE} 
                  alt={item.name} 
                  className="w-24 h-24 object-cover rounded-md mr-4"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-primary">{item.name}</h3>
                      {category && <span className="text-xs bg-accent text-primary font-medium px-2 py-0.5 rounded-full">{category.name}</span>}
                    </div>
                    <span className={`text-lg font-semibold ${item.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                      ₱{item.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary mt-1 mb-2 break-words">{item.description}</p>
                  <p className={`text-xs font-medium ${item.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onEditMenuItem(item)}
                    className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-yellow-100"
                    title="Edit Menu Item"
                    disabled={isLoading}
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100"
                    title="Delete Menu Item"
                    disabled={isLoading}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
