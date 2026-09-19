import axiosClient from '../api/axiosClient'

const SHOP_BASE = '/api/v1/shop'

// Fallback shops list for offline or demo mock IDs
export const FALLBACK_SHOPS = [
  {
    id: 'shop-1',
    name: 'Apple Authorised Reseller',
    sellerName: 'Nguyễn Thành Đạt',
    category: 'Điện Tử & Công Nghệ',
    rating: 4.9,
    reviewCount: 1520,
    productCount: 35,
    responseRate: '99%',
    responseTime: 'trong vài phút',
    joinedTime: '2 năm trước',
    followerCount: '45.8k',
    location: 'Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'Hồ Chí Minh',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
    description: 'Gian hàng chính hãng phân phối ủy quyền các sản phẩm Apple: iPhone, MacBook, iPad, AirPods và phụ kiện chính hãng 100% VN/A.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Chính Hãng VN/A', 'Đổi Trả 7 Ngày', 'Freeship GHN'],
  },
  {
    id: 'shop-2',
    name: 'Trendy Fashion Studio',
    sellerName: 'Trần Thị Mai',
    category: 'Thời Trang & Phụ Kiện',
    rating: 4.8,
    reviewCount: 980,
    productCount: 42,
    responseRate: '98%',
    responseTime: 'trong 1 giờ',
    joinedTime: '1 năm trước',
    followerCount: '24.2k',
    location: 'Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    description: 'Thương hiệu thời trang giới trẻ phong cách streetwear hiện đại, tối giản và thời thượng. Cam kết chất vải cao cấp.',
    ekycVerified: true,
    mallBadge: false,
    tags: ['Shop Yêu Thích', 'Hàng Thiết Kế', 'Giao 24h'],
  },
  {
    id: 'shop-3',
    name: 'Nhã Nam Books & Stationery',
    sellerName: 'Lê Tri Thức',
    category: 'Sách & Văn Phòng Phẩm',
    rating: 4.9,
    reviewCount: 2310,
    productCount: 68,
    responseRate: '100%',
    responseTime: 'trong vài phút',
    joinedTime: '3 năm trước',
    followerCount: '68.5k',
    location: 'Trung Hòa, Quận Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1507842229451-7f01be837453?w=1200&h=400&fit=crop',
    description: 'Nhà sách phát hành các tác phẩm văn học, kinh tế, tâm lý học và dụng cụ văn phòng phẩm nhập khẩu cao cấp.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Sách Bản Quyền', 'Bọc Sách Miễn Phí', 'Giao Nhanh'],
  },
  {
    id: 'shop-4',
    name: 'Sunhouse Home Official',
    sellerName: 'Phạm Hoàng Gia',
    category: 'Nhà Cửa & Đời Sống',
    rating: 4.7,
    reviewCount: 840,
    productCount: 28,
    responseRate: '96%',
    responseTime: 'trong 2 giờ',
    joinedTime: '2 năm trước',
    followerCount: '19.4k',
    location: 'Hải Châu 1, Quận Hải Châu, Đà Nẵng',
    city: 'Đà Nẵng',
    logo: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&h=400&fit=crop',
    description: 'Thiết bị gia dụng và đồ dùng nhà bếp thông minh hàng đầu Việt Nam. Nồi chiên, máy xay, chảo chống dính chuẩn chất lượng.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Bảo Hành 12T', 'Chống Dính Kép', 'Tiết Kiệm Điện'],
  },
  {
    id: 'shop-5',
    name: 'Beauty Garden Cosmetics',
    sellerName: 'Hoàng Thảo My',
    category: 'Sức Khỏe & Sắc Đẹp',
    rating: 4.8,
    reviewCount: 1650,
    productCount: 50,
    responseRate: '98%',
    responseTime: 'trong vài phút',
    joinedTime: '1.5 năm trước',
    followerCount: '38.9k',
    location: 'Phường 5, Quận Phú Nhuận, TP. Hồ Chí Minh',
    city: 'Hồ Chí Minh',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop',
    description: 'Chuỗi cửa hàng mỹ phẩm chính hãng hàng đầu, đối tác phân phối của các thương hiệu làm đẹp uy tín Pháp, Hàn Quốc, Nhật Bản.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['100% Chính Hãng', 'Date Mới', 'Tặng Kèm Quà'],
  },
  {
    id: 'shop-6',
    name: 'Decathlon Sports Hub',
    sellerName: 'Vũ Đức Thịnh',
    category: 'Thể Thao & Dã Ngoại',
    rating: 4.9,
    reviewCount: 1220,
    productCount: 38,
    responseRate: '99%',
    responseTime: 'trong vài phút',
    joinedTime: '2 năm trước',
    followerCount: '31.2k',
    location: 'Thanh Xuân Bắc, Quận Thanh Xuân, Hà Nội',
    city: 'Hà Nội',
    logo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&h=300&fit=crop',
    cover: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&h=400&fit=crop',
    description: 'Thương hiệu bán lẻ dụng cụ và trang phục thể thao đa môn: chạy bộ, bơi lội, yoga, gym, cầu lông, cắm trại dã ngoại.',
    ekycVerified: true,
    mallBadge: true,
    tags: ['Đổi Trả 30 Ngày', 'Độ Bền Cao', 'Chính Hãng'],
  },
]

