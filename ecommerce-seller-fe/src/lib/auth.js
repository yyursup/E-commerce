/**
 * Centralized access to auth token (localStorage). Use these helpers instead of
 * reading/writing 'token' or 'accessToken' directly.
 */

const TOKEN_KEY = 'token'
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

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
 * @returns {string | null} Refresh token, or null if not set.
 */
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || null
}

/**
 * @param {string} refreshToken
 */
export function setRefreshToken(refreshToken) {
  if (refreshToken != null) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

/**
 * Remove stored token(s).
 */
export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
