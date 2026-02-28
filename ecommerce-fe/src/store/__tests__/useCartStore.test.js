import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../useCartStore';

describe('useCartStore', () => {
    beforeEach(() => {
        useCartStore.getState().resetCart();
    });

    it('initializes with zero items', () => {
        const state = useCartStore.getState();
        expect(state.totalItems).toBe(0);
        expect(state.cartId).toBeNull();
    });

    it('updates count from cart response', () => {
        const mockResponse = { totalItems: 5, id: 'cart123' };
        useCartStore.getState().updateCartCount(mockResponse);

        const state = useCartStore.getState();
        expect(state.totalItems).toBe(5);
        expect(state.cartId).toBe('cart123');
    });

    it('resets when updateCartCount is called with null', () => {
        useCartStore.getState().updateCartCount({ totalItems: 5, id: 'cart123' });
        useCartStore.getState().updateCartCount(null);

        const state = useCartStore.getState();
        expect(state.totalItems).toBe(0);
        expect(state.cartId).toBeNull();
    });

    it('increments count', () => {
        useCartStore.getState().incrementCount(2);
        expect(useCartStore.getState().totalItems).toBe(2);

        useCartStore.getState().incrementCount(); // Default 1
        expect(useCartStore.getState().totalItems).toBe(3);
    });

    it('decrements count but not below zero', () => {
        useCartStore.getState().incrementCount(5);
        useCartStore.getState().decrementCount(2);
        expect(useCartStore.getState().totalItems).toBe(3);

        useCartStore.getState().decrementCount(10);
        expect(useCartStore.getState().totalItems).toBe(0);
    });
});
