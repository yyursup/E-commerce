import api from './client'

const AUTH_BASE = '/auth'

export const login = payload => api.post(`${AUTH_BASE}/login`, payload)

export const register = payload => api.post(`${AUTH_BASE}/register`, payload)

export const verify = payload => api.post(`${AUTH_BASE}/verify`, payload)

export const getUsers = () => api.get(`${AUTH_BASE}/users`)
