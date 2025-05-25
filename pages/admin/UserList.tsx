
import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useMenu } from '../../contexts/MenuContext'; // To get category names
import { User, UserRole } from '../../types';
import { EditIcon, TrashIcon, UsersIcon } from '../../components/icons/Icons';

interface UserListProps {
  onEditUser: (user: User) => void;
}

const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.BRANCH_ADMIN]: 'Branch Admin',
  [UserRole.CASHIER]: 'Cashier',
  [UserRole.KITCHEN_STAFF]: 'Kitchen Staff',
};

export const UserList: React.FC<UserListProps> = ({ onEditUser }) => {
  const { users, deleteUser, currentUser } = useUser();
  const { getCategoryById } = useMenu();

  const handleDelete = (userId: string, username: string) => {
    if (currentUser?.id === userId) {
        alert("You cannot delete your own account while logged in.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
      deleteUser(userId);
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
        <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-textPrimary mb-4">No Users Found</h2>
        <p className="text-textSecondary">Add users to manage access to the system.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-textPrimary mb-6">User Accounts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Assigned Categories (Kitchen)</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const assignedCategoriesDisplay = user.role === UserRole.KITCHEN_STAFF && user.assignedCategoryIds && user.assignedCategoryIds.length > 0
                ? user.assignedCategoryIds.map(id => getCategoryById(id)?.name || 'Unknown Category').join(', ')
                : 'N/A';

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-textPrimary">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === UserRole.SUPER_ADMIN ? 'bg-red-100 text-red-800' :
                        user.role === UserRole.BRANCH_ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.CASHIER ? 'bg-blue-100 text-blue-800' :
                        user.role === UserRole.KITCHEN_STAFF ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {roleDisplayNames[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                    {assignedCategoriesDisplay}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-yellow-100 mr-2"
                      title={`Edit ${user.username}`}
                      aria-label={`Edit ${user.username}`}
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={currentUser?.id === user.id}
                      className={`text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-100 ${currentUser?.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={currentUser?.id === user.id ? "Cannot delete self" :`Delete ${user.username}`}
                      aria-label={`Delete ${user.username}`}
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
