import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

/**
 * ProtectedRoute component to protect routes based on authentication and role
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if access is granted
 * @param {string[]} props.allowedRoles - Array of allowed roles (e.g., ['BUSINESS', 'ADMIN'])
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
export default function ProtectedRoute({ children, allowedRoles = [], requireAuth = true }) {
  const { isAuthenticated, user } = useAuthStore()

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase()
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect based on role
      if (userRole === 'CUSTOMER') {
        // Customer cannot access BUSINESS/ADMIN pages
        return <Navigate to="/" replace />
      } else {
        // Other roles go to home
        return <Navigate to="/" replace />
      }
    }
  }

  return children
}
