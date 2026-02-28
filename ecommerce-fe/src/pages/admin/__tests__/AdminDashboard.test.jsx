import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import authService from '../../../services/auth';
import platformService from '../../../services/platform';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('../../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));
vi.mock('../../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));
vi.mock('../../../services/auth', () => ({
    default: {
        getAllUsers: vi.fn(),
    },
}));
vi.mock('../../../services/platform', () => ({
    default: {
        getPlatformSettings: vi.fn(),
        updateCommissionRate: vi.fn(),
    },
}));
vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

const mockUsers = [
    { email: 'admin@test.com', role: 'ADMIN' },
    { email: 'seller@test.com', role: 'BUSINESS' },
    { email: 'user@test.com', role: 'CUSTOMER' },
];

const mockSettings = { value: '12' };

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('AdminDashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue({ user: { email: 'admin@test.com' } });
        useThemeStore.mockReturnValue('light');
        authService.getAllUsers.mockResolvedValue(mockUsers);
        platformService.getPlatformSettings.mockResolvedValue(mockSettings);
    });

    it('renders correctly and fetches data on mount', async () => {
        renderWithRouter(<AdminDashboard />);

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Đang tải danh sách người dùng...')).toBeInTheDocument();

        await waitFor(() => {
            expect(authService.getAllUsers).toHaveBeenCalled();
            expect(platformService.getPlatformSettings).toHaveBeenCalled();

            // Check if users are listed
            expect(screen.getByText('admin@test.com')).toBeInTheDocument();
            expect(screen.getByText('seller@test.com')).toBeInTheDocument();
            expect(screen.getByText('user@test.com')).toBeInTheDocument();

            // Check if stats are calculated
            expect(screen.getByText('3')).toBeInTheDocument(); // Total users
            expect(screen.getByText('1')).toBeInTheDocument(); // Businesses (count of BUSINESS role)
        });
    });

    it('handles platform settings update', async () => {
        renderWithRouter(<AdminDashboard />);
        await waitFor(() => expect(platformService.getPlatformSettings).toHaveBeenCalled());

        const input = screen.getByLabelText('Tỷ lệ hoa hồng (%)');
        fireEvent.change(input, { target: { value: '15' } });

        platformService.updateCommissionRate.mockResolvedValue({ value: '15' });
        fireEvent.click(screen.getByText('Cập nhật'));

        await waitFor(() => {
            expect(platformService.updateCommissionRate).toHaveBeenCalledWith(15);
            expect(toast.success).toHaveBeenCalledWith('Cập nhật tỷ lệ hoa hồng thành công');
        });
    });

    it('validates commission rate input', async () => {
        renderWithRouter(<AdminDashboard />);
        await waitFor(() => screen.getByLabelText('Tỷ lệ hoa hồng (%)'));

        const input = screen.getByLabelText('Tỷ lệ hoa hồng (%)');

        // Test negative
        fireEvent.change(input, { target: { value: '-5' } });
        fireEvent.click(screen.getByText('Cập nhật'));
        expect(toast.error).toHaveBeenCalledWith('Tỷ lệ hoa hồng phải từ 0 đến 100');

        // Test > 100
        fireEvent.change(input, { target: { value: '105' } });
        fireEvent.click(screen.getByText('Cập nhật'));
        expect(toast.error).toHaveBeenCalledWith('Tỷ lệ hoa hồng phải từ 0 đến 100');
    });

    it('handles error when fetching users', async () => {
        authService.getAllUsers.mockRejectedValue(new Error('Network Error'));
        renderWithRouter(<AdminDashboard />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Không thể tải danh sách người dùng');
            expect(screen.getByText('Network Error')).toBeInTheDocument();
        });
    });

    it('shows badge for different roles correctly', async () => {
        renderWithRouter(<AdminDashboard />);
        await waitFor(() => screen.getByText('admin@test.com'));

        // Roles are displayed in uppercase badges based on the mock data
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('BUSINESS')).toBeInTheDocument();
        expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
    });
});
