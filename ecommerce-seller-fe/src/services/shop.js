import axiosClient from '../api/axiosClient'

const SHOP_BASE = '/api/v1/shop'

const mapShopProfile = (s) => {
  if (!s) return null
  return {
    id: s.id,
    name: s.name,
    description: s.description || '',
    sellerName: s.businessName || s.name,
    logo: s.logoUrl || '/shop-placeholder.svg',
    cover: s.coverImageUrl || '/shop-cover-placeholder.svg',
    phoneNumber: s.phoneNumber || '',
    address: s.address || '',
    location: s.address || 'Việt Nam',
    city: s.address?.includes('Hồ Chí Minh')
      ? 'Hồ Chí Minh'
      : s.address?.includes('Đà Nẵng')
        ? 'Đà Nẵng'
        : s.address?.includes('Hà Nội')
          ? 'Hà Nội'
          : 'Toàn quốc',
    rating:
      s.averageRating !== undefined && s.averageRating !== null
        ? Number(s.averageRating).toFixed(1)
        : null,
    reviewCount: s.reviewCount || 0,
    productCount: s.productCount || 0,
    responseRate: s.responseRate || '100%',
    responseTime: 'trong vài phút',
    createdAt: s.createdAt,
    followerCount: s.followerCount || 0,
    ekycVerified: true,
    mallBadge:
      s.sellerType === 'BUSINESS' ||
      s.name?.includes('Official') ||
      s.name?.includes('Authorised'),
    tags: ['Chính Hãng', 'Ký Quỹ Escrow', 'GHN Express'],
  }
}

const shopService = {
  // Lấy thông tin chi tiết một shop theo ID từ API backend thật
  getShopById: async (shopId) => {
    if (!shopId) return null
    try {
      const response = await axiosClient.get(`${SHOP_BASE}/${shopId}`)
      if (response.data) {
        return mapShopProfile(response.data)
      }
      return null
    } catch (err) {
      console.warn('API fetch shop failed:', err)
      return null
    }
  },

  // Lấy danh sách tất cả các shop từ API backend thật
  getAllShops: async () => {
    try {
      const response = await axiosClient.get(SHOP_BASE)
      if (Array.isArray(response.data)) {
        return response.data.map(mapShopProfile)
      }
      return []
    } catch (err) {
      console.warn('API fetch all shops failed:', err)
      return []
    }
  },

  // Lấy thông tin shop của tài khoản hiện tại kèm chỉ số sức khỏe & vi phạm
  getMyShop: async () => {
    try {
      const response = await axiosClient.get(`${SHOP_BASE}/my-shop`)
      return response.data
    } catch (err) {
      console.warn('API fetch my shop failed:', err)
      throw err
    }
  },

  // Lấy danh sách các vi phạm của Shop để thực hiện kháng cáo theo từng sự vụ
  getMyViolations: async () => {
    try {
      const response = await axiosClient.get(`${SHOP_BASE}/my-violations`)
      return response.data
    } catch (err) {
      console.warn('API fetch my violations failed:', err)
      return []
    }
  },

  updateEscrowStatus: async (payload) => {
    try {
      const response = await axiosClient.patch(`${SHOP_BASE}/my-shop/escrow-status`, payload)
      return response.data
    } catch (err) {
      throw err.response ? err.response.data : err
    }
  },
}

export default shopService
