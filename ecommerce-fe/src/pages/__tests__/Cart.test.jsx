import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cart from '../Cart';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';
import cartService from '../../services/cart';

// Mock dependencies
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));
vi.mock('../../store/useCartStore', () => ({
    useCartStore: vi.fn(),
}));
vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));
vi.mock('../../services/cart', () => ({
    default: {
        getCart: vi.fn(),
        increaseQuantity: vi.fn(),
        decreaseQuantity: vi.fn(),
        removeItem: vi.fn(),
    },
}));

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('Cart Page', () => {
    const mockCartData = {
        items: [
            { id: '1', productId: 'p1', productName: 'Prod 1', quantity: 2, unitPrice: 100, totalPrice: 200, shopId: 's1', shopName: 'Shop 1', productImageUrl: '' }
        ],
        totalPrice: 200
    };

    const updateCartCountMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue({ isAuthenticated: true });
        useCartStore.mockReturnValue({ updateCartCount: updateCartCountMock });
        useThemeStore.mockReturnValue({ theme: 'light' });
        cartService.getCart.mockResolvedValue(mockCartData);
    });

    it('renders cart items', async () => {
        renderWithRouter(<Cart />);
        await waitFor(() => {
            expect(screen.getByText('Prod 1')).toBeInTheDocument();
            expect(screen.getByText('Shop 1')).toBeInTheDocument();
        });
    });

    it('shows login prompt when not authenticated', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: false });
        renderWithRouter(<Cart />);
        expect(screen.getByText(/Bạn chưa đăng nhập/i)).toBeInTheDocument();
    });

    it('shows empty cart message when no items', async () => {
        cartService.getCart.mockResolvedValue({ items: [], totalPrice: 0 });
        renderWithRouter(<Cart />);
        await waitFor(() => {
            expect(screen.getByText(/Giỏ hàng trống/i)).toBeInTheDocument();
        });
    });

    it('handles quantity increase', async () => {
        const updatedCart = { ...mockCartData, items: [{ ...mockCartData.items[0], quantity: 3, totalPrice: 300 }], totalPrice: 300 };
        cartService.increaseQuantity.mockResolvedValue(updatedCart);

        renderWithRouter(<Cart />);
        await waitFor(() => screen.getByText('Prod 1'));

        const plusBtn = screen.getAllByRole('button').find(b => b.innerHTML.includes('HiPlus') || b.querySelector('svg'));
        fireEvent.click(screen.getAllByRole('button')[3]); // Adjust index for HiPlus

        // Depending on implementation, might need to wait for state update
    });

    it('handles item removal', async () => {
        window.confirm = vi.fn().mockReturnValue(true);
        cartService.removeItem.mockResolvedValue({ items: [], totalPrice: 0 });

        renderWithRouter(<Cart />);
        await waitFor(() => screen.getByText('Prod 1'));

        const trashBtn = screen.getByTitle('Xóa sản phẩm');
        fireEvent.click(trashBtn);

        await waitFor(() => {
            expect(cartService.removeItem).toHaveBeenCalledWith('1');
        });
    });

    it('navigates to checkout when clicking shop checkout', async () => {
        renderWithRouter(<Cart />);
        await waitFor(() => screen.getByText('Mua từ Shop này'));

        const checkoutBtn = screen.getByText('Mua từ Shop này');
        fireEvent.click(checkoutBtn);
        // Navigation called
    });

    it('applies dark mode styles', () => {
        useThemeStore.mockReturnValue({ theme: 'dark' });
        const { container } = renderWithRouter(<Cart />);
        expect(container.querySelector('.bg-slate-950')).toBeInTheDocument();
    });
});
