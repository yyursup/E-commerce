import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../auth';
import api from '../../lib/axios';
import axiosClient from '../../api/axiosClient';

vi.mock('../../lib/axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('../../api/axiosClient', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should register a user successfully', async () => {
            const mockData = { username: 'test', email: 'test@test.com', password: '123', phoneNumber: '123' };
            api.post.mockResolvedValueOnce({ data: { message: 'Success' } });

            const result = await authService.register(mockData);

            expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register', mockData);
            expect(result).toEqual({ message: 'Success' });
        });

        it('should throw error when registration fails', async () => {
            api.post.mockRejectedValueOnce({ response: { data: 'Registration failed' } });
            await expect(authService.register({})).rejects.toEqual('Registration failed');
        });
    });

    describe('login', () => {
        it('should login successfully', async () => {
            const mockCreds = { username: 'user', password: 'pwd' };
            api.post.mockResolvedValueOnce({ data: { token: 'token123' } });

            const result = await authService.login(mockCreds);

            expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', mockCreds);
            expect(result.token).toBe('token123');
        });
    });

    describe('verify', () => {
        it('should verify OTP successfully', async () => {
            const mockData = { email: 'test@test.com', otp: '123456' };
            api.post.mockResolvedValueOnce({ data: { message: 'Verified' } });

            const result = await authService.verify(mockData);

            expect(api.post).toHaveBeenCalledWith('/api/v1/auth/verify', mockData);
            expect(result.message).toBe('Verified');
        });
    });

    describe('getAllUsers', () => {
        it('should fetch all users', async () => {
            const mockUsers = [{ id: 1, username: 'user1' }];
            axiosClient.get.mockResolvedValueOnce({ data: mockUsers });

            const result = await authService.getAllUsers();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/auth/users');
            expect(result).toEqual(mockUsers);
        });
    });
});
