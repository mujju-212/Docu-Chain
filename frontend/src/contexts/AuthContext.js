// BACKEND ENABLED: Using real backend authentication
// Backend is ready and running on http://localhost:5000

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Periodically check if token has expired (every minute)
  useEffect(() => {
    if (!isAuthenticated) return
    
    const checkExpiration = () => {
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
        console.log('Token expired during session, logging out...')
        logout()
        toast.error('Your session has expired. Please login again.')
      }
    }
    
    // Check every minute
    const interval = setInterval(checkExpiration, 60000)
    
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const tokenExpiration = localStorage.getItem('tokenExpiration')
      
      if (!token) {
        setLoading(false)
        return
      }

      // Check if token has expired
      if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
        console.log('Token expired, logging out...')
        logout()
        toast.error('Your session has expired. Please login again.')
        setLoading(false)
        return
      }

      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiration')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, institutionId, remember = false) => {
    try {
      const credentials = {
        email,
        password,
        institutionId
      };
      
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.success) {
        const { user, token } = response.data
        
        // Set token expiration: 30 days if remember me, 7 days otherwise
        const expirationDays = remember ? 30 : 7
        const expirationTime = Date.now() + (expirationDays * 24 * 60 * 60 * 1000)
        
        // Store token and expiration
        localStorage.setItem('token', token)
        localStorage.setItem('tokenExpiration', expirationTime.toString())
        
        // Store complete user object for ChatInterface
        localStorage.setItem('user', JSON.stringify(user))
        
        // Store user info for easy access
        localStorage.setItem('userId', user.id)
        localStorage.setItem('userEmail', user.email)
        localStorage.setItem('userRole', user.role)
        localStorage.setItem('userName', `${user.firstName} ${user.lastName}`)
        
        // Handle remember me
        if (remember) {
          localStorage.setItem('docuchain_email', email)
          localStorage.setItem('docuchain_remember', 'true')
        } else {
          localStorage.removeItem('docuchain_email')
          localStorage.removeItem('docuchain_remember')
        }
        
        // Update state
        setUser(user)
        setIsAuthenticated(true)
        
        return true; // Match AuthContextLocal return format
      }
      return false;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      return false; // Match AuthContextLocal return format
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        toast.success('Registration successful! Please wait for admin approval.')
        navigate('/login')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const createInstitution = async (institutionData) => {
    try {
      const response = await api.post('/auth/create-institution', institutionData)
      
      if (response.data.success) {
        const { user, token } = response.data
        
        // Set token expiration: 7 days default
        const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000)
        
        // Store token and expiration
        localStorage.setItem('token', token)
        localStorage.setItem('tokenExpiration', expirationTime.toString())
        
        // Store complete user object for ChatInterface
        localStorage.setItem('user', JSON.stringify(user))
        
        // Store user info
        localStorage.setItem('userId', user.id)
        localStorage.setItem('userEmail', user.email)
        localStorage.setItem('userRole', user.role)
        localStorage.setItem('userName', `${user.firstName} ${user.lastName}`)
        
        // Update state
        setUser(user)
        setIsAuthenticated(true)
        
        toast.success('Institution created successfully!')
        navigate('/admin/dashboard')
        
        return { success: true, user }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create institution.'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Logout error handled silently
    } finally {
      // Clear local storage - include token expiration
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiration')
      localStorage.removeItem('user')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userName')
      
      // Clear state
      setUser(null)
      setIsAuthenticated(false)
      
      // toast.success('Logged out successfully') // Temporarily disabled
      navigate('/login')
    }
  }

  const updateProfile = async (updatedData) => {
    try {
      const response = await api.put('/auth/profile', updatedData)
      
      if (response.data.success) {
        setUser(response.data.user)
        toast.success('Profile updated successfully')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    createInstitution,
    logout,
    updateProfile,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}