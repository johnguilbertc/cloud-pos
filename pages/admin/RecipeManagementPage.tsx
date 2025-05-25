import React, { useState, useMemo } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { useRecipe } from '../../contexts/RecipeContext';
import { useInventory } from '../../contexts/InventoryContext';
import { MenuItem } from '../../types'; // Recipe type no longer needed here for form
import { RecipeIcon as PageRecipeIcon, ChevronDownIcon, EditIcon } from '../../components/icons/Icons';
import { NavLink } from 'react-router-dom';
import { DEFAULT_MENU_IMAGE, APP_ROUTES } from '../../constants';

const RecipeManagementPage: React.FC = () => {
  const { menuItems, categories, getCategoryById } = useMenu();
  const { ingredients } = useInventory(); // Still need for context on ingredient availability
  const { recipes, getRecipeByMenuItemId } = useRecipe();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryIdFilter, setSelectedCategoryIdFilter] = useState<string | 'all'>('all');

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => 
        selectedCategoryIdFilter === 'all' || item.categoryId === selectedCategoryIdFilter
      )
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [menuItems, selectedCategoryIdFilter, searchTerm]);


  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300 gap-4">
        <h1 className="text-4xl font-bold text-primary">Recipe Overview</h1>
         <div className="w-full sm:w-auto p-3 bg-blue-50 border border-blue-200 rounded-md text-center sm:text-left">
            <p className="text-sm text-blue-700 font-medium">
                To add or edit recipes, please go to the <NavLink to={APP_ROUTES.ADMIN_MENU_MANAGEMENT} className="underline hover:text-blue-900">Menu Management</NavLink> section and edit the individual menu item.
            </p>
        </div>
      </div>
      
      {menuItems.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input 
                type="text"
                placeholder="Search menu items..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search menu items"
            />
            <div className="relative sm:min-w-[200px]">
                <select
                    value={selectedCategoryIdFilter}
                    onChange={(e) => setSelectedCategoryIdFilter(e.target.value)}
                    className="appearance-none w-full bg-white border border-gray-300 text-textPrimary text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 pr-8"
                    aria-label="Filter by category"
                >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-gray-500 absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
      )}

      {menuItems.length === 0 ? (
         <div className="text-center py-10">
          <PageRecipeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Menu Items Exist</h2>
          <p className="text-textSecondary">
            Please <NavLink to={APP_ROUTES.ADMIN_MENU_MANAGEMENT} className="underline hover:text-primary">add menu items</NavLink> first to see their recipe status here.
          </p>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-10">
            <PageRecipeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-textPrimary mb-2">No Ingredients in Inventory</h2>
            <p className="text-textSecondary">
                Recipes require ingredients. Please <NavLink to={APP_ROUTES.ADMIN_INVENTORY} className="underline hover:text-primary">add ingredients to your inventory</NavLink>.
            </p>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="text-center py-10">
          <PageRecipeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">No Matching Menu Items</h2>
          <p className="text-textSecondary">
            Try adjusting your search term or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item) => {
            const recipe = getRecipeByMenuItemId(item.id);
            const category = getCategoryById(item.categoryId);
            return (
              <div key={item.id} className="bg-surface rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl">
                <img 
                    src={item.imageUrl || DEFAULT_MENU_IMAGE} 
                    alt={item.name}
                    className="w-full h-48 object-cover"
                />
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-primary mb-1">{item.name}</h3>
                  {category && <p className="text-xs text-textSecondary mb-2 font-medium bg-accent text-primary px-2 py-0.5 rounded-full inline-block">{category.name}</p>}
                  
                  <div className="my-3 border-t border-gray-200"></div>

                  {recipe ? (
                    <div className="space-y-2 mb-4 flex-grow">
                      <p className="text-sm text-green-600 font-semibold flex items-center">
                        <PageRecipeIcon className="w-5 h-5 mr-2 text-green-500" /> Recipe Added ({recipe.items.length} ingredients)
                      </p>
                      <ul className="list-disc list-inside text-xs text-textSecondary pl-4 max-h-24 overflow-y-auto custom-scrollbar">
                        {recipe.items.map(ri => {
                           const ingredientDetails = ingredients.find(i => i.id === ri.ingredientId);
                           return ingredientDetails ? (
                            <li key={ri.ingredientId} className="truncate">
                                {ingredientDetails.name}: {ri.quantity} {ingredientDetails.unit && typeof ingredientDetails.unit === 'string' ? ingredientDetails.unit.split(' ')[0] : ''}
                            </li>
                           ) : null;
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4 flex-grow">
                      <p className="text-sm text-amber-600 font-semibold flex items-center">
                        <PageRecipeIcon className="w-5 h-5 mr-2 text-amber-500" /> No Recipe Defined
                      </p>
                      <p className="text-xs text-textSecondary">Add ingredients via Menu Management.</p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-2 border-t border-gray-100">
                    <NavLink 
                        to={APP_ROUTES.ADMIN_MENU_MANAGEMENT} 
                        state={{ editMenuItemId: item.id }} // Pass state to open modal for this item
                        className="w-full block text-center bg-secondary hover:bg-opacity-90 text-white font-medium py-2 px-3 rounded-md shadow-sm flex items-center justify-center transition-colors"
                        title={`Edit ${item.name} and its recipe`}
                    >
                        <EditIcon className="w-4 h-4 mr-1.5" /> View/Edit in Menu Management
                    </NavLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecipeManagementPage;