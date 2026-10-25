import axios from 'axios'
import toast from 'react-hot-toast'
import { getAccessToken, getRefreshToken, clearAccessToken } from '../lib/auth'
import { useAuthStore } from '../store/useAuthStore'

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const axiosClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mutex / Queue state for handling concurrent 401 refresh calls
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

export function handleCleanLogoutAndRedirect(customMessage = null, redirectUrl = '/login') {
    useAuthStore.getState().logout()
    clearAccessToken()

    const currentPath = window.location.pathname
    const isAuthPage =
        currentPath.includes('/login') ||
        currentPath.includes('/register') ||
        currentPath.includes('/verify') ||
        currentPath.includes('/forgot-password')

    if (!isAuthPage && !window.__isRedirectingToLogin) {
        window.__isRedirectingToLogin = true
        try {
            toast.error(
                customMessage || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                { id: customMessage ? 'account-locked-redirect' : 'session-expired', duration: 4000 }
            )
        } catch (e) {}
        setTimeout(() => {
            window.__isRedirectingToLogin = false
            window.location.href = redirectUrl
        }, 400)
    }
}

// Request Interceptor: Attach bearer token
axiosClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response Interceptor: Handle 401 & Token Refresh
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Xử lý tài khoản bị khóa vĩnh viễn hoặc vô hiệu hóa trong khi đang có phiên đăng nhập cũ
        const currentPath = window.location.pathname
        const isAlreadyInBanReview =
            currentPath.includes('/banned') && useAuthStore.getState().user?.role === 'ROLE_BAN_REVIEW'

        const errorMessage = String(error.response?.data?.message || '').toLowerCase()
        const isAccountLocked =
            error.response &&
            error.response.status === 403 &&
            (errorMessage.includes('khóa') ||
                errorMessage.includes('vô hiệu hóa') ||
                errorMessage.includes('locked') ||
                errorMessage.includes('disabled') ||
                errorMessage.includes('ngừng hoạt động'))

        if (isAccountLocked && !isAlreadyInBanReview) {
            const lockMessage =
                error.response?.data?.message ||
                'Tài khoản của bạn đã bị khóa. Vui lòng đăng nhập lại để xem xét kỷ luật.'
            handleCleanLogoutAndRedirect(lockMessage, '/login')
            return Promise.reject(error)
        }

        // Check if error is 401 (or 403 when token invalid/expired)
        const isUnauthorized =
            error.response &&
            (error.response.status === 401 ||
                (error.response.status === 403 &&
                    (error.response.data?.message?.toLowerCase().includes('token') ||
                        error.response.data?.message?.toLowerCase().includes('hết hạn'))))

        if (isUnauthorized && originalRequest) {
            const requestUrl = originalRequest.url || ''
            const isAuthEndpoint =
                requestUrl.includes('/auth/login') ||
                requestUrl.includes('/auth/refresh-token') ||
                requestUrl.includes('/auth/register') ||
                requestUrl.includes('/auth/verify')

            // If it's a login/refresh request itself, do not attempt to refresh
            if (isAuthEndpoint) {
                return Promise.reject(error)
            }

            // If already retried this request once, stop and logout
            if (originalRequest._retry) {
                handleCleanLogoutAndRedirect()
                return Promise.reject(error)
            }

            const token = getAccessToken()
            const refreshToken = getRefreshToken()
            const isUserLoggedIn = Boolean(token || useAuthStore.getState().isAuthenticated)

            if (!refreshToken) {
                if (isUserLoggedIn) {
                    handleCleanLogoutAndRedirect()
                }
                return Promise.reject(error)
            }

            // If another request is currently refreshing the token, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((newAccessToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                        return axiosClient(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshResponse = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, {
                    refreshToken,
                })
                const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data
                if (newAccessToken) {
                    useAuthStore.getState().setTokens(newAccessToken, newRefreshToken)
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    processQueue(null, newAccessToken)
                    return axiosClient(originalRequest)
                } else {
                    throw new Error('Refresh response missing access token')
                }
            } catch (refreshErr) {
                console.warn('[AxiosClient] Token refresh failed:', refreshErr)
                processQueue(refreshErr, null)
                handleCleanLogoutAndRedirect()
                return Promise.reject(refreshErr)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default axiosClient