const shopService = {
  // Lấy thông tin chi tiết một shop theo ID hoặc fallback
  getShopById: async (shopId) => {
    try {
      if (shopId && shopId.length > 20) {
        // UUID format
        const response = await axiosClient.get(`${SHOP_BASE}/${shopId}`)
        if (response.data) {
          const s = response.data
          return {
            id: s.id,
            name: s.name,
            description: s.description,
            logo: s.logoUrl || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop',
            cover: s.coverImageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
            phoneNumber: s.phoneNumber,
            location: s.address || 'Hà Nội / TP.HCM',
            city: s.address?.includes('Hồ Chí Minh') ? 'Hồ Chí Minh' : s.address?.includes('Đà Nẵng') ? 'Đà Nẵng' : 'Hà Nội',
            rating: s.averageRating !== undefined && s.averageRating !== null ? Number(s.averageRating).toFixed(1) : null,
            reviewCount: s.reviewCount !== undefined && s.reviewCount !== null ? Number(s.reviewCount) : 0,
            productCount: s.productCount !== undefined && s.productCount !== null ? Number(s.productCount) : 0,
            responseRate: s.responseRate || '100%',
            responseTime: 'trong vài phút',
            createdAt: s.createdAt,
            followerCount: s.followerCount !== undefined && s.followerCount !== null ? Number(s.followerCount) : 0,
            ekycVerified: true,
            mallBadge: s.sellerType === 'BUSINESS' || s.name?.includes('Official') || s.name?.includes('Authorised'),
            tags: ['Chính Hãng', 'Ký Quỹ Escrow', 'GHN Express'],
          }
        }
      } else {
        // If non-UUID passed (like 'shop-1' or 'apple'), attempt to find real shop from backend
        try {
          const allRes = await axiosClient.get(SHOP_BASE)
          if (Array.isArray(allRes.data) && allRes.data.length > 0) {
            // Find shop matching index or name
            const mockShop = FALLBACK_SHOPS.find(
              (fs) => String(fs.id).toLowerCase() === String(shopId).toLowerCase()
            )
            const searchKeyword = mockShop ? mockShop.name.toLowerCase() : String(shopId).toLowerCase()
            const realShop = allRes.data.find((s) => s.name?.toLowerCase().includes(searchKeyword)) || allRes.data[0]
            if (realShop) {
              return {
                id: realShop.id,
                name: realShop.name,
                description: realShop.description,
                logo: realShop.logoUrl || 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop',
                cover: realShop.coverImageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop',
                phoneNumber: realShop.phoneNumber,
                location: realShop.address || 'Hà Nội / TP.HCM',
                city: realShop.address?.includes('Hồ Chí Minh') ? 'Hồ Chí Minh' : realShop.address?.includes('Đà Nẵng') ? 'Đà Nẵng' : 'Hà Nội',
                rating: realShop.averageRating !== undefined && realShop.averageRating !== null ? Number(realShop.averageRating).toFixed(1) : null,
                reviewCount: realShop.reviewCount !== undefined && realShop.reviewCount !== null ? Number(realShop.reviewCount) : 0,
                productCount: realShop.productCount !== undefined && realShop.productCount !== null ? Number(realShop.productCount) : 0,
                responseRate: realShop.responseRate || '100%',
                responseTime: 'trong vài phút',
                createdAt: realShop.createdAt,
                followerCount: realShop.followerCount !== undefined && realShop.followerCount !== null ? Number(realShop.followerCount) : 0,
                ekycVerified: true,
                mallBadge: realShop.sellerType === 'BUSINESS' || realShop.name?.includes('Official') || realShop.name?.includes('Authorised'),
                tags: ['Chính Hãng', 'Ký Quỹ Escrow', 'GHN Express'],
              }
            }
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.warn('API fetch shop failed, falling back to mock shops', err)
    }

    // Match by ID or Name from fallback list
    const found = FALLBACK_SHOPS.find(
      (s) => String(s.id).toLowerCase() === String(shopId).toLowerCase() ||
             String(s.name).toLowerCase().includes(String(shopId).toLowerCase())
    )

    return found || FALLBACK_SHOPS[0]
  },

  // Lấy danh sách tất cả các shop từ API thật
  getAllShops: async () => {
    try {
      const response = await axiosClient.get(SHOP_BASE)
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((s, idx) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          sellerName: s.businessName || s.name,
          category: s.name?.includes('Fashion') ? 'Thời Trang & Phụ Kiện' : s.name?.includes('Book') ? 'Sách & Văn Phòng Phẩm' : s.name?.includes('Sunhouse') ? 'Nhà Cửa & Đời Sống' : s.name?.includes('Beauty') ? 'Sức Khỏe & Sắc Đẹp' : s.name?.includes('Decathlon') ? 'Thể Thao & Dã Ngoại' : 'Điện Tử & Công Nghệ',
          logo: s.logoUrl || FALLBACK_SHOPS[idx % FALLBACK_SHOPS.length].logo,
          cover: s.coverImageUrl || FALLBACK_SHOPS[idx % FALLBACK_SHOPS.length].cover,
          location: s.address || 'Việt Nam',
          city: s.address?.includes('Hồ Chí Minh') ? 'Hồ Chí Minh' : s.address?.includes('Đà Nẵng') ? 'Đà Nẵng' : 'Hà Nội',
          rating: s.averageRating !== undefined && s.averageRating !== null ? Number(s.averageRating).toFixed(1) : null,
          reviewCount: s.reviewCount !== undefined && s.reviewCount !== null ? Number(s.reviewCount) : 0,
          productCount: s.productCount !== undefined && s.productCount !== null ? Number(s.productCount) : 0,
          followerCount: s.followerCount !== undefined && s.followerCount !== null ? Number(s.followerCount) : 0,
          responseRate: s.responseRate || '100%',
          createdAt: s.createdAt,
          ekycVerified: true,
          mallBadge: s.sellerType === 'BUSINESS',
          tags: ['Chính Hãng', 'Freeship GHN', 'Escrow Safe'],
        }))
      }
    } catch (err) {
      console.warn('API fetch all shops failed, returning fallback', err)
    }
    return FALLBACK_SHOPS
  },
}

export default shopService
