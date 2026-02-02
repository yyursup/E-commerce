import axiosClient from '../api/axiosClient';

export const authService = {
    login: async (email, password) => {
        // Adjust endpoint as needed based on actual backend
        const response = await axiosClient.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (data) => {
        const response = await axiosClient.post('/auth/register', data);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await axiosClient.get('/users/me');
        return response.data;
    },
};
