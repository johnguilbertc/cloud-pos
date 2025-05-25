
import React, { useState, useEffect, useCallback } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useRecipe } from '../../contexts/RecipeContext';
import { MenuItem, RecipeItem as RecipeItemType, Ingredient, MenuItemModifierGroup, MenuItemModifierOption } from '../../types';
import { generateDescriptionWithGemini } from '../../services/geminiService';
import { SparklesIcon, LoadingSpinner, PlusIcon, TrashIcon, RecipeIcon as RecipeFormIcon, EditIcon, SquareIcon, CheckSquareIcon, CogIcon } from '../../components/icons/Icons'; // Added CogIcon
import { v4 as uuidv4 } from 'uuid';

interface MenuItemFormProps {
  menuItemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

interface RecipeItemFormState extends RecipeItemType {
  localId: string;
}

// Fix: Ensure the component returns JSX and completes the useEffect and handlers.
export const MenuItemForm: React.FC<MenuItemFormProps> = ({ menuItemToEdit, onFormSubmit }) => {
  const { categories, addMenuItem, updateMenuItem, getCategoryById, isLoading: isMenuContextLoading } = useMenu();
  const { ingredients, getIngredientById } = useInventory();
  const { addRecipe, updateRecipe, getRecipeByMenuItemId, deleteRecipe } = useRecipe();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [recipeItems, setRecipeItems] = useState<RecipeItemFormState[]>([]);
  const [showRecipeSection, setShowRecipeSection] = useState(false);

  const [modifierGroups, setModifierGroups] = useState<MenuItemModifierGroup[]>([]);
  const [showModifierSection, setShowModifierSection] = useState(false);

  useEffect(() => {
    if (menuItemToEdit) {
      setName(menuItemToEdit.name);
      setDescription(menuItemToEdit.description);
      setPrice(menuItemToEdit.price);
      setCategoryId(menuItemToEdit.categoryId);
      setImageUrl(menuItemToEdit.imageUrl || '');
      setIsAvailable(menuItemToEdit.isAvailable);
      
      const existingRecipe = getRecipeByMenuItemId(menuItemToEdit.id);
      if (existingRecipe) {
        setRecipeItems(existingRecipe.items.map(item => ({ ...item, localId: uuidv4() })));
        setShowRecipeSection(true);
      } else {
        setRecipeItems([]);
        setShowRecipeSection(false);
      }

      setModifierGroups(menuItemToEdit.modifierGroups ? JSON.parse(JSON.stringify(menuItemToEdit.modifierGroups)) : []);
      setShowModifierSection(!!menuItemToEdit.modifierGroups && menuItemToEdit.modifierGroups.length > 0);

    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setImageUrl('');
      setIsAvailable(true);
      setRecipeItems([]);
      setShowRecipeSection(false);
      setModifierGroups([]);
      setShowModifierSection(false);
    }
    setGeminiError(null);
  }, [menuItemToEdit, categories, getRecipeByMenuItemId]);


  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      alert('Please enter an item name first to generate a description.');
      return;
    }
    setIsGeneratingDesc(true);
    setGeminiError(null);
    try {
      const currentCategoryName = categoryId ? getCategoryById(categoryId)?.name : undefined;
      const currentPrice = typeof price === 'number' ? price : undefined;
      const generatedDesc = await generateDescriptionWithGemini(name, currentCategoryName, currentPrice);
      setDescription(generatedDesc);
    } catch (e) {
      console.error("Error generating description:", e);
      setGeminiError(e instanceof Error ? e.message : "Failed to generate description.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleAddRecipeItem = () => {
    setRecipeItems(prev => [...prev, { localId: uuidv4(), ingredientId: '', quantity: 0 }]);
  };

  const handleRecipeItemChange = (localId: string, field: keyof RecipeItemType, value: string | number) => {
    setRecipeItems(prev => prev.map(item => 
      item.localId === localId ? { ...item, [field]: field === 'quantity' ? (Number(value) >= 0 ? Number(value) : 0) : value } : item
    ));
  };

  const handleRemoveRecipeItem = (localId: string) => {
    setRecipeItems(prev => prev.filter(item => item.localId !== localId));
  };

  // Modifier Group Handlers
  const handleAddModifierGroup = () => {
    setModifierGroups(prev => [...prev, { id: uuidv4(), name: '', selectionType: 'single', options: [] }]);
  };

  const handleModifierGroupChange = (groupId: string, field: keyof Pick<MenuItemModifierGroup, 'name' | 'selectionType'>, value: string) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, [field]: value } : group
    ));
  };

  const handleRemoveModifierGroup = (groupId: string) => {
    setModifierGroups(prev => prev.filter(group => group.id !== groupId));
  };

  // Modifier Option Handlers
  const handleAddModifierOption = (groupId: string) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, options: [...group.options, { id: uuidv4(), name: '', priceChange: 0 }] } : group
    ));
  };

  const handleModifierOptionChange = (groupId: string, optionId: string, field: keyof MenuItemModifierOption, value: string | number) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId ? { 
        ...group, 
        options: group.options.map(opt => 
          opt.id === optionId ? { ...opt, [field]: field === 'priceChange' ? Number(value) : value } : opt
        ) 
      } : group
    ));
  };

  const handleRemoveModifierOption = (groupId: string, optionId: string) => {
    setModifierGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, options: group.options.filter(opt => opt.id !== optionId) } : group
    ));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || !categoryId) {
      alert('Name, Price, and Category are required.');
      return;
    }
    setIsSubmitting(true);

    const menuItemData: Omit<MenuItem, 'id'> & { id?: string } = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      categoryId,
      imageUrl: imageUrl.trim() || undefined,
      isAvailable,
      modifierGroups: modifierGroups.filter(mg => mg.name.trim() && mg.options.length > 0 && mg.options.every(opt => opt.name.trim())) // Filter out empty/invalid groups/options
    };

    try {
      let savedMenuItem: MenuItem | undefined;
      if (menuItemToEdit) {
        await updateMenuItem({ ...menuItemData, id: menuItemToEdit.id });
        savedMenuItem = { ...menuItemData, id: menuItemToEdit.id };
      } else {
        savedMenuItem = await addMenuItem(menuItemData);
      }

      if (savedMenuItem) {
        const finalRecipeItems: RecipeItemType[] = recipeItems
          .filter(item => item.ingredientId && item.quantity > 0)
          .map(({ localId, ...rest }) => rest);

        const existingRecipe = getRecipeByMenuItemId(savedMenuItem.id);
        if (showRecipeSection && finalRecipeItems.length > 0) {
          if (existingRecipe) {
            updateRecipe({ ...existingRecipe, items: finalRecipeItems });
          } else {
            addRecipe({ items: finalRecipeItems }, savedMenuItem.id);
          }
        } else if (existingRecipe && (!showRecipeSection || finalRecipeItems.length === 0)) {
          deleteRecipe(existingRecipe.id);
        }
      }
      onFormSubmit();
    } catch (error) {
      alert(`Failed to save menu item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formIsLoading = isMenuContextLoading || isSubmitting || isGeneratingDesc;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Item Details */}
      <div>
        <label htmlFor="itemName" className="block text-sm font-medium text-textPrimary mb-1">
          Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text" id="itemName" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
          required disabled={formIsLoading}
        />
      </div>
      <div>
        <label htmlFor="itemDescription" className="block text-sm font-medium text-textPrimary mb-1">
          Description
        </label>
        <textarea
          id="itemDescription" value={description} onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
          disabled={formIsLoading}
        />
        <button
          type="button" onClick={handleGenerateDescription}
          disabled={formIsLoading || !name.trim()}
          className="mt-2 px-3 py-1.5 text-xs bg-accent hover:bg-opacity-80 text-primary font-semibold rounded-md shadow-sm flex items-center disabled:opacity-60"
        >
          {isGeneratingDesc ? <LoadingSpinner className="w-4 h-4 mr-1.5" /> : <SparklesIcon className="w-4 h-4 mr-1.5" />}
          Generate with AI
        </button>
        {geminiError && <p className="text-xs text-red-500 mt-1">{geminiError}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="itemPrice" className="block text-sm font-medium text-textPrimary mb-1">
            Price (₱) <span className="text-red-500">*</span>
          </label>
          <input
            type="number" id="itemPrice" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
            min="0" step="0.01" required disabled={formIsLoading}
          />
        </div>
        <div>
          <label htmlFor="itemCategory" className="block text-sm font-medium text-textPrimary mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="itemCategory" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white"
            required disabled={formIsLoading || categories.length === 0}
          >
            <option value="" disabled>Select Category</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
           {categories.length === 0 && <p className="text-xs text-amber-600 mt-1">No categories available. Please add categories first.</p>}
        </div>
      </div>
      <div>
        <label htmlFor="itemImageUrl" className="block text-sm font-medium text-textPrimary mb-1">
          Image URL (Optional)
        </label>
        <input
          type="url" id="itemImageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
          placeholder="https://example.com/image.jpg"
          disabled={formIsLoading}
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox" id="isAvailable" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)}
          className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary mr-2"
          disabled={formIsLoading}
        />
        <label htmlFor="isAvailable" className="text-sm font-medium text-textPrimary">
          Item is Available
        </label>
      </div>

      {/* Recipe Section Toggle */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowRecipeSection(!showRecipeSection)}
          className="flex items-center text-primary hover:underline font-medium text-sm"
        >
          {showRecipeSection ? <CheckSquareIcon className="w-5 h-5 mr-2" /> : <SquareIcon className="w-5 h-5 mr-2" />}
          {showRecipeSection ? 'Hide Recipe Details' : 'Add/Edit Recipe Details'} 
          <RecipeFormIcon className="w-5 h-5 ml-1.5 opacity-70" />
        </button>
      </div>

      {/* Recipe Section */}
      {showRecipeSection && (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="text-lg font-semibold text-textPrimary">Recipe Ingredients</h3>
          {ingredients.length === 0 && <p className="text-sm text-amber-600">No ingredients in inventory. Add ingredients via Inventory Management to create recipes.</p>}
          {recipeItems.map((item, index) => (
            <div key={item.localId} className="grid grid-cols-12 gap-3 items-end p-2 border-b border-gray-100">
              <div className="col-span-7">
                {index === 0 && <label className="block text-xs font-medium text-textSecondary mb-0.5">Ingredient</label>}
                <select
                  value={item.ingredientId}
                  onChange={(e) => handleRecipeItemChange(item.localId, 'ingredientId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white text-sm"
                  required={showRecipeSection} disabled={formIsLoading || ingredients.length === 0}
                >
                  <option value="" disabled>Select Ingredient</option>
                  {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                 {index === 0 && <label className="block text-xs font-medium text-textSecondary mb-0.5">Quantity <span className="text-gray-400 text-[0.65rem]">({getIngredientById(item.ingredientId)?.unit || 'unit'})</span></label>}
                <input
                  type="number" value={item.quantity}
                  onChange={(e) => handleRecipeItemChange(item.localId, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                  min="0.001" step="any" required={showRecipeSection} disabled={formIsLoading || ingredients.length === 0}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="button" onClick={() => handleRemoveRecipeItem(item.localId)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100" disabled={formIsLoading}
                > <TrashIcon className="w-4 h-4" /> </button>
              </div>
            </div>
          ))}
          <button
            type="button" onClick={handleAddRecipeItem}
            className="mt-2 px-3 py-1.5 text-xs bg-secondary hover:bg-opacity-80 text-white font-semibold rounded-md shadow-sm flex items-center disabled:opacity-60"
            disabled={formIsLoading || ingredients.length === 0}
          > <PlusIcon className="w-4 h-4 mr-1.5" /> Add Ingredient to Recipe </button>
        </div>
      )}

      {/* Modifier Section Toggle */}
       <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowModifierSection(!showModifierSection)}
          className="flex items-center text-primary hover:underline font-medium text-sm"
        >
          {showModifierSection ? <CheckSquareIcon className="w-5 h-5 mr-2" /> : <SquareIcon className="w-5 h-5 mr-2" />}
          {showModifierSection ? 'Hide Item Modifiers' : 'Add/Edit Item Modifiers'}
          <CogIcon className="w-5 h-5 ml-1.5 opacity-70" />
        </button>
      </div>

      {/* Modifier Section */}
      {showModifierSection && (
        <div className="space-y-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <h3 className="text-lg font-semibold text-textPrimary">Item Modifiers</h3>
            {modifierGroups.map((group, groupIndex) => (
                <div key={group.id} className="p-4 border border-gray-300 rounded-lg bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-md font-semibold text-secondary">Modifier Group #{groupIndex + 1}</h4>
                        <button type="button" onClick={() => handleRemoveModifierGroup(group.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100" disabled={formIsLoading}>
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`mg-name-${group.id}`} className="block text-xs font-medium text-textPrimary mb-0.5">Group Name</label>
                            <input type="text" id={`mg-name-${group.id}`} value={group.name}
                                onChange={(e) => handleModifierGroupChange(group.id, 'name', e.target.value)}
                                placeholder="e.g., Size, Milk Options"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={formIsLoading} required={showModifierSection} />
                        </div>
                        <div>
                            <label htmlFor={`mg-type-${group.id}`} className="block text-xs font-medium text-textPrimary mb-0.5">Selection Type</label>
                            <select id={`mg-type-${group.id}`} value={group.selectionType}
                                onChange={(e) => handleModifierGroupChange(group.id, 'selectionType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" disabled={formIsLoading}>
                                <option value="single">Single Choice</option>
                                <option value="multiple">Multiple Choice</option>
                            </select>
                        </div>
                    </div>
                    <h5 className="text-sm font-medium text-textPrimary pt-2 border-t border-gray-100">Options for this Group:</h5>
                    {group.options.map((option, optionIndex) => (
                        <div key={option.id} className="grid grid-cols-12 gap-2 items-center pl-2 border-l-2 border-secondary/30 py-1">
                            <div className="col-span-6">
                                {optionIndex === 0 && <label className="block text-xs font-medium text-textSecondary mb-0.5">Option Name</label>}
                                <input type="text" value={option.name} placeholder="e.g., Large, Soy Milk"
                                    onChange={(e) => handleModifierOptionChange(group.id, option.id, 'name', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm" disabled={formIsLoading} required={showModifierSection} />
                            </div>
                            <div className="col-span-4">
                                {optionIndex === 0 && <label className="block text-xs font-medium text-textSecondary mb-0.5">Price Change (₱)</label>}
                                <input type="number" value={option.priceChange} step="any"
                                    onChange={(e) => handleModifierOptionChange(group.id, option.id, 'priceChange', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm" disabled={formIsLoading} />
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button type="button" onClick={() => handleRemoveModifierOption(group.id, option.id)}
                                    className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50" disabled={formIsLoading}>
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddModifierOption(group.id)}
                        className="mt-1 px-2.5 py-1 text-xs bg-secondary/80 hover:bg-secondary text-white font-medium rounded-md flex items-center disabled:opacity-60"
                        disabled={formIsLoading}>
                        <PlusIcon className="w-3 h-3 mr-1" /> Add Option
                    </button>
                </div>
            ))}
             <button type="button" onClick={handleAddModifierGroup}
                className="mt-3 px-3 py-1.5 text-sm bg-primary hover:bg-opacity-90 text-white font-semibold rounded-md shadow-sm flex items-center disabled:opacity-60"
                disabled={formIsLoading}>
                <PlusIcon className="w-4 h-4 mr-1.5" /> Add Modifier Group
            </button>
        </div>
      )}


      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button" onClick={onFormSubmit}
          className="px-6 py-2 border border-gray-300 rounded-lg text-textPrimary hover:bg-gray-100"
          disabled={formIsLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg shadow-md flex items-center justify-center"
          disabled={formIsLoading || (categories.length === 0 && !menuItemToEdit)}
        >
          {formIsLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
          {menuItemToEdit ? 'Save Changes' : 'Add Menu Item'}
        </button>
      </div>
    </form>
  );
};
