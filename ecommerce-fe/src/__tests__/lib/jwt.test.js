import { describe, it, expect, vi } from 'vitest'
import { decodeJWT, getAccountVerified } from '../../lib/jwt'

describe('jwt.js', () => {
  // A simple helper to generate a dummy JWT
  const createDummyJWT = (payload) => {
    const encodedPayload = btoa(JSON.stringify(payload))
    return `header.${encodedPayload}.signature`
  }

  describe('decodeJWT', () => {
    it('should return null for empty token', () => {
      expect(decodeJWT(null)).toBeNull()
      expect(decodeJWT('')).toBeNull()
      expect(decodeJWT(undefined)).toBeNull()
    })

    it('should return null for malformed token (not 3 parts)', () => {
      expect(decodeJWT('part1.part2')).toBeNull()
      expect(decodeJWT('invalid-token')).toBeNull()
    })

    it('should decode a valid JWT and return the payload object', () => {
      const mockPayload = { id: 1, role: 'USER' }
      const token = createDummyJWT(mockPayload)
      const result = decodeJWT(token)
      expect(result).toEqual(mockPayload)
    })

    it('should return null and handle errors gracefully when decoding fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const invalidToken = 'header.invalid_base64_payload.signature'
      expect(decodeJWT(invalidToken)).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getAccountVerified', () => {
    it('should return true when account_verified is true', () => {
      const token = createDummyJWT({ account_verified: true })
      expect(getAccountVerified(token)).toBe(true)
    })

    it('should return false when account_verified is false', () => {
      const token = createDummyJWT({ account_verified: false })
      expect(getAccountVerified(token)).toBe(false)
    })

    it('should return false when account_verified is missing', () => {
      const token = createDummyJWT({ id: 1 })
      expect(getAccountVerified(token)).toBe(false)
    })

    it('should return false when token is invalid', () => {
      expect(getAccountVerified('invalid')).toBe(false)
      expect(getAccountVerified(null)).toBe(false)
    })
  })
})
