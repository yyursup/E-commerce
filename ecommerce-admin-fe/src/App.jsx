import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import AdminRequestDetail from './pages/admin/AdminRequestDetail'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminPlatformWallet from './pages/admin/AdminPlatformWallet'
import AdminShopRanking from './pages/admin/AdminShopRanking'
import AdminCommissions from './pages/admin/AdminCommissions'
import AdminReports from './pages/admin/AdminReports'
import AdminReportDetail from './pages/admin/AdminReportDetail'
import AdminLiveChat from './pages/admin/AdminLiveChat'
import AdminVouchers from './pages/admin/AdminVouchers'
import AdminTrustConfig from './pages/admin/AdminTrustConfig'
import AdminProductModeration from './pages/admin/AdminProductModeration'

export default function App() {
  return (
    <Routes>
      {/* Public Login Route for Admin */}
      <Route path="/login" element={<AdminLogin />} />

      {/* Protected Routes - require ROLE_ADMIN */}
      <Route
        element={
          <ProtectedRoute requireAuth={true} allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/moderation" element={<AdminProductModeration />} />
        <Route path="/requests" element={<AdminRequests />} />
        <Route path="/requests/:requestId" element={<AdminRequestDetail />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="/vouchers" element={<AdminVouchers />} />

        {/* Cụm Quản Lý Hoa Hồng (Hub 3 Tabs) */}
        <Route path="/commissions" element={<AdminCommissions />} />

        {/* Cụm Quỹ Ký Quỹ & Bậc Sao (Hub 2 Tabs) */}
        <Route path="/trust-config" element={<AdminTrustConfig />} />
        <Route path="/escrow-fund-supervision" element={<Navigate to="/trust-config?tab=funds" replace />} />

        {/* Cụm Tài Chính & Ví Sàn (Hub 3 Tabs) */}
        <Route path="/platform-wallet" element={<AdminPlatformWallet />} />
        <Route path="/escrows" element={<Navigate to="/platform-wallet?tab=escrows" replace />} />
        <Route path="/wallets" element={<Navigate to="/platform-wallet?tab=lookup" replace />} />

        {/* Xếp Hạng & Báo Cáo */}
        <Route path="/shop-ranking" element={<AdminShopRanking />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/reports/:reportId" element={<AdminReportDetail />} />

        {/* Live Chat CSKH */}
        <Route path="/live-chat" element={<AdminLiveChat />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
