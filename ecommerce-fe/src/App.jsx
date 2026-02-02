import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/kyc" element={<Kyc />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:requestId" element={<AdminRequestDetail />} />
        </Route>
      </Route>
    </Routes>
  )
}
