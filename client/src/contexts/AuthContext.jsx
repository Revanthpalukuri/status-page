import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, handleApiError } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        // Verify token is still valid
        const response = await authAPI.getProfile();
        const userData = response.data.data.user;
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    
    setIsLoading(false);
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      const { user: userData, token } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
      return { success: false, error: errorInfo };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      const { user: newUser, token } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
      return { success: false, error: errorInfo };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data.user;
      
      // Update state and storage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
      return { success: false, error: errorInfo };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data.data;
      
      localStorage.setItem('token', token);
      return { success: true };
    } catch (error) {
      // If refresh fails, log out
      logout();
      return { success: false };
    }
  };

  // Check if user has access to organization
  const hasOrganizationAccess = (organizationId) => {
    if (!user) return false;
    
    // Check if user owns the organization
    const ownsOrganization = user.ownedOrganizations?.some(org => org.id === organizationId);
    
    // Check if user is a member
    const isMember = user.memberships?.some(membership => 
      membership.organization.id === organizationId && membership.status === 'active'
    );
    
    return ownsOrganization || isMember;
  };

  // Get user's role in organization
  const getOrganizationRole = (organizationId) => {
    if (!user) return null;
    
    // Check if user owns the organization
    const ownsOrganization = user.ownedOrganizations?.some(org => org.id === organizationId);
    if (ownsOrganization) return 'admin';
    
    // Check membership role
    const membership = user.memberships?.find(membership => 
      membership.organization.id === organizationId && membership.status === 'active'
    );
    
    return membership?.role || null;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    hasOrganizationAccess,
    getOrganizationRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
