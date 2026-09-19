import { Routes, Route, Navigate } from 'react-router-dom'
import ThemeSync from './components/ThemeSync'
import ProtectedRoute from './components/ProtectedRoute'
import SellerLayout from './components/SellerLayout'
import SellerLanding from './pages/SellerLanding'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import SellerRegister from './pages/SellerRegister'
import PendingApproval from './pages/PendingApproval'
import BusinessDashboard from './pages/business/BusinessDashboard'
import ShopOrders from './pages/business/ShopOrders'
import ShopOrderDetail from './pages/business/ShopOrderDetail'
import ShopProducts from './pages/ShopProducts'
import ShopVouchers from './pages/business/ShopVouchers'
import ShopLiveChat from './pages/business/ShopLiveChat'
import ShopInventoryHistory from './pages/business/ShopInventoryHistory'
import ShopSettings from './pages/ShopSettings'

export default function App() {
  return (
    <>
      <ThemeSync />
      <Routes>
      {/* Public Landing & Onboarding routes */}
      <Route path="/" element={<SellerLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/seller-register" element={<SellerRegister />} />
      <Route path="/seller/register" element={<SellerRegister />} />
      <Route path="/pending" element={<PendingApproval />} />
      <Route path="/rejected" element={<PendingApproval />} />

      {/* Protected routes for Shop Owner (ROLE_BUSINESS) */}
      <Route
        element={
          <ProtectedRoute requireAuth={true} allowedRoles={['BUSINESS']}>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<BusinessDashboard />} />
        <Route path="/orders" element={<ShopOrders />} />
        <Route path="/orders/:orderId" element={<ShopOrderDetail />} />
        <Route path="/products" element={<ShopProducts />} />
        <Route path="/inventory-history" element={<ShopInventoryHistory />} />
        <Route path="/vouchers" element={<ShopVouchers />} />
        <Route path="/chat" element={<ShopLiveChat />} />
        <Route path="/settings" element={<ShopSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
