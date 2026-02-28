import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from '../Register';
import { useThemeStore } from '../../store/useThemeStore';
import authService from '../../services/auth';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));
vi.mock('../../services/auth', () => ({
    default: {
        register: vi.fn(),
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

describe('Register Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useThemeStore.mockReturnValue('light');
    });

    it('renders registration form correctly', () => {
        renderWithRouter(<Register />);
        expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument();
        expect(screen.getByLabelText('Số điện thoại')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
        expect(screen.getByLabelText('Xác nhận mật khẩu')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeInTheDocument();
    });

    it('shows validation errors for all fields', async () => {
        renderWithRouter(<Register />);
        fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

        await waitFor(() => {
            expect(screen.getByText('Vui lòng nhập tên đăng nhập')).toBeInTheDocument();
            expect(screen.getByText('Vui lòng nhập số điện thoại')).toBeInTheDocument();
            expect(screen.getByText('Vui lòng nhập email')).toBeInTheDocument();
            expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
            expect(screen.getByText('Vui lòng xác nhận mật khẩu')).toBeInTheDocument();
        });
    });

    it('validates password matching', async () => {
        renderWithRouter(<Register />);

        fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'different' } });

        fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

        await waitFor(() => {
            expect(screen.getByText('Mật khẩu không khớp')).toBeInTheDocument();
        });
    });

    it('handles successful registration', async () => {
        authService.register.mockResolvedValue({ success: true });

        renderWithRouter(<Register />);

        fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'newuser' } });
        fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0912345678' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đăng ký thành công'));
        });
    });

    it('handles registration failure', async () => {
        authService.register.mockRejectedValue(new Error('Email already exists'));

        renderWithRouter(<Register />);

        fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'newuser' } });
        fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0912345678' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Email already exists');
        });
    });
});
