import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWishlistStore } from '../../store/useWishlistStore'
import wishlistService from '../../services/wishlist'

vi.mock('../../services/wishlist', () => ({
  default: {
    getMyWishlist: vi.fn(),
    toggleWishlist: vi.fn(),
  },
}))

const state = () => useWishlistStore.getState()

describe('useWishlistStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWishlistStore.setState({ wishlistIds: new Set(), wishlistCount: 0, loading: false, inFlight: new Set() })
  })

  describe('fetchMyWishlist', () => {
    it('loads ids case-insensitively and takes the count from the server', async () => {
      wishlistService.getMyWishlist.mockResolvedValue({ content: [{ id: 'ABC' }, { id: 7 }], totalElements: 42 })

      await state().fetchMyWishlist()

      expect(wishlistService.getMyWishlist).toHaveBeenCalledWith({ page: 0, size: 100 })
      expect(state().isWishlisted('abc')).toBe(true)
      expect(state().isWishlisted(7)).toBe(true)
      expect(state().wishlistCount).toBe(42)
      expect(state().loading).toBe(false)
    })

    it('counts the loaded ids when the server sends no total', async () => {
      wishlistService.getMyWishlist.mockResolvedValue({ content: [{ id: 1 }, { id: 2 }] })
      await state().fetchMyWishlist()
      expect(state().wishlistCount).toBe(2)
    })

    it('copes with an empty response', async () => {
      wishlistService.getMyWishlist.mockResolvedValue(undefined)
      await state().fetchMyWishlist()
      expect(state().wishlistIds.size).toBe(0)
      expect(state().wishlistCount).toBe(0)
    })

    it('clears the loading flag when the request fails', async () => {
      wishlistService.getMyWishlist.mockRejectedValue(new Error('offline'))
      await state().fetchMyWishlist()
      expect(state().loading).toBe(false)
    })
  })

  describe('isWishlisted', () => {
    it('returns false for an empty id', () => {
      expect(state().isWishlisted(null)).toBe(false)
      expect(state().isWishlisted('')).toBe(false)
    })
  })

  describe('toggleWishlist', () => {
    it('does nothing for an empty id', async () => {
      expect(await state().toggleWishlist(null)).toBe(false)
      expect(wishlistService.toggleWishlist).not.toHaveBeenCalled()
    })

    it('adds a product optimistically before the server answers', async () => {
      let resolve
      wishlistService.toggleWishlist.mockReturnValue(new Promise((r) => (resolve = r)))

      const pending = state().toggleWishlist('P1')
      expect(state().isWishlisted('p1')).toBe(true)
      expect(state().wishlistCount).toBe(1)

      resolve({ wishlisted: true })
      await pending
      expect(state().isWishlisted('p1')).toBe(true)
      expect(state().inFlight.size).toBe(0)
    })

    it('removes a product that was already wishlisted', async () => {
      useWishlistStore.setState({ wishlistIds: new Set(['p1']), wishlistCount: 1 })
      wishlistService.toggleWishlist.mockResolvedValue({ wishlisted: false })

      await state().toggleWishlist('P1')

      expect(state().isWishlisted('p1')).toBe(false)
      expect(state().wishlistCount).toBe(0)
    })

    it('follows the server when it disagrees with the optimistic guess', async () => {
      wishlistService.toggleWishlist.mockResolvedValue({ wishlisted: false })
      await state().toggleWishlist('p1')
      expect(state().isWishlisted('p1')).toBe(false)
    })

    it('rolls back the id and the count when the request fails', async () => {
      useWishlistStore.setState({ wishlistIds: new Set(['p1']), wishlistCount: 3 })
      wishlistService.toggleWishlist.mockRejectedValue(new Error('500'))

      await expect(state().toggleWishlist('p1')).rejects.toThrow('500')

      expect(state().isWishlisted('p1')).toBe(true)
      expect(state().wishlistCount).toBe(3)
      expect(state().inFlight.size).toBe(0)
    })

    it('ignores a second click while the first request is still running', async () => {
      let resolve
      wishlistService.toggleWishlist.mockReturnValue(new Promise((r) => (resolve = r)))

      const first = state().toggleWishlist('p1')
      const second = await state().toggleWishlist('p1')

      expect(second).toEqual({ wishlisted: true })
      expect(wishlistService.toggleWishlist).toHaveBeenCalledTimes(1)
      expect(state().wishlistCount).toBe(1)

      resolve({ wishlisted: true })
      await first
    })

    it('never lets the count go below zero', async () => {
      useWishlistStore.setState({ wishlistIds: new Set(['p1']), wishlistCount: 0 })
      wishlistService.toggleWishlist.mockResolvedValue({ wishlisted: false })
      await state().toggleWishlist('p1')
      expect(state().wishlistCount).toBe(0)
    })
  })

  it('resetWishlist empties the store', () => {
    useWishlistStore.setState({ wishlistIds: new Set(['p1']), wishlistCount: 5, loading: true })
    state().resetWishlist()
    expect(state().wishlistIds.size).toBe(0)
    expect(state().wishlistCount).toBe(0)
    expect(state().loading).toBe(false)
  })
})
