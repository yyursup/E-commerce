import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { isTokenExpired, getTokenRemainingTime } from '../lib/jwt'
import { getRefreshToken } from '../lib/auth'
import axiosClient, { handleCleanLogoutAndRedirect } from '../api/axiosClient'

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export function useTokenLifecycle() {
    const { token, isAuthenticated, setTokens } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated || !token) return

        const checkAndRefresh = async () => {
            const remaining = getTokenRemainingTime(token)
            const refreshToken = getRefreshToken()

            // 1. Nếu token đã hết hạn hoàn toàn
            if (isTokenExpired(token, 0)) {
                if (!refreshToken || isTokenExpired(refreshToken, 0)) {
                    console.warn('[TokenLifecycle] Access token and refresh token expired.')
                    handleCleanLogoutAndRedirect()
                    return
                }
            }

            // 2. Nếu token sắp hết hạn trong vòng 2 phút (120s) -> Chủ động refresh chạy ngầm
            if (remaining > 0 && remaining <= 120 && refreshToken && !isTokenExpired(refreshToken, 0)) {
                try {
                    const res = await axiosClient.post(`${baseURL}/api/v1/auth/refresh-token`, { refreshToken })
                    if (res.data?.token) {
                        setTokens(res.data.token, res.data.refreshToken)
                    }
                } catch (e) {
                    console.warn('[TokenLifecycle] Background auto-refresh failed:', e)
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
