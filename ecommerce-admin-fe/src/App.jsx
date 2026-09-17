import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import AdminRequestDetail from './pages/admin/AdminRequestDetail'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminEscrows from './pages/admin/AdminEscrows'
import AdminWalletLookup from './pages/admin/AdminWalletLookup'
import AdminPlatformWallet from './pages/admin/AdminPlatformWallet'
import AdminShopRanking from './pages/admin/AdminShopRanking'
import AdminCommissions from './pages/admin/AdminCommissions'
import AdminReports from './pages/admin/AdminReports'
import AdminLiveChat from './pages/admin/AdminLiveChat'
import AdminVouchers from './pages/admin/AdminVouchers'

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
        <Route path="/requests" element={<AdminRequests />} />
        <Route path="/requests/:requestId" element={<AdminRequestDetail />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="/vouchers" element={<AdminVouchers />} />
        <Route path="/escrows" element={<AdminEscrows />} />
        <Route path="/wallets" element={<AdminWalletLookup />} />
        <Route path="/platform-wallet" element={<AdminPlatformWallet />} />
        <Route path="/shop-ranking" element={<AdminShopRanking />} />
        <Route path="/commissions" element={<AdminCommissions />} />
        <Route path="/reports" element={<AdminReports />} />
        <Route path="/live-chat" element={<AdminLiveChat />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
