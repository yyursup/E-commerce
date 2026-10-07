/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for reading claims only, not for security validation
 */
export function decodeJWT(token) {
  try {
    if (!token || typeof token !== 'string') return null
    
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Check if a JWT token is expired (or will expire within bufferSeconds).
 * @param {string} token
 * @param {number} bufferSeconds - Buffer time in seconds before actual expiration (default 15s)
 * @returns {boolean} true if expired or invalid, false if still valid
 */
export function isTokenExpired(token, bufferSeconds = 15) {
  if (!token) return true
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return true
  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp <= currentTime + bufferSeconds
}

/**
 * Get remaining seconds before token expires.
 * @param {string} token
 * @returns {number} Remaining seconds, or 0 if expired
 */
export function getTokenRemainingTime(token) {
  if (!token) return 0
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return 0
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.max(0, decoded.exp - currentTime)
}

/**
 * Get account_verified claim from JWT token
 */
export function getAccountVerified(token) {
  const decoded = decodeJWT(token)
  return decoded?.account_verified === true
}
