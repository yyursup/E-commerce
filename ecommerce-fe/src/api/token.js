const TOKEN_KEY = 'ecommerce_token'

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY)

export const setAccessToken = token => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

export const setTokens = payload => {
  if (!payload) return
  const token = typeof payload === 'string' ? payload : payload.token || payload.accessToken
  if (token) setAccessToken(token)
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
}
