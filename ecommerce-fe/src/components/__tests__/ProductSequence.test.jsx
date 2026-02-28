import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductSequence from '../ProductSequence';

describe('ProductSequence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Image
        global.Image = class {
            constructor() {
                setTimeout(() => this.onload(), 10);
            }
        };
        // Mock Canvas context
        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
            clearRect: vi.fn(),
            drawImage: vi.fn(),
        });
    });

    it('renders loading state initially', () => {
        render(<ProductSequence />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('removes loading state after images load', async () => {
        render(<ProductSequence />);
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    });

    it('triggers animation on mouse enter', async () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        render(<ProductSequence />);

        await waitFor(() => screen.queryByText('Loading...') === null);

        const container = screen.getByRole('generic', { className: /cursor-pointer/ });
        fireEvent.mouseEnter(container);

        expect(rafSpy).toHaveBeenCalled();
    });

    it('triggers animation on mouse leave', async () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        render(<ProductSequence />);

        await waitFor(() => screen.queryByText('Loading...') === null);

        const container = screen.getByRole('generic', { className: /cursor-pointer/ });
        fireEvent.mouseLeave(container);

        expect(rafSpy).toHaveBeenCalled();
    });
});
