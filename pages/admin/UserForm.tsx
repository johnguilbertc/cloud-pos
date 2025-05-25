
import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useMenu } from '../../contexts/MenuContext'; // For fetching categories
import { User, UserRole, Category } from '../../types';

interface UserFormProps {
  userToEdit?: User;
  onFormSubmit: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ userToEdit, onFormSubmit }) => {
  const { addUser, updateUser, users: existingUsers, currentUser } = useUser();
  const { categories } = useMenu();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // For new users or password change
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER);
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState<string | null>(null);


  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setRole(userToEdit.role);
      setAssignedCategoryIds(userToEdit.assignedCategoryIds || []);
      setPassword(''); // Clear password fields when editing
      setConfirmPassword('');
    } else {
      // Reset form for new user
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setRole(UserRole.CASHIER);
      setAssignedCategoryIds([]);
    }
    setUsernameError(null);
  }, [userToEdit]);

  const handleCategoryAssignmentChange = (categoryId: string) => {
    setAssignedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);

    if (!username.trim()) {
      alert('Username is required.');
      return;
    }

    // Username uniqueness check
    const usernameExists = existingUsers.some(
        (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== userToEdit?.id
    );
    if (usernameExists) {
        setUsernameError('This username is already taken. Please choose another.');
        return;
    }


    if (userToEdit) { // Editing existing user
      if (password && password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      const updatedUserData: User = {
        ...userToEdit,
        username: username.trim(),
        role,
        assignedCategoryIds: role === UserRole.KITCHEN_STAFF ? assignedCategoryIds : [],
      };
      if (password) { // Only update passwordHash if a new password is provided
        updatedUserData.passwordHash = password; // In real app, hash this
      }
      updateUser(updatedUserData);
    } else { // Adding new user
      if (!password) {
        alert('Password is required for new users.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
      addUser({ 
        username: username.trim(), 
        passwordHash: password, // In real app, hash this
        role,
        assignedCategoryIds: role === UserRole.KITCHEN_STAFF ? assignedCategoryIds : [],
      });
    }
    onFormSubmit(); // Close modal
  };

  const canChangeRole = !(userToEdit && userToEdit.id === currentUser?.id && userToEdit.role === UserRole.SUPER_ADMIN && existingUsers.filter(u => u.role === UserRole.SUPER_ADMIN).length === 1);


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-textPrimary mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setUsernameError(null);}}
          className={`w-full px-4 py-3 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors`}
          required
          aria-required="true"
        />
        {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
          Password {userToEdit ? '(Leave blank to keep current)' : <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
          autoComplete="new-password"
          required={!userToEdit}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary mb-1">
          Confirm Password {userToEdit && !password ? '' : <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
          autoComplete="new-password"
          required={!userToEdit || !!password} // Required if new user OR if password field is filled for existing user
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-textPrimary mb-1">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white transition-colors"
          required
          disabled={!canChangeRole}
        >
          {Object.values(UserRole).map(r => (
            <option key={r} value={r}>
              {r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </option>
          ))}
        </select>
        {!canChangeRole && <p className="text-xs text-amber-600 mt-1">Cannot change role of the only Super Admin.</p>}
      </div>

      {role === UserRole.KITCHEN_STAFF && (
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            Assigned Menu Categories (for KDS view)
          </label>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedCategoryIds.includes(cat.id)}
                    onChange={() => handleCategoryAssignmentChange(cat.id)}
                    className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-textSecondary">{cat.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textSecondary">No menu categories available to assign. Please create categories first.</p>
          )}
        </div>
      )}


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
          className="px-6 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          {userToEdit ? 'Save Changes' : 'Add User'}
        </button>
      </div>
    </form>
  );
};
