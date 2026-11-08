import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../../store/useAuthStore'
import * as authLib from '../../lib/auth'
import * as jwtLib from '../../lib/jwt'
import * as websocketService from '../../services/websocketService'

// Mock dependencies
vi.mock('../../lib/auth', () => ({
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}))

vi.mock('../../lib/jwt', () => ({
  decodeJWT: vi.fn(),
  getAccountVerified: vi.fn(),
}))

vi.mock('../../services/websocketService', () => ({
  closeWebSocketConnection: vi.fn(),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      accountVerified: false,
    })

    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with correct default values', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accountVerified).toBe(false)
  })

  describe('login', () => {
    it('should populate store and call helpers correctly', () => {
      const mockToken = 'mock-jwt-token'
      const mockUser = { email: 'test@example.com' }
      
      jwtLib.decodeJWT.mockReturnValue({
        accountId: 'acc-123',
        sub: 'test_username',
        role: 'CUSTOMER'
      })
      jwtLib.getAccountVerified.mockReturnValue(true)

      useAuthStore.getState().login(mockToken, mockUser)

      // Assert side effects
      expect(authLib.setAccessToken).toHaveBeenCalledWith(mockToken)
      
      // Assert state changes
      const state = useAuthStore.getState()
      expect(state.token).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
      expect(state.accountVerified).toBe(true)
      
      // Assert enriched user object
      expect(state.user).toEqual({
        email: 'test@example.com',
        id: 'acc-123',
        accountId: 'acc-123',
        username: 'test_username',
        role: 'CUSTOMER',
        accountVerified: true
      })
    })
  })

  describe('updateUser', () => {
    it('should merge updated fields into existing user object', () => {
      useAuthStore.setState({ user: { id: 1, name: 'Old Name' } })
      
      useAuthStore.getState().updateUser({ name: 'New Name', avatar: 'pic.jpg' })
      
      expect(useAuthStore.getState().user).toEqual({
        id: 1,
        name: 'New Name',
        avatar: 'pic.jpg'
      })
    })

    it('should do nothing if user is null', () => {
      useAuthStore.getState().updateUser({ name: 'New Name' })
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('updateAccountVerified', () => {
    it('should update accountVerified flag globally and inside user object', () => {
      useAuthStore.setState({ user: { id: 1, accountVerified: false }, accountVerified: false })
      
      useAuthStore.getState().updateAccountVerified(true)
      
      const state = useAuthStore.getState()
      expect(state.accountVerified).toBe(true)
      expect(state.user.accountVerified).toBe(true)
    })
  })

  describe('logout', () => {
    it('should clear side effects and reset state', () => {
      useAuthStore.setState({
        token: 'some-token',
        user: { id: 1 },
        isAuthenticated: true,
        accountVerified: true
      })

      useAuthStore.getState().logout()

      // Assert side effects
      expect(websocketService.closeWebSocketConnection).toHaveBeenCalled()
      expect(authLib.clearAccessToken).toHaveBeenCalled()

      // Assert state changes
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.accountVerified).toBe(false)
    })
  })
})
