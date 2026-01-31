import axios from 'axios'
import { getAccessToken } from './token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const serverError = error?.response?.data
    if (serverError) {
      return Promise.reject(serverError)
    }
    return Promise.reject({
      status: 0,
      error: 'NetworkError',
      message: error?.message || 'Network error',
      path: '',
      timestamp: new Date().toISOString(),
    })
  },
)

export default api
