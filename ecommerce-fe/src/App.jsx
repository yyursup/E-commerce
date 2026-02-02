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
import Kyc from './pages/Kyc'
import Profile from './pages/Profile'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import AdminRequestDetail from './pages/admin/AdminRequestDetail'
import BusinessDashboard from './pages/business/BusinessDashboard'
import Checkout from './pages/Checkout'
import PaymentResult from './pages/PaymentResult'
import MyOrders from './pages/MyOrders'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
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

        {/* Business routes - require BUSINESS or ADMIN role */}
        <Route
          path="/business/dashboard"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['BUSINESS', 'ADMIN']}>
              <BusinessDashboard />
            </ProtectedRoute>
          }
        />

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
        </Route>
      </Route>
    </Routes >
  )
}
