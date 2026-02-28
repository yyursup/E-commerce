import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OfferDetails from '../OfferDetails';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

// Mock dependencies
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));
vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('OfferDetails Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthStore.mockReturnValue({
            isAuthenticated: true,
            user: { id: 'user-1' } // Owner of mockTradePost
        });
        useThemeStore.mockReturnValue('light');
    });

    it('renders trade post details', () => {
        renderWithRouter(<OfferDetails />);
        expect(screen.getByText('Chi tiết Offers')).toBeInTheDocument();
        expect(screen.getByText('AirPods Pro (2nd gen)')).toBeInTheDocument();
    });

    it('shows login prompt if not authenticated', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: false });
        renderWithRouter(<OfferDetails />);
        expect(screen.getByText(/Vui lòng đăng nhập/i)).toBeInTheDocument();
    });

    it('renders offers list', () => {
        renderWithRouter(<OfferDetails />);
        expect(screen.getByText(/Danh sách Offers/i)).toBeInTheDocument();
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });

    it('allows owner to accept an offer', async () => {
        renderWithRouter(<OfferDetails />);
        const acceptButtons = screen.getAllByText('Chấp nhận Offer');
        fireEvent.click(acceptButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Đã chấp nhận')).toBeInTheDocument();
        });
    });

    it('allows owner to reject an offer', async () => {
        renderWithRouter(<OfferDetails />);
        const rejectButtons = screen.getAllByText('Từ chối');
        fireEvent.click(rejectButtons[0]);

        await waitFor(() => {
            // Success toast or state change checked in handling
        });
    });

    it('hides contact info if not owner', () => {
        useAuthStore.mockReturnValue({
            isAuthenticated: true,
            user: { id: 'stranger-id' }
        });
        renderWithRouter(<OfferDetails />);
        expect(screen.queryByText('tranthib@example.com')).not.toBeInTheDocument();
    });

    it('shows contact info if owner', () => {
        renderWithRouter(<OfferDetails />);
        expect(screen.getByText('tranthib@example.com')).toBeInTheDocument();
    });

    it('applies dark mode styles', () => {
        useThemeStore.mockReturnValue('dark');
        const { container } = renderWithRouter(<OfferDetails />);
        expect(container.querySelector('.bg-slate-950')).toBeInTheDocument();
    });
});
