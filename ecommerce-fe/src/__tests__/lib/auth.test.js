import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getAccessToken, setAccessToken, clearAccessToken } from '../../lib/auth'

describe('auth.js', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getAccessToken', () => {
    it('should return null when no token is present', () => {
      expect(getAccessToken()).toBeNull()
    })

    it('should return token from "token" key', () => {
      localStorage.setItem('token', 'my-secret-token')
      expect(getAccessToken()).toBe('my-secret-token')
    })

    it('should return token from "accessToken" key if "token" is missing', () => {
      localStorage.setItem('accessToken', 'another-secret-token')
      expect(getAccessToken()).toBe('another-secret-token')
    })

    it('should prioritize "token" over "accessToken"', () => {
      localStorage.setItem('token', 'first-token')
      localStorage.setItem('accessToken', 'second-token')
      expect(getAccessToken()).toBe('first-token')
    })
  })

  describe('setAccessToken', () => {
    it('should set token in localStorage when a string is provided', () => {
      setAccessToken('new-token')
      expect(localStorage.getItem('token')).toBe('new-token')
    })

    it('should remove tokens when null is provided', () => {
      localStorage.setItem('token', 'old-token')
      localStorage.setItem('accessToken', 'old-access-token')
      
      setAccessToken(null)
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('clearAccessToken', () => {
    it('should remove both "token" and "accessToken" from localStorage', () => {
      localStorage.setItem('token', 'old-token')
      localStorage.setItem('accessToken', 'old-access-token')
      
      clearAccessToken()
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })
})
