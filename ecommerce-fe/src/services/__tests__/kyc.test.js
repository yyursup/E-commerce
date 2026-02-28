import { describe, it, expect, vi, beforeEach } from 'vitest';
import kycService from '../kyc';
import api from '../../lib/axios';

vi.mock('../../lib/axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('kycService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('startSession', () => {
        it('should start session successfully', async () => {
            const mockResult = { sessionId: 'session123' };
            api.post.mockResolvedValueOnce({ data: mockResult });

            const result = await kycService.startSession();

            expect(api.post).toHaveBeenCalledWith('/api/v1/kyc/sessions:start');
            expect(result).toEqual(mockResult);
        });
    });

    describe('fullFlowUpload', () => {
        it('should upload with form data', async () => {
            const mockResult = { success: true };
            api.post.mockResolvedValueOnce({ data: mockResult });

            const mockFile = new File([''], 'test.jpg');
            const result = await kycService.fullFlowUpload({
                sessionId: 's1',
                file: mockFile,
                title: 'Title',
                description: 'Desc',
            });

            expect(api.post).toHaveBeenCalledWith(
                '/api/v1/kyc/sessions/s1/fullFlow-upload',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('compare', () => {
        it('should call compare endpoint', async () => {
            api.post.mockResolvedValueOnce({ data: { match: true } });
            const result = await kycService.compare('s1');
            expect(api.post).toHaveBeenCalledWith('/api/v1/kyc/sessions/s1/compare');
            expect(result.match).toBe(true);
        });
    });
});
