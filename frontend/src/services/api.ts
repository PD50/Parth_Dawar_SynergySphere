import axios from 'axios';
import { useAuthStore } from '../hooks/useAuth';

// Set base URL - check if we're in development or production
// In a real setup, you'd get this from environment variables
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.motion-gpt.com' 
  : 'http://localhost:5000';

console.log('[API] Using API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authApi = {
  // Handle Google OAuth callback - Now uses the store directly
  handleCallback: async (token: string) => {
    const login = useAuthStore.getState().login;
    await login(token);
  },
  
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data.user;
  },
};

// Project API
export const projectApi = {
  // Get all projects
  getProjects: async () => {
    const response = await api.get('/api/projects');
    return response.data.projects;
  },
  
  // Get project by ID
  getProject: async (id: string) => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data.project;
  },
  
  // Create new project
  createProject: async (projectData: any) => {
    const response = await api.post('/api/projects', projectData);
    return response.data.project;
  },
  
  // Update project
  updateProject: async (id: string, projectData: any) => {
    const response = await api.put(`/api/projects/${id}`, projectData);
    return response.data.project;
  },
  
  // Delete project
  deleteProject: async (id: string) => {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },
  
  // Add member to project
  addMember: async (projectId: string, userId: string, role: string) => {
    const response = await api.post(`/api/projects/${projectId}/members`, { userId, role });
    return response.data.project;
  },
  
  // Update member role
  updateMember: async (projectId: string, userId: string, role: string) => {
    const response = await api.put(`/api/projects/${projectId}/members/${userId}`, { role });
    return response.data.project;
  },
  
  // Remove member from project
  removeMember: async (projectId: string, userId: string) => {
    const response = await api.delete(`/api/projects/${projectId}/members/${userId}`);
    return response.data.project;
  },
};

// Task API
export const taskApi = {
  // Get all tasks
  getTasks: async (projectId?: string) => {
    const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks';
    const response = await api.get(url);
    return response.data.tasks;
  },
  
  // Get task by ID
  getTask: async (id: string) => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data.task;
  },
  
  // Create new task
  createTask: async (taskData: any) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data.task;
  },
  
  // Update task
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/api/tasks/${id}`, taskData);
    return response.data.task;
  },
  
  // Delete task
  deleteTask: async (id: string) => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
};

// Message API
export const messageApi = {
  // Get messages for a project
  getMessages: async (projectId: string, limit: number = 50, before?: string) => {
    let url = `/api/messages?projectId=${projectId}&limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    const response = await api.get(url);
    return response.data.messages;
  },
  
  // Send a message
  sendMessage: async (messageData: any) => {
    const response = await api.post('/api/messages', messageData);
    return response.data.message;
  },
  
  // Mark message as read
  markAsRead: async (id: string) => {
    const response = await api.put(`/api/messages/${id}/read`);
    return response.data;
  },
  
  // Delete message
  deleteMessage: async (id: string) => {
    const response = await api.delete(`/api/messages/${id}`);
    return response.data;
  },
};

// Request interceptor for adding token - Now uses the store directly
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Adding auth token to request');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors - Now uses the store directly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      console.log('[API] 401 Unauthorized response, logging out');
      const logout = useAuthStore.getState().logout;
      logout();
    }
    return Promise.reject(error);
  }
);

// Initialize axios with token from auth store if available
const initializeApi = () => {
  const token = useAuthStore.getState().token;
  if (token) {
    console.log('[API] Initializing API with token from auth store');
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Run initialization
initializeApi();

export default api;
