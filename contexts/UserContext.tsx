
import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { defaultUsers } from '../data/defaultData'; // Import default users

interface UserContextType {
  users: User[];
  currentUser: User | null;
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  loginUser: (userId: string) => void; // Sets currentUser by ID
  logoutUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('users', defaultUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);

  const addUser = useCallback((userData: Omit<User, 'id'>): User => {
    // In a real app, password should be hashed here before saving
    const newUser: User = { ...userData, id: uuidv4() };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  }, [setUsers]);

  const updateUser = useCallback((updatedUser: User) => {
    // Password handling: if password field is empty, don't update it.
    // If provided, it should be re-hashed. For this demo, we just assign.
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
  }, [setUsers]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    if (currentUser?.id === userId) {
      setCurrentUser(null); // Log out if deleting self
    }
  }, [setUsers, currentUser, setCurrentUser]);

  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);

  const loginUser = useCallback((userId: string) => {
    const userToLogin = users.find(user => user.id === userId);
    if (userToLogin) {
      setCurrentUser(userToLogin);
    } else {
      console.error(`Login failed: User with ID ${userId} not found.`);
      setCurrentUser(null);
    }
  }, [users, setCurrentUser]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  return (
    <UserContext.Provider value={{ 
      users, 
      currentUser,
      addUser, 
      updateUser, 
      deleteUser, 
      getUserById,
      loginUser,
      logoutUser,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
