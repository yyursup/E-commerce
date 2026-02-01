import api from '../lib/axios';

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
        // Backend expects 'username' and 'password'
        const response = await api.post('/api/v1/auth/login', {
            username: credentials.username,
            password: credentials.password
        });
        return response.data;
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
    }
};

export default authService;
