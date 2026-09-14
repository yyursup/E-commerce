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

  // 1. If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. If roles are specified, check if user has required role
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.toUpperCase()
    const sellerStatus = user?.sellerStatus?.toUpperCase()

    // BẮT BUỘC: Tài khoản có Role BUSINESS (hoặc ADMIN) hoặc đã được duyệt APPROVED / có Shop được phép vào các trang quản trị
    if (
      userRole === 'BUSINESS' ||
      (allowedRoles.includes('ADMIN') && userRole === 'ADMIN') ||
      sellerStatus === 'APPROVED' ||
      user?.hasShop
    ) {
      return children
    }

    // Nếu tài khoản là CUSTOMER (chưa được duyệt):
    if (userRole === 'CUSTOMER') {
      if (sellerStatus === 'PENDING' || sellerStatus === 'REJECTED') {
        return <Navigate to="/pending" replace />
      }
      // Chỉ khi chưa nộp đơn mới chuyển sang form đăng ký
      return <Navigate to="/register" replace />
    }

    // Default fallback
    return <Navigate to="/" replace />
  }

  return children
}
