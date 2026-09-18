import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { decodeJWT, getAccountVerified } from '../lib/jwt'
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
                    role: user?.role || decoded?.role,
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

            logout: () => {
                closeWebSocketConnection()
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
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated, accountVerified: state.accountVerified }), // persist these fields
        },
    ),
)
