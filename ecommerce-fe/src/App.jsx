import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Products from './pages/products/Products'
import ProductDetail from './pages/product-detail/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Cart from './pages/Cart'
import SellerRegister from './pages/SellerRegister'
import Kyc from './pages/kyc/Kyc'
import Profile from './pages/Profile'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import AdminRequestDetail from './pages/admin/AdminRequestDetail'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'
import AdminEscrows from './pages/admin/AdminEscrows'
import AdminWalletLookup from './pages/admin/AdminWalletLookup'
import AdminCommissions from './pages/admin/AdminCommissions'
import AdminLiveChat from './pages/admin/AdminLiveChat'
import AdminShopRanking from './pages/admin/AdminShopRanking'
import AdminPlatformWallet from './pages/admin/AdminPlatformWallet'
import BusinessLayout from './pages/business/BusinessLayout'
import BusinessDashboard from './pages/business/BusinessDashboard'
import Checkout from './pages/Checkout'
import PaymentResult from './pages/PaymentResult'
import ShopOrders from './pages/business/ShopOrders'
import ShopOrderDetail from './pages/business/ShopOrderDetail'
import MyOrders from './pages/orders/MyOrders'
import OrderDetail from './pages/orders/OrderDetail'
import Deals from './pages/Deals'
import Marketplace from './pages/Marketplace'
import ReportCreate from './pages/ReportCreate'
import ProfileWallet from './pages/profile/ProfileWallet'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute requireAuth={true}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requireAuth={true}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/vnpay_return"
          element={
            <ProtectedRoute requireAuth={true}>
              <PaymentResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute requireAuth={true}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/wallet"
          element={
            <ProtectedRoute requireAuth={true}>
              <ProfileWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requireAuth={true}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute requireAuth={true}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/register"
          element={
            <ProtectedRoute requireAuth={true}>
              <SellerRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute requireAuth={true}>
              <Kyc />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute requireAuth={true}>
              <ReportCreate />
            </ProtectedRoute>
          }
        />

        {/* Business routes - require BUSINESS role */}
        <Route
          path="/business"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['BUSINESS']}>
              <BusinessLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<BusinessDashboard />} />
          <Route path="orders" element={<ShopOrders />} />
          <Route path="orders/:orderId" element={<ShopOrderDetail />} />
        </Route>

        {/* Admin routes - require ADMIN role only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:requestId" element={<AdminRequestDetail />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="escrows" element={<AdminEscrows />} />
          <Route path="wallets" element={<AdminWalletLookup />} />
          <Route path="commissions" element={<AdminCommissions />} />
          <Route path="live-chat" element={<AdminLiveChat />} />
          <Route path="shop-ranking" element={<AdminShopRanking />} />
          <Route path="platform-wallet" element={<AdminPlatformWallet />} />
        </Route>
      </Route>
    </Routes >
  )
}
