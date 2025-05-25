
import React, { useState } from 'react';
import { CafeIcon } from '../components/icons/Icons';
import { APP_NAME } from '../constants';
import { useUser } from '../contexts/UserContext'; // Import useUser

interface LoginPageProps {
  // onLogin is no longer needed as UserContext handles login state
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const { loginUser, users } = useUser(); // Get loginUser function and users from context
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username);

    if (user && user.passwordHash === password) { // Placeholder: direct password check
      loginUser(user.id); // Call loginUser from context with user's ID
      // Navigation will be handled by App.tsx based on currentUser state
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };
  
  // For demo purposes, list available demo users
  const demoUsers = users.map(u => ({ username: u.username, password: u.passwordHash, role: u.role}));


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-surface p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md transform transition-all hover:scale-105 duration-300">
        <div className="flex flex-col items-center mb-8">
          <CafeIcon className="w-20 h-20 text-primary mb-4" />
          <h1 className="text-4xl font-bold text-primary text-center">{APP_NAME}</h1>
          <p className="text-textSecondary mt-2 text-center">Staff Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-textPrimary mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-colors"
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          >
            Login
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-6 text-center space-y-1">
          <p>Demo credentials (username / password):</p>
          {demoUsers.map(u => (
             <p key={u.username}><strong className="text-textSecondary">{u.username}</strong> / <strong className="text-textSecondary">{u.password}</strong> ({u.role.replace('_', ' ')})</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
