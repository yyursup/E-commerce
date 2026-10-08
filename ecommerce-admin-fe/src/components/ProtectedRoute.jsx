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
    const userRole = user?.role?.toUpperCase()?.replace(/^ROLE_/, '')
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase().replace(/^ROLE_/, ''))
    
    if (!userRole || !normalizedAllowed.includes(userRole)) {
      return <Navigate to="/login" replace />
    }
  }

  return children
}
