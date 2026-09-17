import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Products from './pages/products/Products'
import ProductDetail from './pages/product-detail/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import ForgotPassword from './pages/ForgotPassword'
import Cart from './pages/Cart'
import Kyc from './pages/kyc/Kyc'
import Profile from './pages/Profile'
import PaymentResult from './pages/PaymentResult'
import MyOrders from './pages/orders/MyOrders'
import OrderDetail from './pages/orders/OrderDetail'
import Marketplace from './pages/Marketplace'
import ShopProfile from './pages/ShopProfile'
import ReportCreate from './pages/ReportCreate'
import ProfileWallet from './pages/profile/ProfileWallet'
import Deals from './pages/deals/Deals'
import Checkout from './pages/checkout/Checkout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/shop/:shopId" element={<ShopProfile />} />
        <Route path="/shops/:shopId" element={<ShopProfile />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Redirect seller register to Seller Portal */}
        <Route
          path="/seller/register"
          element={<Navigate to="http://localhost:3001/register" replace />}
        />

        {/* Protected routes - require CUSTOMER or BUSINESS authentication */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/vnpay_return"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <PaymentResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/wallet"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <ProfileWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <Kyc />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER', 'BUSINESS']}>
              <ReportCreate />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
