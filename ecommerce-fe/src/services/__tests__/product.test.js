import { describe, it, expect, vi, beforeEach } from 'vitest';
import productService from '../product';
import api from '../../lib/axios';

vi.mock('../../lib/axios', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('productService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProducts', () => {
        it('should fetch products with params', async () => {
            const mockProducts = [{ id: 1, name: 'Product 1' }];
            api.get.mockResolvedValueOnce({ data: mockProducts });

            const params = { category: 'electronics', page: 1 };
            const result = await productService.getProducts(params);

            expect(api.get).toHaveBeenCalledWith('/api/v1/product', { params });
            expect(result).toEqual(mockProducts);
        });

        it('should throw error when api fails', async () => {
            api.get.mockRejectedValueOnce({ response: { data: 'API Error' } });
            await expect(productService.getProducts()).rejects.toEqual('API Error');
        });
    });

    describe('getProductById', () => {
        it('should fetch a single product by id', async () => {
            const mockProduct = { id: 1, name: 'Product 1' };
            api.get.mockResolvedValueOnce({ data: mockProduct });

            const result = await productService.getProductById(1);

            expect(api.get).toHaveBeenCalledWith('/api/v1/product/1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw error when api fails for single product', async () => {
            api.get.mockRejectedValueOnce({ response: { data: 'Not Found' } });
            await expect(productService.getProductById(999)).rejects.toEqual('Not Found');
        });
    });
});
