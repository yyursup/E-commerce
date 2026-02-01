import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (token, user) => {
                localStorage.setItem('token', token)
                set({
                    token,
                    user,
                    isAuthenticated: true,
                })
            },

            logout: () => {
                localStorage.removeItem('token')
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                })
            },
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }), // persist these fields
        },
    ),
)
