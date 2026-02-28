import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';
import { getAccountVerified } from '../../lib/jwt';

// Mock getAccountVerified
vi.mock('../../lib/jwt', () => ({
    getAccountVerified: vi.fn(),
}));

describe('useAuthStore', () => {
    beforeEach(() => {
        // Reset Zustand store state manually if needed, or clear storage
        localStorage.clear();
        vi.clearAllMocks();
        useAuthStore.getState().logout();
    });

    it('initializes with default values', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(state.accountVerified).toBe(false);
    });

    it('updates state on login', () => {
        getAccountVerified.mockReturnValue(true);
        const mockUser = { email: 'test@test.com' };
        const mockToken = 'token123';

        useAuthStore.getState().login(mockToken, mockUser);

        const state = useAuthStore.getState();
        expect(state.token).toBe(mockToken);
        expect(state.user).toEqual({ ...mockUser, accountVerified: true });
        expect(state.isAuthenticated).toBe(true);
        expect(state.accountVerified).toBe(true);
        expect(localStorage.getItem('token')).toBe(mockToken);
    });

    it('updates accountVerified status', () => {
        useAuthStore.getState().login('token', { name: 'Test' });
        useAuthStore.getState().updateAccountVerified(true);

        const state = useAuthStore.getState();
        expect(state.accountVerified).toBe(true);
        expect(state.user.accountVerified).toBe(true);
    });

    it('resets state on logout', () => {
        useAuthStore.getState().login('token', { name: 'Test' });
        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
    });
});
