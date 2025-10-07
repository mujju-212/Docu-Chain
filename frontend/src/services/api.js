import axios from 'axios'
// import toast from 'react-hot-toast' // Temporarily disabled

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

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
