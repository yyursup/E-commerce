import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../../store/useCartStore'

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().resetCart()
  })

  it('should initialize with empty cart', () => {
    const state = useCartStore.getState()
    expect(state.totalItems).toBe(0)
    expect(state.cartId).toBeNull()
  })

  describe('updateCartCount', () => {
    it('should update totalItems and cartId when response is valid', () => {
      useCartStore.getState().updateCartCount({ totalItems: 5, id: 'cart-123' })
      const state = useCartStore.getState()
      expect(state.totalItems).toBe(5)
      expect(state.cartId).toBe('cart-123')
    })

    it('should default totalItems to 0 if response lacks it', () => {
      useCartStore.getState().updateCartCount({ id: 'cart-456' })
      expect(useCartStore.getState().totalItems).toBe(0)
      expect(useCartStore.getState().cartId).toBe('cart-456')
    })

    it('should reset cart if response is null or undefined', () => {
      useCartStore.setState({ totalItems: 10, cartId: 'old' })
      useCartStore.getState().updateCartCount(null)
      const state = useCartStore.getState()
      expect(state.totalItems).toBe(0)
      expect(state.cartId).toBeNull()
    })
  })

  describe('incrementCount / decrementCount', () => {
    it('should increment totalItems by default amount (1)', () => {
      useCartStore.getState().incrementCount()
      expect(useCartStore.getState().totalItems).toBe(1)
      
      useCartStore.getState().incrementCount(3)
      expect(useCartStore.getState().totalItems).toBe(4)
    })

    it('should decrement totalItems and not go below 0', () => {
      useCartStore.setState({ totalItems: 5 })
      
      useCartStore.getState().decrementCount()
      expect(useCartStore.getState().totalItems).toBe(4)
      
      useCartStore.getState().decrementCount(2)
      expect(useCartStore.getState().totalItems).toBe(2)
      
      // Should not go below 0
      useCartStore.getState().decrementCount(10)
      expect(useCartStore.getState().totalItems).toBe(0)
    })
  })

  describe('resetCart', () => {
    it('should clear all cart data', () => {
      useCartStore.setState({ totalItems: 99, cartId: 'cart-999' })
      useCartStore.getState().resetCart()
      const state = useCartStore.getState()
      expect(state.totalItems).toBe(0)
      expect(state.cartId).toBeNull()
    })
  })
})
