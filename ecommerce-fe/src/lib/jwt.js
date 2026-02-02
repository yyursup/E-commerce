/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for reading claims only, not for security validation
 */
export function decodeJWT(token) {
  try {
    if (!token) return null
    
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

/**
 * Get account_verified claim from JWT token
 */
export function getAccountVerified(token) {
  const decoded = decodeJWT(token)
  return decoded?.account_verified === true
}
