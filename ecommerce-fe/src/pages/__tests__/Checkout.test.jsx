import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Checkout from '../Checkout';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import cartService from '../../services/cart';
import orderService from '../../services/order';
import { userAddressService } from '../../services/userAddressService';

// Mock dependencies
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));
vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));
vi.mock('../../services/cart', () => ({
    default: {
        getCart: vi.fn(),
    },
}));
vi.mock('../../services/order', () => ({
    default: {
        createOrder: vi.fn(),
        createPayment: vi.fn(),
    },
}));
vi.mock('../../services/userAddressService', () => ({
    userAddressService: {
        listMyAddresses: vi.fn(),
    },
}));

const mockLocationState = { shopId: 'shop-123' };
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: () => ({ state: mockLocationState }),
        useNavigate: () => vi.fn(),
    };
});

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('Checkout Page', () => {
    const mockCartItems = [
        { id: 'item-1', shopId: 'shop-123', productName: 'iPhone', quantity: 1, totalPrice: 1000000, shopName: 'Apple' }
    ];

    const mockAddresses = [
        { id: 'addr-1', recipientName: 'Buyer', phone: '0123', detailAddress: '123 St', ward: 'W1', district: 'D1', city: 'C1', isDefault: true }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue({ isAuthenticated: true });
        useThemeStore.mockReturnValue('light');
        cartService.getCart.mockResolvedValue({ items: mockCartItems });
        userAddressService.listMyAddresses.mockResolvedValue({ data: mockAddresses });
    });

    it('renders checkout details', async () => {
        renderWithRouter(<Checkout />);
        await waitFor(() => {
            expect(screen.getByText('iPhone')).toBeInTheDocument();
            expect(screen.getByText('Apple')).toBeInTheDocument();
        });
    });

    it('redirects if not authenticated', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: false });
        renderWithRouter(<Checkout />);
    });

    it('handles order creation', async () => {
        orderService.createOrder.mockResolvedValue({ id: 'order-1' });
        orderService.createPayment.mockResolvedValue({ paymentUrl: 'http://pay.url' });

        // Mock window.location.href
        delete window.location;
        window.location = { href: '' };

        renderWithRouter(<Checkout />);
        await waitFor(() => screen.getByText('iPhone'));

        const orderBtn = screen.getByText('Đặt hàng');
        fireEvent.click(orderBtn);

        await waitFor(() => {
            expect(orderService.createOrder).toHaveBeenCalled();
            expect(window.location.href).toBe('http://pay.url');
        });
    });

    it('validates address selection', async () => {
        userAddressService.listMyAddresses.mockResolvedValue({ data: [] });
        renderWithRouter(<Checkout />);
        await waitFor(() => screen.getByText(/Bạn chưa có địa chỉ nào/i));

        const orderBtn = screen.getByText('Đặt hàng');
        fireEvent.click(orderBtn);
        // Toast error should trigger
    });

    it('updates notes field', async () => {
        renderWithRouter(<Checkout />);
        await waitFor(() => screen.getByPlaceholderText(/Lưu ý cho người bán/i));
        const textarea = screen.getByPlaceholderText(/Lưu ý cho người bán/i);
        fireEvent.change(textarea, { target: { value: 'Handle with care' } });
        expect(textarea.value).toBe('Handle with care');
    });
});
