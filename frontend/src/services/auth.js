import api from './api'

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // Create institution
  createInstitution: async (institutionData) => {
    const response = await api.post('/auth/create-institution', institutionData)
    return response.data
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  // Update profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData)
    return response.data
  },

  // Verify OTP
  verifyOTP: async (otpData) => {
    const response = await api.post('/auth/verify-otp', otpData)
    return response.data
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  // Link wallet
  linkWallet: async (walletData) => {
    const response = await api.post('/auth/link-wallet', walletData)
    return response.data
  },

  // Switch wallet
  switchWallet: async (walletAddress) => {
    const response = await api.post('/auth/switch-wallet', { walletAddress })
    return response.data
  },
}

export default authService
