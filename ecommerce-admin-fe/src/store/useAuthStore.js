import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { decodeJWT, getAccountVerified, isTokenExpired } from '../lib/jwt'
import { setAccessToken, setRefreshToken, clearAccessToken } from '../lib/auth'
import { closeWebSocketConnection } from '../services/websocketService'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            accountVerified: false,

            login: (token, user, refreshToken = null) => {
                setAccessToken(token)
                if (refreshToken) {
                    setRefreshToken(refreshToken)
                }
                const decoded = decodeJWT(token)
                const accountVerified = getAccountVerified(token)
                const enrichedUser = {
                    ...user,
                    id: decoded?.accountId || user?.id,
                    accountId: decoded?.accountId || user?.accountId,
                    username: decoded?.sub || user?.username,
                    role: decoded?.role || user?.role,
                    accountVerified,
                }
                set({
                    token,
                    refreshToken: refreshToken || null,
                    user: enrichedUser,
                    isAuthenticated: true,
                    accountVerified,
                })
            },

            setTokens: (token, refreshToken = null) => {
                setAccessToken(token)
                if (refreshToken) {
                    setRefreshToken(refreshToken)
                }
                set((state) => ({
                    token,
                    refreshToken: refreshToken || state.refreshToken,
                    isAuthenticated: Boolean(token),
                }))
            },

            updateUser: (updatedFields) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedFields } : null,
                }))
            },

            updateAccountVerified: (value) => {
                set((state) => ({
                    accountVerified: value,
                    user: state.user ? { ...state.user, accountVerified: value } : null,
                }))
            },

            checkTokenExpiration: () => {
                const { token, refreshToken, logout } = get()
                if (token && isTokenExpired(token, 0)) {
                    if (!refreshToken || isTokenExpired(refreshToken, 0)) {
                        logout()
                        return false
                    }
                }
                return true
            },

            logout: () => {
                try {
                    closeWebSocketConnection()
                } catch (e) {}
                clearAccessToken()
                set({
                    token: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                    accountVerified: false,
                })
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                accountVerified: state.accountVerified
            }),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                // Kiểm tra token khi nạp lại từ LocalStorage: nếu đã hết hạn và refresh token cũng hết hạn -> logout dọn dẹp state ngay
                if (state.token && isTokenExpired(state.token, 0)) {
                    if (!state.refreshToken || isTokenExpired(state.refreshToken, 0)) {
                        console.warn('[AuthStore] Session has expired during rehydration. Clearing auth state.')
                        state.logout()
                    }
                }
            },
        },
    ),
)
