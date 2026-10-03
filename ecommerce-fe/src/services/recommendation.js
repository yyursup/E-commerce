import api from '../lib/axios';

const RECOMMENDATIONS_BASE = '/api/v1/recommendations';
const RECENT_VIEWS_KEY = 'tech_recent_views';

const recommendationService = {
  /**
   * Lấy danh sách ID các sản phẩm đã xem gần nhất từ LocalStorage
   */
  getRecentViewedIds: () => {
    try {
      const stored = localStorage.getItem(RECENT_VIEWS_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Ghi nhận lượt xem sản phẩm: vừa lưu LocalStorage, vừa gửi ngầm lên Backend
   */
  trackView: (productId) => {
    if (!productId) return;
    try {
      // 1. Cập nhật LocalStorage (tối đa 10 sản phẩm gần nhất)
      const current = recommendationService.getRecentViewedIds();
      const updated = [productId, ...current.filter((id) => id !== productId)].slice(0, 10);
      localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(updated));

      // 2. Gửi ngầm tới backend (không chặn UI)
      api.post(`${RECOMMENDATIONS_BASE}/track`, null, {
        params: { productId },
        withCredentials: true,
      }).catch(() => {
        // Silently ignore background tracking error
      });
    } catch (e) {
      console.warn('Failed to track product view:', e);
    }
  },

  /**
   * Lấy gợi ý cá nhân hóa cho người dùng (kết hợp Guest LocalStorage & Server History)
   */
  getPersonalized: async (limit = 8) => {
    try {
      const recentProductIds = recommendationService.getRecentViewedIds();
      const params = { limit };
      if (recentProductIds.length > 0) {
        params.recentProductIds = recentProductIds.join(',');
      }

      const response = await api.get(RECOMMENDATIONS_BASE, {
        params,
        withCredentials: true,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch personalized recommendations:', error);
      return [];
    }
  },

  /**
   * Lấy sản phẩm tương đương về cấu hình & phân khúc giá
   */
  getSimilarProducts: async (productId, limit = 8) => {
    try {
      const response = await api.get(`${RECOMMENDATIONS_BASE}/similar/${productId}`, {
        params: { limit },
        withCredentials: true,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch similar tech products:', error);
      return [];
    }
  },

  /**
   * Lấy phụ kiện công nghệ tương thích (Cross-selling)
   */
  getCompatibleAccessories: async (productId, limit = 8) => {
    try {
      const response = await api.get(`${RECOMMENDATIONS_BASE}/accessories/${productId}`, {
        params: { limit },
        withCredentials: true,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch compatible accessories:', error);
      return [];
    }
  },
};

export default recommendationService;
