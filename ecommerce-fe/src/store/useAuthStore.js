import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAccountVerified } from '../lib/jwt'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            accountVerified: false,

            login: (token, user) => {
                localStorage.setItem('token', token)
                const accountVerified = getAccountVerified(token)
                set({
                    token,
                    user: { ...user, accountVerified },
                    isAuthenticated: true,
                    accountVerified,
                })
            },

            updateAccountVerified: (value) => {
                set((state) => ({
                    accountVerified: value,
                    user: state.user ? { ...state.user, accountVerified: value } : null,
                }))
            },

            logout: () => {
                localStorage.removeItem('token')
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                    accountVerified: false,
                })
            },
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated, accountVerified: state.accountVerified }), // persist these fields
        },
    ),
)
