import api from '../lib/axios';
import axiosClient from '../api/axiosClient';

const authService = {
    register: async (data) => {
        try {
            // Backend expects: username, password, email, phoneNumber
            const response = await api.post('/api/v1/auth/register', {
                username: data.username,
                email: data.email,
                password: data.password,
                phoneNumber: data.phoneNumber,
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Login using username
    login: async (credentials) => {
        try {
            // Backend expects 'username' and 'password'
            const response = await api.post('/api/v1/auth/login', {
                username: credentials.username,
                password: credentials.password
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    verify: async (data) => {
        try {
            const response = await api.post('/api/v1/auth/verify', {
                email: data.email,
                otp: data.otp
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Get all users (ADMIN only)
    getAllUsers: async () => {
        try {
            const response = await axiosClient.get('/api/v1/auth/users');
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Update profile: fullName, phoneNumber, gender, dateOfBirth, avatarFile (optional)
    updateProfile: async ({ fullName, phoneNumber, gender, dateOfBirth, avatarFile }) => {
        const formData = new FormData();
        if (fullName) formData.append('fullName', fullName);
        if (phoneNumber) formData.append('phoneNumber', phoneNumber);
        if (gender) formData.append('gender', gender);
        if (dateOfBirth) formData.append('dateOfBirth', dateOfBirth);
        if (avatarFile) formData.append('avatarFile', avatarFile);

        try {
            const response = await axiosClient.put('/api/v1/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data; // UserProfileResponse: { id, fullName, avatarUrl, phoneNumber, gender, dateOfBirth }
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default authService;
