import axios from 'axios'
// import toast from 'react-hot-toast' // Temporarily disabled

// Normalize API URL - ensure HTTPS in production and remove trailing slashes
const normalizeApiUrl = (url) => {
  let normalized = url || 'http://localhost:5000/api';
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  // Force HTTPS in production (when not localhost)
  if (!normalized.includes('localhost') && !normalized.includes('127.0.0.1')) {
    normalized = normalized.replace(/^http:\/\//i, 'https://');
  }
  return normalized;
};

export const API_URL = normalizeApiUrl(process.env.REACT_APP_API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token')
          if (window.location.pathname !== '/login') {
            // toast.error('Session expired. Please login again.')
            console.error('Session expired. Please login again.')
            window.location.href = '/login'
          }
          break
        case 403:
          // toast.error('You don\'t have permission to perform this action')
          console.error('You don\'t have permission to perform this action')
          break
        case 404:
          // toast.error('Resource not found')
          console.error('Resource not found')
          break
        case 500:
          // toast.error('Server error. Please try again later.')
          console.error('Server error. Please try again later.')
          break
        default:
          if (data.message) {
            // toast.error(data.message)
            console.error(data.message)
          }
      }
    } else if (error.request) {
      // Request was made but no response received
      // toast.error('Network error. Please check your connection.')
      console.error('Network error. Please check your connection.')
    } else {
      // Something else happened
      // toast.error('An unexpected error occurred')
      console.error('An unexpected error occurred')
    }

    return Promise.reject(error)
  }
)

export default api

// Star/Unstar functions
export const toggleStarDocument = async (documentId) => {
  try {
    const response = await api.put(`/documents/${documentId}/star`);
    return response.data;
  } catch (error) {
    console.error('Error toggling document star:', error);
    throw error;
  }
};

export const toggleStarFolder = async (folderId) => {
  try {
    const response = await api.put(`/folders/${folderId}/star`);
    return response.data;
  } catch (error) {
    console.error('Error toggling folder star:', error);
    throw error;
  }
};

export const getStarredDocuments = async () => {
  try {
    const response = await api.get('/documents/starred');
    return response.data;
  } catch (error) {
    console.error('Error fetching starred documents:', error);
    throw error;
  }
};

export const getStarredFolders = async () => {
  try {
    const response = await api.get('/folders/starred');
    return response.data;
  } catch (error) {
    console.error('Error fetching starred folders:', error);
    throw error;
  }
};

// Recent Activity functions
export const getRecentActivities = async (limit = 20) => {
  try {
    const response = await api.get(`/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

export const addRecentActivity = async (activityData) => {
  try {
    const response = await api.post('/recent', activityData);
    return response.data;
  } catch (error) {
    console.error('Error adding recent activity:', error);
    throw error;
  }
};

export const clearRecentActivities = async () => {
  try {
    const response = await api.delete('/recent/clear');
    return response.data;
  } catch (error) {
    console.error('Error clearing recent activities:', error);
    throw error;
  }
};
