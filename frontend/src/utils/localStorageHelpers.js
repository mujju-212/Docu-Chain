/**
 * localStorage Data Structure Examples
 * 
 * This file documents the structure of data stored in localStorage
 * for development/testing purposes (before backend integration)
 */

// ====================
// USERS ARRAY
// ====================
// Key: 'users'
// Type: Array<User>

const exampleUsers = [
  // Student Example
  {
    id: 1696534534234,
    role: "student",
    firstName: "John",
    lastName: "Doe",
    studentId: "CS001",
    collegeName: "ABC College",
    collegeId: "ABC123",
    email: "john@example.com",
    password: "Test123", // ⚠️ PLAIN TEXT - DEV ONLY!
    dept: "CSE",
    section: "A",
    phone: "+911234567890",
    wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    dob: "2000-01-01",
    gender: "male",
    secret: "Optional secret message",
    createdAt: "2025-10-06T10:30:00.000Z"
  },

  // Teacher/Staff Example
  {
    id: 1696534535000,
    role: "staff",
    firstName: "Jane",
    lastName: "Smith",
    staffId: "STAFF001",
    collegeName: "ABC College",
    collegeId: "ABC123",
    email: "jane@example.com",
    password: "Teacher123",
    dept: "ECE",
    phone: "+919876543210",
    wallet: null,
    dob: "1985-05-15",
    gender: "female",
    createdAt: "2025-10-06T10:35:00.000Z"
  },

  // Admin Example
  {
    id: 1696534536000,
    role: "admin",
    fullName: "Robert Johnson",
    adminId: "ADMIN001",
    collegeName: "ABC College",
    collegeId: "ABC123",
    email: "admin@example.com",
    password: "Admin123",
    phone: "+918765432109",
    wallet: null,
    dob: "1980-03-20",
    gender: "male",
    createdAt: "2025-10-06T10:40:00.000Z"
  },

  // Primary Admin (created with Institution)
  {
    id: 1696534537000,
    role: "admin",
    fullName: "Sarah Williams",
    adminId: "ADMIN002",
    email: "sarah@abcuniversity.edu",
    password: "PrimaryAdmin123",
    phone: "+919988776655",
    institutionId: 1696534534235,
    collegeName: "ABC University",
    collegeId: "1001",
    dept: "Administration",
    gender: "female",
    isPrimaryAdmin: true,
    createdAt: "2025-10-06T10:45:00.000Z"
  }
]

// ====================
// INSTITUTIONS ARRAY
// ====================
// Key: 'institutions'
// Type: Array<Institution>

const exampleInstitutions = [
  {
    id: 1696534534235,
    name: "ABC University",
    institutionId: "1001",
    type: "University",
    email: "admin@abcuniversity.edu",
    website: "https://abcuniversity.edu",
    address: "123 University Avenue, City, State, 123456",
    phone: "9876543210",
    createdAt: "2025-10-06T10:45:00.000Z"
  },
  {
    id: 1696534538000,
    name: "XYZ College",
    institutionId: "2001",
    type: "College",
    email: "contact@xyzcollege.edu",
    website: "https://xyzcollege.edu",
    address: "456 College Road, Town, State, 654321",
    phone: "8765432109",
    createdAt: "2025-10-06T11:00:00.000Z"
  }
]

// ====================
// CURRENT USER
// ====================
// Key: 'user'
// Type: User object (single)
// Set after successful login

const currentUserExample = {
  id: 1696534534234,
  role: "student",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  // ... rest of user fields
}

// ====================
// AUTH TOKEN
// ====================
// Key: 'token'
// Type: string (base64 encoded)
// Created on login

const tokenExample = "eyJ1c2VySWQiOjE2OTY1MzQ1MzQyMzQsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInRpbWVzdGFtcCI6MTY5NjUzNDUzNDIzNH0="
// Decoded: {"userId":1696534534234,"email":"john@example.com","timestamp":1696534534234}

// ====================
// REMEMBER ME FLAG
// ====================
// Key: 'rememberMe'
// Type: string ('true' or absent)

const rememberMeExample = "true"

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Get all users from localStorage
 */
export const getAllUsers = () => {
  return JSON.parse(localStorage.getItem('users') || '[]')
}

/**
 * Get all institutions from localStorage
 */
export const getAllInstitutions = () => {
  return JSON.parse(localStorage.getItem('institutions') || '[]')
}

/**
 * Get currently logged in user
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Check if user is logged in
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token') && !!localStorage.getItem('user')
}

/**
 * Clear all auth data (logout)
 */
export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('rememberMe')
}

/**
 * Clear ALL localStorage data (reset app)
 */
export const resetAppData = () => {
  localStorage.clear()
  console.log('✅ All localStorage data cleared!')
}

// ====================
// SAMPLE DATA SEEDER
// ====================

/**
 * Seed sample data for testing
 * Run this in browser console: seedSampleData()
 */
export const seedSampleData = () => {
  // Add sample users
  localStorage.setItem('users', JSON.stringify(exampleUsers))
  
  // Add sample institutions
  localStorage.setItem('institutions', JSON.stringify(exampleInstitutions))
  
  console.log('✅ Sample data seeded!')
  console.log('📧 Test Login Credentials:')
  console.log('  Student: john@example.com / Test123')
  console.log('  Teacher: jane@example.com / Teacher123')
  console.log('  Admin: admin@example.com / Admin123')
}

// ====================
// VALIDATION HELPERS
// ====================

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate password strength
 * At least 6 characters, with uppercase, lowercase, and number
 */
export const isValidPassword = (password) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)
}

/**
 * Validate phone number (10 digits)
 */
export const isValidPhone = (phone) => {
  return /^[0-9]{10}$/.test(phone.trim())
}

/**
 * Validate alphabetic string
 */
export const isAlphabetic = (value) => {
  return /^[A-Za-z\s]+$/.test(value.trim())
}

/**
 * Validate alphanumeric string
 */
export const isAlphaNumeric = (value) => {
  return /^[A-Za-z0-9]+$/.test(value.trim())
}

// ====================
// USAGE EXAMPLES
// ====================

/*
// In Browser Console:

// 1. Seed sample data
seedSampleData()

// 2. View all users
console.table(getAllUsers())

// 3. View all institutions
console.table(getAllInstitutions())

// 4. Check current user
console.log(getCurrentUser())

// 5. Check if logged in
console.log('Logged in:', isLoggedIn())

// 6. Reset everything
resetAppData()

*/

// ====================
// MIGRATION NOTES
// ====================

/*
When connecting to backend:

1. Backend User Schema should match:
   - id (auto-generated)
   - role (enum: student, staff, admin)
   - email (unique, indexed)
   - password (hashed with bcrypt)
   - ...other fields based on role

2. Backend Institution Schema:
   - id (auto-generated)
   - name, type, email, website, address, phone
   - relationship to primary admin user

3. JWT Token Structure:
   {
     userId: user.id,
     email: user.email,
     role: user.role,
     institutionId: user.institutionId (if applicable),
     iat: issued at timestamp,
     exp: expiration timestamp
   }

4. API Endpoints needed:
   POST /api/auth/register
   POST /api/auth/login
   POST /api/auth/logout
   GET  /api/auth/me
   POST /api/auth/create-institution
   POST /api/auth/verify-otp
   POST /api/auth/forgot-password
   POST /api/auth/reset-password

5. Replace AuthContextLocal with AuthContext
   - Change import in main.jsx
   - AuthContext will use axios/fetch instead of localStorage
*/
