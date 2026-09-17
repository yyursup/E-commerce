import { create } from 'zustand'
import wishlistService from '../services/wishlist'

export const useWishlistStore = create((set, get) => ({
  wishlistIds: new Set(),
  wishlistCount: 0,
  loading: false,
  inFlight: new Set(),

  // Fetch wishlist IDs of current user
  fetchMyWishlist: async () => {
    try {
      set({ loading: true })
      const res = await wishlistService.getMyWishlist({ page: 0, size: 100 })
      const items = res?.content || []
      const ids = new Set(items.map((p) => String(p.id).toLowerCase()))
      set({
        wishlistIds: ids,
        wishlistCount: res?.totalElements ?? ids.size,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
    }
  },

  // Check if a product is in wishlist
  isWishlisted: (productId) => {
    if (!productId) return false
    return get().wishlistIds.has(String(productId).toLowerCase())
  },

  // Toggle wishlist item
  toggleWishlist: async (productId) => {
    if (!productId) return false
    const idStr = String(productId).toLowerCase()

    // Prevent rapid double-clicking while request is in flight
    if (get().inFlight.has(idStr)) {
      return { wishlisted: get().wishlistIds.has(idStr) }
    }

    const nextInFlight = new Set(get().inFlight)
    nextInFlight.add(idStr)
    set({ inFlight: nextInFlight })

    const currentStatus = get().wishlistIds.has(idStr)

    // Optimistic update
    const nextIds = new Set(get().wishlistIds)
    if (currentStatus) {
      nextIds.delete(idStr)
    } else {
      nextIds.add(idStr)
    }
    const nextCount = Math.max(0, get().wishlistCount + (currentStatus ? -1 : 1))
    set({ wishlistIds: nextIds, wishlistCount: nextCount })

    try {
      const res = await wishlistService.toggleWishlist(productId)
      const serverWishlisted = res?.wishlisted ?? !currentStatus
      const verifiedIds = new Set(get().wishlistIds)
      if (serverWishlisted) {
        verifiedIds.add(idStr)
      } else {
        verifiedIds.delete(idStr)
      }
      set({
        wishlistIds: verifiedIds,
      })
      return res
    } catch (error) {
      // Rollback on error
      const rollbackIds = new Set(get().wishlistIds)
      if (currentStatus) {
        rollbackIds.add(idStr)
      } else {
        rollbackIds.delete(idStr)
      }
      set({
        wishlistIds: rollbackIds,
        wishlistCount: Math.max(0, get().wishlistCount + (currentStatus ? 1 : -1)),
      })
      throw error
    } finally {
      const finishInFlight = new Set(get().inFlight)
      finishInFlight.delete(idStr)
      set({ inFlight: finishInFlight })
    }
  },

  resetWishlist: () => {
    set({
      wishlistIds: new Set(),
      wishlistCount: 0,
      loading: false,
    })
  },
}))
