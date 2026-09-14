import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Products from './pages/products/Products'
import ProductDetail from './pages/product-detail/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Cart from './pages/Cart'
import Kyc from './pages/kyc/Kyc'
import Profile from './pages/Profile'
import Checkout from './pages/Checkout'
import PaymentResult from './pages/PaymentResult'
import MyOrders from './pages/orders/MyOrders'
import OrderDetail from './pages/orders/OrderDetail'
import Deals from './pages/Deals'
import Marketplace from './pages/Marketplace'
import ShopProfile from './pages/ShopProfile'
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
        <Route path="/shop/:shopId" element={<ShopProfile />} />
        <Route path="/shops/:shopId" element={<ShopProfile />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />

        {/* Redirect seller register to Seller Portal */}
        <Route
          path="/seller/register"
          element={<Navigate to="http://localhost:3001/register" replace />}
        />

        {/* Protected routes - require CUSTOMER authentication */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/vnpay_return"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <PaymentResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/wallet"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <ProfileWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <Kyc />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute requireAuth={true} allowedRoles={['CUSTOMER']}>
              <ReportCreate />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
