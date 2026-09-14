import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../../services/authService'
import axiosClient from '../../api/axiosClient'

// Mock the axios client
vi.mock('../../api/axiosClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call post /auth/login and return data on success', async () => {
      const mockResponse = { data: { token: 'mock-token', user: { id: 1 } } }
      axiosClient.post.mockResolvedValueOnce(mockResponse)

      const result = await authService.login('test@email.com', 'password123')

      expect(axiosClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@email.com',
        password: 'password123'
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error if request fails', async () => {
      const error = new Error('Network Error')
      axiosClient.post.mockRejectedValueOnce(error)

      await expect(authService.login('test@email.com', 'pwd')).rejects.toThrow('Network Error')
    })
  })

  describe('register', () => {
    it('should call post /auth/register and return data', async () => {
      const mockData = { email: 'test@email.com', password: 'pwd' }
      const mockResponse = { data: { message: 'Success' } }
      axiosClient.post.mockResolvedValueOnce(mockResponse)

      const result = await authService.register(mockData)

      expect(axiosClient.post).toHaveBeenCalledWith('/auth/register', mockData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getCurrentUser', () => {
    it('should call get /users/me and return data', async () => {
      const mockResponse = { data: { id: 1, name: 'John' } }
      axiosClient.get.mockResolvedValueOnce(mockResponse)

      const result = await authService.getCurrentUser()

      expect(axiosClient.get).toHaveBeenCalledWith('/users/me')
      expect(result).toEqual(mockResponse.data)
    })
  })
})
