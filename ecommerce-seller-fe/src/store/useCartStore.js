import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
    totalItems: 0,
    cartId: null,

    // Update cart count from backend response
    updateCartCount: (cartResponse) => {
        if (cartResponse) {
            set({
                totalItems: cartResponse.totalItems || 0,
                cartId: cartResponse.id || null,
            })
        } else {
            set({
                totalItems: 0,
                cartId: null,
            })
        }
    },

    // Increment count (when adding to cart)
    incrementCount: (quantity = 1) => {
        const { totalItems } = get()
        set({ totalItems: totalItems + quantity })
    },

    // Decrement count (when removing from cart)
    decrementCount: (quantity = 1) => {
        const { totalItems } = get()
        set({ totalItems: Math.max(0, totalItems - quantity) })
    },

    // Reset cart count
    resetCart: () => {
        set({
            totalItems: 0,
            cartId: null,
        })
    },
}))
