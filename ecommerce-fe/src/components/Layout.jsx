import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import ThemeSync from './ThemeSync'
import Navbar from './Navbar'
import ChatbotButton from './ChatbotButton'
import { useAuthStore } from '../store/useAuthStore'
import authService from '../services/auth'

export default function Layout() {
  const { isAuthenticated, user, updateUser } = useAuthStore()

  // Background sync user profile once on app mount/reload if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      authService
        .getUserProfile()
        .then((profile) => {
          if (profile) {
            updateUser({
              fullName: profile.fullName,
              name: profile.fullName,
              avatarUrl: profile.avatarUrl,
              phoneNumber: profile.phoneNumber,
              gender: profile.gender,
              dateOfBirth: profile.dateOfBirth,
              email: profile.email || user?.email,
              role: profile.role || user?.role,
              shopId: profile.shopId,
            })
          }
        })
        .catch((err) => {
          console.warn('Background profile sync error:', err)
        })
    }
  }, [isAuthenticated, updateUser])

  return (
    <>
      <ThemeSync />
      <Navbar />
      <Outlet />
      <ChatbotButton />
    </>
  )
}
