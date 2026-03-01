import axiosClient from '../api/axiosClient';

const REPLY_BASE = '/api/v1/reply';

const replyService = {
    // Seller/Admin: Reply to a review
    replyToReview: async (reviewId, reply) => {
        try {
            const response = await axiosClient.post(`${REPLY_BASE}/reviews/reply`, {
                reviewId,
                reply
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Seller/Admin: Update a reply
    updateReply: async (reviewId, reply) => {
        try {
            const response = await axiosClient.put(`${REPLY_BASE}/reviews/update`, {
                reviewId,
                reply
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default replyService;
