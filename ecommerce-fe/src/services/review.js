import axiosClient from '../api/axiosClient';

const REVIEW_BASE = '/api/v1/review';

const reviewService = {
    // Get reviews for a product
    getProductReviews: async (productId, { rating, hasImages, page = 0, size = 10 } = {}) => {
        try {
            const params = { page, size };
            if (rating !== undefined) params.rating = rating;
            if (hasImages !== undefined) params.hasImages = hasImages;

            const response = await axiosClient.get(`${REVIEW_BASE}/products/${productId}`, { params });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Create a new review (using FormData for potential image uploads)
    createReview: async (productId, reviewData) => {
        try {
            const formData = new FormData();
            Object.entries(reviewData).forEach(([key, value]) => {
                if (key === 'images' && Array.isArray(value)) {
                    value.forEach(file => formData.append('images', file));
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            const response = await axiosClient.post(
                `${REVIEW_BASE}/products/${productId}/reviews`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Update existing review
    updateReview: async (reviewId, reviewData) => {
        try {
            const formData = new FormData();
            Object.entries(reviewData).forEach(([key, value]) => {
                if (key === 'images' && Array.isArray(value)) {
                    value.forEach(file => formData.append('images', file));
                } else if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            const response = await axiosClient.put(
                `${REVIEW_BASE}/reviews/${reviewId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Delete review
    deleteReview: async (reviewId) => {
        try {
            await axiosClient.delete(`${REVIEW_BASE}/reviews/${reviewId}`);
            return true;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Get my review for a specific product and order
    getMyReview: async (productId, subOrderId) => {
        try {
            const response = await axiosClient.get(`${REVIEW_BASE}/reviews/me`, {
                params: { productId, subOrderId }
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Get review statistics for a product
    getProductReviewStats: async (productId) => {
        try {
            const response = await axiosClient.get(`${REVIEW_BASE}/products/${productId}/reviews/stats`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default reviewService;
