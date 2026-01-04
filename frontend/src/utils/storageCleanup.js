/**
 * Storage Cleanup Utility
 * Removes expired tokens and stale localStorage data
 */

/**
 * Clean up expired tokens and old data from localStorage
 */
export const cleanupExpiredStorage = () => {
  const tokenExpiration = localStorage.getItem('tokenExpiration')
  
  if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
    console.log('🧹 Cleaning up expired authentication data...')
    
    // Remove authentication-related items
    localStorage.removeItem('token')
    localStorage.removeItem('tokenExpiration')
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    
    return true // Token was expired and cleaned
  }
  
  return false // Token still valid or no token found
}

/**
 * Clean up all localStorage data (useful for debugging or major updates)
 * Preserves only remember me preferences
 */
export const cleanupAllStorage = () => {
  const rememberEmail = localStorage.getItem('docuchain_email')
  const remember = localStorage.getItem('docuchain_remember')
  
  localStorage.clear()
  
  // Restore remember me preferences
  if (remember === 'true' && rememberEmail) {
    localStorage.setItem('docuchain_email', rememberEmail)
    localStorage.setItem('docuchain_remember', 'true')
  }
  
  console.log('🧹 All localStorage data cleaned')
}

/**
 * Get remaining time until token expiration
 * @returns {number|null} Milliseconds until expiration, or null if no token
 */
export const getTokenTimeRemaining = () => {
  const tokenExpiration = localStorage.getItem('tokenExpiration')
  
  if (!tokenExpiration) return null
  
  const remaining = parseInt(tokenExpiration) - Date.now()
  return remaining > 0 ? remaining : 0
}

/**
 * Format remaining time in human-readable format
 * @returns {string} Formatted time string (e.g., "5 days", "2 hours", "30 minutes")
 */
export const getTokenTimeRemainingFormatted = () => {
  const remaining = getTokenTimeRemaining()
  
  if (remaining === null) return 'No active session'
  if (remaining === 0) return 'Expired'
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
