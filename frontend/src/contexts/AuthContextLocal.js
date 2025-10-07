import React, { createContext, useContext, useState, useEffect } from 'react'

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

  // Initialize with database users if not already set
  useEffect(() => {
    // Initialize users from database credentials
    const existingUsers = localStorage.getItem('users')
    if (!existingUsers) {
      const databaseUsers = [
        // Mumbai University (MU001)
        {
          id: 1,
          email: 'admin@mu.ac.in',
          password: 'admin123',
          role: 'admin',
          fullName: 'Rajesh Kumar',
          institutionId: 'MU001',
          institutionName: 'Mumbai University',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'meera.patel@mu.ac.in',
          password: 'faculty123',
          role: 'faculty',
          fullName: 'Dr. Meera Patel',
          department: 'Computer Science',
          institutionId: 'MU001',
          institutionName: 'Mumbai University',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          email: 'suresh.gupta@mu.ac.in',
          password: 'faculty123',
          role: 'faculty',
          fullName: 'Prof. Suresh Gupta',
          department: 'Information Technology',
          institutionId: 'MU001',
          institutionName: 'Mumbai University',
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          email: 'aarav.sharma@student.mu.ac.in',
          password: 'student123',
          role: 'student',
          fullName: 'Aarav Sharma',
          section: 'CS-A',
          institutionId: 'MU001',
          institutionName: 'Mumbai University',
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          email: 'diya.patel@student.mu.ac.in',
          password: 'student123',
          role: 'student',
          fullName: 'Diya Patel',
          section: 'CS-A',
          institutionId: 'MU001',
          institutionName: 'Mumbai University',
          createdAt: new Date().toISOString()
        },
        // VIT College (VIT001)
        {
          id: 6,
          email: 'admin@vit.edu',
          password: 'admin123',
          role: 'admin',
          fullName: 'Priya Sharma',
          institutionId: 'VIT001',
          institutionName: 'VIT College',
          createdAt: new Date().toISOString()
        },
        {
          id: 7,
          email: 'kavita.joshi@vit.edu',
          password: 'faculty123',
          role: 'faculty',
          fullName: 'Dr. Kavita Joshi',
          department: 'Computer Engineering',
          institutionId: 'VIT001',
          institutionName: 'VIT College',
          createdAt: new Date().toISOString()
        },
        {
          id: 8,
          email: 'rohan.desai@student.vit.edu',
          password: 'student123',
          role: 'student',
          fullName: 'Rohan Desai',
          department: 'Computer Engineering',
          institutionId: 'VIT001',
          institutionName: 'VIT College',
          createdAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('users', JSON.stringify(databaseUsers))
    }
  }, [])

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Login function using localStorage
  const login = async (email, password, institutionId = null, remember = false) => {
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      // Find user by email, password, and institution (if provided)
      const foundUser = users.find(
        u => u.email === email && 
             u.password === password &&
             (!institutionId || u.institutionId === institutionId)
      )

      if (!foundUser) {
        return false // Invalid credentials or institution mismatch
      }

      // Create token (in real app, this would be JWT from server)
      const token = btoa(JSON.stringify({ 
        userId: foundUser.id, 
        email: foundUser.email,
        timestamp: Date.now()
      }))

      // Save to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(foundUser))
      
      if (remember) {
        localStorage.setItem('rememberMe', 'true')
      }

      // Update state
      setUser(foundUser)
      
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  // Register function (used by CreateInstitution page)
  const register = async (userData) => {
    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === userData.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Create new user
      const newUser = {
        id: Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))

      return { success: true, user: newUser }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Create institution (used by CreateInstitution page)
  const createInstitution = async (institutionData) => {
    try {
      // Get existing institutions
      const institutions = JSON.parse(localStorage.getItem('institutions') || '[]')
      
      // Create new institution
      const newInstitution = {
        id: Date.now(),
        ...institutionData,
        createdAt: new Date().toISOString()
      }

      // Save to localStorage
      institutions.push(newInstitution)
      localStorage.setItem('institutions', JSON.stringify(institutions))

      // Also create the admin user for this institution
      const adminUser = {
        id: Date.now() + 1,
        role: 'admin',
        email: institutionData.adminEmail,
        password: institutionData.adminPassword,
        fullName: institutionData.adminName,
        institutionId: newInstitution.id,
        institutionName: institutionData.name,
        isPrimaryAdmin: true,
        createdAt: new Date().toISOString()
      }

      const users = JSON.parse(localStorage.getItem('users') || '[]')
      users.push(adminUser)
      localStorage.setItem('users', JSON.stringify(users))

      return { success: true, institution: newInstitution, admin: adminUser }
    } catch (error) {
      console.error('Institution creation error:', error)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    setUser(null)
  }

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!user) return false
    return user.role === requiredRole
  }

  // Check if user is authenticated (boolean)
  const isAuthenticated = !!user && !!localStorage.getItem('token')

  const value = {
    user,
    loading,
    login,
    register,
    createInstitution,
    logout,
    hasRole,
    isAuthenticated
  }

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    !loading && children
  )
}