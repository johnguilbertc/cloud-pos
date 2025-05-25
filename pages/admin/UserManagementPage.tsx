
import React, { useState } from 'react';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons/Icons';
import { User } from '../../types';

const UserManagementPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const handleOpenModal = (user?: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(undefined);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-4xl font-bold text-primary">User Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition-transform transform hover:scale-105"
          aria-label="Add New User"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Add User
        </button>
      </div>

      <UserList onEditUser={handleOpenModal} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="lg" 
      >
        <UserForm userToEdit={editingUser} onFormSubmit={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default UserManagementPage;
