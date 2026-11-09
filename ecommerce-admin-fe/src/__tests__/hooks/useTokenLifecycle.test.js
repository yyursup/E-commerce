import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import axios from 'axios'
import { useTokenLifecycle } from '../../hooks/useTokenLifecycle'
import { useAuthStore } from '../../store/useAuthStore'
import { isTokenExpired, getTokenRemainingTime } from '../../lib/jwt'
import { getAccessToken, getRefreshToken } from '../../lib/auth'
import { handleCleanLogoutAndRedirect } from '../../api/axiosClient'

vi.mock('axios', () => ({ default: { post: vi.fn() } }))
vi.mock('../../store/useAuthStore', () => ({ useAuthStore: vi.fn() }))
vi.mock('../../lib/jwt', () => ({ isTokenExpired: vi.fn(), getTokenRemainingTime: vi.fn() }))
vi.mock('../../lib/auth', () => ({ getAccessToken: vi.fn(), getRefreshToken: vi.fn() }))
vi.mock('../../api/axiosClient', () => ({ handleCleanLogoutAndRedirect: vi.fn() }))

const setTokens = vi.fn()

// expired: which tokens are expired; remaining: seconds left on the access token
function given({ authenticated = true, access = 'access', refresh = 'refresh', expired = [], remaining = 3600 } = {}) {
  useAuthStore.mockReturnValue({ token: access, isAuthenticated: authenticated, setTokens })
  getAccessToken.mockReturnValue(access)
  getRefreshToken.mockReturnValue(refresh)
  isTokenExpired.mockImplementation((t) => expired.includes(t))
  getTokenRemainingTime.mockReturnValue(remaining)
}

describe('useTokenLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    cleanup() // unmount so earlier hooks stop listening for focus
    vi.restoreAllMocks()
  })

  it('does nothing for a guest', () => {
    given({ authenticated: false, expired: ['access', 'refresh'] })
    renderHook(() => useTokenLifecycle())
    expect(handleCleanLogoutAndRedirect).not.toHaveBeenCalled()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('leaves a fresh token alone', () => {
    given({ remaining: 3600 })
    renderHook(() => useTokenLifecycle())
    expect(axios.post).not.toHaveBeenCalled()
    expect(handleCleanLogoutAndRedirect).not.toHaveBeenCalled()
  })

  it('logs out when both tokens have expired', () => {
    given({ expired: ['access', 'refresh'] })
    renderHook(() => useTokenLifecycle())
    expect(handleCleanLogoutAndRedirect).toHaveBeenCalledOnce()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('logs out when the access token expired and there is no refresh token', () => {
    given({ refresh: null, expired: ['access'] })
    renderHook(() => useTokenLifecycle())
    expect(handleCleanLogoutAndRedirect).toHaveBeenCalledOnce()
  })

  it('refreshes an access token that expires within two minutes', async () => {
    given({ remaining: 90 })
    axios.post.mockResolvedValue({ data: { token: 'new-access', refreshToken: 'new-refresh' } })

    renderHook(() => useTokenLifecycle())

    await waitFor(() => expect(setTokens).toHaveBeenCalledWith('new-access', 'new-refresh'))
    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/auth\/refresh-token$/), {
      refreshToken: 'refresh',
    })
  })

  it('refreshes an already expired access token while the refresh token is valid', async () => {
    given({ expired: ['access'], remaining: 0 })
    axios.post.mockResolvedValue({ data: { token: 'new-access' } })
    renderHook(() => useTokenLifecycle())
    await waitFor(() => expect(setTokens).toHaveBeenCalledWith('new-access', undefined))
  })

  it('keeps the session when the refresh response has no token', async () => {
    given({ remaining: 60 })
    axios.post.mockResolvedValue({ data: {} })
    renderHook(() => useTokenLifecycle())
    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    expect(setTokens).not.toHaveBeenCalled()
    expect(handleCleanLogoutAndRedirect).not.toHaveBeenCalled()
  })

  it.each([400, 401])('logs out when the server rejects the refresh token with %i', async (status) => {
    given({ remaining: 60 })
    axios.post.mockRejectedValue({ response: { status } })
    renderHook(() => useTokenLifecycle())
    await waitFor(() => expect(handleCleanLogoutAndRedirect).toHaveBeenCalledOnce())
  })

  it('stays logged in on a network error or server error', async () => {
    given({ remaining: 60 })
    axios.post.mockRejectedValue({ response: { status: 503 } })
    renderHook(() => useTokenLifecycle())
    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    await Promise.resolve()
    expect(handleCleanLogoutAndRedirect).not.toHaveBeenCalled()
  })

  it('checks again every 45 seconds and when the tab regains focus', () => {
    vi.useFakeTimers()
    given({ remaining: 3600 })
    const { unmount } = renderHook(() => useTokenLifecycle())
    expect(getTokenRemainingTime).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(45000)
    expect(getTokenRemainingTime).toHaveBeenCalledTimes(2)

    window.dispatchEvent(new Event('focus'))
    expect(getTokenRemainingTime).toHaveBeenCalledTimes(3)

    unmount()
    vi.advanceTimersByTime(90000)
    window.dispatchEvent(new Event('focus'))
    expect(getTokenRemainingTime).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
