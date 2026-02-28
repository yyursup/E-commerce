import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useThemeStore } from '../../store/useThemeStore';
import authService from '../../services/auth';
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
vi.mock('../../services/auth', () => ({
    default: {
        login: vi.fn(),
    },
}));
vi.mock('../../services/cart', () => ({
    default: {
        getCart: vi.fn(),
    },
}));
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('Login Page', () => {
    const loginMock = vi.fn();
    const updateCartCountMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue(loginMock);
        useCartStore.mockReturnValue({ updateCartCount: updateCartCountMock });
        useThemeStore.mockReturnValue('light');
    });

    it('renders login form correctly', () => {
        renderWithRouter(<Login />);
        expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument();
        expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        renderWithRouter(<Login />);
        fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => {
            expect(screen.getByText('Vui lòng nhập tên đăng nhập')).toBeInTheDocument();
            expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
        });
    });

    it('handles successful login and cart fetch', async () => {
        const mockAuthResponse = { token: 'token123', email: 'test@example.com', role: 'USER' };
        const mockCartResponse = { items: [], total: 0 };

        authService.login.mockResolvedValue(mockAuthResponse);
        cartService.getCart.mockResolvedValue(mockCartResponse);

        renderWithRouter(<Login />);

        fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
            expect(useAuthStore.mock.results[0].value).toHaveBeenCalledWith('token123', { email: 'test@example.com', role: 'USER' });
            expect(cartService.getCart).toHaveBeenCalled();
            expect(updateCartCountMock).toHaveBeenCalledWith(mockCartResponse);
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Chào mừng trở lại'));
        });
    });

    it('handles login failure', async () => {
        authService.login.mockRejectedValue(new Error('Invalid credentials'));

        renderWithRouter(<Login />);

        fireEvent.change(screen.getByPlaceholderText('username'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        });
    });
});
