import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const register = (data) => axios.post(`${API_URL}/auth/register`, data);
export const login = (data) => axios.post(`${API_URL}/auth/login`, data);

export const getChats = (token) => axios.get(`${API_URL}/chats/my`, { headers: { Authorization: `Bearer ${token}` } });
export const createChat = (data, token) => axios.post(`${API_URL}/chats/create`, data, { headers: { Authorization: `Bearer ${token}` } });

export const sendMessage = (data, token) => axios.post(`${API_URL}/messages/send`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getOneToOneMessages = (chatId, token) => axios.get(`${API_URL}/messages/one-to-one/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
export const getGroupMessages = (groupId, token) => axios.get(`${API_URL}/messages/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });

export const addUserToGroup = (data, token) => axios.post(`${API_URL}/chats/group/add`, data, { headers: { Authorization: `Bearer ${token}` } });
export const removeUserFromGroup = (data, token) => axios.post(`${API_URL}/chats/group/remove`, data, { headers: { Authorization: `Bearer ${token}` } });

export const updateProfile = (data, token) => axios.put(`${API_URL}/auth/me`, data, { headers: { Authorization: `Bearer ${token}` } });

// Search users in database
export const searchUsers = (query, token) => axios.get(`${API_URL}/auth/search?q=${query}`, { headers: { Authorization: `Bearer ${token}` } });

// Settings API functions
export const changePassword = (data, token) => axios.put(`${API_URL}/auth/change-password`, data, { headers: { Authorization: `Bearer ${token}` } });
export const toggleTwoFactor = (enabled, token) => axios.put(`${API_URL}/auth/toggle-2fa`, { enabled }, { headers: { Authorization: `Bearer ${token}` } });
export const getLoginHistory = (token) => axios.get(`${API_URL}/auth/login-history`, { headers: { Authorization: `Bearer ${token}` } });
export const getLinkedAccounts = (token) => axios.get(`${API_URL}/auth/linked-accounts`, { headers: { Authorization: `Bearer ${token}` } });
export const linkAccount = (provider, token) => axios.post(`${API_URL}/auth/link-account`, { provider }, { headers: { Authorization: `Bearer ${token}` } });
export const unlinkAccount = (provider, token) => axios.post(`${API_URL}/auth/unlink-account`, { provider }, { headers: { Authorization: `Bearer ${token}` } });

export const getUserProfile = (id, token) => axios.get(`${API_URL}/auth/profile/${id}`, { headers: { Authorization: `Bearer ${token}` } });
