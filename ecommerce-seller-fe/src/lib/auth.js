/**
 * Centralized access to auth token (localStorage). Use these helpers instead of
 * reading/writing 'token' or 'accessToken' directly.
 */

const TOKEN_KEY = 'token'
const ACCESS_TOKEN_KEY = 'accessToken'

/**
 * @returns {string | null} Access token for API/WebSocket auth, or null if not set.
 */
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || null
}

/**
 * @param {string} token
 */
export function setAccessToken(token) {
  if (token != null) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

/**
 * Remove stored token(s).
 */
export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
