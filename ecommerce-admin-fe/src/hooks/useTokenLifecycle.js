import { useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { isTokenExpired, getTokenRemainingTime } from '../lib/jwt'
import { getAccessToken, getRefreshToken } from '../lib/auth'
import { handleCleanLogoutAndRedirect } from '../api/axiosClient'

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function useTokenLifecycle() {
    const { token, isAuthenticated, setTokens } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated) return

        const checkAndRefresh = async () => {
            const currentToken = getAccessToken() || token
            const refreshToken = getRefreshToken()

            // 1. Nếu cả access token và refresh token đều đã hết hạn -> Logout ngay
            if (isTokenExpired(currentToken, 0) && (!refreshToken || isTokenExpired(refreshToken, 0))) {
                console.warn('[AdminTokenLifecycle] Access token and refresh token expired.')
                handleCleanLogoutAndRedirect()
                return
            }

            // 2. Nếu access token đã hết hạn HOẶC sắp hết hạn trong 2 phút (<= 120s), và refresh token còn hạn -> Chủ động refresh
            const remaining = getTokenRemainingTime(currentToken)
            const shouldRefresh =
                (isTokenExpired(currentToken, 0) || (remaining > 0 && remaining <= 120)) &&
                refreshToken &&
                !isTokenExpired(refreshToken, 0)

            if (shouldRefresh) {
                try {
                    const res = await axios.post(`${baseURL}/api/v1/auth/refresh-token`, { refreshToken })
                    if (res.data?.token) {
                        setTokens(res.data.token, res.data.refreshToken)
                    }
                } catch (e) {
                    console.warn('[AdminTokenLifecycle] Background auto-refresh failed:', e)
                    if (e.response && (e.response.status === 400 || e.response.status === 401)) {
                        handleCleanLogoutAndRedirect()
                    }
                }
            }
        }

        // Kiểm tra ngay khi mount / focus tab
        checkAndRefresh()

        const interval = setInterval(checkAndRefresh, 45000)
        window.addEventListener('focus', checkAndRefresh)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', checkAndRefresh)
        }
    }, [isAuthenticated, token, setTokens])
}
