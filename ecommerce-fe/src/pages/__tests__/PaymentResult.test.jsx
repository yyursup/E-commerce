import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaymentResult from '../PaymentResult';
import axiosClient from '../../api/axiosClient';
import { useThemeStore } from '../../store/useThemeStore';

// Mock dependencies
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: vi.fn(),
        useNavigate: vi.fn(),
    };
});

vi.mock('../../api/axiosClient', () => ({
    default: {
        get: vi.fn(),
    },
}));

vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('PaymentResult', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useThemeStore.mockReturnValue('light');
    });

    it('shows success message when vnp_ResponseCode is 00', async () => {
        const mockParams = new URLSearchParams({
            vnp_ResponseCode: '00',
            vnp_TransactionNo: '12345678',
        });
        useSearchParams.mockReturnValue([mockParams]);
        axiosClient.get.mockResolvedValueOnce({ data: { success: true } });

        renderWithRouter(<PaymentResult />);

        expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument();
            expect(screen.getByText(/Mã GD: 12345678/)).toBeInTheDocument();
        });
    });

    it('shows failed message when vnp_ResponseCode is not 00', async () => {
        const mockParams = new URLSearchParams({
            vnp_ResponseCode: '99',
        });
        useSearchParams.mockReturnValue([mockParams]);
        axiosClient.get.mockResolvedValueOnce({ data: { success: false } });

        renderWithRouter(<PaymentResult />);

        await waitFor(() => {
            expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument();
            expect(screen.getByText('Thanh toán thất bại hoặc bị hủy.')).toBeInTheDocument();
        });
    });

    it('shows error message when API call fails', async () => {
        const mockParams = new URLSearchParams({
            vnp_ResponseCode: '00',
        });
        useSearchParams.mockReturnValue([mockParams]);
        axiosClient.get.mockRejectedValueOnce(new Error('Network Error'));

        renderWithRouter(<PaymentResult />);

        await waitFor(() => {
            expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument();
            expect(screen.getByText('Có lỗi xảy ra khi xác thực thanh toán.')).toBeInTheDocument();
        });
    });

    it('shows error if no search params found', async () => {
        const mockParams = new URLSearchParams({});
        useSearchParams.mockReturnValue([mockParams]);

        renderWithRouter(<PaymentResult />);

        await waitFor(() => {
            expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument();
            expect(screen.getByText('Không tìm thấy thông tin thanh toán.')).toBeInTheDocument();
        });
    });
});
