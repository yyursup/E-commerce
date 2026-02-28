import { describe, it, expect, vi, beforeEach } from 'vitest';
import orderService from '../order';
import axiosClient from '../../api/axiosClient';

vi.mock('../../api/axiosClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('orderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create order successfully', async () => {
            const mockOrder = { id: 1, shopId: 's1' };
            axiosClient.post.mockResolvedValueOnce({ data: mockOrder });

            const result = await orderService.createOrder('s1', 'a1', 'notes');

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/order', {
                shopId: 's1',
                addressId: 'a1',
                notes: 'notes',
            });
            expect(result).toEqual(mockOrder);
        });
    });

    describe('getMyOrders', () => {
        it('should fetch my orders with status filter', async () => {
            const mockOrders = [{ id: 1 }];
            axiosClient.get.mockResolvedValueOnce({ data: mockOrders });

            const result = await orderService.getMyOrders('PENDING');

            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/order/me', {
                params: { status: 'PENDING' },
            });
            expect(result).toEqual(mockOrders);
        });

        it('should fetch my orders without status filter', async () => {
            axiosClient.get.mockResolvedValueOnce({ data: [] });
            await orderService.getMyOrders();
            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/order/me', { params: {} });
        });
    });

    describe('createPayment', () => {
        it('should return payment URL', async () => {
            const mockResponse = { paymentUrl: 'http://vnpay.vn' };
            axiosClient.post.mockResolvedValueOnce({ data: mockResponse });

            const result = await orderService.createPayment(1);

            expect(axiosClient.post).toHaveBeenCalledWith('/api/v1/payment/orders/1/vnpay');
            expect(result).toEqual(mockResponse);
        });
    });
});
