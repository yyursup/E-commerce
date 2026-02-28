import { describe, it, expect, vi, beforeEach } from 'vitest';
import cartService from '../cart';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('cartService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCart', () => {
        it('should fetch the cart successfully', async () => {
            const mockData = { items: [], totalPrice: 0 };
            axiosClient.get.mockResolvedValueOnce({ data: mockData });

            const result = await cartService.getCart();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/cart');
            expect(result).toEqual(mockData);
        });

        it('should throw error when fetch fails', async () => {
            const mockError = { response: { data: 'Error fetching cart' } };
            axiosClient.get.mockRejectedValueOnce(mockError);

            await expect(cartService.getCart()).rejects.toEqual('Error fetching cart');
        });
    });

    describe('addToCart', () => {
        it('should add item to cart successfully', async () => {
            const mockData = { message: 'Item added' };
            axiosClient.post.mockResolvedValueOnce({ data: mockData });

            const result = await cartService.addToCart('product1', 2);

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items', {
                productId: 'product1',
                quantity: 2,
            });
            expect(result).toEqual(mockData);
        });

        it('should use default quantity of 1 if not provided', async () => {
            axiosClient.post.mockResolvedValueOnce({ data: {} });

            await cartService.addToCart('product1');

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items', {
                productId: 'product1',
                quantity: 1,
            });
        });
    });

    describe('increaseQuantity', () => {
        it('should increase quantity successfully', async () => {
            const mockData = { message: 'Quantity increased' };
            axiosClient.post.mockResolvedValueOnce({ data: mockData });

            const result = await cartService.increaseQuantity('item1');

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items/item1/plus');
            expect(result).toEqual(mockData);
        });
    });

    describe('decreaseQuantity', () => {
        it('should decrease quantity successfully', async () => {
            const mockData = { message: 'Quantity decreased' };
            axiosClient.post.mockResolvedValueOnce({ data: mockData });

            const result = await cartService.decreaseQuantity('item1');

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/cart/items/item1/minus');
            expect(result).toEqual(mockData);
        });
    });

    describe('removeItem', () => {
        it('should remove item successfully', async () => {
            const mockData = { message: 'Item removed' };
            axiosClient.delete.mockResolvedValueOnce({ data: mockData });

            const result = await cartService.removeItem('item1');

            expect(axiosClient.delete).toHaveBeenCalledWith('/api/v1/cart/items/item1');
            expect(result).toEqual(mockData);
        });
    });
});
