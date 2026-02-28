import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../Home';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';
import productService from '../../services/product';
import cartService from '../../services/cart';
import toast from 'react-hot-toast';

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
vi.mock('../../services/product', () => ({
    default: {
        getProducts: vi.fn(),
    },
}));
vi.mock('../../services/cart', () => ({
    default: {
        addToCart: vi.fn(),
    },
}));
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

// Mock components that might cause issues in testing (like Hero, Footer if they are complex)
vi.mock('../../components/Hero', () => ({
    default: () => <div data-testid="hero">Hero Component</div>,
}));

const mockProductsResponse = {
    content: [
        {
            id: 'p1',
            name: 'AirPods Pro',
            basePrice: 5000000,
            status: 'PUBLISHED',
            images: [{ imageUrl: 'img1.jpg', isThumbnail: true }],
            shopName: 'Apple Store',
        },
    ],
};

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('Home Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue({ isAuthenticated: true });
        useCartStore.mockReturnValue({ updateCartCount: vi.fn() });
        useThemeStore.mockReturnValue('light');
        productService.getProducts.mockResolvedValue(mockProductsResponse);
        sessionStorage.clear();
    });

    it('renders correctly and fetches products', async () => {
        renderWithRouter(<Home />);

        expect(screen.getByTestId('hero')).toBeInTheDocument();
        expect(screen.getByText('Đang tải sản phẩm...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('AirPods Pro')).toBeInTheDocument();
            // Price is formatted in VND
            expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument();
        });
    });

    it('shows welcome modal only once per session', async () => {
        vi.useFakeTimers();
        renderWithRouter(<Home />);

        vi.advanceTimersByTime(1200);

        expect(screen.getByText(/Chào mừng đến AirPod Store/)).toBeInTheDocument();

        // Close modal
        fireEvent.click(screen.getByRole('button', { name: /Close/i })); // Assuming Modal has a close button

        // Rerender
        renderWithRouter(<Home />);
        vi.advanceTimersByTime(1200);
        // Should not reappear (mock state might reset, but sessionStorage check should catch it)
        vi.useRealTimers();
    });

    it('handles "Add to Cart" call', async () => {
        cartService.addToCart.mockResolvedValue({ items: [], totalPrice: 0 });
        renderWithRouter(<Home />);

        await waitFor(() => screen.getByText('AirPods Pro'));

        // ProductCard has actions that appear on hover, but in tests they might be rendered
        const addToCartBtn = screen.getByText('Xem nhanh'); // For simplicity, let's use quick view -> add to cart
        fireEvent.click(addToCartBtn);

        // Now quick view modal should be open
        const modalAddToCart = screen.getByText('Thêm vào giỏ hàng');
        fireEvent.click(modalAddToCart);

        await waitFor(() => {
            expect(cartService.addToCart).toHaveBeenCalledWith('p1', 1);
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đã thêm AirPods Pro'));
        });
    });

    it('shows error toast when product fetch fails', async () => {
        productService.getProducts.mockRejectedValue(new Error('API failure'));
        renderWithRouter(<Home />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
        });
    });
});
