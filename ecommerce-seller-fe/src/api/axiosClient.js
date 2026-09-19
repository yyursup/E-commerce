import axios from 'axios'
import { getAccessToken, getRefreshToken, clearAccessToken } from '../lib/auth'
import { useAuthStore } from '../store/useAuthStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const axiosClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add token to requests
axiosClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle responses and 401 refresh/redirect
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401) {
            const requestUrl = originalRequest?.url || '';
            const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh-token');

            // Do not retry refresh for login or refresh-token calls
            if (!isAuthEndpoint && originalRequest && !originalRequest._retry) {
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    originalRequest._retry = true;
                    try {
                        const refreshResponse = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
                            refreshToken,
                        });
                        const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
                        if (newAccessToken) {
                            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return axiosClient(originalRequest);
                        }
                    } catch (refreshErr) {
                        console.warn('Auto refresh token failed in seller axiosClient:', refreshErr);
                    }
                }
            }

            // If refresh not possible or failed, logout cleanly and redirect
            if (!isAuthEndpoint) {
                useAuthStore.getState().logout();
                clearAccessToken();

                const currentPath = window.location.pathname;
                const isAuthPage = currentPath.includes('/login') || currentPath.includes('/register') || currentPath.includes('/verify') || currentPath.includes('/seller-register');
                if (!isAuthPage && !window.__isRedirectingToLogin) {
                    window.__isRedirectingToLogin = true;
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 100);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
