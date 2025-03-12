import React, { createContext, useContext } from 'react';

// Create a mock Auth Context
const AuthContext = createContext();

// Mock user data
const mockUser = {
  uid: 'mock-user-id',
  email: 'mock@example.com',
  displayName: 'Mock User',
};

// Auth Provider component
export function AuthProvider({ children }) {
  // Mock auth state and functions
  const value = {
    currentUser: mockUser,
    login: () => Promise.resolve(mockUser),
    logout: () => Promise.resolve(),
    signup: () => Promise.resolve(mockUser),
    resetPassword: () => Promise.resolve(),
    updateEmail: () => Promise.resolve(),
    updatePassword: () => Promise.resolve(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext; 