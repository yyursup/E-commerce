import api from './client'

export const login = payload => api.post('/auth/login', payload)

export const register = payload => api.post('/auth/register', payload)

export const verify = payload => api.post('/auth/verify', payload)

export const getUsers = () => api.get('/auth/users')
