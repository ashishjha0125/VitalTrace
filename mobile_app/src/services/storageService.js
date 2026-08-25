import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';
const API_KEY_KEY = '@grok_api_key';

export const storageService = {
  // Save or Update a user profile
  saveUser: async (userData) => {
    try {
      const usersStr = await AsyncStorage.getItem(USERS_KEY);
      let users = usersStr ? JSON.parse(usersStr) : [];
      
      const existingIndex = users.findIndex(u => u.name.toLowerCase() === userData.name.toLowerCase());
      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...userData };
      } else {
        users.push({ ...userData, id: Date.now().toString() });
      }
      
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      console.error('Failed to save user', e);
      return false;
    }
  },

  // Login a user
  loginUser: async (name) => {
    try {
      const usersStr = await AsyncStorage.getItem(USERS_KEY);
      if (!usersStr) return null;
      
      const users = JSON.parse(usersStr);
      const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
      
      if (user) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (e) {
      console.error('Failed to login', e);
      return null;
    }
  },

  // Logout current user
  logoutUser: async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.error('Failed to logout', e);
    }
  },

  // Get current logged in user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Failed to get current user', e);
      return null;
    }
  },

  // Update current user
  updateCurrentUser: async (updates) => {
    try {
      const user = await storageService.getCurrentUser();
      if (user) {
        const updatedUser = { ...user, ...updates };
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
        await storageService.saveUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (e) {
      console.error('Failed to update current user', e);
      return null;
    }
  },

  // API Key Management
  saveApiKey: async (key) => {
    try {
      await AsyncStorage.setItem(API_KEY_KEY, key);
    } catch (e) {
      console.error('Failed to save API key', e);
    }
  },

  getApiKey: async () => {
    try {
      return await AsyncStorage.getItem(API_KEY_KEY);
    } catch (e) {
      console.error('Failed to get API key', e);
      return null;
    }
  }
};
