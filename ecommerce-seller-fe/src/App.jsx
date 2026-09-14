import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import SellerLayout from './components/SellerLayout'
import Login from './pages/Login'
import SellerRegister from './pages/SellerRegister'
import PendingApproval from './pages/PendingApproval'
import RejectedNotice from './pages/RejectedNotice'
import BusinessDashboard from './pages/business/BusinessDashboard'
import ShopOrders from './pages/business/ShopOrders'
import ShopOrderDetail from './pages/business/ShopOrderDetail'
import ShopProducts from './pages/ShopProducts'
import ShopSettings from './pages/ShopSettings'

export default function App() {
  return (
    <Routes>
      {/* Public / Onboarding routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SellerRegister />} />
      <Route path="/pending" element={<PendingApproval />} />
      <Route path="/rejected" element={<RejectedNotice />} />

      {/* Protected routes for Shop Owner (ROLE_BUSINESS) */}
      <Route
        element={
          <ProtectedRoute requireAuth={true} allowedRoles={['BUSINESS']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<BusinessDashboard />} />
        <Route path="/orders" element={<ShopOrders />} />
        <Route path="/orders/:orderId" element={<ShopOrderDetail />} />
        <Route path="/products" element={<ShopProducts />} />
        <Route path="/settings" element={<ShopSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
