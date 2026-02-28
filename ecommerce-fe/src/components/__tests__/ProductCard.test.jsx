import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../ProductCard';
import { useThemeStore } from '../../store/useThemeStore';

// Mock useThemeStore
vi.mock('../../store/useThemeStore', () => ({
    useThemeStore: vi.fn(),
}));

const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 100000,
    oldPrice: 150000,
    image: 'test-image.jpg',
    badge: 'Sale',
    rating: 4.5,
};

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter });
};

describe('ProductCard', () => {
    it('renders product details correctly', () => {
        useThemeStore.mockReturnValue('light');
        renderWithRouter(<ProductCard product={mockProduct} />);

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Giảm giá')).toBeInTheDocument();
        // Use a regex or check for the formatted price
        expect(screen.getByText(/100\.000/)).toBeInTheDocument();
    });

    it('calls onQuickView when its button is clicked', () => {
        const onQuickViewMock = vi.fn();
        useThemeStore.mockReturnValue('light');
        renderWithRouter(<ProductCard product={mockProduct} onQuickView={onQuickViewMock} />);

        const quickViewBtn = screen.getByText('Xem nhanh');
        fireEvent.click(quickViewBtn);

        expect(onQuickViewMock).toHaveBeenCalledWith(mockProduct);
    });

    it('applies dark mode classes when theme is dark', () => {
        useThemeStore.mockReturnValue('dark');
        const { container } = renderWithRouter(<ProductCard product={mockProduct} />);

        // Check if the article tag has dark mode related classes
        const article = container.querySelector('article');
        expect(article).toHaveClass('bg-slate-800/50');
    });

    it('shows old price when provided', () => {
        useThemeStore.mockReturnValue('light');
        renderWithRouter(<ProductCard product={mockProduct} />);

        expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    });

    it('renders placeholder image on error', () => {
        useThemeStore.mockReturnValue('light');
        renderWithRouter(<ProductCard product={mockProduct} />);

        const img = screen.getByRole('img');
        fireEvent.error(img);

        expect(img.src).toContain('product-placeholder.svg');
    });
});
