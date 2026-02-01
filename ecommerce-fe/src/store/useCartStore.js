import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (product) => {
                const { items } = get()
                const safeItems = items || []
                const existingItem = safeItems.find((item) => item.id === product.id)

                if (existingItem) {
                    set({
                        items: safeItems.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item,
                        ),
                    })
                } else {
                    set({ items: [...safeItems, { ...product, quantity: 1 }] })
                }
            },

            removeFromCart: (productId) => {
                const { items } = get()
                set({
                    items: (items || []).filter((item) => item.id !== productId),
                })
            },

            updateQuantity: (productId, quantity) => {
                if (quantity < 1) return
                const { items } = get()
                set({
                    items: (items || []).map((item) =>
                        item.id === productId ? { ...item, quantity } : item,
                    ),
                })
            },

            clearCart: () => set({ items: [] }),

            getTotalItems: () => {
                const { items } = get()
                return (items || []).reduce((total, item) => total + item.quantity, 0)
            },

            getTotalPrice: () => {
                const { items } = get()
                return (items || []).reduce(
                    (total, item) => total + item.price * item.quantity,
                    0,
                )
            },
        }),
        {
            name: 'cart-storage',
        },
    ),
)
