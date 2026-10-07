import { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlinePhotograph, HiOutlineSearch, HiOutlineTag, HiOutlinePlus, HiOutlineCheck } from 'react-icons/hi';
import sellerService from '../../services/seller';
import liveStreamService from '../../services/liveStreamService';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../lib/cn';

export default function CreateLiveModal({ isOpen, onClose, onSuccess }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Products from shop
  const [shopProducts, setShopProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Selected products for live: { [productId]: { selected: boolean, livePrice: string } }
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadShopProducts();
    }
  }, [isOpen]);

  const loadShopProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await sellerService.getProductsByShop('PUBLISHED');
      const list = Array.isArray(data) ? data : [];
      setShopProducts(list);
    } catch (err) {
      console.error('Error loading shop products for live:', err);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoadingProducts(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelectProduct = (product) => {
    setSelectedProducts((prev) => {
      const existing = prev[product.id];
      if (existing?.selected) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      } else {
        return {
          ...prev,
          [product.id]: {
            selected: true,
            livePrice: product.basePrice || 0,
            product,
          },
        };
      }
    });
  };

  const handlePriceChange = (productId, price) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        livePrice: price,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề phiên livestream');
      return;
    }

    try {
      setLoading(true);
      const productList = Object.entries(selectedProducts).map(([id, item]) => ({
        productId: id,
        livePrice: item.livePrice ? parseFloat(item.livePrice) : null,
      }));

      const payload = {
        title: title.trim(),
        description: description.trim(),
        coverImageUrl: coverImageUrl.trim() || null,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : null,
        products: productList,
      };

      const newStream = await liveStreamService.createLiveStream(payload);
      toast.success('Tạo phiên Livestream thành công!');
      onSuccess(newStream);
      onClose();
    } catch (err) {
      console.error('Create livestream error:', err);
      toast.error(err?.message || 'Tạo phiên livestream thất bại');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = shopProducts.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedCount = Object.keys(selectedProducts).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className={cn(
          'w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden',
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              Tạo phiên Livestream bán hàng
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Thiết lập thông tin phòng phát sóng và chọn sản phẩm trợ giá trong phiên live
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Tiêu đề Livestream <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: SIÊU SALE CUỐI TUẦN - GIẢM ĐẾN 50% TẤT CẢ SẢN PHẨM"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors',
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Mô tả giới thiệu</label>
            <textarea
              rows={3}
              placeholder="Nhập nội dung chia sẻ, voucher độc quyền, quà tặng minigame..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors',
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              )}
            />
          </div>

          {/* Cover & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                <HiOutlinePhotograph className="w-4 h-4 text-rose-500" />
                Ảnh bìa Livestream (URL)
              </label>
              <input
                type="url"
                placeholder="https://example.com/banner-live.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors',
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Thời gian dự kiến (Tùy chọn)</label>
              <input
                type="datetime-local"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
                className={cn(
                  'w-full px-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors',
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                )}
              />
            </div>
          </div>

          {/* Product selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <HiOutlineTag className="w-4 h-4 text-rose-500" />
                Chọn sản phẩm ghim bán trong phiên Live ({selectedCount} đã chọn)
              </label>
            </div>

            {/* Search filter for products */}
            <div className="relative mb-3">
              <HiOutlineSearch className="absolute left-3 top-3 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm trong gian hàng..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors',
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                )}
              />
            </div>

            {/* Products list */}
            <div
              className={cn(
                'max-h-60 overflow-y-auto rounded-xl border p-2 divide-y divide-zinc-100 dark:divide-zinc-800',
                isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              )}
            >
              {loadingProducts ? (
                <div className="py-8 text-center text-sm text-zinc-400">Đang tải sản phẩm...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-400">Không tìm thấy sản phẩm phù hợp</div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = !!selectedProducts[p.id]?.selected;
                  const item = selectedProducts[p.id];
                  const img = p.images?.[0]?.imageUrl || 'https://placehold.co/100x100?text=SP';

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'p-2.5 flex items-center justify-between gap-3 rounded-lg transition-colors',
                        isSelected
                          ? isDark
                            ? 'bg-rose-950/30'
                            : 'bg-rose-50'
                          : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectProduct(p)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-zinc-400 cursor-pointer"
                        />
                        <img
                          src={img}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-xs text-zinc-500">
                            Giá gốc:{' '}
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                                p.basePrice || 0
                              )}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Live Price input if selected */}
                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-rose-500 font-semibold">Giá Live:</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Giá Live"
                            value={item.livePrice}
                            onChange={(e) => handlePriceChange(p.id, e.target.value)}
                            className={cn(
                              'w-28 px-2 py-1 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold',
                              isDark ? 'bg-zinc-800 border-zinc-700 text-rose-400' : 'bg-white border-zinc-300 text-rose-600'
                            )}
                          />
                          <span className="text-xs text-zinc-400">₫</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Đang tạo phòng...' : 'Hoàn tất & Tạo phòng Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
